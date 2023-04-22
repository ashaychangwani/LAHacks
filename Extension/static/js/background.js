let toolbarShown = false;

chrome.action.onClicked.addListener(function () {
  chrome.tabs.create({ url: "index.html" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.command === "showToolbar") {
    const options = {
      method: 'GET'
    };
    
    chrome.storage.local.get(['user_id', 'session_id'], function(result) {
      fetch(`http://192.168.65.207:8000/start-session?user_id=${result.user_id}&session_id=${result.session_id}`, options)
      .then(response => response.json())
      .then(response => console.log("TESTING SOMETHING",response))
      .catch(err => console.error("ERROR WHEN TESTING",err));
    });
    toolbarShown = true;
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tab) => {
        console.log("tabid", tab.id);
        chrome.tabs.sendMessage(tab.id, { message: "showToolbar" });
      });
    });
  } else if (message.command === "hideToolbar") {
    const options = {
      method: 'GET'
    };
    
    chrome.storage.local.get(['user_id', 'session_id'], function(result) {
      fetch(`http://192.168.65.207:8000/end-session?user_id=${result.user_id}&session_id=${result.session_id}`, options)
      .then(response => response.json())
      .then(response => console.log("TESTING SOMETHING",response))
      .catch(err => console.error("ERROR WHEN TESTING",err));
    });
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
