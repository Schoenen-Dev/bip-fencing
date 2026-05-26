import React, { useEffect, useState } from "react";

const AdminFeatures = () => {
const API_BASE = "http://localhost:8000";

  const [records, setRecords] = useState([]);
  const [formData, setFormData] = useState({
    branch_name: "",
    amount: "",
    payment_date: "",
    note: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const fetchRecords = async () => {
    try {
      const response = await fetch(`${API_BASE}/admin_feature_get_branch_amounts.php`);
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error(error);
      alert("Failed to fetch branch amount records");
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch(`${API_BASE}/admin_feature_add_branch_amount.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    const result = await response.json();

    if (response.ok) {
      alert(result.message || "Branch amount saved successfully");

      setFormData({
        branch_name: "",
        amount: "",
        payment_date: "",
        note: "",
      });

      fetchRecords();
    } else {
      alert(result.message || "Failed to save branch amount");
      console.error(result);
    }
  } catch (error) {
    console.error("Fetch error:", error);
    alert(error.message);
  }
};
  return (
    <div className="admin-features-page">
      <div className="page-header">
        <h2>
          <i className="bi bi-bank"></i>
          Admin Features
        </h2>
        <p>Manage branch amount entries and records</p>
      </div>

      <form onSubmit={handleSubmit} className="card form-card">
        <h3>
          <i className="bi bi-plus-circle"></i>
          Add Branch Amount
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label>
              Branch Name <b>*</b>
            </label>
            <input
              type="text"
              name="branch_name"
              placeholder="Enter branch name"
              value={formData.branch_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Amount <b>*</b>
            </label>
            <input
              type="number"
              name="amount"
              placeholder="0.00"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Date <b>*</b>
            </label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Note</label>
            <input
              type="text"
              name="note"
              placeholder="Optional note"
              value={formData.note}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="action-row">
          <button type="submit">
            <i className="bi bi-check-circle"></i>
            Save Amount
          </button>
        </div>
      </form>

      <div className="card records-card">
        <h3>
          <i className="bi bi-table"></i>
          Branch Amount Records
        </h3>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Note</th>
              </tr>
            </thead>

            <tbody>
              {records.length > 0 ? (
                records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.branch_name}</td>
                    <td>INR {Number(record.amount).toFixed(2)}</td>
                    <td>{record.payment_date}</td>
                    <td>{record.note || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="empty">
                    No branch amount records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .admin-features-page {
          color: #0f172a;
        }

        .page-header {
          padding-bottom: 24px;
          border-bottom: 1px solid #d9e1ea;
          margin-bottom: 28px;
        }

        .page-header h2 {
          margin: 0 0 8px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 28px;
          font-weight: 800;
        }

        .page-header h2 i {
          color: #008b3e;
        }

        .page-header p {
          margin: 0;
          color: #475569;
          font-size: 17px;
        }

        .card {
          background: #ffffff;
          border: 1px solid #dbe3ec;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
          padding: 24px;
          margin-bottom: 28px;
        }

        .card h3 {
          margin: 0 0 22px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 21px;
          font-weight: 800;
        }

        .card h3 i {
          color: #008b3e;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .form-group label {
          font-size: 16px;
          font-weight: 800;
        }

        .form-group label b {
          color: #ef233c;
        }

        .form-group input {
          height: 48px;
          border: 1px solid #cbd5e1;
          border-radius: 7px;
          padding: 0 14px;
          font-size: 17px;
          color: #334155;
          outline: none;
        }

        .form-group input:focus {
          border-color: #008b3e;
          box-shadow: 0 0 0 3px rgba(0, 139, 62, 0.12);
        }

        .action-row {
          display: flex;
          justify-content: flex-end;
          margin-top: 22px;
        }

        .action-row button {
          border: 0;
          background: #008b3e;
          color: #ffffff;
          min-height: 46px;
          padding: 0 20px;
          border-radius: 7px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 15px;
        }

        th {
          background: #f8fafc;
          font-weight: 800;
          color: #334155;
        }

        td {
          color: #475569;
        }

        .empty {
          text-align: center;
          padding: 28px;
          color: #64748b;
        }

        @media (max-width: 1100px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 700px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminFeatures;
