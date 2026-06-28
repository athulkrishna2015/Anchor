$(document).ready(function() {
    let activeTabDomain = "";
    let activeTabId = null;

    // Load stats and attempts log
    chrome.storage.local.get([
        'anchor_stats_total', 'anchor_stats_saved', 'anchor_attempts_log', 'operatingMode', 'exclusions', 'allowlist'
    ], function(result) {
        let statsSaved = result.anchor_stats_saved || 0;
        let attemptsLog = result.anchor_attempts_log || [];

        // 3 mins saved per prevented attempt (matches 7x prevented = 21 mins saved in screenshot)
        let timeSavedMin = statsSaved * 3;
        $("#stat--saved-total").text(`You have saved ${timeSavedMin} mins in total.`);

        // Detect active tab domain to filter attempts Specifically
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].url) {
                activeTabId = tabs[0].id;
                try {
                    let url = new URL(tabs[0].url);
                    if (url.protocol.startsWith("http")) {
                        let domain = url.hostname;
                        if (domain.startsWith("www.")) domain = domain.substring(4);
                        activeTabDomain = domain;
                    }
                } catch(e) {}
            }

            let filteredAttempts = [];
            let now = Date.now();
            let dayMs = 24 * 60 * 60 * 1000;

            // Filter attempts in the last 24 hours
            let last24hAttempts = attemptsLog.filter(l => (now - l.timestamp) <= dayMs);

            if (activeTabDomain) {
                // Filter specifically for active domain
                filteredAttempts = last24hAttempts.filter(l => {
                    let logHost = l.host || "";
                    if (logHost.startsWith("www.")) logHost = logHost.substring(4);
                    return logHost === activeTabDomain;
                });

                // Capitalize first letter of domain for visual elegance (e.g., Instagram)
                let capitalizedDomain = activeTabDomain.split('.')[0];
                capitalizedDomain = capitalizedDomain.charAt(0).toUpperCase() + capitalizedDomain.slice(1);
                
                $("#stat--label").text(`Attempts to open ${capitalizedDomain} within the last 24h.`);
            } else {
                // Total across all sites
                filteredAttempts = last24hAttempts;
                $("#stat--label").text(`Attempts to open blocked websites within the last 24h.`);
            }

            $("#stat--attempts").text(filteredAttempts.length);

            // Configure Quick Add/Remove Toggle Button
            if (activeTabDomain) {
                let mode = result.operatingMode || 'blocklist';
                let exclusions = result.exclusions || [];
                let allowlist = result.allowlist || [];

                let isAlreadyConfigured = false;
                if (mode === 'blocklist') {
                    isAlreadyConfigured = exclusions.includes(activeTabDomain);
                } else {
                    isAlreadyConfigured = allowlist.includes(activeTabDomain);
                }

                $("#quick-add-area").show();

                if (mode === 'blocklist') {
                    if (isAlreadyConfigured) {
                        // Current site is excluded (unblocked) -> Option to block it again
                        $("#btn-quick-toggle").text(`Block ${activeTabDomain}`);
                        $("#btn-quick-toggle").off('click').click(function() {
                            let updatedEx = exclusions.filter(d => d !== activeTabDomain);
                            chrome.storage.local.set({ exclusions: updatedEx }, function() {
                                if (activeTabId) chrome.tabs.reload(activeTabId);
                                window.close();
                            });
                        });
                    } else {
                        // Current site is blocked by default -> Option to exclude it
                        $("#btn-quick-toggle").text(`Exclude ${activeTabDomain}`);
                        $("#btn-quick-toggle").off('click').click(function() {
                            exclusions.push(activeTabDomain);
                            chrome.storage.local.set({ exclusions: exclusions }, function() {
                                if (activeTabId) chrome.tabs.reload(activeTabId);
                                window.close();
                            });
                        });
                    }
                } else {
                    if (isAlreadyConfigured) {
                        // Current site is blocked (allowlist matched) -> Option to allow it
                        $("#btn-quick-toggle").text(`Allow ${activeTabDomain}`);
                        $("#btn-quick-toggle").off('click').click(function() {
                            let updatedAl = allowlist.filter(d => d !== activeTabDomain);
                            chrome.storage.local.set({ allowlist: updatedAl }, function() {
                                if (activeTabId) chrome.tabs.reload(activeTabId);
                                window.close();
                            });
                        });
                    } else {
                        // Current site is allowed by default -> Option to block it (add to allowlist)
                        $("#btn-quick-toggle").text(`Block ${activeTabDomain}`);
                        $("#btn-quick-toggle").off('click').click(function() {
                            allowlist.push(activeTabDomain);
                            chrome.storage.local.set({ allowlist: allowlist }, function() {
                                if (activeTabId) chrome.tabs.reload(activeTabId);
                                window.close();
                            });
                        });
                    }
                }
            }
        });
    });

    // Open Dashboard Button
    $("#btn-dashboard").click(function() {
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            chrome.tabs.create({url: "dashboard.html"});
        }
    });
});
