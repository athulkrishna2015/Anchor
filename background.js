chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.type === "status") {
      chrome.storage.local.get(['status'], function(result) {
        let currentStatus = result.status;
        if (currentStatus === undefined) currentStatus = 1; // default to 1
        sendResponse({status: currentStatus});
      });
      return true;
    }
});