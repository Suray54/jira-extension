// Function to fetch assigned Jira tickets
async function getAssignedTickets(baseUrl) {
  try {
    const apiUrl = `${baseUrl}/rest/api/2/search?jql=assignee=currentUser() AND resolution=Unresolved ORDER BY updated DESC&maxResults=15`;
    // Constructs the URL for the Jira API to fetch unresolved tickets assigned to the current user

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    // Sends a GET request to the Jira API with necessary headers

    if (response.ok) {
      const data = await response.json();
      // If the response is OK, parse the response body as JSON

      displayTickets(data.issues, baseUrl);
      // Pass the ticket data to the `displayTickets` function for rendering

      if (data.total > 15) addJiraLink(baseUrl);
      // If there are more than 15 tickets, add a link to view all tickets in Jira
    } else {
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>Error: ${response.status} - Unable to fetch tickets.</p>`;
      // If the response is not OK, display an error message
    }
  } catch (error) {
    document.getElementById(
      "ticket-container"
    ).innerHTML = `<p>Error: Unable to connect to Jira API.</p>`;
    // If an error occurs during the fetch, show a connection error message
  }
}

// Function to display the tickets in a table format
function displayTickets(tickets, baseUrl) {
  const container = document.getElementById("ticket-container");

  if (tickets.length === 0) {
    container.innerHTML = "<p>No unresolved tickets assigned to you.</p>";
    return;
  }
  // If no tickets are found, display a message saying "No unresolved tickets"

  let tableHTML = `
    <table data-baseurl="${baseUrl}">
      <thead>
        <tr>
          <th>Key</th>
          <th>Summary</th>
          <th>Status</th>
          <th>Time Tracking</th>
        </tr>
      </thead>
      <tbody>
  `;
  // Creates the initial part of the table HTML structure

  tickets.forEach((ticket) => {
    const statusClass = getStatusClass(
      ticket.fields.status.name.toLowerCase().replace(/ /g, "-")
    );
    // Determines the appropriate CSS class for the ticket's status

    const iconUrl = ticket.fields.issuetype.iconUrl;
    // Retrieves the icon URL for the ticket's issue type

    tableHTML += `
      <tr>
        <td>
          <a href="${baseUrl}/browse/${ticket.key}" target="_blank">
            <img src="${iconUrl}" alt="icon" class="ticket-icon">${ticket.key}
          </a>
        </td>
        <td>${ticket.fields.summary}</td>
        <td><span class="status ${statusClass}">${ticket.fields.status.name}</span></td>
        <td>
          <div class="time-tracking">
            <input type="text" class="time-input" data-key="${ticket.key}" placeholder="1h, 1d 2h" />
            <button class="time-submit" data-key="${ticket.key}">Add</button>
          </div>
          <div id="feedback-${ticket.key}" class="feedback"></div>
        </td>
      </tr>
    `;
    // Creates the table rows for each ticket with its key, summary, status, and time tracking inputs
  });

  tableHTML += "</tbody></table>";
  container.innerHTML = tableHTML;
  // Finishes the table structure and sets the innerHTML of the container to the generated table
}

// Event listener to handle click events on time tracking buttons
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("time-submit")) {
    const ticketKey = event.target.getAttribute("data-key");
    const baseUrl = event.target.closest("table").dataset.baseurl;
    addTime(baseUrl, ticketKey);
    // If the clicked element is the time-submit button, it calls addTime with the ticket's key
  }
});

// Function to add time to a Jira ticket
async function addTime(baseUrl, ticketKey) {
  const input = document.querySelector(`.time-input[data-key="${ticketKey}"]`);
  const feedback = document.getElementById(`feedback-${ticketKey}`);
  const timeValue = input.value.trim();
  // Retrieves the value from the time input and trims it to avoid extra spaces

  if (!timeValue) {
    feedback.textContent = "Please enter a time value.";
    feedback.className = "feedback error";
    return;
  }
  // If the time value is empty, shows an error feedback message

  try {
    const apiUrl = `${baseUrl}/rest/api/2/issue/${ticketKey}/worklog`;
    // Constructs the API URL for adding worklog to the specific ticket

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeSpent: timeValue }),
    });
    // Sends a POST request to Jira API with the time spent as the body

    if (response.ok) {
      feedback.textContent = "Time added successfully.";
      feedback.className = "feedback success";
      input.value = "";
      // If successful, display success feedback and clear the input field
    } else {
      feedback.textContent = `Error: ${response.status} - Unable to add time.`;
      feedback.className = "feedback error";
      // If there’s an error, display the error feedback
    }
  } catch (error) {
    feedback.textContent = "Failed to connect to Jira API.";
    feedback.className = "feedback error";
    // If there’s a connection issue, display the corresponding error message
  }
}

// Function to determine the CSS class based on the ticket's status
function getStatusClass(status) {
  if (status.includes("to-do")) return "todo";
  if (status.includes("in-progress")) return "in-progress";
  if (status.includes("done")) return "done";
  return "other";
  // Returns the corresponding class name for the status
}

// Function to add a link to view all unresolved tickets in Jira if there are more than 15 tickets
function addJiraLink(baseUrl) {
  const container = document.getElementById("ticket-container");
  container.innerHTML += `<p><a href="${baseUrl}/issues/?filter=-1" target="_blank">View all unresolved tickets in Jira</a></p>`;
  // Appends a link to the Jira ticket list if there are more than 15 tickets
}

// Initializing function to fetch base URL and load assigned tickets
function init() {
  chrome.runtime.sendMessage({ action: "getBaseUrl" }, (response) => {
    if (!response) {
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>Error: No response from background script.</p>`;
      return;
    }
    // Sends a message to the background script to get the base URL for the Jira instance

    if (response.error) {
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>${response.error}</p>`;
      // If there is an error response, display the error message
    } else if (response.baseUrl) {
      getAssignedTickets(response.baseUrl);
      // If a base URL is received, fetch the assigned tickets
    }
  });
}

init();
// Calls the init function to kick off the process
