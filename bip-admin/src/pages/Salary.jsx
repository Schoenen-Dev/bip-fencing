import { useState, useEffect } from "react";
import Select from "react-select";

const API = "http://localhost:8000/salary/salary_api.php";

const getHeaders = () => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };
  if (localStorage.getItem("role") === "admin") {
    const viewBranch = localStorage.getItem("admin_view_branch");
    if (viewBranch) headers["X-Branch-ID"] = viewBranch;
  }
  return headers;
};

const rsEmp = {
  control: (b, s) => ({
    ...b,
    minHeight: 40,
    borderRadius: 8,
    borderColor: s.isFocused ? "#008b3e" : "#e2e8f0",
    boxShadow: s.isFocused ? "0 0 0 3px rgba(0,139,62,.1)" : "none",
    background: "#fafbfc",
    fontSize: 14,
    "&:hover": { borderColor: "#008b3e" },
  }),
  valueContainer: (b) => ({ ...b, padding: "0 12px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (b) => ({ ...b, padding: "0 8px", color: "#94a3b8" }),
  menu: (b) => ({
    ...b,
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 9999,
  }),
  menuList: (b) => ({ ...b, maxHeight: 200, padding: "2px 0" }),
  option: (b, s) => ({
    ...b,
    fontSize: 14,
    background: s.isSelected ? "#008b3e" : s.isFocused ? "#f0fdf4" : "#fff",
    color: s.isSelected ? "#fff" : "#1e293b",
  }),
};

const emptyForm = {
  employeeName: "",
  employeeId: "",
  salary: "",
  paid: "",
  balance: "",
  type: "Days",
  date: "",
};

export default function Salary() {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState("table");
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [amountSearch, setAmountSearch] = useState("");
  const [viewRecord, setViewRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);
  const [error, setError] = useState("");
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetError, setBudgetError] = useState("");
  const [hasBranch, setHasBranch] = useState(false);
  const [budget, setBudget] = useState({
    total_branch_amount: 0,
    total_paid_salaries: 0,
    available_balance: 0,
  });
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [editModal, setEditModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const userRole = localStorage.getItem("role");
  const isAdmin = userRole === "admin";

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const fetchBudget = async () => {
    setBudgetLoading(true);
    setBudgetError("");
    try {
      const res = await fetch(`${API}?action=branch_total`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.error) setBudgetError(data.error);
      else
        setBudget({
          total_branch_amount: parseFloat(data.total_branch_amount) || 0,
          total_paid_salaries: parseFloat(data.total_paid_salaries) || 0,
          available_balance: parseFloat(data.available_balance) || 0,
        });
    } catch {
      setBudgetError("Failed to load budget");
    } finally {
      setBudgetLoading(false);
    }
  };

  const fetchEmployees = () => {
    setEmpLoading(true);
    fetch(`${API}?action=employees`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => setEmployees([]))
      .finally(() => setEmpLoading(false));
  };

  const fetchRecords = () => {
    setLoading(true);
    setError("");
    fetch(`${API}?action=records`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []))
      .catch((err) => {
        console.error(err);
        setError("Failed to load records");
        setRecords([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const branch = localStorage.getItem("admin_view_branch");
    setHasBranch(!!branch);
    fetchEmployees();
    fetchRecords();
    fetchBudget();
    const onStorage = (e) => {
      if (e.key === "admin_view_branch") {
        setHasBranch(!!e.newValue);
        fetchEmployees();
        fetchRecords();
        fetchBudget();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // FIX: react-select returns option object, not event
  const handleEmployeeSelect = (opt) => {
    const emp = opt ? employees.find((em) => em.emp_id === opt.value) : null;
    setForm((prev) => ({
      ...prev,
      employeeId: emp ? emp.emp_id : "",
      employeeName: emp ? emp.emp_name : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const next = { ...form, [name]: value };
    next.balance = (Number(next.salary) || 0) - (Number(next.paid) || 0);
    setForm(next);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!hasBranch) {
      showToast(
        "Please select a specific branch from the topbar before adding a salary.",
        "error",
      );
      return;
    }
    const paidAmount = Number(form.paid) || 0;
    if (paidAmount > budget.available_balance) {
      showToast(
        `Insufficient branch budget. Available: ₹${budget.available_balance.toFixed(2)}`,
        "error",
      );
      return;
    }
    try {
      const res = await fetch(`${API}?action=save`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Salary Saved Successfully");
        resetForm();
        setView("table");
        fetchRecords();
        fetchBudget();
      } else showToast(data.message || "Save Failed", "error");
    } catch {
      showToast("Server Error", "error");
    }
  };

  const handleEdit = (rec) =>
    setEditModal({
      id: rec.id,
      employeeName: rec.employeeName,
      employeeId: rec.employeeId,
      salary: rec.salary,
      paid: rec.paid,
      balance: rec.balance,
      type: rec.type,
      date: rec.salary_date ?? rec.date ?? "",
    });

  const handleUpdate = async () => {
    if (!editModal) return;
    try {
      const res = await fetch(`${API}?action=update`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(editModal),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Salary updated successfully");
        setEditModal(null);
        fetchRecords();
        fetchBudget();
      } else showToast(data.message || "Update failed", "error");
    } catch {
      showToast("Server error", "error");
    }
  };

  const handleDelete = async (id, employeeName) => {
    try {
      const res = await fetch(`${API}?action=delete&id=${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Deleted record for ${employeeName}`);
        fetchRecords();
        fetchBudget();
      } else showToast(data.message || "Delete failed", "error");
    } catch {
      showToast("Server error", "error");
    }
    setDeleteConfirm(null);
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId?.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "" || r.type === typeFilter;
    let matchesAmount = true;
    if (amountSearch) {
      const s = amountSearch.toString().toLowerCase();
      matchesAmount =
        r.salary.toString().includes(s) ||
        r.paid.toString().includes(s) ||
        r.balance.toString().includes(s);
    }
    return matchesSearch && matchesType && matchesAmount;
  });

  const totalFiltered = filteredRecords.length;
  const totalPages =
    rowsPerPage === -1 ? 1 : Math.ceil(totalFiltered / rowsPerPage);
  const startIndex = rowsPerPage === -1 ? 0 : (currentPage - 1) * rowsPerPage;
  const paginatedRecords =
    rowsPerPage === -1
      ? filteredRecords
      : filteredRecords.slice(startIndex, startIndex + rowsPerPage);

  const formatTime = (ts) =>
    ts
      ? new Date(ts).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";
  const inr = (v) => `₹${Number(v).toLocaleString("en-IN")}`;
  const noBranchProps = {
    disabled: !hasBranch,
    style: !hasBranch ? { opacity: 0.5, cursor: "not-allowed" } : {},
  };

  const typeBadge = (type) => {
    const map = {
      Days: ["#fef3c7", "#b45309"],
      Weeks: ["#dbeafe", "#1d4ed8"],
      Monthly: ["#dcfce7", "#15803d"],
    };
    const [bg, color] = map[type] || ["#f1f5f9", "#475569"];
    return (
      <span
        style={{
          background: bg,
          color,
          borderRadius: 20,
          padding: "2px 10px",
          fontSize: 12,
          fontWeight: 700,
        }}
      >
        {type}
      </span>
    );
  };

  const empOptions = employees.map((emp) => ({
    value: emp.emp_id,
    label: `${emp.emp_name} (${emp.emp_id})`,
  }));
  const empValue = form.employeeId
    ? empOptions.find((o) => o.value === form.employeeId) || null
    : null;

  return (
    <>
      <style>{`
        .sl-root { color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .sl-toast { position: fixed; top: 24px; right: 24px; z-index: 1200; display: flex; align-items: center; gap: 10px; padding: 13px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.18); color: #fff; min-width: 240px; animation: sl-in .28s cubic-bezier(.4,0,.2,1); }
        .sl-toast.success { background: #008b3e; } .sl-toast.error { background: #dc2626; }
        @keyframes sl-in { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .sl-header { display: flex; align-items: center; gap: 14px; padding-bottom: 28px; border-bottom: 1.5px solid #e2e8f0; margin-bottom: 28px; }
        .sl-header__icon { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #008b3e, #00b84f); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 17px; flex-shrink: 0; box-shadow: 0 3px 10px rgba(0,139,62,.25); }
        .sl-header__title { margin: 0 0 2px; font-size: 22px; font-weight: 800; letter-spacing: -.4px; }
        .sl-header__sub { margin: 0; font-size: 13px; color: #64748b; }
        .sl-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 28px; }
        .sl-stat { background: #fff; border: 1.5px solid var(--bd); border-radius: 12px; padding: 18px 20px; }
        .sl-stat__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #64748b; margin-bottom: 8px; }
        .sl-stat__value { font-size: 20px; font-weight: 800; color: var(--c); font-family: "SF Mono","Fira Code",monospace; }
        .sl-skeleton { animation: sl-pulse 1.5s infinite; background: #e5e7eb; border-radius: 4px; height: 28px; width: 130px; display: inline-block; }
        @keyframes sl-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        .sl-tabs { display: flex; gap: 4px; border-bottom: 1.5px solid #e2e8f0; margin-bottom: 24px; }
        .sl-tab { display: flex; align-items: center; gap: 8px; padding: 13px 20px; border: none; background: transparent; font-size: 14px; font-weight: 600; color: #64748b; cursor: pointer; border-bottom: 2.5px solid transparent; margin-bottom: -1.5px; border-radius: 6px 6px 0 0; transition: color .15s, border-color .15s; }
        .sl-tab:hover { background: #f8fafc; color: #1e293b; }
        .sl-tab.active { color: #008b3e; border-bottom-color: #008b3e; }
        .sl-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 24px; margin-bottom: 24px; }
        .sl-card__head { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
        .sl-card__head i { color: #008b3e; font-size: 17px; }
        .sl-form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
        .sl-fg { display: flex; flex-direction: column; gap: 7px; }
        .sl-fg--2 { grid-column: span 2; }
        .sl-fg--full { grid-column: 1 / -1; }
        .sl-label { font-size: 13px; font-weight: 600; color: #374151; }
        .sl-input, .sl-select { height: 40px; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 12px; font-size: 14px; color: #1e293b; background: #fafbfc; width: 100%; box-sizing: border-box; outline: none; transition: border-color .15s, box-shadow .15s; }
        .sl-input:focus, .sl-select:focus { border-color: #008b3e; background: #fff; box-shadow: 0 0 0 3px rgba(0,139,62,.1); }
        .sl-input:disabled, .sl-select:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
        .sl-hint { font-size: 12px; color: #64748b; margin-top: 3px; }
        .sl-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: box-shadow .15s; }
        .sl-btn--primary { background: linear-gradient(135deg,#008b3e,#009e46); color:#fff; box-shadow: 0 2px 8px rgba(0,139,62,.3); }
        .sl-btn--primary:hover { box-shadow: 0 4px 16px rgba(0,139,62,.38); }
        .sl-btn--ghost { background: #f8fafc; color: #374151; border: 1.5px solid #e2e8f0; }
        .sl-btn--ghost:hover { background: #f1f5f9; }
        .sl-btn--danger { background: #dc2626; color: #fff; }
        .sl-form-actions { display: flex; gap: 10px; margin-top: 22px; justify-content: flex-end; }
        .sl-alert { display: flex; align-items: center; gap: 10px; background: #fffbeb; border: 1px solid #fde68a; color: #92400e; border-radius: 8px; padding: 12px 16px; font-size: 14px; margin-bottom: 20px; }
        .sl-error { color: #dc2626; font-size: 13px; margin-top: 8px; }
        .sl-filters { display: grid; grid-template-columns: 2fr 2fr 1fr auto; gap: 8px; margin-bottom: 20px; align-items: center; }
        .sl-finput { height: 36px; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 11px; font-size: 13px; color: #1e293b; background: #fafbfc; width: 100%; box-sizing: border-box; outline: none; }
        .sl-finput:focus { border-color: #008b3e; }
        .sl-table-wrap { border-radius: 10px; border: 1.5px solid #e2e8f0; overflow-x: auto; }
        .sl-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .sl-table thead tr { background: #f8fafc; }
        .sl-table th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; border-bottom: 1.5px solid #e2e8f0; white-space: nowrap; }
        .sl-table td { padding: 13px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .sl-table tbody tr:last-child td { border-bottom: none; }
        .sl-table tbody tr:hover td { background: #f8fffe; }
        .sl-td-num { color: #94a3b8; font-size: 12px; width: 36px; }
        .sl-emp-name { font-weight: 700; font-size: 13.5px; }
        .sl-id-tag { background: #f1f5f9; color: #475569; border-radius: 6px; padding: 2px 8px; font-size: 12px; font-weight: 700; font-family: "SF Mono","Fira Code",monospace; }
        .sl-paid { color: #15803d; font-weight: 700; font-family: monospace; }
        .sl-balance { color: #dc2626; font-weight: 700; font-family: monospace; }
        .sl-amount { font-family: monospace; font-weight: 600; }
        .sl-date { font-size: 13px; color: #374151; white-space: nowrap; }
        .sl-time { font-size: 12px; color: #94a3b8; }
        .sl-actions { display: flex; gap: 5px; justify-content: flex-end; }
        .sl-act { width: 30px; height: 30px; border: none; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: transform .12s; }
        .sl-act:hover { transform: scale(1.08); }
        .sl-act--view { background: #dcfce7; color: #15803d; }
        .sl-act--edit { background: #eff6ff; color: #2563eb; }
        .sl-act--del  { background: #fef2f2; color: #dc2626; }
        .sl-empty { display: flex; flex-direction: column; align-items: center; padding: 52px 20px; color: #94a3b8; }
        .sl-empty i { font-size: 40px; margin-bottom: 10px; }
        .sl-empty p { margin: 0; font-weight: 600; color: #64748b; }
        .sl-loading { display: flex; align-items: center; gap: 12px; padding: 40px; justify-content: center; color: #64748b; font-size: 14px; }
        .sl-spinner { width: 20px; height: 20px; border: 3px solid #e2e8f0; border-top-color: #008b3e; border-radius: 50%; animation: sl-spin .7s linear infinite; }
        @keyframes sl-spin { to { transform: rotate(360deg); } }
        .sl-pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 18px; padding-top: 16px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; gap: 10px; }
        .sl-pg-left { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
        .sl-pg-select { height: 32px; border: 1.5px solid #e2e8f0; border-radius: 7px; padding: 0 8px; font-size: 13px; background: #fafbfc; cursor: pointer; outline: none; }
        .sl-pg-right { display: flex; align-items: center; gap: 8px; }
        .sl-pg-info { font-size: 13px; color: #64748b; }
        .sl-pg-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border: 1.5px solid #e2e8f0; background: #fafbfc; border-radius: 8px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; }
        .sl-pg-btn:hover:not(:disabled) { background: #f1f5f9; }
        .sl-pg-btn:disabled { opacity: .45; cursor: not-allowed; }
        .sl-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.55); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: sl-fi .18s ease; }
        @keyframes sl-fi { from { opacity: 0; } to { opacity: 1; } }
        .sl-modal { background: #fff; border-radius: 16px; width: 520px; max-width: 92vw; max-height: 88vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(15,23,42,.22); animation: sl-mi .22s cubic-bezier(.4,0,.2,1); }
        .sl-modal--sm { width: 380px; }
        @keyframes sl-mi { from { transform: translateY(18px) scale(.97); opacity: 0; } to { transform: none; opacity: 1; } }
        .sl-modal__hd { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid #f1f5f9; }
        .sl-modal__title { display: flex; align-items: center; gap: 9px; font-size: 16px; font-weight: 800; color: #0f172a; }
        .sl-modal__title i { color: #008b3e; }
        .sl-modal__close { width: 30px; height: 30px; border: none; background: #f1f5f9; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 13px; }
        .sl-modal__close:hover { background: #e2e8f0; }
        .sl-modal__body { padding: 20px 22px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 12px; }
        .sl-modal__ft { padding: 14px 22px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }
        .sl-view-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid #f8fafc; font-size: 14px; }
        .sl-view-row:last-child { border-bottom: none; }
        @media (max-width: 900px) { .sl-stats { grid-template-columns: 1fr 1fr; } .sl-form-grid { grid-template-columns: 1fr 1fr; } .sl-filters { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 600px) { .sl-stats { grid-template-columns: 1fr; } .sl-form-grid { grid-template-columns: 1fr; } .sl-filters { grid-template-columns: 1fr; } }
      `}</style>

      <div className="sl-root">
        {toast.show && (
          <div className={`sl-toast ${toast.type}`}>
            <i
              className={
                toast.type === "success"
                  ? "bi bi-check-circle-fill"
                  : "bi bi-exclamation-triangle-fill"
              }
            ></i>
            <span>{toast.message}</span>
          </div>
        )}

        <div className="sl-header">
          <div className="sl-header__icon">
            <i className="bi bi-cash-stack"></i>
          </div>
          <div>
            <h1 className="sl-header__title">Salary</h1>
            <p className="sl-header__sub">Employee Salary Management</p>
          </div>
        </div>

        <div className="sl-stats">
          {[
            {
              label: "Total Branch Budget",
              key: "total_branch_amount",
              c: "#1e293b",
              bd: "#e2e8f0",
            },
            {
              label: "Total Paid Salaries",
              key: "total_paid_salaries",
              c: "#dc2626",
              bd: "#fecaca",
            },
            {
              label: "Available Balance",
              key: "available_balance",
              c: "#15803d",
              bd: "#86efac",
            },
          ].map(({ label, key, c, bd }) => (
            <div className="sl-stat" key={key} style={{ "--c": c, "--bd": bd }}>
              <div className="sl-stat__label">{label}</div>
              {budgetLoading ? (
                <span className="sl-skeleton" />
              ) : (
                <div className="sl-stat__value">{inr(budget[key])}</div>
              )}
            </div>
          ))}
        </div>
        {budgetError && (
          <div className="sl-error" style={{ marginBottom: 16 }}>
            {budgetError}
          </div>
        )}

        <div className="sl-tabs">
          <button
            className={`sl-tab${view === "form" ? " active" : ""}`}
            onClick={() => {
              if (!hasBranch) {
                showToast("Please select a branch from the topbar", "error");
                return;
              }
              resetForm();
              setView("form");
            }}
          >
            <i className="bi bi-plus-circle"></i> Add Salary
          </button>
          <button
            className={`sl-tab${view === "table" ? " active" : ""}`}
            onClick={() => setView("table")}
          >
            <i className="bi bi-table"></i> Salary Records
          </button>
        </div>

        {view === "form" && (
          <div className="sl-card">
            <div className="sl-card__head">
              <i className="bi bi-person-lines-fill"></i>
              <span>Salary Information</span>
            </div>
            {!hasBranch && (
              <div className="sl-alert">
                <i className="bi bi-exclamation-triangle-fill"></i>Please select
                a specific branch from the topbar to add a salary.
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="sl-form-grid">
                <div className="sl-fg sl-fg--2">
                  <label className="sl-label">Select Employee</label>
                  <Select
                    menuPlacement="bottom"
                    menuPosition="fixed"
                    isClearable
                    isDisabled={!hasBranch || empLoading}
                    placeholder={
                      empLoading ? "Loading…" : "— Select Employee —"
                    }
                    value={empValue}
                    onChange={handleEmployeeSelect}
                    options={empOptions}
                    styles={rsEmp}
                  />
                  <span className="sl-hint">
                    Employee name & ID will be auto-filled
                  </span>
                </div>
                <div className="sl-fg">
                  <label className="sl-label">Employee ID</label>
                  <input
                    className="sl-input"
                    type="text"
                    name="employeeId"
                    value={form.employeeId}
                    readOnly
                  />
                </div>
                <div className="sl-fg">
                  <label className="sl-label">
                    Salary <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="sl-input"
                    type="number"
                    name="salary"
                    value={form.salary}
                    onChange={handleChange}
                    required
                    {...noBranchProps}
                  />
                </div>
                <div className="sl-fg">
                  <label className="sl-label">
                    Paid <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="sl-input"
                    type="number"
                    name="paid"
                    value={form.paid}
                    onChange={handleChange}
                    required
                    {...noBranchProps}
                  />
                  <span className="sl-hint">
                    Available: {inr(budget.available_balance)}
                  </span>
                </div>
                <div className="sl-fg">
                  <label className="sl-label">Balance</label>
                  <input
                    className="sl-input"
                    type="number"
                    name="balance"
                    value={form.balance}
                    readOnly
                  />
                </div>
                <div className="sl-fg">
                  <label className="sl-label">Type</label>
                  <select
                    className="sl-select"
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    {...noBranchProps}
                  >
                    <option value="Days">Days</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div className="sl-fg">
                  <label className="sl-label">
                    Date <span style={{ color: "#ef4444" }}>*</span>
                  </label>
                  <input
                    className="sl-input"
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    {...noBranchProps}
                  />
                </div>
              </div>
              {error && <div className="sl-error">{error}</div>}
              <div className="sl-form-actions">
                <button
                  type="button"
                  className="sl-btn sl-btn--ghost"
                  onClick={resetForm}
                >
                  <i className="bi bi-arrow-counterclockwise"></i> Reset
                </button>
                <button
                  type="submit"
                  className="sl-btn sl-btn--primary"
                  {...noBranchProps}
                >
                  <i className="bi bi-check-circle"></i> Save Salary
                </button>
              </div>
            </form>
          </div>
        )}

        {view === "table" && (
          <div className="sl-card">
            <div className="sl-card__head">
              <i className="bi bi-table"></i>
              <span>Salary Records</span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#64748b",
                  background: "#f1f5f9",
                  padding: "2px 10px",
                  borderRadius: 20,
                }}
              >
                {totalFiltered} records
              </span>
            </div>
            <div className="sl-filters">
              <input
                className="sl-finput"
                type="text"
                placeholder="Search employee / ID…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <input
                className="sl-finput"
                type="text"
                placeholder="Search amount…"
                value={amountSearch}
                onChange={(e) => {
                  setAmountSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <select
                className="sl-finput"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Types</option>
                <option value="Days">Days</option>
                <option value="Weeks">Weeks</option>
                <option value="Monthly">Monthly</option>
              </select>
              <button
                className="sl-btn sl-btn--primary"
                onClick={() => {
                  if (!hasBranch) {
                    showToast("Select a branch", "error");
                    return;
                  }
                  resetForm();
                  setView("form");
                }}
                {...noBranchProps}
              >
                <i className="bi bi-plus-circle"></i> Add New
              </button>
            </div>
            {error && <div className="sl-error">{error}</div>}
            {loading ? (
              <div className="sl-loading">
                <div className="sl-spinner"></div>
                <span>Loading records…</span>
              </div>
            ) : (
              <>
                <div className="sl-table-wrap">
                  <table className="sl-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Employee</th>
                        <th>ID</th>
                        <th>Salary</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedRecords.length > 0 ? (
                        paginatedRecords.map((rec, idx) => (
                          <tr key={rec.id}>
                            <td className="sl-td-num">
                              {startIndex + idx + 1}
                            </td>
                            <td>
                              <div className="sl-emp-name">
                                {rec.employeeName}
                              </div>
                            </td>
                            <td>
                              <span className="sl-id-tag">
                                {rec.employeeId}
                              </span>
                            </td>
                            <td>
                              <span className="sl-amount">
                                {inr(rec.salary)}
                              </span>
                            </td>
                            <td>
                              <span className="sl-paid">{inr(rec.paid)}</span>
                            </td>
                            <td>
                              <span className="sl-balance">
                                {inr(rec.balance)}
                              </span>
                            </td>
                            <td>{typeBadge(rec.type)}</td>
                            <td>
                              <span className="sl-date">
                                {rec.salary_date ?? rec.date}
                              </span>
                            </td>
                            <td>
                              <span className="sl-time">
                                {formatTime(rec.created_at)}
                              </span>
                            </td>
                            <td>
                              <div className="sl-actions">
                                <button
                                  className="sl-act sl-act--view"
                                  onClick={() => setViewRecord(rec)}
                                  title="View"
                                >
                                  <i className="bi bi-eye-fill"></i>
                                </button>
                                {isAdmin && (
                                  <>
                                    <button
                                      className="sl-act sl-act--edit"
                                      onClick={() => handleEdit(rec)}
                                      title="Edit"
                                    >
                                      <i className="bi bi-pencil-fill"></i>
                                    </button>
                                    <button
                                      className="sl-act sl-act--del"
                                      onClick={() => setDeleteConfirm(rec)}
                                      title="Delete"
                                    >
                                      <i className="bi bi-trash-fill"></i>
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10">
                            <div className="sl-empty">
                              <i className="bi bi-inbox"></i>
                              <p>No records found</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {totalFiltered > 0 && (
                  <div className="sl-pagination">
                    <div className="sl-pg-left">
                      Show{" "}
                      <select
                        className="sl-pg-select"
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(parseInt(e.target.value));
                          setCurrentPage(1);
                        }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={-1}>All</option>
                      </select>{" "}
                      entries per page
                    </div>
                    {rowsPerPage !== -1 && (
                      <div className="sl-pg-right">
                        <span className="sl-pg-info">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          className="sl-pg-btn"
                          disabled={currentPage === 1}
                          onClick={() => setCurrentPage((p) => p - 1)}
                        >
                          <i className="bi bi-chevron-left"></i> Previous
                        </button>
                        <button
                          className="sl-pg-btn"
                          disabled={currentPage === totalPages}
                          onClick={() => setCurrentPage((p) => p + 1)}
                        >
                          Next <i className="bi bi-chevron-right"></i>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {viewRecord && (
          <div className="sl-overlay" onClick={() => setViewRecord(null)}>
            <div className="sl-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sl-modal__hd">
                <div className="sl-modal__title">
                  <i className="bi bi-eye"></i> Salary Details
                </div>
                <button
                  className="sl-modal__close"
                  onClick={() => setViewRecord(null)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div className="sl-modal__body">
                {[
                  { label: "Employee", value: viewRecord.employeeName },
                  { label: "Employee ID", value: viewRecord.employeeId },
                  { label: "Salary", value: inr(viewRecord.salary) },
                  {
                    label: "Paid",
                    value: inr(viewRecord.paid),
                    style: { color: "#15803d", fontWeight: 700 },
                  },
                  {
                    label: "Balance",
                    value: inr(viewRecord.balance),
                    style: { color: "#dc2626", fontWeight: 700 },
                  },
                  { label: "Type", value: viewRecord.type },
                  {
                    label: "Date",
                    value: viewRecord.salary_date ?? viewRecord.date,
                  },
                  { label: "Time", value: formatTime(viewRecord.created_at) },
                ].map(({ label, value, style }) => (
                  <div className="sl-view-row" key={label}>
                    <span
                      style={{
                        fontWeight: 600,
                        color: "#64748b",
                        fontSize: 13,
                      }}
                    >
                      {label}
                    </span>
                    <span style={style}>{value}</span>
                  </div>
                ))}
              </div>
              <div className="sl-modal__ft">
                <button
                  className="sl-btn sl-btn--ghost"
                  onClick={() => setViewRecord(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {editModal && (
          <div className="sl-overlay" onClick={() => setEditModal(null)}>
            <div className="sl-modal" onClick={(e) => e.stopPropagation()}>
              <div className="sl-modal__hd">
                <div className="sl-modal__title">
                  <i className="bi bi-pencil-square"></i> Edit Salary
                </div>
                <button
                  className="sl-modal__close"
                  onClick={() => setEditModal(null)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div
                className="sl-modal__body"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 14,
                }}
              >
                {[
                  {
                    label: "Employee Name",
                    field: "employeeName",
                    type: "text",
                    ro: true,
                  },
                  {
                    label: "Employee ID",
                    field: "employeeId",
                    type: "text",
                    ro: true,
                  },
                  {
                    label: "Salary",
                    field: "salary",
                    type: "number",
                    ro: false,
                  },
                  { label: "Paid", field: "paid", type: "number", ro: false },
                ].map(({ label, field, type, ro }) => (
                  <div className="sl-fg" key={field}>
                    <label className="sl-label">{label}</label>
                    <input
                      className="sl-input"
                      type={type}
                      value={editModal[field]}
                      readOnly={ro}
                      onChange={
                        ro
                          ? undefined
                          : (e) =>
                              setEditModal({
                                ...editModal,
                                [field]: e.target.value,
                              })
                      }
                    />
                  </div>
                ))}
                <div className="sl-fg">
                  <label className="sl-label">Balance</label>
                  <input
                    className="sl-input"
                    type="number"
                    value={editModal.salary - editModal.paid}
                    readOnly
                  />
                </div>
                <div className="sl-fg">
                  <label className="sl-label">Type</label>
                  <select
                    className="sl-select"
                    value={editModal.type}
                    onChange={(e) =>
                      setEditModal({ ...editModal, type: e.target.value })
                    }
                  >
                    <option value="Days">Days</option>
                    <option value="Weeks">Weeks</option>
                    <option value="Monthly">Monthly</option>
                  </select>
                </div>
                <div className="sl-fg" style={{ gridColumn: "1/-1" }}>
                  <label className="sl-label">Date</label>
                  <input
                    className="sl-input"
                    type="date"
                    value={editModal.date}
                    onChange={(e) =>
                      setEditModal({ ...editModal, date: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="sl-modal__ft">
                <button
                  className="sl-btn sl-btn--ghost"
                  onClick={() => setEditModal(null)}
                >
                  Cancel
                </button>
                <button
                  className="sl-btn sl-btn--primary"
                  onClick={handleUpdate}
                >
                  <i className="bi bi-check-circle"></i> Update
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirm && (
          <div className="sl-overlay" onClick={() => setDeleteConfirm(null)}>
            <div
              className="sl-modal sl-modal--sm"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sl-modal__hd">
                <div className="sl-modal__title" style={{ color: "#dc2626" }}>
                  <i className="bi bi-trash"></i> Confirm Delete
                </div>
                <button
                  className="sl-modal__close"
                  onClick={() => setDeleteConfirm(null)}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <div style={{ padding: "24px", textAlign: "center" }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: "#fef2f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 14px",
                    fontSize: 22,
                    color: "#dc2626",
                  }}
                >
                  <i className="bi bi-exclamation-triangle-fill"></i>
                </div>
                <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 15 }}>
                  Delete salary record for{" "}
                  <strong>{deleteConfirm.employeeName}</strong>?
                </p>
                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                  This action cannot be undone.
                </p>
              </div>
              <div className="sl-modal__ft">
                <button
                  className="sl-btn sl-btn--ghost"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button
                  className="sl-btn sl-btn--danger"
                  onClick={() =>
                    handleDelete(deleteConfirm.id, deleteConfirm.employeeName)
                  }
                >
                  <i className="bi bi-trash"></i> Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
