let incomeData = JSON.parse(localStorage.getItem("incomeData")) || [];
let deleteId = null;

const form = document.getElementById("income-form");
const incomeId = document.getElementById("income-id");
const titleInput = document.getElementById("inc-title");
const sourceInput = document.getElementById("inc-source");
const amountInput = document.getElementById("inc-amount");
const dateInput = document.getElementById("inc-date");
const tbody = document.getElementById("income-tbody");
const lastUpdated = document.getElementById("income-last-updated");
const sortSelect = document.getElementById("income-sort");
const countEl = document.getElementById("income-count");
const totalEl = document.getElementById("income-total");
const monthSelect = document.getElementById("month-select");
const monthTotal = document.getElementById("monthly-total");
const topSource = document.getElementById("monthly-top-source");
const topAmount = document.getElementById("monthly-top-amount");
const entryCount = document.getElementById("monthly-top-count");
const chartBox = document.getElementById("income-chart");

function updateLocal() {
  localStorage.setItem("incomeData", JSON.stringify(incomeData));
}

function updateLastSynced() {
  lastUpdated.textContent = "Last updated: " + new Date().toLocaleString();
}

function resetForm() {
  incomeId.value = "";
  form.reset();
  document.getElementById("income-submit").textContent = "Add Income";
}

document.getElementById("income-reset-btn").onclick = resetForm;

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    title: titleInput.value,
    source: sourceInput.value,
    amount: Number(amountInput.value),
    date: dateInput.value
  };

  if (incomeId.value) {
    incomeData = incomeData.map((inc) =>
      inc.id == incomeId.value ? { ...inc, ...data } : inc
    );
  } else {
    incomeData.push({ id: Date.now(), ...data });
  }

  updateLocal();
  updateUI();
  resetForm();
});

function renderTable(list) {
  tbody.innerHTML = "";
  list.forEach((inc) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${inc.date}</td>
      <td>${inc.title}</td>
      <td>${inc.source}</td>
      <td>₹${inc.amount}</td>
      <td class="text-center">
        <button class="btn btn-sm btn-outline-primary me-2" onclick="editIncome(${inc.id})">Edit</button>
        <button class="btn btn-sm btn-outline-danger" onclick="confirmDelete(${inc.id})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function editIncome(id) {
  const inc = incomeData.find((x) => x.id === id);
  if (!inc) return;

  const { title, source, amount, date } = inc;

  incomeId.value = id;
  titleInput.value = title;
  sourceInput.value = source;
  amountInput.value = amount;
  dateInput.value = date;

  document.getElementById("income-submit").textContent = "Update";
}

function confirmDelete(id) {
  deleteId = id;
  deleteIncome();
}

function deleteIncome() {
  incomeData = incomeData.filter((i) => i.id !== deleteId);
  deleteId = null;
  updateLocal();
  updateUI();
}

sortSelect.addEventListener("change", () => {
  updateUI();
});

function sortData(data) {
  const v = sortSelect.value;
  if (v === "date-desc") return [...data].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (v === "date-asc") return [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (v === "amount-high") return [...data].sort((a, b) => b.amount - a.amount);
  if (v === "amount-low") return [...data].sort((a, b) => a.amount - b.amount);
  if (v === "source") return [...data].sort((a, b) => a.source.localeCompare(b.source));
  return data;
}

function updateSummary() {
  const sorted = [...incomeData];
  countEl.textContent = sorted.length;
  const total = sorted.reduce((acc, v) => acc + v.amount, 0);
  totalEl.textContent = "₹" + total;
}

monthSelect.addEventListener("change", updateMonthlySummary);

function updateMonthlySummary() {
  const month = monthSelect.value;
  if (!month) return;

  const filtered = incomeData.filter((inc) => inc.date.startsWith(month));
  const total = filtered.reduce((acc, v) => acc + v.amount, 0);
  monthTotal.textContent = "₹" + total;

  if (filtered.length === 0) {
    topSource.textContent = "-";
    topAmount.textContent = "₹0";
    entryCount.textContent = "0";
    return;
  }

  const sourceMap = {};
  filtered.forEach((inc) => {
    sourceMap[inc.source] = (sourceMap[inc.source] || 0) + inc.amount;
  });

  const top = Object.entries(sourceMap).sort((a, b) => b[1] - a[1])[0];

  topSource.textContent = top[0];
  topAmount.textContent = "₹" + top[1];
  entryCount.textContent = filtered.length;
}

function updateChart() {
  chartBox.innerHTML = "";

  const groups = {};

  incomeData.forEach((i) => {
    groups[i.source] = (groups[i.source] || 0) + i.amount;
  });

  const max = Math.max(...Object.values(groups), 1);

  Object.entries(groups).forEach(([source, amount]) => {
    const bar = document.createElement("div");
    bar.style.height = (amount / max) * 100 + "%";
    bar.style.width = "16%";
    bar.style.background = "#0d6efd";
    bar.style.borderRadius = "6px";

    const wrapper = document.createElement("div");
    wrapper.className = "d-flex flex-column align-items-center";
    wrapper.style.flex = "1";

    const label = document.createElement("div");
    label.className = "small mt-1";
    label.textContent = source;

    wrapper.appendChild(bar);
    wrapper.appendChild(label);
    chartBox.appendChild(wrapper);
  });
}

function updateUI() {
  const sorted = sortData(incomeData);
  renderTable(sorted);
  updateSummary();
  updateMonthlySummary();
  updateChart();
  updateLastSynced();
}

updateUI();
