import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

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

const Employee_details = () => {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("add");
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    employee_name: "",
    emp_id: "",
    department: "",
    salary_type: "",
    date_of_joining: "",
  });

  const API_BASE = "http://localhost:8000";

>>>>>>>>> Temporary merge branch 2
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_BASE}/add_employee.php`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        alert("Employee details saved successfully");
        setFormData({
          employee_name: "",
          emp_id: "",
          department: "",
          salary_type: "",
          date_of_joining: "",
          phone_number: "",
          address: "",
        });
      } else {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          alert("Session expired. Please log in again.");
          logout();
        } else {
          alert(errData.error || "Failed to save employee details");
        }
      }
    } catch (error) {
      console.error(error);
      alert("Server error");
    }
  };

  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE}/get_employees.php`, {
        headers: getHeaders(),
      });
      if (!response.ok) {
        if (response.status === 401) {
          alert("Session expired. Please log in again.");
          logout();
          return;
        }
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to fetch employee details.");
      }
      const data = await response.json();
      const list = Array.isArray(data)
        ? data
        : data.employees || data.data || [];
      setEmployees(list);
      setActiveTab("records");
    } catch (err) {
      console.error(err);
      setError(
        err.message || "Failed to fetch employee details. Check if get_employees.php exists.",
      );
      setActiveTab("records");
    } finally {
      setLoading(false);
    }
  };

  const getName = (emp) => emp.employee_name || emp.emp_name || "—";

  return (
    <div className="employee-page">
      <div className="page-header">
        <h2>
          <i className="bi bi-person-badge"></i>
          Employee Details
        </h2>
        <p>Manage employee records and staff information</p>
      </div>

      <div className="tabs">
        <button
          className={activeTab === "add" ? "tab active" : "tab"}
          onClick={() => setActiveTab("add")}
        >
          <i className="bi bi-plus-circle"></i>
          Add Employee
        </button>
        <button
          className={activeTab === "records" ? "tab active" : "tab"}
          onClick={fetchEmployees}
        >
          <i className="bi bi-table"></i>
          Employee Records
          <span>{employees.length}</span>
        </button>
      </div>

      {activeTab === "add" && (
        <form onSubmit={handleSubmit}>
          <div className="card employee-card">
            <h3>
              <i className="bi bi-person-vcard"></i>
              Employee Information
            </h3>
            <div className="form-grid">
              <div className="form-group large">
                <label>
                  Employee Name <b>*</b>
                </label>
                <input
                  type="text"
                  name="employee_name"
                  placeholder="Full name"
                  value={formData.employee_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Employee ID <b>*</b>
                </label>
                <input
                  type="text"
                  name="emp_id"
                  placeholder="EMP-001"
                  value={formData.emp_id}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Department <b>*</b>
                </label>
                <input
                  type="text"
                  name="department"
                  placeholder="Operations"
                  value={formData.department}
                  onChange={handleChange}
                  required
                />
              </div>
             <div className="form-group">
  <label>Phone Number <b>*</b></label>
  <input
    type="tel"
    name="phoneNumber"
    placeholder="Enter Phone Number"
    value={formData.phoneNumber}
    onChange={handleChange}
    required
  />
</div>

<div className="form-group">
  <label>Address <b>*</b></label>
  <input
    type="text"
    name="address"
    placeholder="Enter Address"
    value={formData.address}
    onChange={handleChange}
    required
  />
</div>
              <div className="form-group">
                <label>
                  Salary Type <b>*</b>
                </label>
                <select
                  name="salary_type"
                  value={formData.salary_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Salary Type</option>
                  <option value="monthly">Monthly Salary</option>
                  <option value="weekly">Weekly Salary</option>
                  <option value="daily">Daily Salary</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  Date of Joining <b>*</b>
                </label>
                <input
                  type="date"
                  name="date_of_joining"
                  value={formData.date_of_joining}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone_number"
                  placeholder="Phone number"
                  value={formData.phone_number}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group span-3">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          <div className="action-row">
            <button type="submit" className="save-btn">
              <i className="bi bi-check-circle"></i>
              Save Employee
            </button>
          </div>
        </form>
      )}

      {activeTab === "records" && (
        <div className="card records-card">
          <h3>
            <i className="bi bi-table"></i>
            Employee Records
          </h3>

          {loading && (
            <p style={{ color: "#475569", fontSize: 15 }}>Loading...</p>
          )}
          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "12px 16px",
                color: "#dc2626",
                fontSize: 14,
                marginBottom: 16,
              }}
            >
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Employee ID</th>
                    <th>Department</th>
                    <th>Salary Type</th>
                    <th>Date of Joining</th>
                    <th>Phone Number</th>
                    <th>Address</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.length > 0 ? (
                    employees.map((employee, i) => (
                      <tr key={employee.id || i}>
                        <td>{getName(employee)}</td>
                        <td>{employee.emp_id || "—"}</td>
                        <td>{employee.department || "—"}</td>
                        <td>{employee.salary_type || "—"}</td>
                        <td>{employee.date_of_joining || "—"}</td>
                        <td>{employee.phone_number || "—"}</td>
                        <td>{employee.address || "—"}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="empty">
                        No employee records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`
        .employee-page { padding: 0; color: #0f172a; }
        .page-header { padding-bottom: 28px; border-bottom: 1px solid #d9e1ea; }
        .page-header h2 { margin: 0 0 10px; display: flex; align-items: center; gap: 10px; font-size: 28px; font-weight: 800; color: #020617; }
        .page-header h2 i { color: #008b3e; font-size: 24px; }
        .page-header p { margin: 0; color: #475569; font-size: 17px; }
        .tabs { display: flex; gap: 24px; border-bottom: 1px solid #d9e1ea; margin-bottom: 30px; }
        .tab { border: 0; background: transparent; padding: 18px 0 16px; display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700; color: #475569; cursor: pointer; border-bottom: 2px solid transparent; }
        .tab.active { color: #008b3e; border-bottom-color: #008b3e; }
        .tab span { min-width: 26px; height: 26px; padding: 0 8px; border-radius: 999px; background: #d7f7e4; color: #008b3e; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; }
        .card { background: #ffffff; border: 1px solid #dbe3ec; border-radius: 12px; box-shadow: 0 1px 4px rgba(15,23,42,0.08); padding: 26px; }
        .employee-card { max-width: 875px; }
        .card h3 { margin: 0 0 26px; display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; }
        .card h3 i { color: #008b3e; }
        .form-grid { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 24px 20px; }
        .form-group { display: flex; flex-direction: column; gap: 10px; }
        .span-3 { grid-column: span 3; }
        .form-group label { font-size: 16px; font-weight: 800; color: #0f172a; }
        .form-group label b { color: #ef233c; }
        .form-group input, .form-group select { height: 50px; border: 1px solid #cbd5e1; border-radius: 9px; padding: 0 17px; font-size: 18px; color: #334155; background: #ffffff; outline: none; }
        .form-group input:focus, .form-group select:focus { border-color: #008b3e; box-shadow: 0 0 0 3px rgba(0,139,62,0.12); }
        .action-row { max-width: 875px; display: flex; justify-content: flex-end; margin-top: 22px; }
        .save-btn { border: 0; background: #008b3e; color: #ffffff; min-height: 46px; padding: 0 22px; border-radius: 8px; font-size: 16px; font-weight: 800; display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
        .records-card { max-width: 1000px; }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 14px 16px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
        th { background: #f8fafc; font-weight: 800; color: #334155; }
        td { color: #475569; }
        .empty { text-align: center; padding: 28px; color: #64748b; }
        @media (max-width: 900px) {
          .form-grid { grid-template-columns: 1fr; }
          .employee-card, .records-card, .action-row { max-width: 100%; }
          .tabs { gap: 18px; overflow-x: auto; }
        }
      `}</style>
    </div>
  );
};

export default Employee_details;
