var saveToken = null;
document.addEventListener("DOMContentLoaded", function () {
  // Check if user is already logged in
  chrome.identity.getAuthToken({ interactive: true }, function (token) {
    if (token) {
      saveToken = token;
      // Perform API request to validate token and retrieve user data
      fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          // Show the Start Session button
          document.getElementById("start-session").style.display =
            "inline-block";
          document.getElementById("logout").style.display = "inline-block";

          // Hide the Login button
          document.getElementById("login").style.display = "none";

          console.log("Logged in user: ", data);
          chrome.storage.local.set({ user_id: data.email });
        })
        .catch((error) => {
          console.error(error);
        });
    }
  });

  // Handle Login button click event
  document.getElementById("login").addEventListener("click", function () {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      // Perform API request to validate token and retrieve user data
      fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: {
          Authorization: "Bearer " + token,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          // Show the Start Session button
          document.getElementById("start-session").style.display =
            "inline-block";
          document.getElementById("login").style.display = "none";
          document.getElementById("logout").style.display = "inline-block";

          console.log("Logged in user: ", data);
        })
        .catch((error) => {
          console.error(error);
        });
    });
  });

  document.getElementById("logout").addEventListener("click", function () {
    chrome.identity.removeCachedAuthToken({ token: saveToken }, function () {});
    chrome.identity.clearAllCachedAuthTokens(function () {
      // Hide the Start Session button and show the Login button
      document.getElementById("start-session").style.display = "none";
      document.getElementById("login").style.display = "inline-block";
      document.getElementById("logout").style.display = "none";
    });
  })
});
