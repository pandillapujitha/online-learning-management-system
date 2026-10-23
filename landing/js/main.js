// Landing page script: checks the API, loads the course catalog, filters it as you type.
const statusEl = document.getElementById("status");
const catalogEl = document.getElementById("catalog");
const searchEl = document.getElementById("search");
let courses = [];

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

async function checkHealth() {
  try {
    const res = await fetch("/api/health");
    if (!res.ok) throw new Error("down");
    statusEl.textContent = "Server is online";
    statusEl.className = "status ok";
  } catch {
    statusEl.textContent = "Server is not reachable. Start the Node.js backend and refresh.";
    statusEl.className = "status down";
  }
}

function renderStats() {
  document.getElementById("stat-courses").textContent = courses.length;
  document.getElementById("stat-lessons").textContent = courses.reduce((s, c) => s + c.lessonCount, 0);
  document.getElementById("stat-students").textContent = courses.reduce((s, c) => s + c.students, 0);
}

function renderCatalog(list) {
  if (list.length === 0) {
    catalogEl.innerHTML = "<p class=\"muted\">No courses match your search. Try a different word.</p>";
    return;
  }
  catalogEl.innerHTML = list.map((c) => `
    <article class="course">
      <span class="tag">${escapeHtml(c.category)}</span>
      <h3>${escapeHtml(c.title)}</h3>
      <p>${escapeHtml(c.description)}</p>
      <p>${c.lessonCount} lessons - ${c.minutes} min - ${escapeHtml(c.instructor)}</p>
      <a href="/app/course/${encodeURIComponent(c.id)}">View course</a>
    </article>`).join("");
}

async function loadCourses() {
  try {
    const res = await fetch("/api/courses");
    courses = await res.json();
    renderStats();
    renderCatalog(courses);
  } catch {
    catalogEl.innerHTML = "<p class=\"muted\">Courses could not be loaded because the server is offline.</p>";
  }
}

searchEl.addEventListener("input", () => {
  const q = searchEl.value.trim().toLowerCase();
  renderCatalog(courses.filter((c) => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)));
});

checkHealth();
loadCourses();
