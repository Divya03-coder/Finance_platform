const STORAGE_KEYS = {
  BUDGET: "monthlyBudgets",
  EXPENSE: "expenseList"
};

const $ = s => document.querySelector(s);

function loadBudgets() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGET)) || [];
}

function saveBudgets(list) {
  localStorage.setItem(STORAGE_KEYS.BUDGET, JSON.stringify(list));
}

function loadExpenses() {
  return JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSE)) || [];
}

function formatCurrency(n) {
  return `₹${Number(n).toLocaleString("en-IN")}`;
}

function getMonthName(ym) {
  const d = new Date(ym + "-01");
  return d.toLocaleString("en-GB", { month: "long", year: "numeric" });
}

function calculateSpentForMonth(ym) {
  const expenses = loadExpenses();
  return expenses
    .filter(e => e.date && e.date.startsWith(ym))
    .reduce((s, e) => s + Number(e.amount), 0);
}

function renderTable() {
  const tbody = $("#budgetBody");
  const budgets = loadBudgets().sort((a, b) => a.month.localeCompare(b.month));
  tbody.innerHTML = "";

  if (!budgets.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No monthly budgets added.</td></tr>`;
    return;
  }

  budgets.forEach(item => {
    const spent = calculateSpentForMonth(item.month);
    const remaining = item.amount - spent;
    const percent = Math.min(100, Math.round((spent / item.amount) * 100));
    const statusClass = remaining >= 0 ? "status-ok" : "status-bad";
    const statusText = remaining >= 0 ? "Within Limit" : "Exceeded";

    tbody.innerHTML += `
      <tr>
        <td>${getMonthName(item.month)}</td>
        <td>${formatCurrency(item.amount)}</td>
        <td>${formatCurrency(spent)}</td>
        <td>${formatCurrency(remaining)}</td>
        <td>
          <div class="progress-bar-wrapper">
            <div class="progress-fill" style="width:${percent}%"></div>
          </div>
        </td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      </tr>
    `;
  });
}

$("#budget-form").addEventListener("submit", e => {
  e.preventDefault();

  const month = $("#budget-month").value;
  const amount = Number($("#budget-amount").value);

  if (!month || !amount) return;

  let budgets = loadBudgets();
  const exists = budgets.find(b => b.month === month);

  if (exists) {
    exists.amount = amount;
  } else {
    budgets.push({ month, amount });
  }

  saveBudgets(budgets);
  renderTable();
  e.target.reset();
});

document.addEventListener("DOMContentLoaded", () => {
  renderTable();
});
