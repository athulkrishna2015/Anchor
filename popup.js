let currentHostname = "";

chrome.storage.local.get(['status', 'exclusions', 'customDepth', 'cpuSetting'], function(result) {
    let status = result.status === undefined ? 1 : result.status;
    let exclusions = result.exclusions || [];
    let customDepth = result.customDepth || 10;
    let cpuSetting = result.cpuSetting || 'high';

    if(status == 1){
        $("#anchor--toggle input").prop("checked", true);
        $("#anchor--toggle label span").text("on");
    } else {
        $("#anchor--toggle input").prop("checked", false);
        $("#anchor--toggle label span").text("off");
    }

    $("#setting--depth").val(customDepth);
    $("#setting--cpu").val(cpuSetting);

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && tabs[0].url) {
            try {
                let url = new URL(tabs[0].url);
                currentHostname = url.hostname;
                $("#current-domain").text(currentHostname);
                if (exclusions.includes(currentHostname)) {
                    $("#setting--exclude").prop("checked", true);
                }
            } catch(e) {
                $("#current-domain").text("invalid URL");
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
    if(!currentHostname) return;

    chrome.storage.local.get(['exclusions'], function(result) {
        let exclusions = result.exclusions || [];
        if (isExcluded) {
            if (!exclusions.includes(currentHostname)) exclusions.push(currentHostname);
        } else {
            exclusions = exclusions.filter(h => h !== currentHostname);
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
