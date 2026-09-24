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

test("recognizes all supported reel routes", () => {
    expect(core.isReelUrl("https://www.youtube.com/shorts/abc")).toBe(true);
    expect(core.isReelUrl("https://www.instagram.com/reel/abc")).toBe(true);
    expect(core.isReelUrl("https://www.tiktok.com/@user/video/1")).toBe(true);
    expect(core.isReelUrl("https://x.com/user/status/1")).toBe(true);
    expect(core.isReelUrl("https://mobile.twitter.com/user/status/1")).toBe(true);
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
