// Default settings - Kernel Mode is always enabled
const DEFAULT_SETTINGS = {
  blockImages: true,
  blockVideos: true,
  kernelMode: true
};

// Initialize settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  await chrome.storage.sync.set(settings);
  console.log('Kernel Mode initialized with settings:', settings);

  // Update declarativeNetRequest rules
  await updateBlockingRules(settings);
});

// Listen for settings changes to update blocking rules
chrome.storage.onChanged.addListener(async (changes, areaName) => {
  if (areaName === 'sync') {
    const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    await updateBlockingRules(settings);
  }
});

// Update declarativeNetRequest rules based on settings
async function updateBlockingRules(settings) {
  const rules = [];
  let ruleId = 1;

  // Block images if enabled
  if (settings.blockImages) {
    rules.push({
      id: ruleId++,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '*',
        resourceTypes: ['image']
      }
    });
  }

  // Block videos if enabled
  if (settings.blockVideos) {
    rules.push({
      id: ruleId++,
      priority: 1,
      action: { type: 'block' },
      condition: {
        urlFilter: '*',
        resourceTypes: ['media']
      }
    });
  }

  // Remove old rules and add new ones
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const ruleIdsToRemove = existingRules.map(rule => rule.id);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: ruleIdsToRemove,
    addRules: rules
  });

  console.log('Updated blocking rules:', rules);
}
