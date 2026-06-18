import React, { useState, useEffect } from "react";
import { apiFetch } from "../utils/api";

const safeFetchJSON = async (path, options = {}) => {
  const response = await apiFetch(path, options);

  const text = await response.text();

  console.log("🔵 Raw response:", text.substring(0, 200));

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON response: ${text.substring(0, 300)}`);
  }
};

export default function PurchaseInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [selectedProduct, setSelectedProduct] = useState("");
  const [deductQty, setDeductQty] = useState("");
  const [deductNote, setDeductNote] = useState("");
  const [deductDate, setDeductDate] = useState(() => {
    const now = new Date();
    const tz = now.getTimezoneOffset() * 60000;
    return new Date(now - tz).toISOString().slice(0, 16);
  });
  const [branchSelected, setBranchSelected] = useState(true);

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
      const data = await safeFetchJSON(
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
      if (token) params.append("token", token);
      const data = await safeFetchJSON(
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
    try {
      const data = await safeFetchJSON("/deduct_stock.php", {
        method: "POST",
        body: JSON.stringify({
          product_id: selectedProduct,
          deduct_qty: qty,
          note: deductNote,
          deducted_at: deductDate ? deductDate.replace("T", " ") : "",
        }),
      });
      if (data.error) throw new Error(data.error);
      alert(`Stock deducted. New stock: ${data.new_stock}`);
      setDeductQty("");
      setDeductNote("");
      fetchProducts();
      fetchHistory();
    } catch (err) {
      setError(err.message);
    }
  };

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

      <div className="card deduction-card">
        <h3>
          <i className="bi bi-arrow-down-circle"></i> Deduct Stock
        </h3>
        {!branchSelected && (
          <div className="info-message">
            <i className="bi bi-info-circle me-2"></i>
            To deduct stock, please select a specific branch from the topbar
            (e.g., Branch A, Branch B, or Branch C).
          </div>
        )}
        <div className="deduction-grid">
          <div className="form-group">
            <label>Select Product</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={!branchSelected}
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.product_id} value={p.product_id}>
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
                  step="any"
                  value={deductQty}
                  onChange={(e) => setDeductQty(e.target.value)}
                  placeholder="e.g., 5"
                  disabled={!branchSelected}
                />
              </div>
              <div className="form-group">
                <label>Date &amp; Time</label>
                <input
                  type="datetime-local"
                  value={deductDate}
                  onChange={(e) => setDeductDate(e.target.value)}
                  disabled={!branchSelected}
                />
              </div>
              <div className="form-group">
                <label>Reason / Note</label>
                <input
                  type="text"
                  value={deductNote}
                  onChange={(e) => setDeductNote(e.target.value)}
                  placeholder="Optional (e.g., issued to site)"
                  disabled={!branchSelected}
                />
              </div>
            </>
          )}
        </div>
        {error && <div className="error-message">{error}</div>}
        <div className="action-row">
          <button
            className="deduct-btn"
            onClick={handleDeduct}
            disabled={!branchSelected}
          >
            <i className="bi bi-dash-circle"></i> Deduct Stock
          </button>
        </div>
      </div>

      <div className="card inventory-card">
        <h3>
          <i className="bi bi-list-ul"></i> Product Inventory
        </h3>
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
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : error && !branchSelected ? (
          <div className="info-message" style={{ textAlign: "center" }}>
            <i className="bi bi-building me-2"></i>
            Viewing all branches. Select a specific branch from the topbar to
            see branch-wise stock.
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product ID</th>
                  <th>Product Name</th>
                  <th>Total Purchased</th>
                  <th>Current Stock</th>
                  <th>Avg. Rate (₹)</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty">
                      No products found
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p.product_id}>
                      <td>{p.product_id}</td>
                      <td>{p.product_name}</td>
                      <td>{parseFloat(p.total_purchased).toLocaleString()}</td>
                      <td>{parseFloat(p.current_stock).toLocaleString()}</td>
                      <td>₹ {parseFloat(p.rate).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
          <table className="data-table">
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
                    <td>{h.deducted_at}</td>
                    <td>{h.product_id}</td>
                    <td>{h.product_name || "—"}</td>
                    <td>{parseFloat(h.deducted_qty).toLocaleString()}</td>
                    <td>{h.note || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .inventory-page { color: #0f172a; }
        .page-header { padding-bottom: 24px; border-bottom: 1px solid #d9e1ea; margin-bottom: 28px; }
        .page-header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 800; }
        .card { background: #fff; border: 1px solid #dbe3ec; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
        .card h3 { margin: 0 0 20px; display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; }
        .card h3 i { color: #8250df; }
        .deduction-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .filter-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 14px; font-weight: 700; }
        .form-group input, .form-group select { height: 44px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; font-size: 14px; background: #fff; }
        .action-row { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; margin-bottom: 16px; }
        .deduct-btn { background: #dc2626; color: #fff; border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .deduct-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .search-row { display: flex; gap: 10px; margin-bottom: 16px; }
        .search-row input { flex: 1; height: 44px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; font-size: 14px; }
        .search-btn, .clear-btn { border: none; border-radius: 8px; padding: 10px 18px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
        .search-btn { background: #8250df; color: #fff; }
        .clear-btn { background: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; }
        .error-message, .info-message { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 16px; color: #dc2626; margin-top: 16px; }
        .info-message { background: #fff3cd; border-color: #ffeeba; color: #856404; padding: 12px 16px; border-radius: 8px; margin-bottom: 16px; }
        .loading-text { text-align: center; padding: 20px; color: #64748b; }
        .table-wrap { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .data-table th { background: #f8fafc; font-weight: 800; }
        .empty { text-align: center; padding: 28px; color: #64748b; }
        @media (max-width: 900px) { .filter-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
