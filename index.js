
const STORAGE = {
    EXPENSES: "expenses",
    INCOME: "incomeData",
    BUDGET: "monthlyBudgets"
};

const load = key => JSON.parse(localStorage.getItem(key)) || [];
const fmtINR = n => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

document.addEventListener("storage", updateDashboardUI);  // Auto-sync across tabs/pages

// ---------- LAST SYNCED ----------
function updateLastSynced() {
    const now = new Date();

    const formatted =
        now.toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric"
        }) +
        " " +
        now.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });

    localStorage.setItem("lastSynced", formatted);
    document.getElementById("lastSyncedText").textContent = "Last synced: " + formatted;
}
updateLastSynced();

function getDashboardData() {
    const expenses = load(STORAGE.EXPENSES);
    const income = load(STORAGE.INCOME);
    const budgets = load(STORAGE.BUDGET);

    const totalExpense = expenses.reduce((a, b) => a + Number(b.amount), 0);
    const totalIncome = income.reduce((a, b) => a + Number(b.amount), 0);
    const balance = totalIncome - totalExpense;

    const ym = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthBudget = budgets.find(b => b.month === ym)?.amount || 0;
    const remainingBudget = monthBudget - totalExpense;

    return {
        expenses,
        income,
        budgets,
        totalExpense,
        totalIncome,
        balance,
        monthBudget,
        remainingBudget
    };
}

// ------------------------------------------------------------
// UPDATE DASHBOARD
// ------------------------------------------------------------
function updateDashboardUI() {
    const db = getDashboardData();

    document.getElementById("db-income").textContent = fmtINR(db.totalIncome);
    document.getElementById("db-expense").textContent = fmtINR(db.totalExpense);
    document.getElementById("db-balance").textContent = fmtINR(db.balance);

    // Remaining Budget Display
    const budgetBox = document.getElementById("db-budget");
    if (db.remainingBudget < 0) {
        budgetBox.innerHTML = `-${fmtINR(Math.abs(db.remainingBudget))} <span class="text-danger">(Exceeded)</span>`;
        budgetBox.style.color = "red";
    } else {
        budgetBox.innerHTML = fmtINR(db.remainingBudget);
        budgetBox.style.color = "inherit";
    }

    renderRecentActivity(db);
    renderWeeklyGraph(db.expenses);
    renderMonthlyTrend(db.expenses);
    renderCategoryPie(db.expenses);

    updateLastSynced();   // <-- Added here
}

function showGreeting() {
    const greetEl = document.getElementById("greetingText");
    const now = new Date();
    const hour = now.getHours();

    let greeting = "";

    if (hour >= 5 && hour < 12) {
        greeting = "🌅 Good Morning!";
    } 
    else if (hour >= 12 && hour < 17) {
        greeting = "☀️ Good Afternoon!";
    } 
    else if (hour >= 17 && hour < 21) {
        greeting = "🌇 Good Evening!";
    } 
    else {
        greeting = "🌙 Good Night!";
    }

    greetEl.textContent = greeting;
}

// Call on page load
document.addEventListener("DOMContentLoaded", showGreeting);

// ------------------------------------------------------------
// RECENT ACTIVITY
// ------------------------------------------------------------
function renderRecentActivity(db) {
    const tbody = document.getElementById("recent-body");

    const entries = [
        ...db.expenses.map(e => ({ ...e, type: "Expense" })),
        ...db.income.map(i => ({ ...i, type: "Income" }))
    ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

    tbody.innerHTML = entries.map(e => `
      <tr>
        <td>${e.title}</td>
        <td>${e.type}</td>
        <td class="${e.type === 'Income' ? 'text-success' : 'text-danger'}">
            ${fmtINR(e.amount)}
        </td>
        <td>${e.date}</td>
      </tr>
    `).join("");
}

// ------------------------------------------------------------
// WEEKLY SPENDING GRAPH
// ------------------------------------------------------------
function renderWeeklyGraph(expenses) {
    const graph = document.getElementById("weekly-graph");
    graph.innerHTML = "";

    const weekly = new Array(7).fill(0);
    expenses.forEach(e => {
        const d = new Date(e.date);
        if (!isNaN(d)) weekly[d.getDay()] += Number(e.amount);
    });

    const max = Math.max(...weekly, 1);
    const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    weekly.forEach((amt, idx) => {
        const h = amt === 0 ? 5 : (amt / max) * 100;

        const wrap = document.createElement("div");
        wrap.className = "graph-item d-flex flex-column align-items-center";

        const bar = document.createElement("div");
        bar.className = "graph-bar";
        bar.style.height = h + "%";
        bar.style.width = "20px";
        bar.style.background = "#0d6efd";
        bar.style.borderRadius = "6px";
        bar.style.transition = "0.4s";

        wrap.appendChild(bar);

        const label = document.createElement("small");
        label.textContent = days[idx];
        wrap.appendChild(label);

        graph.appendChild(wrap);
    });
}

// ------------------------------------------------------------
// MONTHLY TREND GRAPH
// ------------------------------------------------------------
// ------------------------------------------------------------
// MONTHLY TREND GRAPH (EXPENSE + INCOME)
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
  const incomes = JSON.parse(localStorage.getItem("incomeData") || "[]");

  if (!expenses.length && !incomes.length) return;

  // Group EXPENSES by day
  const dailyExpense = {};
  expenses.forEach(e => {
    const date = e.date.split("T")[0];
    dailyExpense[date] = (dailyExpense[date] || 0) + Number(e.amount);
  });

  // Group INCOMES by day
  const dailyIncome = {};
  incomes.forEach(i => {
    const date = i.date.split("T")[0];
    dailyIncome[date] = (dailyIncome[date] || 0) + Number(i.amount);
  });

  // Merge all dates
  const labels = Array.from(new Set([
    ...Object.keys(dailyExpense),
    ...Object.keys(dailyIncome)
  ])).sort();

  // Map values
  const expenseValues = labels.map(d => dailyExpense[d] || 0);
  const incomeValues  = labels.map(d => dailyIncome[d] || 0);

  // Create dotted expense + solid income line chart
  const ctx = document.getElementById("expenseTrend").getContext("2d");

  new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Daily Expense",
          data: expenseValues,
          borderColor: "#007bff",
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: "#ff4d4d",
          pointBorderColor: "#ff4d4d",
          borderDash: [6, 6] // dotted
        },
        {
          label: "Daily Income",
          data: incomeValues,
          borderColor: "#28a745",
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: "#28a745",
          pointBorderColor: "#28a745"
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: v => "₹" + v.toLocaleString("en-IN")
          }
        }
      }
    }
  });
});



// ------------------------------------------------------------
// CATEGORY PIE CHART
// ------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");

    if (!expenses.length) return;

    // Group totals by category
    const categoryTotals = {};
    expenses.forEach(e => {
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + Number(e.amount);
    });

    const labels = Object.keys(categoryTotals);
    const values = Object.values(categoryTotals);

    const colors = [
        "#4dc9f6", "#f67019", "#f53794",
        "#537bc4", "#acc236", "#166a8f",
        "#00a950", "#58595b", "#8549ba"
    ];

    // Render Donut Chart
    const ctx = document.getElementById("expenseCategoryChart");

    new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors,
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: "60%",
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Custom Legend on Left
    const legendBox = document.getElementById("categoryLegend");
    legendBox.innerHTML = labels.map((label, i) => `
        <div class="d-flex align-items-center mb-4">
            <div style="
                width:14px;
                height:14px;
                background:${colors[i]};
                border-radius:3px;
                margin-right:8px;">
            </div>
            <span>${label} - ₹${categoryTotals[label].toLocaleString("en-IN")}</span>
        </div>
    `).join("");
});





// ------------------------------------------------------------
// PAGE INIT
// ------------------------------------------------------------
updateDashboardUI();

// Load saved sync time on page load
const savedTime = localStorage.getItem("lastSynced");
if (savedTime) {
    document.getElementById("lastSyncedText").textContent = "Last synced: " + savedTime;
}
