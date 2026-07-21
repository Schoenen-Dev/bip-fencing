import { useState, useEffect, Fragment } from "react";
import { apiFetch } from "../utils/api";

const todayDate = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  productName: "",
  hsn: "",
  unit: "Pcs",
  productDate: todayDate(),
  factoryPrice: "",
  sellingPrice: "",
  stockQty: "",
  minStock: "",
  description: "",
};

function mapFromDB(p) {
  return {
    id: p.id,
    productName: p.product_name,
    hsn: p.hsn,
    unit: p.unit,
    productDate: p.product_date,
    factoryPrice: p.factory_price,
    sellingPrice: p.selling_price,
    stockQty: p.stock_qty,
    minStock: p.min_stock,
    description: p.description,
    branchId: p.branch_id,
  };
}

function mapDamageFromDB(d) {
  return {
    id: d.id,
    productName: d.product_name,
    damageDate: d.damage_date,
    stockQty: d.stock_qty,
    qty: d.qty,
  };
}

export default function Products() {
  const [form, setForm] = useState(emptyForm);
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [addStockQty, setAddStockQty] = useState("");
  const [stockAlert, setStockAlert] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [showDamageLog, setShowDamageLog] = useState(false);
  const [damageLog, setDamageLog] = useState([]);
  const [damageLoading, setDamageLoading] = useState(false);
  const [stockInOpenId, setStockInOpenId] = useState(null);
  const [stockInQty, setStockInQty] = useState("");
  const [editingDamageId, setEditingDamageId] = useState(null);
  const [damageEditForm, setDamageEditForm] = useState({ qty: "", damageDate: "" });

  // Get user role and current branch from localStorage
  const userRole = localStorage.getItem("role");
  const isAdmin = userRole === "admin";
  const currentBranchId =
    localStorage.getItem("admin_view_branch") ||
    localStorage.getItem("branch_id");

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(""), 3000);
    return () => clearTimeout(t);
  }, [successMsg]);

  // FIXED: Check if product name already exists ONLY in the current branch
  const isProductNameDuplicate = (productName, excludeId = null) => {
    if (!productName || !productName.trim()) return false;

    const lowerCaseName = productName.toLowerCase().trim();

    // Only check products that belong to the current branch
    const currentBranchProducts = products.filter(
      (p) => p.branchId === currentBranchId,
    );

    return currentBranchProducts.some(
      (p) =>
        p.productName.toLowerCase().trim() === lowerCaseName &&
        p.id !== excludeId, // Exclude the current product when editing
    );
  };

  async function fetchProducts() {
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch("/products.php");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const loaded = data.map(mapFromDB);
      setProducts(loaded);

      // Stock alert check
      const outItems = loaded.filter((p) => Number(p.stockQty) === 0);
      const lowItems = loaded.filter(
        (p) =>
          Number(p.stockQty) > 0 &&
          Number(p.minStock) > 0 &&
          Number(p.stockQty) <= Number(p.minStock),
      );

      if (outItems.length > 0 || lowItems.length > 0) {
        const msgs = [];
        if (outItems.length)
          msgs.push(
            `🔴 Out of Stock: ${outItems.map((p) => p.productName).join(", ")}`,
          );
        if (lowItems.length)
          msgs.push(
            `🟡 Low Stock: ${lowItems
              .map((p) => `${p.productName} (${p.stockQty} left)`)
              .join(", ")}`,
          );
        setStockAlert(msgs.join("\n"));
      } else {
        setStockAlert("");
      }
    } catch (err) {
      setError("❌ Could not load products. Is PHP server running?");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDamageLog() {
    setDamageLoading(true);
    setError("");
    try {
      const res = await apiFetch("/products.php?damage=1");
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setDamageLog(data.map(mapDamageFromDB));
    } catch (err) {
      setError("❌ Could not load damage log.");
    } finally {
      setDamageLoading(false);
    }
  }

  const openDamageLog = () => {
    setShowForm(false);
    setShowDamageLog(true);
    fetchDamageLog();
  };

  const closeDamageLog = () => setShowDamageLog(false);

  const openDamageEdit = (d) => {
    setEditingDamageId(d.id);
    setDamageEditForm({
      qty: d.qty,
      damageDate: d.damageDate ? String(d.damageDate).slice(0, 10) : todayDate(),
    });
  };

  const cancelDamageEdit = () => {
    setEditingDamageId(null);
    setDamageEditForm({ qty: "", damageDate: "" });
  };

  const saveDamageEdit = async (id) => {
    const qty = Number(damageEditForm.qty);
    if (!qty || qty <= 0) {
      setError("❌ Enter a valid quantity");
      return;
    }
    if (!damageEditForm.damageDate) {
      setError("❌ Damage date is required");
      return;
    }
    try {
      const res = await apiFetch(`/products.php?damage=1&id=${id}`, {
        method: "PUT",
        body: JSON.stringify({
          qty,
          damageDate: damageEditForm.damageDate,
        }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Update failed");
      }
      await Promise.all([fetchDamageLog(), fetchProducts()]);
      setEditingDamageId(null);
      setDamageEditForm({ qty: "", damageDate: "" });
      setSuccessMsg("✅ Damage record updated");
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  const handleDamageDelete = async (id) => {
    if (!window.confirm("Delete this damage record? The quantity will be added back to stock."))
      return;
    try {
      const res = await apiFetch(`/products.php?damage=1&id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Delete failed");
      }
      await Promise.all([fetchDamageLog(), fetchProducts()]);
      if (editingDamageId === id) cancelDamageEdit();
      setSuccessMsg("✅ Damage record deleted");
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  const openStockIn = (id) => {
    setStockInOpenId(id);
    setStockInQty("");
  };

  const cancelStockIn = () => {
    setStockInOpenId(null);
    setStockInQty("");
  };

  const confirmStockIn = async (id) => {
    const qty = Number(stockInQty);
    if (!qty || qty <= 0) {
      setError("❌ Enter a valid quantity");
      return;
    }
    try {
      const res = await apiFetch(`/products.php?action=stock-in&id=${id}`, {
        method: "POST",
        body: JSON.stringify({ qty }),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Stock in failed");
      }
      await fetchProducts();
      setStockInOpenId(null);
      setStockInQty("");
      setSuccessMsg(`✅ Stock added: +${qty}`);
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  const handleStockOut = async (p) => {
    if (Number(p.stockQty) <= 0) {
      setError("❌ No stock available to remove");
      return;
    }
    try {
      const res = await apiFetch(`/products.php?action=stock-out&id=${p.id}`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Stock out failed");
      }
      await fetchProducts();
      setSuccessMsg(`⚠️ 1 unit marked damaged: ${p.productName}`);
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate product name
    if (!form.productName.trim()) {
      setError("❌ Product name is required");
      return;
    }

    // FIXED: Check for duplicate product name only within the same branch
    if (isProductNameDuplicate(form.productName, editingId)) {
      setError(
        `❌ Product "${form.productName}" already exists in this branch. Please use a different product name for this branch.`,
      );
      return;
    }

    const wasEditing = editingId !== null;

    try {
      let res;
      if (editingId !== null) {
        const extra = Number(addStockQty) || 0;
        const finalQty = Number(form.stockQty) + extra;
        res = await apiFetch(`/products.php?id=${editingId}`, {
          method: "PUT",
          body: JSON.stringify({
            ...form,
            stockQty: finalQty,
          }),
        });
      } else {
       res = await apiFetch("/products.php", {
         method: "POST",
         body: JSON.stringify(form),
       });
      }
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || "Save failed");
      }
      await fetchProducts();
      setEditingId(null);
      setForm(emptyForm);
      setAddStockQty("");
      setShowForm(false);
      setSuccessMsg(
        wasEditing ? "✅ Product updated successfully" : "✅ Product added successfully",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  const openAddForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setAddStockQty("");
    setError("");
    setShowDamageLog(false);
    setShowForm(true);
  };

  const handleEdit = (p) => {
    setForm({
      productName: p.productName,
      hsn: p.hsn,
      unit: p.unit,
      productDate: p.productDate ? String(p.productDate).slice(0, 10) : todayDate(),
      factoryPrice: p.factoryPrice,
      sellingPrice: p.sellingPrice,
      stockQty: p.stockQty,
      minStock: p.minStock,
      description: p.description,
    });
    setEditingId(p.id);
    setAddStockQty("");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
     const res = await apiFetch(`/products.php?id=${id}`, {
       method: "DELETE",
     });
      if (!res.ok) throw new Error("Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(false);
      }
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setAddStockQty("");
    setError("");
    setShowForm(false);
  };

  const stockBadge = (qty, min) => {
    qty = Number(qty);
    min = Number(min);
    if (qty === 0) return <span style={badge("red")}>Out of Stock</span>;
    if (qty <= min) return <span style={badge("yellow")}>Low ({qty})</span>;
    return <span style={badge("green")}>{qty}</span>;
  };

  return (
    <>
      <style>{`
        .pf-field { display: flex; flex-direction: column; gap: 6px; }
        .pf-label { font-size: 11.5px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.6px; display: flex; align-items: center; gap: 3px; }
        .pf-label .req { color: #ef4444; font-size: 13px; line-height: 1; }
        .pf-input, .pf-select, .pf-textarea { width: 100%; padding: 9px 13px; border: 1.5px solid #d1d5db; border-radius: 7px; font-size: 13.5px; color: #1f2937; background: #ffffff; outline: none; box-sizing: border-box; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
        .pf-input:focus, .pf-select:focus, .pf-textarea:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
        .pf-input-error { border-color: #ef4444 !important; background: #fef2f2 !important; }
        .pf-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; cursor: pointer; }
        .pf-section { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px 22px; margin-bottom: 14px; }
        .pf-section-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 18px; display: flex; align-items: center; gap: 7px; }
        .pf-section-title::before { content: ''; display: inline-block; width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; }
        .pf-btn-save { background: #2563eb; color: #fff; border: none; border-radius: 7px; padding: 10px 24px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
        .pf-btn-save:hover { background: #1d4ed8; }
        .pf-btn-reset { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 7px; padding: 10px 24px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
        .pf-btn-reset:hover { background: #e5e7eb; }
        .pf-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
        .pf-table th { color: #6b7280; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; padding: 10px 14px; border-bottom: 1px solid #e5e7eb; text-align: left; white-space: nowrap; background: #f9fafb; }
        .pf-table td { padding: 11px 14px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; color: #1f2937; }
        .pf-table tr:last-child td { border-bottom: none; }
        .pf-table tr:hover td { background: #f9fafb; }
        .pf-table tr.row-alert-out td { background: #fff5f5; }
        .pf-table tr.row-alert-low td { background: #fffdf0; }
        .pf-btn-edit { background: #f59e0b; color: #fff; border: none; border-radius: 6px; padding: 5px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
        .pf-btn-edit:hover { background: #d97706; }
        .pf-btn-delete { background: #ef4444; color: #fff; border: none; border-radius: 6px; padding: 5px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; margin-left: 6px; }
        .pf-btn-delete:hover { background: #dc2626; }
        .pf-btn-stockin { background: #16a34a; color: #fff; border: none; border-radius: 6px; padding: 5px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; }
        .pf-btn-stockin:hover { background: #15803d; }
        .pf-btn-stockout { background: #f97316; color: #fff; border: none; border-radius: 6px; padding: 5px 14px; font-size: 12.5px; font-weight: 700; cursor: pointer; margin-left: 6px; }
        .pf-btn-stockout:hover { background: #ea580c; }
        .pf-btn-damage { background: #fff; color: #b91c1c; border: 1px solid #fca5a5; border-radius: 7px; padding: 9px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
        .pf-btn-damage:hover { background: #fef2f2; }
        .pf-chip { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .pf-chip:hover { background: #dbeafe; }
        .pf-stockin-row td { background: #f0f9ff; padding: 10px 14px; }
        .pf-editing-bar { background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 9px 14px; font-size: 13px; color: #92400e; font-weight: 600; display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
        .pf-editing-bar button { margin-left: auto; background: none; border: 1px solid #fbbf24; border-radius: 5px; padding: 2px 10px; font-size: 12px; cursor: pointer; color: #92400e; font-weight: 600; }
        .pf-error { background: #fee2e2; border: 1px solid #fca5a5; color: #991b1b; border-radius: 8px; padding: 10px 16px; font-size: 13px; margin-bottom: 14px; }
        .pf-stock-alert { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 10px 16px; font-size: 13px; margin-bottom: 14px; color: #92400e; white-space: pre-line; position: relative; }
        .pf-stock-alert-close { position: absolute; top: 8px; right: 12px; background: none; border: none; font-size: 17px; cursor: pointer; color: #92400e; line-height: 1; }
        .pf-empty { text-align: center; padding: 36px; color: #9ca3af; font-size: 13.5px; }
        .pf-grid-3 { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 16px; }
        .pf-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 768px) { .pf-grid-3, .pf-grid-4 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .pf-grid-3, .pf-grid-4 { grid-template-columns: 1fr; } }
        .pf-btn-add { background: #2563eb; color: #fff; border: none; border-radius: 7px; padding: 9px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
        .pf-btn-add:hover { background: #1d4ed8; }
        .pf-btn-back { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 7px; padding: 9px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .pf-btn-back:hover { background: #e5e7eb; }
        .pf-toast { position: fixed; top: 20px; right: 20px; background: #16a34a; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 13.5px; font-weight: 600; box-shadow: 0 6px 16px rgba(0,0,0,0.15); z-index: 1000; animation: pf-toast-in 0.2s ease-out; }
        @keyframes pf-toast-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
        .pf-page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .pf-page-title { font-size: 24px; font-weight: 700; color: #111827; margin: 0; }
        .pf-header-actions { display: flex; gap: 10px; flex-wrap: wrap; }
        .pf-grid-stock2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .pf-grid-stock3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
        @media (max-width: 768px) { .pf-grid-stock3 { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) {
          .pf-grid-stock2, .pf-grid-stock3 { grid-template-columns: 1fr; }
          .pf-page-title { font-size: 20px; }
          .pf-header-actions { width: 100%; }
          .pf-header-actions button { flex: 1 1 auto; justify-content: center; }
          .pf-section { padding: 14px 16px; }
          .pf-toast { left: 12px; right: 12px; top: 12px; }
        }
        .pf-editing-bar { flex-wrap: wrap; }
        @media (max-width: 700px) {
          .pf-table thead { display: none; }
          .pf-table, .pf-table tbody, .pf-table tr { display: block; width: 100%; }
          .pf-table tr { margin-bottom: 12px; border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; }
          .pf-table tr.row-alert-out { background: #fff5f5; }
          .pf-table tr.row-alert-low { background: #fffdf0; }
          .pf-table td { display: flex; justify-content: space-between; align-items: center; text-align: right; padding: 8px 14px; border-bottom: 1px solid #f3f4f6; gap: 10px; }
          .pf-table tr td:last-child { border-bottom: none; }
          .pf-table td::before { content: attr(data-label); font-weight: 700; font-size: 10.5px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px; text-align: left; flex-shrink: 0; }
          .pf-table td.pf-td-index { display: none; }
          .pf-table td.pf-td-name { display: block; text-align: left; padding: 12px 14px 8px; }
          .pf-table td.pf-td-name::before { content: none; }
          .pf-table td.pf-td-actions { display: flex; flex-wrap: wrap; justify-content: flex-start; gap: 6px; padding: 10px 14px; }
          .pf-table td.pf-td-actions::before { content: none; }
          .pf-table td.pf-td-actions button { flex: 1 1 calc(50% - 6px); margin-left: 0 !important; }
          .pf-stockin-row td { display: block !important; padding: 10px 14px !important; }
          .pf-stockin-row td::before { content: none; }
        }
      `}</style>

      {successMsg && <div className="pf-toast">{successMsg}</div>}

      <div className="pf-page-header">
        <h2 className="pf-page-title">🗂️ Products</h2>
        {!showForm && !showDamageLog ? (
          <div className="pf-header-actions">
            <button className="pf-btn-add" onClick={openAddForm}>
              + Add Product
            </button>
            {isAdmin && (
              <button className="pf-btn-damage" onClick={openDamageLog}>
                🗑️ Damage
              </button>
            )}
          </div>
        ) : (
          <div className="pf-header-actions">
            <button
              className="pf-btn-back"
              onClick={showForm ? cancelEdit : closeDamageLog}
            >
              ← Back
            </button>
          </div>
        )}
      </div>

      {stockAlert && (
        <div className="pf-stock-alert">
          <strong>⚠️ Stock Alert</strong>
          <br />
          {stockAlert}
          <button
            className="pf-stock-alert-close"
            onClick={() => setStockAlert("")}
            title="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {error && <div className="pf-error">{error}</div>}

      {editingId !== null && (
        <div className="pf-editing-bar">
          ✏️ Editing:{" "}
          <strong>
            {products.find((p) => p.id === editingId)?.productName}
          </strong>
          <button onClick={cancelEdit}>Cancel</button>
        </div>
      )}

      {showForm && (
      <form onSubmit={handleSubmit}>
        <div className="pf-section">
          <div className="pf-section-title">Product Information</div>
          <div className="pf-grid-3" style={{ marginBottom: 16 }}>
            <div className="pf-field">
              <label className="pf-label">
                Product Name <span className="req">*</span>
              </label>
              <input
                className={`pf-input ${error?.includes("already exists") ? "pf-input-error" : ""}`}
                name="productName"
                value={form.productName}
                onChange={handleChange}
                placeholder="e.g. Chain Link Fence Roll"
                required
              />
              {error?.includes("already exists") && (
                <span style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>
                  ⚠️ This product name already exists in this branch
                </span>
              )}
            </div>
            <div className="pf-field">
              <label className="pf-label">HSN</label>
              <input
                className="pf-input"
                name="hsn"
                value={form.hsn}
                onChange={handleChange}
                placeholder="e.g. PRD-001"
              />
            </div>
            <div className="pf-field">
              <label className="pf-label">Date</label>
              <input
                type="date"
                className="pf-input"
                name="productDate"
                value={form.productDate}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="pf-grid-4">
            <div className="pf-field">
              <label className="pf-label">Unit</label>
              <select
                className="pf-select"
                name="unit"
                value={form.unit}
                onChange={handleChange}
              >
                {["Pcs", "Kg", "Meter", "Roll", "Box", "Set", "Liter", "Ton"].map(
                  (u) => (
                    <option key={u}>{u}</option>
                  ),
                )}
              </select>
            </div>
            <div className="pf-field">
              <label className="pf-label">Factory Price (INR)</label>
              <input
                type="number"
                className="pf-input"
                name="factoryPrice"
                value={form.factoryPrice}
                onChange={handleChange}
                onWheel={(e) => e.target.blur()}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            <div className="pf-field">
              <label className="pf-label">Selling Price (INR)</label>
              <input
                type="number"
                className="pf-input"
                name="sellingPrice"
                value={form.sellingPrice}
                onChange={handleChange}
                onWheel={(e) => e.target.blur()}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="pf-section">
          <div className="pf-section-title">Stock Information</div>
          <div
            className={editingId !== null ? "pf-grid-stock3" : "pf-grid-stock2"}
            style={{ marginBottom: 16 }}
          >
            <div className="pf-field">
              <label className="pf-label">Current Stock Qty</label>
              {(() => {
                const extra = Number(addStockQty) || 0;
                const base = Number(form.stockQty) || 0;
                const total =
                  editingId !== null && extra > 0 ? base + extra : base;
                const display =
                  editingId !== null && extra > 0 ? total : form.stockQty;
                const hasAdded = editingId !== null && extra > 0;
                const isOut = total === 0 && form.stockQty !== "";
                const isLow =
                  total > 0 &&
                  total <= Number(form.minStock) &&
                  form.minStock !== "";
                return (
                  <input
                    type="number"
                    className="pf-input"
                    name="stockQty"
                    value={display}
                    onChange={hasAdded ? undefined : handleChange}
                    readOnly={hasAdded}
                    onWheel={(e) => e.target.blur()}
                    placeholder="e.g. 100"
                    min="0"
                    style={
                      hasAdded
                        ? {
                            borderColor: "#22c55e",
                            background: "#f0fdf4",
                            fontWeight: 700,
                            color: "#15803d",
                            cursor: "default",
                          }
                        : isOut
                          ? { borderColor: "#ef4444", background: "#fff5f5" }
                          : isLow
                            ? { borderColor: "#f59e0b", background: "#fffdf0" }
                            : {}
                    }
                  />
                );
              })()}
            </div>
            {editingId !== null && (
              <div className="pf-field">
                <label className="pf-label" style={{ color: "#2563eb" }}>
                  ➕ Add Stock Qty
                </label>
                <input
                  type="number"
                  className="pf-input"
                  value={addStockQty}
                  onChange={(e) => setAddStockQty(e.target.value)}
                  onWheel={(e) => e.target.blur()}
                  placeholder="e.g. 50"
                  min="0"
                  style={{ borderColor: "#3b82f6", background: "#eff6ff" }}
                />
              </div>
            )}
            <div className="pf-field">
              <label className="pf-label">Minimum Stock Alert</label>
              <input
                type="number"
                className="pf-input"
                name="minStock"
                value={form.minStock}
                onChange={handleChange}
                onWheel={(e) => e.target.blur()}
                placeholder="e.g. 10"
                min="0"
              />
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                Alert triggers when stock ≤ this value
              </span>
            </div>
          </div>
          <div className="pf-field">
            <label className="pf-label">Description</label>
            <textarea
              className="pf-textarea"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="Product description, specifications, notes..."
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
          <button type="submit" className="pf-btn-save">
            {editingId !== null ? "✓ Update Product" : "+ Save Product"}
          </button>
          <button type="button" className="pf-btn-reset" onClick={cancelEdit}>
            ↺ Reset
          </button>
        </div>
      </form>
      )}

      {!showForm && !showDamageLog && (
      <div className="pf-section" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
            📋 Product Catalog
          </span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {loading
              ? "Loading…"
              : `${products.length} product${products.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="pf-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Date</th>
                <th>Factory Price (INR)</th>
                <th>Price (INR)</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="pf-empty">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="pf-empty">
                    No products yet. Add your first product above.
                  </td>
                </tr>
              ) : (
                products.map((p, i) => {
                  const qty = Number(p.stockQty),
                    min = Number(p.minStock);
                  const rowClass =
                    qty === 0
                      ? "row-alert-out"
                      : qty <= min && min > 0
                        ? "row-alert-low"
                        : "";
                  return (
                    <Fragment key={p.id}>
                    <tr className={rowClass}>
                      <td
                        className="pf-td-index"
                        style={{ color: "#6b7280", fontWeight: 600 }}
                      >
                        {i + 1}
                      </td>
                      <td className="pf-td-name">
                        <div style={{ fontWeight: 600 }}>{p.productName}</div>
                        {p.description && (
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            {p.description.substring(0, 40)}
                            {p.description.length > 40 ? "…" : ""}
                          </div>
                        )}
                      </td>
                      <td data-label="Date">
                        {p.productDate
                          ? new Date(p.productDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td data-label="Factory Price">
                        {Number(p.factoryPrice || 0).toFixed(2)}
                      </td>
                      <td data-label="Price" style={{ fontWeight: 600 }}>
                        {Number(p.sellingPrice).toFixed(2)}
                      </td>
                      <td data-label="Stock">
                        {stockBadge(p.stockQty, p.minStock)}
                      </td>
                      <td className="pf-td-actions" data-label="Actions">
                        {isAdmin ? (
                          <>
                            <button
                              className="pf-btn-stockin"
                              onClick={() =>
                                stockInOpenId === p.id
                                  ? cancelStockIn()
                                  : openStockIn(p.id)
                              }
                            >
                              Stock In
                            </button>
                            <button
                              className="pf-btn-stockout"
                              onClick={() => handleStockOut(p)}
                            >
                              Stock Out
                            </button>
                            <button
                              className="pf-btn-edit"
                              onClick={() => handleEdit(p)}
                            >
                              Edit
                            </button>
                            <button
                              className="pf-btn-delete"
                              onClick={() => handleDelete(p.id)}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: 12, color: "#9ca3af" }}>
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                    {stockInOpenId === p.id && (
                      <tr className="pf-stockin-row">
                        <td colSpan={7}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              flexWrap: "wrap",
                            }}
                          >
                            <span style={{ fontSize: 12.5, fontWeight: 600, color: "#1d4ed8" }}>
                              ➕ Add stock for <strong>{p.productName}</strong>:
                            </span>
                            <input
                              type="number"
                              className="pf-input"
                              style={{ width: 110, padding: "6px 10px" }}
                              value={stockInQty}
                              onChange={(e) => setStockInQty(e.target.value)}
                              onWheel={(e) => e.target.blur()}
                              placeholder="Qty"
                              min="1"
                              autoFocus
                            />
                            {[10, 50, 100, 500].map((q) => (
                              <button
                                key={q}
                                type="button"
                                className="pf-chip"
                                onClick={() => setStockInQty(String(q))}
                              >
                                +{q}
                              </button>
                            ))}
                            <button
                              type="button"
                              className="pf-btn-save"
                              style={{ padding: "6px 16px" }}
                              onClick={() => confirmStockIn(p.id)}
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              className="pf-btn-reset"
                              style={{ padding: "6px 16px" }}
                              onClick={cancelStockIn}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {showDamageLog && (
      <div className="pf-section" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
            🗑️ Damage Log
          </span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>
            {damageLoading
              ? "Loading…"
              : `${damageLog.length} record${damageLog.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="pf-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product Name</th>
                <th>Date of Damage</th>
                <th>Total Stock</th>
                <th>Damaged Qty</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {damageLoading ? (
                <tr>
                  <td colSpan={6} className="pf-empty">
                    Loading damage log...
                  </td>
                </tr>
              ) : damageLog.length === 0 ? (
                <tr>
                  <td colSpan={6} className="pf-empty">
                    No damage records yet.
                  </td>
                </tr>
              ) : (
                damageLog.map((d, i) => (
                  <Fragment key={d.id}>
                  <tr>
                    <td
                      className="pf-td-index"
                      style={{ color: "#6b7280", fontWeight: 600 }}
                    >
                      {i + 1}
                    </td>
                    <td className="pf-td-name" style={{ fontWeight: 600 }}>
                      {d.productName}
                    </td>
                    <td data-label="Date">
                      {d.damageDate
                        ? new Date(d.damageDate).toLocaleDateString()
                        : "—"}
                    </td>
                    <td data-label="Total Stock">{d.stockQty}</td>
                    <td data-label="Damaged Qty">
                      <span style={badge("red")}>{d.qty}</span>
                    </td>
                    <td className="pf-td-actions" data-label="Actions">
                      {isAdmin ? (
                        <>
                          <button
                            className="pf-btn-edit"
                            onClick={() =>
                              editingDamageId === d.id
                                ? cancelDamageEdit()
                                : openDamageEdit(d)
                            }
                          >
                            {editingDamageId === d.id ? "Close" : "Edit"}
                          </button>
                          <button
                            className="pf-btn-delete"
                            onClick={() => handleDamageDelete(d.id)}
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                  {editingDamageId === d.id && (
                    <tr className="pf-stockin-row">
                      <td colSpan={6}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "#1d4ed8",
                            }}
                          >
                            ✏️ Edit damage record for{" "}
                            <strong>{d.productName}</strong>:
                          </span>
                          <input
                            type="date"
                            className="pf-input"
                            style={{ width: 150, padding: "6px 10px" }}
                            value={damageEditForm.damageDate}
                            onChange={(e) =>
                              setDamageEditForm({
                                ...damageEditForm,
                                damageDate: e.target.value,
                              })
                            }
                          />
                          <input
                            type="number"
                            className="pf-input"
                            style={{ width: 110, padding: "6px 10px" }}
                            value={damageEditForm.qty}
                            onChange={(e) =>
                              setDamageEditForm({
                                ...damageEditForm,
                                qty: e.target.value,
                              })
                            }
                            onWheel={(e) => e.target.blur()}
                            placeholder="Qty"
                            min="1"
                          />
                          <button
                            type="button"
                            className="pf-btn-save"
                            style={{ padding: "6px 16px" }}
                            onClick={() => saveDamageEdit(d.id)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="pf-btn-reset"
                            style={{ padding: "6px 16px" }}
                            onClick={cancelDamageEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </>
  );
}

function badge(color) {
  const map = {
    green: { background: "#d1fae5", color: "#065f46" },
    yellow: { background: "#fef3c7", color: "#92400e" },
    red: { background: "#fee2e2", color: "#991b1b" },
  };
  return {
    ...map[color],
    display: "inline-block",
    borderRadius: 20,
    padding: "3px 10px",
    fontSize: 12,
    fontWeight: 700,
  };
}
