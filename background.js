chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "status") {
      chrome.storage.local.get(['status', 'exclusions', 'customDepth', 'cpuSetting', 'reelLimit'], function(result) {
        let currentStatus = result.status;
        if (currentStatus === undefined) currentStatus = 1; // default to 1
        
        let isExcluded = false;
        if (sender.tab && sender.tab.url) {
            try {
                let url = new URL(sender.tab.url);
                if (result.exclusions && result.exclusions.includes(url.hostname)) {
                    isExcluded = true;
                }
            } catch(e) {}
        }
        
        sendResponse({
            status: currentStatus,
            isExcluded: isExcluded,
            customDepth: result.customDepth || 10,
            cpuSetting: result.cpuSetting || 'high',
            reelLimit: result.reelLimit || 10
        });
      });
      return true;
    }
});