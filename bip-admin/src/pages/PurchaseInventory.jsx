import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

const safeFetchJSON = async (path, options = {}) => {
  const response = await apiFetch(path, options);
  const text = await response.text();
  try {
    const data = JSON.parse(text);
    return { ok: response.ok, status: response.status, data };
  } catch {
    throw new Error(`Invalid JSON response: ${text.substring(0, 300)}`);
  }
};

// Read the logged-in user saved at login time.
// NOTE: change "user" if your app stores it under a different key.
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) || {};
  } catch {
    return {};
  }
};

export default function PurchaseInventory() {
  const storedUser = getStoredUser();
  const isAdmin = storedUser?.role === "admin";

  // ── Tabs: "inventory" | "history" ─────────────────────────
  const [activeTab, setActiveTab] = useState("inventory");

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Deduct panel (collapsed by default)
  const [showDeduct, setShowDeduct] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [deductQty, setDeductQty] = useState("");
  const [deductNote, setDeductNote] = useState("");
  const [deductDate, setDeductDate] = useState(() => {
    const now = new Date();
    const tz = now.getTimezoneOffset() * 60000;
    return new Date(now - tz).toISOString().slice(0, 16);
  });
  const [branchSelected, setBranchSelected] = useState(true);

  // Inline "set low stock alert" editor
  const [alertEditKey, setAlertEditKey] = useState(null); // `${product_id}_${branch_id}`
  const [alertValue, setAlertValue] = useState("");

  const [history, setHistory] = useState([]);
  const [historySearch, setHistorySearch] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");

  const fetchProducts = async (searchTerm = search) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      const { data } = await safeFetchJSON(
        `/get_inventory_products.php?${params.toString()}`,
      );
      if (data.error && data.error.includes("No branch selected")) {
        setBranchSelected(false);
        setError(
          "Please select a specific branch from the topbar to manage stock.",
        );
        setProducts([]);
        return;
      }
      setProducts(Array.isArray(data) ? data : []);
      setBranchSelected(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load inventory");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (historySearch) params.append("search", historySearch);
      if (historyFrom) params.append("date_from", historyFrom);
      if (historyTo) params.append("date_to", historyTo);
      const { data } = await safeFetchJSON(
        `/get_stock_deductions.php?${params.toString()}`,
      );
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchHistory();
  }, []);

  const handleSearch = () => fetchProducts(search);
  const clearSearch = () => {
    setSearch("");
    fetchProducts("");
  };
  const handleHistorySearch = () => fetchHistory();
  const clearHistoryFilters = () => {
    setHistorySearch("");
    setHistoryFrom("");
    setHistoryTo("");
    fetchHistory();
  };

  const handleDeduct = async () => {
    if (!branchSelected) {
      setError(
        "Please select a specific branch from the topbar to deduct stock.",
      );
      return;
    }
    if (!selectedProduct) {
      setError("Select a product first");
      return;
    }
    const qty = parseFloat(deductQty);
    if (isNaN(qty) || qty <= 0) {
      setError("Enter a valid deduction quantity");
      return;
    }
    // Frontend guard: never allow deduction beyond available stock
    const prod = products.find((p) => p.product_id === selectedProduct);
    if (prod && qty > parseFloat(prod.current_stock)) {
      setError(
        `Cannot deduct ${qty}. Only ${parseFloat(prod.current_stock)} in stock — stock cannot go below 0.`,
      );
      return;
    }
    try {
      const { ok, data } = await safeFetchJSON("/deduct_stock.php", {
        method: "POST",
        body: JSON.stringify({
          product_id: selectedProduct,
          deduct_qty: qty,
          note: deductNote,
          deducted_at: deductDate ? deductDate.replace("T", " ") : "",
        }),
      });
      if (!ok || data.error) throw new Error(data.error || "Deduction failed");
      alert(`Stock deducted. New stock: ${data.new_stock}`);
      setDeductQty("");
      setDeductNote("");
      setError("");
      setShowDeduct(false);
      fetchProducts();
      fetchHistory();
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Set low stock alert ───────────────────────────────────
  const rowKey = (p) => `${p.product_id}_${p.branch_id}`;

  const openAlertEdit = (p) => {
    setAlertEditKey(rowKey(p));
    setAlertValue(
      parseFloat(p.min_stock) > 0 ? String(parseFloat(p.min_stock)) : "",
    );
  };

  const saveAlert = async (p) => {
    const val = parseFloat(alertValue);
    if (isNaN(val) || val < 0) {
      alert("Enter a valid alert level (0 removes the alert)");
      return;
    }
    try {
      const { ok, data } = await safeFetchJSON("/set_low_stock.php", {
        method: "POST",
        body: JSON.stringify({
          product_id: p.product_id,
          branch_id: p.branch_id,
          min_stock: val,
        }),
      });
      if (!ok || data.error) throw new Error(data.error || "Failed");
      setAlertEditKey(null);
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Admin: delete product ─────────────────────────────────
  const deleteProduct = async (p) => {
    if (
      !window.confirm(
        `Delete "${p.product_name}" (ID: ${p.product_id}) from inventory?\nBill history and deduction history will be kept.`,
      )
    )
      return;
    try {
      const { ok, data } = await safeFetchJSON("/delete_stock_product.php", {
        method: "POST",
        body: JSON.stringify({
          product_id: p.product_id,
          branch_id: p.branch_id,
        }),
      });
      if (!ok || data.error) throw new Error(data.error || "Delete failed");
      alert(data.message || "Product deleted");
      fetchProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const isLow = (p) => Number(p.is_low_stock) === 1;
  const lowCount = products.filter(isLow).length;

  const selectedProductData = products.find(
    (p) => p.product_id === selectedProduct,
  );

  return (
    <div className="inventory-page">
      <div className="page-header">
        <h1>
          <i
            className="bi bi-box-seam-fill me-2"
            style={{ color: "#8250df" }}
          ></i>
          Purchase Inventory
        </h1>
        <p>
          Manage product stock – view total purchased, current stock, and deduct
          usage
        </p>
      </div>

      {/* Low stock banner */}
      {lowCount > 0 && (
        <div className="low-banner">
          <i className="bi bi-exclamation-triangle-fill"></i>
          <b>{lowCount}</b> product{lowCount > 1 ? "s are" : " is"} at or below
          the low stock alert level — highlighted in red below.
        </div>
      )}

      {/* ── Section tabs ──────────────────────────────────── */}
      <div className="tab-bar">
        <button
          type="button"
          className={`tab-btn ${activeTab === "inventory" ? "active" : ""}`}
          onClick={() => setActiveTab("inventory")}
        >
          <i className="bi bi-list-ul"></i> Product Inventory
          {lowCount > 0 && <span className="tab-low-dot">{lowCount}</span>}
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <i className="bi bi-clock-history"></i> Stock Deduction History
        </button>
      </div>

      {/* ══════════ TAB 1: PRODUCT INVENTORY ══════════ */}
      {activeTab === "inventory" && (
        <div className="card inventory-card">
          <div className="card-top">
            <h3>
              <i className="bi bi-list-ul"></i> Product Inventory
            </h3>
            <button
              type="button"
              className={`deduct-toggle-btn ${showDeduct ? "open" : ""}`}
              onClick={() => setShowDeduct(!showDeduct)}
              disabled={!branchSelected}
              title={
                branchSelected
                  ? "Deduct stock"
                  : "Select a specific branch first"
              }
            >
              <i
                className={`bi ${showDeduct ? "bi-x-circle" : "bi-arrow-down-circle"}`}
              ></i>{" "}
              {showDeduct ? "Close" : "Deduct Stock"}
            </button>
          </div>

          {!branchSelected && (
            <div className="info-message">
              <i className="bi bi-building me-2"></i>
              Viewing all branches. Select a specific branch from the topbar
              (Branch A, B or C) to deduct stock.
            </div>
          )}

          {/* Collapsible Deduct Stock panel */}
          {showDeduct && branchSelected && (
            <div className="deduct-panel">
              <div className="deduction-grid">
                <div className="form-group">
                  <label>Select Product</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={rowKey(p)} value={p.product_id}>
                        {p.product_name} (ID: {p.product_id}) – Stock:{" "}
                        {p.current_stock}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedProductData && (
                  <>
                    <div className="form-group">
                      <label>Current Stock</label>
                      <input
                        type="text"
                        value={selectedProductData.current_stock}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Avg. Rate (₹)</label>
                      <input
                        type="text"
                        value={`₹ ${parseFloat(selectedProductData.rate).toFixed(2)}`}
                        readOnly
                      />
                    </div>
                    <div className="form-group">
                      <label>Quantity to Deduct *</label>
                      <input
                        type="number"
                        min="0"
                        max={selectedProductData.current_stock}
                        step="any"
                        value={deductQty}
                        onChange={(e) => setDeductQty(e.target.value)}
                        placeholder="e.g., 5"
                      />
                    </div>
                    <div className="form-group">
                      <label>Date &amp; Time</label>
                      <input
                        type="datetime-local"
                        value={deductDate}
                        onChange={(e) => setDeductDate(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Reason / Note</label>
                      <input
                        type="text"
                        value={deductNote}
                        onChange={(e) => setDeductNote(e.target.value)}
                        placeholder="Optional (e.g., issued to site)"
                      />
                    </div>
                  </>
                )}
              </div>
              <div className="action-row">
                <button className="deduct-btn" onClick={handleDeduct}>
                  <i className="bi bi-dash-circle"></i> Deduct Stock
                </button>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          {/* Search */}
          <div className="search-row">
            <input
              type="text"
              placeholder="Search by product name or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="search-btn" onClick={handleSearch}>
              <i className="bi bi-search"></i> Search
            </button>
            <button className="clear-btn" onClick={clearSearch}>
              <i className="bi bi-x-circle"></i> Clear
            </button>
          </div>

          {/* Inventory table */}
          {loading ? (
            <p className="loading-text">Loading...</p>
          ) : (
            <div className="table-wrap">
              <table className="data-table responsive-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Product Name</th>
                    {isAdmin && <th>Branch</th>}
                    <th>Total Purchased</th>
                    <th>Current Stock</th>
                    <th>Low Alert</th>
                    <th>Avg. Rate (₹)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} className="empty">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={rowKey(p)} className={isLow(p) ? "low-row" : ""}>
                        <td data-label="Product ID">{p.product_id}</td>
                        <td data-label="Product Name">
                          {p.product_name}
                          {isLow(p) && (
                            <span className="low-badge">
                              <i className="bi bi-exclamation-triangle-fill"></i>{" "}
                              LOW
                            </span>
                          )}
                        </td>
                        {isAdmin && (
                          <td data-label="Branch">{p.branch_name || "—"}</td>
                        )}
                        <td data-label="Total Purchased">
                          {parseFloat(p.total_purchased).toLocaleString()}
                        </td>
                        <td
                          data-label="Current Stock"
                          className={isLow(p) ? "low-stock-cell" : ""}
                        >
                          {parseFloat(p.current_stock).toLocaleString()}
                        </td>
                        <td data-label="Low Alert">
                          {alertEditKey === rowKey(p) ? (
                            <span className="alert-edit">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={alertValue}
                                onChange={(e) => setAlertValue(e.target.value)}
                                placeholder="e.g., 5"
                                autoFocus
                              />
                              <button
                                className="mini-btn ok"
                                onClick={() => saveAlert(p)}
                                title="Save alert level"
                              >
                                <i className="bi bi-check-lg"></i>
                              </button>
                              <button
                                className="mini-btn"
                                onClick={() => setAlertEditKey(null)}
                                title="Cancel"
                              >
                                <i className="bi bi-x-lg"></i>
                              </button>
                            </span>
                          ) : parseFloat(p.min_stock) > 0 ? (
                            <span className="alert-level">
                              ≤ {parseFloat(p.min_stock).toLocaleString()}
                            </span>
                          ) : (
                            <span className="alert-none">—</span>
                          )}
                        </td>
                        <td data-label="Avg. Rate (₹)">
                          ₹ {parseFloat(p.rate).toFixed(2)}
                        </td>
                        <td data-label="Actions">
                          <span className="row-actions">
                            <button
                              className="bell-btn"
                              onClick={() => openAlertEdit(p)}
                              title="Set low stock alert"
                            >
                              <i className="bi bi-bell"></i>
                            </button>
                            {isAdmin && (
                              <button
                                className="del-btn"
                                onClick={() => deleteProduct(p)}
                                title="Delete product (admin)"
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            )}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════ TAB 2: STOCK DEDUCTION HISTORY ══════════ */}
      {activeTab === "history" && (
        <div className="card history-card">
          <h3>
            <i className="bi bi-clock-history"></i> Stock Deduction History
          </h3>
          <div className="filter-grid">
            <div className="form-group">
              <label>Search Product</label>
              <input
                type="text"
                placeholder="Product name / ID"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>From Date</label>
              <input
                type="date"
                value={historyFrom}
                onChange={(e) => setHistoryFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>To Date</label>
              <input
                type="date"
                value={historyTo}
                onChange={(e) => setHistoryTo(e.target.value)}
              />
            </div>
          </div>
          <div className="action-row">
            <button className="search-btn" onClick={handleHistorySearch}>
              <i className="bi bi-search"></i> Search
            </button>
            <button className="clear-btn" onClick={clearHistoryFilters}>
              <i className="bi bi-x-circle"></i> Clear
            </button>
          </div>
          <div className="table-wrap">
            <table className="data-table responsive-table">
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Deducted Qty</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty">
                      No deduction records found
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id}>
                      <td data-label="Date/Time">{h.deducted_at}</td>
                      <td data-label="Product ID">{h.product_id}</td>
                      <td data-label="Product Name">{h.product_name || "—"}</td>
                      <td data-label="Deducted Qty">
                        {parseFloat(h.deducted_qty).toLocaleString()}
                      </td>
                      <td data-label="Note">{h.note || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style>{`
        .inventory-page { color: #0f172a; }
        .page-header { padding-bottom: 24px; border-bottom: 1px solid #d9e1ea; margin-bottom: 28px; }
        .page-header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 800; }
        .card { background: #fff; border: 1px solid #dbe3ec; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
        .card h3 { margin: 0; display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; }
        .card h3 i { color: #8250df; }
        .card-top { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .history-card h3 { margin-bottom: 20px; }

        .low-banner { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; border-radius: 10px; padding: 12px 16px; margin-bottom: 20px; display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
        .low-banner i { color: #dc2626; }

        /* ── Tabs ── */
        .tab-bar { display: flex; gap: 8px; margin-bottom: 20px; background: #f1f5f9; border: 1px solid #dbe3ec; border-radius: 12px; padding: 6px; }
        .tab-btn { flex: 1; border: none; background: transparent; color: #475569; border-radius: 8px; padding: 12px 16px; font-size: 15px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.15s; }
        .tab-btn:hover { color: #1e293b; }
        .tab-btn.active { background: #8250df; color: #fff; box-shadow: 0 2px 6px rgba(130,80,223,0.35); }
        .tab-btn.active i { color: #fff; }
        .tab-low-dot { background: #dc2626; color: #fff; border-radius: 999px; min-width: 20px; height: 20px; font-size: 11px; font-weight: 800; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; }

        .deduct-toggle-btn { background: #dc2626; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .deduct-toggle-btn.open { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; }
        .deduct-toggle-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .deduct-panel { background: #fdf9f9; border: 1px dashed #fecaca; border-radius: 10px; padding: 18px; margin-bottom: 20px; }
        .deduction-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 16px; }
        .filter-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 14px; font-weight: 700; }
        .form-group input, .form-group select { height: 44px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; font-size: 14px; background: #fff; }
        .action-row { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; margin-bottom: 16px; }
        .deduct-btn { background: #dc2626; color: #fff; border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .search-row { display: flex; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
        .search-row input { flex: 1; min-width: 180px; height: 44px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; font-size: 14px; }
        .search-btn, .clear-btn { border: none; border-radius: 8px; padding: 10px 18px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .search-btn { background: #8250df; color: #fff; }
        .clear-btn { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; }
        .error-message { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 16px; color: #dc2626; margin-bottom: 16px; }
        .info-message { background: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; }
        .loading-text { text-align: center; padding: 20px; color: #64748b; }
        .table-wrap { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .data-table th { background: #f8fafc; font-weight: 800; }
        .empty { text-align: center; padding: 28px; color: #64748b; }

        /* Low stock highlighting */
        .low-row { background: #fef2f2; }
        .low-row td { border-bottom-color: #fecaca; }
        .low-stock-cell { color: #dc2626; font-weight: 800; }
        .low-badge { background: #dc2626; color: #fff; border-radius: 999px; padding: 2px 8px; font-size: 10px; font-weight: 800; margin-left: 8px; display: inline-flex; align-items: center; gap: 4px; vertical-align: middle; }
        .alert-level { color: #b45309; font-weight: 700; font-size: 13px; }
        .alert-none { color: #94a3b8; }

        .alert-edit { display: inline-flex; gap: 6px; align-items: center; }
        .alert-edit input { width: 90px; height: 36px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 0 8px; font-size: 13px; }
        .mini-btn { background: #f1f5f9; border: 1px solid #cbd5e1; color: #475569; border-radius: 6px; width: 32px; height: 32px; cursor: pointer; }
        .mini-btn.ok { background: #ecfdf5; border-color: #a7f3d0; color: #166534; }

        .row-actions { display: inline-flex; gap: 6px; }
        .bell-btn { background: #fefce8; border: 1px solid #fde68a; color: #a16207; border-radius: 6px; width: 34px; height: 34px; cursor: pointer; }
        .del-btn { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 6px; width: 34px; height: 34px; cursor: pointer; }

        @media (max-width: 900px) { .filter-grid { grid-template-columns: 1fr; } }

        /* ── Mobile: stack tables into cards, no side scrolling ── */
        @media (max-width: 700px) {
          .card { padding: 16px; }
          .tab-bar { flex-direction: column; }
          .tab-btn { width: 100%; }
          .card-top { flex-direction: column; align-items: stretch; }
          .deduct-toggle-btn { width: 100%; justify-content: center; }

          .responsive-table thead { display: none; }
          .responsive-table, .responsive-table tbody, .responsive-table tr, .responsive-table td { display: block; width: 100%; }
          .responsive-table tr { border: 1px solid #e2e8f0; border-radius: 10px; margin-bottom: 12px; padding: 8px 12px; background: #fff; }
          .responsive-table tr.low-row { background: #fef2f2; border-color: #fecaca; }
          .responsive-table td { display: flex; justify-content: space-between; align-items: center; gap: 12px; border-bottom: 1px dashed #eef2f7; padding: 8px 0; }
          .responsive-table td:last-child { border-bottom: none; }
          .responsive-table td::before { content: attr(data-label); font-weight: 800; font-size: 12px; color: #475569; flex-shrink: 0; }
          .responsive-table td.empty { display: block; }
          .responsive-table td.empty::before { display: none; }
          .action-row { flex-direction: column; }
          .action-row button { width: 100%; justify-content: center; }
        }
      `}</style>
    </div>
  );
}