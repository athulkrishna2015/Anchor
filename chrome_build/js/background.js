if (typeof importScripts === "function") importScripts("core.js");

const SESSION_PREFIX = "anchorBypass_";

function numberInRange(value, fallback, minimum, maximum) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, number)) : fallback;
}

function domainFromUrl(value) {
    try {
        const url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") return "";
        return AnchorCore.normalizeDomain(url.hostname);
    } catch (error) {
        return "";
    }
}

function sessionKey(tabId) {
    return SESSION_PREFIX + tabId;
}

function findMatchingDomain(host, domains, result) {
    for (const value of domains || []) {
        const domain = AnchorCore.normalizeDomain(value);
        if (!domain || !AnchorCore.hostMatchesDomain(host, domain, false)) continue;
        const settings = result["domainSettings_" + domain] || {};
        if (AnchorCore.hostMatchesDomain(host, domain, settings.scope === "exact")) return domain;
    }
    return "";
}

function findOverrideDomain(host, result) {
    const domains = Object.keys(result)
        .filter(function(key) { return key.startsWith("domainSettings_"); })
        .map(function(key) { return key.slice("domainSettings_".length); })
        .sort(function(left, right) { return right.length - left.length; });
    return findMatchingDomain(host, domains, result);
}

function isWithinSchedule(result) {
    if (result.scheduleEnabled !== true) return true;
    const days = Array.isArray(result.scheduleDays)
        ? result.scheduleDays.map(Number)
        : [1, 2, 3, 4, 5];
    const now = new Date();
    if (!days.includes(now.getDay())) return false;
    const startParts = String(result.scheduleStart || "09:00").split(":");
    const endParts = String(result.scheduleEnd || "17:00").split(":");
    const start = Number(startParts[0]) * 60 + Number(startParts[1]);
    const end = Number(endParts[0]) * 60 + Number(endParts[1]);
    const current = now.getHours() * 60 + now.getMinutes();
    if (!Number.isFinite(start) || !Number.isFinite(end)) return true;
    return start <= end ? current >= start && current <= end : current >= start || current <= end;
}

function sessionMatches(record, host, configuredDomain) {
    if (!record || !Number.isFinite(record.expiresAt)) return false;
    if (record.configuredDomain) {
        return configuredDomain && AnchorCore.hostMatchesDomain(
            configuredDomain,
            record.configuredDomain,
            false
        );
    }
    return AnchorCore.hostMatchesDomain(host, record.domain, true);
}

function storeBypass(request, sender, sendResponse, fallbackDuration) {
    if (!sender.tab) {
        sendResponse({ success: false });
        return false;
    }
    const host = domainFromUrl(request.url || sender.tab.url);
    if (!host) {
        sendResponse({ success: false });
        return false;
    }
    const durationMinutes = numberInRange(
        request.durationMinutes,
        numberInRange(fallbackDuration, 5, 1, 1440),
        1,
        1440
    );
    const record = {
        domain: host,
        configuredDomain: AnchorCore.normalizeDomain(request.configuredDomain),
        countMode: request.reInterventionCountMode === "wallClock" ? "wallClock" : "active",
        expiresAt: Date.now() + durationMinutes * 60 * 1000
    };
    chrome.storage.session.set({ [sessionKey(sender.tab.id)]: record }, function() {
        sendResponse({ success: true, expiresAt: record.expiresAt });
    });
    return true;
}

function sendStatus(request, sender, sendResponse) {
    const checkUrl = request.url || (sender.tab && sender.tab.url) || "";
    const host = domainFromUrl(checkUrl);
    const key = sender.tab ? sessionKey(sender.tab.id) : "";

    chrome.storage.session.get(key ? [key] : [], function(sessionResult) {
        chrome.storage.local.get(null, function(result) {
            const currentStatus = result.status === undefined ? 1 : result.status;
            const mode = result.operatingMode || "allowlist";
            const excludedDomain = mode === "blocklist"
                ? findMatchingDomain(host, result.exclusions, result)
                : "";
            const isTarget = Boolean(host) && (mode === "blocklist" ? !excludedDomain : Boolean(findMatchingDomain(host, result.allowlist, result)));
            const configuredDomain = mode === "allowlist"
                ? findMatchingDomain(host, result.allowlist, result)
                : isTarget ? findOverrideDomain(host, result) : "";
            const overrides = configuredDomain ? result["domainSettings_" + configuredDomain] || {} : {};
            const now = Date.now();
            const record = key ? sessionResult[key] : null;
            const withinSchedule = isWithinSchedule(result);
            const hasActiveBypass = Boolean(key && sessionMatches(record, host, configuredDomain) && record.expiresAt > now);
            const usableBypass = hasActiveBypass && withinSchedule;
            const activeCooldownRemainingMs = usableBypass ? Math.max(0, record.expiresAt - now) : null;

            if (key && record && record.expiresAt <= now) chrome.storage.session.remove(key);

            const reInterventionEnabled = overrides.reInterventionEnabled !== undefined
                ? Boolean(overrides.reInterventionEnabled)
                : result.reInterventionEnabled !== false;
            const reInterventionInterval = numberInRange(
                overrides.reInterventionInterval !== undefined
                    ? overrides.reInterventionInterval
                    : result.reInterventionInterval,
                10,
                1,
                1440
            );
            const reInterventionCountMode = (overrides.reInterventionCountMode !== undefined
                ? overrides.reInterventionCountMode
                : result.reInterventionCountMode) === "wallClock"
                ? "wallClock"
                : "active";
            const attemptsLog = Array.isArray(result.anchor_attempts_log) ? result.anchor_attempts_log : [];
            const dayMs = 24 * 60 * 60 * 1000;
            const siteAttempts = attemptsLog.filter(function(entry) {
                return AnchorCore.normalizeDomain(entry.host) === host && now - entry.timestamp <= dayMs;
            });
            const isExcluded = !isTarget || usableBypass || !withinSchedule;

            sendResponse({
                status: currentStatus,
                isExcluded: isExcluded,
                isTarget: isTarget,
                configuredDomain: configuredDomain,
                domain: host,
                activeCooldownRemainingMs: activeCooldownRemainingMs,
                activeCooldownRemainingMinutes: activeCooldownRemainingMs === null
                    ? null
                    : Math.max(1, Math.ceil(activeCooldownRemainingMs / 60000)),
                attemptsCount24h: siteAttempts.length,
                customDepth: numberInRange(result.customDepth, 10, 1, 1000),
                cpuSetting: ["high", "low", "none"].includes(result.cpuSetting) ? result.cpuSetting : "high",
                reelLimit: numberInRange(result.reelLimit, 10, 1, 500),
                scrollBuffer: numberInRange(result.scrollBuffer, 2, 0, 100),
                reelBuffer: numberInRange(result.reelBuffer, 2, 0, 100),
                anchorEnabled: overrides.anchorEnabled !== undefined
                    ? Boolean(overrides.anchorEnabled)
                    : result.anchorEnabled !== false,
                anchorType: result.anchorType || "basicBreath",
                anchorDuration: numberInRange(overrides.anchorDuration ?? result.anchorDuration, 5, 1, 300),
                anchorPhrase: result.anchorPhrase || "Take a deep breath...",
                anchorTextLength: result.anchorTextLength || "short",
                anchorTextComplexity: result.anchorTextComplexity || "lowercase",
                closeTabOnLeave: result.closeTabOnLeave !== false,
                anchorMathComplexity: result.anchorMathComplexity || "medium",
                anchorAlternativesList: result.anchorAlternativesList || "",
                anchorIntentionWarning: result.anchorIntentionWarning !== false,
                anchorBypassMode: "cooldown",
                anchorBypassTime: numberInRange(result.anchorBypassTime, 5, 1, 1440),
                reInterventionEnabled: reInterventionEnabled,
                reInterventionInterval: reInterventionInterval,
                reInterventionMode: result.reInterventionMode === "scroll" ? "scroll" : "time",
                reInterventionCountModeOverridden: overrides.reInterventionCountMode !== undefined,
                reInterventionScrollMult: numberInRange(result.reInterventionScrollMult, 1, 0.1, 100),
                reInterventionType: result.reInterventionType || "same",
                reInterventionCountMode: usableBypass && record.countMode
                    ? record.countMode
                    : reInterventionCountMode,
                sinkingEnabled: overrides.sinkingEnabled !== false,
                showDepthIndicator: result.showDepthIndicator !== false
            });
        });
    });
    return true;
}

function logAttempt(request, sender, sendResponse) {
    const host = domainFromUrl(sender.tab && sender.tab.url);
    if (!host) {
        sendResponse({ success: false });
        return false;
    }
    chrome.storage.local.get([
        "anchor_attempts_log",
        "anchor_stats_total",
        "anchor_stats_saved",
        "anchor_stats_opened"
    ], function(result) {
        const log = Array.isArray(result.anchor_attempts_log) ? result.anchor_attempts_log : [];
        log.push({ timestamp: Date.now(), host: host, action: request.action === "saved" ? "saved" : "opened" });
        const trimmedLog = log.slice(-1000);
        const update = {
            anchor_attempts_log: trimmedLog,
            anchor_stats_total: numberInRange(result.anchor_stats_total, 0, 0, Number.MAX_SAFE_INTEGER) + 1,
            anchor_stats_opened: numberInRange(result.anchor_stats_opened, 0, 0, Number.MAX_SAFE_INTEGER) + 1
        };
        if (request.action === "saved") {
            update.anchor_stats_saved = numberInRange(result.anchor_stats_saved, 0, 0, Number.MAX_SAFE_INTEGER) + 1;
        }
        chrome.storage.local.set(update, function() {
            sendResponse({ success: true });
        });
    });
    return true;
}

chrome.tabs.onRemoved.addListener(function(tabId) {
    chrome.storage.session.remove(sessionKey(tabId));
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.type === "fetchFavicon" && sender.tab) {
        chrome.tabs.get(sender.tab.id, function(tab) {
            if (chrome.runtime.lastError) {
                sendResponse({});
                return;
            }
            sendResponse({ dataUrl: tab && tab.favIconUrl ? tab.favIconUrl : "" });
        });
        return true;
    }

    if (request.type === "closeTab" && sender.tab) {
        chrome.tabs.remove(sender.tab.id);
        sendResponse({ success: true });
        return false;
    }

    if (request.type === "bypassSuccess" && sender.tab) {
        chrome.storage.local.get(["anchorBypassTime"], function(result) {
            storeBypass(request, sender, sendResponse, result.anchorBypassTime);
        });
        return true;
    }

    if (request.type === "bypassSuccessCustom" && sender.tab) {
        storeBypass(request, sender, sendResponse, request.durationMinutes);
        return true;
    }

    if (request.type === "logAttempt") {
        return logAttempt(request, sender, sendResponse);
    }

    if (request.type === "status") {
        return sendStatus(request, sender, sendResponse);
    }
});

chrome.runtime.onInstalled.addListener(function(details) {
    chrome.storage.local.get(null, function(result) {
        const migration = {};
        const keysToMigrate = {
            onesec_attempts_log: "anchor_attempts_log",
            onesec_stats_total: "anchor_stats_total",
            onesec_stats_saved: "anchor_stats_saved",
            onesec_stats_opened: "anchor_stats_opened",
            oneSecEnabled: "anchorEnabled",
            oneSecType: "anchorType",
            oneSecDuration: "anchorDuration",
            oneSecPhrase: "anchorPhrase",
            oneSecTextLength: "anchorTextLength",
            oneSecTextComplexity: "anchorTextComplexity",
            onesecMathComplexity: "anchorMathComplexity",
            onesecAlternativesList: "anchorAlternativesList",
            onesecIntentionWarning: "anchorIntentionWarning",
            onesecBypassMode: "anchorBypassMode",
            onesecBypassTime: "anchorBypassTime"
        };
        for (const oldKey in keysToMigrate) {
            const newKey = keysToMigrate[oldKey];
            if (result[oldKey] !== undefined && result[newKey] === undefined) migration[newKey] = result[oldKey];
        }
        for (const key in result) {
            if (!key.startsWith("domainSettings_") || !result[key]) continue;
            const overrides = { ...result[key] };
            let changed = false;
            if (overrides.oneSecEnabled !== undefined) {
                overrides.anchorEnabled = overrides.oneSecEnabled;
                delete overrides.oneSecEnabled;
                changed = true;
            }
            if (overrides.oneSecDuration !== undefined) {
                overrides.anchorDuration = overrides.oneSecDuration;
                delete overrides.oneSecDuration;
                changed = true;
            }
            if (changed) migration[key] = overrides;
        }
        if (Object.keys(migration).length) chrome.storage.local.set(migration);
    });

    if (details.reason === "install") chrome.tabs.create({ url: "onboarding.html" });
});
