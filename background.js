chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "status") {
      chrome.storage.local.get(['status', 'exclusions', 'customDepth', 'cpuSetting', 'reelLimit', 'scrollBuffer', 'reelBuffer'], function(result) {
        let currentStatus = result.status;
        if (currentStatus === undefined) currentStatus = 1; // default to 1
        
        let isExcluded = false;
        if (sender.tab && sender.tab.url) {
            try {
                let url = new URL(sender.tab.url);
                if (result.exclusions) {
                    isExcluded = result.exclusions.some(ex => url.hostname === ex || url.hostname.endsWith('.' + ex));
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