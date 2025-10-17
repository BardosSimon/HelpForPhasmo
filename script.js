let ghosts = [];
let evidences = new Set();
let traits = new Set();

// Load CSV
async function loadCSV() {
  const res = await fetch("ghosts.csv");
  const text = await res.text();

  // Split CSV
  const rows = text.trim().split("\n").map(r => r.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/));
  const headers = rows.shift();

  ghosts = rows.map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h.trim()] = r[i]?.trim() ?? "");
    return obj;
  });

  renderEvidenceOptions();
  renderTraitOptions();
  filterGhosts();
}

// Create checkboxes
function renderEvidenceOptions() {
  const uniqueEvidences = new Set();
  ghosts.forEach(g => {
    ["Evidence1", "Evidence2", "Evidence3"].forEach(e => uniqueEvidences.add(g[e]));
  });

  const container = document.getElementById("evidenceList");
  container.innerHTML = "";

  uniqueEvidences.forEach(e => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${e}" onchange="toggleEvidence(this)"> ${e}`;
    container.appendChild(label);
  });
}

function renderTraitOptions() {
  const traitOptions = ["Fast", "Slow", "Aggressive", "Calm", "Variable"];
  const container = document.getElementById("traitsList");
  container.innerHTML = "";

  traitOptions.forEach(t => {
    const label = document.createElement("label");
    label.innerHTML = `<input type="checkbox" value="${t}" onchange="toggleTrait(this)"> ${t}`;
    container.appendChild(label);
  });
}

// Toggle filters
function toggleEvidence(checkbox) {
  if (checkbox.checked) evidences.add(checkbox.value);
  else evidences.delete(checkbox.value);
  filterGhosts();
}

function toggleTrait(checkbox) {
  if (checkbox.checked) traits.add(checkbox.value);
  else traits.delete(checkbox.value);
  filterGhosts();
}

// Main filter + render function
function filterGhosts() {
  const ghostList = document.getElementById("ghostList");
  ghostList.innerHTML = "";

  const filtered = ghosts.filter(g => {
    const ghostEvidences = [g.Evidence1, g.Evidence2, g.Evidence3];
    const hasEvidences = [...evidences].every(e => ghostEvidences.includes(e));

    let hasTraits = true;
    if (traits.size > 0) {
      hasTraits = [...traits].some(t =>
        g.Speed.toLowerCase().includes(t.toLowerCase()) ||
        g.Aggressiveness.toLowerCase().includes(t.toLowerCase()) ||
        g["Special Traits"].toLowerCase().includes(t.toLowerCase())
      );
    }

    return hasEvidences && hasTraits;
  });

  // Create ghost cards
  filtered.forEach(g => {
    const card = document.createElement("div");
    card.classList.add("ghost-card");

    card.innerHTML = `
      <div class="ghost-header">
        <h3>${g.Name}</h3>
        <p><strong>Evidences:</strong> ${g.Evidence1}, ${g.Evidence2}, ${g.Evidence3}</p>
        <p><strong>Speed:</strong> ${g.Speed} | <strong>Aggressiveness:</strong> ${g.Aggressiveness}</p>
      </div>
    `;

    card.addEventListener("click", () => toggleDetails(card, g));
    ghostList.appendChild(card);
  });
}

// Expand/collapse
function toggleDetails(card, ghost) {
  const existing = card.querySelector(".details");
  if (existing) {
    existing.remove();
    return;
  }

  // Collapse
  document.querySelectorAll(".details").forEach(d => d.remove());

  const details = document.createElement("div");
  details.classList.add("details");
  details.innerHTML = `
    <p><strong>Forced Evidence:</strong> ${ghost.ForcedEvidence || "None"}</p>
    <p><strong>How to Test:</strong> ${ghost.HowToTest || "No special test known."}</p>
  `;

  card.appendChild(details);
}

loadCSV();
