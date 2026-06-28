var bypassedTabs = {};

chrome.tabs.onRemoved.addListener(function(tabId) {
    delete bypassedTabs[tabId];
});

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "fetchFavicon") {
        let domain = request.domain;
        let url = `https://www.google.com/s2/favicons?sz=128&domain=${domain}`;
        fetch(url)
            .then(response => response.blob())
            .then(blob => {
                let reader = new FileReader();
                reader.onloadend = function() {
                    sendResponse({dataUrl: reader.result});
                }
                reader.readAsDataURL(blob);
            })
            .catch(err => {
                sendResponse({error: err.toString()});
            });
        return true; // Keep channel open for async response
    }

    if (request.type === "closeTab" && sender.tab) {
      chrome.tabs.remove(sender.tab.id);
      sendResponse({ success: true });
      return;
    }
    
    if (request.type === "bypassSuccess" && sender.tab) {
        let tabId = sender.tab.id;
        bypassedTabs[tabId] = true;
        
        let url;
        try {
            url = new URL(sender.tab.url);
            let domain = url.hostname;
            if (domain.startsWith("www.")) domain = domain.substring(4);
            
            chrome.storage.local.get(['anchorBypassTime'], function(result) {
                let mode = 'cooldown';
                let time = result.anchorBypassTime || 5;
                if (mode === 'cooldown') {
                    let key = "cooldown_" + domain;
                    let expiry = Date.now() + time * 60 * 1000;
                    chrome.storage.local.set({ [key]: expiry });
                }
            });
        } catch(e) {}
        
        sendResponse({ success: true });
        return true;
    }

    if (request.type === "bypassSuccessCustom" && sender.tab) {
        let tabId = sender.tab.id;
        bypassedTabs[tabId] = true;
        let durationMinutes = request.durationMinutes || 5;
        
        try {
            let url = new URL(sender.tab.url);
            let domain = url.hostname;
            if (domain.startsWith("www.")) domain = domain.substring(4);
            
            let key = "cooldown_" + domain;
            let expiry = Date.now() + durationMinutes * 60 * 1000;
            chrome.storage.local.set({ [key]: expiry });
        } catch(e) {}
        
        sendResponse({ success: true });
        return true;
    }

    if (request.type === "logAttempt") {
        let action = request.action;
        let domain = "";
        if (sender.tab && sender.tab.url) {
            try {
                let url = new URL(sender.tab.url);
                domain = url.hostname;
                if (domain.startsWith("www.")) domain = domain.substring(4);
            } catch(e) {}
        }
        if (domain) {
            chrome.storage.local.get(['anchor_attempts_log', 'anchor_stats_total', 'anchor_stats_saved', 'anchor_stats_opened'], function(result) {
                let log = result.anchor_attempts_log || [];
                let total = result.anchor_stats_total || 0;
                let saved = result.anchor_stats_saved || 0;
                let opened = result.anchor_stats_opened || 0;
                
                log.push({
                    timestamp: Date.now(),
                    host: domain,
                    action: action
                });
                
                let update = {
                    anchor_attempts_log: log,
                    anchor_stats_total: total + 1
                };
                
                if (action === 'saved') {
                    update.anchor_stats_saved = saved + 1;
                } else {
                    update.anchor_stats_opened = opened + 1;
                }
                
                chrome.storage.local.set(update, function() {
                    sendResponse({ success: true });
                });
            });
        } else {
            sendResponse({ success: false });
        }
        return true;
    }

    if (request.type === "status") {
      let domain = "";
      if (sender.tab && sender.tab.url) {
          try {
              let url = new URL(sender.tab.url);
              domain = url.hostname;
              if (domain.startsWith("www.")) domain = domain.substring(4);
          } catch(e) {}
      }
      
      let cooldownKey = "cooldown_" + domain;
      let domainSettingsKey = "domainSettings_" + domain;

      chrome.storage.local.get(null, function(result) {
        let currentStatus = result.status;
        if (currentStatus === undefined) currentStatus = 1; // default to 1
        
        let mode = result.operatingMode || 'allowlist';
        let isExcluded = false;

        let reInterventionEnabled = true;
        let reInterventionInterval = 10;
        let sinkingEnabled = true;
        
        // Merge domain-specific overrides
        let domainOverrides = result[domainSettingsKey];
        if (domainOverrides) {
            if (domainOverrides.anchorEnabled !== undefined) {
                result.anchorEnabled = domainOverrides.anchorEnabled;
            }
            if (domainOverrides.anchorDuration !== undefined) {
                result.anchorDuration = domainOverrides.anchorDuration;
            }
            if (domainOverrides.reInterventionEnabled !== undefined) {
                reInterventionEnabled = domainOverrides.reInterventionEnabled;
            }
            if (domainOverrides.reInterventionInterval !== undefined) {
                reInterventionInterval = domainOverrides.reInterventionInterval;
            }
            if (domainOverrides.sinkingEnabled !== undefined) {
                sinkingEnabled = domainOverrides.sinkingEnabled;
            }
        }
        
        // Check if there is an active bypass cooldown/session for this tab or domain
        let anchorBypassMode = 'cooldown';
        if (anchorBypassMode === 'cooldown') {
             let cooldownVal = result[cooldownKey];
             if (cooldownVal && Date.now() < cooldownVal) {
                 isExcluded = true;
             }
        } else if (anchorBypassMode === 'once') {
             if (sender.tab && bypassedTabs[sender.tab.id]) {
                 isExcluded = true;
             }
        }
        
        // Focus Schedule check
        let scheduleEnabled = result.scheduleEnabled === undefined ? false : result.scheduleEnabled;
        let scheduleStart = result.scheduleStart || '09:00';
        let scheduleEnd = result.scheduleEnd || '17:00';
        let scheduleDays = result.scheduleDays || [1, 2, 3, 4, 5];
        
        if (!isExcluded && currentStatus === 1 && scheduleEnabled) {
            let now = new Date();
            let currentDay = now.getDay();
            if (!scheduleDays.includes(currentDay)) {
                isExcluded = true;
            } else {
                let currentHours = now.getHours();
                let currentMins = now.getMinutes();
                let currentTimeVal = currentHours * 60 + currentMins;
                
                let startParts = scheduleStart.split(":");
                let startTimeVal = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
                
                let endParts = scheduleEnd.split(":");
                let endTimeVal = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
                
                let inSchedule = false;
                if (startTimeVal <= endTimeVal) {
                    inSchedule = currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal;
                } else {
                    inSchedule = currentTimeVal >= startTimeVal || currentTimeVal <= endTimeVal;
                }
                
                if (!inSchedule) {
                    isExcluded = true;
                }
            }
        }
        
        // Only run website blocklist/allowlist checks if we aren't already excluded by schedule/cooldown
        if (!isExcluded && sender.tab && sender.tab.url) {
            try {
                let url = new URL(sender.tab.url);
                if (mode === 'blocklist') {
                    if (result.exclusions) {
                        isExcluded = result.exclusions.some(ex => {
                            let siteSettings = result["domainSettings_" + ex];
                            if (siteSettings && siteSettings.scope === 'exact') {
                                return url.hostname === ex;
                            }
                            return url.hostname === ex || url.hostname.endsWith('.' + ex);
                        });
                    }
                } else if (mode === 'allowlist') {
                    if (result.allowlist) {
                        isExcluded = !result.allowlist.some(ex => {
                            let siteSettings = result["domainSettings_" + ex];
                            if (siteSettings && siteSettings.scope === 'exact') {
                                return url.hostname === ex;
                            }
                            return url.hostname === ex || url.hostname.endsWith('.' + ex);
                        });
                    } else {
                        isExcluded = true; // Blocked everywhere by default
                    }
                }
            } catch(e) {}
        }
        
        let isTarget = false;
        if (sender.tab && sender.tab.url) {
            try {
                let url = new URL(sender.tab.url);
                if (mode === 'blocklist') {
                    if (result.exclusions) {
                        isTarget = !result.exclusions.some(ex => {
                            let siteSettings = result["domainSettings_" + ex];
                            if (siteSettings && siteSettings.scope === 'exact') {
                                return url.hostname === ex;
                            }
                            return url.hostname === ex || url.hostname.endsWith('.' + ex);
                        });
                    } else {
                        isTarget = true;
                    }
                } else if (mode === 'allowlist') {
                    if (result.allowlist) {
                        isTarget = result.allowlist.some(ex => {
                            let siteSettings = result["domainSettings_" + ex];
                            if (siteSettings && siteSettings.scope === 'exact') {
                                return url.hostname === ex;
                            }
                            return url.hostname === ex || url.hostname.endsWith('.' + ex);
                        });
                    }
                }
            } catch(e) {}
        }

        let attemptsLog = result.anchor_attempts_log || [];
        let now = Date.now();
        let dayMs = 24 * 60 * 60 * 1000;
        let siteAttempts = attemptsLog.filter(l => {
            let logHost = l.host || "";
            if (logHost.startsWith("www.")) logHost = logHost.substring(4);
            return logHost === domain && (now - l.timestamp) <= dayMs;
        });

        sendResponse({
            status: currentStatus,
            isExcluded: isExcluded,
            isTarget: isTarget,
            attemptsCount24h: siteAttempts.length,
            customDepth: result.customDepth || 10,
            cpuSetting: result.cpuSetting || 'high',
            reelLimit: result.reelLimit || 10,
            scrollBuffer: result.scrollBuffer !== undefined ? result.scrollBuffer : 2,
            reelBuffer: result.reelBuffer !== undefined ? result.reelBuffer : 2,
            anchorEnabled: result.anchorEnabled === undefined ? true : result.anchorEnabled,
            anchorType: result.anchorType || 'basicBreath',
            anchorDuration: result.anchorDuration || 5,
            anchorPhrase: result.anchorPhrase || 'Take a deep breath...',
            anchorTextLength: result.anchorTextLength || 'short',
            anchorTextComplexity: result.anchorTextComplexity || 'lowercase',
            closeTabOnLeave: result.closeTabOnLeave === undefined ? true : result.closeTabOnLeave,
            anchorMathComplexity: result.anchorMathComplexity || 'medium',
            anchorAlternativesList: result.anchorAlternativesList || '',
            anchorIntentionWarning: result.anchorIntentionWarning === undefined ? true : result.anchorIntentionWarning,
            anchorBypassMode: anchorBypassMode,
            anchorBypassTime: result.anchorBypassTime || 5,
            reInterventionEnabled: reInterventionEnabled,
            reInterventionInterval: reInterventionInterval,
            reInterventionMode: result.reInterventionMode || 'time',
            reInterventionScrollMult: result.reInterventionScrollMult || 1.0,
            reInterventionType: result.reInterventionType || 'same',
            sinkingEnabled: sinkingEnabled,
            showDepthIndicator: result.showDepthIndicator === undefined ? true : result.showDepthIndicator
        });
      });
      return true;
    }
});

chrome.runtime.onInstalled.addListener(function(details) {
    // Database migration from old onesec_* keys to new anchor_* keys
    chrome.storage.local.get(null, function(result) {
        let migration = {};
        let keysToMigrate = {
            'onesec_attempts_log': 'anchor_attempts_log',
            'onesec_stats_total': 'anchor_stats_total',
            'onesec_stats_saved': 'anchor_stats_saved',
            'onesec_stats_opened': 'anchor_stats_opened',
            'oneSecEnabled': 'anchorEnabled',
            'oneSecType': 'anchorType',
            'oneSecDuration': 'anchorDuration',
            'oneSecPhrase': 'anchorPhrase',
            'oneSecTextLength': 'anchorTextLength',
            'oneSecTextComplexity': 'anchorTextComplexity',
            'onesecMathComplexity': 'anchorMathComplexity',
            'onesecAlternativesList': 'anchorAlternativesList',
            'onesecIntentionWarning': 'anchorIntentionWarning',
            'onesecBypassMode': 'anchorBypassMode',
            'onesecBypassTime': 'anchorBypassTime'
        };
        for (let oldKey in keysToMigrate) {
            let newKey = keysToMigrate[oldKey];
            if (result[oldKey] !== undefined && result[newKey] === undefined) {
                migration[newKey] = result[oldKey];
            }
        }
        
        // Migrate domain-specific settings overrides
        for (let key in result) {
            if (key.startsWith("domainSettings_")) {
                let overrides = result[key];
                if (overrides) {
                    let updated = false;
                    let newOverrides = { ...overrides };
                    if (overrides.oneSecEnabled !== undefined) {
                        newOverrides.anchorEnabled = overrides.oneSecEnabled;
                        delete newOverrides.oneSecEnabled;
                        updated = true;
                    }
                    if (overrides.oneSecDuration !== undefined) {
                        newOverrides.anchorDuration = overrides.oneSecDuration;
                        delete newOverrides.oneSecDuration;
                        updated = true;
                    }
                    if (updated) {
                        migration[key] = newOverrides;
                    }
                }
            }
        }

        if (Object.keys(migration).length > 0) {
            chrome.storage.local.set(migration);
        }
    });

    if (details.reason === "install") {
        chrome.tabs.create({url: "onboarding.html"});
    }
});
