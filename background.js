chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "status") {
      chrome.storage.local.get(['status', 'exclusions', 'allowlist', 'operatingMode', 'customDepth', 'cpuSetting', 'reelLimit', 'scrollBuffer', 'reelBuffer'], function(result) {
        let currentStatus = result.status;
        if (currentStatus === undefined) currentStatus = 1; // default to 1
        
        let mode = result.operatingMode || 'blocklist';
        let isExcluded = false;
        
        if (sender.tab && sender.tab.url) {
            try {
                let url = new URL(sender.tab.url);
                if (mode === 'blocklist') {
                    if (result.exclusions) {
                        isExcluded = result.exclusions.some(ex => url.hostname === ex || url.hostname.endsWith('.' + ex));
                    }
                } else if (mode === 'allowlist') {
                    if (result.allowlist) {
                        isExcluded = !result.allowlist.some(ex => url.hostname === ex || url.hostname.endsWith('.' + ex));
                    } else {
                        isExcluded = true; // Blocked everywhere by default
                    }
                }
            } catch(e) {}
        }
        
        sendResponse({
            status: currentStatus,
            isExcluded: isExcluded,
            customDepth: result.customDepth || 10,
            cpuSetting: result.cpuSetting || 'high',
            reelLimit: result.reelLimit || 10,
            scrollBuffer: result.scrollBuffer !== undefined ? result.scrollBuffer : 2,
            reelBuffer: result.reelBuffer !== undefined ? result.reelBuffer : 2
        });
      });
      return true;
    }
});

chrome.runtime.onInstalled.addListener(function(details) {
    if (details.reason === "install") {
        chrome.tabs.create({url: "onboarding.html"});
    }
});