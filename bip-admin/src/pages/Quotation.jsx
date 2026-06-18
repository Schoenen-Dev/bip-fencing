import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

const COMPANY = {
  name: "BIP FENCING CONTRACT WORK",
  address: "NO. 26/A, MAIN ROAD, PAMBANKULAM, KALANTHAPANAI, PANAGUDI - 627109",
  gst: "33ABLPI5244C1Z1",
  state: "Tamil Nadu",
  stateCode: "33",
  phone: "9655072445",
};

const DECLARATION =
  "We declare that this quotation shows the actual price of the goods described and that all particulars are true and correct.";

const fmt2 = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const inr = (v) => `₹ ${fmt2(v)}`;

const fmtDate = (d) => {
  if (!d) return "—";
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
  taxPercent: 18,
  notes: "",
  declaration: DECLARATION,
  items: [
    { description: "", hsn: "", dueOn: "", unit: "Nos", qty: 1, rate: 0 },
  ],
});

const PRINT_STYLES = `
@media print {
  html, body { width:210mm; min-height:297mm; margin:0; padding:0; background:#fff; }
  body * { visibility: hidden !important; }
  #qt-print-area, #qt-print-area * { visibility: visible !important; }
  #qt-print-area {
    position:fixed !important; top:0 !important; left:0 !important;
    width:100% !important; margin:0 !important; padding:0 !important;
    box-shadow:none !important;
  }
  .qt-no-print { display:none !important; }
  @page { size:A4 portrait; margin:8mm; }
}
`;

const TC = (ex = {}) => ({
  border: "1px solid #000",
  padding: "4px 6px",
  fontSize: 12,
  verticalAlign: "top",
  lineHeight: 1.4,
  ...ex,
});
const TH = (ex = {}) => ({
  ...TC(),
  background: "#e8e8e8",
  fontWeight: "bold",
  ...ex,
});

// ── UNIT MAP (products.php unit → quotation unit) ────────────
const UNIT_MAP = {
  Pcs: "Nos",
  Kg: "Kg",
  Meter: "Meter",
  Roll: "Roll",
  Box: "Box",
  Set: "Set",
  Liter: "Liter",
  Ton: "Ton",
};
const UNITS = [
  "Nos",
  "Kg",
  "Meter",
  "Roll",
  "R.FEET",
  "Box",
  "Set",
  "Liter",
  "Ton",
];

// ============================================================
export default function Quotation() {
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

  const fetchProducts = async () => {
    try {
      const res = await apiFetch("/products.php");
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
      (s, i) => s + (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0),
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
    Number(form.taxPercent),
  );

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleItemChange = (i, field, value) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm({ ...form, items });
  };

  // Called when a product is selected from the dropdown
  const handleProductSelect = (i, productName) => {
    if (!productName) {
      const items = [...form.items];
      items[i] = { ...items[i], description: "" };
      setForm({ ...form, items });
      return;
    }
    const p = products.find((x) => x.product_name === productName);
    if (!p) return;
    const items = [...form.items];
    items[i] = {
      ...items[i],
      description: p.product_name,
      hsn: p.sku || "",
      unit: UNIT_MAP[p.unit] || "Nos",
      rate: parseFloat(p.selling_price) || 0,
    };
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
        taxPercent: data.tax_percent,
        notes: data.notes || "",
        declaration: data.declaration || DECLARATION,
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

  // ============================================================
  // RENDER: PREVIEW
  // ============================================================
  if (view === "preview" && previewRec) {
    const d = previewRec;
    const items = d.items || [];
    const disc = parseFloat(d.discount_percent) || 0;
    const tax = parseFloat(d.tax_percent) || 18;
    const rows = items.map((i) => ({
      ...i,
      qty: parseFloat(i.quantity) || 0,
      rate: parseFloat(i.rate) || 0,
      amount: parseFloat(i.amount) || 0,
    }));
    const sub = rows.reduce((s, r) => s + r.qty * r.rate, 0);
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
      hsnGroups[key].taxable += r.qty * r.rate * (1 - disc / 100);
      hsnGroups[key].cgst +=
        r.qty * r.rate * (1 - disc / 100) * (cgstRate / 100);
      hsnGroups[key].sgst +=
        r.qty * r.rate * (1 - disc / 100) * (sgstRate / 100);
    });

    return (
      <>
        <style>{PRINT_STYLES}</style>
        <div
          className="qt-no-print"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            padding: "16px 0",
            background: "#f6f8fa",
          }}
        >
          <button
            onClick={() => setView("table")}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid #d0d7de",
              background: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back to List
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "#bc4c00",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🖨️ Print Quotation
          </button>
        </div>

        <div
          id="qt-print-area"
          style={{
            maxWidth: 900,
            margin: "0 auto 30px",
            fontFamily: "'Times New Roman',Times,serif",
            color: "#000",
            background: "#fff",
            border: "2px solid #000",
          }}
        >
          <div
            style={{
              textAlign: "right",
              padding: "3px 10px",
              fontStyle: "italic",
              fontSize: 11,
              borderBottom: "1px solid #ccc",
            }}
          >
            QUOTATION
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              borderBottom: "1px solid #000",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    width: 80,
                    borderRight: "1px solid #000",
                    padding: 6,
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      width: 66,
                      height: 66,
                      border: "2px solid #000",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: 10,
                      textAlign: "center",
                      lineHeight: 1.2,
                    }}
                  >
                    BIP
                    <br />
                    FENCING
                  </div>
                </td>
                <td
                  style={{
                    padding: "6px 14px",
                    textAlign: "center",
                    verticalAlign: "middle",
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      letterSpacing: 2,
                      textTransform: "uppercase",
                    }}
                  >
                    {COMPANY.name}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 2 }}>
                    {COMPANY.address}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    GSTIN/UIN: <strong>{COMPANY.gst}</strong> &nbsp; State:{" "}
                    {COMPANY.state}, Code: {COMPANY.stateCode}
                  </div>
                  <div style={{ fontSize: 12 }}>Ph: {COMPANY.phone}</div>
                </td>
              </tr>
            </tbody>
          </table>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              borderBottom: "1px solid #000",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    width: "52%",
                    borderRight: "1px solid #000",
                    padding: "5px 8px",
                    verticalAlign: "top",
                  }}
                >
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: 11,
                      textTransform: "uppercase",
                      borderBottom: "1px dashed #999",
                      paddingBottom: 2,
                      marginBottom: 3,
                    }}
                  >
                    Consignee (Ship to)
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: 13 }}>
                    {d.ship_name || d.client_name}
                  </div>
                  <div style={{ fontSize: 12 }}>
                    {d.ship_address || d.client_address}
                  </div>
                  {(d.ship_gst || d.client_gst) && (
                    <div style={{ fontSize: 12 }}>
                      GSTIN/UIN: {d.ship_gst || d.client_gst}
                    </div>
                  )}
                  <div style={{ fontSize: 12 }}>
                    State: {d.ship_state || d.client_state || "Tamil Nadu"},
                    Code: {d.ship_state_code || d.client_state_code || "33"}
                  </div>
                </td>
                <td style={{ padding: 0, verticalAlign: "top" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                      fontSize: 12,
                      height: "100%",
                    }}
                  >
                    <tbody>
                      <tr>
                        <td
                          style={{
                            width: "50%",
                            padding: "5px 8px",
                            borderRight: "1px solid #000",
                            verticalAlign: "top",
                          }}
                        >
                          {[
                            ["Quotation No.", d.quote_no],
                            ["Date", fmtDate(d.quote_date)],
                            [
                              "Valid Until",
                              d.valid_until ? fmtDate(d.valid_until) : "—",
                            ],
                            ["PO/Order No.", d.po_no || "—"],
                          ].map(([k, v]) => (
                            <div
                              key={k}
                              style={{ display: "flex", marginBottom: 3 }}
                            >
                              <span
                                style={{
                                  fontWeight: "bold",
                                  fontSize: 11,
                                  minWidth: 100,
                                }}
                              >
                                {k}
                              </span>
                              <span>: {v}</span>
                            </div>
                          ))}
                        </td>
                        <td
                          style={{ padding: "5px 8px", verticalAlign: "top" }}
                        >
                          {[
                            ["Dispatched Through", d.dispatched_through || "—"],
                            ["Vehicle No.", d.vehicle_no || "—"],
                            ["Other Ref.", d.other_ref || "—"],
                          ].map(([k, v]) => (
                            <div
                              key={k}
                              style={{ display: "flex", marginBottom: 3 }}
                            >
                              <span
                                style={{
                                  fontWeight: "bold",
                                  fontSize: 11,
                                  minWidth: 100,
                                }}
                              >
                                {k}
                              </span>
                              <span>: {v}</span>
                            </div>
                          ))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              borderBottom: "1px solid #000",
            }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "5px 8px", verticalAlign: "top" }}>
                  <div
                    style={{
                      fontWeight: "bold",
                      fontSize: 11,
                      textTransform: "uppercase",
                      borderBottom: "1px dashed #999",
                      paddingBottom: 2,
                      marginBottom: 3,
                    }}
                  >
                    Buyer (Bill to)
                  </div>
                  <div style={{ fontWeight: "bold", fontSize: 13 }}>
                    {d.client_name}
                  </div>
                  {d.client_address && (
                    <div style={{ fontSize: 12 }}>{d.client_address}</div>
                  )}
                  {d.client_phone && (
                    <div style={{ fontSize: 12 }}>Ph: {d.client_phone}</div>
                  )}
                  {d.client_email && (
                    <div style={{ fontSize: 12 }}>Email: {d.client_email}</div>
                  )}
                  {d.client_gst && (
                    <div style={{ fontSize: 12 }}>
                      GSTIN/UIN: {d.client_gst}
                    </div>
                  )}
                  <div style={{ fontSize: 12 }}>
                    State: {d.client_state || "Tamil Nadu"}, Code:{" "}
                    {d.client_state_code || "33"}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              borderBottom: "1px solid #000",
            }}
          >
            <thead>
              <tr>
                {[
                  { l: "Sl\nNo.", w: 30, a: "center" },
                  { l: "Description of Goods", a: "left" },
                  { l: "HSN/\nSAC", w: 65, a: "center" },
                  { l: "Due On", w: 75, a: "center" },
                  { l: "Unit", w: 50, a: "center" },
                  { l: "Qty", w: 60, a: "center" },
                  { l: "Rate (₹)", w: 90, a: "right" },
                  { l: "Amount (₹)", w: 100, a: "right" },
                ].map((c) => (
                  <th
                    key={c.l}
                    style={TH({
                      whiteSpace: "pre-line",
                      textAlign: c.a,
                      width: c.w,
                    })}
                  >
                    {c.l}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td style={TC({ textAlign: "center" })}>{i + 1}</td>
                  <td style={TC()}>
                    <strong>{r.description}</strong>
                  </td>
                  <td style={TC({ textAlign: "center" })}>{r.hsn || "–"}</td>
                  <td style={TC({ textAlign: "center" })}>
                    {r.due_on ? fmtDate(r.due_on) : "—"}
                  </td>
                  <td style={TC({ textAlign: "center" })}>{r.unit || "Nos"}</td>
                  <td style={TC({ textAlign: "center" })}>{r.qty}</td>
                  <td style={TC({ textAlign: "right" })}>{fmt2(r.rate)}</td>
                  <td style={TC({ textAlign: "right" })}>
                    {fmt2(r.qty * r.rate)}
                  </td>
                </tr>
              ))}
              {rows.length < 5 &&
                Array.from({ length: 5 - rows.length }).map((_, i) => (
                  <tr key={`blank_${i}`} style={{ height: 22 }}>
                    {Array(8)
                      .fill(null)
                      .map((__, j) => (
                        <td key={j} style={TC()}>
                          &nbsp;
                        </td>
                      ))}
                  </tr>
                ))}
              <tr>
                <td
                  colSpan={7}
                  style={TC({
                    textAlign: "right",
                    fontWeight: "bold",
                    borderTop: "1px solid #000",
                  })}
                >
                  Subtotal
                </td>
                <td
                  style={TC({
                    textAlign: "right",
                    fontWeight: "bold",
                    borderTop: "1px solid #000",
                  })}
                >
                  {fmt2(sub)}
                </td>
              </tr>
              {disc > 0 && (
                <tr>
                  <td
                    colSpan={7}
                    style={TC({ textAlign: "right", fontStyle: "italic" })}
                  >
                    Discount ({disc}%)
                  </td>
                  <td style={TC({ textAlign: "right", color: "#c00" })}>
                    (-) {fmt2(discAmt)}
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={7} style={TC({ textAlign: "right" })}>
                  Taxable Value
                </td>
                <td style={TC({ textAlign: "right", fontWeight: "bold" })}>
                  {fmt2(taxable)}
                </td>
              </tr>
              <tr>
                <td
                  colSpan={7}
                  style={TC({ textAlign: "right", fontStyle: "italic" })}
                >
                  CGST ({cgstRate}%)
                </td>
                <td style={TC({ textAlign: "right" })}>{fmt2(cgstAmt)}</td>
              </tr>
              <tr>
                <td
                  colSpan={7}
                  style={TC({ textAlign: "right", fontStyle: "italic" })}
                >
                  SGST ({sgstRate}%)
                </td>
                <td style={TC({ textAlign: "right" })}>{fmt2(sgstAmt)}</td>
              </tr>
              <tr>
                <td
                  colSpan={7}
                  style={TC({ textAlign: "right", fontStyle: "italic" })}
                >
                  Rounding Off
                </td>
                <td style={TC({ textAlign: "right" })}>
                  {roundOff >= 0
                    ? `(+) ${fmt2(Math.abs(roundOff))}`
                    : `(-) ${fmt2(Math.abs(roundOff))}`}
                </td>
              </tr>
              <tr style={{ background: "#f0f0f0" }}>
                <td
                  colSpan={5}
                  style={TC({
                    textAlign: "right",
                    fontWeight: "bold",
                    borderTop: "1px solid #000",
                    borderBottom: "1px solid #000",
                  })}
                >
                  Total
                </td>
                <td
                  style={TC({
                    textAlign: "center",
                    fontWeight: "bold",
                    borderTop: "1px solid #000",
                    borderBottom: "1px solid #000",
                  })}
                >
                  {fmt2(totalQty)}
                </td>
                <td
                  style={TC({
                    borderTop: "1px solid #000",
                    borderBottom: "1px solid #000",
                  })}
                ></td>
                <td
                  style={TC({
                    textAlign: "right",
                    fontWeight: "bold",
                    borderTop: "1px solid #000",
                    borderBottom: "1px solid #000",
                  })}
                >
                  ₹ {fmt2(sub)}
                </td>
              </tr>
            </tbody>
          </table>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              borderBottom: "1px solid #000",
            }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    width: "55%",
                    borderRight: "1px solid #000",
                    padding: "5px 8px",
                    verticalAlign: "top",
                    fontSize: 12,
                  }}
                >
                  <div style={{ fontWeight: "bold", marginBottom: 2 }}>
                    Amount Chargeable (in words)
                  </div>
                  <div style={{ fontStyle: "italic", fontSize: 13 }}>
                    {amountInWords(netAmount)}
                  </div>
                </td>
                <td
                  style={{
                    padding: "5px 8px",
                    textAlign: "right",
                    verticalAlign: "middle",
                  }}
                >
                  <div style={{ fontSize: 18, fontWeight: "bold" }}>
                    ₹ {fmt2(netAmount)}
                  </div>
                  <div style={{ fontSize: 11 }}>E. &amp; O.E</div>
                </td>
              </tr>
            </tbody>
          </table>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              borderBottom: "1px solid #000",
            }}
          >
            <thead>
              <tr>
                {[
                  "HSN/SAC",
                  "Taxable\nValue",
                  `CGST\n${cgstRate}%`,
                  "CGST\nAmount",
                  `SGST\n${sgstRate}%`,
                  "SGST\nAmount",
                  "Total Tax",
                ].map((h) => (
                  <th
                    key={h}
                    style={TH({
                      textAlign: "center",
                      whiteSpace: "pre-line",
                      fontSize: 11,
                    })}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(hsnGroups).map(([hsn, g]) => (
                <tr key={hsn}>
                  <td style={TC({ textAlign: "center" })}>{hsn}</td>
                  <td style={TC({ textAlign: "right" })}>{fmt2(g.taxable)}</td>
                  <td style={TC({ textAlign: "center" })}>{cgstRate}%</td>
                  <td style={TC({ textAlign: "right" })}>{fmt2(g.cgst)}</td>
                  <td style={TC({ textAlign: "center" })}>{sgstRate}%</td>
                  <td style={TC({ textAlign: "right" })}>{fmt2(g.sgst)}</td>
                  <td style={TC({ textAlign: "right" })}>
                    {fmt2(g.cgst + g.sgst)}
                  </td>
                </tr>
              ))}
              <tr style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                <td style={TC({ borderTop: "1px solid #000" })}>Total</td>
                <td
                  style={TC({
                    textAlign: "right",
                    borderTop: "1px solid #000",
                  })}
                >
                  {fmt2(taxable)}
                </td>
                <td style={TC({ borderTop: "1px solid #000" })}></td>
                <td
                  style={TC({
                    textAlign: "right",
                    borderTop: "1px solid #000",
                  })}
                >
                  {fmt2(cgstAmt)}
                </td>
                <td style={TC({ borderTop: "1px solid #000" })}></td>
                <td
                  style={TC({
                    textAlign: "right",
                    borderTop: "1px solid #000",
                  })}
                >
                  {fmt2(sgstAmt)}
                </td>
                <td
                  style={TC({
                    textAlign: "right",
                    borderTop: "1px solid #000",
                  })}
                >
                  {fmt2(totalTax)}
                </td>
              </tr>
            </tbody>
          </table>

          <div
            style={{
              padding: "3px 8px",
              borderBottom: "1px solid #000",
              fontSize: 12,
            }}
          >
            <strong>Tax Amount (in words):</strong>&nbsp;
            <em>{amountInWords(totalTax)}</em>
          </div>

          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td
                  style={{
                    width: "45%",
                    borderRight: "1px solid #000",
                    padding: "6px 8px",
                    verticalAlign: "top",
                    fontSize: 12,
                  }}
                >
                  {d.notes && (
                    <>
                      <div style={{ fontWeight: "bold", marginBottom: 4 }}>
                        Terms &amp; Notes
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          marginBottom: 8,
                          whiteSpace: "pre-wrap",
                        }}
                      >
                        {d.notes}
                      </div>
                    </>
                  )}
                </td>
                <td style={{ padding: "6px 8px", verticalAlign: "top" }}>
                  <div style={{ fontSize: 11, marginBottom: 8 }}>
                    <strong>Declaration:</strong> {d.declaration || DECLARATION}
                  </div>
                  <div
                    style={{
                      textAlign: "right",
                      fontWeight: "bold",
                      fontSize: 12,
                      marginBottom: 2,
                    }}
                  >
                    for {COMPANY.name}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: 40,
                    }}
                  >
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div
                        style={{
                          borderTop: "1px solid #000",
                          paddingTop: 4,
                          fontSize: 12,
                        }}
                      >
                        Receiver's Signature
                      </div>
                    </div>
                    <div style={{ flex: 0.2 }}></div>
                    <div style={{ textAlign: "center", flex: 1 }}>
                      <div
                        style={{
                          borderTop: "1px solid #000",
                          paddingTop: 4,
                          fontSize: 12,
                        }}
                      >
                        Authorised Signatory
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      marginTop: 8,
                      fontSize: 10,
                      color: "#666",
                    }}
                  >
                    This is a Computer Generated Quotation
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div
          className="qt-no-print"
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 12,
            paddingBottom: 30,
          }}
        >
          <button
            onClick={() => setView("table")}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid #d0d7de",
              background: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ← Back to List
          </button>
          <button
            onClick={() => window.print()}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              background: "#bc4c00",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            🖨️ Print Quotation
          </button>
        </div>
      </>
    );
  }

  // ============================================================
  // RENDER: FORM
  // ============================================================
  if (view === "form")
    return (
      <div
        style={{
          width: "100%",
          padding: "0 24px",
          boxSizing: "border-box",
          fontFamily: "'Inter',system-ui,sans-serif",
          color: "#0f172a",
        }}
      >
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
        .qt-btn-primary { background:#bc4c00; color:#fff; }
        .qt-btn-ghost  { background:#f6f8fa; border:1px solid #d0d7de; color:#333; }
        .qt-btn-sm { padding:5px 12px; font-size:12px; }
        .qt-items-table { width:100%; border-collapse:collapse; min-width:820px; }
        .qt-items-table th,.qt-items-table td { padding:7px 8px; border-bottom:1px solid #f0f0f0; font-size:13px; text-align:left; vertical-align:middle; }
        .qt-items-table th { background:#f6f8fa; font-size:12px; font-weight:600; }
      `}</style>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
            paddingBottom: 16,
            borderBottom: "1px solid #e1e8ed",
          }}
        >
          <button
            className="qt-btn qt-btn-ghost qt-btn-sm"
            onClick={() => {
              resetForm();
              setView("table");
            }}
          >
            ← Back
          </button>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
            {editId ? "Edit Quotation" : "New Quotation"}
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Quotation Details */}
          <div className="qt-card">
            <div className="qt-card-title">📄 Quotation Details</div>
            <div className="qt-grid">
              <div>
                <label className="qt-label">Quote No *</label>
                <input
                  name="quoteNo"
                  value={form.quoteNo}
                  onChange={handleChange}
                  className="qt-input"
                  required
                  placeholder="QT-001"
                />
              </div>
              <div>
                <label className="qt-label">Quote Date *</label>
                <input
                  type="date"
                  name="quoteDate"
                  value={form.quoteDate}
                  onChange={handleChange}
                  className="qt-input"
                  required
                />
              </div>
              <div>
                <label className="qt-label">Valid Until</label>
                <input
                  type="date"
                  name="validUntil"
                  value={form.validUntil}
                  onChange={handleChange}
                  className="qt-input"
                />
              </div>
              <div>
                <label className="qt-label">PO / Order No.</label>
                <input
                  name="poNo"
                  value={form.poNo}
                  onChange={handleChange}
                  className="qt-input"
                />
              </div>
              <div>
                <label className="qt-label">Dispatched Through</label>
                <input
                  name="dispatchedThrough"
                  value={form.dispatchedThrough}
                  onChange={handleChange}
                  className="qt-input"
                />
              </div>
              <div>
                <label className="qt-label">Vehicle No.</label>
                <input
                  name="vehicleNo"
                  value={form.vehicleNo}
                  onChange={handleChange}
                  className="qt-input"
                />
              </div>
              <div className="span3">
                <label className="qt-label">Other References</label>
                <input
                  name="otherRef"
                  value={form.otherRef}
                  onChange={handleChange}
                  className="qt-input"
                />
              </div>
              <div>
                <label className="qt-label">Discount %</label>
                <input
                  type="number"
                  name="discount"
                  value={form.discount}
                  onChange={handleChange}
                  className="qt-input"
                  min="0"
                  step="any"
                />
              </div>
              <div>
                <label className="qt-label">GST Rate %</label>
                <select
                  name="taxPercent"
                  value={form.taxPercent}
                  onChange={handleChange}
                  className="qt-select"
                >
                  <option value={18}>18% (CGST 9% + SGST 9%)</option>
                  <option value={12}>12% (CGST 6% + SGST 6%)</option>
                  <option value={5}>5% (CGST 2.5% + SGST 2.5%)</option>
                  <option value={28}>28% (CGST 14% + SGST 14%)</option>
                  <option value={0}>0%</option>
                </select>
              </div>
            </div>
          </div>

          {/* Buyer */}
          <div className="qt-card">
            <div className="qt-card-title">👤 Buyer (Bill to)</div>
            <div className="qt-grid">
              <div>
                <label className="qt-label">Client Name *</label>
                <input
                  name="clientName"
                  value={form.clientName}
                  onChange={handleChange}
                  className="qt-input"
                  required
                />
              </div>
              <div>
                <label className="qt-label">Phone</label>
                <input
                  name="clientPhone"
                  value={form.clientPhone}
                  onChange={handleChange}
                  className="qt-input"
                />
              </div>
              <div>
                <label className="qt-label">Email</label>
                <input
                  name="clientEmail"
                  value={form.clientEmail}
                  onChange={handleChange}
                  className="qt-input"
                />
              </div>
              <div>
                <label className="qt-label">GSTIN</label>
                <input
                  name="clientGst"
                  value={form.clientGst}
                  onChange={handleChange}
                  className="qt-input"
                />
              </div>
              <div>
                <label className="qt-label">State</label>
                <input
                  name="clientState"
                  value={form.clientState}
                  onChange={handleChange}
                  className="qt-input"
                />
              </div>
              <div>
                <label className="qt-label">State Code</label>
                <input
                  name="clientStateCode"
                  value={form.clientStateCode}
                  onChange={handleChange}
                  className="qt-input"
                />
              </div>
              <div className="span3">
                <label className="qt-label">Address</label>
                <textarea
                  name="clientAddress"
                  value={form.clientAddress}
                  onChange={handleChange}
                  className="qt-textarea"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Consignee */}
          <div className="qt-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div className="qt-card-title" style={{ margin: 0 }}>
                🚛 Consignee (Ship to)
              </div>
              {sameAsClient ? (
                <button
                  type="button"
                  className="qt-btn qt-btn-primary qt-btn-sm"
                  onClick={copyClientToShip}
                >
                  Same as Buyer →
                </button>
              ) : (
                <button
                  type="button"
                  className="qt-btn qt-btn-ghost qt-btn-sm"
                  onClick={() => {
                    setSameAsClient(true);
                    setForm({
                      ...form,
                      shipName: "",
                      shipAddress: "",
                      shipGst: "",
                      shipState: "Tamil Nadu",
                      shipStateCode: "33",
                    });
                  }}
                >
                  Clear Ship-to
                </button>
              )}
            </div>
            {!sameAsClient && (
              <div className="qt-grid">
                <div className="span3">
                  <label className="qt-label">Name</label>
                  <input
                    name="shipName"
                    value={form.shipName}
                    onChange={handleChange}
                    className="qt-input"
                  />
                </div>
                <div className="span3">
                  <label className="qt-label">Address</label>
                  <textarea
                    name="shipAddress"
                    value={form.shipAddress}
                    onChange={handleChange}
                    className="qt-textarea"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="qt-label">GSTIN</label>
                  <input
                    name="shipGst"
                    value={form.shipGst}
                    onChange={handleChange}
                    className="qt-input"
                  />
                </div>
                <div>
                  <label className="qt-label">State</label>
                  <input
                    name="shipState"
                    value={form.shipState}
                    onChange={handleChange}
                    className="qt-input"
                  />
                </div>
                <div>
                  <label className="qt-label">State Code</label>
                  <input
                    name="shipStateCode"
                    value={form.shipStateCode}
                    onChange={handleChange}
                    className="qt-input"
                  />
                </div>
              </div>
            )}
            {sameAsClient && (
              <p style={{ color: "#8c959f", fontSize: 13, margin: 0 }}>
                Ship-to same as Buyer. Click button to add separate address.
              </p>
            )}
          </div>

          {/* Items */}
          <div className="qt-card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <div className="qt-card-title" style={{ margin: 0 }}>
                📦 Items
              </div>
              <button
                type="button"
                className="qt-btn qt-btn-primary qt-btn-sm"
                onClick={addItem}
              >
                + Add Item
              </button>
            </div>

            {/* ── Catalog hint banner ── */}
            {products.length > 0 ? (
              <div
                style={{
                  background: "#fef3ec",
                  border: "1px solid #ffd7b5",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                💡{" "}
                <span>
                  <strong>{products.length} products</strong> in catalog — pick
                  from the <strong>dropdown</strong> to auto-fill HSN, unit
                  &amp; rate. Or type manually. <em>Stock is not reduced.</em>
                </span>
              </div>
            ) : (
              <div
                style={{
                  background: "#f6f8fa",
                  border: "1px solid #e1e8ed",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 12,
                  marginBottom: 12,
                  color: "#8c959f",
                }}
              >
                ℹ️ No products in catalog yet. Add products in{" "}
                <strong>Stock → Products</strong> to enable quick-fill.
              </div>
            )}

            <div style={{ overflowX: "auto" }}>
              <table className="qt-items-table">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th style={{ minWidth: 260 }}>Description</th>
                    <th style={{ width: 80 }}>HSN/SAC</th>
                    <th style={{ width: 105 }}>Due On</th>
                    <th style={{ width: 75 }}>Unit</th>
                    <th style={{ width: 70 }}>Qty</th>
                    <th style={{ width: 100 }}>Rate (₹)</th>
                    <th style={{ width: 110 }}>Amount (₹)</th>
                    <th style={{ width: 36 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {form.items.map((item, i) => (
                    <ItemRow
                      key={i}
                      item={item}
                      idx={i}
                      products={products}
                      onChange={handleItemChange}
                      onProductSelect={handleProductSelect}
                      onRemove={removeItem}
                      canRemove={form.items.length > 1}
                      units={UNITS}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 20,
              }}
            >
              <div
                style={{
                  minWidth: 280,
                  background: "#f6f8fa",
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                {[
                  ["Subtotal", inr(T.subtotal)],
                  T.discountAmt > 0
                    ? [
                        `Discount (${form.discount}%)`,
                        `- ${inr(T.discountAmt)}`,
                      ]
                    : null,
                  ["Taxable Value", inr(T.taxable)],
                  [`CGST (${Number(form.taxPercent) / 2}%)`, inr(T.cgst)],
                  [`SGST (${Number(form.taxPercent) / 2}%)`, inr(T.sgst)],
                  [
                    "Round Off",
                    T.roundOff >= 0
                      ? `+${inr(Math.abs(T.roundOff))}`
                      : `-${inr(Math.abs(T.roundOff))}`,
                  ],
                ]
                  .filter(Boolean)
                  .map(([l, v]) => (
                    <div
                      key={l}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 7,
                        fontSize: 13,
                      }}
                    >
                      <span>{l}</span>
                      <span style={{ fontFamily: "monospace" }}>{v}</span>
                    </div>
                  ))}
                <div
                  style={{ height: 1, background: "#d0d7de", margin: "10px 0" }}
                ></div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  <span>Grand Total</span>
                  <span style={{ color: "#bc4c00", fontFamily: "monospace" }}>
                    {inr(T.grandTotal)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="qt-card">
            <div className="qt-grid">
              <div className="span3">
                <label className="qt-label">Terms &amp; Notes</label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  className="qt-textarea"
                  rows={2}
                />
              </div>
              <div className="span3">
                <label className="qt-label">Declaration</label>
                <textarea
                  name="declaration"
                  value={form.declaration}
                  onChange={handleChange}
                  className="qt-textarea"
                  rows={2}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              marginBottom: 40,
            }}
          >
            <button type="submit" className="qt-btn qt-btn-primary">
              💾 {editId ? "Update" : "Save"} Quotation
            </button>
            <button
              type="button"
              className="qt-btn qt-btn-ghost"
              onClick={resetForm}
            >
              Reset
            </button>
          </div>
        </form>
      </div>
    );

  // ============================================================
  // RENDER: TABLE
  // ============================================================
  return (
    <div
      style={{
        width: "100%",
        padding: "0 24px",
        boxSizing: "border-box",
        fontFamily: "'Inter',system-ui,sans-serif",
        color: "#0f172a",
      }}
    >
      <style>{`
        .qt-tbl { width:100%; border-collapse:collapse; }
        .qt-tbl th { background:#f6f8fa; padding:11px 14px; text-align:left; font-size:12px; font-weight:600; border-bottom:1px solid #e1e8ed; }
        .qt-tbl td { padding:11px 14px; border-bottom:1px solid #f0f0f0; font-size:13px; vertical-align:middle; }
        .qt-tbl tbody tr:hover { background:#fafbfc; }
        .qt-abtn { padding:4px 10px; border-radius:6px; font-size:11px; font-weight:600; border:none; cursor:pointer; }
      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: "1px solid #e1e8ed",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>
          📋 Quotations
        </h2>
        <button
          onClick={() => {
            resetForm();
            setView("form");
          }}
          style={{
            padding: "9px 20px",
            background: "#bc4c00",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: 13,
          }}
        >
          + New Quotation
        </button>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input
          placeholder="Search by client name or quote no…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "8px 14px",
            border: "1px solid #d0d7de",
            borderRadius: 8,
            fontSize: 13,
            width: 300,
            boxSizing: "border-box",
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 0,
          background: "#fff",
          border: "1px solid #e1e8ed",
          borderRadius: "12px 12px 0 0",
          overflow: "hidden",
          marginBottom: 0,
        }}
      >
        {[
          ["Total Quotes", filtered.length, "#0f172a"],
          ["Total Subtotal", inr(summary.subtotal), "#0f172a"],
          ["Total Discount", inr(summary.discount), "#cf222e"],
          ["Total Revenue", inr(summary.revenue), "#bc4c00"],
        ].map(([l, v, c], i, arr) => (
          <div
            key={l}
            style={{
              flex: 1,
              padding: "12px 18px",
              borderRight: i < arr.length - 1 ? "1px solid #e1e8ed" : "none",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#8c959f",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              {l}
            </div>
            <div
              style={{ fontSize: 15, fontWeight: 700, marginTop: 3, color: c }}
            >
              {v}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          background: "#fff",
          border: "1px solid #e1e8ed",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "#8c959f" }}>
            Loading…
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="qt-tbl">
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
                    <td
                      style={{
                        fontWeight: 700,
                        color: "#bc4c00",
                        fontFamily: "monospace",
                      }}
                    >
                      {rec.quote_no}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{rec.client_name}</div>
                      {rec.client_phone && (
                        <div style={{ fontSize: 11, color: "#8c959f" }}>
                          {rec.client_phone}
                        </div>
                      )}
                    </td>
                    <td>{fmtDate(rec.quote_date)}</td>
                    <td>{rec.valid_until ? fmtDate(rec.valid_until) : "—"}</td>
                    <td>{rec.items_count || 0} items</td>
                    <td style={{ color: "#cf222e", fontFamily: "monospace" }}>
                      {inr(rec.discount_amount)}
                    </td>
                    <td style={{ fontFamily: "monospace" }}>
                      {inr(rec.tax_amount)}
                    </td>
                    <td
                      style={{
                        color: "#bc4c00",
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      {inr(rec.grand_total)}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          justifyContent: "flex-end",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          className="qt-abtn"
                          style={{ background: "#eef2ff", color: "#1d4ed8" }}
                          onClick={() => handleViewBill(rec)}
                        >
                          👁 View
                        </button>
                        <button
                          className="qt-abtn"
                          style={{ background: "#fef3c7", color: "#b45309" }}
                          onClick={() => handleEdit(rec)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="qt-abtn"
                          style={{ background: "#dcfce7", color: "#15803d" }}
                          onClick={() => handleViewBill(rec)}
                        >
                          🖨️ Print
                        </button>
                        <button
                          className="qt-abtn"
                          style={{ background: "#fee2e2", color: "#b91c1c" }}
                          onClick={() => setDeleteId(rec.id)}
                        >
                          🗑 Del
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      style={{
                        textAlign: "center",
                        padding: 40,
                        color: "#8c959f",
                      }}
                    >
                      No quotations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setDeleteId(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: 28,
              maxWidth: 380,
              textAlign: "center",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: "2rem", marginBottom: 8 }}>🗑️</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              Delete Quotation?
            </div>
            <div style={{ color: "#57606a", margin: "8px 0 20px" }}>
              This action cannot be undone.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={() => setDeleteId(null)}
                style={{
                  padding: "8px 18px",
                  border: "1px solid #d0d7de",
                  borderRadius: 8,
                  background: "#f6f8fa",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                style={{
                  padding: "8px 18px",
                  border: "none",
                  borderRadius: 8,
                  background: "#cf222e",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ItemRow — dropdown (catalog) + free-text input side by side
// Selecting from dropdown auto-fills HSN, unit, rate.
// Typing manually overrides. NO stock reduction.
// ============================================================
function ItemRow({
  item,
  idx,
  products,
  onChange,
  onProductSelect,
  onRemove,
  canRemove,
  units,
}) {
  // Is the current description an exact catalog match?
  const isMatched = products.some((p) => p.product_name === item.description);

  const handleDropdown = (e) => {
    const name = e.target.value;
    if (!name) {
      // Cleared dropdown — reset row description only
      onChange(idx, "description", "");
      onProductSelect(idx, "");
    } else {
      onProductSelect(idx, name); // auto-fills desc + hsn + unit + rate
    }
  };

  const handleManual = (e) => {
    const v = e.target.value;
    onChange(idx, "description", v);
    // If text no longer matches any product, clear dropdown highlight
    if (!products.some((p) => p.product_name === v)) {
      // description is already updated; no extra action needed
    }
  };

  return (
    <tr>
      <td style={{ textAlign: "center", fontSize: 13 }}>{idx + 1}</td>

      {/* ── Description cell: dropdown + text input ── */}
      <td>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* Catalog dropdown */}
          {products.length > 0 && (
            <select
              className="qt-select"
              value={isMatched ? item.description : ""}
              onChange={handleDropdown}
              style={{ fontSize: 12, color: isMatched ? "#0f172a" : "#8c959f" }}
            >
              <option value="">— Select from catalog —</option>
              {products.map((p) => (
                <option key={p.id} value={p.product_name}>
                  {p.product_name}
                  {p.selling_price
                    ? `  ₹${parseFloat(p.selling_price).toFixed(2)}`
                    : ""}
                  {p.stock_qty != null ? `  (Stock: ${p.stock_qty})` : ""}
                </option>
              ))}
            </select>
          )}
          {/* Free-text input — always visible for manual entry / override */}
          <input
            className="qt-input"
            value={item.description}
            onChange={handleManual}
            placeholder={
              products.length > 0
                ? "Or type custom description…"
                : "Product / Service"
            }
            style={{ fontSize: 12 }}
          />
        </div>
      </td>

      <td>
        <input
          className="qt-input"
          value={item.hsn}
          onChange={(e) => onChange(idx, "hsn", e.target.value)}
          placeholder="HSN"
          style={{ fontSize: 12 }}
        />
      </td>
      <td>
        <input
          type="date"
          className="qt-input"
          value={item.dueOn}
          onChange={(e) => onChange(idx, "dueOn", e.target.value)}
          style={{ fontSize: 12 }}
        />
      </td>
      <td>
        <select
          className="qt-select"
          value={item.unit}
          onChange={(e) => onChange(idx, "unit", e.target.value)}
          style={{ fontSize: 12 }}
        >
          {units.map((u) => (
            <option key={u}>{u}</option>
          ))}
        </select>
      </td>
      <td>
        <input
          type="number"
          className="qt-input"
          value={item.qty}
          min="0"
          step="any"
          onChange={(e) =>
            onChange(idx, "qty", parseFloat(e.target.value) || 0)
          }
          style={{ fontSize: 12 }}
        />
      </td>
      <td>
        <input
          type="number"
          className="qt-input"
          value={item.rate}
          min="0"
          step="any"
          onChange={(e) =>
            onChange(idx, "rate", parseFloat(e.target.value) || 0)
          }
          style={{ fontSize: 12 }}
        />
      </td>
      <td
        style={{
          fontFamily: "monospace",
          fontWeight: 600,
          textAlign: "right",
          fontSize: 13,
        }}
      >
        ₹{" "}
        {((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toFixed(
          2,
        )}
      </td>
      <td>
        {canRemove && (
          <button
            type="button"
            onClick={() => onRemove(idx)}
            style={{
              background: "none",
              border: "none",
              color: "#cf222e",
              cursor: "pointer",
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            🗑
          </button>
        )}
      </td>
    </tr>
  );
}
