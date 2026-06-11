import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:8000';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
};

const getInitials = (name = '') =>
  name.split(' ').slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';

const COLORS = ['primary', 'success', 'warning', 'info', 'danger', 'secondary'];
const colorFor = (id) => COLORS[id % COLORS.length];

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Status badge helper based on pending amount ───────────────
const getStatusBadge = (pending, totalBilled) => {
  if (Number(pending) <= 0) return { class: 'bg-success', label: 'Fully Paid' };
  if (Number(pending) >= Number(totalBilled)) return { class: 'bg-danger', label: 'Unpaid' };
  return { class: 'bg-warning', label: 'Partial' };
};

export default function Clients() {
  const [clients, setClients]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selected, setSelected]         = useState(null);
  const [clientDetail, setClientDetail] = useState(null); // invoices + payments for selected
  const [detailLoading, setDetailLoading] = useState(false);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTab, setActiveTab]       = useState('overview');

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm]           = useState({ amount: '', payment_date: '', note: '' });
  const [payLoading, setPayLoading]     = useState(false);

  // View invoice modal
  const [viewInvoice, setViewInvoice]   = useState(null); // full invoice object
  const [viewLoading, setViewLoading]   = useState(false);

  // ── Fetch all clients ─────────────────────────────────────────
  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/client.php`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setClients(data.clients);
        if (data.clients.length > 0 && !selected) {
          setSelected(data.clients[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  // ── Fetch single client detail when selected changes ─────────
  useEffect(() => {
    if (!selected) return;
    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const res = await fetch(`${API}/client.php?client_id=${selected.id}`, { headers: getHeaders() });
        const data = await res.json();
        if (data.success) setClientDetail(data);
      } catch (err) {
        console.error('Failed to fetch client detail:', err);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [selected]);

  // ── Fetch full invoice for View Bill ─────────────────────────
  const handleViewInvoice = async (invoice_no) => {
    setViewLoading(true);
    try {
      const res = await fetch(`${API}/client.php?invoice_no=${invoice_no}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setViewInvoice(data.invoice);
    } catch (err) {
      console.error('Failed to fetch invoice:', err);
    } finally {
      setViewLoading(false);
    }
  };

  // ── Record payment ────────────────────────────────────────────
  const handleRecordPayment = async () => {
    if (!payForm.amount || !payForm.payment_date) return alert('Amount and date required');
    setPayLoading(true);
    try {
      const res = await fetch(`${API}/client.php`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ client_id: selected.id, ...payForm }),
      });
      const data = await res.json();
      if (data.success) {
        setShowPayModal(false);
        setPayForm({ amount: '', payment_date: '', note: '' });
        // Refresh both lists
        fetchClients();
        setSelected((prev) => ({ ...prev })); // trigger detail reload
      } else {
        alert(data.message);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPayLoading(false);
    }
  };

  // ── WhatsApp helpers ──────────────────────────────────────────
  const sendInvoiceWhatsApp = () => {
    if (!selected || !clientDetail) return;
    const phone = selected.phone?.replace(/\D/g, '');
    const invoiceList = (clientDetail.invoices || [])
      .map((i) => `• ${i.invoice_no} | ${i.invoice_date} | ₹${fmt(i.net_amount)}`)
      .join('\n');
    const text = encodeURIComponent(
      `Dear ${selected.name},\n\nHere are your invoice details:\n${invoiceList}\n\nTotal Billed: ₹${fmt(clientDetail.total_billed)}\n\nThank you,\nBIP Fencing`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const sendPaymentReminder = () => {
    if (!selected || !clientDetail) return;
    const phone = selected.phone?.replace(/\D/g, '');
    const text = encodeURIComponent(
      `Dear ${selected.name},\n\nThis is a gentle payment reminder:\n\nTotal Billed: ₹${fmt(clientDetail.total_billed)}\nTotal Paid:   ₹${fmt(clientDetail.total_paid)}\nPending:      ₹${fmt(clientDetail.pending)}\n\nPlease clear the pending amount at your earliest convenience.\n\nThank you,\nBIP Fencing`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // ── Filtered clients ──────────────────────────────────────────
  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.gst?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q);
    const status = getStatusBadge(c.pending, c.total_billed).label.toLowerCase();
    const matchStatus = statusFilter ? status.includes(statusFilter) : true;
    return matchSearch && matchStatus;
  });

  // ── Summary stats ─────────────────────────────────────────────
  const totalBilled  = clients.reduce((s, c) => s + Number(c.total_billed || 0), 0);
  const totalPaid    = clients.reduce((s, c) => s + Number(c.total_paid   || 0), 0);
  const totalPending = clients.reduce((s, c) => s + Number(c.pending      || 0), 0);
  const paidPct      = totalBilled ? Math.round((totalPaid / totalBilled) * 100) : 0;
  const overdueCount = clients.filter((c) => Number(c.pending) >= Number(c.total_billed) && Number(c.total_billed) > 0).length;

  // ── View Invoice Modal ────────────────────────────────────────
  if (viewInvoice) {
    const inv = viewInvoice;
    const items = inv.items || [];
    return (
      <div className="container-fluid py-4" style={{ maxWidth: 900 }}>
        <div className="d-flex justify-content-between align-items-center mb-3 no-print">
          <h5 className="mb-0">Tax Invoice — {inv.invoice_no}</h5>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm" onClick={() => setViewInvoice(null)}>
              ← Back to Clients
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              🖨️ Print
            </button>
          </div>
        </div>

        <div className="card shadow-sm p-4" id="invoice-print">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-start mb-3">
            <div>
              <h4 className="mb-0 fw-bold">BIP FENCING</h4>
              <p className="small text-muted mb-0">Tax Invoice</p>
            </div>
            <div className="text-end">
              <p className="mb-0"><strong>Invoice No:</strong> {inv.invoice_no}</p>
              <p className="mb-0"><strong>Date:</strong> {inv.invoice_date}</p>
              {inv.payment_mode && <p className="mb-0"><strong>Payment:</strong> {inv.payment_mode}</p>}
            </div>
          </div>

          <hr />

          {/* Buyer Details */}
          <div className="row mb-3">
            <div className="col-md-6">
              <p className="small text-muted mb-1">Bill To</p>
              <p className="mb-0 fw-semibold">{inv.buyer_name}</p>
              {inv.buyer_address && <p className="mb-0 small">{inv.buyer_address}</p>}
              {inv.buyer_phone  && <p className="mb-0 small">📞 {inv.buyer_phone}</p>}
              {inv.buyer_gst    && <p className="mb-0 small">GST: {inv.buyer_gst}</p>}
              {inv.buyer_state  && <p className="mb-0 small">State: {inv.buyer_state} ({inv.buyer_state_code})</p>}
            </div>
            {inv.consignee_name && (
              <div className="col-md-6">
                <p className="small text-muted mb-1">Ship To</p>
                <p className="mb-0 fw-semibold">{inv.consignee_name}</p>
                {inv.consignee_address && <p className="mb-0 small">{inv.consignee_address}</p>}
                {inv.consignee_state   && <p className="mb-0 small">State: {inv.consignee_state} ({inv.consignee_state_code})</p>}
              </div>
            )}
          </div>

          {/* Transport Details */}
          {(inv.dispatched_through || inv.motor_vehicle_no || inv.destination) && (
            <div className="bg-light rounded p-2 mb-3">
              <div className="row g-2 small">
                {inv.dispatched_through && <div className="col-md-4"><strong>Dispatch Through:</strong> {inv.dispatched_through}</div>}
                {inv.motor_vehicle_no   && <div className="col-md-4"><strong>Vehicle No:</strong> {inv.motor_vehicle_no}</div>}
                {inv.destination        && <div className="col-md-4"><strong>Destination:</strong> {inv.destination}</div>}
                {inv.reference_no       && <div className="col-md-4"><strong>Reference:</strong> {inv.reference_no}</div>}
                {inv.buyers_order_no    && <div className="col-md-4"><strong>Buyer's Order:</strong> {inv.buyers_order_no}</div>}
                {inv.eway_number        && <div className="col-md-4"><strong>E-Way No:</strong> {inv.eway_number}</div>}
              </div>
            </div>
          )}

          {/* Items Table */}
          <table className="table table-bordered table-sm mb-3">
            <thead className="table-light">
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>HSN</th>
                <th className="text-center">Qty</th>
                <th className="text-center">Per</th>
                <th className="text-end">Rate (Incl.)</th>
                <th className="text-end">Taxable Amt</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.description}</td>
                  <td>{item.hsn}</td>
                  <td className="text-center">{item.qty}</td>
                  <td className="text-center">{item.per}</td>
                  <td className="text-end">₹{fmt(item.rate_incl)}</td>
                  <td className="text-end">₹{fmt(item.taxable_amt)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="row justify-content-end">
            <div className="col-md-5">
              <table className="table table-sm table-borderless mb-0">
                <tbody>
                  <tr><td>Subtotal</td><td className="text-end">₹{fmt(inv.subtotal)}</td></tr>
                  <tr><td>CGST ({inv.cgst_rate}%)</td><td className="text-end">₹{fmt(inv.cgst_amount)}</td></tr>
                  <tr><td>SGST ({inv.sgst_rate}%)</td><td className="text-end">₹{fmt(inv.sgst_amount)}</td></tr>
                  {Number(inv.round_off) !== 0 && (
                    <tr><td>Round Off</td><td className="text-end">₹{fmt(inv.round_off)}</td></tr>
                  )}
                  <tr className="fw-bold border-top">
                    <td>Net Amount</td>
                    <td className="text-end">₹{fmt(inv.net_amount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bank Details */}
          {inv.bank_name && (
            <div className="border-top pt-3 mt-2">
              <p className="small text-muted mb-1">Bank Details</p>
              <p className="small mb-0">
                <strong>{inv.bank_holder_name}</strong> · {inv.bank_name} ·
                A/C: {inv.bank_account_no} · IFSC: {inv.bank_ifsc}
                {inv.bank_branch && ` · ${inv.bank_branch}`}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Main Clients Page ─────────────────────────────────────────
  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>

      {/* Payment Modal */}
      {showPayModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.45)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg">
              <div className="modal-header border-0">
                <h6 className="modal-title">Record Payment — {selected?.name}</h6>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Amount (₹) <span className="text-danger">*</span></label>
                  <input
                    type="number" className="form-control"
                    value={payForm.amount}
                    onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Payment Date <span className="text-danger">*</span></label>
                  <input
                    type="date" className="form-control"
                    value={payForm.payment_date}
                    onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Note (optional)</label>
                  <input
                    type="text" className="form-control"
                    value={payForm.note}
                    onChange={(e) => setPayForm({ ...payForm, note: e.target.value })}
                    placeholder="e.g. UPI payment"
                  />
                </div>
                {clientDetail && (
                  <div className="bg-light rounded p-2 small">
                    <span className="text-muted">Pending: </span>
                    <strong className="text-danger">₹{fmt(clientDetail.pending)}</strong>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowPayModal(false)}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={handleRecordPayment}
                  disabled={payLoading}
                >
                  {payLoading ? 'Saving...' : 'Save Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Clients</h1>
          <p className="text-muted mb-0">Manage client accounts, payments and billing</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Total Clients</p>
              <h2 className="mb-0">{clients.length}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Total Billed</p>
              <h2 className="mb-0">₹{fmt(totalBilled)}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Total Collected</p>
              <h2 className="mb-0 text-success">₹{fmt(totalPaid)}</h2>
              <div className="progress mt-1" style={{ height: '4px' }}>
                <div className="progress-bar bg-success" style={{ width: `${paidPct}%` }}></div>
              </div>
              <p className="small text-muted mt-1 mb-0">{paidPct}% collected</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card shadow-sm border-0 h-100">
            <div className="card-body">
              <p className="text-muted small mb-1">Pending Amount</p>
              <h2 className="mb-0 text-danger">₹{fmt(totalPending)}</h2>
              <span className="badge bg-warning bg-opacity-10 text-warning">
                {overdueCount} fully unpaid
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="row g-3">

        {/* Left – Client Directory */}
        <div className="col-lg-8">
          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h6 className="mb-0">Client Directory</h6>
              <div className="d-flex gap-2">
                <input
                  type="text" className="form-control form-control-sm"
                  placeholder="Search name, phone, GST..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '200px' }}
                />
                <select
                  className="form-select form-select-sm" value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  style={{ width: '130px' }}
                >
                  <option value="">All Status</option>
                  <option value="paid">Fully Paid</option>
                  <option value="partial">Partial</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            <div className="card-body p-0">
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {loading && (
                  <p className="text-center text-muted py-5">Loading clients...</p>
                )}
                {!loading && filtered.length === 0 && (
                  <p className="text-center text-muted py-5 mb-0">No clients found.</p>
                )}
                {filtered.map((client) => {
                  const badge = getStatusBadge(client.pending, client.total_billed);
                  const color = colorFor(client.id);
                  return (
                    <div
                      key={client.id}
                      onClick={() => { setSelected(client); setActiveTab('overview'); }}
                      className={`d-flex align-items-center p-3 border-bottom ${selected?.id === client.id ? 'bg-light' : ''}`}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Avatar */}
                      <div
                        className={`rounded-circle bg-${color} bg-opacity-10 d-flex align-items-center justify-content-center me-3`}
                        style={{ width: '40px', height: '40px', flexShrink: 0 }}
                      >
                        <span className={`text-${color} fw-bold`}>{getInitials(client.name)}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-grow-1">
                        <p className="mb-0 fw-semibold">{client.name}</p>
                        <p className="small text-muted mb-0">
                          {client.phone}
                          {client.gst ? ` · GST: ${client.gst}` : ''}
                        </p>
                        <p className="small text-muted mb-0">{client.address}</p>
                      </div>

                      {/* Amounts */}
                      <div className="text-end me-3">
                        <p className="mb-0 small fw-semibold text-success">
                          ₹{fmt(client.total_paid)} paid
                        </p>
                        <p className={`mb-0 small ${Number(client.pending) > 0 ? 'text-danger' : 'text-success'}`}>
                          {Number(client.pending) > 0 ? `₹${fmt(client.pending)} pending` : 'Fully paid'}
                        </p>
                        <p className="mb-0 small text-muted">{client.total_invoices} invoice{client.total_invoices !== 1 ? 's' : ''}</p>
                      </div>

                      {/* Badge */}
                      <span className={`badge ${badge.class} bg-opacity-10 text-${badge.class.replace('bg-', '')}`}>
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card-footer bg-white">
              <span className="small text-muted">
                Showing {filtered.length} of {clients.length} clients
              </span>
            </div>
          </div>
        </div>

        {/* Right – Client Details */}
        <div className="col-lg-4">
          {selected && (
            <div className="card shadow-sm mb-3">
              <div className="card-header bg-white d-flex align-items-center gap-3">
                <div
                  className={`rounded-circle bg-${colorFor(selected.id)} bg-opacity-10 d-flex align-items-center justify-content-center`}
                  style={{ width: '48px', height: '48px' }}
                >
                  <span className={`text-${colorFor(selected.id)} fw-bold fs-5`}>
                    {getInitials(selected.name)}
                  </span>
                </div>
                <div>
                  <h6 className="mb-0">{selected.name}</h6>
                  <p className="small text-muted mb-1">{selected.phone}</p>
                  <span className={`badge ${getStatusBadge(selected.pending, selected.total_billed).class} bg-opacity-10 text-${getStatusBadge(selected.pending, selected.total_billed).class.replace('bg-', '')}`}>
                    {getStatusBadge(selected.pending, selected.total_billed).label}
                  </span>
                </div>
              </div>

              <div className="card-body p-0">
                {/* Tabs */}
                <ul className="nav nav-tabs nav-fill" style={{ padding: '0 12px', borderBottom: '1px solid #dee2e6' }}>
                  {['overview', 'invoices', 'payments'].map((tab) => (
                    <li className="nav-item" key={tab}>
                      <button
                        className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        style={{ fontSize: '13px', padding: '10px 0' }}
                      >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </button>
                    </li>
                  ))}
                </ul>

                <div style={{ padding: '16px', maxHeight: '500px', overflowY: 'auto' }}>
                  {detailLoading && <p className="text-center text-muted py-3">Loading...</p>}

                  {/* Overview Tab */}
                  {!detailLoading && activeTab === 'overview' && clientDetail && (
                    <div>
                      <div className="row g-2 mb-3">
                        <div className="col-6">
                          <div className="bg-success bg-opacity-10 rounded p-3 text-center">
                            <p className="small text-success mb-0">Paid</p>
                            <h6 className="text-success mb-0">₹{fmt(clientDetail.total_paid)}</h6>
                          </div>
                        </div>
                        <div className="col-6">
                          <div className="bg-danger bg-opacity-10 rounded p-3 text-center">
                            <p className="small text-danger mb-0">Pending</p>
                            <h6 className="text-danger mb-0">₹{fmt(clientDetail.pending)}</h6>
                          </div>
                        </div>
                      </div>

                      <div className="border-top pt-3">
                        {[
                          ['Total Billed', `₹${fmt(clientDetail.total_billed)}`],
                          ['Phone',   selected.phone  || '—'],
                          ['Address', selected.address || '—'],
                          ['GST',     selected.gst     || '—'],
                          ['Last Invoice', clientDetail.invoices?.[0]?.invoice_no || '—'],
                          ['Last Invoice Date', clientDetail.invoices?.[0]?.invoice_date || '—'],
                          ['Client Since', selected.created_at?.slice(0, 10) || '—'],
                        ].map(([key, value]) => (
                          <div key={key} className="d-flex justify-content-between py-2 border-bottom">
                            <span className="small text-muted">{key}</span>
                            <span className="small fw-medium text-end">{value}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        className="btn btn-primary btn-sm w-100 mt-3"
                        onClick={() => setShowPayModal(true)}
                      >
                        + Record Payment
                      </button>
                    </div>
                  )}

                  {/* Invoices Tab */}
                  {!detailLoading && activeTab === 'invoices' && clientDetail && (
                    <div>
                      <p className="small text-muted mb-2">All invoices for this client</p>
                      {(clientDetail.invoices || []).length === 0 && (
                        <p className="text-muted small text-center py-3">No invoices yet.</p>
                      )}
                      {(clientDetail.invoices || []).map((inv) => (
                        <div key={inv.id} className="bg-light rounded p-2 mb-2">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <p className="mb-0 small fw-semibold">{inv.invoice_no}</p>
                              <p className="small text-muted mb-0">{inv.invoice_date}</p>
                              {inv.payment_mode && (
                                <span className="badge bg-info bg-opacity-10 text-info" style={{ fontSize: '10px' }}>
                                  {inv.payment_mode}
                                </span>
                              )}
                            </div>
                            <div className="text-end">
                              <p className="mb-1 small fw-semibold text-success">₹{fmt(inv.net_amount)}</p>
                              <button
                                className="btn btn-outline-primary btn-sm py-0 px-2"
                                style={{ fontSize: '11px' }}
                                onClick={() => handleViewInvoice(inv.invoice_no)}
                                disabled={viewLoading}
                              >
                                {viewLoading ? '...' : '👁 View'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Payments Tab */}
                  {!detailLoading && activeTab === 'payments' && clientDetail && (
                    <div>
                      <p className="small text-muted mb-2">Payment history</p>
                      {(clientDetail.payments || []).length === 0 && (
                        <p className="text-muted small text-center py-3">No payments recorded yet.</p>
                      )}
                      {(clientDetail.payments || []).map((pay) => (
                        <div key={pay.id} className="bg-light rounded p-2 mb-2 d-flex justify-content-between">
                          <div>
                            <p className="mb-0 small fw-semibold text-success">₹{fmt(pay.amount)}</p>
                            <p className="small text-muted mb-0">{pay.payment_date}</p>
                            {pay.note && <p className="small text-muted mb-0">{pay.note}</p>}
                          </div>
                        </div>
                      ))}
                      <button
                        className="btn btn-primary btn-sm w-100 mt-2"
                        onClick={() => setShowPayModal(true)}
                      >
                        + Add Payment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h6 className="mb-0">Quick Actions</h6>
            </div>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button
                  className="btn btn-outline-success btn-sm"
                  onClick={sendInvoiceWhatsApp}
                  disabled={!selected}
                >
                  <i className="bi bi-whatsapp me-2"></i>Send Invoice
                </button>
                <button
                  className="btn btn-outline-warning btn-sm"
                  onClick={sendPaymentReminder}
                  disabled={!selected}
                >
                  <i className="bi bi-bell me-2"></i>Payment Reminder
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}