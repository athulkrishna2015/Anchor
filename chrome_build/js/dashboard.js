$(document).ready(function() {
    let activeSection = 'overview';
    let isStrictLocked = false;
    let activeDetailSite = "";

    // Header Navigation Tabs
    $(".nav-links li").click(function() {
        $(".nav-links li").removeClass("active");
        $(this).addClass("active");

        let sectionId = $(this).data("section");
        activeSection = sectionId;

        // Hide details view and show the selected section card
        $("#details-view").hide();
        $(".section-card").removeClass("active");
        $("#sec-" + sectionId).addClass("active");
    });

    $("#brand-logo").click(function() {
        $(".nav-links li[data-section='overview']").click();
    });

    // Toast Save Notification
    let toastTimeout;
    function showToast() {
        clearTimeout(toastTimeout);
        $("#save-toast").fadeIn(200);
        toastTimeout = setTimeout(function() {
            $("#save-toast").fadeOut(300);
        }, 1500);
    }

    // Auto-save function for configurations
    function saveConfigurations() {
        if (isStrictLocked) return;

        let domainsStr = $("#setting--domains-list").val() || "";
        let parsedDomains = domainsStr.split("\n")
            .map(line => line.trim().toLowerCase())
            .filter(line => line.length > 0);

        let storageData = {
            operatingMode: $("#setting--operating-mode").val(),
            anchorEnabled: $("#setting--anchor-enabled").is(":checked"),
            anchorBypassMode: 'cooldown',
            reInterventionEnabled: true,
            closeTabOnLeave: $("#setting--anchor-close-tab").is(":checked"),

            scheduleEnabled: $("#setting--schedule-enabled").is(":checked"),
            scheduleStart: $("#setting--schedule-start").val(),
            scheduleEnd: $("#setting--schedule-end").val(),
            scheduleStrict: $("#setting--schedule-strict").is(":checked"),

            customDepth: parseInt($("#setting--anchor-depth").val()) || 10,
            scrollBuffer: parseInt($("#setting--anchor-scroll-buffer").val()) !== undefined ? parseInt($("#setting--anchor-scroll-buffer").val()) : 2,
            reelLimit: parseInt($("#setting--anchor-reel-limit").val()) || 10,
            reelBuffer: parseInt($("#setting--anchor-reel-buffer").val()) !== undefined ? parseInt($("#setting--anchor-reel-buffer").val()) : 2,
            cpuSetting: $("#setting--anchor-cpu").val(),
            showDepthIndicator: $("#setting--depth-indicator-enabled").is(":checked")
        };

        if (storageData.operatingMode === 'blocklist') {
            storageData.exclusions = parsedDomains;
        } else {
            storageData.allowlist = parsedDomains;
        }

        chrome.storage.local.set(storageData, function() {
            showToast();
        });
    }

    // Auto-save listeners
    $("input, select, textarea").on("change input", function() {
        if (isStrictLocked) return;

        // Skip saving from overrides modal inputs
        if ($(this).closest('#domain-modal').length > 0 || $(this).closest('#scope-modal').length > 0) return;

        if ($(this).is("textarea") || ($(this).is("input") && $(this).attr("type") === "text")) {
            clearTimeout($(this).data("timeout"));
            let t = setTimeout(saveConfigurations, 500);
            $(this).data("timeout", t);
        } else {
            saveConfigurations();
        }
    });

    // Populate domains list textarea
    function updateDomainsTextarea(mode, exclusions, allowlist) {
        if (mode === 'blocklist') {
            $("#list-label-text").text("Excluded Domains (Unblocked)");
            $("#setting--domains-list").val(exclusions.join("\n"));
        } else {
            $("#list-label-text").text("Target Domains (Blocked)");
            $("#setting--domains-list").val(allowlist.join("\n"));
        }
    }

    $("#setting--operating-mode").change(function() {
        let newMode = $(this).val();
        chrome.storage.local.get(['exclusions', 'allowlist'], function(result) {
            let exclusions = result.exclusions || [];
            let allowlist = result.allowlist || [];
            updateDomainsTextarea(newMode, exclusions, allowlist);
            saveConfigurations();
        });
    });

    // Blocker Config Panel Show/Hide (Block tab button)
    $("#btn-open-block-config").click(function() {
        $("#block-empty-state-view").hide();
        $("#blocklist-config-panel").slideDown(200);
    });

    $("#btn-close-block-config").click(function() {
        $("#blocklist-config-panel").slideUp(200);
        $("#block-empty-state-view").show();
    });

    // Toggles visibility of schedule inputs
    $("#setting--schedule-enabled").change(function() {
        if ($(this).is(":checked")) {
            $("#schedule-sub-panel").css("display", "flex").slideDown(200);
        } else {
            $("#schedule-sub-panel").slideUp(200);
        }
    });



    // Load Settings
    chrome.storage.local.get([
        'exclusions', 'allowlist', 'operatingMode', 'closeTabOnLeave',
        'anchorBypassMode', 'anchorBypassTime',
        'reInterventionEnabled', 'reInterventionInterval',
        'scheduleEnabled', 'scheduleStart', 'scheduleEnd', 'scheduleStrict',
        'anchor_stats_total', 'anchor_stats_saved', 'anchor_stats_opened', 'anchor_attempts_log',
        'customDepth', 'scrollBuffer', 'reelLimit', 'reelBuffer', 'cpuSetting', 'anchorEnabled', 'anchorType', 'showDepthIndicator'
    ], function(result) {
        let activeMode = result.operatingMode || 'allowlist';
        let exclusions = result.exclusions || [];
        let allowlist = result.allowlist || [];

        let closeTab = result.closeTabOnLeave === undefined ? true : result.closeTabOnLeave;
        let schedEnabled = result.scheduleEnabled === undefined ? false : result.scheduleEnabled;
        let schedStart = result.scheduleStart || '09:00';
        let schedEnd = result.scheduleEnd || '17:00';
        let schedStrict = result.scheduleStrict === undefined ? false : result.scheduleStrict;

        let customDepth = result.customDepth || 10;
        let scrollBuffer = result.scrollBuffer !== undefined ? result.scrollBuffer : 2;
        let reelLimit = result.reelLimit || 10;
        let reelBuffer = result.reelBuffer !== undefined ? result.reelBuffer : 2;
        let cpuSetting = result.cpuSetting || 'high';
        let anchorEnabled = result.anchorEnabled === undefined ? true : result.anchorEnabled;
        let activeType = result.anchorType || 'basicBreath';
        let showDepthInd = result.showDepthIndicator === undefined ? true : result.showDepthIndicator;

        updateInterventionTypeUI(activeType);

        // Populate Blocker Setup inputs
        $("#setting--operating-mode").val(activeMode);
        updateDomainsTextarea(activeMode, exclusions, allowlist);

        $("#setting--anchor-enabled").prop("checked", anchorEnabled);
        $("#setting--depth-indicator-enabled").prop("checked", showDepthInd);
        $("#setting--anchor-close-tab").prop("checked", closeTab);



        $("#setting--schedule-enabled").prop("checked", schedEnabled);
        $("#setting--schedule-start").val(schedStart);
        $("#setting--schedule-end").val(schedEnd);
        $("#setting--schedule-strict").prop("checked", schedStrict);

        $("#setting--anchor-depth").val(customDepth);
        $("#setting--anchor-scroll-buffer").val(scrollBuffer);
        $("#setting--anchor-reel-limit").val(reelLimit);
        $("#setting--anchor-reel-buffer").val(reelBuffer);
        $("#setting--anchor-cpu").val(cpuSetting);

        if (schedEnabled) $("#schedule-sub-panel").css("display", "flex");

        // STRICT FOCUS SCHEDULE LOCK check
        if (schedEnabled && schedStrict) {
            let now = new Date();
            let currentHours = now.getHours();
            let currentMins = now.getMinutes();
            let currentTimeVal = currentHours * 60 + currentMins;
            
            let startParts = schedStart.split(":");
            let startTimeVal = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
            
            let endParts = schedEnd.split(":");
            let endTimeVal = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
            
            let inSchedule = false;
            if (startTimeVal <= endTimeVal) {
                inSchedule = currentTimeVal >= startTimeVal && currentTimeVal <= endTimeVal;
            } else {
                inSchedule = currentTimeVal >= startTimeVal || currentTimeVal <= endTimeVal;
            }
            
            if (inSchedule) {
                isStrictLocked = true;
                $("#strict-warning-banner").show();
                $("input, select, textarea, button").prop("disabled", true);
                $("#btn-back-to-overview").prop("disabled", false); // Keep navigation enabled
                console.log("Strict focus schedule active. Modifications locked.");
            }
        }

        // Render Overview statistics
        renderOverviewStats(result);
    });

    // Populate Overview Statistics
    function renderOverviewStats(result) {
        let statsTotal = result.anchor_stats_total || 0;
        let statsSaved = result.anchor_stats_saved || 0;
        let attemptsLog = result.anchor_attempts_log || [];

        // Total metrics (uses 3 mins saved per count)
        $("#stat--total-prevented").text(statsSaved + "x");
        let totalSavedMin = statsSaved * 3;
        $("#stat--total-saved").text(totalSavedMin >= 60 ? `${Math.floor(totalSavedMin/60)}h ${totalSavedMin%60}m` : `${totalSavedMin} mins`);

        // Last 24h metrics
        let now = Date.now();
        let dayMs = 24 * 60 * 60 * 1000;
        let last24hAttempts = attemptsLog.filter(l => (now - l.timestamp) <= dayMs);
        let last24hSavedCount = last24hAttempts.filter(l => l.action === 'saved').length;
        let last24hSavedMin = last24hSavedCount * 3;

        $("#stat--24h-prevented").text(last24hSavedCount + "x");
        $("#stat--24h-saved").text(last24hSavedMin + " mins");

        // Annualized prediction (24h * 365)
        let annualPrevented = last24hSavedCount * 365;
        let annualSavedMin = last24hSavedMin * 365;

        $("#stat--annual-prevented").text(annualPrevented + "x");
        if (annualSavedMin >= 1440) {
            let days = Math.round((annualSavedMin / 1440) * 10) / 10;
            $("#stat--annual-saved").text(days + " days");
        } else if (annualSavedMin >= 60) {
            let hrs = Math.round((annualSavedMin / 60) * 10) / 10;
            $("#stat--annual-saved").text(hrs + " hours");
        } else {
            $("#stat--annual-saved").text(annualSavedMin + " mins");
        }

        // Render Websites Breakdown List
        let breakdownList = $("#website-breakdown-list");
        breakdownList.empty();

        let siteStats = {};
        attemptsLog.forEach(log => {
            let site = log.host || "";
            if (site.startsWith("www.")) site = site.substring(4);
            
            if (!siteStats[site]) {
                siteStats[site] = { total: 0, saved: 0 };
            }
            siteStats[site].total++;
            if (log.action === 'saved') {
                siteStats[site].saved++;
            }
        });

        // Add domains from allowlist that don't have logs yet to list
        let mode = result.operatingMode || 'allowlist';
        if (mode === 'allowlist' && result.allowlist) {
            result.allowlist.forEach(site => {
                let cleanSite = site.trim().toLowerCase();
                if (cleanSite.startsWith("www.")) cleanSite = cleanSite.substring(4);
                if (cleanSite && !siteStats[cleanSite]) {
                    siteStats[cleanSite] = { total: 0, saved: 0 };
                }
            });
        }

        let sortedSites = Object.keys(siteStats).sort((a,b) => siteStats[b].total - siteStats[a].total);

        if (sortedSites.length === 0) {
            breakdownList.append('<div style="font-size: 14px; color: var(--text-dark); text-align: center; padding: 24px;">No blocked websites configured.</div>');
        } else {
            sortedSites.forEach(site => {
                let stats = siteStats[site];
                let savedMin = stats.saved * 3;
                let capitalizedDomain = site.charAt(0).toUpperCase() + site.slice(1).split('.')[0];

                breakdownList.append(`
                    <div class="website-item" data-site="${site}">
                        <div class="website-item-left">
                            <span class="website-icon" style="display:inline-flex; align-items:center; justify-content:center;"><img src="https://www.google.com/s2/favicons?sz=64&domain=${site}" style="width:20px; height:20px; border-radius:3px; display:block;" /></span>
                            <span class="website-name" style="margin-left:8px;">${capitalizedDomain}</span>
                        </div>
                        <div class="website-item-right">
                            <span class="website-saved-val">${savedMin} mins saved</span>
                            <span class="caret-icon">❯</span>
                        </div>
                    </div>
                `);
            });
        }
    }

    // Search bar functionality to add websites on Enter
    $("#website-search-input").keypress(function(e) {
        if (e.which === 13) {
            let site = $(this).val().trim().toLowerCase();
            if (site.startsWith("www.")) site = site.substring(4);
            
            if (site.length > 0) {
                chrome.storage.local.get(['operatingMode', 'exclusions', 'allowlist'], function(res) {
                    let mode = res.operatingMode || 'allowlist';
                    let exclusions = res.exclusions || [];
                    let allowlist = res.allowlist || [];

                    if (mode === 'allowlist') {
                        if (!allowlist.includes(site)) {
                            allowlist.push(site);
                            chrome.storage.local.set({ allowlist: allowlist }, reloadOverview);
                        }
                    } else {
                        // In blocklist, everything is blocked EXCEPT exclusions. 
                        // To block a site, we remove it from exclusions list.
                        if (exclusions.includes(site)) {
                            let updatedEx = exclusions.filter(d => d !== site);
                            chrome.storage.local.set({ exclusions: updatedEx }, reloadOverview);
                        } else {
                            // If it's already blocked (not in exclusions), notify or do nothing
                            showToast();
                        }
                    }
                    $("#website-search-input").val("");
                });
            }
        }
    });

    function reloadOverview() {
        chrome.storage.local.get(['anchor_stats_total', 'anchor_stats_saved', 'anchor_attempts_log', 'operatingMode', 'exclusions', 'allowlist'], function(result) {
            renderOverviewStats(result);
            let activeMode = result.operatingMode || 'allowlist';
            let exclusions = result.exclusions || [];
            let allowlist = result.allowlist || [];
            updateDomainsTextarea(activeMode, exclusions, allowlist);
            showToast();
        });
    }

    // Handle clicking a website item to show Details View SPA screen
    $(document).on("click", ".website-item", function() {
        let site = $(this).data("site");
        activeDetailSite = site;

        let capitalizedDomain = site.charAt(0).toUpperCase() + site.slice(1).split('.')[0];
        $("#detail-site-title").text(capitalizedDomain);
        $("#detail-site-icon").html(`<img src="https://www.google.com/s2/favicons?sz=64&domain=${site}" style="width:28px; height:28px; border-radius:4px; display:block;" />`);

        // Load stats for this website
        chrome.storage.local.get(['anchor_attempts_log'], function(result) {
            let log = result.anchor_attempts_log || [];
            let siteAttempts = log.filter(l => {
                let logHost = l.host || "";
                if (logHost.startsWith("www.")) logHost = logHost.substring(4);
                return logHost === site;
            });

            let total = siteAttempts.length;
            let saved = siteAttempts.filter(l => l.action === 'saved').length;
            let savedMin = saved * 3;

            $("#detail-site-total-prevented").text(saved + "x");
            $("#detail-site-total-saved").text(savedMin + " mins");

            // Filter for last 24h
            let now = Date.now();
            let dayMs = 24 * 60 * 60 * 1000;
            let last24hAttempts = siteAttempts.filter(l => (now - l.timestamp) <= dayMs);
            let last24hSavedCount = last24hAttempts.filter(l => l.action === 'saved').length;
            let last24hSavedMin = last24hSavedCount * 3;

            $("#detail-site-24h-prevented").text(last24hSavedCount + "x");
            $("#detail-site-24h-saved").text(last24hSavedMin + " mins");

            // Urge reduction text
            let urgeText = `Anchor has lowered your urge to open ${capitalizedDomain}: from ${total} attempts down to ${saved} saved pauses.`;
            $("#detail-site-urge-desc").text(urgeText);

            // Show details view SPA screen
            $("#sec-overview").hide();
            $("#details-view").fadeIn(150);
        });
    });

    // Back to Overview SPA transition
    $("#btn-back-to-overview").click(function() {
        $("#details-view").hide();
        $("#sec-overview").fadeIn(150);
    });

    // Remove site entirely from blocker
    $("#btn-remove-site-entirely").click(function() {
        if (isStrictLocked) return;

        if (confirm(`Are you sure you want to stop blocking ${activeDetailSite}?`)) {
            chrome.storage.local.get(['operatingMode', 'exclusions', 'allowlist'], function(res) {
                let mode = res.operatingMode || 'allowlist';
                let exclusions = res.exclusions || [];
                let allowlist = res.allowlist || [];

                if (mode === 'allowlist') {
                    let updatedAl = allowlist.filter(d => d !== activeDetailSite);
                    chrome.storage.local.set({ allowlist: updatedAl }, function() {
                        $("#btn-back-to-overview").click();
                        reloadOverview();
                    });
                } else {
                    // In blocklist, we stop blocking it by adding it to exclusions.
                    if (!exclusions.includes(activeDetailSite)) {
                        exclusions.push(activeDetailSite);
                        chrome.storage.local.set({ exclusions: exclusions }, function() {
                            $("#btn-back-to-overview").click();
                            reloadOverview();
                        });
                    }
                }
            });
        }
    });

    // Customize app-specific modal controls
    $("#btn-open-site-modal").click(function() {
        // Load settings and overrides for the active site
        let overrideKey = "domainSettings_" + activeDetailSite;
        chrome.storage.local.get(['anchorEnabled', 'anchorDuration', 'reInterventionEnabled', 'reInterventionInterval', overrideKey], function(result) {
            let overrides = result[overrideKey] || {};

            let isAnchorEnabled = overrides.anchorEnabled !== undefined ? overrides.anchorEnabled : (result.anchorEnabled === undefined ? true : result.anchorEnabled);
            let durationVal = overrides.anchorDuration !== undefined ? overrides.anchorDuration : (result.anchorDuration || 6);
            let isReEnabled = overrides.reInterventionEnabled !== undefined ? overrides.reInterventionEnabled : true;
            let intervalVal = overrides.reInterventionInterval !== undefined ? overrides.reInterventionInterval : (result.reInterventionInterval || 15);
            let isSinkingEnabled = overrides.sinkingEnabled !== undefined ? overrides.sinkingEnabled : true;

            $("#modal-override-anchor-enabled").prop("checked", isAnchorEnabled);

            // Populate duration: if not a preset value, select Custom and show input
            const presets = ["2", "6", "12", "20"];
            if (presets.includes(String(durationVal))) {
                $("#modal-override-anchor-duration").val(durationVal);
                $("#modal-override-anchor-duration-custom-wrap").hide();
                $("#modal-override-anchor-duration-custom").val("");
            } else {
                $("#modal-override-anchor-duration").val("custom");
                $("#modal-override-anchor-duration-custom").val(durationVal);
                $("#modal-override-anchor-duration-custom-wrap").show();
            }

            $("#modal-override-re-enabled").prop("checked", isReEnabled);
            $("#modal-override-re-interval").val(intervalVal);
            $("#modal-override-sinking-enabled").prop("checked", isSinkingEnabled);

            if (isReEnabled) {
                $("#modal-re-interval-row").show();
            } else {
                $("#modal-re-interval-row").hide();
            }

            $("#domain-modal").css("display", "flex");
        });
    });

    // Show/hide custom duration input when "Custom..." is selected
    $("#modal-override-anchor-duration").change(function() {
        if ($(this).val() === "custom") {
            $("#modal-override-anchor-duration-custom-wrap").slideDown(200);
            $("#modal-override-anchor-duration-custom").focus();
        } else {
            $("#modal-override-anchor-duration-custom-wrap").slideUp(200);
        }
    });

    // Modal re-intervention slide toggle
    $("#modal-override-re-enabled").change(function() {
        if ($(this).is(":checked")) {
            $("#modal-re-interval-row").slideDown(200);
        } else {
            $("#modal-re-interval-row").slideUp(200);
        }
    });

    // Close overrides modal
    $("#close-modal-btn, #domain-modal").click(function(e) {
        if (e.target === this) {
            $("#domain-modal").hide();
        }
    });

    // Save Overrides
    $("#modal-save-btn").click(function() {
        if (isStrictLocked) return;

        let overrideKey = "domainSettings_" + activeDetailSite;
        chrome.storage.local.get([overrideKey], function(result) {
            let overrides = result[overrideKey] || {};
            overrides.anchorEnabled = $("#modal-override-anchor-enabled").is(":checked");

            // Read custom duration if custom option is selected
            const durationSelect = $("#modal-override-anchor-duration").val();
            if (durationSelect === "custom") {
                let customVal = parseInt($("#modal-override-anchor-duration-custom").val());
                overrides.anchorDuration = (!isNaN(customVal) && customVal >= 21) ? Math.min(customVal, 300) : 30;
            } else {
                overrides.anchorDuration = parseInt(durationSelect) || 6;
            }

            overrides.reInterventionEnabled = $("#modal-override-re-enabled").is(":checked");
            overrides.reInterventionInterval = parseInt($("#modal-override-re-interval").val()) || 15;
            overrides.sinkingEnabled = $("#modal-override-sinking-enabled").is(":checked");

            chrome.storage.local.set({ [overrideKey]: overrides }, function() {
                $("#domain-modal").hide();
                showToast();
            });
        });
    });

    // Clear Overrides
    $("#modal-delete-override-btn").click(function() {
        if (isStrictLocked) return;

        let overrideKey = "domainSettings_" + activeDetailSite;
        chrome.storage.local.remove(overrideKey, function() {
            $("#domain-modal").hide();
            showToast();
        });
    });

    // Domain Scope Modal Handlers
    $("#btn-detail-scope-dummy").click(function() {
        let overrideKey = "domainSettings_" + activeDetailSite;
        chrome.storage.local.get([overrideKey], function(result) {
            let overrides = result[overrideKey] || {};
            let scopeVal = overrides.scope || "subdomains";
            
            $(`input[name="scope-rule"][value="${scopeVal}"]`).prop("checked", true);
            $("#scope-modal").css("display", "flex");
        });
    });

    $("#close-scope-modal-btn, #scope-modal").click(function(e) {
        if (e.target === this) {
            $("#scope-modal").hide();
        }
    });

    $("#scope-modal-save-btn").click(function() {
        if (isStrictLocked) return;
        
        let selectedScope = $('input[name="scope-rule"]:checked').val();
        let overrideKey = "domainSettings_" + activeDetailSite;
        
        chrome.storage.local.get([overrideKey], function(result) {
            let overrides = result[overrideKey] || {};
            overrides.scope = selectedScope;
            
            chrome.storage.local.set({ [overrideKey]: overrides }, function() {
                $("#scope-modal").hide();
                showToast();
            });
        });
    });

    // Reset Statistics Action
    $("#btn-reset-stats").click(function() {
        if (confirm("Are you sure you want to reset all intervention statistics?")) {
            chrome.storage.local.set({
                anchor_stats_total: 0,
                anchor_stats_saved: 0,
                anchor_stats_opened: 0,
                anchor_attempts_log: []
            }, function() {
                reloadOverview();
            });
        }
    });

    // Update active UI card for intervention types
    function updateInterventionTypeUI(activeType) {
        $(".intervention-item").removeClass("active");
        $(".btn-select-type").removeClass("active-type").text("Activate").prop("disabled", false);
        
        let cardId = "";
        let btnId = "";
        if (activeType === "basicBreath") {
            cardId = "#card-basic-breath";
            btnId = "#btn-activate-basic";
        } else if (activeType === "minimalBreath") {
            cardId = "#card-minimal-breath";
            btnId = "#btn-activate-minimal";
        } else if (activeType === "typeRandomText") {
            cardId = "#card-random-text";
            btnId = "#btn-activate-random";
        }
        
        if (cardId) {
            $(cardId).addClass("active");
            $(btnId).addClass("active-type").text("Active").prop("disabled", true);
        }
    }

    $(".btn-select-type").click(function() {
        if (isStrictLocked) return;
        
        let selectedType = $(this).data("type");
        chrome.storage.local.set({ anchorType: selectedType }, function() {
            updateInterventionTypeUI(selectedType);
            showToast();
        });
    });

    // Handle play button preview animation click
    $(".play-btn").click(function() {
        let type = $(this).siblings(".btn-select-type").data("type");
        if (type) {
            runInterventionPreview(type);
        }
    });

    function runInterventionPreview(type) {
        // Remove any existing preview overlays
        $("#anchor-overlay").remove();

        let overlay = $('<div id="anchor-overlay"></div>');
        let wrapper = $('<div class="anchor-wrapper"></div>');
        overlay.append(wrapper);
        $("body").append(overlay);

        function closePreview() {
            overlay.fadeOut(300, function() {
                $(this).remove();
            });
        }

        // Add placeholder favicon
        wrapper.append('<img src="icon.png" style="width:48px; height:48px; border-radius:10px; margin:0 auto 24px auto; box-shadow:0 4px 12px rgba(0,0,0,0.25); display:block;" />');

        if (type === 'basicBreath') {
            wrapper.css({
                "background": "transparent",
                "border": "none",
                "box-shadow": "none",
                "backdrop-filter": "none"
            });

            let instructionText = $('<h1 style="font-size:24px; font-weight:600; color:#cbd5e1; font-family:\'Outfit\', sans-serif; text-align:center; margin-bottom: 20px; line-height:1.4;">Take a deep breath...</h1>');
            wrapper.append(instructionText);

            let bubble = $(`
                <div class="breath-bubble" style="width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.4) 100%); border: 2px solid rgba(6, 182, 212, 0.6); box-shadow: 0 0 30px rgba(6, 182, 212, 0.3); display: flex; align-items: center; justify-content: center; margin: 30px auto; transition: transform 3.8s ease-in-out, box-shadow 3.8s ease-in-out, background 3.8s ease-in-out; transform: scale(0.9); pointer-events: none;">
                    <span class="breath-action" style="font-size: 20px; font-weight: 700; color: #ffffff; text-shadow: 0 1px 4px rgba(0,0,0,0.5); font-family:\'Outfit\', sans-serif;">Breathe</span>
                </div>
            `);
            wrapper.append(bubble);

            let statsLabel = $('<div style="font-size: 14px; color: #71717a; text-align:center; margin-top:20px; font-family:\'Outfit\', sans-serif;">First attempt to open Instagram today (Preview)</div>');
            wrapper.append(statsLabel);

            setTimeout(function() {
                bubble.css({
                    "transform": "scale(1.35)",
                    "box-shadow": "0 0 45px rgba(6, 182, 212, 0.6)",
                    "background": "radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.6) 100%)"
                });
                bubble.find(".breath-action").text("Inhale");
            }, 500);

            setTimeout(function() {
                bubble.css({
                    "transform": "scale(0.9)",
                    "box-shadow": "0 0 15px rgba(6, 182, 212, 0.1)",
                    "background": "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0.25) 100%)"
                });
                bubble.find(".breath-action").text("Exhale");
            }, 4500);

            setTimeout(function() {
                wrapper.empty();
                wrapper.css({
                    "background": "#18181b",
                    "border": "1px solid #27272a",
                    "box-shadow": "0 10px 30px rgba(0, 0, 0, 0.5)",
                    "padding": "32px 24px"
                });
                wrapper.append('<img src="icon.png" style="width:48px; height:48px; border-radius:10px; margin:0 auto 24px auto; box-shadow:0 4px 12px rgba(0,0,0,0.25); display:block;" />');

                wrapper.append('<div class="anchor-title" style="font-size:26px; font-weight:700; margin-bottom:8px; color:#cbd5e1; text-align:center; font-family:\'Outfit\', sans-serif;">Mindful Check-in</div>');
                wrapper.append('<div class="anchor-subtitle" style="font-size:15px; color:#a1a1aa; margin-bottom:25px; text-align:center; font-family:\'Outfit\', sans-serif;">You paused. Do you still want to visit Instagram?</div>');
                
                let actionBox = $('<div class="anchor-choices" style="display:flex; flex-direction:column; gap:12px; width:100%;"></div>');
                let cancelBtn = $('<button class="anchor-btn anchor-btn-secondary" style="padding:12px 20px; border-radius:9999px; border:1px solid #27272a; background:transparent; color:#fff; cursor:pointer; font-family:\'Outfit\', sans-serif;">No, close this tab</button>');
                let proceedBtn = $('<button class="anchor-btn anchor-btn-primary" style="padding:12px 20px; border-radius:9999px; border:none; background:#6366f1; color:#fff; cursor:pointer; font-family:\'Outfit\', sans-serif;">Yes, I need to open it</button>');
                actionBox.append(cancelBtn).append(proceedBtn);
                wrapper.append(actionBox);

                cancelBtn.click(closePreview);
                proceedBtn.click(closePreview);
            }, 8500);

        } else if (type === 'minimalBreath') {
            wrapper.css({
                "background": "transparent",
                "border": "none",
                "box-shadow": "none",
                "backdrop-filter": "none"
            });

            let bubble = $(`
                <div class="breath-bubble" style="width: 140px; height: 140px; border-radius: 50%; background: radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, rgba(6, 182, 212, 0.4) 100%); border: 2px solid rgba(6, 182, 212, 0.6); box-shadow: 0 0 30px rgba(6, 182, 212, 0.3); display: flex; align-items: center; justify-content: center; margin: 50px auto; transition: transform 3.8s ease-in-out, box-shadow 3.8s ease-in-out, background 3.8s ease-in-out; transform: scale(0.9); pointer-events: none;">
                    <span class="breath-action" style="font-size: 20px; font-weight: 700; color: #ffffff; text-shadow: 0 1px 4px rgba(0,0,0,0.5); font-family:\'Outfit\', sans-serif;">Breathe</span>
                </div>
            `);
            wrapper.append(bubble);

            setTimeout(function() {
                bubble.css({
                    "transform": "scale(1.35)",
                    "box-shadow": "0 0 45px rgba(6, 182, 212, 0.6)",
                    "background": "radial-gradient(circle, rgba(6, 182, 212, 0.2) 0%, rgba(6, 182, 212, 0.6) 100%)"
                });
                bubble.find(".breath-action").text("Inhale");
            }, 500);

            setTimeout(function() {
                bubble.css({
                    "transform": "scale(0.9)",
                    "box-shadow": "0 0 15px rgba(6, 182, 212, 0.1)",
                    "background": "radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(99, 102, 241, 0.25) 100%)"
                });
                bubble.find(".breath-action").text("Exhale");
            }, 4500);

            setTimeout(function() {
                wrapper.empty();
                wrapper.css({
                    "background": "#18181b",
                    "border": "1px solid #27272a",
                    "box-shadow": "0 10px 30px rgba(0, 0, 0, 0.5)",
                    "padding": "32px 24px"
                });
                wrapper.append('<img src="icon.png" style="width:48px; height:48px; border-radius:10px; margin:0 auto 24px auto; box-shadow:0 4px 12px rgba(0,0,0,0.25); display:block;" />');

                wrapper.append('<div class="anchor-title" style="font-size:26px; font-weight:700; margin-bottom:8px; color:#cbd5e1; text-align:center; font-family:\'Outfit\', sans-serif;">Mindful Check-in</div>');
                wrapper.append('<div class="anchor-subtitle" style="font-size:15px; color:#a1a1aa; margin-bottom:25px; text-align:center; font-family:\'Outfit\', sans-serif;">You paused. Do you still want to visit Instagram?</div>');
                
                let actionBox = $('<div class="anchor-choices" style="display:flex; flex-direction:column; gap:12px; width:100%;"></div>');
                let cancelBtn = $('<button class="anchor-btn anchor-btn-secondary" style="padding:12px 20px; border-radius:9999px; border:1px solid #27272a; background:transparent; color:#fff; cursor:pointer; font-family:\'Outfit\', sans-serif;">No, close this tab</button>');
                let proceedBtn = $('<button class="anchor-btn anchor-btn-primary" style="padding:12px 20px; border-radius:9999px; border:none; background:#6366f1; color:#fff; cursor:pointer; font-family:\'Outfit\', sans-serif;">Yes, I need to open it</button>');
                actionBox.append(cancelBtn).append(proceedBtn);
                wrapper.append(actionBox);

                cancelBtn.click(closePreview);
                proceedBtn.click(closePreview);
            }, 8500);

        } else if (type === 'typeRandomText') {
            wrapper.append('<div class="anchor-title" style="font-size:26px; font-weight:700; margin-bottom:8px; color:#cbd5e1; text-align:center; font-family:\'Outfit\', sans-serif;">Solve the math problem to unlock</div>');
            wrapper.append('<div class="anchor-subtitle" style="font-size:15px; color:#a1a1aa; margin-bottom:25px; text-align:center; font-family:\'Outfit\', sans-serif;">Focus your attention by typing the correct answer below:</div>');

            let num1 = 7;
            let num2 = 6;
            let answer = num1 * num2; // 42

            let mathBox = $('<div class="anchor-math-box" style="width:100%; display:flex; flex-direction:column; gap:16px; margin-bottom:20px;"></div>');
            mathBox.append('<div class="anchor-math-eq" style="font-family: monospace !important; font-size: 32px; font-weight: 800; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; text-align:center; color:#fff;">' + num1 + ' * ' + num2 + ' = ?</div>');
            let mathInput = $('<input type="text" class="anchor-math-input" placeholder="Type answer here..." style="font-family: monospace !important; width:100%; background:#27272a; border:1px solid #3f3f46; border-radius:8px; color:#fff; padding:12px; font-size:16px; text-align:center; outline:none;" autocomplete="off" spellcheck="false">');
            mathBox.append(mathInput);
            wrapper.append(mathBox);

            let statusMsg = $('<div style="font-size: 13px; margin: 10px 0; min-height: 20px; color:#feb2b2; text-align:center; font-family:\'Outfit\', sans-serif;"></div>');
            wrapper.append(statusMsg);

            let actionBox = $('<div class="anchor-choices" style="display:flex; flex-direction:column; gap:12px; width:100%;"></div>');
            let cancelBtn = $('<button class="anchor-btn anchor-btn-secondary" style="padding:12px 20px; border-radius:9999px; border:1px solid #27272a; background:transparent; color:#fff; cursor:pointer; font-family:\'Outfit\', sans-serif;">No, close this tab</button>');
            let proceedBtn = $('<button class="anchor-btn anchor-btn-primary" disabled style="padding:12px 20px; border-radius:9999px; border:none; background:#6366f1; color:#fff; opacity:0.5; cursor:not-allowed; font-family:\'Outfit\', sans-serif;">Open Instagram</button>');
            actionBox.append(cancelBtn).append(proceedBtn);
            wrapper.append(actionBox);

            cancelBtn.click(closePreview);
            proceedBtn.click(closePreview);

            mathInput.on('input', function() {
                let val = $(this).val();
                if (val === answer.toString()) {
                    proceedBtn.prop('disabled', false).css({ "opacity": 1, "cursor": "pointer" });
                    mathInput.css('border-color', '#48bb78');
                    statusMsg.text("Match! Click Open Instagram to complete preview.").css("color", "#48bb78");
                } else {
                    proceedBtn.prop('disabled', true).css({ "opacity": 0.5, "cursor": "not-allowed" });
                    mathInput.css('border-color', '#3f3f46');
                    statusMsg.text("");
                }
            });
        }
    }

    // Refresh dashboard data when tab becomes visible
    function refreshDashboardData() {
        chrome.storage.local.get([
            'exclusions', 'allowlist', 'operatingMode', 'closeTabOnLeave',
            'anchorBypassMode', 'anchorBypassTime',
            'reInterventionEnabled', 'reInterventionInterval',
            'scheduleEnabled', 'scheduleStart', 'scheduleEnd', 'scheduleStrict',
            'anchor_stats_total', 'anchor_stats_saved', 'anchor_stats_opened', 'anchor_attempts_log',
            'customDepth', 'scrollBuffer', 'reelLimit', 'reelBuffer', 'cpuSetting', 'anchorEnabled', 'anchorType', 'showDepthIndicator'
        ], function(result) {
            let activeMode = result.operatingMode || 'allowlist';
            let exclusions = result.exclusions || [];
            let allowlist = result.allowlist || [];
            let activeType = result.anchorType || 'basicBreath';
            let showDepthInd = result.showDepthIndicator === undefined ? true : result.showDepthIndicator;
            
            // Re-populate domains list textarea if not editing
            if (!$("#setting--domains-list").is(":focus")) {
                updateDomainsTextarea(activeMode, exclusions, allowlist);
            }
            
            $("#setting--depth-indicator-enabled").prop("checked", showDepthInd);
            updateInterventionTypeUI(activeType);
            
            // Render Overview statistics
            renderOverviewStats(result);
            
            // If details view is active, refresh it
            if (activeDetailSite) {
                let log = result.anchor_attempts_log || [];
                let siteAttempts = log.filter(l => {
                    let logHost = l.host || "";
                    if (logHost.startsWith("www.")) logHost = logHost.substring(4);
                    return logHost === activeDetailSite;
                });

                let total = siteAttempts.length;
                let saved = siteAttempts.filter(l => l.action === 'saved').length;
                let savedMin = saved * 3;

                $("#detail-site-total-prevented").text(saved + "x");
                $("#detail-site-total-saved").text(savedMin + " mins");

                // Filter for last 24h
                let now = Date.now();
                let dayMs = 24 * 60 * 60 * 1000;
                let last24hAttempts = siteAttempts.filter(l => (now - l.timestamp) <= dayMs);
                let last24hSavedCount = last24hAttempts.filter(l => l.action === 'saved').length;
                let last24hSavedMin = last24hSavedCount * 3;

                $("#detail-site-24h-prevented").text(last24hSavedCount + "x");
                $("#detail-site-24h-saved").text(last24hSavedMin + " mins");
            }
        });
    }

    document.addEventListener("visibilitychange", function() {
        if (!document.hidden) {
            refreshDashboardData();
        }
    });
});
