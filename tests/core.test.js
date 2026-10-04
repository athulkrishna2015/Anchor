const { test, expect } = require("bun:test");
const core = require("../chrome_build/js/core.js");

test("normalizes safe domains and X aliases", () => {
    expect(core.normalizeDomain("https://www.Twitter.com/home")).toBe("x.com");
    expect(core.normalizeDomain("m.instagram.com/reel/abc")).toBe("m.instagram.com");
    expect(core.normalizeDomain("com")).toBe("");
    expect(core.normalizeDomain("*.example.com")).toBe("");
    expect(core.hostMatchesDomain("m.instagram.com", "instagram.com", false)).toBe(true);
    expect(core.hostMatchesDomain("m.instagram.com", "instagram.com", true)).toBe(false);
});

test("dimming follows depth in both scroll directions", () => {
    expect(core.getDepthProgress(0, 2000, 10000)).toBe(0);
    expect(core.getDepthProgress(6000, 2000, 10000)).toBe(0.5);
    expect(core.getDepthProgress(10000, 2000, 10000)).toBe(1);
    expect(core.getDepthProgress(5000, 2000, 10000)).toBe(0.375);
    expect(core.getDepthProgress(20000, 2000, 10000)).toBe(1);
});

test("depth limit caps long pages and scales to short pages", () => {
    expect(core.getDepthScrollState(5000, 20000, 10000)).toEqual({ limit: 10000, depth: 5000, hasPageScroll: true });
    expect(core.getDepthScrollState(9000, 9000, 10000)).toEqual({ limit: 9000, depth: 10000, hasPageScroll: true });
    expect(core.getDepthScrollState(0, 0, 10000)).toEqual({ limit: 0, depth: 0, hasPageScroll: false });
    expect(core.shouldBlockDepthScroll(9999, 20000, 10000, "down")).toBe(false);
    expect(core.shouldBlockDepthScroll(10000, 20000, 10000, "down")).toBe(true);
    expect(core.shouldBlockDepthScroll(1000, 1000, 10000, "down")).toBe(true);
    expect(core.shouldBlockDepthScroll(0, 0, 10000, "down")).toBe(false);
    expect(core.shouldBlockDepthScroll(10000, 20000, 10000, "up")).toBe(false);
});

test("frame scheduler still renders when animation frames are starved", () => {
    const timeouts = [];
    const runtime = {
        requestAnimationFrame() { /* starved: hidden or occluded tab */ },
        setTimeout(callback) { timeouts.push(callback); return timeouts.length; },
        clearTimeout() {}
    };
    let renders = 0;
    const scheduler = core.createFrameScheduler(() => { renders++; }, runtime);
    scheduler.request();
    scheduler.request();
    expect(renders).toBe(0);
    expect(scheduler.isScheduled()).toBe(true);
    timeouts[0]();
    expect(renders).toBe(1);
    expect(scheduler.isScheduled()).toBe(false);
});

test("frame scheduler coalesces bursts into a single render", () => {
    const frames = [];
    const runtime = {
        requestAnimationFrame(cb) { frames.push(cb); return frames.length; },
        setTimeout() { return 0; },
        clearTimeout() {}
    };
    let renders = 0;
    const scheduler = core.createFrameScheduler(() => { renders++; }, runtime);
    for (let i = 0; i < 25; i++) scheduler.request();
    expect(frames).toHaveLength(1);
    frames[0]();
    expect(renders).toBe(1);
});

test("re-intervention honours the timed-visit slider duration", () => {
    const min = 60 * 1000;
    // in-progress visit window wins
    expect(core.getReInterventionDelayMs({ hasActiveCooldown: true, activeCooldownRemainingMs: 5 * min, intervalMinutes: 10 })).toBe(5 * min);
    // same-tab state wins over everything else
    expect(core.getReInterventionDelayMs({ hasStored: true, storedRemainingMs: 2 * min, hasActiveCooldown: true, activeCooldownRemainingMs: 9 * min, intervalMinutes: 10 })).toBe(2 * min);
    // remembered slider duration beats the default interval
    expect(core.getReInterventionDelayMs({ rememberedMinutes: 25, intervalMinutes: 10 })).toBe(25 * min);
    // falls back to the configured default
    expect(core.getReInterventionDelayMs({ intervalMinutes: 10 })).toBe(10 * min);
    expect(core.getReInterventionDelayMs({})).toBe(10 * min);
    // expired values must not produce a negative delay
    expect(core.getReInterventionDelayMs({ hasStored: true, storedRemainingMs: 0 })).toBe(0);
});

test("nested scroll containers preserve their own directional range", () => {
    expect(core.canScrollElement(20, 400, 100, "down")).toBe(true);
    expect(core.canScrollElement(300, 400, 100, "down")).toBe(false);
    expect(core.canScrollElement(20, 400, 100, "up")).toBe(true);
    expect(core.canScrollElement(0, 400, 100, "up")).toBe(false);
});

test("nested scroller hands off only when it cannot consume the gesture", () => {
    expect(core.canScrollElement(20, 400, 100, "down", 2)).toBe(true);
    expect(core.canScrollElement(299, 400, 100, "down", 2)).toBe(false);
    expect(core.canScrollElement(20, 400, 100, "up", 2)).toBe(true);
    expect(core.canScrollElement(1, 400, 100, "up", 2)).toBe(false);
});

test("scroll depth limit is independent of current scroll direction", () => {
    expect(core.shouldBlockDepthScroll(10000, 25000, 10000, "down")).toBe(true);
    expect(core.shouldBlockDepthScroll(9999, 25000, 10000, "down")).toBe(false);
    expect(core.shouldBlockDepthScroll(10000, 25000, 10000, "up")).toBe(false);
});

test("recognizes all supported reel routes", () => {
    expect(core.isReelUrl("https://www.youtube.com/shorts/abc")).toBe(true);
    expect(core.isReelUrl("https://www.instagram.com/reel/abc")).toBe(true);
    expect(core.isReelUrl("https://www.tiktok.com/@user/video/1")).toBe(true);
    expect(core.isReelUrl("https://x.com/user/status/1")).toBe(true);
    expect(core.isReelUrl("https://mobile.twitter.com/user/status/1")).toBe(true);
    expect(core.isReelUrl("https://x.com/home")).toBe(false);
    expect(core.isReelUrl("https://m.instagram.com/reel/abc")).toBe(true);
    expect(core.isReelUrl("https://m.youtube.com/shorts/abc")).toBe(true);
    expect(core.isReelUrl("https://example.com/shorts/abc")).toBe(false);
});

test("counts the initial reel and handles back navigation", () => {
    let history = [];
    history = core.updateReelHistory(history, "video-1");
    expect(history).toEqual(["video-1"]);
    history = core.updateReelHistory(history, "video-2");
    expect(history).toHaveLength(2);
    history = core.updateReelHistory(history, "video-1");
    expect(history).toEqual(["video-1"]);
    history = core.updateReelHistory(history, "video-1");
    expect(history).toEqual(["video-1"]);
});

test("reel sequence tracks position without needing URL changes", () => {
    let s = core.updateReelSequence([], "reel-1");
    expect(s).toEqual({ keys: ["reel-1"], index: 0 });

    s = core.updateReelSequence(s.keys, "reel-2");
    expect(s).toEqual({ keys: ["reel-1", "reel-2"], index: 1 });

    s = core.updateReelSequence(s.keys, "reel-3");
    expect(s.index).toBe(2);
    expect(s.keys).toHaveLength(3);

    // scrolling back up returns to an earlier reel instead of appending
    const back = core.updateReelSequence(s.keys, "reel-1");
    expect(back.keys).toHaveLength(3);
    expect(back.index).toBe(0);

    const forwardAgain = core.updateReelSequence(back.keys, "reel-3");
    expect(forwardAgain.index).toBe(2);
    expect(forwardAgain.keys).toHaveLength(3);
});

test("reel brightness follows the reel in view and restores on the way up", () => {
    const buffer = 2, limit = 10;
    expect(core.getReelDepthProgress(0, buffer, limit)).toBe(0);   // reel 1, inside buffer
    expect(core.getReelDepthProgress(1, buffer, limit)).toBe(0);   // reel 2, inside buffer
    expect(core.getReelDepthProgress(2, buffer, limit)).toBe(0.125);
    expect(core.getReelDepthProgress(5, buffer, limit)).toBe(0.5);
    expect(core.getReelDepthProgress(8, buffer, limit)).toBe(0.875);
    expect(core.getReelDepthProgress(9, buffer, limit)).toBe(1);   // final allowed reel: fully dark
    expect(core.getReelDepthProgress(12, buffer, limit)).toBe(1);
    // scrolling back up to the first reel must restore full brightness
    expect(core.getReelDepthProgress(0, buffer, limit)).toBe(0);
    expect(core.getReelDepthProgress(3, buffer, limit)).toBeLessThan(core.getReelDepthProgress(5, buffer, limit));
});

test("reel identity ignores ephemeral blob URLs", () => {
    // Instagram reels feed: blob src is recreated per render, so it must not be identity
    expect(core.getReelMediaKey("", "blob:https://www.instagram.com/1a761573-aaa", 6)).toBe("vid:6");
    expect(core.getReelMediaKey("", "blob:https://www.instagram.com/DIFFERENT", 6)).toBe("vid:6");
    // stable permalink wins when the site provides one (route-based feeds)
    expect(core.getReelMediaKey("/reel/ABC123/", "blob:https://x/1", 2)).toBe("link:/reel/ABC123/");
    // a non-blob media URL is stable enough to identify the reel
    expect(core.getReelMediaKey("", "https://cdn.example/v.mp4", 3)).toBe("src:https://cdn.example/v.mp4");
    // same feed position always yields the same key, so scrolling back up matches
    expect(core.getReelMediaKey("", "", 9)).toBe(core.getReelMediaKey("", "blob:whatever", 9));
});

test("reel mode reaches full darkness and rock at the configured limit", () => {
    const limit = 6, buffer = 1;
    expect(core.getReelDepthProgress(limit - 1, buffer, limit)).toBe(1);
    expect(core.getReelDepthProgress(limit - 2, buffer, limit)).toBeCloseTo(0.8, 5);
    expect(core.getReelDepthProgress(0, buffer, limit)).toBe(0);
});

test("reel limit blocks movement beyond the configured count", () => {
    expect(core.canAdvanceReel(9, 10)).toBe(true);
    expect(core.canAdvanceReel(10, 10)).toBe(false);
    expect(core.canAdvanceReel(11, 10)).toBe(false);
    expect(core.canAdvanceReel(0, 1)).toBe(true);
    expect(core.canAdvanceReel(1, 1)).toBe(false);
});

test("isPageActive rejects hidden documents", () => {
    const hasFocus = () => true;
    expect(core.isPageActive({
        document: { hidden: true, visibilityState: "visible", hasFocus }
    })).toBe(false);
    expect(core.isPageActive({
        document: { hidden: false, visibilityState: "hidden", hasFocus }
    })).toBe(false);
    expect(core.isPageActive({
        document: { hidden: false, visibilityState: "visible", hasFocus }
    })).toBe(true);
});

test("uses the X post status as the stable video identity", () => {
    const video = {
        currentSrc: "blob:https://x.com/one",
        src: "blob:https://x.com/one",
        closest(selector) {
            if (selector.includes("article")) return {
                querySelector() {
                    return { href: "https://x.com/user/status/123", getAttribute() { return "/user/status/123"; } };
                }
            };
            return null;
        }
    };
    expect(core.getReelVideoKey(video)).toBe("/user/status/123");
});

function fakeRuntime() {
    let now = 0;
    let active = true;
    let nextId = 1;
    const intervals = new Map();
    const timeouts = new Map();
    const windowListeners = {};
    const documentListeners = {};
    const document = {
        hidden: false,
        visibilityState: "visible",
        hasFocus: () => active,
        addEventListener(type, callback) { documentListeners[type] = callback; },
        removeEventListener(type) { delete documentListeners[type]; }
    };
    const window = {
        setInterval(callback) {
            const id = nextId++;
            intervals.set(id, callback);
            return id;
        },
        clearInterval(id) { intervals.delete(id); },
        setTimeout(callback) {
            const id = nextId++;
            timeouts.set(id, callback);
            return id;
        },
        clearTimeout(id) { timeouts.delete(id); },
        addEventListener(type, callback) { windowListeners[type] = callback; },
        removeEventListener(type) { delete windowListeners[type]; }
    };
    return {
        document,
        window,
        performance: { now: () => now },
        advance(milliseconds) {
            now += milliseconds;
            for (const callback of intervals.values()) callback();
        },
        setActive(value) { active = value; },
        dispatchWindow(type) { if (windowListeners[type]) windowListeners[type](); },
        dispatchDocument(type) { if (documentListeners[type]) documentListeners[type](); },
        get intervalCount() { return intervals.size; }
    };
}

test("breath countdown only consumes active-page time", () => {
    const runtime = fakeRuntime();
    let completed = false;
    const countdown = core.createActiveCountdown(1000, () => {}, () => { completed = true; }, runtime);
    runtime.advance(500);
    expect(Math.round(countdown.getRemainingMs())).toBe(500);
    runtime.setActive(false);
    runtime.dispatchWindow("blur");
    runtime.advance(5000);
    expect(Math.round(countdown.getRemainingMs())).toBe(500);
    expect(completed).toBe(false);
    runtime.setActive(true);
    runtime.dispatchWindow("focus");
    runtime.advance(500);
    expect(completed).toBe(true);
});

test("a hidden page never starts the breath countdown", () => {
    const runtime = fakeRuntime();
    runtime.setActive(false);
    let ticks = 0;
    const countdown = core.createActiveCountdown(1000, () => { ticks++; }, () => {}, runtime);
    runtime.advance(2000);
    expect(ticks).toBe(1);
    expect(countdown.getRemainingMs()).toBe(1000);
});
