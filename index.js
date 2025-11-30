const STORAGE_KEYS = {
  INCOME: "incomeList",
  EXPENSE: "expenseList",
  BUDGET: "userBudget"
};

const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const formatCurrency = n => `₹${Number(n).toLocaleString("en-IN")}`;
const formatDate = d => new Date(d).toLocaleDateString("en-GB");

function nowISODate(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function getStorage() {
  return {
    income: JSON.parse(localStorage.getItem(STORAGE_KEYS.INCOME)) || [],
    expenses: JSON.parse(localStorage.getItem(STORAGE_KEYS.EXPENSE)) || [],
    budget: Number(localStorage.getItem(STORAGE_KEYS.BUDGET)) || 0
  };
}

function setStorage({ income, expenses, budget }) {
  if (income) localStorage.setItem(STORAGE_KEYS.INCOME, JSON.stringify(income));
  if (expenses) localStorage.setItem(STORAGE_KEYS.EXPENSE, JSON.stringify(expenses));
  if (typeof budget === "number") localStorage.setItem(STORAGE_KEYS.BUDGET, String(budget));
}

function seedExampleData() {
  const { income, expenses, budget } = getStorage();
  if (income.length || expenses.length || budget) return;

  const sampleIncome = [
    { id: Date.now() - 900000, title: "Salary", source: "Job", amount: 75000, date: nowISODate(-4) },
    { id: Date.now() - 800000, title: "Freelance", source: "Side Gig", amount: 5000, date: nowISODate(-10) }
  ];

  const sampleExpenses = [
    { id: Date.now() - 700000, title: "Groceries", category: "Food", amount: 2500, date: nowISODate(-1) },
    { id: Date.now() - 600000, title: "Petrol", category: "Transport", amount: 1500, date: nowISODate(-2) },
    { id: Date.now() - 500000, title: "Electricity", category: "Utilities", amount: 3200, date: nowISODate(-3) },
    { id: Date.now() - 400000, title: "Movie", category: "Entertainment", amount: 800, date: nowISODate(-6) },
    { id: Date.now() - 300000, title: "Lunch", category: "Food", amount: 450, date: nowISODate(-7) }
  ];

  setStorage({ income: sampleIncome, expenses: sampleExpenses, budget: 50000 });
}

function updateGreeting() {
  const h = new Date().getHours();
  const greet = h < 12 ? "Good Morning" : h < 18 ? "Good Afternoon" : "Good Evening";
  $("#greetingText").textContent = `${greet}, User`;
}

function updateLastSynced() {
  const now = new Date();
  const formatted = now.toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
  $("#lastSyncedText").textContent = `Last synced: ${formatted}`;
}

function computeTotals() {
  const { income, expenses, budget } = getStorage();
  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0);
  const totalExpense = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const balance = totalIncome - totalExpense;
  const remaining = budget - totalExpense;
  return { totalIncome, totalExpense, balance, remaining, budget };
}

function updateCards() {
  const { totalIncome, totalExpense, balance, remaining } = computeTotals();
  $("#totalIncome").textContent = formatCurrency(totalIncome);
  $("#totalExpense").textContent = formatCurrency(totalExpense);
  $("#balanceAmount").textContent = formatCurrency(balance);
  $("#remainingBudget").textContent = formatCurrency(remaining);
}

function buildRecentActivityRows() {
  const { income, expenses } = getStorage();
  const combined = [
    ...income.map(i => ({ ...i, _type: "Income" })),
    ...expenses.map(e => ({ ...e, _type: "Expense" }))
  ];

  combined.sort((a, b) => new Date(b.date) - new Date(a.date));
  return combined.slice(0, 5);
}

function updateRecentActivity() {
  const rows = buildRecentActivityRows();
  const tbody = $("#recentTransactionsBody");

  if (!rows.length) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No transactions yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map(
      r => `
      <tr>
        <td>${r.title}</td>
        <td>${r._type}</td>
        <td class="${r._type === "Expense" ? "text-danger" : "text-success"}">
          ${r._type === "Expense" ? "-" : "+"}${formatCurrency(r.amount)}
        </td>
        <td>${formatDate(r.date)}</td>
      </tr>
    `
    )
    .join("");
}

function getLastNDates(n) {
  const dates = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

function updateWeeklyChart() {
  const { expenses } = getStorage();
  const last7 = getLastNDates(7);

  const totals = last7.map(day =>
    expenses
      .filter(e => e.date === day)
      .reduce((s, e) => s + Number(e.amount), 0)
  );

  const max = Math.max(...totals, 1);
  const chart = $("#weeklyChart");
  chart.innerHTML = "";

  last7.forEach((day, i) => {
    const percent = Math.round((totals[i] / max) * 100);

    chart.innerHTML += `
      <div class="chart-bar text-center">
        <div class="bar" style="height:${percent}%"></div>
        <small class="text-muted">${new Date(day).toLocaleDateString("en-GB", { weekday: "short" })}</small>
      </div>
    `;
  });
}

function refreshAll() {
  updateGreeting();
  updateLastSynced();
  updateCards();
  updateRecentActivity();
  updateWeeklyChart();
}

document.addEventListener("DOMContentLoaded", () => {
  seedExampleData();
  refreshAll();
});
