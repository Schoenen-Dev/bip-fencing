import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

// ─── COMPANY & BANK DETAILS ──────────────────────────────────────────────────
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
  "We declare that this quotation shows the actual price of the goods described and that all particulars are true and correct.";

// ─── LOGO (Base64) ─────────────────────────────────────────────────────────
const BIP_LOGO_B64 =
  "data:image/jpeg;base64,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";

// ─── UTILITIES ──────────────────────────────────────────────────────────────
const fmt2 = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const inr = (v) => `₹ ${fmt2(v)}`;

const formatDate = (d) => {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

const _ones = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];
const _tens = [
  "",
  "",
  "Twenty",
  "Thirty",
  "Forty",
  "Fifty",
  "Sixty",
  "Seventy",
  "Eighty",
  "Ninety",
];
function numToWords(n) {
  const num = Math.round(n);
  if (num === 0) return "Zero";
  if (num < 20) return _ones[num];
  if (num < 100)
    return (
      _tens[Math.floor(num / 10)] + (num % 10 ? " " + _ones[num % 10] : "")
    );
  if (num < 1000)
    return (
      _ones[Math.floor(num / 100)] +
      " Hundred" +
      (num % 100 ? " " + numToWords(num % 100) : "")
    );
  if (num < 100000)
    return (
      numToWords(Math.floor(num / 1000)) +
      " Thousand" +
      (num % 1000 ? " " + numToWords(num % 1000) : "")
    );
  if (num < 10000000)
    return (
      numToWords(Math.floor(num / 100000)) +
      " Lakh" +
      (num % 100000 ? " " + numToWords(num % 100000) : "")
    );
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
  return paise > 0
    ? "INR " + numToWords(rupees) + " and " + numToWords(paise) + " Paise Only"
    : "INR " + numToWords(rupees) + " Only";
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const B = "1px solid #000";
const cell = (extra = {}) => ({
  border: "none",
  borderLeft: B,
  borderRight: B,
  padding: "2px 4px",
  fontSize: 11,
  verticalAlign: "middle",
  lineHeight: "1.3",
  ...extra,
});
const hCell = (extra = {}) => ({
  ...cell(),
  borderTop: B,
  borderBottom: B,
  fontWeight: "bold",
  background: "#e8e8e8",
  ...extra,
});
const sectionHead = {
  fontWeight: "bold",
  fontSize: 13,
  textTransform: "uppercase",
  letterSpacing: 0.3,
  marginBottom: 2,
  borderBottom: "1px dashed #999",
  paddingBottom: 1,
};

const PRINT_STYLES = `
@media print {
  html, body {
    width: 210mm;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body * { visibility: hidden !important; }
  #qt-print-area, #qt-print-area * { visibility: visible !important; }
  #qt-print-area {
    position: absolute !important;
    top: 0 !important; left: 0 !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    box-shadow: none !important;
    border: 2px solid #000 !important;
    -webkit-box-decoration-break: clone !important;
    box-decoration-break: clone !important;
  }
  .qt-no-print { display: none !important; }
  table { border-collapse: collapse !important; }
  .inv-product-row { page-break-inside: avoid; }
  .inv-footer { page-break-inside: avoid; }
  .inv-thead { display: table-header-group !important; }
  @page { size: A4 portrait; margin: 5mm; }
}
`;

// ─── UNIT MAP ──────────────────────────────────────────────────────────────
const UNIT_MAP = {
  Pcs: "NOS",
  Pieces: "NOS",
  Kg: "KGS",
  Kgs: "KGS",
  Kilogram: "KGS",
  Kilograms: "KGS",
  Meter: "MTR",
  Meters: "MTR",
  Roll: "RFT",
  Box: "SET",
  Set: "SET",
  Sets: "SET",
  Liter: "LTR",
  Litre: "LTR",
  Nos: "NOS",
  Number: "NOS",
  No: "NOS",
};

const UNITS = ["NOS", "KGS", "MTR", "SQM", "RFT", "SET", "PCS", "LTR" ,"FEET"];

const emptyForm = () => ({
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
  clientState: "Tamil Nadu",
  clientStateCode: "33",
  shipName: "",
  shipAddress: "",
  shipGst: "",
  shipState: "Tamil Nadu",
  shipStateCode: "33",
discount: 0,
  priceUnit: "Nos",
  isGst: true,
  taxPercent: 18,
  notes: "",
  declaration: DECLARATION,
  bankHolderName: DEFAULT_BANK.holderName,
  bankName: DEFAULT_BANK.bankName,
  bankAccountNo: DEFAULT_BANK.accountNo,
  bankIfsc: DEFAULT_BANK.ifsc,
  bankBranch: DEFAULT_BANK.branch,
  items: [
    { description: "", hsn: "", dueOn: "", unit: "NOS", qty: 1, rateIncl: 0 },
  ],
});

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export default function Quotation() {
  const location = useLocation();
  const navigate = useNavigate();

  const [view, setView] = useState("table");
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState(null);
  const [sameAsClient, setSameAsClient] = useState(true);
  const [products, setProducts] = useState([]);
  const [previewRec, setPreviewRec] = useState(null);

  useEffect(() => {
    fetchQuotations();
    fetchProducts();
  }, []);

  // ── Arrived from Clients page "View"/"Continue" button ────────────────
  useEffect(() => {
    const { viewQuoteId, continueQuoteId } = location.state || {};
    if (!viewQuoteId && !continueQuoteId) return;

    (async () => {
      try {
        if (continueQuoteId) {
          await handleEdit({ id: continueQuoteId });
        } else if (viewQuoteId) {
          await handleViewBill({ id: viewQuoteId });
        }
      } finally {
        navigate(location.pathname, { replace: true, state: {} });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchProducts = async () => {
    try {
      // Quotations are estimates only — stock is never reduced — so show the
      // catalog across all branches, not just the branch currently in view.
      const res = await apiFetch("/products.php?all_branches=1");
      const data = await res.json();
      if (Array.isArray(data)) setProducts(data);
    } catch (_) {}
  };

  const fetchQuotations = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/quotation_api.php");
      const data = await res.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSingleQuotation = async (id) => {
    const res = await apiFetch(`/quotation_api.php?id=${id}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return data;
  };

  const calcTotals = (items, discount, tax) => {
    const subtotal = items.reduce(
      (s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rateIncl) || 0),
      0,
    );
    const discountAmt = subtotal * (discount / 100);
    const taxable = subtotal - discountAmt;
    const taxAmt = taxable * (tax / 100);
    const cgst = taxAmt / 2;
    const sgst = taxAmt / 2;
    const roundOff = Math.round(taxable + taxAmt) - (taxable + taxAmt);
    const grandTotal = taxable + taxAmt + roundOff;
    return {
      subtotal,
      discountAmt,
      taxable,
      taxAmt,
      cgst,
      sgst,
      roundOff,
      grandTotal,
    };
  };

  const T = calcTotals(
    form.items,
    Number(form.discount),
    form.isGst ? Number(form.taxPercent) : 0,
  );

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleItemChange = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm({ ...form, items });
  };

  // Selection is keyed by product id (not name) so picking an item from the
  // all-branches catalog can't resolve to the wrong branch's price/HSN when
  // two branches happen to sell a product with the same name.
  const handleProductSelect = (i, product) => {
    if (!product) {
      const items = [...form.items];
      items[i] = { ...items[i], description: "" };
      setForm({ ...form, items });
      return;
    }
    const items = [...form.items];
    items[i] = {
      ...items[i],
      description: product.product_name,
      hsn: product.sku || "",
      unit: UNIT_MAP[product.unit] || "NOS",
      rateIncl: parseFloat(product.selling_price) || 0,
    };
    setForm({ ...form, items });
  };

  const addItem = () =>
    setForm({
      ...form,
      items: [
        ...form.items,
        { description: "", hsn: "", dueOn: "", unit: "NOS", qty: 1, rateIncl: 0 },
      ],
    });
  const removeItem = (i) =>
    setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const resetForm = () => {
    setForm(emptyForm());
    setEditId(null);
    setSameAsClient(true);
  };

  const copyClientToShip = () => {
    setForm({
      ...form,
      shipName: form.clientName,
      shipAddress: form.clientAddress,
      shipGst: form.clientGst,
      shipState: form.clientState,
      shipStateCode: form.clientStateCode,
    });
    setSameAsClient(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.quoteNo ||
      !form.quoteDate ||
      !form.clientName ||
      form.items.length === 0
    ) {
      alert("Fill all required fields");
      return;
    }
    try {
      const method = editId ? "PUT" : "POST";
      const payload = editId ? { ...form, id: editId } : form;
      const res = await apiFetch("/quotation_api.php", {
        method,
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
    try {
      const data = await fetchSingleQuotation(rec.id);
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
        clientState: data.client_state || "Tamil Nadu",
        clientStateCode: data.client_state_code || "33",
        shipName: data.ship_name || "",
        shipAddress: data.ship_address || "",
        shipGst: data.ship_gst || "",
        shipState: data.ship_state || "Tamil Nadu",
        shipStateCode: data.ship_state_code || "33",
        discount: data.discount_percent,
        isGst: data.is_gst == null ? true : !!Number(data.is_gst),
        taxPercent: data.tax_percent,
        notes: data.notes || "",
        declaration: data.declaration || DECLARATION,
        bankHolderName: data.bank_holder_name || DEFAULT_BANK.holderName,
        bankName: data.bank_name || DEFAULT_BANK.bankName,
        bankAccountNo: data.bank_account_no || DEFAULT_BANK.accountNo,
        bankIfsc: data.bank_ifsc || DEFAULT_BANK.ifsc,
        bankBranch: data.bank_branch || DEFAULT_BANK.branch,
        items: data.items.length
          ? data.items.map((i) => ({
              description: i.description,
              hsn: i.hsn || "",
              dueOn: i.due_on || "",
              unit: i.unit || "NOS",
              qty: i.quantity,
              rateIncl: i.rate,
            }))
          : [{ description: "", hsn: "", dueOn: "", unit: "NOS", qty: 1, rateIncl: 0 }],
      });
      setSameAsClient(!data.ship_name && !data.ship_address);
      setEditId(rec.id);
      setView("form");
    } catch (err) {
      alert("Could not load quotation");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await apiFetch(`/quotation_api.php?id=${deleteId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        fetchQuotations();
      } else alert(data.message || "Delete failed");
    } catch (err) {
      alert("Server error");
    } finally {
      setDeleteId(null);
    }
  };

  const handleViewBill = async (rec) => {
    try {
      const data = await fetchSingleQuotation(rec.id);
      setPreviewRec(data);
      setView("preview");
    } catch (err) {
      alert("Could not load bill");
    }
  };

  const filtered = records.filter(
    (r) =>
      r.client_name.toLowerCase().includes(search.toLowerCase()) ||
      r.quote_no.toLowerCase().includes(search.toLowerCase()),
  );

  const summary = filtered.reduce(
    (a, r) => {
      a.subtotal += r.subtotal || 0;
      a.discount += r.discount_amount || 0;
      a.revenue += r.grand_total || 0;
      return a;
    },
    { subtotal: 0, discount: 0, revenue: 0 },
  );

  // ─── RENDER: PREVIEW ──────────────────────────────────────────────────────────
  if (view === "preview" && previewRec) {
    const d = previewRec;
    const isGst = d.is_gst == null ? true : !!Number(d.is_gst);
    const items = d.items || [];
    const disc = parseFloat(d.discount_percent) || 0;
    const tax = isGst ? (parseFloat(d.tax_percent) || 18) : 0;
    const rows = items.map((i) => ({
      ...i,
      qty: parseFloat(i.quantity) || 0,
      rateIncl: parseFloat(i.rate) || 0,
    }));
const sub = rows.reduce((s, r) => s + r.qty * (r.rateIncl / (1 + tax / 100)), 0);
    const discAmt = sub * (disc / 100);
    const taxable = sub - discAmt;
    const cgstRate = tax / 2;
    const sgstRate = tax / 2;
    const cgstAmt = taxable * (cgstRate / 100);
    const sgstAmt = taxable * (sgstRate / 100);
    const totalTax = cgstAmt + sgstAmt;
    const roundOff = Math.round(taxable + totalTax) - (taxable + totalTax);
    const netAmount = taxable + totalTax + roundOff;
    const totalQty = rows.reduce((s, r) => s + r.qty, 0);

    const hsnGroups = {};
    rows.forEach((r) => {
      const key = r.hsn || "–";
      if (!hsnGroups[key]) hsnGroups[key] = { taxable: 0, cgst: 0, sgst: 0 };
      hsnGroups[key].taxable += r.qty * r.rateIncl * (1 - disc / 100);
      hsnGroups[key].cgst += r.qty * r.rateIncl * (1 - disc / 100) * (cgstRate / 100);
      hsnGroups[key].sgst += r.qty * r.rateIncl * (1 - disc / 100) * (sgstRate / 100);
    });

    const dynFont = rows.length <= 10 ? 11 : rows.length <= 20 ? 12 : rows.length <= 30 ? 11 : 10;
    const dynPad = rows.length <= 10 ? "3px 6px" : rows.length <= 20 ? "3px 6px" : "2px 5px";

    const dc = (extra = {}) => ({
      border: "none",
      borderLeft: B,
      borderRight: B,
      padding: dynPad,
      fontSize: dynFont,
      verticalAlign: "middle",
      lineHeight: "1.2",
      ...extra,
    });
    const dhc = (extra = {}) => ({
      ...dc(),
      borderTop: B,
      borderBottom: B,
      fontWeight: "bold",
      background: "#e8e8e8",
      ...extra,
    });

    const MIN_ROWS = rows.length >= 15 ? 0 : Math.max(0, 15 - rows.length);

    return (
      <>
        <style>{PRINT_STYLES}</style>

        <div className="qt-no-print" style={{ display: "flex", justifyContent: "center", gap: 12, padding: "16px 0", background: "#f6f8fa" }}>
          <button onClick={() => setView("table")} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d0d7de", background: "#fff", fontWeight: 600, cursor: "pointer" }}>← Back to List</button>
          <button onClick={() => window.print()} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#1a1a2e", color: "#fff", fontWeight: 600, cursor: "pointer" }}>🖨️ Print Quotation</button>
        </div>

        <div id="qt-print-area" style={{ width: "210mm", minHeight: "297mm", margin: "0 auto 30px", padding: "8mm", fontFamily: "'Times New Roman', Times, serif", color: "#000", background: "#fff", border: "2px solid #000", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
          <div style={{ textAlign: "center", padding: "2px 8px", fontWeight: "bold", fontSize: 14, borderBottom: B }}>ESTIMATE</div>

          {/* ─── HEADER ─── */}
          <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: B }}>
            <tbody>
              <tr>
                <td style={{ width: 80, borderRight: B, padding: "4px", textAlign: "center", verticalAlign: "middle" }}>
                  <img src={BIP_LOGO_B64} alt="BIP Fencing" style={{ width: 68, height: 68, objectFit: "contain", display: "block", margin: "0 auto" }} />
                </td>
                <td style={{ padding: "4px 10px", textAlign: "center", verticalAlign: "middle" }}>
                  <div style={{ fontSize: 24, fontWeight: "bold", letterSpacing: 1.5, textTransform: "uppercase" }}>{COMPANY.name}</div>
                  <div style={{ fontSize: 10, marginTop: 1 }}>{COMPANY.address}</div>
                  {isGst && <div style={{ fontSize: 10 }}>GSTIN/UIN: <strong>{COMPANY.gst}</strong>&nbsp;&nbsp;State: {COMPANY.state}, Code: {COMPANY.stateCode}</div>}
                  <div style={{ fontSize: 10, display: "flex", justifyContent: "center", gap: 24 }}><span>Ph: {COMPANY.phone}</span></div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ─── CONSIGNEE + META ─── */}
          <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: B }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", borderRight: B, padding: "6px 7px", verticalAlign: "top" }}>
                  <div style={sectionHead}>Consignee (Ship to)</div>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>{d.ship_name || d.client_name}</div>
                  <div style={{ fontSize: 14 }}>{d.ship_address || d.client_address}</div>
                  <div style={{ fontSize: 14 }}>State Name: {d.ship_state || d.client_state || "Tamil Nadu"}, Code: {d.ship_state_code || d.client_state_code || "33"}</div>
                </td>
                <td style={{ padding: "6px 7px", verticalAlign: "top" }}>
                {[
                    ["Quotation No.", d.quote_no],
                    ["Date", formatDate(d.quote_date)],
                    ["Valid Until", d.valid_until ? formatDate(d.valid_until) : "—"],
                    ["PO/Order No.", d.po_no || "—"],
                    ["Dispatched Through", d.dispatched_through || "—"],
                  ].filter(([_, v]) => v && v !== "—").map(([label, value]) => (
                    <div key={label} style={{ display: "flex", marginBottom: 2 }}>
                      <span style={{ fontWeight: "normal", minWidth: 130, whiteSpace: "nowrap", fontSize: 13 }}>{label}</span>
                      <span style={{ fontWeight: "bold", fontSize: 13 }}> : {value}</span>
                    </div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ─── BUYER + PAYMENT ─── */}
          <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: B }}>
            <tbody>
              <tr>
                <td style={{ width: "50%", borderRight: B, padding: "6px 7px", verticalAlign: "top" }}>
                  <div style={sectionHead}>Buyer (Bill to)</div>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>{d.client_name}</div>
                  <div style={{ fontSize: 14 }}>{d.client_address}</div>
                  {d.client_phone && <div style={{ fontSize: 14 }}>Ph: {d.client_phone}</div>}
                  {d.client_email && <div style={{ fontSize: 14 }}>Email: {d.client_email}</div>}
                  {isGst && d.client_gst && <div style={{ fontSize: 14 }}>GSTIN/UIN: {d.client_gst}</div>}
                  <div style={{ fontSize: 14 }}>State Name: {d.client_state || "Tamil Nadu"}, Code: {d.client_state_code || "33"}</div>
                </td>
                <td style={{ padding: "6px 7px", verticalAlign: "top" }}>
{[
                    ["Payment", "Credit"],
                    ["Transport", d.dispatched_through],
                    ["Delivery To", d.destination],
                    ["E-Way Bill No.", d.ewayNumber],
                    ["Bill of Lading/LR-RR No.", d.billOfLading],
                    ["Vehicle No.", d.vehicle_no],
                    ["Other Ref.", d.other_ref],
                  ].filter(([_, v]) => v).map(([label, value]) => (
                    <div key={label} style={{ display: "flex", marginBottom: 2 }}>
                      <span style={{ fontWeight: "normal", minWidth: 95, whiteSpace: "nowrap", fontSize: 14 }}>{label}</span>
                      <span style={{ fontWeight: "bold", fontSize: 14 }}> : {value}</span>
                    </div>
                  ))}
                </td>
              </tr>
            </tbody>
          </table>

          {/* ─── PRODUCT TABLE ─── */}
          <div style={{ flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", borderTop: B, borderBottom: B }}>
            <colgroup><col style={{ width: "10%" }} /><col style={{ width: "70%" }} /><col style={{ width: "20%" }} /></colgroup>
              <thead className="inv-thead">
                <tr>
                 {[["Sl\nNo.", "center"], ["Description of Goods", "left"], ["Amount", "right"]].map(([label, align]) => (
                    <th key={label} style={dhc({ textAlign: align, whiteSpace: "pre-line", padding: dynPad })}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                 const rateExcl = r.rateIncl / (1 + tax / 100);
                  const taxableAmt = rateExcl * r.qty * (1 - disc / 100);
                  return (
                    <tr key={i} className="inv-product-row">
                <td style={dc({ textAlign: "center" })}>{i + 1}</td>
<td style={dc({ fontWeight: "bold", fontSize: 14 })}>{r.description}</td>
                      <td style={dc({ textAlign: "right" })}>{fmt2(taxableAmt)}</td>
                    </tr>
                  );
                })}
                {Array.from({ length: MIN_ROWS }).map((_, i) => (
                  <tr key={`blank_${i}`} style={{ height: 18 }}>
                 {Array(3).fill(null).map((__, j) => <td key={j} style={dc()}>&nbsp;</td>)}
                  </tr>
                ))}
                <tr>
                <td colSpan={2} style={dc({ textAlign: "right", fontWeight: "bold", borderTop: B })}>Total Taxable Amount</td>
                  <td style={dc({ textAlign: "right", fontWeight: "bold", borderTop: B })}>{fmt2(taxable)}</td>
                </tr>
                {isGst && (
                  <>
                    <tr>
                     <td colSpan={2} style={dc({ textAlign: "right", fontStyle: "italic", fontWeight: "bold", borderTop: B })}>CGST TAX</td>
                      <td style={dc({ textAlign: "right", fontWeight: "bold", borderTop: B })}>{fmt2(cgstAmt)}</td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={dc({ textAlign: "right", fontStyle: "italic", fontWeight: "bold" })}>SGST TAX</td>
                      <td style={dc({ textAlign: "right", fontWeight: "bold" })}>{fmt2(sgstAmt)}</td>
                    </tr>
                  </>
                )}
                <tr>
                <td colSpan={2} style={dc({ textAlign: "right", fontStyle: "italic", fontWeight: "bold" })}>ROUNDING OFF</td>
                  <td style={dc({ textAlign: "right", fontWeight: "bold" })}>{roundOff >= 0 ? `(+) ${fmt2(Math.abs(roundOff))}` : `(-) ${fmt2(Math.abs(roundOff))}`}</td>
                </tr>
                <tr style={{ background: "#f0f0f0" }}>
                  <td style={dc({ borderTop: B, borderBottom: B })}></td>
                <td style={dc({ fontWeight: "bold", borderTop: B, borderBottom: B, fontSize: dynFont + 1 })}>Total</td>
                  <td style={dc({ textAlign: "right", fontWeight: "bold", borderTop: B, borderBottom: B, fontSize: dynFont + 3 })}>₹ {fmt2(netAmount)}</td>
                </tr>
              </tbody>
            </table>
          </div>

        {/* ─── UNIT PRICE LINE ─── */}
<div style={{ 
  padding: "8px 8px 0px", 
  margin: 0, 
  fontSize: 18, 
  fontWeight: "normal", 
  color: "#333", 
  textAlign: "left",
  borderLeft: !isGst ? "4px solid #000" : "none",
  paddingLeft: !isGst ? "12px" : "8px",
  marginLeft: !isGst ? "4px" : "0px",
  background: !isGst ? "#f9f9f9" : "transparent",
  borderRadius: !isGst ? "4px" : "0px",
  border: !isGst ? "1px solid #ddd" : "none",
  borderLeftWidth: !isGst ? "6px" : "0px",
  borderLeftStyle: !isGst ? "solid" : "none",
  borderLeftColor: !isGst ? "#000" : "transparent",
}}>
{rows.map((r, i) => {
    const rateExcl = r.rateIncl / (1 + tax / 100);
    return <div key={i}>{r.description} per {r.unit} ₹{fmt2(rateExcl)}</div>;
  })}
</div>

          {/* ─── AMOUNT IN WORDS ─── */}
          <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: B }}>
            <tbody>
              <tr>
                <td style={{ width: "58%", borderRight: B, padding: "3px 7px", verticalAlign: "middle", fontSize: 10 }}>
                  <span style={{ fontWeight: "bold" }}>Amount Chargeable (in words): </span>
                  <em style={{ fontWeight: "bold" }}>{amountInWords(netAmount)}</em>
                </td>
                <td style={{ padding: "3px 7px", verticalAlign: "middle", textAlign: "right" }}>
                  <div style={{ fontSize: 20, fontWeight: "bold" }}>₹ {fmt2(netAmount)}</div>
                  <div style={{ fontSize: 10 }}>E. &amp; O.E</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ─── HSN TAX TABLE ─── */}
          {isGst && (
            <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", borderBottom: B }} className="inv-footer">
              <colgroup><col style={{ width: "14%" }} /><col style={{ width: "16%" }} /><col style={{ width: "10%" }} /><col style={{ width: "14%" }} /><col style={{ width: "14%" }} /><col style={{ width: "16%" }} /><col style={{ width: "16%" }} /></colgroup>
              <thead>
                <tr>
                  {[["HSN/SAC", "center"], ["Taxable\nValue", "right"], ["CGST\nRate", "center"], ["CGST\nAmount", "right"], ["SGST/UTGST\nRate", "center"], ["SGST/UTGST\nAmount", "right"], ["Total Tax\nAmount", "right"]].map(([label, align]) => (
                    <th key={label} style={dhc({ textAlign: align, whiteSpace: "pre-line", padding: "2px 6px", fontSize: 10 })}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(hsnGroups).map(([hsn, g]) => (
                  <tr key={hsn}>
                    <td style={dc({ textAlign: "center", fontSize: 11 })}>{hsn}</td>
                    <td style={dc({ textAlign: "right", fontSize: 11 })}>{fmt2(g.taxable)}</td>
                    <td style={dc({ textAlign: "center", fontSize: 10 })}>{cgstRate}%</td>
                    <td style={dc({ textAlign: "right", fontSize: 10 })}>{fmt2(g.cgst)}</td>
                    <td style={dc({ textAlign: "center", fontSize: 10 })}>{sgstRate}%</td>
                    <td style={dc({ textAlign: "right", fontSize: 10 })}>{fmt2(g.sgst)}</td>
                    <td style={dc({ textAlign: "right", fontSize: 10 })}>{fmt2(g.cgst + g.sgst)}</td>
                  </tr>
                ))}
                <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
                  <td style={dc({ borderTop: B, borderBottom: B, fontSize: 10 })}>Total</td>
                  <td style={dc({ textAlign: "right", borderTop: B, borderBottom: B, fontSize: 10 })}>{fmt2(taxable)}</td>
                  <td style={dc({ borderTop: B, borderBottom: B })}></td>
                  <td style={dc({ textAlign: "right", borderTop: B, borderBottom: B, fontSize: 10 })}>{fmt2(cgstAmt)}</td>
                  <td style={dc({ borderTop: B, borderBottom: B })}></td>
                  <td style={dc({ textAlign: "right", borderTop: B, borderBottom: B, fontSize: 10 })}>{fmt2(sgstAmt)}</td>
                  <td style={dc({ textAlign: "right", borderTop: B, borderBottom: B, fontSize: 10 })}>{fmt2(totalTax)}</td>
                </tr>
              </tbody>
            </table>
          )}

          {/* ─── TAX IN WORDS ─── */}
          {isGst && (
            <div style={{ padding: "2px 7px", borderBottom: B, fontSize: 10 }}>
              <strong>Tax Amount (in words):</strong>&nbsp;
              <em style={{ fontWeight: "bold" }}>{amountInWords(totalTax)}</em>
            </div>
          )}

          {/* ─── FOOTER ─── */}
          <div style={{ marginTop: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }} className="inv-footer">
              <tbody>
                <tr>
                  <td style={{ width: "44%", borderRight: B, padding: "4px 7px", verticalAlign: "top", fontSize: 10 }}>
                    <div style={{ fontWeight: "bold", marginBottom: 2, fontSize: 15 }}>Company's Bank Details</div>
                    {[
                      ["A/c Holder's Name", d.bank_holder_name || DEFAULT_BANK.holderName],
                      ["Bank Name", d.bank_name || DEFAULT_BANK.bankName],
                      ["A/c No.", d.bank_account_no || DEFAULT_BANK.accountNo],
                      ["Branch & IFS Code", `${d.bank_branch || DEFAULT_BANK.branch} & ${d.bank_ifsc || DEFAULT_BANK.ifsc}`],
                    ].map(([k, v]) => <div key={k} style={{ marginBottom: 2, fontSize: 12 }}><strong>{k}</strong>: {v}</div>)}
                  </td>
                  <td style={{ padding: "4px 7px", verticalAlign: "top" }}>
                    <div style={{ fontSize: 9, marginBottom: 4 }}><strong>Declaration:</strong> {d.declaration || DECLARATION}</div>
                    <div style={{ textAlign: "right", fontWeight: "bold", fontSize: 10, marginBottom: 2 }}>for {COMPANY.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
                      <div style={{ textAlign: "center", width: "42%" }}><div style={{ borderTop: B, paddingTop: 2, fontSize: 10 }}>Receiver's Signature</div></div>
                      <div style={{ textAlign: "center", width: "42%" }}><div style={{ borderTop: B, paddingTop: 2, fontSize: 10 }}>Authorised Signatory</div></div>
                    </div>
                    <div style={{ textAlign: "center", marginTop: 4, fontSize: 9, color: "#666" }}>This is a Computer Generated Quotation</div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="qt-no-print" style={{ display: "flex", justifyContent: "center", gap: 12, paddingBottom: 30 }}>
          <button onClick={() => setView("table")} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid #d0d7de", background: "#fff", fontWeight: 600, cursor: "pointer" }}>← Back to List</button>
          <button onClick={() => window.print()} style={{ padding: "8px 20px", borderRadius: 8, border: "none", background: "#1a1a2e", color: "#fff", fontWeight: 600, cursor: "pointer" }}>🖨️ Print Quotation</button>
        </div>
      </>
    );
  }

  // ─── RENDER: TABLE ──────────────────────────────────────────────────────────
  if (view === "table") {
    return (
      <div style={{ width: "100%", padding: "0 24px", boxSizing: "border-box", fontFamily: "'Inter',system-ui,sans-serif", color: "#0f172a" }}>
        <style>{`
          .qt-tbl { width:100%; border-collapse:collapse; }
          .qt-tbl th { background:#f6f8fa; padding:11px 14px; text-align:left; font-size:12px; font-weight:600; border-bottom:1px solid #e1e8ed; }
          .qt-tbl td { padding:11px 14px; border-bottom:1px solid #f0f0f0; font-size:13px; vertical-align:middle; }
          .qt-tbl tbody tr:hover { background:#fafbfc; }
          .qt-abtn { padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; border:none; cursor:pointer; }
        `}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #e1e8ed" }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>📋 Quotations</h2>
          <button onClick={() => { resetForm(); setView("form"); }} style={{ padding: "9px 20px", background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>+ New Quotation</button>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <input placeholder="Search by client name or quote no…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ padding: "8px 14px", border: "1px solid #d0d7de", borderRadius: 8, fontSize: 13, width: 300, boxSizing: "border-box" }} />
        </div>

        <div style={{ display: "flex", gap: 0, background: "#fff", border: "1px solid #e1e8ed", borderRadius: "12px 12px 0 0", overflow: "hidden", marginBottom: 0 }}>
          {[["Total Quotes", filtered.length, "#0f172a"], ["Total Subtotal", inr(summary.subtotal), "#0f172a"], ["Total Discount", inr(summary.discount), "#cf222e"], ["Total Revenue", inr(summary.revenue), "#bc4c00"]].map(([l, v, c], i, arr) => (
            <div key={l} style={{ flex: 1, padding: "12px 18px", borderRight: i < arr.length - 1 ? "1px solid #e1e8ed" : "none" }}>
              <div style={{ fontSize: 11, color: "#8c959f", textTransform: "uppercase", fontWeight: 600 }}>{l}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginTop: 3, color: c }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #e1e8ed", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden" }}>
          {loading ? <div style={{ textAlign: "center", padding: 40, color: "#8c959f" }}>Loading…</div> : (
            <div style={{ overflowX: "auto" }}>
              <table className="qt-tbl">
                <thead>
                  <tr><th>Quote No</th><th>Client</th><th>Date</th><th>Valid Until</th><th>Items</th><th>Discount</th><th>Tax</th><th>Grand Total</th><th style={{ textAlign: "right" }}>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map((rec) => (
                    <tr key={rec.id}>
                      <td style={{ fontWeight: 700, color: "#bc4c00", fontFamily: "monospace" }}>{rec.quote_no}</td>
                      <td><div style={{ fontWeight: 600 }}>{rec.client_name}</div>{rec.client_phone && <div style={{ fontSize: 11, color: "#8c959f" }}>{rec.client_phone}</div>}</td>
                      <td>{formatDate(rec.quote_date)}</td>
                      <td>{rec.valid_until ? formatDate(rec.valid_until) : "—"}</td>
                      <td>{rec.items_count || 0} items</td>
                      <td style={{ color: "#cf222e", fontFamily: "monospace" }}>{inr(rec.discount_amount)}</td>
                      <td style={{ fontFamily: "monospace" }}>{Number(rec.is_gst) === 0 ? "—" : inr(rec.tax_amount)}</td>
                      <td style={{ color: "#bc4c00", fontWeight: 700, fontFamily: "monospace" }}>{inr(rec.grand_total)}</td>
                      <td><div style={{ display: "flex", gap: 5, justifyContent: "flex-end", flexWrap: "wrap" }}>
                        <button className="qt-abtn" style={{ background: "#eef2ff", color: "#1d4ed8" }} onClick={() => handleViewBill(rec)}>👁 View</button>
                        <button className="qt-abtn" style={{ background: "#fef3c7", color: "#b45309" }} onClick={() => handleEdit(rec)}>✏️ Edit</button>
                        <button className="qt-abtn" style={{ background: "#dcfce7", color: "#15803d" }} onClick={() => handleViewBill(rec)}>🖨️ Print</button>
                        <button className="qt-abtn" style={{ background: "#fee2e2", color: "#b91c1c" }} onClick={() => setDeleteId(rec.id)}>🗑 Del</button>
                      </div></td>
                    </tr>
                  ))}
                  {filtered.length === 0 && <tr><td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#8c959f" }}>No quotations found</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {deleteId && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setDeleteId(null)}>
            <div style={{ background: "#fff", borderRadius: 16, padding: 28, maxWidth: 380, textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>🗑️</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Delete Quotation?</div>
              <div style={{ color: "#57606a", margin: "8px 0 20px" }}>This action cannot be undone.</div>
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={() => setDeleteId(null)} style={{ padding: "8px 18px", border: "1px solid #d0d7de", borderRadius: 8, background: "#f6f8fa", cursor: "pointer", fontWeight: 600 }}>Cancel</button>
                <button onClick={handleDelete} style={{ padding: "8px 18px", border: "none", borderRadius: 8, background: "#cf222e", color: "#fff", cursor: "pointer", fontWeight: 600 }}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── RENDER: FORM ──────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", padding: "0 24px", boxSizing: "border-box", fontFamily: "'Inter',system-ui,sans-serif", color: "#0f172a" }}>
      <style>{`
        .qt-card { background:#fff; border:1px solid #e1e8ed; border-radius:12px; padding:20px; margin-bottom:20px; }
        .qt-card-title { font-weight:700; font-size:14px; color:#bc4c00; margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .qt-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
        .qt-grid .span2 { grid-column:span 2; }
        .qt-grid .span3 { grid-column:span 3; }
        @media(max-width:900px){ .qt-grid { grid-template-columns:repeat(2,1fr); } .qt-grid .span3{grid-column:span 2;} }
        @media(max-width:600px){ .qt-grid { grid-template-columns:1fr; } .qt-grid .span2,.qt-grid .span3{grid-column:span 1;} }
        .qt-label { font-size:12px; font-weight:600; display:block; margin-bottom:4px; color:#444; }
        .qt-input,.qt-select,.qt-textarea { width:100%; padding:8px 10px; border:1px solid #d0d7de; border-radius:8px; font-size:13px; box-sizing:border-box; font-family:inherit; }
        .qt-textarea { resize:vertical; }
        .qt-btn { border:none; border-radius:8px; padding:9px 20px; font-weight:600; font-size:13px; cursor:pointer; }
        .qt-btn-primary { background:#1a1a2e; color:#fff; }
        .qt-btn-ghost { background:#f6f8fa; border:1px solid #d0d7de; color:#333; }
        .qt-btn-sm { padding:5px 12px; font-size:12px; }
        .qt-items-table { width:100%; border-collapse:collapse; min-width:820px; }
        .qt-items-table th,.qt-items-table td { padding:7px 8px; border-bottom:1px solid #f0f0f0; font-size:13px; text-align:left; vertical-align:middle; }
        .qt-items-table th { background:#f6f8fa; font-size:12px; font-weight:600; }
      `}</style>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid #e1e8ed" }}>
        <button className="qt-btn qt-btn-ghost qt-btn-sm" onClick={() => { resetForm(); setView("table"); }}>← Back</button>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{editId ? "Edit Quotation" : "New Quotation"}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* ─── Quotation Details ─── */}
        <div className="qt-card">
          <div className="qt-card-title">📄 Quotation Details</div>
          <div className="qt-grid">
            <div><label className="qt-label">Quote No *</label><input name="quoteNo" value={form.quoteNo} onChange={handleChange} className="qt-input" required placeholder="QT-001" /></div>
            <div><label className="qt-label">Quote Date *</label><input type="date" name="quoteDate" value={form.quoteDate} onChange={handleChange} className="qt-input" required /></div>
            <div><label className="qt-label">Valid Until</label><input type="date" name="validUntil" value={form.validUntil} onChange={handleChange} className="qt-input" /></div>
            <div><label className="qt-label">PO / Order No.</label><input name="poNo" value={form.poNo} onChange={handleChange} className="qt-input" /></div>
            <div><label className="qt-label">Dispatched Through</label><input name="dispatchedThrough" value={form.dispatchedThrough} onChange={handleChange} className="qt-input" /></div>
            <div><label className="qt-label">Vehicle No.</label><input name="vehicleNo" value={form.vehicleNo} onChange={handleChange} className="qt-input" /></div>
            <div className="span3"><label className="qt-label">Other References</label><input name="otherRef" value={form.otherRef} onChange={handleChange} className="qt-input" /></div>
            <div><label className="qt-label">Discount %</label><input type="number" name="discount" value={form.discount} onChange={handleChange} className="qt-input" min="0" step="any" /></div>
            <div><label className="qt-label">GST Applicable?</label>
              <select value={form.isGst ? "yes" : "no"} onChange={(e) => setForm({ ...form, isGst: e.target.value === "yes" })} className="qt-select">
                <option value="yes">Yes — GST Bill</option>
                <option value="no">No — Non-GST Bill</option>
              </select>
            </div>
            {form.isGst && (
              <div><label className="qt-label">GST Rate %</label>
                <select name="taxPercent" value={form.taxPercent} onChange={handleChange} className="qt-select">
                  <option value={18}>18% (CGST 9% + SGST 9%)</option><option value={12}>12% (CGST 6% + SGST 6%)</option>
                  <option value={5}>5% (CGST 2.5% + SGST 2.5%)</option><option value={28}>28% (CGST 14% + SGST 14%)</option><option value={0}>0%</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* ─── Buyer ─── */}
        <div className="qt-card">
          <div className="qt-card-title">👤 Buyer (Bill to)</div>
          <div className="qt-grid">
            <div><label className="qt-label">Client Name *</label><input name="clientName" value={form.clientName} onChange={handleChange} className="qt-input" required /></div>
            <div><label className="qt-label">Phone</label><input name="clientPhone" value={form.clientPhone} onChange={handleChange} className="qt-input" /></div>
            <div><label className="qt-label">Email</label><input name="clientEmail" value={form.clientEmail} onChange={handleChange} className="qt-input" /></div>
         {form.isGst && <div><label className="qt-label">GSTIN</label><input name="clientGst" value={form.clientGst} onChange={handleChange} className="qt-input" /></div>}
            <div><label className="qt-label">State</label><input name="clientState" value={form.clientState} onChange={handleChange} className="qt-input" /></div>
            <div><label className="qt-label">State Code</label><input name="clientStateCode" value={form.clientStateCode} onChange={handleChange} className="qt-input" /></div>
            <div className="span3"><label className="qt-label">Address</label><textarea name="clientAddress" value={form.clientAddress} onChange={handleChange} className="qt-textarea" rows={2} /></div>
          </div>
        </div>

        {/* ─── Consignee ─── */}
        <div className="qt-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
           <div className="qt-card-title" style={{ margin: 0 }}>🚛 Consignee (Ship to)</div>
            {sameAsClient ? <button type="button" className="qt-btn qt-btn-primary qt-btn-sm" onClick={copyClientToShip}>Same as Buyer →</button> :
              <button type="button" className="qt-btn qt-btn-ghost qt-btn-sm" onClick={() => { setSameAsClient(true); setForm({ ...form, shipName: "", shipAddress: "", shipGst: "", shipState: "Tamil Nadu", shipStateCode: "33" }); }}>Clear Ship-to</button>}
          </div>
          {!sameAsClient && <div className="qt-grid">
            <div className="span3"><label className="qt-label">Name</label><input name="shipName" value={form.shipName} onChange={handleChange} className="qt-input" /></div>
            <div className="span3"><label className="qt-label">Address</label><textarea name="shipAddress" value={form.shipAddress} onChange={handleChange} className="qt-textarea" rows={2} /></div>
           {form.isGst && <div><label className="qt-label">GSTIN</label><input name="shipGst" value={form.shipGst} onChange={handleChange} className="qt-input" /></div>}
            <div><label className="qt-label">State</label><input name="shipState" value={form.shipState} onChange={handleChange} className="qt-input" /></div>
            <div><label className="qt-label">State Code</label><input name="shipStateCode" value={form.shipStateCode} onChange={handleChange} className="qt-input" /></div>
          </div>}
          {sameAsClient && <p style={{ color: "#8c959f", fontSize: 13, margin: 0 }}>Ship-to same as Buyer. Click button to add separate address.</p>}
        </div>

        {/* ─── Items ─── */}
        <div className="qt-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="qt-card-title" style={{ margin: 0 }}>📦 Items</div>
            <button type="button" className="qt-btn qt-btn-primary qt-btn-sm" onClick={addItem}>+ Add Item</button>
          </div>

          {products.length > 0 ? (
            <div style={{ background: "#fef3ec", border: "1px solid #ffd7b5", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              💡 <span><strong>{products.length} products</strong> in catalog — pick from the <strong>dropdown</strong> to auto-fill HSN, unit &amp; rate. <em>Stock is not reduced.</em></span>
            </div>
          ) : (
            <div style={{ background: "#f6f8fa", border: "1px solid #e1e8ed", borderRadius: 8, padding: "8px 12px", fontSize: 12, marginBottom: 12, color: "#8c959f" }}>
              ℹ️ No products in catalog yet. Add products in <strong>Stock → Products</strong> to enable quick-fill.
            </div>
          )}

          <div style={{ overflowX: "auto" }}>
            <table className="qt-items-table">
              <thead><tr><th style={{ width: 32 }}>#</th><th style={{ minWidth: 260 }}>Description</th><th style={{ width: 80 }}>HSN/SAC</th><th style={{ width: 105 }}>Due On</th><th style={{ width: 75 }}>Unit</th><th style={{ width: 70 }}>Qty</th><th style={{ width: 100 }}>Rate (₹)</th><th style={{ width: 110 }}>Amount (₹)</th><th style={{ width: 36 }}></th></tr></thead>
              <tbody>
                {form.items.map((item, i) => <ItemRow key={i} item={item} idx={i} products={products} onChange={handleItemChange} onProductSelect={handleProductSelect} onRemove={removeItem} canRemove={form.items.length > 1} units={UNITS} />)}
              </tbody>
            </table>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <div style={{ minWidth: 280, background: "#f6f8fa", borderRadius: 12, padding: 16 }}>
              {[
                ["Subtotal", inr(T.subtotal)],
                T.discountAmt > 0 ? [`Discount (${form.discount}%)`, `- ${inr(T.discountAmt)}`] : null,
                ["Taxable Value", inr(T.taxable)],
                form.isGst ? [`CGST (${Number(form.taxPercent) / 2}%)`, inr(T.cgst)] : null,
                form.isGst ? [`SGST (${Number(form.taxPercent) / 2}%)`, inr(T.sgst)] : null,
                ["Round Off", T.roundOff >= 0 ? `+${inr(Math.abs(T.roundOff))}` : `-${inr(Math.abs(T.roundOff))}`],
              ].filter(Boolean).map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 13 }}><span>{l}</span><span style={{ fontFamily: "monospace" }}>{v}</span></div>
              ))}
              <div style={{ height: 1, background: "#d0d7de", margin: "10px 0" }}></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: 15 }}><span>Grand Total</span><span style={{ color: "#bc4c00", fontFamily: "monospace" }}>{inr(T.grandTotal)}</span></div>
            </div>
          </div>
        </div>
{/* ─── Unit Price ─── */}
        <div className="qt-card">
          <div className="qt-card-title">⚖️ Unit Price</div>
          <div className="qt-grid">
            <div>
              <label className="qt-label">Select Unit</label>
              <select className="qt-select" value={form.priceUnit} onChange={(e) => setForm({ ...form, priceUnit: e.target.value })}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="qt-label">Price per {form.priceUnit}</label>
              <input className="qt-input" readOnly value={(() => {
  const totalQty = form.items.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
  return totalQty > 0 ? inr(T.grandTotal / totalQty) : inr(0);
})()} />
            </div>
          </div>
        </div>
        {/* ─── Notes ─── */}
        <div className="qt-card">
          <div className="qt-grid">
            <div className="span3"><label className="qt-label">Terms &amp; Notes</label><textarea name="notes" value={form.notes} onChange={handleChange} className="qt-textarea" rows={2} /></div>
            <div className="span3"><label className="qt-label">Declaration</label><textarea name="declaration" value={form.declaration} onChange={handleChange} className="qt-textarea" rows={2} /></div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginBottom: 40 }}>
          <button type="submit" className="qt-btn qt-btn-primary">💾 {editId ? "Update" : "Save"} Quotation</button>
          <button type="button" className="qt-btn qt-btn-ghost" onClick={resetForm}>Reset</button>
        </div>
      </form>
    </div>
  );
}

// ─── ITEM ROW ──────────────────────────────────────────────────────────────
const BRANCH_NAMES = { 1: "Branch A", 2: "Branch B", 3: "Branch C" };

function ItemRow({ item, idx, products, onChange, onProductSelect, onRemove, canRemove, units }) {
  const isMatched = products.some((p) => p.product_name === item.description);

  const handleDropdown = (e) => {
    const id = e.target.value;
    if (!id) { onChange(idx, "description", ""); onProductSelect(idx, null); }
    else { onProductSelect(idx, products.find((p) => String(p.id) === id) || null); }
  };

  const handleManual = (e) => {
    const v = e.target.value;
    onChange(idx, "description", v);
  };

  return (
    <tr>
      <td style={{ textAlign: "center", fontSize: 13 }}>{idx + 1}</td>
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {products.length > 0 && (
            <select className="qt-select" value="" onChange={handleDropdown} style={{ fontSize: 12, color: isMatched ? "#0f172a" : "#8c959f" }}>
              <option value="">— Select from catalog —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.product_name}{p.selling_price ? `  ₹${parseFloat(p.selling_price).toFixed(2)}` : ""}{p.stock_qty != null ? `  (Stock: ${p.stock_qty})` : ""}{p.branch_id ? `  [${BRANCH_NAMES[p.branch_id] || `Branch ${p.branch_id}`}]` : ""}</option>)}
            </select>
          )}
          <input className="qt-input" value={item.description} onChange={handleManual} placeholder={products.length > 0 ? "Or type custom description…" : "Product / Service"} style={{ fontSize: 12 }} />
        </div>
      </td>
      <td><input className="qt-input" value={item.hsn} onChange={(e) => onChange(idx, "hsn", e.target.value)} placeholder="HSN" style={{ fontSize: 12 }} /></td>
      <td><input type="date" className="qt-input" value={item.dueOn} onChange={(e) => onChange(idx, "dueOn", e.target.value)} style={{ fontSize: 12 }} /></td>
      <td><select className="qt-select" value={item.unit} onChange={(e) => onChange(idx, "unit", e.target.value)} style={{ fontSize: 12 }}>{units.map((u) => <option key={u}>{u}</option>)}</select></td>
      <td><input type="number" className="qt-input" value={item.qty} min="0" step="any" onChange={(e) => onChange(idx, "qty", parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} /></td>
      <td><input type="number" className="qt-input" value={item.rateIncl} min="0" step="any" onChange={(e) => onChange(idx, "rateIncl", parseFloat(e.target.value) || 0)} style={{ fontSize: 12 }} /></td>
      <td style={{ fontFamily: "monospace", fontWeight: 600, textAlign: "right", fontSize: 13 }}>₹ {((parseFloat(item.qty) || 0) * (parseFloat(item.rateIncl) || 0)).toFixed(2)}</td>
      <td>{canRemove && <button type="button" onClick={() => onRemove(idx)} style={{ background: "none", border: "none", color: "#cf222e", cursor: "pointer", fontSize: 16, lineHeight: 1 }}>🗑</button>}</td>
    </tr>
  );
}