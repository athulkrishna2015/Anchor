chrome.storage.local.get(['status'], function(result) {
    let status = result.status;
    if(status === undefined) {
        status = 1;
        chrome.storage.local.set({status: 1});
    }
    
    if(status == 1){
        $("#anchor--toggle input").prop("checked", true);
        $("#anchor--toggle label span").text("on");
    } else {
        $("#anchor--toggle input").prop("checked", false);
        $("#anchor--toggle label span").text("off");
    }
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
$('body').on('click', 'a', function(){
    chrome.tabs.create({url: $(this).attr('href')});
    return false;
});

$("#anchor--info label").mousedown(function(){
    $("#anchor--info label").addClass("button--clicked");
    setTimeout(function(){
        $("#anchor--info label").removeClass("button--clicked");
    }, 100);
    $("body").toggleClass("info--open");
});

