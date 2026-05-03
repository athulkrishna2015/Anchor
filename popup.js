let currentHostname = "";

chrome.storage.local.get(['status', 'exclusions', 'allowlist', 'operatingMode', 'customDepth', 'reelLimit', 'cpuSetting', 'scrollBuffer', 'reelBuffer'], function(result) {
    let status = result.status === undefined ? 1 : result.status;
    let exclusions = result.exclusions || [];
    let allowlist = result.allowlist || [];
    let operatingMode = result.operatingMode || 'blocklist';
    let customDepth = result.customDepth || 10;
    let reelLimit = result.reelLimit || 10;
    let cpuSetting = result.cpuSetting || 'high';
    let scrollBuffer = result.scrollBuffer !== undefined ? result.scrollBuffer : 2;
    let reelBuffer = result.reelBuffer !== undefined ? result.reelBuffer : 2;

    if(status == 1){
        $("#anchor--toggle input").prop("checked", true);
        $("#anchor--toggle label span").text("on");
    } else {
        $("#anchor--toggle input").prop("checked", false);
        $("#anchor--toggle label span").text("off");
    }

    $("#setting--depth").val(customDepth);
    $("#setting--operating-mode").val(operatingMode);
    $("#setting--scroll-buffer").val(scrollBuffer);
    $("#setting--reel-limit").val(reelLimit);
    $("#setting--reel-buffer").val(reelBuffer);
    $("#setting--cpu").val(cpuSetting);

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url) {
            try {
                let url = new URL(tabs[0].url);
                currentHostname = url.hostname;
                
                let select = $("#current-domain-select");
                select.empty();
                
                select.append(new Option(currentHostname, currentHostname));
                
                let parts = currentHostname.split('.');
                if (parts.length > 2) {
                    let baseDomain = parts.slice(-2).join('.');
                    select.append(new Option(baseDomain, baseDomain));
                }
                
                function updateCheckbox() {
                    let selected = select.val();
                    if ($("#setting--operating-mode").val() === 'blocklist') {
                        $("#setting--exclude").prop("checked", exclusions.includes(selected));
                        $("#list-action-text").text("Disable on:");
                    } else {
                        $("#setting--exclude").prop("checked", allowlist.includes(selected));
                        $("#list-action-text").text("Enable on:");
                    }
                }
                
                select.change(updateCheckbox);
                updateCheckbox();
                
            } catch(e) {
                let select = $("#current-domain-select");
                select.empty();
                select.append(new Option("invalid URL", "invalid URL"));
            }
        }
    });
});

$("#anchor--toggle").mousedown(function(){
    chrome.storage.local.get(['status'], function(result) {
        if($("#anchor--input").is(":checked")){
            chrome.storage.local.set({status: 0}, function() {
                $("#anchor--toggle label span").text("off");
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) chrome.tabs.reload(tabs[0].id);
                });
            });
        } else {
            chrome.storage.local.set({status: 1}, function() {
                $("#anchor--toggle label span").text("on");
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) chrome.tabs.reload(tabs[0].id);
                });
            });
        }
    });
});

$("#setting--operating-mode").change(function() {
    let mode = $(this).val();
    chrome.storage.local.set({operatingMode: mode}, function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) chrome.tabs.reload(tabs[0].id);
        });
        window.location.reload();
    });
});

$("#setting--exclude").change(function() {
    let isChecked = $(this).is(":checked");
    let targetDomain = $("#current-domain-select").val();
    if(!targetDomain || targetDomain === "invalid URL") return;

    chrome.storage.local.get(['operatingMode', 'exclusions', 'allowlist'], function(result) {
        let mode = result.operatingMode || 'blocklist';
        let exclusions = result.exclusions || [];
        let allowlist = result.allowlist || [];
        
        if (mode === 'blocklist') {
            if (isChecked) {
                if (!exclusions.includes(targetDomain)) exclusions.push(targetDomain);
            } else {
                exclusions = exclusions.filter(h => h !== targetDomain);
            }
            chrome.storage.local.set({exclusions: exclusions}, function() {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) chrome.tabs.reload(tabs[0].id);
                });
            });
        } else {
            if (isChecked) {
                if (!allowlist.includes(targetDomain)) allowlist.push(targetDomain);
            } else {
                allowlist = allowlist.filter(h => h !== targetDomain);
            }
            chrome.storage.local.set({allowlist: allowlist}, function() {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    if (tabs[0]) chrome.tabs.reload(tabs[0].id);
                });
            });
        }
    });
});

$("#setting--depth").change(function() {
    let val = parseInt($(this).val());
    if (val > 0) {
        chrome.storage.local.set({customDepth: val}, function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) chrome.tabs.reload(tabs[0].id);
            });
        });
    }
});

$("#setting--reel-limit").change(function() {
    let val = parseInt($(this).val());
    if (val > 0) {
        chrome.storage.local.set({reelLimit: val}, function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) chrome.tabs.reload(tabs[0].id);
            });
        });
    }
});

$("#setting--scroll-buffer").change(function() {
    let val = parseInt($(this).val());
    if (val >= 0) {
        chrome.storage.local.set({scrollBuffer: val}, function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) chrome.tabs.reload(tabs[0].id);
            });
        });
    }
});

$("#setting--reel-buffer").change(function() {
    let val = parseInt($(this).val());
    if (val >= 0) {
        chrome.storage.local.set({reelBuffer: val}, function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) chrome.tabs.reload(tabs[0].id);
            });
        });
    }
});

$("#setting--cpu").change(function() {
    let val = $(this).val();
    chrome.storage.local.set({cpuSetting: val}, function() {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (tabs[0]) chrome.tabs.reload(tabs[0].id);
        });
    });
});

$('body').on('click', 'a', function(){
    chrome.tabs.create({url: $(this).attr('href')});
    return false;
});

$("#anchor--info label").mousedown(function(){
    $("#anchor--info label").addClass("button--clicked");
    setTimeout(function(){
        $("#anchor--info label").removeClass("button--clicked");
    }, 100);
    $("body").removeClass("settings--open");
    $("body").toggleClass("info--open");
});

$("#anchor--settings-btn label").mousedown(function(){
    $("#anchor--settings-btn label").addClass("button--clicked");
    setTimeout(function(){
        $("#anchor--settings-btn label").removeClass("button--clicked");
    }, 100);
    $("body").removeClass("info--open");
    $("body").toggleClass("settings--open");
});
