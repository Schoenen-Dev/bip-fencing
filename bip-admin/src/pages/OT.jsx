import React, { useEffect, useMemo, useState } from "react";

const OT = () => {
  const API_BASE = "http://localhost:8000";

  const [employees, setEmployees] = useState([]);
  const [otRecords, setOtRecords] = useState([]);
  const [viewMode, setViewMode] = useState("add");
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    selected_employee: "",
    emp_name: "",
    emp_id: "",
    salary_type: "",
    start_time: "",
    end_time: "",
    ot_date: "",
  });

  const fetchEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/get_employees.php`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch employees error:", error);
      alert("Failed to fetch employees");
    }
  };

  const fetchOTRecords = async () => {
    try {
      const response = await fetch(`${API_BASE}/get_ot_details.php`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await response.json();
      setOtRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch OT records error:", error);
      alert("Failed to fetch OT records");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchOTRecords();
  }, []);

  const handleEmployeeChange = (e) => {
    const selectedEmployeeId = e.target.value;

    const selectedEmployee = employees.find(
      (employee) => String(employee.id) === String(selectedEmployeeId),
    );

    setFormData({
      ...formData,
      selected_employee: selectedEmployeeId,
      emp_name:
        selectedEmployee?.emp_name ||
        selectedEmployee?.employee_name ||
        selectedEmployee?.name ||
        "",
      emp_id: selectedEmployee?.emp_id || "",
      salary_type: selectedEmployee?.salary_type || "",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const totalOTHours = useMemo(() => {
    if (!formData.start_time || !formData.end_time) return 0;

    const start = new Date(`2000-01-01T${formData.start_time}`);
    let end = new Date(`2000-01-01T${formData.end_time}`);

    if (end < start) {
      end = new Date(`2000-01-02T${formData.end_time}`);
    }

    const diff = (end - start) / (1000 * 60 * 60);
    return Number(diff.toFixed(2));
  }, [formData.start_time, formData.end_time]);

  const formatTime = (time) => {
    if (!time) return "";

    const [hourValue, minute] = time.split(":");
    let hour = Number(hourValue);
    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12 || 12;

    return `${String(hour).padStart(2, "0")}:${minute} ${ampm}`;
  };

  const resetForm = () => {
    setFormData({
      selected_employee: "",
      emp_name: "",
      emp_id: "",
      salary_type: "",
      start_time: "",
      end_time: "",
      ot_date: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      emp_name: formData.emp_name,
      emp_id: formData.emp_id,
      salary_type: formData.salary_type,
      start_time: formatTime(formData.start_time),
      end_time: formatTime(formData.end_time),
      total_ot_hours: totalOTHours,
      ot_date: formData.ot_date,
    };

    try {
      const response = await fetch(`${API_BASE}/add_ot_details.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", 'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || "OT details saved successfully");
        resetForm();
        fetchOTRecords();
      } else {
        alert(result.message || "Failed to save OT details");
      }
    } catch (error) {
      console.error("Save OT error:", error);
      alert(error.message || "Server error");
    }
  };

  const handleToggleView = () => {
    if (viewMode === "add") {
      fetchOTRecords();
      setViewMode("records");
    } else {
      setViewMode("add");
    }
  };

  const filteredRecords = otRecords.filter((record) => {
    const search = searchTerm.toLowerCase();

    return (
      String(record.emp_name || "")
        .toLowerCase()
        .includes(search) ||
      String(record.emp_id || "")
        .toLowerCase()
        .includes(search) ||
      String(record.ot_date || "")
        .toLowerCase()
        .includes(search) ||
      String(record.total_ot_hours || "")
        .toLowerCase()
        .includes(search)
    );
  });

  const totalEntries = otRecords.length;

  const totalSavedHours = otRecords.reduce(
    (sum, record) => sum + Number(record.total_ot_hours || 0),
    0,
  );

  const totalEmployees = new Set(
    otRecords.map((record) => record.emp_id).filter(Boolean),
  ).size;

  return (
    <div className="ot-page">
      <div className="page-header">
        <div>
          <h2>
            <i className="bi bi-clock-history"></i>
            OT Details
          </h2>
          <p>Manage employee overtime records</p>
        </div>

        <button type="button" className="view-btn" onClick={handleToggleView}>
          <i
            className={viewMode === "add" ? "bi bi-table" : "bi bi-plus-circle"}
          ></i>
          {viewMode === "add" ? "View OT Records" : "Add OT Entry"}
        </button>
      </div>

      {viewMode === "add" && (
        <>
          <div className="summary-row">
            <div className="summary-box">
              <span>Entries</span>
              <strong>{totalEntries}</strong>
            </div>

            <div className="summary-box">
              <span>Total Hours</span>
              <strong>{totalSavedHours.toFixed(1)} hrs</strong>
            </div>

            <div className="summary-box">
              <span>Employees</span>
              <strong>{totalEmployees}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="card form-card">
            <h3>
              <i className="bi bi-plus-circle"></i>
              Add OT Entry
            </h3>

            <div className="form-grid">
              <div className="form-group wide">
                <label>
                  Employee <b>*</b>
                </label>
                <select
                  name="selected_employee"
                  value={formData.selected_employee}
                  onChange={handleEmployeeChange}
                  required
                >
                  <option value="">Select employee</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.emp_name ||
                        employee.employee_name ||
                        employee.name}{" "}
                      - {employee.emp_id}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Name</label>
                <input type="text" value={formData.emp_name} readOnly />
              </div>

              <div className="form-group">
                <label>ID</label>
                <input type="text" value={formData.emp_id} readOnly />
              </div>

              <div className="form-group">
                <label>Salary Type</label>
                <input type="text" value={formData.salary_type} readOnly />
              </div>

              <div className="form-group">
                <label>
                  Start Time <b>*</b>
                </label>
                <input
                  type="time"
                  name="start_time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  End Time <b>*</b>
                </label>
                <input
                  type="time"
                  name="end_time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Total Hours</label>
                <input type="text" value={`${totalOTHours} hrs`} readOnly />
              </div>

              <div className="form-group">
                <label>
                  Date <b>*</b>
                </label>
                <input
                  type="date"
                  name="ot_date"
                  value={formData.ot_date}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="action-row">
              <button type="submit">
                <i className="bi bi-check-circle"></i>
                Save OT Details
              </button>
            </div>
          </form>
        </>
      )}

      {viewMode === "records" && (
        <div className="card records-card">
          <div className="records-top">
            <h3>
              <i className="bi bi-table"></i>
              OT Records
            </h3>

            <input
              type="search"
              placeholder="Search name, ID, date, hours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Salary Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Hours</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecords.length > 0 ? (
                  filteredRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{record.emp_name}</td>
                      <td>{record.emp_id}</td>
                      <td>{record.salary_type}</td>
                      <td>{record.start_time}</td>
                      <td>{record.end_time}</td>
                      <td>{record.total_ot_hours} hrs</td>
                      <td>{record.ot_date}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty">
                      No OT records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="records-footer">
            Showing {filteredRecords.length} of {otRecords.length} records
          </div>
        </div>
      )}

      <style>{`
        .ot-page {
          color: #0f172a;
        }

        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid #d9e1ea;
        }

        .page-header h2 {
          margin: 0 0 6px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 26px;
          font-weight: 800;
        }

        .page-header h2 i,
        .card h3 i {
          color: #008b3e;
        }

        .page-header p {
          margin: 0;
          color: #475569;
          font-size: 15px;
        }

        .view-btn,
        .action-row button {
          border: 0;
          background: #008b3e;
          color: #ffffff;
          min-height: 42px;
          padding: 0 16px;
          border-radius: 7px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          white-space: nowrap;
        }

        .summary-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .summary-box {
          background: #ffffff;
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          padding: 14px 16px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
        }

        .summary-box span {
          display: block;
          color: #475569;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .summary-box strong {
          color: #0f172a;
          font-size: 24px;
          font-weight: 800;
        }

        .card {
          background: #ffffff;
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
          padding: 18px;
          margin-bottom: 20px;
        }

        .card h3 {
          margin: 0 0 16px;
          display: flex;
          align-items: center;
          gap: 9px;
          font-size: 19px;
          font-weight: 800;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1.5fr repeat(3, 1fr);
          gap: 14px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }

        .form-group label {
          font-size: 14px;
          font-weight: 800;
        }

        .form-group label b {
          color: #ef233c;
        }

        .form-group input,
        .form-group select,
        .records-top input {
          height: 42px;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          padding: 0 12px;
          font-size: 15px;
          color: #334155;
          outline: none;
          background: #ffffff;
        }

        .form-group input[readonly] {
          background: #f8fafc;
          cursor: not-allowed;
        }

        .form-group input:focus,
        .form-group select:focus,
        .records-top input:focus {
          border-color: #008b3e;
          box-shadow: 0 0 0 3px rgba(0, 139, 62, 0.12);
        }

        .action-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 16px;
        }

        .records-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          margin-bottom: 14px;
        }

        .records-top h3 {
          margin: 0;
        }

        .records-top input {
          width: 320px;
        }

        .table-wrap {
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 11px 12px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }

        th {
          background: #f8fafc;
          font-weight: 800;
          color: #334155;
        }

        tr:last-child td {
          border-bottom: 0;
        }

        .empty {
          text-align: center;
          padding: 24px;
          color: #64748b;
        }

        .records-footer {
          padding-top: 12px;
          color: #475569;
          font-size: 14px;
        }

        @media (max-width: 1100px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .page-header,
          .records-top {
            align-items: stretch;
            flex-direction: column;
          }

          .summary-row,
          .form-grid {
            grid-template-columns: 1fr;
          }

          .records-top input {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default OT;