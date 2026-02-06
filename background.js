chrome.commands.onCommand.addListener((command) => {
  if (command !== "fix-gibberish") return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]?.id) return;
    chrome.tabs.sendMessage(tabs[0].id, { action: "FIX" });
  });
});
