function getSelectedText() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    return selection.toString();
  }
  return "";
}

function createToolbar(show) {
  let toolbar = document.getElementById("floating-toolbar");
  if (!show) {
    if (toolbar) toolbar.remove();
    return;
  }

  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.id = "floating-toolbar";
    toolbar.innerHTML = `<div id="button-container">
      <button class="my-round-btn" id="expand-btn">⏚</button>
      <div id="buttons" class="hidden">
        <button class="tooltip my-round-btn" id="add-web-page">📃<span class="tooltiptext">Add Web Page</span></button>
        <button class="tooltip my-round-btn" id="add-graphically">📊<span class="tooltiptext">Generate Graph</span></button>
        <button class="tooltip my-round-btn" id="add-video">📹<span class="tooltiptext">Add Video</span></button>
        <button class="tooltip my-round-btn" id="add-selection">📋<span class="tooltiptext">Add Selected Text</span></button>
      </div>
    </div>
<script>
  const buttons = document.getElementById('buttons');
  const expandBtn = document.getElementById('expand-btn');
  let timerId;

  function hideButtons() {
    buttons.classList.remove('visible');
  }

  function showButtons() {
    buttons.classList.add('visible');
  }

  expandBtn.addEventListener('mouseenter', function () {
    clearTimeout(timerId);
    showButtons();
  });

  buttons.addEventListener('mouseleave', function () {
    timerId = setTimeout(hideButtons, 500);
  });

  buttons.addEventListener('mouseenter', function () {
    clearTimeout(timerId);
  });

  expandBtn.addEventListener('mouseleave', function () {
    timerId = setTimeout(hideButtons, 500);
  });


</script>
  `;
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
    chrome.runtime.sendMessage(
      { command: "url", url: url, text: document.body.innerText },
      function (response) {
        console.log("Full Web Page Sent");
      }
    );
  });

  addSelectionButton.addEventListener("click", () => {
    // code for adding selection
    const selectedText = getSelectedText();
    const url = window.location.href;
    chrome.runtime.sendMessage(
      { command: "selectedText", url: url, text: selectedText },
      function (response) {
        console.log("Selected Text was Sent");
      }
    );
  });

  addGraphicallyButton.addEventListener("click", () => {
    // code for adding graphically
    const selectedText = getSelectedText();
    const url = window.location.href;
    chrome.runtime.sendMessage(
      { command: "generateGraph", url: url, text: selectedText },
      function (response) {
        console.log("Graph Text was Sent");
      }
    );
  });

  addVideoButton.addEventListener("click", () => {
    const url = window.location.href;
    // const cookies = document.cookie;
    chrome.runtime.sendMessage(
      { command: "ytsummarize", url: url, title: "PLACEHOLDER" },
      function (response) {
        console.log("Video link was Sent");
      }
    );
  });

  console.log("toolbar built");
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.message === "showToolbar") {
    createToolbar(true);
  } else if (message.message === "hideToolbar") {
    createToolbar(false);
    chrome.storage.local.remove("session_id");
  }
});
