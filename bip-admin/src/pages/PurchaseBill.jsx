import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

const emptyItem = () => ({
  product_id: "",
  product_name: "",
  quantity: "",
  rate: "",
  amount: "0.00",
});

const emptyForm = () => ({
  company_name: "",
  invoice_no: "",
  bill_date: new Date().toISOString().slice(0, 10),
  notes: "",
  items: [emptyItem()],
});

export default function PurchaseBill() {
  const [bills, setBills] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Search filters
  const [filters, setFilters] = useState({
    company: "",
    product: "",
    invoice: "",
    date_from: "",
    date_to: "",
  });

  const fetchBills = async (activeFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
      const res = await apiFetch(
        `/get_purchase_bills.php?${params.toString()}`,
      );
      const data = await res.json();
      setBills(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load purchase bills");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const applyFilters = () => fetchBills(filters);

  const clearFilters = () => {
    const cleared = {
      company: "",
      product: "",
      invoice: "",
      date_from: "",
      date_to: "",
    };
    setFilters(cleared);
    fetchBills(cleared);
  };

  // ── Header field changes ──────────────────────────────────
  const handleHeaderChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ── Item row changes ──────────────────────────────────────
  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const items = [...form.items];
    items[index] = { ...items[index], [name]: value };

    const qty = parseFloat(items[index].quantity) || 0;
    const rate = parseFloat(items[index].rate) || 0;
    items[index].amount = (qty * rate).toFixed(2);

    setForm({ ...form, items });
  };

  const addItemRow = () => {
    setForm({ ...form, items: [...form.items, emptyItem()] });
  };

  const removeItemRow = (index) => {
    if (form.items.length === 1) return;
    const items = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items });
  };

  const resetForm = () => {
    setForm(emptyForm());
    setError("");
  };

  const totalAmount = form.items.reduce(
    (sum, it) => sum + (parseFloat(it.amount) || 0),
    0,
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.company_name || !form.invoice_no || !form.bill_date) {
      setError("Company name, invoice no and date are required");
      return;
    }

    for (let i = 0; i < form.items.length; i++) {
      const it = form.items[i];
      if (!it.product_id || !it.product_name || !it.quantity || !it.rate) {
        setError(
          `Item #${i + 1}: product ID, name, quantity and rate are required`,
        );
        return;
      }
    }

    try {
      const res = await apiFetch("/add_purchase_bill.php", {
        method: "POST",
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Purchase bill saved successfully");
        resetForm();
        fetchBills();
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
        <p>Record purchase bills with multiple products from one company</p>
      </div>

      {/* Add Purchase Bill Form */}
      <form onSubmit={handleSubmit} className="card form-card">
        <h3>
          <i className="bi bi-plus-circle"></i> Add Purchase Bill
        </h3>

        <div className="form-grid header-grid">
          <div className="form-group">
            <label>
              Company Name <b>*</b>
            </label>
            <input
              type="text"
              name="company_name"
              placeholder="Supplier / Company name"
              value={form.company_name}
              onChange={handleHeaderChange}
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
              onChange={handleHeaderChange}
              required
            />
          </div>
          <div className="form-group">
            <label>
              Bill Date <b>*</b>
            </label>
            <input
              type="date"
              name="bill_date"
              value={form.bill_date}
              onChange={handleHeaderChange}
              required
            />
          </div>
          <div className="form-group" style={{ gridColumn: "1 / -1" }}>
            <label>Notes</label>
            <input
              type="text"
              name="notes"
              placeholder="Optional notes"
              value={form.notes}
              onChange={handleHeaderChange}
            />
          </div>
        </div>

        <h4 className="items-title">
          <i className="bi bi-list-ul"></i> Products
        </h4>

        <div className="items-table-wrap">
          <table className="items-table">
            <thead>
              <tr>
                <th>Product ID *</th>
                <th>Product Name *</th>
                <th>Quantity *</th>
                <th>Rate (₹) *</th>
                <th>Amount (₹)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <input
                      type="text"
                      name="product_id"
                      placeholder="SKU / Code"
                      value={item.product_id}
                      onChange={(e) => handleItemChange(idx, e)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      name="product_name"
                      placeholder="Product name"
                      value={item.product_name}
                      onChange={(e) => handleItemChange(idx, e)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="quantity"
                      placeholder="0"
                      min="0"
                      step="any"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, e)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      name="rate"
                      placeholder="0.00"
                      min="0"
                      step="any"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, e)}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={`₹ ${item.amount}`}
                      readOnly
                      className="readonly-input"
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="remove-row-btn"
                      onClick={() => removeItemRow(idx)}
                      disabled={form.items.length === 1}
                      title="Remove row"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="items-footer">
          <button type="button" className="add-row-btn" onClick={addItemRow}>
            <i className="bi bi-plus-lg"></i> Add Product
          </button>
          <div className="grand-total">
            Total Amount: <b>{inr(totalAmount.toFixed(2))}</b>
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

      {/* Search Filters */}
      <div className="card filter-card">
        <h3>
          <i className="bi bi-search"></i> Search Purchase Bills
        </h3>
        <div className="filter-grid">
          <div className="form-group">
            <label>Company</label>
            <input
              type="text"
              name="company"
              placeholder="Company name"
              value={filters.company}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label>Product</label>
            <input
              type="text"
              name="product"
              placeholder="Product name / ID"
              value={filters.product}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label>Invoice No.</label>
            <input
              type="text"
              name="invoice"
              placeholder="Invoice number"
              value={filters.invoice}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label>From Date</label>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
            />
          </div>
          <div className="form-group">
            <label>To Date</label>
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
            />
          </div>
        </div>
        <div className="action-row">
          <button type="button" className="save-btn" onClick={applyFilters}>
            <i className="bi bi-search"></i> Search
          </button>
          <button type="button" className="reset-btn" onClick={clearFilters}>
            <i className="bi bi-x-circle"></i> Clear
          </button>
        </div>
      </div>

      {/* Records */}
      <div className="card records-card">
        <h3>
          <i className="bi bi-table"></i> Purchase Bill Records
        </h3>

        {loading && <p className="loading-text">Loading...</p>}
        {error && !loading && <div className="error-message">{error}</div>}

        {!loading && !error && (
          <div className="bills-list">
            {bills.length === 0 ? (
              <p className="empty">No purchase bill records found</p>
            ) : (
              bills.map((bill) => (
                <div className="bill-block" key={bill.id}>
                  <div className="bill-header">
                    <div>
                      <strong>{bill.company_name}</strong> — Invoice:{" "}
                      {bill.invoice_no}
                    </div>
                    <div>
                      <span className="bill-date">{bill.bill_date}</span>
                      <span className="bill-total">
                        {inr(bill.total_amount)}
                      </span>
                    </div>
                  </div>
                  {bill.notes && <div className="bill-notes">{bill.notes}</div>}
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Product ID</th>
                          <th>Product Name</th>
                          <th>Quantity</th>
                          <th>Rate (₹)</th>
                          <th>Amount (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bill.items || []).map((it) => (
                          <tr key={it.id}>
                            <td>{it.product_id}</td>
                            <td>{it.product_name}</td>
                            <td>{it.quantity}</td>
                            <td>{inr(it.rate)}</td>
                            <td>{inr(it.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <style>{`
        .purchase-bill-page { color: #0f172a; }
        .page-header { padding-bottom: 24px; border-bottom: 1px solid #d9e1ea; margin-bottom: 28px; }
        .page-header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 800; }
        .page-header p { margin: 0; color: #475569; font-size: 16px; }
        .card { background: #fff; border: 1px solid #dbe3ec; border-radius: 12px; box-shadow: 0 2px 6px rgba(15,23,42,0.08); padding: 24px; margin-bottom: 28px; }
        .card h3 { margin: 0 0 20px; display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; }
        .card h3 i { color: #1a7f37; }
        .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .filter-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 15px; font-weight: 700; }
        .form-group label b { color: #dc2626; }
        .form-group input { height: 44px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; font-size: 15px; color: #1e293b; background: #fff; }
        .form-group input:focus { border-color: #1a7f37; box-shadow: 0 0 0 3px rgba(26,127,55,0.12); outline: none; }

        .items-title { margin: 24px 0 12px; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
        .items-table-wrap { overflow-x: auto; }
        .items-table { width: 100%; border-collapse: collapse; min-width: 720px; }
        .items-table th, .items-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .items-table th { background: #f8fafc; font-weight: 800; text-align: left; }
        .items-table input { height: 40px; width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 10px; font-size: 14px; }
        .readonly-input { background: #f8fafc; cursor: default; font-weight: 700; }
        .remove-row-btn { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; width: 36px; height: 36px; cursor: pointer; }
        .remove-row-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        .items-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
        .add-row-btn { background: #ecfdf5; border: 1px solid #a7f3d0; color: #166534; border-radius: 8px; padding: 8px 16px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .grand-total { font-size: 16px; }
        .grand-total b { color: #1a7f37; font-size: 18px; }

        .action-row { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; }
        .save-btn, .reset-btn { border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .save-btn { background: #1a7f37; color: #fff; }
        .save-btn:hover { background: #166534; }
        .reset-btn { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; }
        .error-message { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 16px; color: #dc2626; font-size: 14px; margin: 16px 0 0; }
        .loading-text { text-align: center; padding: 20px; color: #64748b; }

        .bills-list { display: flex; flex-direction: column; gap: 18px; }
        .bill-block { border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 16px; }
        .bill-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 15px; }
        .bill-date { color: #64748b; margin-right: 14px; }
        .bill-total { font-weight: 800; color: #1a7f37; }
        .bill-notes { color: #64748b; font-size: 13px; margin-bottom: 8px; }
        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        th { background: #f8fafc; font-weight: 800; color: #1e293b; }
        .empty { text-align: center; padding: 28px; color: #64748b; }

        @media (max-width: 1000px) {
          .form-grid, .filter-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 700px) {
          .form-grid, .filter-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
