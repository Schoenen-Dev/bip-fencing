import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

// Helper to get headers with admin branch selection
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
  company_name: "",
  product_name: "",
  product_id: "",
  quantity: "",
  rate: "",
  invoice_no: "",
  total_amount: "",
};

export default function PurchaseBill() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch purchase bills
  const fetchRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/get_purchase_bills.php`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load purchase bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updated = { ...form, [name]: value };
    // Auto-calculate total amount
    const qty = parseFloat(updated.quantity) || 0;
    const rate = parseFloat(updated.rate) || 0;
    updated.total_amount = (qty * rate).toFixed(2);
    setForm(updated);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !form.company_name ||
      !form.product_name ||
      !form.quantity ||
      !form.rate ||
      !form.invoice_no
    ) {
      setError("Please fill all required fields (*)");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/add_purchase_bill.php`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Purchase bill saved successfully");
        resetForm();
        fetchRecords();
      } else {
        setError(data.message || "Save failed");
      }
    } catch (err) {
      console.error(err);
      setError("Server error");
    }
  };

  const inr = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

  return (
    <div className="purchase-bill-page">
      <div className="page-header">
        <h1>
          <i
            className="bi bi-bag-check-fill me-2"
            style={{ color: "#1a7f37" }}
          ></i>
          Purchase Bill
        </h1>
        <p>Record and manage purchase bills from suppliers</p>
      </div>

      {/* Add Purchase Bill Form */}
      <form onSubmit={handleSubmit} className="card form-card">
        <h3>
          <i className="bi bi-plus-circle"></i> Add Purchase Bill
        </h3>

        <div className="form-grid">
          <div className="form-group">
            <label>
              Company Name <b>*</b>
            </label>
            <input
              type="text"
              name="company_name"
              placeholder="Supplier / Company name"
              value={form.company_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Product Name <b>*</b>
            </label>
            <input
              type="text"
              name="product_name"
              placeholder="Product name"
              value={form.product_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Product ID</label>
            <input
              type="text"
              name="product_id"
              placeholder="SKU / Product code"
              value={form.product_id}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>
              Quantity <b>*</b>
            </label>
            <input
              type="number"
              name="quantity"
              placeholder="0"
              min="0"
              step="any"
              value={form.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Rate (₹) <b>*</b>
            </label>
            <input
              type="number"
              name="rate"
              placeholder="0.00"
              min="0"
              step="any"
              value={form.rate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Invoice No. <b>*</b>
            </label>
            <input
              type="text"
              name="invoice_no"
              placeholder="INV-001"
              value={form.invoice_no}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Total Amount</label>
            <input
              type="text"
              value={form.total_amount ? `₹ ${form.total_amount}` : "₹ 0.00"}
              readOnly
              style={{ background: "#f8fafc", cursor: "default" }}
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="action-row">
          <button type="submit" className="save-btn">
            <i className="bi bi-check-circle"></i> Save Purchase Bill
          </button>
          <button type="button" className="reset-btn" onClick={resetForm}>
            <i className="bi bi-arrow-counterclockwise"></i> Reset
          </button>
        </div>
      </form>

      {/* Records Table */}
      <div className="card records-card">
        <h3>
          <i className="bi bi-table"></i> Purchase Bill Records
        </h3>

        {loading && <p className="loading-text">Loading...</p>}
        {error && !loading && <div className="error-message">{error}</div>}

        {!loading && !error && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Company Name</th>
                  <th>Product Name</th>
                  <th>Product ID</th>
                  <th>Quantity</th>
                  <th>Rate (₹)</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? (
                  records.map((rec) => (
                    <tr key={rec.id}>
                      <td>{rec.invoice_no}</td>
                      <td>{rec.company_name}</td>
                      <td>{rec.product_name}</td>
                      <td>{rec.product_id || "—"}</td>
                      <td>{rec.quantity}</td>
                      <td>{inr(rec.rate)}</td>
                      <td>{inr(rec.total_amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty">
                      No purchase bill records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`
        .purchase-bill-page {
          color: #0f172a;
        }
        .page-header {
          padding-bottom: 24px;
          border-bottom: 1px solid #d9e1ea;
          margin-bottom: 28px;
        }
        .page-header h1 {
          margin: 0 0 8px;
          font-size: 28px;
          font-weight: 800;
        }
        .page-header p {
          margin: 0;
          color: #475569;
          font-size: 16px;
        }
        .card {
          background: #ffffff;
          border: 1px solid #dbe3ec;
          border-radius: 12px;
          box-shadow: 0 2px 6px rgba(15,23,42,0.08);
          padding: 24px;
          margin-bottom: 28px;
        }
        .card h3 {
          margin: 0 0 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 800;
        }
        .card h3 i {
          color: #1a7f37;
        }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 15px;
          font-weight: 700;
        }
        .form-group label b {
          color: #dc2626;
        }
        .form-group input {
          height: 44px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0 12px;
          font-size: 15px;
          color: #1e293b;
          background: #fff;
        }
        .form-group input:focus {
          border-color: #1a7f37;
          box-shadow: 0 0 0 3px rgba(26,127,55,0.12);
          outline: none;
        }
        .action-row {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 16px;
        }
        .save-btn, .reset-btn {
          border: none;
          border-radius: 8px;
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        .save-btn {
          background: #1a7f37;
          color: #fff;
        }
        .save-btn:hover {
          background: #166534;
        }
        .reset-btn {
          background: #f1f5f9;
          color: #1e293b;
          border: 1px solid #cbd5e1;
        }
        .error-message {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 10px 16px;
          color: #dc2626;
          font-size: 14px;
          margin: 16px 0 0;
        }
        .loading-text {
          text-align: center;
          padding: 20px;
          color: #64748b;
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px 14px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        th {
          background: #f8fafc;
          font-weight: 800;
          color: #1e293b;
        }
        .empty {
          text-align: center;
          padding: 28px;
          color: #64748b;
        }
        @media (max-width: 1000px) {
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
}
