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

export default function PurchaseInventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [deductQty, setDeductQty] = useState("");
  const [deductNote, setDeductNote] = useState("");
  const [branchSelected, setBranchSelected] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/get_inventory_products.php`, {
        headers: getHeaders(),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to fetch inventory");
      }
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
      // Check if branch is selected – if response includes error about no branch, handle it
      if (data.error && data.error.includes("No branch selected")) {
        setBranchSelected(false);
        setError(
          "Please select a specific branch from the topbar to manage stock.",
        );
      } else {
        setBranchSelected(true);
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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
      const res = await fetch(`${API_BASE}/deduct_stock.php`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          product_id: selectedProduct,
          deduct_qty: qty,
          note: deductNote,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Deduction failed");
      }
      alert(`Stock deducted. New stock: ${data.new_stock}`);
      setDeductQty("");
      setDeductNote("");
      fetchProducts();
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

      {/* Product Selection & Deduction */}
      <div className="card deduction-card">
        <h3>
          <i className="bi bi-arrow-down-circle"></i> Deduct Stock
        </h3>
        {!branchSelected && (
          <div
            className="info-message"
            style={{
              background: "#fff3cd",
              border: "1px solid #ffeeba",
              borderRadius: 8,
              padding: "12px 16px",
              marginBottom: 16,
              color: "#856404",
            }}
          >
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

      {/* Inventory List */}
      <div className="card inventory-card">
        <h3>
          <i className="bi bi-list-ul"></i> Product Inventory
        </h3>
        {loading ? (
          <p className="loading-text">Loading...</p>
        ) : error && !branchSelected ? (
          <div
            className="info-message"
            style={{ textAlign: "center", padding: 28, color: "#856404" }}
          >
            <i className="bi bi-building me-2"></i>
            Viewing all branches. Select a specific branch from the topbar to
            see branch‑wise stock.
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

      <style>{`
        .inventory-page { color: #0f172a; }
        .page-header { padding-bottom: 24px; border-bottom: 1px solid #d9e1ea; margin-bottom: 28px; }
        .page-header h1 { margin: 0 0 8px; font-size: 28px; font-weight: 800; }
        .card { background: #fff; border: 1px solid #dbe3ec; border-radius: 12px; padding: 24px; margin-bottom: 28px; }
        .card h3 { margin: 0 0 20px; display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; }
        .card h3 i { color: #8250df; }
        .deduction-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 8px; }
        .form-group label { font-size: 14px; font-weight: 700; }
        .form-group input, .form-group select { height: 44px; border: 1px solid #cbd5e1; border-radius: 8px; padding: 0 12px; font-size: 14px; background: #fff; }
        .action-row { display: flex; justify-content: flex-end; }
        .deduct-btn { background: #dc2626; color: #fff; border: none; border-radius: 8px; padding: 10px 22px; font-size: 14px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .deduct-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .error-message, .info-message { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 10px 16px; color: #dc2626; margin-top: 16px; }
        .info-message { background: #fff3cd; border-color: #ffeeba; color: #856404; }
        .loading-text { text-align: center; padding: 20px; color: #64748b; }
        .table-wrap { overflow-x: auto; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 12px 14px; text-align: left; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
        .data-table th { background: #f8fafc; font-weight: 800; }
        .empty { text-align: center; padding: 28px; color: #64748b; }
      `}</style>
    </div>
  );
}
