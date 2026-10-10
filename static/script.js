const API_URL = "/api/opportunities";

const opportunityList = document.getElementById("opportunity-list");
const statusMessage = document.getElementById("status-message");
const opportunityCount = document.getElementById("opportunity-count");
const opportunityForm = document.getElementById("opportunity-form");
const formMessage = document.getElementById("form-message");
const formHeading = document.getElementById("form-heading");
const submitButton = document.getElementById("submit-button");
const cancelEditButton = document.getElementById("cancel-edit");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const emptyState = document.getElementById("empty-state");
const toast = document.getElementById("toast");

let opportunities = [];
let editingId = null;
let toastTimer = null;

function showToast(message, isError = false) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 3400);
}

function setFormMessage(message, type = "success") {
  formMessage.textContent = message;
  formMessage.className = `form-message ${message ? type : ""}`;
}

function addText(parent, tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text == null || text === "" ? "—" : String(text);
  parent.appendChild(element);
  return element;
}

function detailRow(parent, label, value) {
  const row = document.createElement("div");
  row.className = "detail-row";
  addText(row, "span", "detail-label", label);
  addText(row, "span", "detail-value", value || "Not specified");
  parent.appendChild(row);
}

function formatDeadline(value) {
  if (!value) return "Not specified";
  // Database serializers may return either YYYY-MM-DD or an HTTP-style date.
  const direct = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = direct
    ? new Date(Number(direct[1]), Number(direct[2]) - 1, Number(direct[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function normaliseDateForInput(value) {
  if (!value) return "";
  const direct = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
  if (direct) return direct[1];
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function renderCard(opportunity) {
  const card = document.createElement("article");
  card.className = "opportunity-card";

  const top = document.createElement("div");
  top.className = "card-top";
  addText(top, "span", "card-id", `OPPORTUNITY / ${String(opportunity.id).padStart(3, "0")}`);
  const status = addText(top, "span", `status-badge ${opportunity.status === "Closed" ? "closed" : ""}`, opportunity.status || "Open");
  status.title = `Status: ${opportunity.status || "Open"}`;
  card.appendChild(top);

  addText(card, "p", "card-area", `${opportunity.research_area || "Research"}  ·  ${opportunity.department || "Department not specified"}`);
  addText(card, "h3", "", opportunity.title || "Untitled opportunity");
  addText(card, "p", "card-description", opportunity.description || "No project description was provided.");

  const details = document.createElement("div");
  details.className = "card-details";
  detailRow(details, "SUPERVISOR", opportunity.faculty_name);
  detailRow(details, "SKILLS", opportunity.required_skills);
  detailRow(details, "POSITIONS", Number.isFinite(Number(opportunity.positions)) ? opportunity.positions : "Not specified");
  card.appendChild(details);

  const footer = document.createElement("div");
  footer.className = "card-footer";
  const deadline = document.createElement("div");
  deadline.className = "deadline-label";
  addText(deadline, "span", "", "APPLICATION DEADLINE");
  addText(deadline, "strong", "", formatDeadline(opportunity.deadline));
  footer.appendChild(deadline);

  const actions = document.createElement("div");
  actions.className = "card-actions";
  const editButton = addText(actions, "button", "action-button", "Edit");
  editButton.type = "button";
  editButton.setAttribute("aria-label", `Edit ${opportunity.title || "opportunity"}`);
  editButton.addEventListener("click", () => startEditing(opportunity));
  const deleteButton = addText(actions, "button", "action-button delete-button", "Delete");
  deleteButton.type = "button";
  deleteButton.setAttribute("aria-label", `Delete ${opportunity.title || "opportunity"}`);
  deleteButton.addEventListener("click", () => deleteOpportunity(opportunity));
  actions.appendChild(editButton);
  actions.appendChild(deleteButton);
  footer.appendChild(actions);
  card.appendChild(footer);
  return card;
}

function filteredOpportunities() {
  const query = searchInput.value.trim().toLocaleLowerCase();
  const selectedStatus = statusFilter.value;
  return opportunities.filter((item) => {
    const matchesStatus = selectedStatus === "All" || (item.status || "Open") === selectedStatus;
    const searchable = [item.title, item.description, item.research_area, item.faculty_name, item.department, item.required_skills, item.status]
      .filter(Boolean).join(" ").toLocaleLowerCase();
    return matchesStatus && (!query || searchable.includes(query));
  });
}

function updateStats() {
  const open = opportunities.filter((item) => (item.status || "Open") === "Open");
  const positions = open.reduce((sum, item) => sum + (Number(item.positions) || 0), 0);
  document.getElementById("stat-total").textContent = opportunities.length;
  document.getElementById("stat-open").textContent = open.length;
  document.getElementById("stat-positions").textContent = positions;
}

function renderOpportunities() {
  opportunityList.replaceChildren();
  const visible = filteredOpportunities();
  opportunityCount.textContent = `${visible.length} ${visible.length === 1 ? "RESULT" : "RESULTS"}`;
  emptyState.hidden = visible.length > 0;
  if (opportunities.length === 0) {
    statusMessage.textContent = "Your opportunity board is ready for its first listing.";
    emptyState.querySelector("h3").textContent = "No opportunities yet";
    emptyState.querySelector("p").textContent = "Publish the first listing using the form and it will appear here.";
  } else if (visible.length === 0) {
    statusMessage.textContent = "No matches for your current search.";
    emptyState.querySelector("h3").textContent = "No opportunities found";
    emptyState.querySelector("p").textContent = "Try another search or change the status filter.";
  } else {
    statusMessage.textContent = "Explore the projects and find a place to contribute.";
  }
  visible.forEach((item) => opportunityList.appendChild(renderCard(item)));
  updateStats();
}

async function readResponse(response) {
  const raw = await response.text();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { message: raw }; }
}

async function loadOpportunities() {
  statusMessage.textContent = "Refreshing the opportunity board…";
  try {
    const response = await fetch(API_URL, { headers: { Accept: "application/json" } });
    const data = await readResponse(response);
    if (!response.ok) throw new Error(data.error || data.message || `Request failed (${response.status})`);
    if (!Array.isArray(data)) throw new Error("The API response was not a list of opportunities.");
    opportunities = data;
    renderOpportunities();
  } catch (error) {
    console.error("Could not load opportunities:", error);
    opportunityList.replaceChildren();
    statusMessage.textContent = "Could not connect to the opportunity API. Check that Flask and MySQL are running.";
    opportunityCount.textContent = "UNAVAILABLE";
    emptyState.hidden = false;
    emptyState.querySelector("h3").textContent = "We can't reach the directory";
    emptyState.querySelector("p").textContent = error.message || "Please try refreshing the page.";
  }
}

function startEditing(opportunity) {
  editingId = opportunity.id;
  for (const [key, value] of Object.entries(opportunity)) {
    const input = opportunityForm.elements.namedItem(key);
    if (!input) continue;
    if (key === "deadline") input.value = normaliseDateForInput(value);
    else input.value = value == null ? "" : String(value);
  }
  formHeading.innerHTML = 'Refine the <em>opportunity.</em>';
  submitButton.innerHTML = 'Save changes <span aria-hidden="true">↗</span>';
  cancelEditButton.hidden = false;
  setFormMessage(`Editing opportunity #${opportunity.id}. Update the fields and save your changes.`, "success");
  document.getElementById("post-opportunity").scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => opportunityForm.elements.namedItem("title").focus({ preventScroll: true }), 350);
}

function resetForm() {
  editingId = null;
  opportunityForm.reset();
  formHeading.innerHTML = 'Share a <em>research idea.</em>';
  submitButton.innerHTML = 'Publish opportunity <span aria-hidden="true">↗</span>';
  cancelEditButton.hidden = true;
  setFormMessage("");
}

async function handleFormSubmit(event) {
  event.preventDefault();
  if (!opportunityForm.reportValidity()) return;
  const formData = new FormData(opportunityForm);
  const payload = Object.fromEntries(formData.entries());
  payload.positions = Number(payload.positions);
  if (!Number.isInteger(payload.positions) || payload.positions < 1) {
    setFormMessage("Available positions must be a whole number greater than zero.", "error");
    return;
  }
  if (!payload.deadline) {
    setFormMessage("Please choose an application deadline.", "error");
    return;
  }

  const wasEditing = editingId !== null;
  const url = wasEditing ? `${API_URL}/${encodeURIComponent(editingId)}` : API_URL;
  const originalButtonText = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = wasEditing ? "Saving changes…" : "Publishing…";
  setFormMessage("");

  try {
    const response = await fetch(url, {
      method: wasEditing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await readResponse(response);
    if (!response.ok) throw new Error(result.error || result.message || `Request failed (${response.status})`);
    resetForm();
    await loadOpportunities();
    setFormMessage(wasEditing ? "Your opportunity has been updated successfully." : `Opportunity published successfully${result.id ? ` (ID ${result.id})` : ""}.`, "success");
    showToast(wasEditing ? "Opportunity updated." : "Opportunity published.");
  } catch (error) {
    console.error("Could not save opportunity:", error);
    setFormMessage(error.message || "Something went wrong. Please try again.", "error");
    showToast("Could not save the opportunity. Check the form and API.", true);
  } finally {
    submitButton.disabled = false;
    if (submitButton.textContent === "Publishing…" || submitButton.textContent === "Saving changes…") submitButton.innerHTML = originalButtonText;
  }
}

async function deleteOpportunity(opportunity) {
  const confirmed = window.confirm(`Delete “${opportunity.title}”? This action cannot be undone.`);
  if (!confirmed) return;
  try {
    const response = await fetch(`${API_URL}/${encodeURIComponent(opportunity.id)}`, { method: "DELETE", headers: { Accept: "application/json" } });
    const result = await readResponse(response);
    if (!response.ok) throw new Error(result.error || result.message || `Delete failed (${response.status})`);
    if (editingId === opportunity.id) resetForm();
    await loadOpportunities();
    showToast("Opportunity deleted.");
  } catch (error) {
    console.error("Could not delete opportunity:", error);
    showToast(error.message || "Could not delete the opportunity.", true);
  }
}

opportunityForm.addEventListener("submit", handleFormSubmit);
cancelEditButton.addEventListener("click", resetForm);
searchInput.addEventListener("input", renderOpportunities);
statusFilter.addEventListener("change", renderOpportunities);
document.getElementById("clear-filters").addEventListener("click", () => {
  searchInput.value = "";
  statusFilter.value = "All";
  renderOpportunities();
});
document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    searchInput.focus();
  }
  if (event.key === "Escape" && editingId !== null) resetForm();
});

loadOpportunities();
