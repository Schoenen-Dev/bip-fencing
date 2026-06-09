import { useState, useEffect } from "react";

const API_URL = "http://localhost:8000/products.php";

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
  productName: "",
  sku: "",
  category: "",
  unit: "Pcs",
  sellingPrice: "",
  stockQty: "",
  minStock: "",
  description: "",
};

function mapFromDB(p) {
  return {
    id: p.id,
    productName: p.product_name,
    sku: p.sku,
    category: p.category,
    unit: p.unit,
    sellingPrice: p.selling_price,
    stockQty: p.stock_qty,
    minStock: p.min_stock,
    description: p.description,
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

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(API_URL, { headers: getHeaders() });
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      const loaded = data.map(mapFromDB);
      setProducts(loaded);

      // ── Stock alert check ──────────────────────────────────────────
      const outItems = loaded.filter((p) => Number(p.stockQty) === 0);
      const lowItems = loaded.filter(
        (p) =>
          Number(p.stockQty) > 0 &&
          Number(p.minStock) > 0 &&
          Number(p.stockQty) <= Number(p.minStock)
      );

      if (outItems.length > 0 || lowItems.length > 0) {
        const msgs = [];
        if (outItems.length)
          msgs.push(
            `🔴 Out of Stock: ${outItems.map((p) => p.productName).join(", ")}`
          );
        if (lowItems.length)
          msgs.push(
            `🟡 Low Stock: ${lowItems
              .map((p) => `${p.productName} (${p.stockQty} left)`)
              .join(", ")}`
          );
        setStockAlert(msgs.join("\n"));
      } else {
        setStockAlert("");
      }
      // ───────────────────────────────────────────────────────────────
    } catch (err) {
      setError("❌ Could not load products. Is PHP server running?");
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      let res;
      if (editingId !== null) {
        const extra = Number(addStockQty) || 0;
        const finalQty = Number(form.stockQty) + extra;
        res = await fetch(`${API_URL}?id=${editingId}`, {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({ ...form, stockQty: finalQty }),
        });
      } else {
        res = await fetch(API_URL, {
          method: "POST",
          headers: getHeaders(),
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError("❌ " + err.message);
    }
  };

  const handleEdit = (p) => {
    setForm({
      productName: p.productName,
      sku: p.sku,
      category: p.category,
      unit: p.unit,
      sellingPrice: p.sellingPrice,
      stockQty: p.stockQty,
      minStock: p.minStock,
      description: p.description,
    });
    setEditingId(p.id);
    setAddStockQty("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      const res = await fetch(`${API_URL}?id=${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Delete failed");
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
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
        .pf-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; cursor: pointer; }
        .pf-section { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 20px 22px; margin-bottom: 14px; }
        .pf-section-title { font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 18px; display: flex; align-items: center; gap: 7px; }
        .pf-section-title::before { content: ''; display: inline-block; width: 8px; height: 8px; background: #3b82f6; border-radius: 50%; }
        .pf-btn-save { background: #2563eb; color: #fff; border: none; border-radius: 7px; padding: 10px 24px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
        .pf-btn-save:hover { background: #1d4ed8; }
        .pf-btn-reset { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; border-radius: 7px; padding: 10px 24px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
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
      `}</style>

      <h2 style={{ fontSize: 24, fontWeight: 700, color: "#111827", marginBottom: 20 }}>
        🗂️ Products
      </h2>

      {/* ── Stock Alert Banner ───────────────────────────────────── */}
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
      {/* ─────────────────────────────────────────────────────────── */}

      {error && <div className="pf-error">{error}</div>}

      {editingId !== null && (
        <div className="pf-editing-bar">
          ✏️ Editing:{" "}
          <strong>{products.find((p) => p.id === editingId)?.productName}</strong>
          <button onClick={cancelEdit}>Cancel</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="pf-section">
          <div className="pf-section-title">Product Information</div>
          <div className="pf-grid-3" style={{ marginBottom: 16 }}>
            <div className="pf-field">
              <label className="pf-label">
                Product Name <span className="req">*</span>
              </label>
              <input
                className="pf-input"
                name="productName"
                value={form.productName}
                onChange={handleChange}
                placeholder="e.g. Chain Link Fence Roll"
                required
              />
            </div>
            <div className="pf-field">
              <label className="pf-label">SKU / Code</label>
              <input
                className="pf-input"
                name="sku"
                value={form.sku}
                onChange={handleChange}
                placeholder="e.g. PRD-001"
              />
            </div>
            <div className="pf-field">
              <label className="pf-label">Category</label>
              <input
                className="pf-input"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="e.g. Fencing"
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
                {["Pcs", "Kg", "Meter", "Roll", "Box", "Set", "Liter"].map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
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
            style={{
              display: "grid",
              gridTemplateColumns:
                editingId !== null ? "1fr 1fr 1fr" : "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
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
                <th>SKU</th>
                <th>Category</th>
                <th>Unit</th>
                <th>Price (INR)</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="pf-empty">
                    Loading products…
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="pf-empty">
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
                    <tr key={p.id} className={rowClass}>
                      <td style={{ color: "#6b7280", fontWeight: 600 }}>{i + 1}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.productName}</div>
                        {p.description && (
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>
                            {p.description.substring(0, 40)}
                            {p.description.length > 40 ? "…" : ""}
                          </div>
                        )}
                      </td>
                      <td style={{ color: "#6b7280", fontFamily: "monospace" }}>
                        {p.sku || "—"}
                      </td>
                      <td>{p.category}</td>
                      <td>{p.unit}</td>
                      <td style={{ fontWeight: 600 }}>
                        {Number(p.sellingPrice).toFixed(2)}
                      </td>
                      <td>{stockBadge(p.stockQty, p.minStock)}</td>
                      <td>
                        <button className="pf-btn-edit" onClick={() => handleEdit(p)}>
                          Edit
                        </button>
                        <button
                          className="pf-btn-delete"
                          onClick={() => handleDelete(p.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
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