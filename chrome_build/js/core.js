(function(root) {
    "use strict";

    function normalizeDomain(value) {
        if (typeof value !== "string") return "";
        var input = value.trim().toLowerCase();
        if (!input) return "";
        try {
            var parsed = new URL(input.includes("://") ? input : "https://" + input);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
            var domain = parsed.hostname.toLowerCase().replace(/\.$/, "");
            if (domain.startsWith("www.")) domain = domain.slice(4);
            if (["twitter.com", "mobile.twitter.com", "m.twitter.com", "mobile.x.com", "m.x.com"].includes(domain)) domain = "x.com";
            if (!domain || (!domain.includes(".") && domain !== "localhost")) return "";
            const validLabels = domain.split(".").every(function(label) {
                return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label);
            });
            return validLabels ? domain : "";
        } catch (error) {
            return "";
        }
    }

    function hostMatchesDomain(host, domain, exact) {
        var normalizedHost = normalizeDomain(host);
        var normalizedDomain = normalizeDomain(domain);
        if (!normalizedHost || !normalizedDomain) return false;
        return exact
            ? normalizedHost === normalizedDomain
            : normalizedHost === normalizedDomain || normalizedHost.endsWith("." + normalizedDomain);
    }

    function getDepthProgress(current, start, bottom) {
        var value = Number(current) || 0;
        var from = Number(start) || 0;
        var to = Number(bottom) || 0;
        if (to <= from) return value >= to ? 1 : 0;
        return Math.min(1, Math.max(0, (value - from) / (to - from)));
    }

    function getDepthScrollState(scrollTop, pageScrollRange, configuredDepth) {
        var scroll = Math.max(0, Number(scrollTop) || 0);
        var pageRange = Math.max(0, Number(pageScrollRange) || 0);
        var depth = Math.max(0, Number(configuredDepth) || 0);
        if (pageRange <= 0 || depth <= 0) {
            return { limit: 0, depth: 0, hasPageScroll: false };
        }
        var limit = Math.min(pageRange, depth);
        var virtualDepth = pageRange > depth ? Math.min(scroll, depth) : (scroll / pageRange) * depth;
        return {
            limit: limit,
            depth: Math.min(depth, Math.max(0, virtualDepth)),
            hasPageScroll: true
        };
    }

    function createFrameScheduler(render, runtime) {
        var view = runtime || (typeof window !== "undefined" ? window : null);
        var scheduled = false;
        var fallbackId = null;

        function run() {
            if (!scheduled) return;
            scheduled = false;
            if (fallbackId !== null && view && view.clearTimeout) {
                view.clearTimeout(fallbackId);
                fallbackId = null;
            }
            render();
        }

        return {
            request: function() {
                if (scheduled) return;
                scheduled = true;
                // requestAnimationFrame is not delivered while a tab is hidden or
                // occluded, so keep a timer fallback to avoid freezing the overlay.
                if (view && view.requestAnimationFrame) view.requestAnimationFrame(run);
                if (view && view.setTimeout) fallbackId = view.setTimeout(run, 120);
            },
            isScheduled: function() {
                return scheduled;
            },
            cancel: function() {
                scheduled = false;
                if (fallbackId !== null && view && view.clearTimeout) {
                    view.clearTimeout(fallbackId);
                    fallbackId = null;
                }
            }
        };
    }

    function getReInterventionDelayMs(state) {
        var s = state || {};
        if (s.hasStored) {
            var storedRemaining = Number(s.storedRemainingMs);
            if (isFinite(storedRemaining) && storedRemaining >= 0) return storedRemaining;
        }
        if (s.hasActiveCooldown) {
            var cooldown = Number(s.activeCooldownRemainingMs);
            if (isFinite(cooldown) && cooldown >= 0) return cooldown;
        }
        // Honour the duration last chosen on the timed-visit slider for this site
        // instead of silently reverting to the default interval.
        var remembered = Number(s.rememberedMinutes);
        if (isFinite(remembered) && remembered > 0) return Math.round(remembered) * 60 * 1000;
        return Math.max(1, Number(s.intervalMinutes) || 10) * 60 * 1000;
    }

    function canScrollElement(scrollTop, scrollHeight, clientHeight, direction, tolerance) {
        var top = Number(scrollTop) || 0;
        var max = Math.max(0, (Number(scrollHeight) || 0) - (Number(clientHeight) || 0));
        var epsilon = Math.max(0, Number(tolerance) || 1);
        if (direction === "down") return max - top > epsilon;
        if (direction === "up") return top > epsilon;
        return false;
    }

    function shouldBlockDepthScroll(scrollTop, pageScrollRange, configuredDepth, direction) {
        if (direction !== "down") return false;
        var state = getDepthScrollState(scrollTop, pageScrollRange, configuredDepth);
        return state.hasPageScroll && (Number(scrollTop) || 0) >= state.limit;
    }

    function isReelUrl(value) {
        try {
            var url = new URL(value);
            var path = url.pathname;
            return hostMatchesDomain(url.hostname, "youtube.com", false) && path.startsWith("/shorts/") ||
                hostMatchesDomain(url.hostname, "tiktok.com", false) ||
                hostMatchesDomain(url.hostname, "instagram.com", false) && (path.startsWith("/reel/") || path.startsWith("/reels/")) ||
                hostMatchesDomain(url.hostname, "x.com", false) && /^\/[^/]+\/status(?:es)?\/\d+/.test(path);
        } catch (error) {
            return false;
        }
    }

    function isPageActive(runtime) {
        var doc = runtime.document;
        return !doc.hidden && doc.visibilityState !== "hidden" && doc.hasFocus();
    }

    function createActiveCountdown(totalMs, onTick, onComplete, runtime) {
        var doc = runtime.document;
        var view = runtime.window;
        var clock = runtime.performance || Date;
        var remainingMs = Math.max(0, Number(totalMs) || 0);
        var running = false;
        var stopped = false;
        var lastActiveAt = 0;
        var timerId = null;
        var syncTimeoutId = null;
        var syncAttempts = 0;

        function now() {
            return clock.now();
        }

        function render() {
            onTick(Math.max(0, Math.ceil(remainingMs / 1000)), remainingMs);
        }

        function stop() {
            if (stopped) return;
            stopped = true;
            running = false;
            view.clearInterval(timerId);
            view.clearTimeout(syncTimeoutId);
            view.removeEventListener("blur", sync);
            view.removeEventListener("focus", sync);
            view.removeEventListener("pagehide", sync);
            doc.removeEventListener("visibilitychange", sync);
            doc.removeEventListener("pageshow", sync);
        }

        function tick() {
            if (!running) return;
            remainingMs = Math.max(0, remainingMs - (now() - lastActiveAt));
            lastActiveAt = now();
            render();
            if (remainingMs <= 0) {
                stop();
                onComplete();
            }
        }

        function pause() {
            if (!running) return;
            remainingMs = Math.max(0, remainingMs - (now() - lastActiveAt));
            running = false;
            view.clearInterval(timerId);
            render();
        }

        function play() {
            if (stopped || running || remainingMs <= 0 || !isPageActive(runtime)) return;
            running = true;
            lastActiveAt = now();
            timerId = view.setInterval(tick, 250);
        }

        function sync() {
            if (isPageActive(runtime)) play();
            else pause();
            if (running) syncAttempts = 0;
            if (!stopped && !running && doc.visibilityState !== "hidden" && syncAttempts < 10) {
                syncAttempts++;
                view.clearTimeout(syncTimeoutId);
                syncTimeoutId = view.setTimeout(function() {
                    syncTimeoutId = null;
                    sync();
                }, 150);
            }
        }

        view.addEventListener("blur", sync);
        view.addEventListener("focus", sync);
        view.addEventListener("pagehide", sync);
        doc.addEventListener("visibilitychange", sync);
        doc.addEventListener("pageshow", sync);
        render();
        sync();

        return {
            stop: stop,
            pause: pause,
            resume: play,
            getRemainingMs: function() {
                if (running) return Math.max(0, remainingMs - (now() - lastActiveAt));
                return remainingMs;
            }
        };
    }

    function updateReelHistory(history, current) {
        var next = history.slice();
        if (!current) return next;
        if (next[next.length - 1] === current) return next;
        if (next.length > 1 && next[next.length - 2] === current) next.pop();
        else next.push(current);
        return next;
    }

    // Reel sites only change the URL on mobile route-based feeds. On desktop the
    // active reel changes while scrolling without any navigation, so the visited
    // sequence and the current position are tracked from the active reel itself.
    function updateReelSequence(keys, currentKey) {
        var list = Array.isArray(keys) ? keys.slice() : [];
        if (!currentKey) return { keys: list, index: Math.max(0, list.length - 1) };
        var existing = list.indexOf(currentKey);
        if (existing >= 0) return { keys: list, index: existing };
        list.push(currentKey);
        return { keys: list, index: list.length - 1 };
    }

    // Brightness follows the reel currently in view, so scrolling back up to the
    // first reel restores the page instead of staying dark. `index` is 0-based but
    // depth is measured 1-based, matching the previous watched-count behaviour:
    // the final allowed reel reaches full darkness and shows the rock floor.
    function getReelDepthProgress(index, buffer, limit) {
        var position = Math.max(0, Number(index) || 0);
        var safeBuffer = Math.max(0, Number(buffer) || 0);
        var safeLimit = Math.max(1, Number(limit) || 1);
        var viewed = position + 1;
        if (viewed <= safeBuffer) return 0;
        if (safeLimit <= safeBuffer) return 1;
        return Math.min(1, (viewed - safeBuffer) / (safeLimit - safeBuffer));
    }

    function canAdvanceReel(nextIndex, limit) {
        return Math.max(0, Number(nextIndex) || 0) < Math.max(1, Number(limit) || 1);
    }

    // Reels feeds expose their media as ephemeral blob: URLs that are recreated on
    // every render, so they cannot identify a reel. Prefer a permalink, fall back to
    // the reel's position in the feed, which stays stable when scrolling back up.
    function getReelMediaKey(permalink, source, position) {
        var link = String(permalink || "").trim();
        if (link) return "link:" + link;
        var src = String(source || "").trim();
        if (src && src.indexOf("blob:") !== 0) return "src:" + src;
        return "vid:" + String(position === undefined || position === null ? 0 : position);
    }

    function getReelVideoKey(video) {
        var article = video.closest('article[data-testid="tweet"], article[role="article"]');
        if (article) {
            var statusLink = article.querySelector('a[href*="/status/"]');
            if (statusLink) {
                try {
                    return new URL(statusLink.href).pathname;
                } catch (error) {
                    return statusLink.getAttribute("href");
                }
            }
        }
        var player = video.closest('[data-testid="videoPlayer"]') || video;
        var source = player.querySelector && player.querySelector("source[src]");
        var poster = player.querySelector && player.querySelector("video[poster]");
        return video.currentSrc || video.src || (source && source.src) || (poster && poster.poster) || "";
    }

    var api = {
        normalizeDomain: normalizeDomain,
        hostMatchesDomain: hostMatchesDomain,
        getDepthProgress: getDepthProgress,
        getDepthScrollState: getDepthScrollState,
        createFrameScheduler: createFrameScheduler,
        getReInterventionDelayMs: getReInterventionDelayMs,
        canScrollElement: canScrollElement,
        shouldBlockDepthScroll: shouldBlockDepthScroll,
        isReelUrl: isReelUrl,
        isPageActive: isPageActive,
        createActiveCountdown: createActiveCountdown,
        updateReelHistory: updateReelHistory,
        updateReelSequence: updateReelSequence,
        getReelDepthProgress: getReelDepthProgress,
        canAdvanceReel: canAdvanceReel,
        getReelMediaKey: getReelMediaKey,
        getReelVideoKey: getReelVideoKey
    };

    root.AnchorCore = api;
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
