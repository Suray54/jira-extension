// Function to fetch unresolved tickets assigned to the current user
async function getAssignedTickets(baseUrl) {
  try {
    const apiUrl = `${baseUrl}/rest/api/2/search?jql=assignee=currentUser() AND resolution = Unresolved&maxResults=50`;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      displayTickets(data.issues, baseUrl);
    } else {
      console.error("Failed to fetch tickets:", response.status);
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>Error: ${response.status} - Unable to fetch tickets.</p>`;
    }
  } catch (error) {
    console.error("Error:", error);
    document.getElementById(
      "ticket-container"
    ).innerHTML = `<p>Error: Unable to connect to Jira API.</p>`;
  }
}

// Function to display tickets in a table
function displayTickets(tickets, baseUrl) {
  const container = document.getElementById("ticket-container");

  if (tickets.length === 0) {
    container.innerHTML = "<p>No unresolved tickets assigned to you.</p>";
    return;
  }

  // Create a table to display ticket details
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

  tickets.forEach((ticket) => {
    const status = ticket.fields.status.name.toLowerCase().replace(/ /g, "-");
    const statusClass = getStatusClass(status);

    tableHTML += `
        <tr>
          <td><a href="${baseUrl}/browse/${ticket.key}" target="_blank">${ticket.key}</a></td>
          <td>${ticket.fields.summary}</td>
          <td><span class="status ${statusClass}">${ticket.fields.status.name}</span></td>
        </tr>
      `;
  });

  tableHTML += `
        </tbody>
      </table>
    `;

  container.innerHTML = tableHTML;
}

// Function to map statuses to CSS classes
function getStatusClass(status) {
  if (status.includes("to-do") || status.includes("todo")) return "todo";
  if (status.includes("in-progress")) return "in-progress";
  if (status.includes("done")) return "done";
  return "other";
}

// Initialize the extension
async function init() {
  chrome.runtime.sendMessage({ action: "getBaseUrl" }, (response) => {
    if (!response) {
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>Error: No response from background script.</p>`;
      return;
    }

    if (response.error) {
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>${response.error}</p>`;
    } else if (response.baseUrl) {
      const baseUrl = response.baseUrl;
      getAssignedTickets(baseUrl);
    } else {
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>Error: Unexpected response format.</p>`;
    }
  });
}

// Start the initialization process when the extension loads
init();
