// js/background.js
// Service Worker for Bond YTM & Pricing Calculator Extension

// Enable persistent Side Panel behavior when clicking extension toolbar icon
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.error('Error configuring side panel behavior:', err);
    });
  }
});

// Re-enforce side panel action click behavior on startup
if (chrome.sidePanel && typeof chrome.sidePanel.setPanelBehavior === 'function') {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});
}
