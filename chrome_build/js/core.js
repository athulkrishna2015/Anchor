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

    function isReelUrl(value) {
        try {
            var url = new URL(value);
            var path = url.pathname;
            return hostMatchesDomain(url.hostname, "youtube.com", false) && path.startsWith("/shorts/") ||
                hostMatchesDomain(url.hostname, "tiktok.com", false) ||
                hostMatchesDomain(url.hostname, "instagram.com", false) && (path.startsWith("/reel/") || path.startsWith("/reels/")) ||
                hostMatchesDomain(url.hostname, "x.com", false);
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
        isReelUrl: isReelUrl,
        isPageActive: isPageActive,
        createActiveCountdown: createActiveCountdown,
        updateReelHistory: updateReelHistory,
        getReelVideoKey: getReelVideoKey
    };

    root.AnchorCore = api;
    if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
