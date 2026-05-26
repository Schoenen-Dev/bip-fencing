import React, { useState } from "react";

const Employee_details = () => {
  const [formData, setFormData] = useState({
    emp_name: "",
    emp_id: "",
    department: "",
    designation: "",
    salary_type: "",
    date_of_joining: "",
    email: "",
    phone: "",
  });

  const [employees, setEmployees] = useState([]);
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const API_BASE = "http://localhost/attendance-api/employees.php";

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast("Employee added successfully!", "success");
        setFormData({
          emp_name: "", emp_id: "", department: "", designation: "",
          salary_type: "", date_of_joining: "", email: "", phone: "",
        });
        if (showTable) viewEmployeeDetails();
      } else if (response.status === 409) {
        showToast("Employee ID already exists.", "error");
      } else {
        showToast(data.error || "Failed to save employee.", "error");
      }
    } catch {
      showToast("Server error. Check connection.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const viewEmployeeDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE);
      const data = await response.json();
      setEmployees(data.employees || []);
      setShowTable(true);
    } catch {
      showToast("Failed to fetch employee details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Deactivate this employee?")) return;
    try {
      const response = await fetch(`${API_BASE}?id=${id}`, { method: "DELETE" });
      const data = await response.json();
      if (data.success) {
        showToast("Employee deactivated.", "success");
        setEmployees((prev) => prev.filter((e) => e.id !== id));
      } else {
        showToast("Failed to deactivate.", "error");
      }
    } catch {
      showToast("Server error.", "error");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: #0f1117; }

        .emp-root {
          min-height: 100vh;
          background: #0f1117;
          font-family: 'DM Sans', sans-serif;
          color: #e2e8f0;
          padding: 40px 20px 80px;
        }

        .emp-header {
          text-align: center;
          margin-bottom: 48px;
        }
        .emp-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 2.4rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #a78bfa, #60a5fa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .emp-header p {
          color: #64748b;
          font-size: 0.9rem;
          margin-top: 6px;
        }

        .emp-card {
          background: #161b27;
          border: 1px solid #1e2535;
          border-radius: 16px;
          padding: 36px;
          max-width: 780px;
          margin: 0 auto 32px;
        }
        .emp-card-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #a78bfa;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 28px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .emp-card-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #1e2535;
        }

        .emp-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 18px;
        }
        .emp-grid.full { grid-template-columns: 1fr; }

        .emp-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .emp-field label {
          font-size: 0.78rem;
          font-weight: 500;
          color: #94a3b8;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .emp-field input,
        .emp-field select {
          background: #0f1117;
          border: 1px solid #2a3347;
          border-radius: 10px;
          padding: 11px 14px;
          color: #e2e8f0;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.93rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          -webkit-appearance: none;
        }
        .emp-field input:focus,
        .emp-field select:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.15);
        }
        .emp-field select option { background: #161b27; }

        .emp-actions {
          display: flex;
          gap: 14px;
          margin-top: 28px;
          flex-wrap: wrap;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border: none;
          border-radius: 10px;
          padding: 12px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s, transform 0.15s;
        }
        .btn:active { transform: scale(0.97); }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-primary {
          background: linear-gradient(135deg, #7c3aed, #4f46e5);
          color: #fff;
        }
        .btn-primary:hover:not(:disabled) { opacity: 0.88; }
        .btn-outline {
          background: transparent;
          border: 1px solid #2a3347;
          color: #94a3b8;
        }
        .btn-outline:hover { border-color: #7c3aed; color: #a78bfa; }

        .btn-danger {
          background: transparent;
          border: none;
          color: #f87171;
          font-size: 0.82rem;
          padding: 5px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-danger:hover { background: rgba(248, 113, 113, 0.1); }

        /* Table */
        .emp-table-wrap {
          max-width: 780px;
          margin: 0 auto;
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
        }
        thead tr {
          background: #1a2035;
        }
        thead th {
          padding: 13px 16px;
          text-align: left;
          font-size: 0.75rem;
          font-weight: 600;
          color: #64748b;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        tbody tr {
          border-top: 1px solid #1e2535;
          transition: background 0.15s;
        }
        tbody tr:hover { background: #1a2035; }
        tbody td {
          padding: 13px 16px;
          color: #cbd5e1;
          white-space: nowrap;
        }
        .badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
        }
        .badge-monthly { background: #1e3a5f; color: #60a5fa; }
        .badge-weekly  { background: #1a3a2a; color: #4ade80; }
        .badge-daily   { background: #3a2a1a; color: #fb923c; }

        .empty-row td {
          text-align: center;
          color: #475569;
          padding: 40px;
          font-style: italic;
        }

        /* Toast */
        .toast {
          position: fixed;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          border-radius: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          z-index: 9999;
          animation: fadeUp 0.3s ease;
          white-space: nowrap;
        }
        .toast-success { background: #14532d; color: #4ade80; border: 1px solid #166534; }
        .toast-error   { background: #450a0a; color: #f87171; border: 1px solid #7f1d1d; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateX(-50%) translateY(10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .emp-grid { grid-template-columns: 1fr; }
          .emp-card { padding: 22px 16px; }
          .emp-header h1 { font-size: 1.8rem; }
        }
      `}</style>

      <div className="emp-root">
        <div className="emp-header">
          <h1>Employee Management</h1>
          <p>Add and manage your active employees</p>
        </div>

        {/* Form Card */}
        <div className="emp-card">
          <div className="emp-card-title">New Employee</div>
          <form onSubmit={handleSubmit}>
            <div className="emp-grid">
              <div className="emp-field">
                <label>Employee Name *</label>
                <input type="text" name="emp_name" value={formData.emp_name}
                  onChange={handleChange} placeholder="Full name" required />
              </div>
              <div className="emp-field">
                <label>Employee ID *</label>
                <input type="text" name="emp_id" value={formData.emp_id}
                  onChange={handleChange} placeholder="e.g. EMP-001" required />
              </div>
              <div className="emp-field">
                <label>Department</label>
                <input type="text" name="department" value={formData.department}
                  onChange={handleChange} placeholder="e.g. Engineering" />
              </div>
              <div className="emp-field">
                <label>Designation</label>
                <input type="text" name="designation" value={formData.designation}
                  onChange={handleChange} placeholder="e.g. Senior Developer" />
              </div>
              <div className="emp-field">
                <label>Email</label>
                <input type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="email@company.com" />
              </div>
              <div className="emp-field">
                <label>Phone</label>
                <input type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="+91 00000 00000" />
              </div>
              <div className="emp-field">
                <label>Salary Type</label>
                <select name="salary_type" value={formData.salary_type} onChange={handleChange} required>
                  <option value="">Select type</option>
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
              <div className="emp-field">
                <label>Date of Joining</label>
                <input type="date" name="date_of_joining" value={formData.date_of_joining}
                  onChange={handleChange} />
              </div>
            </div>

            <div className="emp-actions">
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <><span className="spinner"></span> Saving…</> : "Save Employee"}
              </button>
              <button type="button" className="btn btn-outline" onClick={viewEmployeeDetails} disabled={loading}>
                {loading ? <><span className="spinner"></span> Loading…</> : "View All Employees"}
              </button>
            </div>
          </form>
        </div>

        {/* Table */}
        {showTable && (
          <div className="emp-table-wrap">
            <div className="emp-card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "20px 24px 0", marginBottom: 0 }}>
                <div className="emp-card-title" style={{ marginBottom: 0 }}>
                  Active Employees ({employees.length})
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Designation</th>
                    <th>Salary</th>
                    <th>Joined</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? employees.map((emp) => (
                    <tr key={emp.id}>
                      <td><strong style={{ color: "#e2e8f0" }}>{emp.emp_name}</strong></td>
                      <td style={{ color: "#7c3aed", fontWeight: 600 }}>{emp.emp_id}</td>
                      <td>{emp.department || "—"}</td>
                      <td>{emp.designation || "—"}</td>
                      <td>
                        <span className={`badge badge-${emp.salary_type}`}>
                          {emp.salary_type || "—"}
                        </span>
                      </td>
                      <td>{emp.date_of_joining || "—"}</td>
                      <td>
                        <button className="btn-danger" onClick={() => handleDelete(emp.id)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr className="empty-row">
                      <td colSpan="7">No active employees found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>{toast.msg}</div>
      )}
    </>
  );
};

export default Employee_details;