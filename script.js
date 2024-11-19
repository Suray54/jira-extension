async function getAssignedTickets(baseUrl) {
  try {
    const apiUrl = `${baseUrl}/rest/api/2/search?jql=assignee=currentUser() AND resolution=Unresolved ORDER BY updated DESC&maxResults=15`;
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      displayTickets(data.issues, baseUrl);

      if (data.total > 15) addJiraLink(baseUrl);
    } else {
      document.getElementById(
        "ticket-container"
      ).innerHTML = `<p>Error: ${response.status} - Unable to fetch tickets.</p>`;
    }
  } catch (error) {
    document.getElementById(
      "ticket-container"
    ).innerHTML = `<p>Error: Unable to connect to Jira API.</p>`;
  }
}

function displayTickets(tickets, baseUrl) {
  const container = document.getElementById("ticket-container");

  if (tickets.length === 0) {
    container.innerHTML = "<p>No unresolved tickets assigned to you.</p>";
    return;
  }

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

  tickets.forEach((ticket) => {
    const statusClass = getStatusClass(
      ticket.fields.status.name.toLowerCase().replace(/ /g, "-")
    );
    const iconUrl = ticket.fields.issuetype.iconUrl;

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
  });

  tableHTML += "</tbody></table>";
  container.innerHTML = tableHTML;
}

document.addEventListener("click", (event) => {
  if (event.target.classList.contains("time-submit")) {
    const ticketKey = event.target.getAttribute("data-key");
    const baseUrl = event.target.closest("table").dataset.baseurl;
    addTime(baseUrl, ticketKey);
  }
});

async function addTime(baseUrl, ticketKey) {
  const input = document.querySelector(`.time-input[data-key="${ticketKey}"]`);
  const feedback = document.getElementById(`feedback-${ticketKey}`);
  const timeValue = input.value.trim();

  if (!timeValue) {
    feedback.textContent = "Please enter a time value.";
    feedback.className = "feedback error";
    return;
  }

  try {
    const apiUrl = `${baseUrl}/rest/api/2/issue/${ticketKey}/worklog`;
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeSpent: timeValue }),
    });

    if (response.ok) {
      feedback.textContent = "Time added successfully.";
      feedback.className = "feedback success";
      input.value = "";
    } else {
      feedback.textContent = `Error: ${response.status} - Unable to add time.`;
      feedback.className = "feedback error";
    }
  } catch (error) {
    feedback.textContent = "Failed to connect to Jira API.";
    feedback.className = "feedback error";
  }
}

function getStatusClass(status) {
  if (status.includes("to-do")) return "todo";
  if (status.includes("in-progress")) return "in-progress";
  if (status.includes("done")) return "done";
  return "other";
}

function addJiraLink(baseUrl) {
  const container = document.getElementById("ticket-container");
  container.innerHTML += `<p><a href="${baseUrl}/issues/?filter=-1" target="_blank">View all unresolved tickets in Jira</a></p>`;
}

function init() {
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
      getAssignedTickets(response.baseUrl);
    }
  });
}

init();
