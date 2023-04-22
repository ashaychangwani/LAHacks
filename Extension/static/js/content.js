function getSelectedText() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    return selection.toString();
  }
  return "";
}

function createToolbar(show) {
  let toolbar = document.getElementById("my-toolbar");
  if (!show) {
    if (toolbar) toolbar.remove();
    return;
  }

  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.id = "my-toolbar";
    toolbar.innerHTML = `
    <button class="toolbar-btn my-new-btn" id="add-web-page">Add web page</button>
    <button class="toolbar-btn my-new-btn" id="add-selection">Add selection</button>
    <button class="toolbar-btn my-new-btn" id="add-graphically">Add graphically</button>
    <button class="toolbar-btn my-new-btn" id="add-video">Add video</button>
  `;
    toolbar.style.position = "fixed";
    toolbar.style.top = "0";
    toolbar.style.right = "0"; // changed from "left" to "right"
    toolbar.style.backgroundColor = "#f2f2f2";
    toolbar.style.zIndex = "9999";
    toolbar.style.display = "flex"; // added to make the buttons align vertically
    toolbar.style.flexDirection = "column"; // added to make the buttons align vertically
    document.body.appendChild(toolbar);
  }

  // Add event listeners to the toolbar buttons
  const addWebPageButton = document.getElementById("add-web-page");
  const addSelectionButton = document.getElementById("add-selection");
  const addGraphicallyButton = document.getElementById("add-graphically");
  const addVideoButton = document.getElementById("add-video");

  addWebPageButton.addEventListener("click", () => {
    // add link
    const url = window.location.href;
    console.log(url);
  });

  addSelectionButton.addEventListener("click", () => {
    // code for adding selection
    const selectedText = getSelectedText();
    console.log(selectedText);
  });

  addGraphicallyButton.addEventListener("click", () => {
    // code for adding graphically
    const selectedText = getSelectedText();
    console.log(selectedText);
  });

  addVideoButton.addEventListener("click", () => {
    // code for adding video
    const url = window.location.href;
    console.log(url);
    const cookies = document.cookie;
    console.log(cookies);
  });

  console.log("toolbar built");
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.message === "showToolbar") {
    createToolbar(true);
  } else if (message.message === "hideToolbar") {
    createToolbar(false);
  }
});

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.message === "showToolbar") {
//     console.log("in content show toolbar message received");
//     createToolbar(true);
//   } else if (message.message === "hideToolbar") {
//     createToolbar(false);
//     chrome.storage.local.remove("session_id");
//   }
// });
