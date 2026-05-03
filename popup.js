let currentHostname = "";

chrome.storage.local.get(['status', 'exclusions', 'customDepth', 'reelLimit', 'cpuSetting'], function(result) {
    let status = result.status === undefined ? 1 : result.status;
    let exclusions = result.exclusions || [];
    let customDepth = result.customDepth || 10;
    let reelLimit = result.reelLimit || 10;
    let cpuSetting = result.cpuSetting || 'high';

    if(status == 1){
        $("#anchor--toggle input").prop("checked", true);
        $("#anchor--toggle label span").text("on");
    } else {
        $("#anchor--toggle input").prop("checked", false);
        $("#anchor--toggle label span").text("off");
    }

    $("#setting--depth").val(customDepth);
    $("#setting--reel-limit").val(reelLimit);
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
                    $("#setting--exclude").prop("checked", exclusions.includes(selected));
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

$("#setting--exclude").change(function() {
    let isExcluded = $(this).is(":checked");
    let targetDomain = $("#current-domain-select").val();
    if(!targetDomain || targetDomain === "invalid URL") return;

    chrome.storage.local.get(['exclusions'], function(result) {
        let exclusions = result.exclusions || [];
        if (isExcluded) {
            if (!exclusions.includes(targetDomain)) exclusions.push(targetDomain);
        } else {
            exclusions = exclusions.filter(h => h !== targetDomain);
        }
        chrome.storage.local.set({exclusions: exclusions}, function() {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                if (tabs[0]) chrome.tabs.reload(tabs[0].id);
            });
        });
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
