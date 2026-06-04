import { useState, useEffect } from "react";

const API = "http://localhost:8000/salary_api.php";

// ─── Helper to get headers with admin branch selection ──────────────────────
const getHeaders = () => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };
  const role = localStorage.getItem("role");
  if (role === "admin") {
    const viewBranch = localStorage.getItem("admin_view_branch");
    if (viewBranch) {
      headers["X-Branch-ID"] = viewBranch;
    }
  }
  return headers;
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
  const [viewRecord, setViewRecord] = useState(null);
  const [loading, setLoading] = useState(false);
  const [empLoading, setEmpLoading] = useState(false);
  const [error, setError] = useState("");
  const [budget, setBudget] = useState({
    total_branch_amount: 0,
    total_paid_salaries: 0,
    available_balance: 0,
  });
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [hasBranchSelected, setHasBranchSelected] = useState(false);

  // ── Fetch budget summary ──────────────────────────────────
  const fetchBudget = async () => {
    setBudgetLoading(true);
    try {
      const res = await fetch(`${API}?action=branch_total`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!data.error) setBudget(data);
    } catch (err) {
      console.error("Failed to fetch budget", err);
    } finally {
      setBudgetLoading(false);
    }
  };

  // ── Fetch employees & check branch selection ──────────────
  useEffect(() => {
    // Check if a specific branch is selected
    const branchId = localStorage.getItem("admin_view_branch");
    setHasBranchSelected(!!branchId);

    setEmpLoading(true);
    fetch(`${API}?action=employees`, { headers: getHeaders() })
      .then((r) => r.json())
      .then((data) => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => setEmployees([]))
      .finally(() => setEmpLoading(false));
  }, []);

  // ── Fetch salary records ──────────────────────────────────
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
    fetchRecords();
    fetchBudget();
  }, []);

  const handleEmployeeSelect = (e) => {
    const selectedEmpId = e.target.value;
    const emp = employees.find((em) => em.emp_id === selectedEmpId);
    setForm((prev) => ({
      ...prev,
      employeeId: emp ? emp.emp_id : "",
      employeeName: emp ? emp.emp_name : "",
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    const salary = Number(updatedForm.salary) || 0;
    const paid = Number(updatedForm.paid) || 0;
    updatedForm.balance = salary - paid;
    setForm(updatedForm);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!hasBranchSelected) {
      setError(
        "Please select a specific branch from the topbar before adding a salary.",
      );
      return;
    }

    const paidAmount = Number(form.paid) || 0;
    if (paidAmount > budget.available_balance) {
      setError(
        `Insufficient branch budget. Available: ₹${budget.available_balance.toFixed(2)}`,
      );
      return;
    }

    try {
      const response = await fetch(`${API}?action=save`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (data.success) {
        alert("Salary Saved Successfully");
        resetForm();
        setView("table");
        fetchRecords();
        fetchBudget();
      } else {
        setError(data.message || "Save Failed");
      }
    } catch (error) {
      console.error(error);
      setError("Server Error");
    }
  };

  const handleEdit = (rec) => {
    setForm({
      employeeName: rec.employeeName,
      employeeId: rec.employeeId,
      salary: rec.salary,
      paid: rec.paid,
      balance: rec.balance,
      type: rec.type,
      date: rec.salary_date ?? rec.date ?? "",
    });
    setEditId(rec.id);
    setView("form");
  };

  const filtered = records.filter(
    (r) =>
      r.employeeName?.toLowerCase().includes(search.toLowerCase()) ||
      r.employeeId?.toLowerCase().includes(search.toLowerCase()),
  );

  const inr = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

  return (
    <>
      <style>{`
        .salary-card {
          background: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }
        .salary-btn {
          border: none;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }
        .salary-btn-green  { background: #15803d; color: #fff; }
        .salary-btn-green:hover { background: #166534; }
        .salary-btn-gray   { background: #f3f4f6; color: #111827; border: 1px solid #d1d5db; }
        .salary-table { width: 100%; border-collapse: collapse; }
        .salary-table th {
          background: #f9fafb;
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
          text-align: left;
        }
        .salary-table td {
          padding: 12px;
          border-bottom: 1px solid #f3f4f6;
          font-size: 14px;
        }
        .salary-table tr:hover td { background: #f9fafb; }
        .salary-paid    { color: #15803d; font-weight: 700; }
        .salary-balance { color: #dc2626; font-weight: 700; }
        .salary-actions { display: flex; gap: 8px; }
        .salary-small-btn {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .salary-edit   { background: #dbeafe; color: #1d4ed8; }
        .salary-view   { background: #dcfce7; color: #15803d; }
        .salary-modal-backdrop {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex; justify-content: center; align-items: center;
          z-index: 999;
        }
        .salary-modal {
          background: white; width: 100%; max-width: 450px;
          border-radius: 12px; overflow: hidden;
        }
        .salary-modal-header { background: #15803d; color: white; padding: 20px; }
        .salary-modal-body   { padding: 20px; }
        .salary-view-row {
          display: flex; justify-content: space-between;
          padding: 10px 0; border-bottom: 1px solid #f3f4f6;
        }
        .salary-close-btn {
          background: #f3f4f6; border: 1px solid #d1d5db;
          padding: 10px 16px; border-radius: 8px;
          font-weight: 600; cursor: pointer;
        }
        .emp-select-hint {
          font-size: 12px; color: #6b7280; margin-top: 4px;
        }
        .error-text {
          color: #dc2626; font-size: 13px; margin-top: 8px;
        }
      `}</style>

      {/* ── Page Header ── */}
      <div className="page-header">
        <h1>
          <i className="bi bi-cash-stack me-2" style={{ color: "#15803d" }}></i>
          Salary
        </h1>
        <p>Employee Salary Management</p>
      </div>

      {/* ── Budget Summary Row ── */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="salary-card" style={{ height: "100%" }}>
            <p
              className="text-muted mb-1"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Total Branch Budget
            </p>
            <h3 className="mb-0" style={{ color: "#0f172a", fontWeight: 800 }}>
              {inr(budget.total_branch_amount)}
            </h3>
          </div>
        </div>
        <div className="col-md-4">
          <div className="salary-card" style={{ height: "100%" }}>
            <p
              className="text-muted mb-1"
              style={{ fontSize: 12, fontWeight: 600 }}
            >
              Total Paid Salaries
            </p>
            <h3 className="mb-0" style={{ color: "#dc2626", fontWeight: 800 }}>
              {inr(budget.total_paid_salaries)}
            </h3>
          </div>
        </div>
        <div className="col-md-4">
          <div
            className="salary-card"
            style={{
              height: "100%",
              background: "#f0fdf4",
              borderColor: "#bbf7d0",
            }}
          >
            <p
              className="text-muted mb-1"
              style={{ fontSize: 12, fontWeight: 600, color: "#15803d" }}
            >
              Available Balance
            </p>
            <h3 className="mb-0" style={{ color: "#15803d", fontWeight: 800 }}>
              {inr(budget.available_balance)}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Tab Buttons ── */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          className={`salary-btn ${view === "form" ? "salary-btn-green" : "salary-btn-gray"}`}
          onClick={() => {
            if (!hasBranchSelected) {
              alert(
                "Please select a specific branch from the topbar before adding a salary.",
              );
              return;
            }
            resetForm();
            setView("form");
          }}
          disabled={!hasBranchSelected}
          style={
            !hasBranchSelected ? { opacity: 0.5, cursor: "not-allowed" } : {}
          }
        >
          Add Salary
        </button>
        <button
          className={`salary-btn ${view === "table" ? "salary-btn-green" : "salary-btn-gray"}`}
          onClick={() => setView("table")}
        >
          Salary Records
        </button>
      </div>

      {/* ════════════════════════════════════════
          ADD / EDIT SALARY FORM
      ════════════════════════════════════════ */}
      {view === "form" && (
        <form onSubmit={handleSubmit}>
          <div className="salary-card">
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Select Employee</label>
                {empLoading ? (
                  <div className="form-control" style={{ color: "#9ca3af" }}>
                    Loading employees…
                  </div>
                ) : (
                  <select
                    className="form-select"
                    value={form.employeeId}
                    onChange={handleEmployeeSelect}
                    required
                  >
                    <option value="">— Select Employee —</option>
                    {employees.map((emp) => (
                      <option key={emp.emp_id} value={emp.emp_id}>
                        {emp.emp_name} ({emp.emp_id})
                      </option>
                    ))}
                  </select>
                )}
                <p className="emp-select-hint">
                  Name & ID auto-filled from database
                </p>
              </div>

              <div className="col-md-6">
                <label className="form-label">Employee ID</label>
                <input
                  type="text"
                  className="form-control"
                  name="employeeId"
                  value={form.employeeId}
                  readOnly
                  style={{ background: "#f9fafb" }}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Salary</label>
                <input
                  type="number"
                  className="form-control"
                  name="salary"
                  value={form.salary}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Paid</label>
                <input
                  type="number"
                  className="form-control"
                  name="paid"
                  value={form.paid}
                  onChange={handleChange}
                  required
                />
                <small className="text-muted">
                  Available: {inr(budget.available_balance)}
                </small>
              </div>

              <div className="col-md-4">
                <label className="form-label">Balance</label>
                <input
                  type="number"
                  className="form-control"
                  name="balance"
                  value={form.balance}
                  readOnly
                  style={{ background: "#f9fafb" }}
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Type</label>
                <select
                  className="form-select"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                >
                  <option value="Days">Days</option>
                  <option value="Weeks">Weeks</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12">
                {error && <div className="error-text">{error}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button type="submit" className="salary-btn salary-btn-green">
                    {editId !== null ? "Update Salary" : "Save Salary"}
                  </button>
                  <button
                    type="button"
                    className="salary-btn salary-btn-gray"
                    onClick={resetForm}
                  >
                    Reset
                  </button>
                </div>
                {editId !== null && (
                  <p className="emp-select-hint" style={{ marginTop: 8 }}>
                    Note: Update functionality is not yet implemented in the
                    backend.
                  </p>
                )}
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ════════════════════════════════════════
          SALARY RECORDS TABLE
      ════════════════════════════════════════ */}
      {view === "table" && (
        <div className="salary-card">
          <div
            style={{
              marginBottom: 16,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 10,
            }}
          >
            <input
              type="text"
              className="form-control"
              placeholder="Search Employee"
              style={{ maxWidth: 300 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              className="salary-btn salary-btn-green"
              onClick={() => {
                if (!hasBranchSelected) {
                  alert(
                    "Please select a specific branch from the topbar before adding a salary.",
                  );
                  return;
                }
                resetForm();
                setView("form");
              }}
              disabled={!hasBranchSelected}
              style={
                !hasBranchSelected
                  ? { opacity: 0.5, cursor: "not-allowed" }
                  : {}
              }
            >
              Add New
            </button>
          </div>

          {error && (
            <div className="error-text" style={{ marginBottom: 10 }}>
              {error}
            </div>
          )}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#6b7280" }}>
              Loading records…
            </div>
          ) : (
            <div className="table-responsive">
              <table className="salary-table">
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
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec, idx) => (
                    <tr key={rec.id}>
                      <td>{idx + 1}</td>
                      <td>{rec.employeeName}</td>
                      <td>{rec.employeeId}</td>
                      <td>{inr(rec.salary)}</td>
                      <td className="salary-paid">{inr(rec.paid)}</td>
                      <td className="salary-balance">{inr(rec.balance)}</td>
                      <td>{rec.type}</td>
                      <td>{rec.salary_date ?? rec.date}</td>
                      <td>
                        <div
                          className="salary-actions"
                          style={{ justifyContent: "flex-end" }}
                        >
                          <button
                            type="button"
                            className="salary-small-btn salary-view"
                            onClick={() => setViewRecord(rec)}
                          >
                            View
                          </button>
                          <button
                            type="button"
                            className="salary-small-btn salary-edit"
                            onClick={() => handleEdit(rec)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan="9"
                        style={{
                          textAlign: "center",
                          padding: 30,
                          color: "#6b7280",
                        }}
                      >
                        No Records Found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          VIEW RECORD MODAL
      ════════════════════════════════════════ */}
      {viewRecord && (
        <div
          className="salary-modal-backdrop"
          onClick={() => setViewRecord(null)}
        >
          <div className="salary-modal" onClick={(e) => e.stopPropagation()}>
            <div className="salary-modal-header">
              <h3 style={{ margin: 0 }}>{viewRecord.employeeName}</h3>
              <p style={{ marginTop: 5 }}>{viewRecord.employeeId}</p>
            </div>
            <div className="salary-modal-body">
              <div className="salary-view-row">
                <strong>Salary</strong> <span>{inr(viewRecord.salary)}</span>
              </div>
              <div className="salary-view-row">
                <strong>Paid</strong>{" "}
                <span className="salary-paid">{inr(viewRecord.paid)}</span>
              </div>
              <div className="salary-view-row">
                <strong>Balance</strong>{" "}
                <span style={{ color: "#dc2626" }}>
                  {inr(viewRecord.balance)}
                </span>
              </div>
              <div className="salary-view-row">
                <strong>Type</strong> <span>{viewRecord.type}</span>
              </div>
              <div className="salary-view-row">
                <strong>Date</strong>{" "}
                <span>{viewRecord.salary_date ?? viewRecord.date}</span>
              </div>
              <div
                style={{
                  marginTop: 20,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="salary-close-btn"
                  onClick={() => setViewRecord(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
