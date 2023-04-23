let toolbarShown = false;

chrome.action.onClicked.addListener(function () {
  chrome.tabs.create({ url: "index.html" });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("In message", message);
  if (message.command === "showToolbar") {
    const options = {
      method: "GET",
    };

    chrome.storage.local.get(["user_id", "session_id"], function (result) {
      fetch(
        `http://128.122.49.69:20440/start-session?user_id=${result.user_id}&session_id=${result.session_id}&session_name=abc`,
        options
      )
        .then((response) => response.json())
        .then((response) => {
          console.log("TESTING SOMETHING", response);
          sendResponse({ success: true });
        })
        .catch((err) => {
          console.error("ERROR WHEN TESTING", err);
          sendResponse({ success: false });
        });
    });
    toolbarShown = true;
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tab) => {
        console.log("tabid", tab.id);
        chrome.tabs.sendMessage(tab.id, { message: "showToolbar" });
      });
    });
    return true;
  } else if (message.command === "hideToolbar") {
    const options = {
      method: "GET",
    };

    chrome.storage.local.get(["user_id", "session_id"], function (result) {
      fetch(
        `http://128.122.49.69:20440/end-session?user_id=${result.user_id}&session_id=${result.session_id}&session_name=abc`,
        options
      )
        .then((response) => response.json())
        .then((response) => {
          console.log("TESTING SOMETHING", response);
          sendResponse({ success: true });
        })
        .catch((err) => {
          sendResponse({ success: false });
        });
    });
    toolbarShown = false;
    chrome.tabs.query({}, function (tabs) {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, { message: "hideToolbar" });
      });
    });
    return true;
  } else if (message.command === "url") {
    console.log("IN URL");
    chrome.storage.local.get(["user_id", "session_id"], function (result) {
      const data = {
        text: message.text,
        source: message.url,
        user_id: result.user_id,
        session_id: result.session_id,
      };

      fetch("http://128.122.49.69:20440/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("POST response of URL:", data);
          // Do something with the response data here
        })
        .catch((error) => {
          console.error("Error sending POST request:", error);
        });
    });

    sendResponse({ success: true });
    return true;
  } else if (message.command === "selectedText") {
    console.log("In selectedText");
    chrome.storage.local.get(["user_id", "session_id"], function (result) {
      const data = {
        text: message.text,
        source: message.url,
        user_id: result.user_id,
        session_id: result.session_id,
      };

      fetch("http://128.122.49.69:20440/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("POST response of selectedText:", data);
          // Do something with the response data here
        })
        .catch((error) => {
          console.error("Error sending POST request:", error);
        });
    });

    sendResponse({ success: true });
    return true;
  } else if (message.command === "generateGraph") {
    console.log("In generateGraph");
    chrome.storage.local.get(["user_id", "session_id"], function (result) {
      const data = {
        content: message.text,
        reference_url: message.url,
        user_id: result.user_id,
        session_id: result.session_id,
      };

      fetch("http://128.122.49.69:20440/graph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("POST response of graph:", data);
          // Do something with the response data here
        })
        .catch((error) => {
          console.error("Error sending POST request:", error);
        });
    });

    sendResponse({ success: true });
    return true;
  } else if (message.command === "ytsummarize") {
    console.log("In ytsummarize");
    chrome.storage.local.get(["user_id", "session_id"], function (result) {
      const data = {
        title: message.title,
        url: message.url,
        user_id: result.user_id,
        session_id: result.session_id,
      };

      fetch("http://128.122.49.69:20440/yt-summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("POST response of yt-summarize:", data);
          // Do something with the response data here
        })
        .catch((error) => {
          console.error("Error sending POST request:", error);
        });
    });

    sendResponse({ success: true });
    return true;
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
