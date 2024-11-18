// Function to fetch unresolved tickets assigned to the current user
async function getAssignedTickets(baseUrl) {
  try {
    // Construct the API URL to get unresolved tickets for the current user, ordered by last updated date (max 15)
    const apiUrl = `${baseUrl}/rest/api/2/search?jql=assignee=currentUser() AND resolution=Unresolved ORDER BY updated DESC&maxResults=15`;

    // Send GET request to the Jira API
    const response = await fetch(apiUrl, {
      method: "GET", // HTTP method
      headers: {
        "Content-Type": "application/json", // The content type is JSON
      },
    });

    // Check if the response from the Jira API is OK (status code 200)
    if (response.ok) {
      // Parse the response body as JSON
      const data = await response.json();
      // Display the tickets in a table
      displayTickets(data.issues, baseUrl);

      // Check if there are more than 15 tickets (to show the 'view all' link)
      if (data.total > 15) {
        addJiraLink(baseUrl); // Add the "View all unresolved tickets" link
      }
    } else {
      // If response is not OK, show an error message
      console.error("Failed to fetch tickets:", response.status);
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>Error: ${response.status} - Unable to fetch tickets.</p>`;
    }
  } catch (error) {
    // If an error occurs in the try block, log the error and show an error message
    console.error("Error:", error);
    document.getElementById(
      "ticket-container"
    ).innerHTML = `<p>Error: Unable to connect to Jira API.</p>`;
  }
}

// Function to display the fetched tickets in a table format
function displayTickets(tickets, baseUrl) {
  const container = document.getElementById("ticket-container");

  // If no tickets are returned, display a message saying "No unresolved tickets"
  if (tickets.length === 0) {
    container.innerHTML = "<p>No unresolved tickets assigned to you.</p>";
    return;
  }

  // Start the table structure
  let tableHTML = `
      <table>
        <thead>
          <tr>
            <th style="width: 20%;">Key</th>
            <th style="width: 60%;">Summary</th>
            <th style="width: 20%;">Status</th>
          </tr>
        </thead>
        <tbody>
    `;

  // Loop through each ticket and create a row in the table for each one
  tickets.forEach((ticket) => {
    // Get the status of the ticket (convert to lowercase and replace spaces with dashes for CSS class)
    const status = ticket.fields.status.name.toLowerCase().replace(/ /g, "-");
    // Get the corresponding CSS class based on the ticket status (to color the status badge)
    const statusClass = getStatusClass(status);
    // Get the icon URL for the ticket's issue type
    const iconUrl = ticket.fields.issuetype.iconUrl;

    // Create a table row for the ticket
    tableHTML += `
        <tr>
          <td>
            <a href="${baseUrl}/browse/${ticket.key}" target="_blank">
             <img src="${iconUrl}" alt="icon" class="ticket-icon">${ticket.key}
            </a>
          </td>
          <td>${ticket.fields.summary}</td>
          <td><span class="status ${statusClass}">${ticket.fields.status.name}</span></td>
        </tr>
      `;
  });

  // End the table structure
  tableHTML += `
        </tbody>
      </table>
    `;

  // Insert the table into the container element
  container.innerHTML = tableHTML;
}

// Function to map the status to a specific CSS class for color coding
function getStatusClass(status) {
  // If the status includes 'to-do' or 'todo', return the 'todo' class
  if (status.includes("to-do") || status.includes("todo")) return "todo";
  // If the status includes 'in-progress', return the 'in-progress' class
  if (status.includes("in-progress")) return "in-progress";
  // If the status includes 'done', return the 'done' class
  if (status.includes("done")) return "done";
  // If no status matches, return 'other' as the default
  return "other";
}

// Function to add a link to the Jira ticket list page if there are more than 15 tickets
function addJiraLink(baseUrl) {
  const container = document.getElementById("ticket-container");
  // Add a link to view all unresolved tickets in Jira
  const jiraLinkHTML = `
    <p><a href="${baseUrl}/issues/?filter=-1" target="_blank">View all unresolved tickets in Jira</a></p>
  `;
  // Append the link to the container after the ticket table
  container.innerHTML += jiraLinkHTML;
}

// Initialize the extension by fetching the base URL of the Jira instance
async function init() {
  // Send a message to the background script to get the base URL of the Jira instance
  chrome.runtime.sendMessage({ action: "getBaseUrl" }, (response) => {
    // If no response is received, show an error message
    if (!response) {
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>Error: No response from background script.</p>`;
      return;
    }

    // If there is an error in the response, display the error message
    if (response.error) {
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>${response.error}</p>`;
    } else if (response.baseUrl) {
      // If the base URL is provided, fetch the assigned tickets
      const baseUrl = response.baseUrl;
      getAssignedTickets(baseUrl);
    } else {
      // If the response is unexpected, display an error message
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>Error: Unexpected response format.</p>`;
    }
  });
}

// Start the initialization process when the extension loads
init();
