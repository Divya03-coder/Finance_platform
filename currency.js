const BASE_API = "https://open.er-api.com/v6/latest/";
const STORAGE_KEY = "fx_history_v1";

const fromSel = document.getElementById("from");
const toSel = document.getElementById("to");
const amountInput = document.getElementById("cur-amount");
const form = document.getElementById("currency-form");

const loadingEl = document.getElementById("cur-loading");
const resultEl = document.getElementById("cur-result");
const errorEl = document.getElementById("cur-error");
const updatedEl = document.getElementById("cur-updated");

const historyListEl = document.getElementById("historyList");
const noHistoryEl = document.getElementById("noHistory");
const clearBtn = document.getElementById("clearHistory");
const popularListEl = document.getElementById("popularList");

const fromHelp = document.getElementById("from-help");
const toHelp = document.getElementById("to-help");

let latestRates = {};
let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const POPULAR_PAIRS = [
  ["INR", "USD", "Indian Rupee → US Dollar"],
  ["INR", "EUR", "Indian Rupee → Euro"],
  ["INR", "GBP", "Indian Rupee → British Pound"],
  ["INR", "AED", "Indian Rupee → UAE Dirham"],
  ["USD", "INR", "US Dollar → Indian Rupee"],
  ["EUR", "USD", "Euro → US Dollar"]
];

const showLoading = (t = "") => (loadingEl.textContent = t);
const showResult = (t) => {
  resultEl.textContent = t;
  resultEl.classList.remove("d-none");
  errorEl.classList.add("d-none");
};
const showError = (t) => {
  errorEl.textContent = t;
  errorEl.classList.remove("d-none");
  resultEl.classList.add("d-none");
};
const hideMessages = () => {
  loadingEl.textContent = "";
  resultEl.classList.add("d-none");
  errorEl.classList.add("d-none");
};

async function fetchRates(base) {
  const res = await fetch(BASE_API + base);
  const data = await res.json();
  if (data.result !== "success") throw new Error("API error");
  return {
    rates: data.rates,
    updated: data.time_last_update_utc
  };
}

function updateHelps() {
  fromHelp.textContent = fromSel.value;
  toHelp.textContent = toSel.value;
}

document.getElementById("swapBtn").addEventListener("click", () => {
  const temp = fromSel.value;
  fromSel.value = toSel.value;
  toSel.value = temp;
  updateHelps();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  hideMessages();

  const amount = Number(amountInput.value);
  const from = fromSel.value;
  const to = toSel.value;

  if (!amount || amount <= 0) return showError("Enter a valid amount!");
  if (from === to) return showError("Currencies must be different!");

  try {
    showLoading("Fetching latest rates…");
    const data = await fetchRates(from);

    latestRates = data.rates;
    const rate = latestRates[to];
    if (!rate) throw new Error("Invalid conversion");

    const converted = amount * rate;

    showResult(`${amount} ${from} = ${converted.toFixed(2)} ${to} (Rate: ${rate.toFixed(4)})`);
    updatedEl.textContent = "Last updated: " + data.updated;

    addHistory({
      id: Date.now(),
      from,
      to,
      amount,
      converted,
      rate,
      when: new Date().toISOString()
    });

  } catch (err) {
    showError("Conversion failed. Try again!");
  } finally {
    showLoading("");
  }
});

function addHistory(e) {
  history.unshift(e);
  if (history.length > 10) history = history.slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  renderHistory();
}

function renderHistory() {
  historyListEl.innerHTML = "";
  if (!history.length) {
    noHistoryEl.style.display = "block";
    return;
  }
  noHistoryEl.style.display = "none";

  history.forEach((h) => {
    const div = document.createElement("div");
    div.className = "list-group-item d-flex justify-content-between align-items-center history-item";
    div.innerHTML = `
      <div>
        <strong>${h.amount} ${h.from}</strong> → ${h.converted.toFixed(2)} ${h.to}
        <div class="text-muted small">
          Rate: ${h.rate.toFixed(4)} · ${new Date(h.when).toLocaleString()}
        </div>
      </div>
      <button class="btn btn-sm btn-outline-danger" data-id="${h.id}">×</button>
    `;
    historyListEl.appendChild(div);
  });
}

historyListEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;
  const id = Number(btn.dataset.id);
  history = history.filter((x) => x.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  renderHistory();
});

clearBtn.addEventListener("click", () => {
  if (!confirm("Clear all history?")) return;
  history = [];
  localStorage.removeItem(STORAGE_KEY);
  renderHistory();
});

function renderPopular() {
  popularListEl.innerHTML = "";

  POPULAR_PAIRS.forEach(([a, b, label]) => {
    const div = document.createElement("div");
    div.className =
      "p-2 mb-2 bg-light rounded d-flex justify-content-between align-items-center popular-item";

    div.innerHTML = `
      <div>
        <strong>${label}</strong><br>
        <small>${a} → ${b}</small>
      </div>
      <button class="btn btn-sm btn-primary" data-a="${a}" data-b="${b}">
        Convert
      </button>
    `;

    popularListEl.appendChild(div);
  });

  popularListEl.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-a][data-b]");
    if (!btn) return;
    fromSel.value = btn.dataset.a;
    toSel.value = btn.dataset.b;
    updateHelps();
    if (!amountInput.value) amountInput.value = 1;
    form.requestSubmit();
  });
}

(function init() {
  hideMessages();
  updateHelps();
  renderHistory();
  renderPopular();
})();
