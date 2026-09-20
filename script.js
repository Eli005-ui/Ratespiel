const CONFIG = {
  question: "Wie viele Laubblätter liegen im Korb?",
  correctValue: 142,
  adminPassword: "herbst2026",
  minEstimate: 0,
  maxEstimate: 1000
};

const STORAGE_KEYS = {
  entries: "herbst-ratespiel-entries",
  correct: "herbst-ratespiel-correct-value"
};

const state = {
  screen: "guess",
  entries: loadEntries(),
  correctValue: loadCorrectValue()
};

const screens = {
  guess: document.getElementById("guessScreen"),
  thanks: document.getElementById("thanksScreen"),
  admin: document.getElementById("adminScreen")
};

const guessForm = document.getElementById("guessForm");
const nameInput = document.getElementById("nameInput");
const estimateSlider = document.getElementById("estimateSlider");
const estimateValue = document.getElementById("estimateValue");
const questionTitle = document.getElementById("questionTitle");
const adminToggle = document.getElementById("adminToggle");
const closeAdmin = document.getElementById("closeAdmin");
const adminGate = document.getElementById("adminGate");
const adminPanel = document.getElementById("adminPanel");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const unlockAdmin = document.getElementById("unlockAdmin");
const adminError = document.getElementById("adminError");
const correctValueInput = document.getElementById("correctValueInput");
const saveCorrectValue = document.getElementById("saveCorrectValue");
const exportEntriesButton = document.getElementById("exportEntries");
const clearAllEntriesButton = document.getElementById("clearAllEntries");
const winnerCard = document.getElementById("winnerCard");
const rankingList = document.getElementById("rankingList");

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.entries);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEYS.entries, JSON.stringify(entries));
}

function loadCorrectValue() {
  const stored = localStorage.getItem(STORAGE_KEYS.correct);
  return stored !== null ? Number(stored) : CONFIG.correctValue;
}

function saveCorrectValueToStorage(value) {
  localStorage.setItem(STORAGE_KEYS.correct, String(value));
}

function renderQuestion() {
  questionTitle.textContent = CONFIG.question;
  estimateSlider.min = String(CONFIG.minEstimate);
  estimateSlider.max = String(CONFIG.maxEstimate);
  estimateSlider.value = String(Math.floor((CONFIG.minEstimate + CONFIG.maxEstimate) / 2));
  updateEstimateValue();
  correctValueInput.value = state.correctValue;
}

function updateEstimateValue() {
  estimateValue.textContent = estimateSlider.value;
}

function setScreen(target) {
  state.screen = target;
  Object.entries(screens).forEach(([key, screen]) => {
    screen.classList.toggle("hidden", key !== target);
    screen.classList.toggle("active", key === target);
  });
}

function handleSubmit(event) {
  event.preventDefault();

  const name = nameInput.value.trim();
  const estimate = Number(estimateSlider.value);

  if (!name) {
    nameInput.focus();
    return;
  }

  const entry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    name,
    estimate,
    submittedAt: new Date().toISOString()
  };

  state.entries.push(entry);
  saveEntries(state.entries);

  guessForm.reset();
  estimateSlider.value = String(Math.floor((CONFIG.minEstimate + CONFIG.maxEstimate) / 2));
  updateEstimateValue();

  renderRanking();
  setScreen("thanks");
  window.setTimeout(() => {
    setScreen("guess");
  }, 1800);
}

function getRankings() {
  return [...state.entries]
    .map((entry) => ({
      ...entry,
      difference: Math.abs(Number(entry.estimate) - Number(state.correctValue))
    }))
    .sort((a, b) => {
      if (a.difference !== b.difference) {
        return a.difference - b.difference;
      }
      return new Date(a.submittedAt) - new Date(b.submittedAt);
    });
}

function renderRanking() {
  const rankings = getRankings();

  if (!rankings.length) {
    winnerCard.textContent = "Noch keine Schätzungen vorhanden.";
    rankingList.innerHTML = "<li><span class='rank-meta'>Keine Einträge</span></li>";
    return;
  }

  const winner = rankings[0];
  const winnerText = `${winner.name} – ${winner.estimate} (${Math.abs(winner.estimate - state.correctValue)} entfernt)`;
  winnerCard.textContent = winnerText;

  rankingList.innerHTML = rankings
    .map((entry, index) => {
      const diff = Math.abs(entry.estimate - state.correctValue);
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "•";
      return `
        <li>
          <span class="rank-meta">
            <span class="rank-badge">${medal}</span>
            <span>${index + 1}. ${entry.name}</span>
          </span>
          <span class="rank-score">${entry.estimate} (${diff} diff)</span>
        </li>
      `;
    })
    .join("");
}

function unlockAdminView() {
  const password = adminPasswordInput.value.trim();

  if (password !== CONFIG.adminPassword) {
    adminError.classList.remove("hidden");
    return;
  }

  adminError.classList.add("hidden");
  adminGate.classList.add("hidden");
  adminPanel.classList.remove("hidden");
  renderRanking();
}

function handleCorrectValueSave() {
  const nextValue = Number(correctValueInput.value);

  if (Number.isNaN(nextValue)) {
    return;
  }

  state.correctValue = nextValue;
  saveCorrectValueToStorage(nextValue);
  renderRanking();
}

function clearAllEntries() {
  const confirmed = window.confirm("Möchtest du wirklich alle Teilnehmenden löschen?");
  if (!confirmed) {
    return;
  }

  state.entries = [];
  saveEntries(state.entries);
  renderRanking();
}

function exportEntriesToFile() {
  const payload = JSON.stringify(state.entries, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "teilnehmer-export.json";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

estimateSlider.addEventListener("input", updateEstimateValue);
guessForm.addEventListener("submit", handleSubmit);
adminToggle.addEventListener("click", () => {
  adminPasswordInput.value = "";
  adminError.classList.add("hidden");
  adminGate.classList.remove("hidden");
  adminPanel.classList.add("hidden");
  setScreen("admin");
  adminPasswordInput.focus();
});

closeAdmin.addEventListener("click", () => {
  adminPasswordInput.value = "";
  adminError.classList.add("hidden");
  setScreen("guess");
});

unlockAdmin.addEventListener("click", unlockAdminView);
adminPasswordInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    unlockAdminView();
  }
});
saveCorrectValue.addEventListener("click", handleCorrectValueSave);
exportEntriesButton.addEventListener("click", exportEntriesToFile);
clearAllEntriesButton.addEventListener("click", clearAllEntries);

renderQuestion();
setScreen("guess");
renderRanking();
