// Popup script for managing settings
const blockImagesToggle = document.getElementById('blockImages');
const blockVideosToggle = document.getElementById('blockVideos');

// Load current settings
async function loadSettings() {
  const settings = await chrome.storage.sync.get({
    blockImages: true,
    blockVideos: true
  });

  blockImagesToggle.checked = settings.blockImages;
  blockVideosToggle.checked = settings.blockVideos;
}

// Save settings
async function saveSetting(key, value) {
  await chrome.storage.sync.set({ [key]: value });

  // Reload current tab to apply changes
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.reload(tab.id);
  }
}

// Event listeners for toggles
blockImagesToggle.addEventListener('change', (e) => {
  saveSetting('blockImages', e.target.checked);
});

blockVideosToggle.addEventListener('change', (e) => {
  saveSetting('blockVideos', e.target.checked);
});

// Initialize on popup open
loadSettings();
