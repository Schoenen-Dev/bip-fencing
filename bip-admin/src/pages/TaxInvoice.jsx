// ✅ v3 — Logo image, 2-col meta, hide blank fields, sessionStorage persistence
// ✅ Added role-based access control - Only Admin can access

import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";

const SESSION_KEY = "bip_tax_invoice_form";

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

// Products live per-branch — a single invoice can pull items from any of these.
const BRANCHES = [
  { id: 1, name: "Branch A" },
  { id: 2, name: "Branch B" },
  { id: 3, name: "Branch C" },
];

// Logo as base64 so no external file dependency
const BIP_LOGO_B64 =
  "data:image/jpeg;base64,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";
// ─── NUMBER TO WORDS ─────────────────────────────────────────────────────────
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
  if (num < 0) return "Minus " + numToWords(-num);
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
  if (paise > 0)
    return (
      "INR " + numToWords(rupees) + " and " + numToWords(paise) + " Paise Only"
    );
  return "INR " + numToWords(rupees) + " Only";
}

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
const emptyProduct = () => ({
  branchId: null,
  productId: null,
  desc: "",
  hsn: "",
  qty: "",
  rateIncl: "",
  per: "NOS",
  stockDeducted: false,
});

const DEFAULT_FORM = {
  copyType: "ORIGINAL FOR RECIPIENT",
  invoiceNo: "",
  invoiceNoLocked: false,
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
};

// Map a saved invoice row (snake_case, from /client.php?invoice_no=) back into form state.
const mapInvoiceToForm = (inv) => ({
  copyType: inv.copy_type || DEFAULT_FORM.copyType,
  invoiceNo: inv.invoice_no,
  invoiceNoLocked: true,
  invoiceDate: inv.invoice_date,
  referenceNo: inv.reference_no || "",
  buyersOrderNo: inv.buyers_order_no || "",
  dated: inv.dated || "",
  dispatchDocNo: inv.dispatch_doc_no || "",
  deliveryNoteDate: inv.delivery_note_date || "",
  dispatchedThrough: inv.dispatched_through || "",
  destination: inv.destination || "",
  billOfLading: inv.bill_of_lading || "",
  motorVehicleNo: inv.motor_vehicle_no || "",
  ewayRequired: inv.eway_required || "",
  ewayNumber: inv.eway_number || "",
  paymentMode: inv.payment_mode || DEFAULT_FORM.paymentMode,
  consigneeName: inv.consignee_name || "",
  consigneeAddress: inv.consignee_address || "",
  consigneeState: inv.consignee_state || DEFAULT_FORM.consigneeState,
  consigneeStateCode: inv.consignee_state_code || DEFAULT_FORM.consigneeStateCode,
  buyerName: inv.buyer_name || "",
  buyerAddress: inv.buyer_address || "",
  buyerPhone: inv.buyer_phone || "",
  buyerGst: inv.buyer_gst || "",
  buyerState: inv.buyer_state || DEFAULT_FORM.buyerState,
  buyerStateCode: inv.buyer_state_code || DEFAULT_FORM.buyerStateCode,
  // Balance columns default to '0.00' in the DB even when the user never set
  // one — treat zero the same as blank so the printed balance banner doesn't
  // reappear for invoices that never had a real balance.
  openBalance: inv.open_balance && Number(inv.open_balance) !== 0 ? inv.open_balance : "",
  closingBalance: inv.closing_balance && Number(inv.closing_balance) !== 0 ? inv.closing_balance : "",
  gstRate: inv.gst_rate ? Number(inv.gst_rate) : DEFAULT_FORM.gstRate,
  bankHolderName: inv.bank_holder_name || DEFAULT_BANK.holderName,
  bankName: inv.bank_name || DEFAULT_BANK.bankName,
  bankAccountNo: inv.bank_account_no || DEFAULT_BANK.accountNo,
  bankIfsc: inv.bank_ifsc || DEFAULT_BANK.ifsc,
  bankBranch: inv.bank_branch || DEFAULT_BANK.branch,
});

// Map saved invoice_items rows back into product row state. These were already
// stock-deducted when first saved, so they're marked deducted and skipped by
// reduceStock — only newly added rows (from continuing at another branch) get
// their stock taken off.
const mapItemsToProducts = (items) =>
  items && items.length
    ? items.map((it) => ({
        branchId: it.branch_id ? Number(it.branch_id) : null,
        productId: null,
        desc: it.description || "",
        hsn: it.hsn || "",
        qty: it.qty,
        rateIncl: it.rate_incl,
        per: it.per || "NOS",
        stockDeducted: true,
      }))
    : [emptyProduct()];

// Map a quotation row (from /quotation_api.php?id=) into invoice form state —
// used by the Clients page "Go to Tax Invoice" button to quick-fill a bill
// from an existing quotation. Invoice No / lock state are intentionally left
// out here; the normal invoice-number peek assigns a fresh, real one.
const mapQuotationToForm = (q) => ({
  dispatchedThrough: q.dispatched_through || "",
  motorVehicleNo: q.vehicle_no || "",
  referenceNo: q.po_no || "",
  buyersOrderNo: q.po_no || "",
  consigneeName: q.ship_name || "",
  consigneeAddress: q.ship_address || "",
  consigneeState: q.ship_state || DEFAULT_FORM.consigneeState,
  consigneeStateCode: q.ship_state_code || DEFAULT_FORM.consigneeStateCode,
  buyerName: q.client_name || "",
  buyerAddress: q.client_address || "",
  buyerPhone: q.client_phone || "",
  buyerGst: q.client_gst || "",
  buyerState: q.client_state || DEFAULT_FORM.buyerState,
  buyerStateCode: q.client_state_code || DEFAULT_FORM.buyerStateCode,
  gstRate:
    q.is_gst == null || Number(q.is_gst) === 1
      ? q.tax_percent
        ? Number(q.tax_percent)
        : DEFAULT_FORM.gstRate
      : DEFAULT_FORM.gstRate,
});

// Quotation items have no branch_id (they never touch stock) — leave branchId
// unset so the user picks a branch per line, same as starting a fresh invoice.
// stockDeducted stays false: this is now a real bill, so stock gets deducted
// for real when it's previewed/saved.
const mapQuotationItemsToProducts = (items) =>
  items && items.length
    ? items.map((it) => ({
        branchId: null,
        productId: null,
        desc: it.description || "",
        hsn: it.hsn || "",
        qty: it.quantity,
        rateIncl: it.rate,
        per: it.unit || "NOS",
        stockDeducted: false,
      }))
    : [emptyProduct()];

// ─── PRINT STYLES ─────────────────────────────────────────────────────────────
const printStyles = `
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
  #bip-invoice-print, #bip-invoice-print * { visibility: visible !important; }
  #bip-invoice-print {
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
  .no-print { display: none !important; }
  table { border-collapse: collapse !important; }
  .inv-product-row { page-break-inside: avoid; }
  .inv-footer { page-break-inside: avoid; }
  .inv-thead { display: table-header-group !important; }
  @page { size: A4 portrait; margin: 5mm; }
}
`;

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
  fontSize: 15,
  textTransform: "uppercase",
  letterSpacing: 0.3,
  marginBottom: 2,
  borderBottom: "1px dashed #999",
  paddingBottom: 1,
};

// ═════════════════════════════════════════════════════════════════════════════
export default function TaxInvoice() {
  const location = useLocation();
  const navigate = useNavigate();
  // Captured once at mount — set when arriving via the Clients page "Continue" button.
  const [continueInvoiceNo] = useState(
    () => location.state?.continueInvoiceNo || null,
  );
  // Captured once at mount — set when arriving via the Clients page
  // "Go to Tax Invoice" button on a quotation (quick-fill a bill from it).
  const [fromQuotationId] = useState(
    () => location.state?.fromQuotationId || null,
  );

  const [step, setStep] = useState(1);
  const [productsByBranch, setProductsByBranch] = useState({});
  const [stockReduced, setStockReduced] = useState(false);
  const [stockReducing, setStockReducing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(null); // null = loading, true = admin, false = not admin
  const [loading, setLoading] = useState(true);
  const [loadingExistingInvoice, setLoadingExistingInvoice] = useState(
    !!continueInvoiceNo || !!fromQuotationId,
  );
  const [existingInvoiceError, setExistingInvoiceError] = useState(null);

  // ── Check user role on mount ───────────────────────────────────────────────
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const res = await apiFetch("/check_session.php");
        const data = await res.json();
        if (data.success && data.user && data.user.role === "admin") {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (_) {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };
    checkUserRole();
  }, []);

  // ── Load persisted form from sessionStorage on mount ──────────────────────
  // (skipped when continuing an existing invoice — that's loaded from the server instead)
  const [form, setForm] = useState(() => {
    if (continueInvoiceNo || fromQuotationId) return { ...DEFAULT_FORM };
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_FORM, ...parsed.form };
      }
    } catch (_) {}
    return { ...DEFAULT_FORM };
  });

  const [products, setProducts] = useState(() => {
    if (continueInvoiceNo || fromQuotationId) return [emptyProduct()];
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.products?.length ? parsed.products : [emptyProduct()];
      }
    } catch (_) {}
    return [emptyProduct()];
  });

  const [errors, setErrors] = useState({});

  // ── Branch-aware invoice numbering (server-assigned, never reused) ─────────
  const [branchInfo, setBranchInfo] = useState(() => ({
    loading: !form.invoiceNoLocked,
    branchId: null,
    error: null,
  }));

  const fetchInvoiceNoPeek = async () => {
    try {
      const res = await apiFetch("/get_invoice_number.php");
      const data = await res.json();
      if (data.success) {
        setForm((prev) =>
          prev.invoiceNoLocked ? prev : { ...prev, invoiceNo: data.invoice_no },
        );
        setBranchInfo({
          loading: false,
          branchId: data.branch_id,
          error: null,
        });
      } else {
        setBranchInfo({
          loading: false,
          branchId: null,
          error:
            data.message === "no_branch_selected"
              ? "Select a branch to generate an invoice number."
              : "Could not load the invoice number.",
        });
      }
    } catch (_) {
      setBranchInfo({
        loading: false,
        branchId: null,
        error: "Could not reach the server for the invoice number.",
      });
    }
  };

  // ── Persist form + products to sessionStorage whenever they change ─────────
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ form, products }));
    } catch (_) {}
  }, [form, products]);

  useEffect(() => {
    BRANCHES.forEach((b) => fetchProductsForBranch(b.id));
  }, []);

  // Only peek a fresh number if this draft hasn't already reserved one.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!form.invoiceNoLocked && !continueInvoiceNo) fetchInvoiceNoPeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Quick-filling from a quotation (via Clients page "Go to Tax Invoice") ──
  useEffect(() => {
    if (!fromQuotationId) return;
    (async () => {
      try {
        const res = await apiFetch(`/quotation_api.php?id=${fromQuotationId}`);
        const data = await res.json();
        if (data.error || !data.id) {
          setExistingInvoiceError(
            data.error || "Could not load that quotation.",
          );
          setLoadingExistingInvoice(false);
          return;
        }
        // Merge (not replace) so the invoice number peeked above isn't clobbered.
        setForm((prev) => ({ ...prev, ...mapQuotationToForm(data) }));
        setProducts(mapQuotationItemsToProducts(data.items));
      } catch (_) {
        setExistingInvoiceError(
          "Could not reach the server for that quotation.",
        );
      } finally {
        setLoadingExistingInvoice(false);
        // Clear the hand-off state so refresh/back doesn't redo this fetch.
        navigate(location.pathname, { replace: true, state: {} });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Continuing an existing invoice (via Clients page "Continue") ───────────
  useEffect(() => {
    if (!continueInvoiceNo) return;
    (async () => {
      try {
        const res = await apiFetch(
          `/client.php?invoice_no=${encodeURIComponent(continueInvoiceNo)}`,
        );
        const data = await res.json();
        if (!data.success || !data.invoice) {
          setExistingInvoiceError(
            data.message || "Could not load that invoice.",
          );
          setLoadingExistingInvoice(false);
          return;
        }
        const inv = data.invoice;
        setForm({ ...DEFAULT_FORM, ...mapInvoiceToForm(inv) });
        setProducts(mapItemsToProducts(inv.items));
        setBranchInfo({ loading: false, branchId: inv.branch_id, error: null });
        setStockReduced(true); // loaded items were already deducted when first saved
      } catch (_) {
        setExistingInvoiceError("Could not reach the server for that invoice.");
      } finally {
        setLoadingExistingInvoice(false);
        // Clear the hand-off state so refresh/back doesn't redo this fetch.
        navigate(location.pathname, { replace: true, state: {} });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProductsForBranch(branchId) {
    try {
      const res = await apiFetch("/products.php", { branchId });

      if (!res.ok) return;

      const data = await res.json();
      setProductsByBranch((prev) => ({
        ...prev,
        [branchId]: data.map((p) => ({
          id: p.id,
          productName: p.product_name,
          hsn: p.hsn,
          category: p.category,
          unit: p.unit,
          sellingPrice: p.selling_price,
          stockQty: p.stock_qty,
          minStock: p.min_stock,
          description: p.description,
          _raw: p,
        })),
      }));
    } catch (_) {}
  }

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

  const handleBranchSelect = (idx, branchId) => {
    setProducts((prev) => {
      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        branchId: branchId ? Number(branchId) : null,
        productId: null,
        desc: "",
        hsn: "",
        rateIncl: "",
      };
      return updated;
    });
  };

  const handleProductSelect = (idx, productId) => {
  if (!productId) {
    handleProduct(idx, "desc", "");
    return;
  }
  const branchId = products[idx]?.branchId;
  const found = (productsByBranch[branchId] || []).find(
    (p) => String(p.id) === String(productId),
  );
  if (!found) return;
  const unitMap = {
    "Pcs": "PCS",
    "Pieces": "PCS",
    "Kg": "KGS",
    "Kgs": "KGS",
    "Kilogram": "KGS",
    "Kilograms": "KGS",
    "Meter": "MTR",
    "Meters": "MTR",
    "Roll": "RFT",
    "Box": "SET",
    "Set": "SET",
    "Sets": "SET",
    "Liter": "LTR",
    "Litre": "LTR",
    "Nos": "NOS",
    "Number": "NOS",
    "No": "NOS"
  };
  setProducts((prev) => {
    const updated = [...prev];
    updated[idx] = {
      ...updated[idx],
      productId: found.id,
      desc: found.productName,
      rateIncl: found.sellingPrice || "",
      per: unitMap[found.unit] || found.unit || "NOS",
      hsn: found.hsn || "",
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
      if (!p.branchId) e[`branch_${i}`] = "Required";
      if (!p.desc.trim()) e[`desc_${i}`] = "Required";
      if (!p.qty || isNaN(p.qty) || Number(p.qty) <= 0)
        e[`qty_${i}`] = "Invalid";
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
    hsnGroups[key].taxableValue += r.taxableAmt;
    hsnGroups[key].cgst += r.taxableAmt * (cgstRate / 100);
    hsnGroups[key].sgst += r.taxableAmt * (sgstRate / 100);
  });

  // Safe to call every time Preview is clicked, including when continuing an
  // already-saved bill at a different branch — rows already deducted (from an
  // earlier Preview) are skipped, only newly added rows get stock taken off.
  const reduceStock = async () => {
    setStockReducing(true);
    try {
      const pendingIndexes = products
        .map((p, idx) => idx)
        .filter((idx) => {
          const p = products[idx];
          const usedQty = parseFloat(p.qty);
          return (
            !p.stockDeducted &&
            p.branchId &&
            p.productId &&
            usedQty &&
            usedQty > 0
          );
        });

      if (pendingIndexes.length === 0) {
        setStockReducing(false);
        return false;
      }

      // Items can come from different branches — fetch each touched branch's
      // fresh product list (with the matching X-Branch-ID) rather than
      // relying on whichever branch the admin currently has selected.
      const branchIds = [
        ...new Set(pendingIndexes.map((idx) => products[idx].branchId)),
      ];

      const dbProductsByBranch = {};
      for (const branchId of branchIds) {
        const res = await apiFetch("/products.php", { branchId });
        if (!res.ok) throw new Error("Failed to fetch products");
        dbProductsByBranch[branchId] = await res.json();
      }

      const deductedIndexes = [];
      for (const idx of pendingIndexes) {
        const invoiceItem = products[idx];
        const usedQty = parseFloat(invoiceItem.qty);
        const match = (dbProductsByBranch[invoiceItem.branchId] || []).find(
          (p) => String(p.id) === String(invoiceItem.productId),
        );
        if (!match) continue;
        const currentStock = parseFloat(match.stock_qty) || 0;
        if (currentStock < usedQty) {
          alert(
            `⚠️ Insufficient stock for "${match.product_name}"!\nAvailable: ${currentStock}, Required: ${usedQty}`,
          );
          setStockReducing(false);
          return false;
        }
        const newStock = currentStock - usedQty;
        const updateRes = await apiFetch(`/products.php?id=${match.id}`, {
          method: "PUT",
          branchId: invoiceItem.branchId,
          body: JSON.stringify({
            productName: match.product_name,
            hsn: match.hsn,
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
        deductedIndexes.push(idx);
      }

      const anyReduced = deductedIndexes.length > 0;
      if (anyReduced) {
        setProducts((prev) =>
          prev.map((p, idx) =>
            deductedIndexes.includes(idx) ? { ...p, stockDeducted: true } : p,
          ),
        );
        setStockReduced(true);
        await Promise.all(branchIds.map((id) => fetchProductsForBranch(id)));
      }
      setStockReducing(false);
      return anyReduced;
    } catch (err) {
      alert("❌ Stock update failed: " + err.message);
      setStockReducing(false);
      return false;
    }
  };

  const handleEdit = () => {
    setStep(1);
    window.scrollTo(0, 0);
  };

  const handlePreview = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    let invoiceNoToUse = form.invoiceNo;
    if (!form.invoiceNoLocked) {
      try {
      const res = await apiFetch("/get_invoice_number.php", {
        method: "POST",
      });

      const data = await res.json();
        if (!data.success) {
          alert(
            data.message === "no_branch_selected"
              ? "⚠️ Please select a branch before generating an invoice."
              : "⚠️ Could not generate the invoice number. Please try again.",
          );
          return;
        }
        invoiceNoToUse = data.invoice_no;
        setForm((prev) => ({
          ...prev,
          invoiceNo: invoiceNoToUse,
          invoiceNoLocked: true,
        }));
      } catch (_) {
        alert("⚠️ Could not reach the server to generate the invoice number.");
        return;
      }
    }

    await reduceStock();
    try {
      const payload = {
        invoice_no: invoiceNoToUse,
        invoice_date: form.invoiceDate,
        copy_type: form.copyType,
        payment_mode: form.paymentMode,
        gst_rate: gstRate,
        reference_no: form.referenceNo,
        buyers_order_no: form.buyersOrderNo,
        dated: form.dated,
        dispatch_doc_no: form.dispatchDocNo,
        delivery_note_date: form.deliveryNoteDate,
        dispatched_through: form.dispatchedThrough,
        destination: form.destination,
        bill_of_lading: form.billOfLading,
        motor_vehicle_no: form.motorVehicleNo,
        eway_required: form.ewayRequired,
        eway_number: form.ewayNumber,
        consignee_name: form.consigneeName,
        consignee_address: form.consigneeAddress,
        consignee_state: form.consigneeState,
        consignee_state_code: form.consigneeStateCode,
        buyer_name: form.buyerName,
        buyer_address: form.buyerAddress,
        buyer_phone: form.buyerPhone,
        buyer_gst: form.buyerGst,
        buyer_state: form.buyerState,
        buyer_state_code: form.buyerStateCode,
        subtotal,
        cgst_rate: cgstRate,
        cgst_amount: cgstAmt,
        sgst_rate: sgstRate,
        sgst_amount: sgstAmt,
        total_tax: totalTax,
        round_off: roundOff,
        net_amount: netAmount,
        open_balance: form.openBalance,
        closing_balance: form.closingBalance,
        bank_holder_name: form.bankHolderName,
        bank_name: form.bankName,
        bank_account_no: form.bankAccountNo,
        bank_ifsc: form.bankIfsc,
        bank_branch: form.bankBranch,
        items: rows.map((r) => ({
          branch_id: r.branchId,
          desc: r.desc,
          hsn: r.hsn,
          qty: r.qty,
          per: r.per,
          rateIncl: r.rateIncl,
          rateExcl: r.rateExcl,
          taxableAmt: r.taxableAmt,
        })),
      };
     const res = await apiFetch("/save_invoice.php", {
       method: "POST",
       body: JSON.stringify(payload),
     });

     const result = await res.json();
      if (!result.success)
        console.error("Invoice save failed:", result.message);
    } catch (err) {
      console.error("Invoice save error:", err);
    }
    try {
      const existing = JSON.parse(localStorage.getItem("bip_invoices") || "[]");
      const newInvoice = {
        invoiceNo: invoiceNoToUse,
        date: form.invoiceDate,
        buyerName: form.buyerName,
        total: netAmount,
      };
      const filtered = existing.filter((i) => i.invoiceNo !== invoiceNoToUse);
      localStorage.setItem(
        "bip_invoices",
        JSON.stringify([...filtered, newInvoice]),
      );
    } catch (_) {}
    // Invoice is saved now — drop the draft so reopening Tax Invoice later
    // starts blank instead of resurfacing this already-saved bill. To edit
    // it again, use "Continue" on the Clients page (loads fresh from the server).
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (_) {}
    setStep(2);
    window.scrollTo(0, 0);
  };

  // Clear session and reset form
  const handleNewInvoice = () => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (_) {}
    setForm(DEFAULT_FORM);
    setProducts([emptyProduct()]);
    setStockReduced(false);
    setErrors({});
    setStep(1);
    window.scrollTo(0, 0);
    setBranchInfo({ loading: true, branchId: null, error: null });
    fetchInvoiceNoPeek();
  };

  const errStyle = (name) => ({
    borderColor: errors[name] ? "#dc3545" : undefined,
  });

  // ── Show loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // ── Show access denied for non-admin users ────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
          <h2 className="text-danger">Access Denied</h2>
          <p className="text-muted" style={{ fontSize: 16 }}>
            You do not have permission to access the Tax Invoice page.
          </p>
          <p className="text-muted" style={{ fontSize: 14 }}>
            This page is only accessible to Admin users.
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => window.location.href = "/dashboard"}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Show loading state while pulling in a "Continue" invoice ───────────────
  if (loadingExistingInvoice) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">
            {fromQuotationId
              ? "Loading quotation details…"
              : `Loading invoice ${continueInvoiceNo}…`}
          </p>
        </div>
      </div>
    );
  }

  if (existingInvoiceError) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="text-center">
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 className="text-danger">Couldn't load invoice</h2>
          <p className="text-muted" style={{ fontSize: 14 }}>
            {existingInvoiceError}
          </p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => setExistingInvoiceError(null)}
          >
            Start a New Invoice Instead
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 1 — FORM (only shown to Admin users)
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === 1) {
    return (
      <>
        <style>{printStyles}</style>
        <div
          className="container-fluid py-4 no-print"
          style={{ maxWidth: 1100 }}
        >
          <div className="card shadow-sm border-0">
            <div
              className="card-header text-white d-flex justify-content-between align-items-center"
              style={{ background: "#1a1a2e" }}
            >
              <h5 className="mb-0">🧾 BIP Fencing – Tax Invoice Generator</h5>
              <button
                type="button"
                className="btn btn-sm btn-outline-light"
                title="Clear all fields and start a fresh invoice"
                onClick={handleNewInvoice}
              >
                🔄 Refresh
              </button>
            </div>
            <div className="card-body">
              {/* Copy / GST / Payment */}
              <div className="row g-3 mb-3">
                <div className="col-md-4">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    Copy Type
                  </label>
                  <select
                    className="form-select form-select-sm"
                    name="copyType"
                    value={form.copyType}
                    onChange={handleForm}
                  >
                    {COPY_TYPES.map((t) => (
                      <option key={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    GST Rate (%)
                  </label>
                  <select
                    className="form-select form-select-sm"
                    name="gstRate"
                    value={form.gstRate}
                    onChange={handleForm}
                  >
                    <option value={18}>18% (CGST 9% + SGST 9%)</option>
                    <option value={12}>12% (CGST 6% + SGST 6%)</option>
                    <option value={5}>5% (CGST 2.5% + SGST 2.5%)</option>
                    <option value={28}>28% (CGST 14% + SGST 14%)</option>
                  </select>
                </div>
                <div className="col-md-4">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    Payment Mode
                  </label>
                  <select
                    className="form-select form-select-sm"
                    name="paymentMode"
                    value={form.paymentMode}
                    onChange={handleForm}
                  >
                    {["Cash", "Credit", "UPI", "Bank Transfer", "Cheque"].map(
                      (m) => (
                        <option key={m}>{m}</option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              {/* Invoice Details */}
              <h6
                className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase"
                style={{ fontSize: 11 }}
              >
                Invoice Details
              </h6>
              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    Invoice No *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={
                      branchInfo.loading ? "Loading…" : form.invoiceNo || "—"
                    }
                    readOnly
                    disabled
                    style={{
                      background: "#f1f3f5",
                      color: form.invoiceNo ? "#495057" : "#adb5bd",
                      fontWeight: 600,
                      fontStyle: form.invoiceNo ? "normal" : "italic",
                      cursor: "not-allowed",
                      borderColor: branchInfo.error ? "#dc3545" : undefined,
                    }}
                  />
                  <div style={{ fontSize: 10, color: "#888", marginTop: 2 }}>
                    {form.invoiceNoLocked
                      ? "Reserved for this invoice."
                      : "Auto-generated per branch — finalized when you click Preview."}
                  </div>
                  {branchInfo.error && (
                    <div className="text-danger" style={{ fontSize: 11 }}>
                      {branchInfo.error}
                    </div>
                  )}
                </div>
                {[
                  ["invoiceDate", "Invoice Date *", "", "date"],
                  ["referenceNo", "Reference No & Date", ""],
                  ["buyersOrderNo", "Buyer's Order No", ""],
                  ["dated", "Dated", "", "date"],
                  ["dispatchDocNo", "Dispatch Doc No", ""],
                  ["deliveryNoteDate", "Delivery Note Date", "", "date"],
                  ["dispatchedThrough", "Dispatched Through", ""],
                  ["destination", "Destination", ""],
                  ["billOfLading", "Bill of Lading / LR-RR No.", ""],
                  ["motorVehicleNo", "Motor Vehicle No.", "TN XX XX XXXX"],
                ].map(([name, label, placeholder, type]) => (
                  <div className="col-md-4" key={name}>
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      {label}
                    </label>
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
                      <div className="text-danger" style={{ fontSize: 11 }}>
                        {errors[name]}
                      </div>
                    )}
                  </div>
                ))}
                <div className="col-md-4">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    E-Way Required?
                  </label>
                  <select
                    className="form-select form-select-sm"
                    name="ewayRequired"
                    value={form.ewayRequired}
                    onChange={handleForm}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                {form.ewayRequired === "Yes" && (
                  <div className="col-md-4">
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      E-Way Number
                    </label>
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
              <h6
                className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase"
                style={{ fontSize: 11 }}
              >
                Consignee (Ship To)
              </h6>
              <div className="row g-3 mb-4">
                <div className="col-md-5">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    Name
                  </label>
                  <input
                    className="form-control form-control-sm"
                    name="consigneeName"
                    value={form.consigneeName}
                    onChange={handleForm}
                    placeholder="Leave blank to copy from Buyer"
                  />
                </div>
                <div className="col-md-5">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    Address
                  </label>
                  <input
                    className="form-control form-control-sm"
                    name="consigneeAddress"
                    value={form.consigneeAddress}
                    onChange={handleForm}
                  />
                </div>
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    State
                  </label>
                  <input
                    className="form-control form-control-sm"
                    name="consigneeState"
                    value={form.consigneeState}
                    onChange={handleForm}
                  />
                </div>
                <div className="col-md-2">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    State Code
                  </label>
                  <input
                    className="form-control form-control-sm"
                    name="consigneeStateCode"
                    value={form.consigneeStateCode}
                    onChange={handleForm}
                  />
                </div>
              </div>

              {/* Buyer */}
              <h6
                className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase"
                style={{ fontSize: 11 }}
              >
                Buyer (Bill To) *
              </h6>
              <div className="row g-3 mb-4">
                <div className="col-md-5">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    Name *
                  </label>
                  <input
                    className="form-control form-control-sm"
                    name="buyerName"
                    value={form.buyerName}
                    onChange={handleForm}
                    style={errStyle("buyerName")}
                  />
                  {errors.buyerName && (
                    <div className="text-danger" style={{ fontSize: 11 }}>
                      {errors.buyerName}
                    </div>
                  )}
                </div>
                <div className="col-md-5">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    Address
                  </label>
                  <input
                    className="form-control form-control-sm"
                    name="buyerAddress"
                    value={form.buyerAddress}
                    onChange={handleForm}
                  />
                </div>
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    Phone
                  </label>
                  <input
                    className="form-control form-control-sm"
                    name="buyerPhone"
                    value={form.buyerPhone}
                    onChange={(e) => {
                      const val = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setForm((prev) => ({ ...prev, buyerPhone: val }));
                      if (val.length > 0 && val.length < 10)
                        setErrors((p) => ({
                          ...p,
                          buyerPhone: "Phone must be 10 digits",
                        }));
                      else setErrors((p) => ({ ...p, buyerPhone: "" }));
                    }}
                    style={{
                      borderColor: errors.buyerPhone ? "#dc3545" : undefined,
                    }}
                    maxLength={10}
                  />
                  {errors.buyerPhone && (
                    <div className="text-danger" style={{ fontSize: 11 }}>
                      {errors.buyerPhone}
                    </div>
                  )}
                </div>
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    GST No
                  </label>
                  <input
                    className="form-control form-control-sm"
                    name="buyerGst"
                    value={form.buyerGst}
                    onChange={handleForm}
                  />
                </div>
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    State
                  </label>
                  <input
                    className="form-control form-control-sm"
                    name="buyerState"
                    value={form.buyerState}
                    onChange={handleForm}
                  />
                </div>
                <div className="col-md-2">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    State Code
                  </label>
                  <input
                    className="form-control form-control-sm"
                    name="buyerStateCode"
                    value={form.buyerStateCode}
                    onChange={handleForm}
                  />
                </div>
              </div>

              {/* Products */}
              <h6
                className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase"
                style={{ fontSize: 11 }}
              >
                Products — Enter Rate Inclusive of Tax
              </h6>
              <div
                className="alert alert-info py-2 px-3 mb-2"
                style={{ fontSize: 12 }}
              >
                💡 Pick a <strong>Branch</strong> for each row first — items
                can come from Branch A, B and C on the same invoice. Once a
                branch is chosen, its product list appears in Description.
              </div>
              <div className="table-responsive mb-2">
                <table
                  className="table table-bordered table-sm align-middle mb-0"
                  style={{ fontSize: 12 }}
                >
                  <thead className="table-dark">
                    <tr>
                      <th style={{ width: 32 }}>#</th>
                      <th style={{ width: 110 }}>Branch</th>
                      <th>Description</th>
                      <th style={{ width: 85 }}>HSN/SAC</th>
                      <th style={{ width: 75 }}>Qty</th>
                      <th style={{ width: 90 }}>Per</th>
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
                      const branchProducts = productsByBranch[p.branchId] || [];
                      return (
                        <tr key={i}>
                          <td className="text-center">{i + 1}</td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              style={{
                                borderColor: errors[`branch_${i}`]
                                  ? "#dc3545"
                                  : undefined,
                                cursor: "pointer",
                              }}
                              value={p.branchId || ""}
                              onChange={(e) =>
                                handleBranchSelect(i, e.target.value)
                              }
                            >
                              <option value="">— Branch —</option>
                              {BRANCHES.map((b) => (
                                <option key={b.id} value={b.id}>
                                  {b.name}
                                </option>
                              ))}
                            </select>
                            {errors[`branch_${i}`] && (
                              <div
                                className="text-danger"
                                style={{ fontSize: 11 }}
                              >
                                {errors[`branch_${i}`]}
                              </div>
                            )}
                          </td>
                          <td>
  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
    {p.branchId ? (
      <select
        className="form-select form-select-sm"
        style={{
          width: 320,
          flexShrink: 0,
          borderColor: errors[`desc_${i}`] ? "#dc3545" : undefined,
          minHeight: "31px",
          cursor: "pointer",
        }}
        value={p.productId || ""}
        onChange={(e) => handleProductSelect(i, e.target.value)}
      >
        <option value="">
          {!p.productId && p.desc ? p.desc : "— Select Product —"}
        </option>
        {branchProducts.map((sp) => (
          <option key={sp.id} value={sp.id}>
            {sp.productName}
          </option>
        ))}
      </select>
    ) : (
      <input
        className="form-control form-control-sm"
        value=""
        placeholder="Select a branch first"
        disabled
        style={{
          borderColor: errors[`desc_${i}`] ? "#dc3545" : undefined,
        }}
      />
    )}
  </div>
  {errors[`desc_${i}`] && (
    <div className="text-danger" style={{ fontSize: 11 }}>
      {errors[`desc_${i}`]}
    </div>
  )}
</td>
                          <td>
                            <input
                              className="form-control form-control-sm"
                              value={p.hsn}
                              placeholder="e.g. 73269099"
                              onChange={(e) =>
                                handleProduct(i, "hsn", e.target.value)
                              }
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="form-control form-control-sm"
                              value={p.qty}
                              onChange={(e) =>
                                handleProduct(i, "qty", e.target.value)
                              }
                              style={{
                                borderColor: errors[`qty_${i}`]
                                  ? "#dc3545"
                                  : undefined,
                              }}
                            />
                          </td>
<td>
  <select
    className="form-select form-select-sm"
    value={p.per || "NOS"}
    onChange={(e) => handleProduct(i, "per", e.target.value)}
    style={{ width: "100%" }}
  >
    {["NOS","KGS","MTR","SQM","RFT","SET","PCS","LTR"].map((u) => (
      <option key={u} value={u}>{u}</option>
    ))}
  </select>
</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              className="form-control form-control-sm"
                              value={p.rateIncl}
                              onChange={(e) =>
                                handleProduct(i, "rateIncl", e.target.value)
                              }
                              style={{
                                borderColor: errors[`rateIncl_${i}`]
                                  ? "#dc3545"
                                  : undefined,
                              }}
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
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm"
                  onClick={addProduct}
                >
                  + Add Row
                </button>
                <div className="text-end" style={{ fontSize: 13 }}>
                  <div>
                    Subtotal (Taxable): <strong>₹ {fmt2(subtotal)}</strong>
                  </div>
                  <div className="text-muted">
                    CGST {cgstRate}%: ₹ {fmt2(cgstAmt)} | SGST {sgstRate}%: ₹{" "}
                    {fmt2(sgstAmt)}
                  </div>
                  <div className="text-muted">
                    Round Off: ₹ {fmt2(roundOff)}
                  </div>
                  <div className="fs-6 fw-bold">
                    Net Amount: ₹ {fmt2(netAmount)}
                  </div>
                </div>
              </div>

              {/* Balance */}
              <h6
                className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase"
                style={{ fontSize: 11 }}
              >
                Balance Tracking
              </h6>
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    Open Balance (₹)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    name="openBalance"
                    value={form.openBalance}
                    onChange={handleForm}
                    placeholder="0.00"
                  />
                </div>
                <div className="col-md-3">
                  <label
                    className="form-label fw-semibold"
                    style={{ fontSize: 12 }}
                  >
                    Closing Balance (₹)
                  </label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    name="closingBalance"
                    value={form.closingBalance}
                    onChange={handleForm}
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Bank */}
              <h6
                className="fw-bold border-bottom pb-1 mb-3 text-secondary text-uppercase"
                style={{ fontSize: 11 }}
              >
                Company Bank Details
              </h6>
              <div className="row g-3 mb-4">
                {[
                  ["bankHolderName", "A/c Holder Name"],
                  ["bankName", "Bank Name"],
                  ["bankAccountNo", "A/c No."],
                  ["bankIfsc", "IFS Code"],
                  ["bankBranch", "Branch"],
                ].map(([name, label]) => (
                  <div className="col-md-4" key={name}>
                    <label
                      className="form-label fw-semibold"
                      style={{ fontSize: 12 }}
                    >
                      {label}
                    </label>
                    <input
                      className="form-control form-control-sm"
                      name={name}
                      value={form[name]}
                      onChange={handleForm}
                    />
                  </div>
                ))}
              </div>

              <div className="d-grid d-md-flex justify-content-md-end gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleNewInvoice}
                >
                  🗑️ Clear Form
                </button>
                <button
                  className="btn btn-lg px-5 text-white"
                  style={{
                    background:
                      stockReducing ||
                      (!form.invoiceNoLocked &&
                        (branchInfo.loading || branchInfo.error))
                        ? "#6b7280"
                        : "#1a1a2e",
                    cursor:
                      stockReducing ||
                      (!form.invoiceNoLocked &&
                        (branchInfo.loading || branchInfo.error))
                        ? "not-allowed"
                        : "pointer",
                  }}
                  onClick={handlePreview}
                  disabled={
                    stockReducing ||
                    (!form.invoiceNoLocked &&
                      (branchInfo.loading || !!branchInfo.error))
                  }
                >
                  {stockReducing
                    ? "⏳ Updating Stock…"
                    : !form.invoiceNoLocked && branchInfo.loading
                      ? "⏳ Loading Invoice No…"
                      : "Preview Invoice →"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP 2 — INVOICE PREVIEW
  // ═══════════════════════════════════════════════════════════════════════════

const itemCount = rows.length;
const dynFont =
  itemCount <= 10 ? 11 : itemCount <= 20 ? 12 : itemCount <= 30 ? 11 : 10;
const dynPad =
  itemCount <= 10 ? "3px 6px" : itemCount <= 20 ? "3px 6px" : "2px 5px";

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

  const MIN_ROWS = itemCount >= 15 ? 0 : Math.max(0, 15 - itemCount);

  // ── Meta fields: only show if filled ─────────────────────────────────────
  // LEFT column: Invoice No, Reference No, Buyer's Order No
  // RIGHT column: Dispatch Doc No, Dispatched Through, Destination
  // Each only shows if value is non-empty
  const leftMetaFields = [
   { label: "Invoice No.", value: form.invoiceNo },
    form.referenceNo
      ? { label: "Reference No. & Date", value: form.referenceNo }
      : null,
    form.buyersOrderNo
      ? { label: "Buyer's Order No.", value: form.buyersOrderNo }
      : null,
    form.dated ? { label: "Dated", value: formatDate(form.dated) } : null,
  ].filter(Boolean);

  const rightMetaFields = [
    form.dispatchDocNo
      ? { label: "Dispatch Doc No.", value: form.dispatchDocNo }
      : null,
    form.deliveryNoteDate
      ? {
          label: "Delivery Note Date",
          value: formatDate(form.deliveryNoteDate),
        }
      : null,
].filter(Boolean);

  // Buyer panel right-side details (only non-empty)

  // Buyer panel right-side details (only non-empty)
const buyerRightDetails = [
    { label: "Payment", value: form.paymentMode },
    form.dispatchedThrough
      ? { label: "Transport", value: form.dispatchedThrough }
      : null,
    form.ewayNumber
      ? { label: "E-Way Bill No.", value: form.ewayNumber }
      : null,
    form.destination ? { label: "Delivery To", value: form.destination } : null,
    form.billOfLading
      ? { label: "Bill of Lading/LR-RR No.", value: form.billOfLading }
      : null,
    form.motorVehicleNo
      ? { label: "Motor Vehicle No.", value: form.motorVehicleNo }
      : null,
  ].filter(Boolean);

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
        <button
          className="btn btn-outline-success px-4"
          onClick={handleNewInvoice}
        >
          🆕 New Invoice
        </button>
      </div>

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
          ✅ Stock successfully updated in the database.
        </div>
      )}

      {/* ── INVOICE ── */}
<div
  id="bip-invoice-print"
  style={{
    width: "210mm",
    minHeight: "297mm",
    margin: "0 auto 30px",
    padding: "8mm",
    fontFamily: "'Times New Roman', Times, serif",
    color: "#000",
    background: "#fff",
    border: "2px solid #000",
    fontSize: dynFont + 2,
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  }}
>
        {/* Copy label */}
        <div
          style={{
            textAlign: "right",
            padding: "2px 8px",
            fontStyle: "italic",
            fontSize: 10,
            borderBottom: "1px solid #000",
          }}
        >
          ({form.copyType})
        </div>

        {/* ── HEADER: Logo + Company Info ── */}
        <table
          style={{ width: "100%", borderCollapse: "collapse", borderBottom: B }}
        >
          <tbody>
            <tr>
              {/* LEFT: Logo image */}
              <td
                style={{
                  width: 80,
                  borderRight: B,
                  padding: "4px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
                <img
                  src={BIP_LOGO_B64}
                  alt="BIP Fencing"
                  style={{
                    width: 68,
                    height: 68,
                    objectFit: "contain",
                    display: "block",
                    margin: "0 auto",
                  }}
                />
              </td>
              {/* CENTER: Company details */}
              <td
                style={{
                  padding: "4px 10px",
                  textAlign: "center",
                  verticalAlign: "middle",
                }}
              >
<div
  style={{
    fontSize: 24,  // ← Changed from 17 to 20
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  }}
>
  {COMPANY.name}
</div>
                <div style={{ fontSize: 10, marginTop: 1 }}>
                  {COMPANY.address}
                </div>
                <div style={{ fontSize: 10 }}>
                  GSTIN/UIN: <strong>{COMPANY.gst}</strong>&nbsp;&nbsp;State:{" "}
                  {COMPANY.state}, Code: {COMPANY.stateCode}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    display: "flex",
                    justifyContent: "center",
                    gap: 24,
                  }}
                >
              <span>Ph: {COMPANY.phone}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── CONSIGNEE + META (2-column split) ── */}

{/* ── CONSIGNEE + META (2-column split) ── */}
<table
  style={{ width: "100%", borderCollapse: "collapse", borderBottom: B }}
  className="meta-table"
>
  <tbody>
    <tr>
      {/* Consignee - Left Column */}
      <td
        style={{
          width: "50%",
          borderRight: B,
          padding: "6px 7px",
          verticalAlign: "top",
        }}
      >
        <div style={sectionHead}>Consignee (Ship to)</div>
        <div style={{ fontWeight: "bold", fontSize: 16 }}>
          {form.consigneeName || form.buyerName}
        </div>
        <div style={{ fontSize: 14 }}>{form.consigneeAddress || form.buyerAddress}</div>
        <div style={{ fontSize: 14 }}>
          State Name: {form.consigneeState || form.buyerState}, Code:{" "}
          {form.consigneeStateCode || form.buyerStateCode}
        </div>
      </td>
      
      {/* Meta - Right Column */}
      <td
        style={{
          width: "50%",
          padding: "6px 7px",
          verticalAlign: "top",
        }}
      >
        <div>
          {[...leftMetaFields, ...rightMetaFields].map(({ label, value }, idx) => (
            <div key={label + idx} style={{ display: "flex", marginBottom: 2 }}>
              <span style={{ fontWeight: "normal", minWidth: 130, whiteSpace: "nowrap", fontSize: 13 }}>
                {label}
              </span>
              <span style={{ fontWeight: "bold", fontSize: 13 }}> : {value}</span>
            </div>
          ))}
        </div>
      </td>
    </tr>
  </tbody>
</table>
{/* ── BUYER + PAYMENT (2-column split) ── */}
<table style={{ width: "100%", borderCollapse: "collapse", borderBottom: B }}>
  <tbody>
    <tr>
      {/* Buyer - Left Column */}
      <td
        style={{
          width: "50%",
          borderRight: B,
          padding: "6px 7px",
          verticalAlign: "top",
        }}
      >
        <div style={sectionHead}>Buyer (Bill to)</div>
        <div style={{ fontWeight: "bold", fontSize: 16 }}>
          {form.buyerName}
        </div>
        <div style={{ fontSize: 14 }}>{form.buyerAddress}</div>
        {form.buyerPhone && <div style={{ fontSize: 14 }}>Ph: {form.buyerPhone}</div>}
        {form.buyerGst && <div style={{ fontSize: 14 }}>GSTIN/UIN: {form.buyerGst}</div>}
        <div style={{ fontSize: 14 }}>
          State Name: {form.buyerState}, Code: {form.buyerStateCode}
        </div>
      </td>
      
      {/* Payment - Right Column */}
      <td
        style={{
          padding: "6px 7px",
          verticalAlign: "top",
          width: "50%",
        }}
      >
{buyerRightDetails.map(({ label, value }) => (
          <div
            key={label}
            style={{ display: "flex", marginBottom: 2 }}
          >
            <span
              style={{
                fontWeight: "normal",
                minWidth: 95,
                whiteSpace: "nowrap",
                fontSize: 14,
              }}
            >
              {label}
            </span>
            <span style={{ fontWeight: "bold", fontSize: 14 }}>
              {" "}
              : {value}
            </span>
          </div>
        ))}
        {buyerRightDetails.length === 0 && (
          <div
            style={{
              color: "#999",
              fontSize: 12,
              fontStyle: "italic",
            }}
          >
            No additional details
          </div>
        )}
      </td>
    </tr>
  </tbody>
</table>
     {/* ── BUYER + PAYMENT ── */}


{/* ── PRODUCT TABLE ── */}
        <div style={{ flex: 1 }}>
       <table
  style={{
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
    borderTop: B,
    borderBottom: B,
  }}
>
          <colgroup>
            <col style={{ width: "4%" }} />
            <col style={{ width: "48%" }} />
            <col style={{ width: "8%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "5%" }} />
            <col style={{ width: "14%" }} />
          </colgroup>
          <thead className="inv-thead">
            <tr>
              {[
                ["Sl\nNo.", "center"],
                ["Description of Goods", "left"],
                ["HSN/\nSAC", "center"],
                ["Quantity", "center"],
                ["Rate\n(Incl. Tax)", "right"],
                ["Rate\n(Excl. Tax)", "right"],
                ["Per", "center"],
                ["Taxable\nAmount", "right"],
              ].map(([label, align], i) => (
                <th
                  key={i}
                  style={dhc({
                    textAlign: align,
                    whiteSpace: "pre-line",
                    padding: dynPad,
                  })}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="inv-product-row">
                <td style={dc({ textAlign: "center" })}>{i + 1}</td>
              <td style={dc({ 
  fontWeight: "bold",
  fontSize: 18
})}>{r.desc}</td>
                <td style={dc({ textAlign: "center", fontWeight: "bold" })}>{r.hsn || "–"}</td>
               <td style={dc({ textAlign: "center", fontWeight: "bold" })}>{fmt2(r.qty)}</td>
                <td style={dc({ textAlign: "right" })}>{fmt2(r.rateIncl)}</td>
                <td style={dc({ textAlign: "right" })}>{fmt2(r.rateExcl)}</td>
                <td style={dc({ textAlign: "center" })}>{r.per}</td>
                <td style={dc({ textAlign: "right" })}>{fmt2(r.taxableAmt)}</td>
              </tr>
            ))}
{Array.from({ length: MIN_ROWS }).map((_, i) => (
              <tr key={`blank_${i}`} style={{ height: 18 }}>
                {Array(8)
                  .fill(null)
                  .map((__, j) => (
                    <td key={j} style={dc()}>
                      &nbsp;
                    </td>
                  ))}
              </tr>
            ))}
            
            {(form.openBalance || form.closingBalance) && (
              <tr>
                <td colSpan={8} style={dc({ borderTop: "1px dashed #999", padding: "3px 7px" })}>
                  {form.openBalance && (
                    <div style={{ fontWeight: "bold", fontSize: dynFont + 2 }}>
                      Open Balance: ₹ {fmt2(form.openBalance)}
                    </div>
                  )}
                  {form.closingBalance && (
                    <div style={{ fontWeight: "bold", fontSize: dynFont + 2 }}>
                      Closing Balance: ₹ {fmt2(form.closingBalance)}
                    </div>
                  )}
                </td>
              </tr>
            )}
            <tr>
  <td
    colSpan={7}
    style={dc({
      textAlign: "right",
      fontWeight: "bold",
      borderTop: B,
    })}
  >
    Total Taxable Amount
  </td>
  <td
    style={dc({
      textAlign: "right",
      fontWeight: "bold",
      borderTop: B,
    })}
  >
    {fmt2(subtotal)}
  </td>
</tr>
            <tr>
              <td
                colSpan={7}
                style={dc({
                  textAlign: "right",
                  fontStyle: "italic",
                  fontWeight: "bold",
                  borderTop: B,
                })}
              >
                CGST TAX
              </td>
              <td
                style={dc({
                  textAlign: "right",
                  fontWeight: "bold",
                  borderTop: B,
                })}
              >
                {fmt2(cgstAmt)}
              </td>
            </tr>
            <tr>
              <td
                colSpan={7}
                style={dc({
                  textAlign: "right",
                  fontStyle: "italic",
                  fontWeight: "bold",
                })}
              >
                SGST TAX 
              </td>
              <td style={dc({ textAlign: "right", fontWeight: "bold" })}>
                {fmt2(sgstAmt)}
              </td>
            </tr>
            <tr>
              <td
                colSpan={7}
                style={dc({
                  textAlign: "right",
                  fontStyle: "italic",
                  fontWeight: "bold",
                })}
              >
                ROUNDING OFF
              </td>
              <td style={dc({ textAlign: "right", fontWeight: "bold" })}>
                {roundOff >= 0
                  ? `(+) ${fmt2(Math.abs(roundOff))}`
                  : `(-) ${fmt2(Math.abs(roundOff))}`}
              </td>
            </tr>
            <tr style={{ background: "#f0f0f0" }}>
  <td style={dc({ borderTop: B, borderBottom: B })}></td>
  <td
    style={dc({
      fontWeight: "bold",
      borderTop: B,
      borderBottom: B,
      fontSize: dynFont + 1,
    })}
  >
    Total
  </td>
  <td style={dc({ borderTop: B, borderBottom: B })}></td>
  <td
    style={dc({
      textAlign: "center",
      fontWeight: "bold",
      borderTop: B,
      borderBottom: B,
      fontSize: dynFont + 1,
    })}
  >
    {totalQty.toFixed(2)}
  </td>
  <td style={dc({ borderTop: B, borderBottom: B })}></td>
  <td style={dc({ borderTop: B, borderBottom: B })}></td>
  <td style={dc({ borderTop: B, borderBottom: B })}></td>
  <td
    style={dc({
      textAlign: "right",
      fontWeight: "bold",
      borderTop: B,
      borderBottom: B,
      fontSize: dynFont + 3,
    })}
  >
    ₹ {fmt2(netAmount)}
  </td>
</tr>
          </tbody>
        </table>
        </div>

        {/* ── AMOUNT IN WORDS ── */}
        <table
          style={{ width: "100%", borderCollapse: "collapse", borderBottom: B }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  width: "58%",
                  borderRight: B,
                  padding: "3px 7px",
                  verticalAlign: "middle",
                  fontSize: 10,
                }}
              >
                <span style={{ fontWeight: "bold" }}>
                  Amount Chargeable (in words):{" "}
                </span>
               <em style={{ fontWeight: "bold" }}>{amountInWords(netAmount)}</em>
              </td>
<td
  style={{
    padding: "3px 7px",
    verticalAlign: "middle",
    textAlign: "right",
  }}
>
  <div style={{ fontSize: 2, fontWeight: "bold" }}>  {/* ← Changed from 17 to 20 */}
    ₹ {fmt2(netAmount)}
  </div>
  <div style={{ fontSize: 10 }}>E. &amp; O.E</div>  {/* ← Changed from 9 to 10 */}
</td>
            </tr>
          </tbody>
        </table>

        {/* ── HSN TAX TABLE ── */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
            borderBottom: B,
          }}
          className="inv-footer"
        >
          <colgroup>
            <col style={{ width: "14%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "16%" }} />
          </colgroup>
          <thead>
            <tr>
              {[
                ["HSN/SAC", "center"],
                ["Taxable\nValue", "right"],
                ["CGST\nRate", "center"],
                ["CGST\nAmount", "right"],
                ["SGST/UTGST\nRate", "center"],
                ["SGST/UTGST\nAmount", "right"],
                ["Total Tax\nAmount", "right"],
              ].map(([label, align]) => (
                <th
                  key={label}
                  style={dhc({
                    textAlign: align,
                    whiteSpace: "pre-line",
                     padding: "2px 6px",
                     fontSize: 10,  
                  })}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(hsnGroups).map(([hsn, d]) => (
              <tr key={hsn}>
                <td style={dc({ textAlign: "center", fontSize: 11 })}>{hsn}</td>
                <td style={dc({ textAlign: "right", fontSize: 11 })}>
                  {fmt2(d.taxableValue)}
                </td>
                <td style={dc({ textAlign: "center", fontSize: 10 })}>
                  {cgstRate}%
                </td>
                <td style={dc({ textAlign: "right", fontSize: 10 })}>
                  {fmt2(d.cgst)}
                </td>
                <td style={dc({ textAlign: "center", fontSize: 10 })}>
                  {sgstRate}%
                </td>
                <td style={dc({ textAlign: "right", fontSize: 10 })}>
                  {fmt2(d.sgst)}
                </td>
                <td style={dc({ textAlign: "right", fontSize: 10 })}>
                  {fmt2(d.cgst + d.sgst)}
                </td>
              </tr>
            ))}
            <tr style={{ background: "#f5f5f5", fontWeight: "bold" }}>
              <td style={dc({ borderTop: B, borderBottom: B, fontSize: 10 })}>
                Total
              </td>
              <td
                style={dc({
                  textAlign: "right",
                  borderTop: B,
                  borderBottom: B,
                  fontSize: 10,
                })}
              >
                {fmt2(subtotal)}
              </td>
              <td style={dc({ borderTop: B, borderBottom: B })}></td>
              <td
                style={dc({
                  textAlign: "right",
                  borderTop: B,
                  borderBottom: B,
                  fontSize: 10,
                })}
              >
                {fmt2(cgstAmt)}
              </td>
              <td style={dc({ borderTop: B, borderBottom: B })}></td>
              <td
                style={dc({
                  textAlign: "right",
                  borderTop: B,
                  borderBottom: B,
                  fontSize: 10,
                })}
              >
                {fmt2(sgstAmt)}
              </td>
              <td
                style={dc({
                  textAlign: "right",
                  borderTop: B,
                  borderBottom: B,
                  fontSize: 10,
                })}
              >
                {fmt2(totalTax)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── TAX IN WORDS ── */}
        <div style={{ padding: "2px 7px", borderBottom: B, fontSize: 10 }}>
          <strong>Tax Amount (in words):</strong>&nbsp;
         <em style={{ fontWeight: "bold" }}>{amountInWords(totalTax)}</em>
        </div>

        {/* ── FOOTER ── */}
        <div style={{ marginTop: "auto" }}>
        <table
          style={{ width: "100%", borderCollapse: "collapse" }}
          className="inv-footer"
        >
          <tbody>
            <tr>
              <td
                style={{
                  width: "44%",
                  borderRight: B,
                  padding: "4px 7px",
                  verticalAlign: "top",
                  fontSize: 10,
                }}
              >
<div style={{ fontWeight: "bold", marginBottom: 2, fontSize: 15 }}>
  Company's Bank Details
</div>
{[
  ["A/c Holder's Name", form.bankHolderName],
  ["Bank Name", form.bankName],
  ["A/c No.", form.bankAccountNo],
  [
    "Branch & IFS Code",
    `${form.bankBranch} & ${form.bankIfsc}`,
  ],
].map(([k, v]) => (
  <div key={k} style={{ marginBottom: 2, fontSize: 12 }}>
    <strong>{k}</strong>: {v}
  </div>
))}
              </td>
              <td style={{ padding: "4px 7px", verticalAlign: "top" }}>
                <div style={{ fontSize: 9, marginBottom: 4 }}>
                  <strong>Declaration:</strong> {DECLARATION}
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontWeight: "bold",
                    fontSize: 10,
                    marginBottom: 2,
                  }}
                >
                  for {COMPANY.name}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: 28,
                  }}
                >
                  <div style={{ textAlign: "center", width: "42%" }}>
                    <div style={{ borderTop: B, paddingTop: 2, fontSize: 10 }}>
                      Receiver's Signature
                    </div>
                  </div>
                  <div style={{ textAlign: "center", width: "42%" }}>
                    <div style={{ borderTop: B, paddingTop: 2, fontSize: 10 }}>
                      Authorised Signatory
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    textAlign: "center",
                    marginTop: 4,
                    fontSize: 9,
                    color: "#666",
                  }}
                >
                  This is a Computer Generated Invoice
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
      {/* end invoice */}

      <div className="no-print d-flex justify-content-center gap-3 pb-4">
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
        <button
          className="btn btn-outline-success px-4"
          onClick={handleNewInvoice}
        >
          🆕 New Invoice
        </button>
      </div>
    </>
  );
}