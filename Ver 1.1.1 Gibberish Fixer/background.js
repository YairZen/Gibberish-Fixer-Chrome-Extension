chrome.commands.onCommand.addListener((command) => {
  if (command !== "fix-gibberish") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;

    chrome.tabs.sendMessage(tabId, { action: "FIX" }, () => {
      void chrome.runtime.lastError;
    });
  });
});
