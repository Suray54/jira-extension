chrome.runtime.onMessage.addListener((message, sendResponse) => {
  if (message.action === "getBaseUrl") {
    (async () => {
      try {
        // Get cookies for Jira workspace
        const cookies = await chrome.cookies.getAll({
          domain: ".atlassian.net",
        });

        if (cookies && cookies.length > 0) {
          const workspaceUrl = `https://${cookies[0].domain}`;
          sendResponse({ baseUrl: workspaceUrl });
        } else {
          sendResponse({
            error:
              "Unable to find Jira workspace URL. Make sure you're logged into Jira.",
          });
        }
      } catch (error) {
        console.error("Error fetching Jira base URL:", error);
        sendResponse({ error: "Failed to fetch Jira workspace URL." });
      }
    })();

    // Return true to indicate asynchronous response
    return true;
  }
});
