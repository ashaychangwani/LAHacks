function generateUUID() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) =>
    (
      c ^
      (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
    ).toString(16)
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const startButton = document.getElementById("start-session");
  const sessionUUID = document.getElementById("session-uuid");

  chrome.storage.local.get(
    ["sessionActive", "sessionUUID"],
    ({ sessionActive, sessionUUID: uuid }) => {
      if (sessionActive) {
        startButton.innerText = "End Session";
        sessionUUID.innerText = uuid;
        sessionUUID.parentElement.parentElement.classList.remove("d-none");
      }
    }
  );

  startButton.addEventListener("click", () => {
    chrome.storage.local.get(
      ["sessionActive", "sessionUUID"],
      ({ sessionActive, sessionUUID: uuid }) => {
        if (!sessionActive) {
          const newUUID = generateUUID();
          chrome.storage.local.set({ session_id: newUUID });
          chrome.runtime.sendMessage({ command: "showToolbar" });
          startButton.innerText = "End Session";
          sessionUUID.innerText = newUUID;
          sessionUUID.parentElement.parentElement.classList.remove("d-none");
        } else {
          chrome.runtime.sendMessage({ command: "hideToolbar" });
          startButton.innerText = "Start Session";
          sessionUUID.parentElement.parentElement.classList.add("d-none");
        }
        chrome.storage.local.set({ sessionActive: !sessionActive });
      }
    );
  });
});
