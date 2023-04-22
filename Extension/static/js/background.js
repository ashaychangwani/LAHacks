let toolbarShown = false;

chrome.action.onClicked.addListener(function () {
  chrome.tabs.create({ url: "index.html" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "showToolbar") {
    toolbarShown = true;
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tab) => {
        console.log("tabid", tab.id);
        chrome.tabs.sendMessage(tab.id, { message: "showToolbar" });
      });
    });
  } else if (message.command === "hideToolbar") {
    toolbarShown = false;
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { message: "hideToolbar" });
      });
    });
  } else if (message.command === "url") {
    console.log("background", message.url);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (toolbarShown) {
    chrome.tabs.sendMessage(tabId, { message: "showToolbar" });
  }
  //   else {
  //     chrome.tabs.sendMessage(tabId, { message: "hideToolbar" });
  //   }
});
