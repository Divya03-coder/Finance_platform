

const STORAGE_KEY = "expenses";
let expenses = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

const tableBody = document.getElementById("expenseTable");
const statsBox = document.getElementById("stats");
const form = document.getElementById("expenseForm");
const deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
let deleteId = null;


const saveExpenses = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));


const fmtINR = (v) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(v);


const renderTable = (list = expenses) => {
  tableBody.innerHTML = list.map(({ id, title, category, amount, date }) => `
    <tr>
      <td>${title}</td>
      <td>${category}</td>
      <td class="fw-bold">${fmtINR(amount)}</td>
      <td>${new Date(date).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-sm btn-primary me-2" onclick="editExpense(${id})">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="confirmDelete(${id})">Delete</button>
      </td>
    </tr>`).join("");
  updateStats(list);
};

// Stats
const updateStats = (list) => {
  if (!list.length) return statsBox.innerHTML = "";
  const total = list.reduce((a, b) => a + Number(b.amount), 0);
  const avg = total / list.length;
  const max = list.reduce((a, b) => a.amount > b.amount ? a : b);

  statsBox.innerHTML = `
    <div class="col-md-4">
      <div class="card p-3 bg-success text-white">Total: ${fmtINR(total)}</div>
    </div>
    <div class="col-md-4">
      <div class="card p-3 bg-warning">Average: ${fmtINR(avg)}</div>
    </div>
    <div class="col-md-4">
      <div class="card p-3 bg-info text-dark">Highest: ${fmtINR(max.amount)}</div>
    </div>`;
};


form.addEventListener("submit", (e) => {
  e.preventDefault();
  const expense = {
    id: document.getElementById("expenseId").value || Date.now(),
    title: document.getElementById("title").value,
    category: document.getElementById("category").value,
    amount: Number(document.getElementById("amount").value),
    date: document.getElementById("date").value,
  };

  const index = expenses.findIndex((e) => e.id == expense.id);
  if (index >= 0) expenses[index] = expense; else expenses.push({ ...expense });

  saveExpenses();
  renderTable();
  form.reset();
});


window.editExpense = (id) => {
  const { title, category, amount, date } = expenses.find((e) => e.id == id);
  document.getElementById("expenseId").value = id;
  document.getElementById("title").value = title;
  document.getElementById("category").value = category;
  document.getElementById("amount").value = amount;
  document.getElementById("date").value = date;
};

// Delete
window.confirmDelete = (id) => {
  deleteId = id;
  deleteModal.show();
};

window.deleteExpense = () => {
  expenses = expenses.filter((e) => e.id != deleteId);
  saveExpenses();
  renderTable();
  deleteModal.hide();
};


const sortSelect = document.getElementById("sortFilter");
sortSelect.addEventListener("change", () => {
  let sorted = [...expenses];
  const v = sortSelect.value;
  if (v === "amountDesc") sorted.sort((a, b) => b.amount - a.amount);
  if (v === "amountAsc") sorted.sort((a, b) => a.amount - b.amount);
  if (v === "dateDesc") sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (v === "dateAsc") sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
  renderTable(sorted);
});


const filterButtons = document.querySelectorAll("[data-filter]");

const dateCheck = {
  today: (d) => new Date(d).toDateString() === new Date().toDateString(),
  week: (d) => {
    const diff = (new Date() - new Date(d)) / (1000 * 60 * 60 * 24);
    return diff <= 7;
  },
  month: (d) => new Date(d).getMonth() === new Date().getMonth()
};

filterButtons.forEach(btn => btn.addEventListener("click", () => {
  const filterType = btn.dataset.filter;
  renderTable(expenses.filter(e => dateCheck[filterType](e.date)));
}));


const categoryFilter = document.getElementById("categoryFilter");
categoryFilter.addEventListener("change", () => {
  if (categoryFilter.value === "all") return renderTable();
  renderTable(expenses.filter((e) => e.category === categoryFilter.value));
});


renderTable();
