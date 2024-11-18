// Listen for messages from other parts of the extension (like popup or content scripts)
chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
  // Check if the action in the message is "getBaseUrl"
  if (message.action === "getBaseUrl") {
    // Immediately invoked async function to handle the process of fetching the base URL
    (async () => {
      try {
        // Attempt to get all cookies for the '.atlassian.net' domain (Jira domain)
        const cookies = await chrome.cookies.getAll({
          domain: ".atlassian.net", // Jira domain
        });

        // If cookies are found, use the domain to construct the Jira workspace URL
        if (cookies && cookies.length > 0) {
          // Construct the workspace URL from the domain of the first cookie (usually the Jira workspace)
          const workspaceUrl = `https://${cookies[0].domain}`;
          // Send back the base URL to the sender (popup or content script)
          sendResponse({ baseUrl: workspaceUrl });
        } else {
          // If no cookies are found, send an error response indicating that Jira is not logged in
          sendResponse({
            error:
              "Unable to find Jira workspace URL. Make sure you're logged into Jira.",
          });
        }
      } catch (error) {
        // Catch any errors that occurred during the process and send an error response
        console.error("Error fetching Jira base URL:", error);
        sendResponse({ error: "Failed to fetch Jira workspace URL." });
      }
    })();

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});
