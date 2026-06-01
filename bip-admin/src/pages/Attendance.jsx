import { useState, useEffect, useCallback } from 'react';

// ─── API Base URL ─────────────────────────────────────────────────────────────
const API_BASE = "http://localhost:8000";
// ─── Employees fetched live from employees.php ────────────────────────────────
// (replaces the old hard-coded MANUAL_EMPLOYEES list)

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUSES = ['Present', 'Absent', 'Half Day', 'Late', 'On Leave', 'Holiday', 'Work From Site'];

const LEAVE_TYPES = [
  'Annual Leave', 'Sick Leave', 'Emergency Leave',
  'Unpaid Leave', 'Maternity/Paternity', 'Compensatory Off',
];

const STATUS_META = {
  Present:          { color: 'success',   icon: 'bi-check-circle-fill'  },
  Absent:           { color: 'danger',    icon: 'bi-x-circle-fill'       },
  'Half Day':       { color: 'warning',   icon: 'bi-circle-half'         },
  Late:             { color: 'warning',   icon: 'bi-clock-fill'          },
  'On Leave':       { color: 'info',      icon: 'bi-calendar2-minus-fill'},
  Holiday:          { color: 'secondary', icon: 'bi-star-fill'           },
  'Work From Site': { color: 'primary',   icon: 'bi-geo-alt-fill'        },
};

const emptyForm = {
  employee_id: '', employee_name: '', date: '', status: 'Present',
  leave_type: '', check_in: '', check_out: '', work_hours: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const calcWorkHours = (ci, co) => {
  if (!ci || !co) return '';
  const [ih, im] = ci.split(':').map(Number);
  const [oh, om] = co.split(':').map(Number);
  const diff = (oh * 60 + om) - (ih * 60 + im);
  return diff > 0 ? (diff / 60).toFixed(2) : '';
};

const formatTime12 = (t) => {
  if (!t) return '';
  let [h, m] = t.split(':');
  h = parseInt(h);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const to12Parts = (val24) => {
  if (!val24) return { hour12: '', minute: '00', ampm: 'AM' };
  let [h, m] = val24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return { hour12: String(h), minute: String(m).padStart(2, '0'), ampm };
};

const to24 = ({ hour12, minute, ampm }) => {
  if (!hour12) return '';
  let h = parseInt(hour12);
  if (ampm === 'AM' && h === 12) h = 0;
  if (ampm === 'PM' && h !== 12) h += 12;
  return `${String(h).padStart(2, '0')}:${minute}`;
};

// ─── 12hr Time Picker ─────────────────────────────────────────────────────────
function TimePicker12({ value, onChange, name }) {
  const parts   = to12Parts(value);
  const [focused, setFocused] = useState(false);
  const hours   = Array.from({ length: 12 }, (_, i) => String(i + 1));
  const minutes = ['00','05','10','15','20','25','30','35','40','45','50','55'];

  const update = (field, val) => {
    const newParts = { ...parts, [field]: val };
    onChange({ target: { name, value: to24(newParts) } });
  };

  const sel = {
    border: 'none', outline: 'none', background: 'transparent',
    fontSize: 13, color: '#1f2937', cursor: 'pointer', padding: '0 2px',
    fontFamily: 'inherit', fontWeight: 500,
    appearance: 'none', WebkitAppearance: 'none', MozAppearance: 'none',
    lineHeight: '36px',
  };

  return (
    <div
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        display: 'flex', alignItems: 'center', height: 38,
        border: `1.5px solid ${focused ? '#3b82f6' : '#dee2e6'}`,
        borderRadius: 10, background: '#fff',
        paddingLeft: 10, paddingRight: 6, gap: 0,
        boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s', userSelect: 'none',
      }}
    >
      <i className="bi bi-clock" style={{ fontSize: 12, color: '#9ca3af', marginRight: 6, flexShrink: 0 }} />
      <select value={parts.hour12} onChange={e => update('hour12', e.target.value)} style={{ ...sel, width: 32, textAlign: 'center' }}>
        <option value="">HH</option>
        {hours.map(h => <option key={h} value={h}>{h.padStart(2,'0')}</option>)}
      </select>
      <span style={{ color: '#374151', fontWeight: 700, fontSize: 14, margin: '0 1px', flexShrink: 0, lineHeight: '36px' }}>:</span>
      <select value={parts.minute} onChange={e => update('minute', e.target.value)} style={{ ...sel, width: 32, textAlign: 'center' }}>
        {minutes.map(m => <option key={m} value={m}>{m}</option>)}
      </select>
      <span style={{ display: 'inline-block', width: 1, height: 20, background: '#e5e7eb', margin: '0 8px', flexShrink: 0 }} />
      <div style={{ display: 'flex', borderRadius: 7, border: '1px solid #e5e7eb', overflow: 'hidden', flexShrink: 0 }}>
        {['AM','PM'].map(period => (
          <button key={period} type="button" onClick={() => update('ampm', period)} style={{
            border: 'none', padding: '2px 8px', fontSize: 11, fontWeight: 700,
            cursor: 'pointer', lineHeight: '20px', minWidth: 34,
            background: parts.ampm === period ? (period === 'AM' ? '#dbeafe' : '#fef3c7') : '#fff',
            color:      parts.ampm === period ? (period === 'AM' ? '#1d4ed8' : '#b45309') : '#9ca3af',
            transition: 'all 0.12s',
          }}>{period}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Attendance() {
  const [records,       setRecords]       = useState([]);
  const [stats,         setStats]         = useState({ total_employees: 0, today: {}, all_time: {} });
  const [form,          setForm]          = useState(emptyForm);
  const [editingId,     setEditingId]     = useState(null);
  const [showForm,      setShowForm]      = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('');
  const [filterDate,    setFilterDate]    = useState('');
  const [activeTab,     setActiveTab]     = useState('all');
  const [loading,       setLoading]       = useState(false);
  const [apiError,      setApiError]      = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');

  // ── Employees from DB ─────────────────────────────────────────────────────
  const [dbEmployees,     setDbEmployees]     = useState([]);
  const [empLoading,      setEmpLoading]      = useState(false);
  const [empError,        setEmpError]        = useState('');

  // ── Fetch attendance records + stats ─────────────────────────────────────────
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const params = new URLSearchParams();
      if (filterDate)   params.set('date',   filterDate);
      if (filterStatus) params.set('status', filterStatus);
      if (search)       params.set('search', search);
      if (activeTab !== 'all') params.set('tab', activeTab);

      const res  = await fetch(`${API_BASE}/attendance.php?${params}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setRecords(data.records || []);
      setStats(data.stats || { total_employees: 0, today: {}, all_time: {} });
    } catch (err) {
      setApiError(err.message || 'Failed to load records.');
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus, search, activeTab]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

  // ── Fetch active employees from employees.php ─────────────────────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      setEmpLoading(true);
      setEmpError('');
      try {
        const res  = await fetch(`${API_BASE}/employees.php`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setDbEmployees(data.employees || []);
      } catch (err) {
        setEmpError(err.message || 'Failed to load employees.');
      } finally {
        setEmpLoading(false);
      }
    };
    fetchEmployees();
    // Re-fetch employees whenever a new employee is added from another tab
    window.addEventListener('employees-updated', fetchEmployees);
    return () => window.removeEventListener('employees-updated', fetchEmployees);
  }, []);

  // ── Auto-calculate work hours ─────────────────────────────────────────────────
  useEffect(() => {
    const wh = calcWorkHours(form.check_in, form.check_out);
    if (wh) setForm(f => ({ ...f, work_hours: wh }));
  }, [form.check_in, form.check_out]);

  // ── Employee select — auto-fills name & id ────────────────────────────────────
  const handleEmployeeSelect = (e) => {
    const empId = e.target.value;
    const emp   = dbEmployees.find(em => em.emp_id === empId);
    if (emp) {
      setForm(f => ({ ...f, employee_id: emp.emp_id, employee_name: emp.emp_name }));
    } else {
      setForm(f => ({ ...f, employee_id: '', employee_name: '' }));
    }
  };

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    try {
      const url    = editingId ? `${API_BASE}/attendance.php?id=${editingId}` : `${API_BASE}/attendance.php`;
      const method = editingId ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSuccessMsg(editingId ? 'Attendance updated!' : 'Attendance marked!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      fetchRecords();
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err) {
      setApiError(err.message || 'Failed to save record.');
    }
  };

  // ── Edit ──────────────────────────────────────────────────────────────────────
  const handleEdit = (rec) => {
    setForm({
      employee_id:   rec.employee_id   || '',
      employee_name: rec.employee_name || '',
      date:          rec.date          || '',
      status:        rec.status        || 'Present',
      leave_type:    rec.leave_type    || '',
      check_in:      rec.check_in      || '',
      check_out:     rec.check_out     || '',
      work_hours:    rec.work_hours    || '',
    });
    setEditingId(rec.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const res  = await fetch(`${API_BASE}/attendance.php?id=${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setDeleteConfirm(null);
      fetchRecords();
      window.dispatchEvent(new Event('attendance-updated'));
    } catch (err) {
      setApiError(err.message || 'Failed to delete.');
    }
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };

  // ── Stats — today only, from actual DB records ────────────────────────────────
  const todayStr     = new Date().toISOString().split('T')[0];
  const todayRecords = records.filter(r => r.date === todayStr);
  const totalEmp     = dbEmployees.length;
  const todayPresent = todayRecords.filter(r => r.status === 'Present').length;
  const todayAbsent  = todayRecords.filter(r => r.status === 'Absent').length;
  const todayHalf    = todayRecords.filter(r => r.status === 'Half Day').length;
  const todayLeave   = todayRecords.filter(r => r.status === 'On Leave').length;

  const lbl = { fontSize: 12, fontWeight: 600, color: '#374151' };
  const inp = { borderRadius: 10, fontSize: 13, height: 38 };

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: '#f0f2f5', minHeight: '100vh' }}>

      {/* ── Delete Modal ── */}
      {deleteConfirm && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)', zIndex: 1055 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0 rounded-3">
              <div className="modal-header border-0">
                <h6 className="modal-title text-danger fw-bold">
                  <i className="bi bi-exclamation-triangle-fill me-2" />Delete Attendance Record
                </h6>
              </div>
              <div className="modal-body pt-0">
                <p className="mb-0 text-muted">
                  Remove attendance for <strong className="text-dark">{deleteConfirm.employee_name}</strong> on{' '}
                  <strong className="text-dark">{deleteConfirm.date}</strong>? This action is permanent.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button className="btn btn-sm btn-outline-secondary rounded-pill px-4"
                  onClick={() => setDeleteConfirm(null)}>Cancel</button>
                <button className="btn btn-sm btn-danger rounded-pill px-4"
                  onClick={() => handleDelete(deleteConfirm.id)}>
                  <i className="bi bi-trash me-1" />Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── API Error Banner ── */}
      {apiError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-3"
          style={{ borderRadius: 10, fontSize: 13 }}>
          <i className="bi bi-wifi-off" />
          <span>{apiError}</span>
          <button className="btn btn-sm btn-outline-danger ms-auto rounded-pill px-3"
            onClick={fetchRecords}>Retry</button>
        </div>
      )}

      {/* ── Page Header ── */}
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#1e40af,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="bi bi-calendar-check text-white" style={{ fontSize: 16 }} />
            </div>
            <h1 className="h3 mb-0 fw-bold" style={{ color: '#0f172a', letterSpacing: '-0.5px' }}>Attendance</h1>
          </div>
          <p className="text-muted mb-0 ms-1" style={{ fontSize: 13 }}>Track daily attendance, leaves and working hours</p>
        </div>
        <button
          onClick={() => showForm ? closeForm() : setShowForm(true)}
          className="btn rounded-pill px-4 fw-semibold"
          style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', border: 'none', color: '#fff', fontSize: 13, boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}>
          <i className={`bi ${showForm ? 'bi-x-lg' : 'bi-plus-lg'} me-2`} />
          {showForm ? 'Close Form' : 'Mark Attendance'}
        </button>
      </div>

      {/* ── Stats Cards — today's live counts ── */}
      <div className="row g-3 mb-4">
        {[
          {
            label: 'Total Employees',
            value: totalEmp,
            sub:   `${todayRecords.length} marked today`,
            color: '#1e40af', bg: '#eff6ff', icon: 'bi-people-fill',
          },
          {
            label: 'Present Today',
            value: todayPresent,
            sub:   todayPresent > 0 ? `${Math.round(todayPresent / totalEmp * 100)}% attendance` : 'No records yet',
            color: '#15803d', bg: '#f0fdf4', icon: 'bi-graph-up',
          },
          {
            label: 'Absent Today',
            value: todayAbsent,
            sub:   `${todayHalf} half day`,
            color: '#b91c1c', bg: '#fef2f2', icon: 'bi-x-circle',
          },
          {
            label: 'On Leave Today',
            value: todayLeave,
            sub:   todayLeave > 0 ? `${todayLeave} on leave` : 'No leaves today',
            color: '#0369a1', bg: '#f0f9ff', icon: 'bi-calendar-minus',
          },
        ].map(card => (
          <div className="col-md-3" key={card.label}>
            <div className="card border-0 h-100" style={{ borderRadius: 16, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <p className="text-muted mb-2" style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{card.label}</p>
                    <h2 className="mb-1 fw-bold" style={{ color: card.color, fontSize: 28, letterSpacing: '-1px' }}>{card.value}</h2>
                    <p className="mb-0" style={{ fontSize: 12, color: '#64748b' }}>{card.sub}</p>
                  </div>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`bi ${card.icon}`} style={{ fontSize: 18, color: card.color }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Add / Edit Form ── */}
      {showForm && (
        <div className="card border-0 mb-4" style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.06)' }}>
          <div className="card-header bg-white border-0 pb-0 pt-4 px-4" style={{ borderRadius: '16px 16px 0 0' }}>
            <div className="d-flex align-items-center gap-2">
              <div style={{ width: 30, height: 30, borderRadius: 8, background: editingId ? '#fef3c7' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`bi ${editingId ? 'bi-pencil-fill' : 'bi-person-check-fill'}`}
                  style={{ fontSize: 13, color: editingId ? '#d97706' : '#1e40af' }} />
              </div>
              <h6 className="mb-0 fw-bold" style={{ color: '#0f172a' }}>
                {editingId ? 'Edit Attendance Record' : 'Mark New Attendance'}
              </h6>
            </div>
          </div>

          <div className="card-body px-4 pb-4">
            {successMsg && (
              <div className="alert border-0 py-2 mb-3 d-flex align-items-center gap-2"
                style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 10, fontSize: 13 }}>
                <i className="bi bi-check-circle-fill" />{successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* ── Employee Info ── */}
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 12, marginTop: 8 }}>
                Employee Information
              </p>
              <div className="row g-3 mb-4">
                <div className="col-md-5">
                  <label className="form-label" style={lbl}>
                    Employee Name <span className="text-danger">*</span>
                  </label>
                  <select className="form-select" style={inp}
                    value={form.employee_id} onChange={handleEmployeeSelect} required
                    disabled={empLoading}>
                    <option value="">
                      {empLoading ? 'Loading employees…' : empError ? 'Error loading employees' : 'Select employee...'}
                    </option>
                    {dbEmployees.map(emp => (
                      <option key={emp.emp_id} value={emp.emp_id}>
                        {emp.emp_name} ({emp.emp_id})
                      </option>
                    ))}
                  </select>
                  {empError && (
                    <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>
                      <i className="bi bi-exclamation-circle me-1" />{empError}
                    </div>
                  )}
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={lbl}>Employee ID</label>
                  <div className="form-control d-flex align-items-center"
                    style={{ ...inp, background: '#f8fafc', color: '#475569', fontWeight: 600, cursor: 'default' }}>
                    {form.employee_id || <span style={{ color: '#94a3b8' }}>Auto-filled</span>}
                  </div>
                </div>
              </div>

              {/* ── Attendance Details ── */}
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 12 }}>
                Attendance Details
              </p>
              <div className="row g-3 mb-4">
                <div className="col-md-2">
                  <label className="form-label" style={lbl}>Date <span className="text-danger">*</span></label>
                  <input type="date" className="form-control" style={inp}
                    name="date" value={form.date} onChange={handleChange} required />
                </div>
                <div className="col-md-3">
                  <label className="form-label" style={lbl}>Status <span className="text-danger">*</span></label>
                  <select className="form-select" style={inp}
                    name="status" value={form.status} onChange={handleChange}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {form.status === 'On Leave' && (
                  <div className="col-md-3">
                    <label className="form-label" style={lbl}>Leave Type</label>
                    <select className="form-select" style={inp}
                      name="leave_type" value={form.leave_type} onChange={handleChange}>
                      <option value="">Select type...</option>
                      {LEAVE_TYPES.map(l => <option key={l}>{l}</option>)}
                    </select>
                  </div>
                )}
                <div className="col-md-2">
                  <label className="form-label" style={lbl}>Check In</label>
                  <TimePicker12 name="check_in" value={form.check_in} onChange={handleChange} />
                </div>
                <div className="col-md-2">
                  <label className="form-label" style={lbl}>Check Out</label>
                  <TimePicker12 name="check_out" value={form.check_out} onChange={handleChange} />
                </div>
                <div className="col-md-2">
                  <label className="form-label" style={lbl}>Work Hours</label>
                  <div className="form-control d-flex align-items-center" style={{
                    ...inp,
                    background: form.work_hours ? '#f0fdf4' : '#f8fafc',
                    color: form.work_hours ? '#15803d' : '#9ca3af',
                    fontWeight: 700, cursor: 'default',
                  }}>
                    {form.work_hours ? `${form.work_hours} hrs` : '—'}
                  </div>
                </div>
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn rounded-pill px-4 fw-semibold"
                  style={{ background: 'linear-gradient(135deg,#1e40af,#3b82f6)', border: 'none', color: '#fff', fontSize: 13 }}>
                  <i className="bi bi-check-lg me-2" />{editingId ? 'Update Record' : 'Save Attendance'}
                </button>
                <button type="button" className="btn btn-outline-secondary rounded-pill px-4"
                  style={{ fontSize: 13 }} onClick={() => setForm(emptyForm)}>
                  <i className="bi bi-arrow-counterclockwise me-2" />Reset
                </button>
                {editingId && (
                  <button type="button" className="btn btn-outline-danger rounded-pill px-4"
                    style={{ fontSize: 13 }} onClick={closeForm}>Cancel Edit</button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Records Table ── */}
      <div className="card border-0" style={{ borderRadius: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
        <div className="card-header bg-white border-0 px-4 pt-4 pb-0" style={{ borderRadius: '16px 16px 0 0' }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div>
              <h6 className="fw-bold mb-0" style={{ color: '#0f172a' }}>Attendance Records</h6>
              <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                {loading ? 'Loading...' : `${records.length} record${records.length !== 1 ? 's' : ''} shown`}
              </p>
            </div>
            <div className="d-flex gap-2 flex-wrap">
              <input type="text" className="form-control form-control-sm"
                placeholder="Search name / ID..."
                value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: 200, borderRadius: 8, fontSize: 12 }} />
              <input type="date" className="form-control form-control-sm"
                value={filterDate} onChange={e => setFilterDate(e.target.value)}
                style={{ width: 140, borderRadius: 8, fontSize: 12 }} />
              <select className="form-select form-select-sm" value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ width: 140, borderRadius: 8, fontSize: 12 }}>
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
              <button className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                style={{ fontSize: 12 }} onClick={fetchRecords} title="Refresh">
                <i className="bi bi-arrow-clockwise" />
              </button>
            </div>
          </div>
          <div className="d-flex gap-1">
            {[['all','All Records'],['today','Today'],['week','This Week']].map(([val, label]) => (
              <button key={val} onClick={() => setActiveTab(val)}
                className="btn btn-sm rounded-pill px-3"
                style={{
                  fontSize: 12, fontWeight: 600, marginBottom: 0,
                  background: activeTab === val ? '#1e40af' : 'transparent',
                  color:      activeTab === val ? '#fff' : '#64748b',
                  border:     activeTab === val ? 'none' : '1px solid #e2e8f0',
                }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" style={{ width: 32, height: 32 }} role="status" />
              <p className="text-muted mt-3 mb-0" style={{ fontSize: 13 }}>Loading records from database...</p>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-5">
              <div style={{ width: 64, height: 64, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <i className="bi bi-calendar-x text-muted" style={{ fontSize: 28 }} />
              </div>
              <p className="text-muted mb-1 fw-semibold" style={{ fontSize: 14 }}>No records found</p>
              <p className="text-muted mb-0" style={{ fontSize: 12 }}>
                {apiError ? 'Check your backend connection.' : 'Start by marking attendance above.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table align-middle mb-0" style={{ fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderTop: '1px solid #f1f5f9' }}>
                    {['Employee', 'Date', 'Check In', 'Check Out', 'Work Hrs', 'Status', 'Actions'].map(h => (
                      <th key={h} className="px-3 py-3 fw-semibold"
                        style={{ color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap', borderBottom: '1px solid #f1f5f9' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec, idx) => {
                    const meta = STATUS_META[rec.status] || { color: 'secondary', icon: 'bi-dash-circle' };
                    return (
                      <tr key={rec.id} style={{ borderBottom: '1px solid #f8fafc', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}>
                        <td className="px-3 py-3">
                          <div className="d-flex align-items-center gap-2">
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: `hsl(${(rec.employee_name.charCodeAt(0) * 7) % 360},70%,92%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: `hsl(${(rec.employee_name.charCodeAt(0) * 7) % 360},60%,35%)` }}>
                                {rec.employee_name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ color: '#0f172a', fontSize: 13 }}>{rec.employee_name}</div>
                              <div style={{ color: '#94a3b8', fontSize: 11 }}>{rec.employee_id || '—'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3" style={{ whiteSpace: 'nowrap', color: '#475569', fontWeight: 600 }}>{rec.date}</td>
                        <td className="px-3" style={{ color: '#475569', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {rec.check_in ? formatTime12(rec.check_in) : '—'}
                        </td>
                        <td className="px-3" style={{ color: '#475569', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                          {rec.check_out ? formatTime12(rec.check_out) : '—'}
                        </td>
                        <td className="px-3 fw-bold" style={{ color: '#15803d', fontFamily: 'monospace' }}>
                          {rec.work_hours > 0 ? `${parseFloat(rec.work_hours).toFixed(1)}h` : '—'}
                        </td>
                        <td className="px-3">
                          <span className={`badge bg-${meta.color} bg-opacity-10 text-${meta.color} d-inline-flex align-items-center gap-1`}
                            style={{ fontSize: 11, fontWeight: 600, borderRadius: 6, padding: '3px 8px' }}>
                            <i className={`bi ${meta.icon}`} style={{ fontSize: 10 }} />
                            {rec.status}
                          </span>
                        </td>
                        <td className="px-3">
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm py-1 px-2" title="Edit"
                              style={{ borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 11 }}
                              onClick={() => handleEdit(rec)}>
                              <i className="bi bi-pencil" />
                            </button>
                            <button className="btn btn-sm py-1 px-2" title="Delete"
                              style={{ borderRadius: 7, border: '1px solid #fee2e2', background: '#fff5f5', color: '#ef4444', fontSize: 11 }}
                              onClick={() => setDeleteConfirm(rec)}>
                              <i className="bi bi-trash" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                    <td colSpan={4} className="px-3 py-2 fw-bold" style={{ fontSize: 12, color: '#475569' }}>
                      Totals — {records.length} record{records.length !== 1 ? 's' : ''}
                    </td>
                    <td className="px-3 fw-bold" style={{ color: '#15803d', fontFamily: 'monospace', fontSize: 12 }}>
                      {records.reduce((s, r) => s + (Number(r.work_hours) || 0), 0).toFixed(1)}h
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="card-footer bg-white border-0 px-4 py-3" style={{ borderRadius: '0 0 16px 16px' }}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <span style={{ fontSize: 12, color: '#94a3b8' }}>
              Showing <strong style={{ color: '#475569' }}>{records.length}</strong> records from MySQL
            </span>
            <div className="d-flex gap-3 flex-wrap">
              {STATUSES.map(s => {
                const cnt = records.filter(r => r.status === s).length;
                if (!cnt) return null;
                const m = STATUS_META[s] || { color: 'secondary', icon: 'bi-dash-circle' };
                return (
                  <span key={s} className="d-flex align-items-center gap-1" style={{ fontSize: 11, color: '#64748b' }}>
                    <i className={`bi ${m.icon} text-${m.color}`} />
                    {cnt} {s}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}