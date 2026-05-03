let selectedMode = 'blocklist';

document.getElementById('opt-blocklist').addEventListener('click', () => {
    selectedMode = 'blocklist';
    document.getElementById('opt-blocklist').classList.add('selected');
    document.getElementById('opt-allowlist').classList.remove('selected');
});

document.getElementById('opt-allowlist').addEventListener('click', () => {
    selectedMode = 'allowlist';
    document.getElementById('opt-allowlist').classList.add('selected');
    document.getElementById('opt-blocklist').classList.remove('selected');
});

document.getElementById('save-btn').addEventListener('click', () => {
    chrome.storage.local.set({operatingMode: selectedMode}, function() {
        window.close(); // Close the tab
    });
});
