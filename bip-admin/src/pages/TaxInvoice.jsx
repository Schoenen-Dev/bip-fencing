// ✅ COMPLETE FIXED TAX INVOICE COMPONENT
// Stock deduction via API (products.php) — not localStorage

import React, { useState, useEffect } from "react";

const API_URL = "http://localhost:8000/products.php";

// ─── STATIC COMPANY DATA ─────────────────────────────────────────────────────
const COMPANY = {
  name: "BIP FENCING CONTRACT WORK",
  address: "NO. 26/A, MAIN ROAD, PAMBANKULAM, KALANTHAPANAI, PANAGUDI - 627109",
  gst: "33ABLPI5244C1Z1",
  state: "Tamil Nadu",
  stateCode: "33",
  phone: "9655072445",
};

const DEFAULT_BANK = {
  holderName: "BIP FENCING CONTRACT WORK",
  bankName: "CANARA BANK",
  accountNo: "120017946948",
  ifsc: "CNRB0003657",
  branch: "THERKU VALLIOOR",
};

const DECLARATION =
  "We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.";

const COPY_TYPES = [
  "ORIGINAL FOR RECIPIENT",
  "DUPLICATE FOR TRANSPORTER",
  "TRIPLICATE FOR SUPPLIER",
];

// ─── NUMBER TO WORDS (Indian) ─────────────────────────────────────────────────
const _ones = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const _tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function numToWords(n) {
  const num = Math.round(n);
  if (num === 0) return "Zero";
  if (num < 0) return "Minus " + numToWords(-num);
  if (num < 20) return _ones[num];
  if (num < 100) return _tens[Math.floor(num / 10)] + (num % 10 ? " " + _ones[num % 10] : "");
  if (num < 1000)
    return _ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + numToWords(num % 100) : "");
  if (num < 100000)
    return numToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 ? " " + numToWords(num % 1000) : "");
  if (num < 10000000)
    return numToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 ? " " + numToWords(num % 100000) : "");
  return (
    numToWords(Math.floor(num / 10000000)) +
    " Crore" +
    (num % 10000000 ? " " + numToWords(num % 10000000) : "")
  );
}

function amountInWords(amount) {
  const n = Math.round(amount * 100);
  const rupees = Math.floor(n / 100);
  const paise = n % 100;
  if (paise > 0)
    return "INR " + numToWords(rupees) + " and " + numToWords(paise) + " Paise Only";
  return "INR " + numToWords(rupees) + " Only";
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmt2 = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

const emptyProduct = () => ({ desc: "", hsn: "", qty: "", rateIncl: "", per: "NOS" });

// ─── PRINT STYLES ─────────────────────────────────────────────────────────────
const printStyles = `
@media print {
  html, body { width: 210mm; min-height: 297mm; margin: 0; padding: 0; background: #fff; }
  body * { visibility: hidden !important; }
  #bip-invoice-print, #bip-invoice-print * { visibility: visible !important; }
  #bip-invoice-print {
    position: relative !important; top: 0 !important; left: 0 !important;
    width: 100% !important; margin: 0 auto !important; padding: 0 !important;
    box-shadow: none !important; overflow: visible !important;
    page-break-after: auto !important;
  }
  .no-print { display: none !important; }
  table { width: 100% !important; border-collapse: collapse !important; page-break-inside: auto !important; }
  tr { page-break-inside: avoid !important; page-break-after: auto !important; }
  td, th { page-break-inside: avoid !important; }
  thead { display: table-header-group !important; }
  tfoot { display: table-footer-group !important; }
  @page { size: A4 portrait; margin: 8mm; }
}
`;

const cell = (extra = {}) => ({
  borderLeft: "1px solid #000",
  borderRight: "1px solid #000",
  borderTop: "none",
  borderBottom: "none",
  padding: "3px 5px",
  fontSize: 12,
  verticalAlign: "top",
  lineHeight: "1.4",
  ...extra,
});

const headerCell = (extra = {}) => ({
  ...cell(),
  borderTop: "1px solid #000",
  borderBottom: "1px solid #000",
  ...extra,
});

const sectionHead = {
  fontWeight: "bold",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
  marginBottom: 3,
  borderBottom: "1px dashed #999",
  paddingBottom: 2,
};

// ─── API HEADERS ──────────────────────────────────────────────────────────────
const getHeaders = () => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };
  const role = localStorage.getItem("role");
  if (role === "admin") {
    const viewBranch = localStorage.getItem("admin_view_branch");
    if (viewBranch) headers["X-Branch-ID"] = viewBranch;
  }
  return headers;
};

// ═════════════════════════════════════════════════════════════════════════════
export default function TaxInvoice() {
  const [step, setStep] = useState(1);
  const [savedProducts, setSavedProducts] = useState([]);
  const [stockReduced, setStockReduced] = useState(false);
  const [stockReducing, setStockReducing] = useState(false);

  // Load products from API
  useEffect(() => {
    fetchSavedProducts();
  }, []);

  async function fetchSavedProducts() {
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      // Map to camelCase for internal use
      setSavedProducts(
        data.map((p) => ({
          id: p.id,
          productName: p.product_name,
          sku: p.sku,
          category: p.category,
          unit: p.unit,
          sellingPrice: p.selling_price,
          stockQty: p.stock_qty,
          minStock: p.min_stock,
          description: p.description,
          // Keep originals for PUT
          _raw: p,
        }))
      );
    } catch (_) {}
  }

  const [form, setForm] = useState({
    copyType: "ORIGINAL FOR RECIPIENT",
    invoiceNo: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    referenceNo: "",
    buyersOrderNo: "",
    dated: "",
    dispatchDocNo: "",
    deliveryNoteDate: "",
    dispatchedThrough: "",
    destination: "",
    billOfLading: "",
    motorVehicleNo: "",
    ewayRequired: "",
    ewayNumber: "",
    paymentMode: "Credit",
    consigneeName: "",
    consigneeAddress: "",
    consigneeState: "Tamil Nadu",
    consigneeStateCode: "33",
    buyerName: "",
    buyerAddress: "",
    buyerPhone: "",
    buyerGst: "",
    buyerState: "Tamil Nadu",
    buyerStateCode: "33",
    openBalance: "",
    closingBalance: "",
    gstRate: 18,
    bankHolderName: DEFAULT_BANK.holderName,
    bankName: DEFAULT_BANK.bankName,
    bankAccountNo: DEFAULT_BANK.accountNo,
    bankIfsc: DEFAULT_BANK.ifsc,
    bankBranch: DEFAULT_BANK.branch,
  });

  const [products, setProducts] = useState([emptyProduct()]);
  const [errors, setErrors] = useState({});

  const handleForm = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "ewayRequired" && value === "No" ? { ewayNumber: "" } : {}),
    }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleProduct = (idx, field, value) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      return updated;
    });
  };

  const handleProductSelect = (idx, productName) => {
    if (!productName) {
      handleProduct(idx, "desc", "");
      return;
    }
    const found = savedProducts.find((p) => p.productName === productName);
    if (!found) return;

    const unitMap = {
      Pcs: "PCS", Kg: "KGS", Meter: "MTR", Roll: "RFT",
      Box: "SET", Set: "SET", Liter: "LTR",
    };

    setProducts((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        desc: found.productName,
        rateIncl: found.sellingPrice || "",
        per: unitMap[found.unit] || "NOS",
        hsn: found.sku || "",
      };
      return updated;
    });
  };

  const addProduct = () => setProducts((p) => [...p, emptyProduct()]);
  const removeProduct = (idx) => {
    if (products.length === 1) return;
    setProducts((p) => p.filter((_, i) => i !== idx));
  };

  const validate = () => {
    const e = {};
    if (!form.invoiceNo.trim()) e.invoiceNo = "Required";
    if (!form.invoiceDate) e.invoiceDate = "Required";
    if (!form.buyerName.trim()) e.buyerName = "Required";
    products.forEach((p, i) => {
      if (!p.desc.trim()) e[`desc_${i}`] = "Required";
      if (!p.qty || isNaN(p.qty) || Number(p.qty) <= 0) e[`qty_${i}`] = "Invalid";
      if (!p.rateIncl || isNaN(p.rateIncl) || Number(p.rateIncl) <= 0)
        e[`rateIncl_${i}`] = "Invalid";
    });
    return e;
  };

  const gstRate = parseFloat(form.gstRate) || 18;
  const cgstRate = gstRate / 2;
  const sgstRate = gstRate / 2;

  const rows = products.map((p) => {
    const qty = parseFloat(p.qty) || 0;
    const rateIncl = parseFloat(p.rateIncl) || 0;
    const rateExcl = rateIncl / (1 + gstRate / 100);
    const taxableAmt = rateExcl * qty;
    return { ...p, qty, rateIncl, rateExcl, taxableAmt };
  });

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const subtotal = rows.reduce((s, r) => s + r.taxableAmt, 0);
  const cgstAmt = subtotal * (cgstRate / 100);
  const sgstAmt = subtotal * (sgstRate / 100);
  const totalTax = cgstAmt + sgstAmt;
  const gross = subtotal + totalTax;
  const roundOff = Math.round(gross) - gross;
  const netAmount = gross + roundOff;

  const hsnGroups = {};
  rows.forEach((r) => {
    const key = r.hsn || "–";
    if (!hsnGroups[key]) hsnGroups[key] = { taxableValue: 0, cgst: 0, sgst: 0 };
    const cg = r.taxableAmt * (cgstRate / 100);
    const sg = r.taxableAmt * (sgstRate / 100);
    hsnGroups[key].taxableValue += r.taxableAmt;
    hsnGroups[key].cgst += cg;
    hsnGroups[key].sgst += sg;
  });

  // ✅ STOCK REDUCTION — API-based (not localStorage)
  const reduceStock = async () => {
    setStockReducing(true);
    try {
      // Fetch latest stock from API
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch products");
      const dbProducts = await res.json();

      let anyReduced = false;

      for (const invoiceItem of products) {
        const usedQty = parseFloat(invoiceItem.qty);
        if (!invoiceItem.desc.trim() || !usedQty || usedQty <= 0) continue;

        // Match by product name (case-insensitive)
        const match = dbProducts.find(
          (p) =>
            p.product_name.trim().toLowerCase() ===
            invoiceItem.desc.trim().toLowerCase()
        );
        if (!match) continue;

        const currentStock = parseFloat(match.stock_qty) || 0;

        if (currentStock < usedQty) {
          alert(
            `⚠️ Insufficient stock for "${match.product_name}"!\nAvailable: ${currentStock}, Required: ${usedQty}`
          );
          setStockReducing(false);
          return false;
        }

        const newStock = currentStock - usedQty;

        // PUT updated stock to API
        const updateRes = await fetch(`${API_URL}?id=${match.id}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            productName: match.product_name,
            sku: match.sku,
            category: match.category,
            unit: match.unit,
            sellingPrice: match.selling_price,
            stockQty: newStock,
            minStock: match.min_stock,
            description: match.description,
          }),
        });

        if (!updateRes.ok)
          throw new Error(`Failed to update stock for "${match.product_name}"`);

        anyReduced = true;
        console.log(
          `✅ Stock reduced: ${match.product_name} | ${currentStock} → ${newStock}`
        );
      }

      if (anyReduced) {
        setStockReduced(true);
        // Refresh savedProducts list with new stock values
        await fetchSavedProducts();
      }
      setStockReducing(false);
      return anyReduced;
    } catch (err) {
      console.error("Stock reduction error:", err);
      alert("❌ Stock update failed: " + err.message);
      setStockReducing(false);
      return false;
    }
  };

  const handleEdit = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };

  // ✅ PREVIEW BUTTON HANDLER
  const handlePreview = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    if (!stockReduced) {
      await reduceStock();
    }

    // ── Save invoice to database ──────────────────────────────
    try {
      const firstItem = products[0] || {};
      const payload = {
        invoice_no:    form.invoiceNo,
        invoice_date:  form.invoiceDate,
        buyer_name:    form.buyerName,
        buyer_address: form.buyerAddress,
        buyer_phone:   form.buyerPhone,
        buyer_gst:     form.buyerGst,
        description:   firstItem.desc  || "",
        hsn:           firstItem.hsn   || "",
        qty:           parseFloat(firstItem.qty)      || 0,
        rate:          parseFloat(firstItem.rateIncl) || 0,
        amount:        parseFloat(firstItem.qty) * parseFloat(firstItem.rateIncl) || 0,
        subtotal:      subtotal,
        cgst:          cgstAmt,
        sgst:          sgstAmt,
        total_tax:     cgstAmt + sgstAmt,
        net_amount:    netAmount,
      };

      const res = await fetch("http://localhost:8000/save_invoice.php", {
        method: "POST",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!result.success) console.error("Invoice save failed:", result.message);
    } catch (err) {
      console.error("Invoice save error:", err);
    }
    // ─────────────────────────────────────────────────────────

    // Save to localStorage for history tracking
    try {
      const existing = JSON.parse(localStorage.getItem("bip_invoices") || "[]");
      const newInvoice = {
        invoiceNo: form.invoiceNo,
        date: form.invoiceDate,
        buyerName: form.buyerName,
        total: netAmount,
      };
      const filtered = existing.filter((i) => i.invoiceNo !== form.invoiceNo);
      localStorage.setItem("bip_invoices", JSON.stringify([...filtered, newInvoice]));
    } catch (_) {}

    setStep(2);
    window.scrollTo(0, 0);
  };
  const errStyle = (name) => ({
    borderColor: errors[name] ? "#dc3545" : undefined,
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — FORM
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <>
        <style>{printStyles}</style>
        <div className="container-fluid py-4 no-print" style={{ maxWidth: 1100 }}>
          <div className="card shadow-sm border-0">
            <div className="card-header text-white" style={{ background: "#1a1a2e" }}>
              <h5 className="mb-0">🧾 BIP Fencing – Tax Invoice Generator</h5>
            </div>
            <div className="card-body">

              {/* Copy Type / GST Rate / Payment Mode */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Copy Type</label>
                  <select className="form-select form-select-sm" name="copyType" value={form.copyType} onChange={handleForm}>
                    {COPY_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>GST Rate (%)</label>
                  <select className="form-select form-select-sm" name="gstRate" value={form.gstRate} onChange={handleForm}>
                    <option value={18}>18% (CGST 9% + SGST 9%)</option>
                    <option value={12}>12% (CGST 6% + SGST 6%)</option>
                    <option value={5}>5% (CGST 2.5% + SGST 2.5%)</option>
                    <option value={28}>28% (CGST 14% + SGST 14%)</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Payment Mode</label>
                  <select className="form-select form-select-sm" name="paymentMode" value={form.paymentMode} onChange={handleForm}>
                    {["Cash", "Credit", "UPI", "Bank Transfer", "Cheque"].map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Invoice Details */}
              <h6 className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase" style={{ fontSize: 11 }}>Invoice Details</h6>
              <div className="row g-3 mb-4">
                {[
                  ["invoiceNo", "Invoice No *", "BFCWS-"],
                  ["invoiceDate", "Invoice Date *", "", "date"],
                  ["referenceNo", "Reference No & Date", ""],
                  ["buyersOrderNo", "Buyer's Order No", ""],
                  ["dated", "Dated", "", "date"],
                  ["dispatchDocNo", "Dispatch Doc No", ""],
                  ["deliveryNoteDate", "Delivery Note Date", "", "date"],
                  ["dispatchedThrough", "Dispatched Through", "e.g. Velamadam"],
                  ["destination", "Destination", ""],
                  ["billOfLading", "Bill of Lading / LR-RR No.", "dt."],
                  ["motorVehicleNo", "Motor Vehicle No.", "TN XX XX XXXX"],
                ].map(([name, label, placeholder, type]) => (
                  <div className="col-md-4" key={name}>
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>{label}</label>
                    <input
                      type={type || "text"}
                      className="form-control form-control-sm"
                      name={name}
                      value={form[name]}
                      onChange={handleForm}
                      placeholder={placeholder || ""}
                      style={errStyle(name)}
                    />
                    {errors[name] && (
                      <div className="text-danger" style={{ fontSize: 11 }}>{errors[name]}</div>
                    )}
                  </div>
                ))}
                <div className="col-md-4">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>E-Way Required?</label>
                  <select className="form-select form-select-sm" name="ewayRequired" value={form.ewayRequired} onChange={handleForm}>
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                {form.ewayRequired === "Yes" && (
                  <div className="col-md-4">
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>E-Way Number</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      name="ewayNumber"
                      value={form.ewayNumber}
                      onChange={handleForm}
                      placeholder="Enter E-Way Bill Number"
                    />
                  </div>
                )}
              </div>

              {/* Consignee */}
              <h6 className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase" style={{ fontSize: 11 }}>Consignee (Ship To)</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-5">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Name</label>
                  <input className="form-control form-control-sm" name="consigneeName" value={form.consigneeName} onChange={handleForm} placeholder="Leave blank to copy from Buyer" />
                </div>
                <div className="col-md-5">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Address</label>
                  <input className="form-control form-control-sm" name="consigneeAddress" value={form.consigneeAddress} onChange={handleForm} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>State</label>
                  <input className="form-control form-control-sm" name="consigneeState" value={form.consigneeState} onChange={handleForm} />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>State Code</label>
                  <input className="form-control form-control-sm" name="consigneeStateCode" value={form.consigneeStateCode} onChange={handleForm} />
                </div>
              </div>

              {/* Buyer */}
              <h6 className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase" style={{ fontSize: 11 }}>Buyer (Bill To) *</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-5">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Name *</label>
                  <input className="form-control form-control-sm" name="buyerName" value={form.buyerName} onChange={handleForm} style={errStyle("buyerName")} />
                  {errors.buyerName && (
                    <div className="text-danger" style={{ fontSize: 11 }}>{errors.buyerName}</div>
                  )}
                </div>
                <div className="col-md-5">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Address</label>
                  <input className="form-control form-control-sm" name="buyerAddress" value={form.buyerAddress} onChange={handleForm} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Phone</label>
                  <input className="form-control form-control-sm" name="buyerPhone" value={form.buyerPhone} onChange={handleForm} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>GST No</label>
                  <input className="form-control form-control-sm" name="buyerGst" value={form.buyerGst} onChange={handleForm} />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>State</label>
                  <input className="form-control form-control-sm" name="buyerState" value={form.buyerState} onChange={handleForm} />
                </div>
                <div className="col-md-2">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>State Code</label>
                  <input className="form-control form-control-sm" name="buyerStateCode" value={form.buyerStateCode} onChange={handleForm} />
                </div>
              </div>

              {/* Products Table */}
              <h6 className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase" style={{ fontSize: 11 }}>
                Products — Enter Rate Inclusive of Tax
              </h6>

              {savedProducts.length > 0 && (
                <div className="alert alert-info py-2 px-3 mb-2" style={{ fontSize: 12 }}>
                  💡 <strong>{savedProducts.length} product{savedProducts.length !== 1 ? "s" : ""}</strong> available from your Product Catalog. Select from the <strong>Description</strong> dropdown.
                </div>
              )}

              <div className="table-responsive mb-2">
                <table className="table table-bordered table-sm align-middle mb-0" style={{ fontSize: 12 }}>
                  <thead className="table-dark">
                    <tr>
                      <th style={{ width: 32 }}>#</th>
                      <th>Description</th>
                      <th style={{ width: 85 }}>HSN/SAC</th>
                      <th style={{ width: 75 }}>Qty</th>
                      <th style={{ width: 55 }}>Per</th>
                      <th style={{ width: 115 }}>Rate (Incl. Tax)</th>
                      <th style={{ width: 100 }}>Rate (Excl. Tax)</th>
                      <th style={{ width: 105 }}>Taxable Value</th>
                      <th style={{ width: 38 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => {
                      const q = parseFloat(p.qty) || 0;
                      const ri = parseFloat(p.rateIncl) || 0;
                      const re = ri / (1 + gstRate / 100);
                      const ta = re * q;

                      return (
                        <tr key={i}>
                          <td className="text-center">{i + 1}</td>
                          <td>
                            {savedProducts.length > 0 ? (
                              <div style={{ display: "flex", gap: 4 }}>
                                <select
                                  className="form-select form-select-sm"
                                  style={{
                                    width: 200,
                                    flexShrink: 0,
                                    borderColor: errors[`desc_${i}`] ? "#dc3545" : undefined,
                                  }}
                                  value={
                                    savedProducts.find((sp) => sp.productName === p.desc)
                                      ? p.desc
                                      : ""
                                  }
                                  onChange={(e) => handleProductSelect(i, e.target.value)}
                                >
                                  <option value="">— Select Product —</option>
                                  {savedProducts.map((sp) => (
                                    <option key={sp.id} value={sp.productName}>
                                      {sp.productName}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  className="form-control form-control-sm"
                                  value={p.desc}
                                  placeholder="or type manually"
                                  onChange={(e) => handleProduct(i, "desc", e.target.value)}
                                  style={{ borderColor: errors[`desc_${i}`] ? "#dc3545" : undefined }}
                                />
                              </div>
                            ) : (
                              <input
                                className="form-control form-control-sm"
                                value={p.desc}
                                onChange={(e) => handleProduct(i, "desc", e.target.value)}
                                style={{ borderColor: errors[`desc_${i}`] ? "#dc3545" : undefined }}
                              />
                            )}
                            {errors[`desc_${i}`] && (
                              <div className="text-danger" style={{ fontSize: 11 }}>{errors[`desc_${i}`]}</div>
                            )}
                          </td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              value={p.hsn}
                              placeholder="Auto from SKU"
                              onChange={(e) => handleProduct(i, "hsn", e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="form-control form-control-sm"
                              value={p.qty}
                              onChange={(e) => handleProduct(i, "qty", e.target.value)}
                              style={{
                                borderColor: errors[`qty_${i}`] ? "#dc3545" : undefined,
                              }}
                            />
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={p.per}
                              onChange={(e) => handleProduct(i, "per", e.target.value)}
                            >
                              {(() => {
                                const unitMap = {
                                  Pcs: "PCS", Kg: "KGS", Meter: "MTR",
                                  Roll: "RFT", Box: "SET", Set: "SET", Liter: "LTR",
                                };
                                const base = ["NOS", "KGS", "MTR", "SQM", "RFT", "SET", "PCS", "LTR"];
                                const fromProducts = savedProducts
                                  .map((sp) => unitMap[sp.unit] || sp.unit)
                                  .filter(Boolean);
                                const all = [...new Set([...base, ...fromProducts])];
                                return all.map((u) => <option key={u}>{u}</option>);
                              })()}
                            </select>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-control form-control-sm"
                              value={p.rateIncl}
                              onChange={(e) => handleProduct(i, "rateIncl", e.target.value)}
                              style={{ borderColor: errors[`rateIncl_${i}`] ? "#dc3545" : undefined }}
                            />
                          </td>
                          <td className="text-end text-muted">{fmt2(re)}</td>
                          <td className="text-end fw-semibold">{fmt2(ta)}</td>
                          <td className="text-center">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeProduct(i)}
                              disabled={products.length === 1}
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between align-items-start mb-4">
                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addProduct}>
                  + Add Row
                </button>
                <div className="text-end" style={{ fontSize: 13 }}>
                  <div>Subtotal (Taxable): <strong>₹ {fmt2(subtotal)}</strong></div>
                  <div className="text-muted">
                    CGST {cgstRate}%: ₹ {fmt2(cgstAmt)} | SGST {sgstRate}%: ₹ {fmt2(sgstAmt)}
                  </div>
                  <div className="text-muted">Round Off: ₹ {fmt2(roundOff)}</div>
                  <div className="fs-6 fw-bold">Net Amount: ₹ {fmt2(netAmount)}</div>
                </div>
              </div>

              {/* Balance Tracking */}
              <h6 className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase" style={{ fontSize: 11 }}>Balance Tracking</h6>
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Open Balance (₹)</label>
                  <input type="number" className="form-control form-control-sm" name="openBalance" value={form.openBalance} onChange={handleForm} placeholder="0.00" />
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Closing Balance (₹)</label>
                  <input type="number" className="form-control form-control-sm" name="closingBalance" value={form.closingBalance} onChange={handleForm} placeholder="0.00" />
                </div>
              </div>

              {/* Bank Details */}
              <h6 className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase" style={{ fontSize: 11 }}>Company Bank Details</h6>
              <div className="row g-3 mb-4">
                {[
                  ["bankHolderName", "A/c Holder Name"],
                  ["bankName", "Bank Name"],
                  ["bankAccountNo", "A/c No."],
                  ["bankIfsc", "IFS Code"],
                  ["bankBranch", "Branch"],
                ].map(([name, label]) => (
                  <div className="col-md-4" key={name}>
                    <label className="form-label fw-semibold" style={{ fontSize: 12 }}>{label}</label>
                    <input className="form-control form-control-sm" name={name} value={form[name]} onChange={handleForm} />
                  </div>
                ))}
              </div>

              {/* Preview Button */}
              <div className="d-grid d-md-flex justify-content-md-end">
                <button
                  className="btn btn-lg px-5 text-white"
                  style={{
                    background: stockReducing ? "#6b7280" : "#1a1a2e",
                    cursor: stockReducing ? "not-allowed" : "pointer",
                  }}
                  onClick={handlePreview}
                  disabled={stockReducing}
                >
                  {stockReducing ? "⏳ Updating Stock…" : "Preview Invoice →"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — INVOICE PREVIEW + PRINT
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <>
      <style>{printStyles}</style>

      <div className="no-print py-3 d-flex justify-content-center gap-3">
        <button className="btn btn-outline-secondary px-4" onClick={handleEdit}>
          ✏️ Edit
        </button>
        <button
          className="btn text-white px-4"
          style={{ background: "#1a1a2e" }}
          onClick={() => window.print()}
        >
          🖨️ Confirm &amp; Print
        </button>
      </div>

      {/* Stock reduced confirmation banner */}
      {stockReduced && (
        <div
          className="no-print"
          style={{
            maxWidth: 900,
            margin: "0 auto 10px",
            background: "#d1fae5",
            border: "1px solid #6ee7b7",
            borderRadius: 8,
            padding: "8px 16px",
            fontSize: 13,
            color: "#065f46",
            textAlign: "center",
          }}
        >
          ✅ Stock successfully updated in the database for invoiced products.
        </div>
      )}

      <div
        id="bip-invoice-print"
        style={{
          maxWidth: 900,
          margin: "0 auto 30px",
          fontFamily: "'Times New Roman', Times, serif",
          color: "#000",
          background: "#fff",
          border: "2px solid #000",
        }}
      >
        {/* Copy label */}
        <div style={{ textAlign: "right", padding: "3px 10px 2px", fontStyle: "italic", fontSize: 11, borderBottom: "1px solid #bbb" }}>
          ({form.copyType})
        </div>

        {/* HEADER */}
        <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #000", pageBreakInside: "avoid", breakInside: "avoid" }}>
          <tbody>
            <tr>
              <td style={{ width: 80, borderRight: "1px solid #000", padding: 6, textAlign: "center", verticalAlign: "middle" }}>
                <div style={{ width: 66, height: 66, border: "2px solid #000", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 10, textAlign: "center", lineHeight: 1.2, letterSpacing: 0.5 }}>
                  BIP<br />FENCING
                </div>
              </td>
              <td colSpan={2} style={{ padding: "6px 14px", textAlign: "center", verticalAlign: "middle" }}>
                <div style={{ fontSize: 20, fontWeight: "bold", letterSpacing: 2, textTransform: "uppercase" }}>
                  {COMPANY.name}
                </div>
                <div style={{ fontSize: 12, marginTop: 2 }}>{COMPANY.address}</div>
                <div style={{ fontSize: 12 }}>
                  GSTIN/UIN: <strong>{COMPANY.gst}</strong>&nbsp;&nbsp;State: {COMPANY.state}, Code: {COMPANY.stateCode}
                </div>
                <div style={{ fontSize: 12, position: "relative", textAlign: "center" }}>
                  <span>Ph: {COMPANY.phone}</span>
                  {form.ewayNumber && (
                    <span style={{ position: "absolute", right: 0 }}>
                      <strong>E-Way Bill No:</strong> {form.ewayNumber}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* CONSIGNEE + INVOICE META */}
        <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #000" }}>
          <tbody>
            <tr>
              <td style={{ width: "52%", borderRight: "1px solid #000", padding: "5px 8px", verticalAlign: "top" }}>
                <div style={sectionHead}>Consignee (Ship to)</div>
                <div style={{ fontWeight: "bold", fontSize: 13 }}>{form.consigneeName || form.buyerName}</div>
                <div style={{ fontSize: 12 }}>{form.consigneeAddress || form.buyerAddress}</div>
                <div style={{ fontSize: 12 }}>State Name: {form.consigneeState || form.buyerState}, Code: {form.consigneeStateCode || form.buyerStateCode}</div>
              </td>
              <td style={{ padding: 0, verticalAlign: "top" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, height: "100%" }}>
                  <tbody>
                    <tr>
                      <td style={{ width: "50%", padding: "5px 8px", borderRight: "1px solid #000", verticalAlign: "top" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            {[
                              ["Invoice No.", form.invoiceNo],
                              ["Delivery Note", ""],
                              ["Reference No. & Date", form.referenceNo],
                              ["Other References", ""],
                              ["Buyer's Order No.", form.buyersOrderNo],
                              ["Dated", form.dated ? formatDate(form.dated) : ""],
                            ].map(([k, v]) => (
                              <tr key={k}>
                                <td style={{ fontWeight: "bold", paddingRight: 4, paddingBottom: 3, whiteSpace: "nowrap", fontSize: 11 }}>{k}</td>
                                <td style={{ paddingBottom: 3, fontSize: 12 }}>: {v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                      <td style={{ width: "50%", padding: "5px 8px", verticalAlign: "top" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                          <tbody>
                            {[
                              ["Dispatch Doc No.", form.dispatchDocNo],
                              ["Delivery Note Date", form.deliveryNoteDate ? formatDate(form.deliveryNoteDate) : ""],
                              ["Dispatched through", form.dispatchedThrough],
                              ["Destination", form.destination],
                              ["Bill of Lading/LR-RR No.", form.billOfLading],
                              ["Motor Vehicle No.", form.motorVehicleNo],
                            ].map(([k, v]) => (
                              <tr key={k}>
                                <td style={{ fontWeight: "bold", paddingRight: 4, paddingBottom: 3, whiteSpace: "nowrap", fontSize: 11 }}>{k}</td>
                                <td style={{ paddingBottom: 3, fontSize: 12 }}>: {v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* BUYER + PAYMENT */}
        <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #000" }}>
          <tbody>
            <tr>
              <td style={{ width: "52%", borderRight: "1px solid #000", padding: "5px 8px", verticalAlign: "top" }}>
                <div style={sectionHead}>Buyer (Bill to)</div>
                <div style={{ fontWeight: "bold", fontSize: 13 }}>{form.buyerName}</div>
                <div style={{ fontSize: 12 }}>{form.buyerAddress}</div>
                {form.buyerPhone && <div style={{ fontSize: 12 }}>Ph: {form.buyerPhone}</div>}
                {form.buyerGst && <div style={{ fontSize: 12 }}>GSTIN/UIN: {form.buyerGst}</div>}
                <div style={{ fontSize: 12 }}>State Name: {form.buyerState}, Code: {form.buyerStateCode}</div>
              </td>
              <td style={{ padding: "5px 8px", verticalAlign: "top" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <tbody>
                    {[
                      ["Invoice No.", form.invoiceNo],
                      ["Invoice Date", formatDate(form.invoiceDate)],
                      ["Payment", form.paymentMode],
                      form.dispatchedThrough ? ["Transport", form.dispatchedThrough] : null,
                      form.motorVehicleNo ? ["Motor Vehicle No.", form.motorVehicleNo] : null,
                      form.ewayNumber ? ["E-Way Bill No.", form.ewayNumber] : null,
                      form.destination ? ["Delivery To", form.destination] : null,
                    ]
                      .filter(Boolean)
                      .map(([k, v]) => (
                        <tr key={k}>
                          <td style={{ fontWeight: "bold", paddingRight: 4, paddingBottom: 2, width: "45%", fontSize: 11 }}>{k}</td>
                          <td style={{ paddingBottom: 2 }}>: {v}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>

        {/* PRODUCT TABLE */}
        <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #000" }}>
          <thead>
            <tr style={{ background: "#e8e8e8" }}>
              {[
                { label: "Sl\nNo.", w: 30, align: "center" },
                { label: "Description of Goods", align: "left" },
                { label: "HSN/\nSAC", w: 65, align: "center" },
                { label: "Quantity", w: 68, align: "center" },
                { label: "Rate\n(Incl. of Tax)", w: 80, align: "right" },
                { label: "Rate\n(Excl. Tax)", w: 78, align: "right" },
                { label: "per", w: 38, align: "center" },
                { label: "Amount\n(Taxable Value)", w: 100, align: "right" },
              ].map((c) => (
                <th
                  key={c.label}
                  style={{
                    ...headerCell({ background: "#e8e8e8", whiteSpace: "pre-line", textAlign: c.align, fontSize: 11 }),
                    width: c.w,
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={cell({ textAlign: "center" })}>{i + 1}</td>
                <td style={cell()}><strong>{r.desc}</strong></td>
                <td style={cell({ textAlign: "center" })}>{r.hsn || "–"}</td>
                <td style={cell({ textAlign: "center" })}>{r.qty} {r.per}</td>
                <td style={cell({ textAlign: "right" })}>{fmt2(r.rateIncl)}</td>
                <td style={cell({ textAlign: "right" })}>{fmt2(r.rateExcl)}</td>
                <td style={cell({ textAlign: "center" })}>{r.per}</td>
                <td style={cell({ textAlign: "right" })}>{fmt2(r.taxableAmt)}</td>
              </tr>
            ))}
            {rows.length < 5 &&
              Array.from({ length: 5 - rows.length }).map((_, i) => (
                <tr key={`blank_${i}`} style={{ height: 22 }}>
                  {Array(8).fill(null).map((__, j) => (
                    <td key={j} style={cell()}>&nbsp;</td>
                  ))}
                </tr>
              ))}
            <tr>
              <td colSpan={7} style={cell({ textAlign: "right", fontStyle: "italic", fontWeight: "bold", borderTop: "1px solid #000" })}>CGST TAX</td>
              <td style={cell({ textAlign: "right", fontWeight: "bold", borderTop: "1px solid #000" })}>{fmt2(cgstAmt)}</td>
            </tr>
            <tr>
              <td colSpan={7} style={cell({ textAlign: "right", fontStyle: "italic", fontWeight: "bold" })}>SGST TAX</td>
              <td style={cell({ textAlign: "right", fontWeight: "bold" })}>{fmt2(sgstAmt)}</td>
            </tr>
            <tr>
              <td colSpan={7} style={cell({ textAlign: "right", fontStyle: "italic", fontWeight: "bold" })}>ROUNDING OFF</td>
              <td style={cell({ textAlign: "right", fontWeight: "bold" })}>
                {roundOff >= 0 ? `(+) ${fmt2(Math.abs(roundOff))}` : `(-) ${fmt2(Math.abs(roundOff))}`}
              </td>
            </tr>
            <tr style={{ background: "#f0f0f0" }}>
              <td colSpan={3} style={cell({ textAlign: "right", fontWeight: "bold", borderTop: "1px solid #000", borderBottom: "1px solid #000" })}>Total</td>
              <td style={cell({ textAlign: "center", fontWeight: "bold", borderTop: "1px solid #000", borderBottom: "1px solid #000" })}>{fmt2(totalQty)}</td>
              <td style={cell({ borderTop: "1px solid #000", borderBottom: "1px solid #000" })}></td>
              <td style={cell({ borderTop: "1px solid #000", borderBottom: "1px solid #000" })}></td>
              <td style={cell({ borderTop: "1px solid #000", borderBottom: "1px solid #000" })}></td>
              <td style={cell({ textAlign: "right", fontWeight: "bold", borderTop: "1px solid #000", borderBottom: "1px solid #000" })}>₹ {fmt2(subtotal)}</td>
            </tr>
          </tbody>
        </table>

        {/* AMOUNT IN WORDS */}
        <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #000" }}>
          <tbody>
            <tr>
              <td style={{ width: "55%", borderRight: "1px solid #000", padding: "5px 8px", verticalAlign: "top", fontSize: 12 }}>
                <div style={{ fontWeight: "bold", marginBottom: 2 }}>Amount Chargeable (in words)</div>
                <div style={{ fontStyle: "italic", fontSize: 13 }}>{amountInWords(netAmount)}</div>
              </td>
              <td style={{ padding: "5px 8px", verticalAlign: "middle", textAlign: "right" }}>
                <div style={{ fontSize: 18, fontWeight: "bold" }}>₹ {fmt2(netAmount)}</div>
                <div style={{ fontSize: 11 }}>E. &amp; O.E</div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* HSN TAX TABLE */}
        <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "1px solid #000" }}>
          <thead>
            <tr style={{ background: "#e8e8e8" }}>
              {[
                "HSN/SAC",
                "Taxable\nValue",
                `CGST\nRate`,
                "CGST\nAmount",
                `SGST/UTGST\nRate`,
                "SGST/UTGST\nAmount",
                "Total Tax\nAmount",
              ].map((h) => (
                <th key={h} style={headerCell({ textAlign: "center", fontSize: 11, whiteSpace: "pre-line", background: "#e8e8e8" })}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(hsnGroups).map(([hsn, d]) => (
              <tr key={hsn}>
                <td style={cell({ textAlign: "center" })}>{hsn}</td>
                <td style={cell({ textAlign: "right" })}>{fmt2(d.taxableValue)}</td>
                <td style={cell({ textAlign: "center" })}>{cgstRate}%</td>
                <td style={cell({ textAlign: "right" })}>{fmt2(d.cgst)}</td>
                <td style={cell({ textAlign: "center" })}>{sgstRate}%</td>
                <td style={cell({ textAlign: "right" })}>{fmt2(d.sgst)}</td>
                <td style={cell({ textAlign: "right" })}>{fmt2(d.cgst + d.sgst)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: "bold", background: "#f5f5f5" }}>
              <td style={cell({ fontSize: 12, borderTop: "1px solid #000", borderBottom: "1px solid #000" })}>Total</td>
              <td style={cell({ textAlign: "right", borderTop: "1px solid #000", borderBottom: "1px solid #000" })}>{fmt2(subtotal)}</td>
              <td style={cell({ borderTop: "1px solid #000", borderBottom: "1px solid #000" })}></td>
              <td style={cell({ textAlign: "right", borderTop: "1px solid #000", borderBottom: "1px solid #000" })}>{fmt2(cgstAmt)}</td>
              <td style={cell({ borderTop: "1px solid #000", borderBottom: "1px solid #000" })}></td>
              <td style={cell({ textAlign: "right", borderTop: "1px solid #000", borderBottom: "1px solid #000" })}>{fmt2(sgstAmt)}</td>
              <td style={cell({ textAlign: "right", borderTop: "1px solid #000", borderBottom: "1px solid #000" })}>{fmt2(totalTax)}</td>
            </tr>
          </tbody>
        </table>

        {/* TAX IN WORDS */}
        <div style={{ padding: "3px 8px", borderBottom: "1px solid #000", fontSize: 12 }}>
          <strong>Tax Amount (in words):</strong>&nbsp;
          <em>{amountInWords(totalTax)}</em>
        </div>

        {/* FOOTER */}
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: "42%", borderRight: "1px solid #000", padding: "6px 8px", verticalAlign: "top", fontSize: 12 }}>
                <div style={{ fontWeight: "bold", marginBottom: 4 }}>Company's Bank Details</div>
                {[
                  ["A/c Holder's Name", form.bankHolderName],
                  ["Bank Name", form.bankName],
                  ["A/c No.", form.bankAccountNo],
                  ["Branch & IFS Code", `${form.bankBranch} & ${form.bankIfsc}`],
                ].map(([k, v]) => (
                  <div key={k}><strong>{k}</strong>: {v}</div>
                ))}
                {(form.openBalance || form.closingBalance) && (
                  <div style={{ marginTop: 6, borderTop: "1px dashed #999", paddingTop: 4 }}>
                    {form.openBalance ? <div><strong>Open Balance:</strong> {fmt2(form.openBalance)}</div> : null}
                    {form.closingBalance ? <div><strong>Closing Balance:</strong> {fmt2(form.closingBalance)}</div> : null}
                  </div>
                )}
              </td>
              <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
                <div style={{ fontSize: 11, marginBottom: 8 }}>
                  <strong>Declaration:</strong> {DECLARATION}
                </div>
                <div style={{ textAlign: "right", fontWeight: "bold", fontSize: 12, marginBottom: 2 }}>
                  for {COMPANY.name}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40 }}>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ borderTop: "1px solid #000", paddingTop: 4, fontSize: 12 }}>Receiver's Signature</div>
                  </div>
                  <div style={{ flex: 0.2 }}></div>
                  <div style={{ textAlign: "center", flex: 1 }}>
                    <div style={{ borderTop: "1px solid #000", paddingTop: 4, fontSize: 12 }}>Authorised Signatory</div>
                  </div>
                </div>
                <div style={{ textAlign: "center", marginTop: 8, fontSize: 10, color: "#666" }}>
                  This is a Computer Generated Invoice
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="no-print d-flex justify-content-center gap-3 pb-4">
        <button className="btn btn-outline-secondary px-4" onClick={handleEdit}>✏️ Edit</button>
        <button
          className="btn text-white px-4"
          style={{ background: "#1a1a2e" }}
          onClick={() => window.print()}
        >
          🖨️ Confirm &amp; Print
        </button>
      </div>
    </>
  );
} 
