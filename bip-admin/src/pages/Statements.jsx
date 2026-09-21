// =============================================================
//  Statements.jsx — bank-statement style reports (read-only)
//  Customer · Payment · Sales · Purchase · Product · Inventory
//  From → To → View → Download PDF / Download Excel / Print / WhatsApp
//  All data comes from backend/statements.php (existing records only).
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import * as XLSX from "xlsx";
import { apiFetch } from "../utils/api";
import { branchLabel } from "../utils/branchNames";

// adds doc.autoTable() (works with every bundler build of the plugin)
applyPlugin(jsPDF);

// ── Types ────────────────────────────────────────────────────
const TYPES = [
  {
    key: "customer",
    label: "Customer",
    icon: "bi-person-vcard",
    needs: "customer",
  },
  { key: "payment", label: "Payment", icon: "bi-cash-coin" },
  { key: "sales", label: "Sales", icon: "bi-receipt" },
  { key: "purchase", label: "Purchase", icon: "bi-bag-check" },
  { key: "product", label: "Product", icon: "bi-box-seam", needs: "product" },
  { key: "inventory", label: "Inventory", icon: "bi-boxes" },
];

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "custom", label: "Custom" },
];

// ── Date helpers (local dates, YYYY-MM-DD) ───────────────────
const pad = (n) => String(n).padStart(2, "0");
const iso = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseIso = (s) => {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
const dmy = (s) =>
  s ? String(s).slice(0, 10).split("-").reverse().join("-") : "";

function periodRange(period, anchorIso) {
  const a = parseIso(anchorIso);
  if (period === "daily") return [iso(a), iso(a)];
  if (period === "weekly") {
    const day = (a.getDay() + 6) % 7; // Monday = 0
    const s = new Date(a);
    s.setDate(a.getDate() - day);
    const e = new Date(s);
    e.setDate(s.getDate() + 6);
    return [iso(s), iso(e)];
  }
  if (period === "monthly") {
    return [
      iso(new Date(a.getFullYear(), a.getMonth(), 1)),
      iso(new Date(a.getFullYear(), a.getMonth() + 1, 0)),
    ];
  }
  if (period === "yearly") {
    return [
      iso(new Date(a.getFullYear(), 0, 1)),
      iso(new Date(a.getFullYear(), 11, 31)),
    ];
  }
  return null;
}
function shiftAnchor(period, anchorIso, dir) {
  const a = parseIso(anchorIso);
  if (period === "daily") a.setDate(a.getDate() + dir);
  if (period === "weekly") a.setDate(a.getDate() + 7 * dir);
  if (period === "monthly") a.setMonth(a.getMonth() + dir);
  if (period === "yearly") a.setFullYear(a.getFullYear() + dir);
  return iso(a);
}
function periodTitle(period, from, to) {
  const f = parseIso(from);
  if (period === "monthly")
    return f.toLocaleString("en-IN", { month: "long", year: "numeric" });
  if (period === "yearly") return String(f.getFullYear());
  if (period === "daily") return dmy(from);
  return `${dmy(from)} to ${dmy(to)}`;
}

// ── Number helpers ───────────────────────────────────────────
const money = (n, sym = "₹") =>
  `${Number(n) < 0 ? "-" : ""}${sym}${Math.abs(Number(n) || 0).toLocaleString(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
const qty = (n) =>
  (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 3 });
const blankIfZero = (n, f) => (Number(n) ? f(n) : "-");

// ── Column definitions per statement ─────────────────────────
//  kind: date | text | money | moneyz (blank if 0) | qty | qtyz
const COLUMNS = {
  customer: [
    { key: "date", label: "Date", kind: "date" },
    { key: "particulars", label: "Particulars", kind: "text" },
    { key: "reference", label: "Reference", kind: "text" },
    { key: "payment_date", label: "Payment Date", kind: "date" },
    { key: "debit", label: "Debit", kind: "moneyz" },
    { key: "credit", label: "Credit", kind: "moneyz" },
    { key: "balance", label: "Balance", kind: "money" },
  ],
  payment: [
    { key: "date", label: "Date", kind: "date" },
    { key: "particulars", label: "Particulars", kind: "text" },
    { key: "party", label: "Customer / Party", kind: "text" },
    { key: "reference", label: "Reference", kind: "text" },
    { key: "method", label: "Method", kind: "text" },
    { key: "received", label: "Received", kind: "moneyz" },
    { key: "paid_out", label: "Paid Out", kind: "moneyz" },
    { key: "balance", label: "Net Balance", kind: "money" },
  ],
  sales: [
    { key: "date", label: "Date", kind: "date" },
    { key: "reference", label: "Invoice No", kind: "text" },
    { key: "party", label: "Customer", kind: "text" },
    { key: "products", label: "Product", kind: "text" },
    { key: "qty", label: "Qty", kind: "qty" },
    { key: "amount", label: "Amount", kind: "money" },
    { key: "gst", label: "GST", kind: "moneyz" },
    { key: "round_off", label: "Round Off", kind: "moneyz" },
    { key: "total", label: "Total", kind: "money" },
    { key: "paid", label: "Paid", kind: "moneyz" },
    { key: "bill_balance", label: "Bill Balance", kind: "money" },
    { key: "balance", label: "Running Balance", kind: "money" },
  ],
  purchase: [
    { key: "date", label: "Date", kind: "date" },
    { key: "reference", label: "Bill No", kind: "text" },
    { key: "party", label: "Supplier / Party", kind: "text" },
    { key: "products", label: "Product", kind: "text" },
    { key: "qty", label: "Qty", kind: "qty" },
    { key: "amount", label: "Amount", kind: "money" },
    { key: "gst", label: "GST", kind: "moneyz" },
    { key: "round_off", label: "Round Off", kind: "moneyz" },
    { key: "total", label: "Total", kind: "money" },
    { key: "paid", label: "Paid", kind: "moneyz" },
    { key: "bill_balance", label: "Bill Balance", kind: "money" },
    { key: "balance", label: "Running Payable", kind: "money" },
  ],
  product: [
    { key: "date", label: "Date", kind: "date" },
    { key: "particulars", label: "Type", kind: "text" },
    { key: "reference", label: "Reference", kind: "text" },
    { key: "party", label: "Party", kind: "text" },
    { key: "qty_in", label: "In", kind: "qtyz" },
    { key: "qty_out", label: "Out", kind: "qtyz" },
    { key: "balance", label: "Balance", kind: "qty" },
  ],
  inventory: [
    { key: "date", label: "Date", kind: "date" },
    { key: "product", label: "Product", kind: "text" },
    { key: "particulars", label: "Type", kind: "text" },
    { key: "reference", label: "Reference", kind: "text" },
    { key: "qty_in", label: "Stock In", kind: "qtyz" },
    { key: "qty_out", label: "Stock Out", kind: "qtyz" },
    { key: "balance", label: "Balance", kind: "qty" },
  ],
};

const isMoney = (k) => k === "money" || k === "moneyz";
const isQty = (k) => k === "qty" || k === "qtyz";

function cellText(row, col, sym = "₹") {
  const v = row[col.key];
  if (col.kind === "date") return dmy(v) || "-";
  if (col.kind === "money") return money(v, sym);
  if (col.kind === "moneyz") return blankIfZero(v, (n) => money(n, sym));
  if (col.kind === "qty") return qty(v);
  if (col.kind === "qtyz") return blankIfZero(v, qty);
  return v === null || v === undefined || v === "" ? "-" : String(v);
}

// Summary cards shown above the table (and in PDF / WhatsApp)
function summaryItems(type, d) {
  if (!d) return [];
  const t = d.totals || {};
  switch (type) {
    case "customer":
      return [
        ["Opening Balance", money(d.opening)],
        ["Total Invoice Amount", money(t.total_invoice)],
        ["Total Paid Amount", money(t.total_paid)],
        ...(t.total_purchase
          ? [["Purchase Bills (from party)", money(t.total_purchase)]]
          : []),
        ...(t.total_paid_out
          ? [["Paid to Party", money(t.total_paid_out)]]
          : []),
        [
          "Closing Balance",
          `${money(d.closing)}${d.closing < 0 ? " (You Owe)" : ""}`,
        ],
      ];
    case "payment":
      return [
        ["Opening Net", money(d.opening)],
        ["Total Received", money(t.total_received)],
        ["Total Paid Out", money(t.total_paid_out)],
        ["Net for Period", money(t.net)],
        ["Closing Net", money(d.closing)],
      ];
    case "sales":
      return [
        ["Invoices", String(t.invoices || 0)],
        ["Total Invoice Amount", money(t.total)],
        ["GST", money(t.gst)],
        ["Total Paid Amount", money(t.paid)],
        ["Total Outstanding", money(t.outstanding)],
        ["Closing Balance", money(d.closing)],
      ];
    case "purchase":
      return [
        ["Bills", String(t.bills || 0)],
        ["Total Purchase Amount", money(t.total)],
        ["GST", money(t.gst)],
        ["Total Paid", money(t.paid)],
        ["Total Outstanding", money(t.outstanding)],
        ["Closing Payable", money(d.closing)],
      ];
    case "product":
      return [
        ["Opening Stock", qty(d.opening)],
        ["Stock In", qty(t.qty_in)],
        ["Stock Out", qty(t.qty_out)],
        ["Closing Stock", qty(d.closing)],
        ...(d.current_stock !== null && d.current_stock !== undefined
          ? [["Current Stock (Inventory)", qty(d.current_stock)]]
          : []),
        ...(d.product_stock !== null && d.product_stock !== undefined
          ? [["Current Stock (Products)", qty(d.product_stock)]]
          : []),
      ];
    case "inventory":
      return [
        ["Products", String((d.summary || []).length)],
        ["Total Stock In", qty(t.qty_in)],
        ["Total Stock Out", qty(t.qty_out)],
      ];
    default:
      return [];
  }
}

// Whether the table gets Opening / Closing rows
const hasLedgerRows = (type) =>
  ["customer", "payment", "sales", "purchase", "product"].includes(type);

const TITLES = {
  customer: "Customer Statement",
  payment: "Payment Statement",
  sales: "Sales Statement",
  purchase: "Purchase Statement",
  product: "Product Statement",
  inventory: "Inventory Statement",
};

export default function Statements() {
  const [params] = useSearchParams();
  const today = iso(new Date());

  const [type, setType] = useState(params.get("type") || "customer");
  const [period, setPeriod] = useState("monthly");
  const [anchor, setAnchor] = useState(today);
  const [from, setFrom] = useState(periodRange("monthly", today)[0]);
  const [to, setTo] = useState(periodRange("monthly", today)[1]);
  const [clientId, setClientId] = useState(params.get("client_id") || "");
  const [product, setProduct] = useState(params.get("product") || "");
  const [search, setSearch] = useState("");

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const typeInfo = TYPES.find((t) => t.key === type) || TYPES[0];
  const columns = COLUMNS[type];
  const branchName =
    localStorage.getItem("role") === "admin"
      ? localStorage.getItem("admin_view_branch")
        ? branchLabel(localStorage.getItem("admin_view_branch"))
        : "All Branches"
      : "";

  // Pickers
  useEffect(() => {
    (async () => {
      try {
        const [c, p] = await Promise.all([
          apiFetch("/statements.php?type=customers").then((r) => r.json()),
          apiFetch("/statements.php?type=products").then((r) => r.json()),
        ]);
        if (c.success) setCustomers(c.customers || []);
        if (p.success) setProducts(p.products || []);
      } catch {
        /* pickers stay empty */
      }
    })();
  }, []);

  // Quick period → dates
  const applyPeriod = (p, a = anchor) => {
    setPeriod(p);
    const r = periodRange(p, a);
    if (r) {
      setFrom(r[0]);
      setTo(r[1]);
    }
  };
  const shift = (dir) => {
    const a = shiftAnchor(period, anchor, dir);
    setAnchor(a);
    applyPeriod(period, a);
  };

  const canView =
    from &&
    to &&
    from <= to &&
    (typeInfo.needs !== "customer" || clientId) &&
    (typeInfo.needs !== "product" || product);

  const loadStatement = async () => {
    if (!canView) return;
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ type, from, to });
      if (type === "customer" || (type === "payment" && clientId))
        q.set("client_id", clientId);
      if (type === "product") q.set("product", product);
      const res = await apiFetch(`/statements.php?${q.toString()}`);
      const d = await res.json();
      if (d.success) setData(d);
      else {
        setData(null);
        setError(d.message || "Could not load the statement");
      }
    } catch {
      setData(null);
      setError("Server error while loading the statement");
    } finally {
      setLoading(false);
    }
  };

  // Auto-load when opened from a Customer / Product "Statement" button
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (params.get("type") && canView) loadStatement();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Search (display + exports use the same filtered rows)
  const rows = useMemo(() => {
    const list = data?.rows || [];
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((r) =>
      columns.some((c) => cellText(r, c).toLowerCase().includes(q)),
    );
  }, [data, search, columns]);

  const summary = summaryItems(type, data);
  const customer = data?.customer;
  const subject =
    type === "customer"
      ? customer?.name
      : type === "product"
        ? data?.product
        : "";
  const periodText = `${dmy(from)} to ${dmy(to)}`;

  // Rows including Opening / Closing lines (for the table and the files)
  const ledgerRows = useMemo(() => {
    if (!data) return [];
    if (!hasLedgerRows(type)) return rows;
    const blank = Object.fromEntries(columns.map((c) => [c.key, ""]));
    const opening = {
      ...blank,
      date: from,
      particulars: "Opening Balance",
      reference: "",
      balance: data.opening,
      _special: "open",
    };
    const closing = {
      ...blank,
      date: to,
      particulars: "Closing Balance",
      reference: "",
      balance: data.closing,
      _special: "close",
    };
    if (type === "sales" || type === "purchase") {
      opening.reference = "Opening Balance";
      closing.reference = "Closing Balance";
    }
    return [opening, ...rows, closing];
  }, [data, rows, type, columns, from, to]);

  // ── PDF ────────────────────────────────────────────────────
  const buildPdf = () => {
    const wide = columns.length > 8;
    const doc = new jsPDF({
      orientation: wide ? "landscape" : "portrait",
      unit: "pt",
      format: "a4",
    });
    const W = doc.internal.pageSize.getWidth();
    let y = 40;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("BIP FENCING", 40, y);
    doc.setFontSize(13);
    doc.text(TITLES[type], W - 40, y, { align: "right" });
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Period: ${periodText}`, W - 40, y, { align: "right" });
    if (branchName) doc.text(`Branch: ${branchName}`, 40, y);
    y += 14;
    doc.text(`Generated: ${dmy(today)}`, W - 40, y, { align: "right" });

    if (type === "customer" && customer) {
      doc.setFont("helvetica", "bold");
      doc.text(`Customer: ${customer.name}`, 40, y);
      doc.setFont("helvetica", "normal");
      y += 14;
      if (customer.phone) {
        doc.text(`Phone: ${customer.phone}`, 40, y);
        y += 14;
      }
      if (customer.address) {
        doc.text(`Address: ${customer.address}`, 40, y);
        y += 14;
      }
      if (customer.gst) {
        doc.text(`GST: ${customer.gst}`, 40, y);
        y += 14;
      }
    } else if (type === "product" && data?.product) {
      doc.setFont("helvetica", "bold");
      doc.text(`Product: ${data.product}`, 40, y);
      doc.setFont("helvetica", "normal");
      y += 14;
    } else {
      y += 14;
    }
    y += 6;

    // summary box
    const sum = summaryItems(type, data).map(([k, v]) => [
      k,
      v.replace(/₹/g, "Rs. "),
    ]);
    doc.autoTable({
      startY: y,
      body: sum,
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 170 },
        1: { halign: "right", cellWidth: 130 },
      },
      margin: { left: 40 },
      tableWidth: 300,
    });
    y = doc.lastAutoTable.finalY + 12;

    doc.autoTable({
      startY: y,
      head: [columns.map((c) => c.label)],
      body: ledgerRows.map((r) =>
        columns.map((c) =>
          r._special &&
          c.kind !== "text" &&
          c.kind !== "date" &&
          c.key !== "balance"
            ? ""
            : cellText(r, c, "Rs. "),
        ),
      ),
      theme: "grid",
      styles: {
        fontSize: wide ? 7.5 : 8.5,
        cellPadding: 4,
        overflow: "linebreak",
      },
      headStyles: {
        fillColor: [0, 139, 62],
        textColor: 255,
        fontStyle: "bold",
      },
      columnStyles: Object.fromEntries(
        columns.map((c, i) => [
          i,
          isMoney(c.kind) || isQty(c.kind) ? { halign: "right" } : {},
        ]),
      ),
      didParseCell: (h) => {
        const r = ledgerRows[h.row.index];
        if (h.section === "body" && r?._special) {
          h.cell.styles.fontStyle = "bold";
          h.cell.styles.fillColor = [236, 253, 245];
        }
      },
      margin: { left: 40, right: 40 },
    });

    // inventory: product-wise summary
    if (type === "inventory" && data?.summary?.length) {
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 16,
        head: [["Product", "Opening", "In", "Out", "Closing", "Current Stock"]],
        body: data.summary.map((s) => [
          s.product,
          qty(s.opening),
          qty(s.qty_in),
          qty(s.qty_out),
          qty(s.closing),
          s.current_stock !== null && s.current_stock !== undefined
            ? qty(s.current_stock)
            : "-",
        ]),
        theme: "grid",
        styles: { fontSize: 8.5 },
        headStyles: { fillColor: [30, 41, 59], textColor: 255 },
        margin: { left: 40, right: 40 },
      });
    }

    const pages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(120);
      doc.text(
        `Page ${i} of ${pages}`,
        W - 40,
        doc.internal.pageSize.getHeight() - 20,
        { align: "right" },
      );
      doc.text(
        "Computer generated statement",
        40,
        doc.internal.pageSize.getHeight() - 20,
      );
    }
    return doc;
  };

  const fileBase = () =>
    `${TITLES[type].replace(/\s+/g, "_")}${subject ? "_" + String(subject).replace(/[^a-z0-9]+/gi, "_") : ""}_${from}_to_${to}`;

  const downloadPdf = () => buildPdf().save(`${fileBase()}.pdf`);

  const printStatement = () => {
    const doc = buildPdf();
    doc.autoPrint();
    window.open(doc.output("bloburl"), "_blank");
  };

  // ── Excel ──────────────────────────────────────────────────
  const downloadExcel = () => {
    const header = [
      ["BIP FENCING"],
      [TITLES[type]],
      ...(subject
        ? [
            [
              type === "customer"
                ? `Customer: ${subject}`
                : `Product: ${subject}`,
            ],
          ]
        : []),
      ...(type === "customer" && customer?.phone
        ? [[`Phone: ${customer.phone}`]]
        : []),
      [`Period: ${periodText}`],
      ...(branchName ? [[`Branch: ${branchName}`]] : []),
      [],
      ...summaryItems(type, data).map(([k, v]) => [k, v]),
      [],
    ];
    const tableHead = columns.map((c) => c.label);
    const body = ledgerRows.map((r) =>
      columns.map((c) => {
        const v = r[c.key];
        if (
          r._special &&
          c.key !== "balance" &&
          c.kind !== "text" &&
          c.kind !== "date"
        )
          return "";
        if (c.kind === "date") return dmy(v);
        if (isMoney(c.kind) || isQty(c.kind))
          return v === "" || v === null || v === undefined
            ? ""
            : Number(v) || 0;
        return v ?? "";
      }),
    );
    const ws = XLSX.utils.aoa_to_sheet([...header, tableHead, ...body]);
    ws["!cols"] = columns.map((c) => ({ wch: c.kind === "text" ? 28 : 14 }));
    // filter buttons on the transaction table
    const headRow = header.length;
    ws["!autofilter"] = {
      ref: XLSX.utils.encode_range({
        s: { r: headRow, c: 0 },
        e: { r: headRow + body.length, c: columns.length - 1 },
      }),
    };
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Statement");

    if (type === "inventory" && data?.summary?.length) {
      const ws2 = XLSX.utils.aoa_to_sheet([
        ["Product", "Opening", "In", "Out", "Closing", "Current Stock"],
        ...data.summary.map((s) => [
          s.product,
          s.opening,
          s.qty_in,
          s.qty_out,
          s.closing,
          s.current_stock ?? "",
        ]),
      ]);
      XLSX.utils.book_append_sheet(wb, ws2, "Product Summary");
    }
    XLSX.writeFile(wb, `${fileBase()}.xlsx`);
  };

  // ── WhatsApp (full detailed statement) ─────────────────────
  const whatsappText = () => {
    const L = [];
    L.push(`*BIP FENCING — ${TITLES[type]}*`);
    if (type === "customer" && customer) {
      L.push(`Customer: ${customer.name}`);
      if (customer.phone) L.push(`Phone: ${customer.phone}`);
    }
    if (type === "product" && data?.product) L.push(`Product: ${data.product}`);
    if (branchName) L.push(`Branch: ${branchName}`);
    L.push(`Statement Period: ${periodText}`);
    L.push("");

    if (type === "customer") {
      L.push(`${dmy(from)} – Opening Balance – ${money(data.opening)}`);
      // merge an invoice with its "paid on invoice" line
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const next = rows[i + 1];
        if (
          r.kind === "invoice" &&
          next &&
          next.kind === "payment" &&
          next.reference === r.reference &&
          next.date === r.date
        ) {
          L.push(
            `${dmy(r.date)} – ${r.reference} – ${money(r.debit)} – Paid ${money(next.credit)} (${dmy(next.payment_date)}) – Balance ${money(next.balance)}`,
          );
          i++;
        } else if (r.kind === "invoice") {
          L.push(
            `${dmy(r.date)} – ${r.reference} – ${money(r.debit)} – Balance ${money(r.balance)}`,
          );
        } else if (r.kind === "payment") {
          L.push(
            `${dmy(r.date)} – ${r.particulars} (${r.reference}) – ${money(r.credit)} – Balance ${money(r.balance)}`,
          );
        } else {
          const amt = r.debit ? money(r.debit) : money(r.credit);
          L.push(
            `${dmy(r.date)} – ${r.particulars} (${r.reference}) – ${amt} – Balance ${money(r.balance)}`,
          );
        }
      }
    } else if (type === "payment") {
      rows.forEach((r) =>
        L.push(
          `${dmy(r.date)} – ${r.particulars} – ${r.party || "-"} – ${r.reference} – ${r.received ? "Received " + money(r.received) : "Paid " + money(r.paid_out)}`,
        ),
      );
    } else if (type === "sales" || type === "purchase") {
      rows.forEach((r) =>
        L.push(
          `${dmy(r.date)} – ${r.reference} – ${r.party || "-"} – ${money(r.total)} – Paid ${money(r.paid)} – Balance ${money(r.bill_balance)}`,
        ),
      );
    } else {
      rows.forEach((r) =>
        L.push(
          `${dmy(r.date)} – ${type === "inventory" ? r.product + " – " : ""}${r.particulars} – ${r.reference}${r.qty_in ? " – In " + qty(r.qty_in) : ""}${r.qty_out ? " – Out " + qty(r.qty_out) : ""} – Balance ${qty(r.balance)}`,
        ),
      );
    }
    if (!rows.length) L.push("No transactions in this period.");

    L.push("");
    summaryItems(type, data).forEach(([k, v]) => L.push(`${k}: ${v}`));
    if (type === "customer") L.push(`Outstanding: ${money(data.closing)}`);
    return L.join("\n");
  };

  const sendWhatsApp = () => {
    const text = encodeURIComponent(whatsappText());
    const digits = String(customer?.phone || "")
      .replace(/\D/g, "")
      .slice(-10);
    const url =
      type === "customer" && digits.length === 10
        ? `https://wa.me/91${digits}?text=${text}`
        : `https://wa.me/?text=${text}`;
    window.open(url, "_blank");
  };

  // ── UI ─────────────────────────────────────────────────────
  return (
    <div className="st-page">
      <style>{CSS}</style>

      <div className="st-header">
        <div className="st-header__icon">
          <i className="bi bi-journal-text"></i>
        </div>
        <div>
          <h1>Statements</h1>
          <p>
            Bank-statement style reports from your invoices, bills, payments and
            stock
          </p>
        </div>
      </div>

      {/* Statement type */}
      <div className="st-types">
        {TYPES.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`st-type${type === t.key ? " active" : ""}`}
            onClick={() => {
              // clear the old result when switching statement type
              setType(t.key);
              setData(null);
              setError("");
            }}
          >
            <i className={`bi ${t.icon}`}></i> {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="st-card">
        <div className="st-filters">
          {(type === "customer" || type === "payment") && (
            <div className="st-fg st-fg--wide">
              <label>Customer{type === "payment" ? " (optional)" : ""}</label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              >
                <option value="">
                  {type === "payment" ? "All customers" : "— Select customer —"}
                </option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.phone ? ` (${c.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}
          {type === "product" && (
            <div className="st-fg st-fg--wide">
              <label>Product</label>
              <select
                value={product}
                onChange={(e) => setProduct(e.target.value)}
              >
                <option value="">— Select product —</option>
                {products.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="st-fg">
            <label>From Date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPeriod("custom");
              }}
            />
          </div>
          <div className="st-fg">
            <label>To Date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPeriod("custom");
              }}
            />
          </div>
          <div className="st-fg st-fg--btn">
            <button
              type="button"
              className="st-btn st-btn--primary"
              disabled={!canView || loading}
              onClick={loadStatement}
            >
              <i className="bi bi-search"></i>{" "}
              {loading ? "Loading…" : "View Statement"}
            </button>
          </div>
        </div>

        <div className="st-periods">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`st-chip${period === p.key ? " active" : ""}`}
              onClick={() => applyPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
          {period !== "custom" && (
            <span className="st-shift">
              <button
                type="button"
                onClick={() => shift(-1)}
                aria-label="Previous period"
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <b>{periodTitle(period, from, to)}</b>
              <button
                type="button"
                onClick={() => shift(1)}
                aria-label="Next period"
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </span>
          )}
        </div>
        {from > to && (
          <div className="st-error">From Date must be before To Date.</div>
        )}
      </div>

      {error && <div className="st-error st-error--box">{error}</div>}

      {data && (
        <div className="st-card st-statement">
          {/* Statement head */}
          <div className="st-shead">
            <div>
              <div className="st-shead__title">{TITLES[type]}</div>
              {subject && <div className="st-shead__subject">{subject}</div>}
              {type === "customer" && customer?.phone && (
                <div className="st-muted">Phone: {customer.phone}</div>
              )}
              {branchName && (
                <div className="st-muted">Branch: {branchName}</div>
              )}
            </div>
            <div className="st-shead__period">
              <span>Period</span>
              <b>{periodText}</b>
            </div>
          </div>

          <div className="st-summary">
            {summary.map(([k, v]) => (
              <div key={k} className="st-sum">
                <span>{k}</span>
                <b>{v}</b>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="st-actions">
            <div className="st-search">
              <i className="bi bi-search"></i>
              <input
                placeholder="Search in statement"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="st-actions__btns">
              <button type="button" className="st-btn" onClick={printStatement}>
                <i className="bi bi-printer"></i> Print
              </button>
              <button
                type="button"
                className="st-btn st-btn--pdf"
                onClick={downloadPdf}
              >
                <i className="bi bi-file-earmark-pdf"></i> Download PDF
              </button>
              <button
                type="button"
                className="st-btn st-btn--xls"
                onClick={downloadExcel}
              >
                <i className="bi bi-file-earmark-excel"></i> Download Excel
              </button>
              <button
                type="button"
                className="st-btn st-btn--wa"
                onClick={sendWhatsApp}
              >
                <i className="bi bi-whatsapp"></i> Send via WhatsApp
              </button>
            </div>
          </div>

          {/* Bank-statement table */}
          <div className="st-table-wrap">
            <table className="st-table">
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th
                      key={c.key}
                      className={isMoney(c.kind) || isQty(c.kind) ? "num" : ""}
                    >
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((r, i) => (
                  <tr
                    key={i}
                    className={
                      r._special
                        ? "st-special"
                        : r.debit && !r.credit
                          ? "st-dr"
                          : r.credit && !r.debit
                            ? "st-cr"
                            : ""
                    }
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className={
                          isMoney(c.kind) || isQty(c.kind) ? "num" : ""
                        }
                      >
                        {r._special &&
                        c.key !== "balance" &&
                        c.kind !== "text" &&
                        c.kind !== "date"
                          ? ""
                          : cellText(r, c)}
                      </td>
                    ))}
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={columns.length} className="st-empty">
                      No transactions in this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Inventory: product-wise summary */}
          {type === "inventory" && data.summary?.length > 0 && (
            <>
              <div className="st-subtitle">Product-wise Summary</div>
              <div className="st-table-wrap">
                <table className="st-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="num">Opening</th>
                      <th className="num">In</th>
                      <th className="num">Out</th>
                      <th className="num">Closing</th>
                      <th className="num">Current Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.summary.map((s) => (
                      <tr key={s.product}>
                        <td>{s.product}</td>
                        <td className="num">{qty(s.opening)}</td>
                        <td className="num">{qty(s.qty_in)}</td>
                        <td className="num">{qty(s.qty_out)}</td>
                        <td className="num">
                          <b>{qty(s.closing)}</b>
                        </td>
                        <td className="num">
                          {s.current_stock !== null &&
                          s.current_stock !== undefined
                            ? qty(s.current_stock)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {type === "customer" && (
            <div className="st-note">
              Debit increases what the customer owes; Credit reduces it. A
              negative balance means you owe the customer.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const CSS = `
.st-page { padding: 24px; max-width: 1400px; margin: 0 auto; font-family: inherit; }
.st-header { display: flex; align-items: center; gap: 14px; margin-bottom: 18px; }
.st-header__icon { width: 48px; height: 48px; border-radius: 12px; background: #008b3e; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.st-header h1 { margin: 0; font-size: 22px; font-weight: 800; color: #0f172a; }
.st-header p { margin: 2px 0 0; color: #64748b; font-size: 13px; }
.st-types { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 14px; }
.st-type { border: 1px solid #cbd5e1; background: #fff; border-radius: 10px; padding: 9px 16px; font-weight: 700; font-size: 13px; color: #334155; cursor: pointer; }
.st-type.active { background: #008b3e; border-color: #008b3e; color: #fff; }
.st-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 16px; box-shadow: 0 1px 2px rgba(0,0,0,.03); }
.st-filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
.st-fg { display: flex; flex-direction: column; gap: 5px; min-width: 150px; }
.st-fg--wide { flex: 1 1 260px; }
.st-fg label { font-size: 12px; font-weight: 700; color: #475569; }
.st-fg input, .st-fg select { height: 38px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 10px; font-size: 14px; background: #f8fafc; }
.st-fg--btn { min-width: auto; }
.st-periods { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 14px; }
.st-chip { border: 1px solid #cbd5e1; background: #fff; border-radius: 999px; padding: 5px 14px; font-size: 12.5px; font-weight: 700; color: #475569; cursor: pointer; }
.st-chip.active { background: #ecfdf5; border-color: #008b3e; color: #047857; }
.st-shift { display: inline-flex; align-items: center; gap: 8px; margin-left: 6px; font-size: 13px; color: #0f172a; }
.st-shift button { border: 1px solid #cbd5e1; background: #fff; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; }
.st-btn { border: 1px solid #cbd5e1; background: #fff; border-radius: 9px; padding: 9px 14px; font-size: 13px; font-weight: 700; color: #334155; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.st-btn:disabled { opacity: .55; cursor: not-allowed; }
.st-btn--primary { background: #008b3e; border-color: #008b3e; color: #fff; height: 38px; }
.st-btn--pdf { color: #b91c1c; border-color: #fecaca; }
.st-btn--xls { color: #047857; border-color: #a7f3d0; }
.st-btn--wa { background: #25d366; border-color: #25d366; color: #fff; }
.st-error { color: #b91c1c; font-size: 13px; margin-top: 8px; }
.st-error--box { background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; }
.st-shead { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; border-bottom: 2px solid #008b3e; padding-bottom: 12px; margin-bottom: 14px; }
.st-shead__title { font-size: 18px; font-weight: 800; color: #0f172a; }
.st-shead__subject { font-size: 15px; font-weight: 700; color: #008b3e; margin-top: 2px; }
.st-shead__period { text-align: right; }
.st-shead__period span { display: block; font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; }
.st-shead__period b { font-size: 15px; color: #0f172a; }
.st-muted { color: #64748b; font-size: 12.5px; }
.st-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px; margin-bottom: 14px; }
.st-sum { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 12px; }
.st-sum span { display: block; font-size: 11.5px; color: #64748b; font-weight: 700; }
.st-sum b { font-size: 15px; color: #0f172a; }
.st-actions { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.st-actions__btns { display: flex; flex-wrap: wrap; gap: 8px; }
.st-search { display: flex; align-items: center; gap: 8px; border: 1px solid #cbd5e1; border-radius: 9px; padding: 0 10px; background: #f8fafc; flex: 1 1 220px; max-width: 340px; }
.st-search input { border: none; background: transparent; height: 36px; outline: none; width: 100%; font-size: 13.5px; }
.st-table-wrap { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
.st-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.st-table th { background: #0f172a; color: #fff; text-align: left; padding: 9px 10px; font-weight: 700; white-space: nowrap; }
.st-table td { padding: 8px 10px; border-top: 1px solid #eef2f7; vertical-align: top; }
.st-table td:first-child { white-space: nowrap; }
.st-table .num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.st-table tbody tr:nth-child(even) td { background: #fafbfc; }
.st-table tr.st-special td { background: #ecfdf5 !important; font-weight: 800; color: #065f46; }
.st-table tr.st-dr td.num:nth-last-child(3) { color: #b91c1c; }
.st-empty { text-align: center; color: #94a3b8; padding: 22px !important; }
.st-subtitle { font-weight: 800; margin: 18px 0 8px; color: #0f172a; }
.st-note { margin-top: 10px; font-size: 12px; color: #64748b; }
@media (max-width: 640px) {
  .st-page { padding: 14px; }
  .st-shead__period { text-align: left; }
  .st-summary { grid-template-columns: 1fr 1fr; }
  .st-actions__btns .st-btn { flex: 1 1 45%; justify-content: center; }
}
`;
