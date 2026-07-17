import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

// ── Helpers ─────────────────────────────────────────────────
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
  gst_enabled: false,
  gst_rate: "18",
  opening_balance: "",
  paid_amount: "",
  items: [emptyItem()],
});

// Read the logged-in user saved at login time.
// NOTE: change "user" if your app stores it under a different key.
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
};

export default function PurchaseBill() {
  const storedUser = getStoredUser();
  const isAdmin = storedUser?.role === "admin";

  const [bills, setBills] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  // Form is HIDDEN by default — records show first
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Which bill (by id) is currently expanded to show full details
  const [expandedId, setExpandedId] = useState(null);

  // Per-bill "add payment" mini form
  const [payingBillId, setPayingBillId] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    payment_date: new Date().toISOString().slice(0, 10),
    note: "",
  });

  // Search filters (date range removed per request — company / product / invoice only)
  const [filters, setFilters] = useState({
    company: "",
    product: "",
    invoice: "",
  });

  const fetchBills = async (activeFilters = filters) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([k, v]) => {
        if (v) params.append(k, v);
      });
      const res = await apiFetch(`/get_purchase_bills.php?${params.toString()}`);
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

  const handleFilterChange = (e) =>
    setFilters({ ...filters, [e.target.name]: e.target.value });

  const applyFilters = () => fetchBills(filters);

  const clearFilters = () => {
    const cleared = {
      company: "",
      product: "",
      invoice: "",
    };
    setFilters(cleared);
    fetchBills(cleared);
  };

  // ── Form field handlers ───────────────────────────────────
  const handleHeaderChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const items = [...form.items];
    items[index] = { ...items[index], [name]: value };
    const qty = parseFloat(items[index].quantity) || 0;
    const rate = parseFloat(items[index].rate) || 0;
    items[index].amount = (qty * rate).toFixed(2);
    setForm({ ...form, items });
  };

  const addItemRow = () =>
    setForm({ ...form, items: [...form.items, emptyItem()] });

  const removeItemRow = (index) => {
    if (form.items.length === 1) return;
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const resetForm = () => {
    setForm(emptyForm());
    setFormError("");
    setEditingId(null);
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  // ── Live totals (GST + payment) ───────────────────────────
  const subtotal = form.items.reduce(
    (sum, it) => sum + (parseFloat(it.amount) || 0),
    0,
  );
  const gstRate = form.gst_enabled ? parseFloat(form.gst_rate) || 0 : 0;
  const gstAmount = form.gst_enabled ? (subtotal * gstRate) / 100 : 0;
  const totalAmount = subtotal + gstAmount;
  const openingBalance = parseFloat(form.opening_balance) || 0;
  const paidAmount = parseFloat(form.paid_amount) || 0;
  const closingBalance = openingBalance + totalAmount - paidAmount;

  // ── Save (create or admin update) ─────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.company_name || !form.invoice_no || !form.bill_date) {
      setFormError("Company name, invoice no and date are required");
      return;
    }
    for (let i = 0; i < form.items.length; i++) {
      const it = form.items[i];
      if (!it.product_id || !it.product_name || !it.quantity || !it.rate) {
        setFormError(
          `Item #${i + 1}: product ID, name, quantity and rate are required`,
        );
        return;
      }
    }
    if (form.gst_enabled && (gstRate < 0 || gstRate > 100)) {
      setFormError("GST rate must be between 0 and 100");
      return;
    }

    const payload = {
      ...form,
      gst_enabled: form.gst_enabled ? 1 : 0,
      gst_rate: gstRate,
      opening_balance: openingBalance,
      paid_amount: paidAmount,
    };

    const endpoint = editingId
      ? "/update_purchase_bill.php"
      : "/add_purchase_bill.php";
    if (editingId) payload.bill_id = editingId;

    setSaving(true);
    try {
      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON response:", text);
        setFormError(
          `Server returned an unexpected response (HTTP ${res.status}). Check console.`,
        );
        return;
      }

      if (res.ok) {
        alert(data.message || "Saved successfully");
        closeForm();
        fetchBills();
      } else {
        setFormError(
          data.message || data.error || `Save failed (HTTP ${res.status})`,
        );
      }
    } catch (err) {
      console.error(err);
      setFormError("Server error");
    } finally {
      setSaving(false);
    }
  };

  // ── Admin: edit ───────────────────────────────────────────
  const startEdit = (bill) => {
    setForm({
      company_name: bill.company_name || "",
      invoice_no: bill.invoice_no || "",
      bill_date: bill.bill_date || "",
      notes: bill.notes || "",
      gst_enabled: Number(bill.gst_enabled) === 1,
      gst_rate: String(parseFloat(bill.gst_rate) || 18),
      opening_balance: String(parseFloat(bill.opening_balance) || ""),
      paid_amount: String(parseFloat(bill.paid_amount) || ""),
      items: (bill.items || []).map((it) => ({
        product_id: it.product_id,
        product_name: it.product_name,
        quantity: String(parseFloat(it.quantity)),
        rate: String(parseFloat(it.rate)),
        amount: parseFloat(it.amount).toFixed(2),
      })),
    });
    setEditingId(bill.id);
    setFormError("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ── Admin: delete ─────────────────────────────────────────
  const handleDelete = async (bill) => {
    if (
      !window.confirm(
        `Delete bill ${bill.invoice_no} (${bill.company_name})?\nStock added by this bill will be reversed.`,
      )
    )
      return;
    try {
      const res = await apiFetch("/delete_purchase_bill.php", {
        method: "POST",
        body: JSON.stringify({ bill_id: bill.id }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Deleted");
        fetchBills();
      } else {
        alert(data.message || data.error || "Delete failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while deleting");
    }
  };

  // ── Record a later payment ────────────────────────────────
  const openPayForm = (billId) => {
    setPayingBillId(billId);
    setPayForm({
      amount: "",
      payment_date: new Date().toISOString().slice(0, 10),
      note: "",
    });
  };

  const submitPayment = async (bill) => {
    const amt = parseFloat(payForm.amount);
    if (isNaN(amt) || amt <= 0) {
      alert("Enter a valid payment amount");
      return;
    }
    try {
      const res = await apiFetch("/add_purchase_payment.php", {
        method: "POST",
        body: JSON.stringify({
          bill_id: bill.id,
          amount: amt,
          payment_date: payForm.payment_date,
          note: payForm.note,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || "Payment recorded");
        setPayingBillId(null);
        fetchBills();
      } else {
        alert(data.message || data.error || "Payment failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error while recording payment");
    }
  };

  // ── Expand / collapse a record ─────────────────────────────
  const toggleExpand = (billId) => {
    setExpandedId((prev) => (prev === billId ? null : billId));
    // closing the card should also close any open inline payment form
    setPayingBillId(null);
  };

  const inr = (v) => `₹${Number(v || 0).toLocaleString("en-IN")}`;

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

      {/* ── Add Purchase button + collapsible form ─────────── */}
      {!showForm && (
        <div className="add-purchase-bar">
          <button type="button" className="add-purchase-btn" onClick={openAddForm}>
            <i className="bi bi-plus-circle"></i> Add Purchase
          </button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="card form-card">
          <div className="form-title-row">
            <h3>
              <i
                className={
                  editingId ? "bi bi-pencil-square" : "bi bi-plus-circle"
                }
              ></i>{" "}
              {editingId ? `Edit Purchase Bill #${editingId}` : "Add Purchase Bill"}
            </h3>
            <button
              type="button"
              className="close-form-btn"
              onClick={closeForm}
              title="Close form"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

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
            <div className="form-group full-width">
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
            <table className="items-table responsive-table">
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
                    <td data-label="Product ID">
                      <input
                        type="text"
                        name="product_id"
                        placeholder="SKU / Code"
                        value={item.product_id}
                        onChange={(e) => handleItemChange(idx, e)}
                      />
                    </td>
                    <td data-label="Product Name">
                      <input
                        type="text"
                        name="product_name"
                        placeholder="Product name"
                        value={item.product_name}
                        onChange={(e) => handleItemChange(idx, e)}
                      />
                    </td>
                    <td data-label="Quantity">
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
                    <td data-label="Rate (₹)">
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
                    <td data-label="Amount (₹)">
                      <input
                        type="text"
                        value={`₹ ${item.amount}`}
                        readOnly
                        className="readonly-input"
                      />
                    </td>
                    <td data-label="">
                      <button
                        type="button"
                        className="remove-row-btn"
                        onClick={() => removeItemRow(idx)}
                        disabled={form.items.length === 1}
                        title="Remove row"
                      >
                        <i className="bi bi-trash"></i> <span className="btn-txt-mobile">Remove</span>
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
          </div>

          {/* ── GST section ─────────────────────────────────── */}
          <div className="gst-section">
            <label className="gst-toggle">
              <input
                type="checkbox"
                name="gst_enabled"
                checked={form.gst_enabled}
                onChange={handleHeaderChange}
              />
              <span>Include GST</span>
            </label>
            {form.gst_enabled && (
              <div className="form-group gst-rate-group">
                <label>GST Rate (%)</label>
                <select
                  name="gst_rate"
                  value={form.gst_rate}
                  onChange={handleHeaderChange}
                >
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            )}
          </div>

          {/* ── Payment section ─────────────────────────────── */}
          <h4 className="items-title">
            <i className="bi bi-cash-stack"></i> Payment Details
          </h4>
          <div className="form-grid payment-grid">
            <div className="form-group">
              <label>Opening Balance (₹)</label>
              <input
                type="number"
                name="opening_balance"
                placeholder="Previous outstanding (0 if none)"
                min="0"
                step="any"
                value={form.opening_balance}
                onChange={handleHeaderChange}
              />
            </div>
            <div className="form-group">
              <label>Paid Amount (₹)</label>
              <input
                type="number"
                name="paid_amount"
                placeholder="Advance / amount paid now"
                min="0"
                step="any"
                value={form.paid_amount}
                onChange={handleHeaderChange}
              />
            </div>
          </div>

          {/* ── Live summary ────────────────────────────────── */}
          <div className="totals-summary">
            <div className="totals-row">
              <span>Subtotal</span>
              <b>{inr(subtotal.toFixed(2))}</b>
            </div>
            {form.gst_enabled && (
              <div className="totals-row">
                <span>GST ({gstRate}%)</span>
                <b>{inr(gstAmount.toFixed(2))}</b>
              </div>
            )}
            <div className="totals-row grand">
              <span>Total Amount</span>
              <b>{inr(totalAmount.toFixed(2))}</b>
            </div>
            <div className="totals-row">
              <span>Opening Balance</span>
              <b>{inr(openingBalance.toFixed(2))}</b>
            </div>
            <div className="totals-row">
              <span>Paid Amount</span>
              <b className="paid">{inr(paidAmount.toFixed(2))}</b>
            </div>
            <div className="totals-row grand">
              <span>Closing Balance</span>
              <b className={closingBalance > 0 ? "due" : "paid"}>
                {inr(closingBalance.toFixed(2))}
              </b>
            </div>
          </div>

          {formError && <div className="error-message">{formError}</div>}

          <div className="action-row">
            <button type="submit" className="save-btn" disabled={saving}>
              <i className="bi bi-check-circle"></i>{" "}
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Purchase Bill"
                  : "Save Purchase Bill"}
            </button>
            <button type="button" className="reset-btn" onClick={resetForm}>
              <i className="bi bi-arrow-counterclockwise"></i> Reset
            </button>
            <button type="button" className="reset-btn" onClick={closeForm}>
              <i className="bi bi-x-circle"></i> Cancel
            </button>
          </div>
        </form>
      )}

      {/* ── Search Filters (date range removed) ─────────────── */}
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

      {/* ── Records (collapsed by default: company + invoice only) ── */}
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
              bills.map((bill) => {
                const balance = parseFloat(bill.closing_balance) || 0;
                const hasDue = balance > 0;
                const isOpen = expandedId === bill.id;
                return (
                  <div
                    className={`bill-block ${isOpen ? "open" : ""}`}
                    key={bill.id}
                  >
                    {/* ── Collapsed summary row: company + invoice only ── */}
                    <div
                      className="bill-header"
                      onClick={() => toggleExpand(bill.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleExpand(bill.id);
                        }
                      }}
                    >
                      <div className="bill-header-left">
                        <i
                          className={`bi bi-chevron-right expand-caret ${isOpen ? "rotated" : ""}`}
                        ></i>
                        <strong className={hasDue ? "company-due" : ""}>
                          {bill.company_name}
                          {hasDue && (
                            <span
                              className="due-dot"
                              title="Balance payment pending"
                            ></span>
                          )}
                        </strong>
                        <span className="bill-invoice">
                          Invoice: {bill.invoice_no}
                        </span>
                      </div>
                      <div className="bill-header-right">
                        {hasDue ? (
                          <span className="balance-pill due">
                            Due {inr(bill.closing_balance)}
                          </span>
                        ) : (
                          <span className="balance-pill settled">
                            Settled
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ── Expanded details ─────────────────────────── */}
                    {isOpen && (
                      <div
                        className="bill-details"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="bill-meta-row">
                          <span className="bill-date">
                            <i className="bi bi-calendar3"></i> {bill.bill_date}
                          </span>
                          <span className="bill-total">
                            {inr(bill.total_amount)}
                          </span>
                          {isAdmin && bill.branch_name && (
                            <span className="bill-branch">
                              <i className="bi bi-building"></i>{" "}
                              {bill.branch_name}
                            </span>
                          )}
                          {Number(bill.gst_enabled) === 1 && (
                            <span className="gst-badge">
                              GST {parseFloat(bill.gst_rate)}%
                            </span>
                          )}
                          {isAdmin && (
                            <span className="admin-actions">
                              <button
                                type="button"
                                className="edit-btn"
                                onClick={() => startEdit(bill)}
                                title="Edit bill (admin)"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button
                                type="button"
                                className="delete-btn"
                                onClick={() => handleDelete(bill)}
                                title="Delete bill (admin)"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </span>
                          )}
                        </div>

                        {bill.notes && (
                          <div className="bill-notes">{bill.notes}</div>
                        )}

                        {/* Payment summary strip */}
                        <div className="pay-summary">
                          <div className="pay-chip">
                            <span>Subtotal</span>
                            <b>{inr(bill.subtotal)}</b>
                          </div>
                          {Number(bill.gst_enabled) === 1 && (
                            <div className="pay-chip">
                              <span>GST</span>
                              <b>{inr(bill.gst_amount)}</b>
                            </div>
                          )}
                          <div className="pay-chip">
                            <span>Total</span>
                            <b>{inr(bill.total_amount)}</b>
                          </div>
                          <div className="pay-chip">
                            <span>Opening Bal.</span>
                            <b>{inr(bill.opening_balance)}</b>
                          </div>
                          <div className="pay-chip green">
                            <span>Paid</span>
                            <b>{inr(bill.paid_amount)}</b>
                          </div>
                          <div
                            className={`pay-chip ${hasDue ? "red" : "green"}`}
                          >
                            <span>Balance</span>
                            <b>{inr(bill.closing_balance)}</b>
                          </div>
                          {hasDue && (
                            <button
                              type="button"
                              className="pay-btn"
                              onClick={() => openPayForm(bill.id)}
                            >
                              <i className="bi bi-plus-circle"></i> Add
                              Payment
                            </button>
                          )}
                        </div>

                        {/* Inline add-payment form */}
                        {payingBillId === bill.id && (
                          <div className="pay-form">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              placeholder="Amount (₹)"
                              value={payForm.amount}
                              onChange={(e) =>
                                setPayForm({
                                  ...payForm,
                                  amount: e.target.value,
                                })
                              }
                            />
                            <input
                              type="date"
                              value={payForm.payment_date}
                              onChange={(e) =>
                                setPayForm({
                                  ...payForm,
                                  payment_date: e.target.value,
                                })
                              }
                            />
                            <input
                              type="text"
                              placeholder="Note (optional)"
                              value={payForm.note}
                              onChange={(e) =>
                                setPayForm({
                                  ...payForm,
                                  note: e.target.value,
                                })
                              }
                            />
                            <button
                              type="button"
                              className="save-btn small"
                              onClick={() => submitPayment(bill)}
                            >
                              <i className="bi bi-check-circle"></i> Save
                            </button>
                            <button
                              type="button"
                              className="reset-btn small"
                              onClick={() => setPayingBillId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Items */}
                        <div className="table-wrap">
                          <table className="responsive-table">
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
                                  <td data-label="Product ID">
                                    {it.product_id}
                                  </td>
                                  <td data-label="Product Name">
                                    {it.product_name}
                                  </td>
                                  <td data-label="Quantity">
                                    {it.quantity}
                                  </td>
                                  <td data-label="Rate (₹)">
                                    {inr(it.rate)}
                                  </td>
                                  <td data-label="Amount (₹)">
                                    {inr(it.amount)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Payment history */}
                        {(bill.payments || []).length > 0 && (
                          <div className="payments-history">
                            <div className="ph-title">
                              <i className="bi bi-clock-history"></i> Payment
                              History
                            </div>
                            <div className="table-wrap">
                              <table className="responsive-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Amount (₹)</th>
                                    <th>Note</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bill.payments.map((p) => (
                                    <tr key={p.id}>
                                      <td data-label="Date">
                                        {p.payment_date}
                                      </td>
                                      <td data-label="Amount (₹)">
                                        {inr(p.amount)}
                                      </td>
                                      <td data-label="Note">
                                        {p.note || "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
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

        .add-purchase-bar { margin-bottom: 20px; }
        .add-purchase-btn { background: #1a7f37; color: #fff; border: none; border-radius: 10px; padding: 12px 24px; font-size: 15px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; box-shadow: 0 2px 6px rgba(26,127,55,0.3); }
        .add-purchase-btn:hover { background: #166534; }

        .form-title-row { display: flex; justify-content: space-between; align-items: center; }
        .form-title-row h3 { margin-bottom: 20px; }
        .close-form-btn { background: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 8px; width: 36px; height: 36px; cursor: pointer; color: #475569; }

        .form-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .payment-grid { grid-template-columns: repeat(2, 1fr); margin-bottom: 8px; }
        .filter-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group.full-width { grid-column: 1 / -1; }
        .form-group label { font-size: 15px; font-weight: 700; }
        .form-group label b { color: #dc2626; }
        .form-group input, .form-group select { height: 44px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; font-size: 15px; color: #1e293b; background: #fff; }
        .form-group input:focus, .form-group select:focus { border-color: #1a7f37; box-shadow: 0 0 0 3px rgba(26,127,55,0.12); outline: none; }

        .items-title { margin: 24px 0 12px; font-size: 16px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
        .items-table-wrap { overflow-x: auto; }
        .items-table { width: 100%; border-collapse: collapse; }
        .items-table th, .items-table td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .items-table th { background: #f8fafc; font-weight: 800; text-align: left; }
        .items-table input { height: 40px; width: 100%; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 10px; font-size: 14px; }
        .readonly-input { background: #f8fafc; cursor: default; font-weight: 700; }
        .remove-row-btn { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; min-width: 36px; height: 36px; cursor: pointer; padding: 0 8px; }
        .remove-row-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-txt-mobile { display: none; }

        .items-footer { display: flex; justify-content: flex-start; margin-top: 14px; }
        .add-row-btn { background: #ecfdf5; border: 1px solid #a7f3d0; color: #166534; border-radius: 8px; padding: 8px 16px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }

        .gst-section { display: flex; align-items: flex-end; gap: 20px; margin: 18px 0 4px; flex-wrap: wrap; }
        .gst-toggle { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; cursor: pointer; padding: 10px 0; }
        .gst-toggle input { width: 20px; height: 20px; accent-color: #1a7f37; cursor: pointer; }
        .gst-rate-group { min-width: 160px; }

        .totals-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; margin-top: 18px; max-width: 420px; margin-left: auto; }
        .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 14px; }
        .totals-row.grand { border-top: 1px solid #e2e8f0; margin-top: 4px; padding-top: 9px; font-size: 15px; }
        .totals-row .paid { color: #1a7f37; }
        .totals-row .due { color: #dc2626; }

        .action-row { display: flex; gap: 12px; justify-content: flex-end; margin-top: 16px; flex-wrap: wrap; }
        .save-btn, .reset-btn { border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .save-btn { background: #1a7f37; color: #fff; }
        .save-btn:hover { background: #166534; }
        .save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .reset-btn { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; }
        .save-btn.small, .reset-btn.small { padding: 8px 14px; font-size: 13px; }
        .error-message { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 16px; color: #dc2626; font-size: 14px; margin: 16px 0 0; }
        .loading-text { text-align: center; padding: 20px; color: #64748b; }

        .bills-list { display: flex; flex-direction: column; gap: 12px; }

        /* ── Collapsed record row ─────────────────────────────── */
        .bill-block { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #fff; }
        .bill-block.open { border-color: #bcd9c6; box-shadow: 0 2px 8px rgba(26,127,55,0.08); }
        .bill-header { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 14px 16px; cursor: pointer; user-select: none; flex-wrap: wrap; }
        .bill-header:hover { background: #f8fafc; }
        .bill-header-left { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; min-width: 0; }
        .expand-caret { font-size: 13px; color: #64748b; transition: transform 0.15s ease; flex-shrink: 0; }
        .expand-caret.rotated { transform: rotate(90deg); color: #1a7f37; }
        .bill-header-left strong { font-size: 15px; }
        .bill-header-left strong.company-due { color: #dc2626; display: inline-flex; align-items: center; gap: 6px; }
        .due-dot { width: 8px; height: 8px; border-radius: 50%; background: #dc2626; display: inline-block; }
        .bill-invoice { color: #475569; font-size: 14px; }
        .bill-header-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .balance-pill { border-radius: 999px; padding: 4px 12px; font-size: 12px; font-weight: 800; }
        .balance-pill.due { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }
        .balance-pill.settled { background: #ecfdf5; border: 1px solid #a7f3d0; color: #166534; }

        /* ── Expanded details ─────────────────────────────────── */
        .bill-details { padding: 4px 16px 16px; border-top: 1px solid #eef2f7; cursor: default; }
        .bill-meta-row { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 12px 0 4px; }
        .bill-branch { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 700; display: inline-flex; align-items: center; gap: 5px; }
        .gst-badge { background: #fefce8; border: 1px solid #fde68a; color: #a16207; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 700; }
        .bill-date { color: #64748b; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; }
        .bill-total { font-weight: 800; color: #1a7f37; font-size: 15px; }
        .bill-notes { color: #64748b; font-size: 13px; margin-bottom: 8px; }

        .admin-actions { display: inline-flex; gap: 6px; margin-left: auto; }
        .edit-btn, .delete-btn { border-radius: 6px; width: 34px; height: 34px; cursor: pointer; }
        .edit-btn { background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }
        .delete-btn { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; }

        .pay-summary { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; margin: 10px 0 12px; }
        .pay-chip { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 6px 12px; display: flex; flex-direction: column; min-width: 90px; }
        .pay-chip span { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
        .pay-chip b { font-size: 14px; }
        .pay-chip.green { background: #ecfdf5; border-color: #a7f3d0; }
        .pay-chip.green b { color: #166534; }
        .pay-chip.red { background: #fef2f2; border-color: #fecaca; }
        .pay-chip.red b { color: #dc2626; }
        .pay-btn { background: #1a7f37; color: #fff; border: none; border-radius: 8px; padding: 9px 14px; font-size: 13px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }

        .pay-form { display: flex; gap: 10px; flex-wrap: wrap; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
        .pay-form input { height: 40px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 10px; font-size: 14px; flex: 1; min-width: 130px; }

        .payments-history { margin-top: 12px; }
        .ph-title { font-size: 13px; font-weight: 800; color: #475569; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }

        .table-wrap { overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        th { background: #f8fafc; font-weight: 800; color: #1e293b; }
        .empty { text-align: center; padding: 28px; color: #64748b; }

        @media (max-width: 1000px) {
          .form-grid { grid-template-columns: repeat(2, 1fr); }
          .filter-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ── Mobile: same collapsed behaviour, tables stack into cards ── */
        @media (max-width: 700px) {
          .form-grid, .filter-grid, .payment-grid { grid-template-columns: 1fr; }
          .card { padding: 16px; }

          .responsive-table thead { display: none; }
          .responsive-table, .responsive-table tbody, .responsive-table tr, .responsive-table td { display: block; width: 100%; }
          .responsive-table tr { border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 12px; padding: 8px 12px; background: #fff; }
          .responsive-table td { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px dashed #eef2f7; padding: 8px 0; }
          .responsive-table td:last-child { border-bottom: none; }
          .responsive-table td::before { content: attr(data-label); font-weight: 800; font-size: 12px; color: #475569; flex-shrink: 0; }
          .responsive-table td input { max-width: 60%; text-align: right; }
          .items-table td[data-label=""]::before { display: none; }
          .btn-txt-mobile { display: inline; font-size: 13px; font-weight: 700; }
          .remove-row-btn { width: 100%; height: 40px; }

          .totals-summary { max-width: 100%; }

          .bill-header { flex-direction: row; align-items: center; justify-content: space-between; }
          .bill-header-left { flex: 1; min-width: 0; }
          .bill-header-left strong { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
          .bill-meta-row { flex-direction: row; flex-wrap: wrap; }
          .admin-actions { margin-left: 0; }
          .pay-summary .pay-chip { flex: 1 1 calc(50% - 10px); min-width: 0; }
          .pay-btn { width: 100%; justify-content: center; }
          .action-row { flex-direction: column; }
          .action-row button { width: 100%; justify-content: center; }
          .add-purchase-btn { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}