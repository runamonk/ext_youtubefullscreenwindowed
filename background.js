chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "toggle-window-fullscreen" });
  } catch {
    // The content script may not yet be ready while the page is loading.
  }
});
