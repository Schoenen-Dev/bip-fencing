import React, { useState, useEffect } from "react";

const API_BASE = "http://localhost:8000";

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
  quoteNo: "",
  quoteDate: new Date().toISOString().split("T")[0],
  validUntil: "",
  poNo: "",
  dispatchedThrough: "",
  vehicleNo: "",
  otherRef: "",
  clientName: "",
  clientPhone: "",
  clientEmail: "",
  clientGst: "",
  clientAddress: "",
  shipName: "",
  shipAddress: "",
  shipGst: "",
  shipState: "",
  shipStateCode: "",
  discount: 0,
  taxPercent: 18,
  notes: "",
  declaration: "",
  items: [
    { description: "", hsn: "", dueOn: "", unit: "Nos", qty: 1, rate: 0 },
  ],
};

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "—");

export default function Quotation() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [view, setView] = useState("table");
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [viewRec, setViewRec] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [sameAsBill, setSameAsBill] = useState(true);

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/quotation_api.php`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotationDetails = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/quotation_api.php?id=${id}`, {
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setForm({
        quoteNo: data.quote_no,
        quoteDate: data.quote_date,
        validUntil: data.valid_until || "",
        poNo: data.po_no || "",
        dispatchedThrough: data.dispatched_through || "",
        vehicleNo: data.vehicle_no || "",
        otherRef: data.other_ref || "",
        clientName: data.client_name,
        clientPhone: data.client_phone || "",
        clientEmail: data.client_email || "",
        clientGst: data.client_gst || "",
        clientAddress: data.client_address || "",
        shipName: data.ship_name || "",
        shipAddress: data.ship_address || "",
        shipGst: data.ship_gst || "",
        shipState: data.ship_state || "",
        shipStateCode: data.ship_state_code || "",
        discount: data.discount_percent,
        taxPercent: data.tax_percent,
        notes: data.notes || "",
        declaration: data.declaration || "",
        items: data.items.length
          ? data.items.map((i) => ({
              description: i.description,
              hsn: i.hsn || "",
              dueOn: i.due_on || "",
              unit: i.unit || "Nos",
              qty: i.quantity,
              rate: i.rate,
            }))
          : [
              {
                description: "",
                hsn: "",
                dueOn: "",
                unit: "Nos",
                qty: 1,
                rate: 0,
              },
            ],
      });
      setSameAsBill(!data.ship_name && !data.ship_address);
    } catch (err) {
      console.error(err);
      alert("Could not load quotation details");
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleItemChange = (i, field, value) => {
    const items = [...form.items];
    items[i][field] = value;
    setForm({ ...form, items });
  };
  const addItem = () =>
    setForm({
      ...form,
      items: [
        ...form.items,
        { description: "", hsn: "", dueOn: "", unit: "Nos", qty: 1, rate: 0 },
      ],
    });
  const removeItem = (i) =>
    setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const resetForm = () => {
    setForm(emptyForm);
    setEditId(null);
    setSameAsBill(true);
  };
  const copyBillToShip = () => {
    setForm({
      ...form,
      shipName: form.clientName,
      shipAddress: form.clientAddress,
      shipGst: form.clientGst,
      shipState: "Tamil Nadu",
      shipStateCode: "33",
    });
    setSameAsBill(false);
  };

  const calcTotals = (items, discount, tax) => {
    const subtotal = items.reduce((s, it) => s + it.qty * it.rate, 0);
    const discountAmt = subtotal * (discount / 100);
    const taxable = subtotal - discountAmt;
    const taxAmt = taxable * (tax / 100);
    const total = taxable + taxAmt;
    return { subtotal, discountAmt, taxable, taxAmt, total };
  };
  const { subtotal, discountAmt, taxAmt, total } = calcTotals(
    form.items,
    Number(form.discount),
    Number(form.taxPercent),
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.quoteNo ||
      !form.quoteDate ||
      !form.clientName ||
      form.items.length === 0
    ) {
      alert("Please fill all required fields");
      return;
    }
    try {
      const url = editId
        ? `${API_BASE}/quotation_api.php`
        : `${API_BASE}/quotation_api.php`;
      const method = editId ? "PUT" : "POST";
      const payload = editId ? { ...form, id: editId } : form;
      const res = await fetch(url, {
        method,
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        resetForm();
        setView("table");
        fetchQuotations();
      } else {
        alert(data.message || "Save failed");
      }
    } catch (err) {
      console.error(err);
      alert("Server error");
    }
  };

  const handleEdit = async (rec) => {
    setEditId(rec.id);
    await fetchQuotationDetails(rec.id);
    setView("form");
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(
        `${API_BASE}/quotation_api.php?id=${deleteId}`,
        { method: "DELETE", headers: getHeaders() },
      );
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchQuotations();
      } else {
        alert(data.message || "Delete failed");
      }
    } catch (err) {
      alert("Server error");
    } finally {
      setDeleteId(null);
    }
  };

  const handlePrint = (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Not logged in");
      return;
    }
    window.open(
      `${API_BASE}/print_quotation.php?id=${id}&token=${encodeURIComponent(token)}`,
      "_blank",
    );
  };

  const filtered = records.filter(
    (r) =>
      r.client_name.toLowerCase().includes(search.toLowerCase()) ||
      r.quote_no.toLowerCase().includes(search.toLowerCase()),
  );

  const summaryTotals = filtered.reduce(
    (acc, r) => {
      acc.totalSubtotal += r.subtotal || 0;
      acc.totalDiscount += r.discount_amount || 0;
      acc.totalRevenue += r.grand_total || 0;
      return acc;
    },
    { totalSubtotal: 0, totalDiscount: 0, totalRevenue: 0 },
  );

  const inr = (v) =>
    `₹ ${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="quotation-page" style={{ width: "100%", maxWidth: "100%" }}>
      <style>{`
        /* Force full width – override parent container restrictions */
        .quotation-page,
        .quotation-page ~ *,
        .quotation-page .container-fluid,
        .quotation-page .row {
          max-width: 100% !important;
          margin-left: 0 !important;
          margin-right: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .quotation-page {
          width: 100%;
          max-width: 100%;
          padding: 0 24px;
          box-sizing: border-box;
          font-family: 'Inter', system-ui, sans-serif;
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
        .qt-tab-bar {
          display: flex;
          gap: 8px;
          border-bottom: 2px solid #e1e8ed;
          margin-bottom: 24px;
        }
        .qt-tab {
          padding: 10px 22px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          background: none;
          cursor: pointer;
          color: #57606a;
          border-bottom: 2px solid transparent;
          margin-bottom: -2px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .qt-tab.active {
          color: #bc4c00;
          border-bottom-color: #bc4c00;
        }
        .qt-count {
          background: #fef3ec;
          color: #bc4c00;
          border-radius: 20px;
          padding: 1px 8px;
          font-size: 12px;
          margin-left: 4px;
        }
        .client-form-card {
          background: #fff;
          border: 1px solid #e1e8ed;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          width: 100%;
          box-sizing: border-box;
        }
        .card-title {
          font-weight: 700;
          font-size: 14px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #bc4c00;
        }
        /* Form grid – 3 columns on large screens */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          width: 100%;
        }
        /* Items that should span all columns */
        .full-width {
          grid-column: span 3;
        }
        /* Tablet: 2 columns */
        @media (max-width: 992px) {
          .form-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .full-width {
            grid-column: span 2;
          }
        }
        /* Mobile: 1 column */
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
          .full-width {
            grid-column: span 1;
          }
          .quotation-page {
            padding: 0 12px;
          }
        }
        .form-control, .form-select {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #d0d7de;
          border-radius: 8px;
          font-size: 13px;
          box-sizing: border-box;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .items-table {
          width: 100%;
          min-width: 800px;
          border-collapse: collapse;
        }
        .items-table th, .items-table td {
          padding: 8px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
          text-align: left;
        }
        .items-table th {
          background: #f6f8fa;
          font-size: 12px;
          font-weight: 600;
        }
        .btn-add-item {
          background: #bc4c00;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-remove {
          background: none;
          border: none;
          color: #cf222e;
          cursor: pointer;
          font-size: 16px;
        }
        .totals-panel {
          display: flex;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .totals-inner {
          min-width: 280px;
          background: #f6f8fa;
          border-radius: 12px;
          padding: 16px;
        }
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 13px;
        }
        .totals-row.grand {
          font-weight: 700;
          font-size: 15px;
          margin-top: 8px;
        }
        .grand-total {
          color: #bc4c00;
        }
        .totals-divider {
          height: 1px;
          background: #d0d7de;
          margin: 10px 0;
        }
        .form-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 20px;
        }
        .btn-submit {
          background: #bc4c00;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 24px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn-reset {
          background: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 8px;
          padding: 10px 24px;
          font-weight: 600;
          cursor: pointer;
        }
        .qt-records-card {
          background: #fff;
          border: 1px solid #e1e8ed;
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
        }
        .toolbar {
          display: flex;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #e1e8ed;
          background: #fafbfc;
          flex-wrap: wrap;
          gap: 12px;
        }
        .search-wrap {
          position: relative;
          width: 260px;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #8c959f;
        }
        .search-input {
          width: 100%;
          padding: 8px 12px 8px 34px;
          border: 1px solid #d0d7de;
          border-radius: 8px;
          font-size: 13px;
        }
        .btn-add-new {
          background: #bc4c00;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 6px 16px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
        }
        .summary-row {
          display: flex;
          gap: 0;
          border-bottom: 1px solid #e1e8ed;
          flex-wrap: wrap;
        }
        .summary-item {
          flex: 1;
          padding: 12px 20px;
          border-right: 1px solid #e1e8ed;
          min-width: 120px;
        }
        .summary-item:last-child {
          border-right: none;
        }
        .summary-label {
          font-size: 11px;
          color: #8c959f;
          text-transform: uppercase;
          font-weight: 600;
        }
        .summary-value {
          font-size: 16px;
          font-weight: 700;
          margin-top: 4px;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
        }
        .data-table th {
          background: #f6f8fa;
          padding: 12px 16px;
          text-align: left;
          font-size: 12px;
          font-weight: 600;
          border-bottom: 1px solid #e1e8ed;
        }
        .data-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
          font-size: 13px;
        }
        .quote-no {
          font-weight: 700;
          color: #bc4c00;
          font-family: monospace;
        }
        .client-name {
          font-weight: 600;
        }
        .client-sub {
          font-size: 11px;
          color: #8c959f;
        }
        .mono {
          font-family: monospace;
          font-weight: 600;
        }
        .text-danger {
          color: #cf222e;
        }
        .grand-total-val {
          color: #bc4c00;
          font-weight: 700;
        }
        .actions {
          display: flex;
          gap: 6px;
          justify-content: flex-end;
          flex-wrap: wrap;
        }
        .action-btn {
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }
        .action-btn.view { background: #eef2ff; color: #1d4ed8; }
        .action-btn.edit { background: #fef3c7; color: #b45309; }
        .action-btn.print { background: #dcfce7; color: #15803d; }
        .action-btn.delete { background: #fee2e2; color: #b91c1c; }
        .empty { text-align: center; padding: 40px; color: #8c959f; }
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 400px;
          text-align: center;
        }
        .modal-view {
          background: white;
          border-radius: 16px;
          width: 500px;
          max-width: 90vw;
          overflow: hidden;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f9fafb;
          border-bottom: 1px solid #e1e8ed;
        }
        .modal-body {
          padding: 20px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #f0f0f0;
          font-size: 13px;
        }
        .detail-row.grand {
          font-weight: 700;
          font-size: 15px;
          margin-top: 8px;
          border-bottom: none;
        }
        .modal-footer {
          padding: 16px 20px;
          border-top: 1px solid #e1e8ed;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .btn-print, .btn-close {
          padding: 6px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 600;
        }
        .btn-print { background: #bc4c00; color: white; }
        .btn-close { background: #f6f8fa; border: 1px solid #d0d7de; }
      `}</style>

      <div className="page-header">
        <h1>
          <i
            className="bi bi-file-earmark-spreadsheet-fill me-2"
            style={{ color: "#bc4c00" }}
          ></i>
          Quotation
        </h1>
        <p>Create, manage and print professional quotations</p>
      </div>

      <div className="qt-tab-bar">
        <button
          className={`qt-tab ${view === "form" ? "active" : ""}`}
          onClick={() => {
            resetForm();
            setView("form");
          }}
        >
          <i className="bi bi-plus-circle"></i>{" "}
          {editId ? "Edit Quotation" : "New Quotation"}
        </button>
        <button
          className={`qt-tab ${view === "table" ? "active" : ""}`}
          onClick={() => {
            setView("table");
            setEditId(null);
          }}
        >
          <i className="bi bi-table"></i> All Quotations{" "}
          <span className="qt-count">{records.length}</span>
        </button>
      </div>

      {view === "form" && (
        <form onSubmit={handleSubmit}>
          {/* Quotation Details */}
          <div className="client-form-card">
            <div className="card-title">
              <i className="bi bi-file-earmark"></i> Quotation Details
            </div>
            <div className="form-grid">
              <div>
                <label>Quote No *</label>
                <input
                  name="quoteNo"
                  value={form.quoteNo}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
              <div>
                <label>Quote Date *</label>
                <input
                  type="date"
                  name="quoteDate"
                  value={form.quoteDate}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
              <div>
                <label>Valid Until</label>
                <input
                  type="date"
                  name="validUntil"
                  value={form.validUntil}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div>
                <label>PO / Order No.</label>
                <input
                  name="poNo"
                  value={form.poNo}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div>
                <label>Dispatched Through</label>
                <input
                  name="dispatchedThrough"
                  value={form.dispatchedThrough}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div>
                <label>Vehicle No.</label>
                <input
                  name="vehicleNo"
                  value={form.vehicleNo}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="full-width">
                <label>Other References</label>
                <input
                  name="otherRef"
                  value={form.otherRef}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div>
                <label>Discount %</label>
                <input
                  type="number"
                  name="discount"
                  value={form.discount}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  step="any"
                />
              </div>
              <div>
                <label>Tax %</label>
                <input
                  type="number"
                  name="taxPercent"
                  value={form.taxPercent}
                  onChange={handleChange}
                  className="form-control"
                  min="0"
                  step="any"
                />
              </div>
            </div>
          </div>

          {/* Buyer (Bill to) */}
          <div className="client-form-card">
            <div className="card-title">
              <i className="bi bi-person"></i> Buyer (Bill to)
            </div>
            <div className="form-grid">
              <div>
                <label>Client Name *</label>
                <input
                  name="clientName"
                  value={form.clientName}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
              <div>
                <label>Phone</label>
                <input
                  name="clientPhone"
                  value={form.clientPhone}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div>
                <label>Email</label>
                <input
                  name="clientEmail"
                  value={form.clientEmail}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div>
                <label>GSTIN</label>
                <input
                  name="clientGst"
                  value={form.clientGst}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="full-width">
                <label>Address</label>
                <textarea
                  name="clientAddress"
                  value={form.clientAddress}
                  onChange={handleChange}
                  className="form-control"
                  rows="2"
                ></textarea>
              </div>
            </div>
          </div>

          {/* Consignee (Ship to) */}
          <div className="client-form-card">
            <div className="card-title">
              <i className="bi bi-truck"></i> Consignee (Ship to)
            </div>
            {sameAsBill ? (
              <div>
                <button
                  type="button"
                  className="btn-add-item"
                  onClick={copyBillToShip}
                >
                  Same as Buyer
                </button>
              </div>
            ) : (
              <div className="form-grid">
                <div className="full-width">
                  <label>Name</label>
                  <input
                    name="shipName"
                    value={form.shipName}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div className="full-width">
                  <label>Address</label>
                  <textarea
                    name="shipAddress"
                    value={form.shipAddress}
                    onChange={handleChange}
                    className="form-control"
                    rows="2"
                  ></textarea>
                </div>
                <div>
                  <label>GSTIN</label>
                  <input
                    name="shipGst"
                    value={form.shipGst}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div>
                  <label>State</label>
                  <input
                    name="shipState"
                    value={form.shipState}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
                <div>
                  <label>State Code</label>
                  <input
                    name="shipStateCode"
                    value={form.shipStateCode}
                    onChange={handleChange}
                    className="form-control"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="client-form-card">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="card-title mb-0">
                <i className="bi bi-list-ul"></i> Quotation Items
              </div>
              <button type="button" onClick={addItem} className="btn-add-item">
                <i className="bi bi-plus-lg"></i> Add Item
              </button>
            </div>
            <div className="table-responsive">
              <table className="items-table">
                <thead>
                  <tr>
                    <th style={{ width: 35 }}>#</th>
                    <th>Description</th>
                    <th style={{ width: 80 }}>HSN/SAC</th>
                    <th style={{ width: 90 }}>Due on</th>
                    <th style={{ width: 70 }}>Unit</th>
                    <th style={{ width: 80 }}>Qty</th>
                    <th style={{ width: 100 }}>Rate (INR)</th>
                    <th style={{ width: 110 }}>Amount</th>
                    <th style={{ width: 45 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        <input
                          className="form-control"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(i, "description", e.target.value)
                          }
                          placeholder="Product / Service"
                        />
                      </td>
                      <td>
                        <input
                          className="form-control"
                          value={item.hsn}
                          onChange={(e) =>
                            handleItemChange(i, "hsn", e.target.value)
                          }
                          placeholder="HSN"
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          className="form-control"
                          value={item.dueOn}
                          onChange={(e) =>
                            handleItemChange(i, "dueOn", e.target.value)
                          }
                        />
                      </td>
                      <td>
                        <select
                          className="form-control"
                          value={item.unit}
                          onChange={(e) =>
                            handleItemChange(i, "unit", e.target.value)
                          }
                        >
                          {[
                            "Nos",
                            "Kg",
                            "Meter",
                            "Roll",
                            "R.FEET",
                            "Box",
                            "Set",
                            "Liter",
                            "Ton",
                          ].map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={item.qty}
                          onChange={(e) =>
                            handleItemChange(
                              i,
                              "qty",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          min="0"
                          step="any"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className="form-control"
                          value={item.rate}
                          onChange={(e) =>
                            handleItemChange(
                              i,
                              "rate",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          min="0"
                          step="any"
                        />
                      </td>
                      <td className="text-right mono">
                        ₹ {(item.qty * item.rate).toFixed(2)}
                      </td>
                      <td>
                        {form.items.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove"
                            onClick={() => removeItem(i)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="totals-panel">
              <div className="totals-inner">
                <div className="totals-row">
                  <span>Subtotal</span>
                  <span className="mono">{inr(subtotal)}</span>
                </div>
                {discountAmt > 0 && (
                  <div className="totals-row">
                    <span>Discount ({form.discount}%)</span>
                    <span className="mono text-danger">
                      - {inr(discountAmt)}
                    </span>
                  </div>
                )}
                <div className="totals-row">
                  <span>Taxable Value</span>
                  <span className="mono">{inr(subtotal - discountAmt)}</span>
                </div>
                <div className="totals-row">
                  <span>CGST ({form.taxPercent / 2}%)</span>
                  <span className="mono">{inr(taxAmt / 2)}</span>
                </div>
                <div className="totals-row">
                  <span>SGST ({form.taxPercent / 2}%)</span>
                  <span className="mono">{inr(taxAmt / 2)}</span>
                </div>
                <div className="totals-divider"></div>
                <div className="totals-row grand">
                  <span>Grand Total</span>
                  <span className="mono grand-total">{inr(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes & Declaration */}
          <div className="client-form-card">
            <div className="form-grid">
              <div className="full-width">
                <label>Terms & Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="form-control"
                  rows="2"
                ></textarea>
              </div>
              <div className="full-width">
                <label>Declaration</label>
                <textarea
                  name="declaration"
                  value={form.declaration}
                  onChange={handleChange}
                  className="form-control"
                  rows="2"
                  placeholder="We declare that this quotation shows the actual price..."
                ></textarea>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              <i className="bi bi-save"></i>{" "}
              {editId ? "Update Quotation" : "Save Quotation"}
            </button>
            <button type="button" className="btn-reset" onClick={resetForm}>
              Reset
            </button>
          </div>
        </form>
      )}

      {view === "table" && (
        <div className="qt-records-card">
          <div className="toolbar">
            <div className="search-wrap">
              <i className="bi bi-search search-icon"></i>
              <input
                className="search-input"
                placeholder="Search by client or quote no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              className="btn-add-new"
              onClick={() => {
                resetForm();
                setView("form");
              }}
            >
              <i className="bi bi-plus-lg"></i> New Quotation
            </button>
          </div>
          <div className="summary-row">
            <div className="summary-item">
              <div className="summary-label">Total Quotes</div>
              <div className="summary-value">{filtered.length}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Subtotal</div>
              <div className="summary-value mono">
                {inr(summaryTotals.totalSubtotal)}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Discount</div>
              <div className="summary-value mono text-danger">
                {inr(summaryTotals.totalDiscount)}
              </div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Total Revenue</div>
              <div className="summary-value mono" style={{ color: "#bc4c00" }}>
                {inr(summaryTotals.totalRevenue)}
              </div>
            </div>
          </div>
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quote No</th>
                    <th>Client</th>
                    <th>Date</th>
                    <th>Valid Until</th>
                    <th>Items</th>
                    <th>Discount</th>
                    <th>Tax</th>
                    <th>Grand Total</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((rec) => (
                    <tr key={rec.id}>
                      <td className="quote-no">{rec.quote_no}</td>
                      <td>
                        <div className="client-name">{rec.client_name}</div>
                        {rec.client_phone && (
                          <div className="client-sub">{rec.client_phone}</div>
                        )}
                      </td>
                      <td>{fmtDate(rec.quote_date)}</td>
                      <td>
                        {rec.valid_until ? fmtDate(rec.valid_until) : "—"}
                      </td>
                      <td>{rec.items_count || 0} items</td>
                      <td className="mono text-danger">
                        {inr(rec.discount_amount)}
                      </td>
                      <td className="mono">{inr(rec.tax_amount)}</td>
                      <td className="mono grand-total-val">
                        {inr(rec.grand_total)}
                      </td>
                      <td className="actions">
                        <button
                          className="action-btn view"
                          onClick={() => setViewRec(rec)}
                        >
                          <i className="bi bi-eye"></i> View
                        </button>
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit(rec)}
                        >
                          <i className="bi bi-pencil"></i> Edit
                        </button>
                        <button
                          className="action-btn print"
                          onClick={() => handlePrint(rec.id)}
                        >
                          <i className="bi bi-printer"></i> Print
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => setDeleteId(rec.id)}
                        >
                          <i className="bi bi-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan="9" className="empty">
                        No quotations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🗑️</div>
            <div style={{ fontSize: "18px", fontWeight: 700 }}>
              Delete Quotation?
            </div>
            <div style={{ color: "#57606a", margin: "10px 0" }}>
              This action cannot be undone.
            </div>
            <div
              style={{
                display: "flex",
                gap: "10px",
                justifyContent: "center",
                marginTop: "20px",
              }}
            >
              <button
                className="btn-cancel"
                onClick={() => setDeleteId(null)}
                style={{
                  padding: "8px 18px",
                  border: "1px solid #d0d7de",
                  borderRadius: "8px",
                  background: "#f6f8fa",
                }}
              >
                Cancel
              </button>
              <button
                className="btn-confirm"
                onClick={handleDelete}
                style={{
                  padding: "8px 18px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#cf222e",
                  color: "white",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewRec && (
        <div className="modal-overlay" onClick={() => setViewRec(null)}>
          <div className="modal-view" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ margin: 0 }}>
                {viewRec.quote_no} — {viewRec.client_name}
              </h3>
              <button
                className="close"
                onClick={() => setViewRec(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <span>Client:</span> {viewRec.client_name}{" "}
                {viewRec.client_phone && `(${viewRec.client_phone})`}
              </div>
              <div className="detail-row">
                <span>Date:</span> {fmtDate(viewRec.quote_date)}{" "}
                {viewRec.valid_until &&
                  `Valid until ${fmtDate(viewRec.valid_until)}`}
              </div>
              <div className="detail-row">
                <span>Items:</span> {viewRec.items_count || 0} lines
              </div>
              <div className="detail-row">
                <span>Subtotal:</span> {inr(viewRec.subtotal)}
              </div>
              <div className="detail-row">
                <span>Discount:</span> {inr(viewRec.discount_amount)}
              </div>
              <div className="detail-row">
                <span>Tax:</span> {inr(viewRec.tax_amount)}
              </div>
              <div className="detail-row grand">
                <span>Grand Total:</span> {inr(viewRec.grand_total)}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-print"
                onClick={() => handlePrint(viewRec.id)}
              >
                <i className="bi bi-printer"></i> Print
              </button>
              <button className="btn-close" onClick={() => setViewRec(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}