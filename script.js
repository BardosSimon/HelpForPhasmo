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


// =======================
// 🕒 TIMER SYSTEM
// =======================
let timerInterval = null;
let remainingTime = 0;

function startTimer(type) {
  resetTimer(); // clear any existing timer first
  const timerDisplay = document.getElementById("timerDisplay");

  // set time based on timer type
  if (type === "smudge") remainingTime = 180;     // 3 minutes
  if (type === "crucifix") remainingTime = 60;    // 1 minute
  if (type === "demon") remainingTime = 20;       // 20 seconds

  updateTimerDisplay(remainingTime);

  timerInterval = setInterval(() => {
    remainingTime--;
    updateTimerDisplay(remainingTime);

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerDisplay.textContent = "⏰ Time’s up!";
      timerDisplay.style.color = "#f87171";
    }
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
  remainingTime = 0;
  const timerDisplay = document.getElementById("timerDisplay");
  timerDisplay.textContent = "00:00";
  timerDisplay.style.color = "#e5e7eb";
}

function updateTimerDisplay(seconds) {
  const timerDisplay = document.getElementById("timerDisplay");
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  timerDisplay.textContent =
    `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

async function askAI() {
    const question = document.getElementById("userQuestion").value;
    const answerDiv = document.getElementById("aiAnswer");
    answerDiv.innerHTML = "Thinking...";

    // Collect selected evidences
    const selectedEvidences = [...evidences].join(", ") || "None selected";

    // Collect matched ghosts (optional but powerful!)
    const possibleGhosts = ghosts
        .filter(g => {
            const gE = [g.Evidence1, g.Evidence2, g.Evidence3];
            return [...evidences].every(e => gE.includes(e));
        })
        .map(g => g.Name)
        .join(", ") || "All ghosts still possible";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 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"
        },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "system",
                    content:
                        "You are a Phasmophobia assistant. Keep all answers short, direct, and precise. Do not use formatting, symbols, markdown, or decorative text. if you have evidences checked in try to write tests for possible ghosts!" +
                        "\nCurrent evidence selected by the user: " + selectedEvidences +
                        "\nGhosts that match the user’s evidence: " + possibleGhosts +
                        "\nOnly answer using these constraints. If evidence eliminates ghosts, do not mention impossible ghosts."
                },
                {
                    role: "user",
                    content: question
                }
            ]
        })
    });

    const data = await response.json();

    if (data.error) {
        answerDiv.innerHTML = "Error: " + data.error.message;
        return;
    }

    answerDiv.innerHTML = data.choices?.[0]?.message?.content || "No response from AI.";
}