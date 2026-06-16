import { useState, useEffect, useCallback } from "react";
import Select from "react-select";

const API_BASE = "http://localhost:8000";

const getHeaders = () => {
  const headers = {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
    "Content-Type": "application/json",
  };
  const role = localStorage.getItem("role");
  if (role === "admin") {
    const vb = localStorage.getItem("admin_view_branch");
    if (vb) headers["X-Branch-ID"] = vb;
  }
  return headers;
};

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Backend error: ${text.substring(0, 200)}`);
  }
}

const STATUSES = [
  "Present",
  "Absent",
  "Half Day",
  "Late",
  "On Leave",
  "Holiday",
  "Work From Site",
];
const LEAVE_TYPES = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Unpaid Leave",
  "Maternity/Paternity",
  "Compensatory Off",
];
const STATUS_META = {
  Present: { bg: "#dcfce7", color: "#15803d", icon: "bi-check-circle-fill" },
  Absent: { bg: "#fee2e2", color: "#dc2626", icon: "bi-x-circle-fill" },
  "Half Day": { bg: "#fef9c3", color: "#b45309", icon: "bi-circle-half" },
  Late: { bg: "#fef3c7", color: "#d97706", icon: "bi-clock-fill" },
  "On Leave": {
    bg: "#e0f2fe",
    color: "#0369a1",
    icon: "bi-calendar2-minus-fill",
  },
  Holiday: { bg: "#f1f5f9", color: "#475569", icon: "bi-star-fill" },
  "Work From Site": {
    bg: "#ede9fe",
    color: "#7c3aed",
    icon: "bi-geo-alt-fill",
  },
};

const emptyForm = {
  employee_id: "",
  employee_name: "",
  date: "",
  status: "Present",
  leave_type: "",
  check_in: "",
  check_out: "",
  work_hours: "",
};

const calcWorkHours = (ci, co) => {
  if (!ci || !co) return "";
  const [ih, im] = ci.split(":").map(Number);
  const [oh, om] = co.split(":").map(Number);
  let diff = oh * 60 + om - (ih * 60 + im);
  if (diff <= 0) diff += 24 * 60;
  return diff > 0 ? (diff / 60).toFixed(2) : "";
};

const formatTime12 = (t) => {
  if (!t) return "";
  let [h, m] = t.split(":");
  h = parseInt(h);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const to12Parts = (val24) => {
  if (!val24) return { hour12: "", minute: "00", ampm: "AM" };
  let [h, m] = val24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return { hour12: String(h), minute: String(m).padStart(2, "0"), ampm };
};

const to24 = ({ hour12, minute, ampm }) => {
  if (!hour12) return "";
  let h = parseInt(hour12);
  if (ampm === "AM" && h === 12) h = 0;
  if (ampm === "PM" && h !== 12) h += 12;
  return `${String(h).padStart(2, "0")}:${minute}`;
};

// Shared react-select styles — compact, green theme
const rsTime = {
  control: (b, s) => ({
    ...b,
    height: 40,
    minHeight: 40,
    borderRadius: 8,
    borderColor: s.isFocused ? "#008b3e" : "#e2e8f0",
    boxShadow: s.isFocused ? "0 0 0 3px rgba(0,139,62,.1)" : "none",
    background: "#fafbfc",
    fontSize: 13,
    "&:hover": { borderColor: "#008b3e" },
    cursor: "pointer",
  }),
  valueContainer: (b) => ({ ...b, padding: "0 6px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (b) => ({ ...b, padding: "0 4px", color: "#94a3b8" }),
  menu: (b) => ({
    ...b,
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 9999,
  }),
  menuList: (b) => ({ ...b, maxHeight: 160, padding: "2px 0" }),
  option: (b, s) => ({
    ...b,
    fontSize: 13,
    padding: "5px 8px",
    textAlign: "center",
    background: s.isSelected ? "#008b3e" : s.isFocused ? "#f0fdf4" : "#fff",
    color: s.isSelected ? "#fff" : "#1e293b",
  }),
};

const rsEmp = {
  control: (b, s) => ({
    ...b,
    minHeight: 40,
    borderRadius: 8,
    borderColor: s.isFocused ? "#008b3e" : "#e2e8f0",
    boxShadow: s.isFocused ? "0 0 0 3px rgba(0,139,62,.1)" : "none",
    background: "#fafbfc",
    fontSize: 14,
    "&:hover": { borderColor: "#008b3e" },
  }),
  valueContainer: (b) => ({ ...b, padding: "0 12px" }),
  indicatorSeparator: () => ({ display: "none" }),
  dropdownIndicator: (b) => ({ ...b, padding: "0 8px", color: "#94a3b8" }),
  menu: (b) => ({
    ...b,
    borderRadius: 8,
    border: "1.5px solid #e2e8f0",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    zIndex: 9999,
  }),
  menuList: (b) => ({ ...b, maxHeight: 200, padding: "2px 0" }),
  option: (b, s) => ({
    ...b,
    fontSize: 14,
    background: s.isSelected ? "#008b3e" : s.isFocused ? "#f0fdf4" : "#fff",
    color: s.isSelected ? "#fff" : "#1e293b",
  }),
};

const HOUR_OPTS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1).padStart(2, "0"),
}));
const MIN_OPTS = [
  "00",
  "05",
  "10",
  "15",
  "20",
  "25",
  "30",
  "35",
  "40",
  "45",
  "50",
  "55",
].map((m) => ({ value: m, label: m }));

function TimePicker12({ value, onChange, name, required }) {
  const parts = to12Parts(value);
  const update = (field, val) => {
    const np = { ...parts, [field]: val };
    onChange({ target: { name, value: to24(np) } });
  };
  return (
    <div style={{ display: "flex", alignItems: "center", height: 40, gap: 4 }}>
      <i
        className="bi bi-clock"
        style={{ fontSize: 12, color: "#9ca3af", flexShrink: 0 }}
      />
      <div style={{ width: 62, flexShrink: 0 }}>
        <Select
          menuPlacement="bottom"
          menuPosition="fixed"
          isSearchable={false}
          value={
            parts.hour12
              ? {
                  value: parts.hour12,
                  label: String(parts.hour12).padStart(2, "0"),
                }
              : null
          }
          onChange={(opt) => update("hour12", opt.value)}
          options={HOUR_OPTS}
          styles={rsTime}
          placeholder="HH"
        />
      </div>
      <span
        style={{
          color: "#374151",
          fontWeight: 700,
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        :
      </span>
      <div style={{ width: 62, flexShrink: 0 }}>
        <Select
          menuPlacement="bottom"
          menuPosition="fixed"
          isSearchable={false}
          value={{ value: parts.minute, label: parts.minute }}
          onChange={(opt) => update("minute", opt.value)}
          options={MIN_OPTS}
          styles={rsTime}
        />
      </div>
      <span
        style={{
          display: "inline-block",
          width: 1,
          height: 20,
          background: "#e5e7eb",
          margin: "0 4px",
          flexShrink: 0,
        }}
      />
      <div
        style={{
          display: "flex",
          borderRadius: 6,
          border: "1px solid #e5e7eb",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {["AM", "PM"].map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => update("ampm", period)}
            style={{
              border: "none",
              padding: "2px 8px",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              minWidth: 34,
              background:
                parts.ampm === period
                  ? period === "AM"
                    ? "#dbeafe"
                    : "#fef3c7"
                  : "#fff",
              color:
                parts.ampm === period
                  ? period === "AM"
                    ? "#1d4ed8"
                    : "#b45309"
                  : "#9ca3af",
              transition: "all 0.12s",
            }}
          >
            {period}
          </button>
        ))}
      </div>
      {required && !value && (
        <span style={{ color: "#ef4444", fontSize: 10, marginLeft: 2 }}>*</span>
      )}
    </div>
  );
}

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({
    total_employees: 0,
    today: {},
    all_time: {},
  });
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [dbEmployees, setDbEmployees] = useState([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState("");
  const [branchesMap, setBranchesMap] = useState({});

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterStatus, search, activeTab]);

  const role = localStorage.getItem("role");
  const selectedBranch = localStorage.getItem("admin_view_branch");
  const isAdmin = role === "admin";
  const canMarkAttendance = !isAdmin || (isAdmin && !!selectedBranch);
  const canEditDelete = isAdmin;

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const data = await fetchJSON(
          `${API_BASE}/branches/get_branches.php?token=${encodeURIComponent(token)}&simple=1`,
          { headers: getHeaders() },
        );
        const list = Array.isArray(data) ? data : data.branches || [];
        const map = {};
        list.forEach((b) => {
          map[b.id] = b.name || b.branch_name;
        });
        setBranchesMap(map);
      } catch {}
    };
    fetchBranches();
  }, []);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      const params = new URLSearchParams();
      if (filterDate) params.set("date", filterDate);
      if (filterStatus) params.set("status", filterStatus);
      if (search) params.set("search", search);
      if (activeTab !== "all") params.set("tab", activeTab);
      params.set("token", token);
      const data = await fetchJSON(
        `${API_BASE}/attendance/attendance.php?${params}`,
        { headers: getHeaders() },
      );
      if (data.error) throw new Error(data.error);
      setRecords(data.records || []);
      setStats(data.stats || { total_employees: 0, today: {}, all_time: {} });
    } catch (err) {
      setApiError(err.message);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [filterDate, filterStatus, search, activeTab]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    const fetchEmployees = async () => {
      setEmpLoading(true);
      setEmpError("");
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token");
        const data = await fetchJSON(
          `${API_BASE}/employees/get_employees.php?token=${encodeURIComponent(token)}&simple=1`,
          { headers: getHeaders() },
        );
        setDbEmployees(Array.isArray(data) ? data : data.employees || []);
      } catch (err) {
        setEmpError(err.message);
      } finally {
        setEmpLoading(false);
      }
    };
    fetchEmployees();
    window.addEventListener("employees-updated", fetchEmployees);
    return () =>
      window.removeEventListener("employees-updated", fetchEmployees);
  }, []);

  useEffect(() => {
    const wh = calcWorkHours(form.check_in, form.check_out);
    if (wh) setForm((f) => ({ ...f, work_hours: wh }));
  }, [form.check_in, form.check_out]);

  const handleEmployeeSelect = (opt) => {
    if (opt) {
      const emp = dbEmployees.find((em) => em.emp_id === opt.value);
      if (emp)
        setForm((f) => ({
          ...f,
          employee_id: emp.emp_id,
          employee_name: emp.employee_name || emp.emp_name,
        }));
    } else setForm((f) => ({ ...f, employee_id: "", employee_name: "" }));
  };

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const isTimeRequired = () =>
    ["Present", "Half Day", "Late", "Work From Site"].includes(form.status);
  const isDuplicateEntry = () => {
    if (!form.employee_id || !form.date || editingId) return false;
    return records.some(
      (r) => r.employee_id === form.employee_id && r.date === form.date,
    );
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };
  const handleOpenForm = () => {
    if (!canMarkAttendance) {
      showToast("Please select a specific branch to mark attendance.", "error");
      return;
    }
    if (showForm && !editingId) {
      closeForm();
      return;
    }
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canMarkAttendance) {
      showToast("Please select a specific branch to mark attendance.", "error");
      return;
    }
    if (isDuplicateEntry()) {
      showToast(
        `Attendance already exists for this employee on ${form.date}.`,
        "error",
      );
      return;
    }
    if (isTimeRequired() && (!form.check_in || !form.check_out)) {
      showToast(
        "Check-in and Check-out are required for Present, Half Day, Late, or Work From Site.",
        "error",
      );
      return;
    }
    setApiError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      const payload = { ...form };
      if (isAdmin && selectedBranch)
        payload.branch_id = parseInt(selectedBranch);
      const url = editingId
        ? `${API_BASE}/attendance/attendance.php?id=${editingId}&token=${encodeURIComponent(token)}`
        : `${API_BASE}/attendance/attendance.php?token=${encodeURIComponent(token)}`;
      const data = await fetchJSON(url, {
        method: editingId ? "PUT" : "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
      if (data.error) throw new Error(data.error);
      showToast(editingId ? "Attendance updated!" : "Attendance marked!");
      closeForm();
      fetchRecords();
    } catch (err) {
      if (
        err.message.includes("Duplicate entry") ||
        err.message.includes("already exists")
      )
        showToast(
          `Attendance already exists for this employee on ${form.date}.`,
          "error",
        );
      else showToast(err.message, "error");
    }
  };

  const handleEdit = (rec) => {
    if (!canEditDelete) {
      showToast("Only admin can edit records.", "error");
      return;
    }
    setForm({
      employee_id: rec.employee_id || "",
      employee_name: rec.employee_name || "",
      date: rec.date || "",
      status: rec.status || "Present",
      leave_type: rec.leave_type || "",
      check_in: rec.check_in || "",
      check_out: rec.check_out || "",
      work_hours: rec.work_hours || "",
    });
    setEditingId(rec.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!canEditDelete) {
      showToast("Only admin can delete records.", "error");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token");
      const data = await fetchJSON(
        `${API_BASE}/attendance/attendance.php?id=${id}&token=${encodeURIComponent(token)}`,
        { method: "DELETE", headers: getHeaders() },
      );
      if (data.error) throw new Error(data.error);
      setDeleteConfirm(null);
      showToast("Attendance record deleted");
      fetchRecords();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const totalFiltered = records.length;
  const totalPages =
    rowsPerPage === -1 ? 1 : Math.ceil(totalFiltered / rowsPerPage);
  const startIndex = rowsPerPage === -1 ? 0 : (currentPage - 1) * rowsPerPage;
  const paginatedRecords =
    rowsPerPage === -1
      ? records
      : records.slice(startIndex, startIndex + rowsPerPage);
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };
  const formatTime = (ts) =>
    ts
      ? new Date(ts).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.date === todayStr);
  const todayPresent = todayRecords.filter(
    (r) => r.status === "Present",
  ).length;
  const todayAbsent = todayRecords.filter((r) => r.status === "Absent").length;
  const todayHalf = todayRecords.filter((r) => r.status === "Half Day").length;
  const todayWFS = todayRecords.filter(
    (r) => r.status === "Work From Site",
  ).length;
  const showBranchColumn = isAdmin && !selectedBranch;

  const empOptions = dbEmployees.map((emp) => ({
    value: emp.emp_id,
    label: `${emp.employee_name || emp.emp_name} (${emp.emp_id})`,
  }));
  const empValue = form.employee_id
    ? empOptions.find((o) => o.value === form.employee_id) || null
    : null;

  return (
    <div className="at-root">
      <style>{`
        .at-root { color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .at-toast { position: fixed; top: 24px; right: 24px; z-index: 1200; display: flex; align-items: center; gap: 10px; padding: 13px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.18); color: #fff; min-width: 240px; animation: at-slide .28s cubic-bezier(.4,0,.2,1); }
        .at-toast.success { background: #008b3e; } .at-toast.error { background: #dc2626; }
        @keyframes at-slide { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .at-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 28px; border-bottom: 1.5px solid #e2e8f0; margin-bottom: 28px; flex-wrap: wrap; gap: 14px; }
        .at-header__left { display: flex; align-items: center; gap: 14px; }
        .at-header__icon { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #008b3e, #00b84f); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 17px; flex-shrink: 0; box-shadow: 0 3px 10px rgba(0,139,62,.25); }
        .at-header__title { margin: 0 0 2px; font-size: 22px; font-weight: 800; letter-spacing: -.4px; }
        .at-header__sub { margin: 0; font-size: 13px; color: #64748b; }
        .at-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
        .at-stat { background: #fff; border: 1.5px solid var(--bd); border-radius: 12px; padding: 18px 20px; display: flex; align-items: center; gap: 14px; }
        .at-stat__icon { width: 44px; height: 44px; border-radius: 10px; background: var(--bg); color: var(--c); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
        .at-stat__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #64748b; margin-bottom: 4px; }
        .at-stat__value { font-size: 22px; font-weight: 800; color: var(--c); }
        .at-stat__sub { font-size: 12px; color: #94a3b8; margin-top: 2px; }
        .at-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: box-shadow .15s, opacity .15s; }
        .at-btn--primary { background: linear-gradient(135deg,#008b3e,#00b84f); color: #fff; box-shadow: 0 2px 10px rgba(0,139,62,.3); }
        .at-btn--primary:hover { box-shadow: 0 4px 16px rgba(0,139,62,.38); }
        .at-btn--ghost { background: #f8fafc; color: #374151; border: 1.5px solid #e2e8f0; }
        .at-btn--ghost:hover { background: #f1f5f9; }
        .at-btn--danger { background: #dc2626; color: #fff; }
        .at-btn--warn { background: #fef3c7; color: #b45309; border: 1.5px solid #fde68a; }
        .at-btn:disabled { opacity: .5; cursor: not-allowed; }
        .at-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 24px; margin-bottom: 24px; }
        .at-card__head { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
        .at-form-section { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .1em; color: #94a3b8; margin: 0 0 12px; }
        .at-form-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 20px; }
        .at-fg { display: flex; flex-direction: column; gap: 7px; }
        .at-fg--2 { grid-column: span 2; }
        .at-label { font-size: 13px; font-weight: 600; color: #374151; }
        .at-input, .at-select { height: 40px; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 12px; font-size: 14px; color: #1e293b; background: #fafbfc; width: 100%; box-sizing: border-box; outline: none; transition: border-color .15s, box-shadow .15s; }
        .at-input:focus, .at-select:focus { border-color: #008b3e; background: #fff; box-shadow: 0 0 0 3px rgba(0,139,62,.1); }
        .at-input:disabled, .at-select:disabled { background: #f1f5f9; color: #94a3b8; }
        .at-readonly { height: 40px; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 12px; font-size: 14px; background: #f8fafc; color: #475569; font-weight: 600; display: flex; align-items: center; }
        .at-form-actions { display: flex; gap: 10px; padding-top: 8px; }
        .at-tabs-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 18px; }
        .at-tabs { display: flex; gap: 6px; }
        .at-tab { padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #64748b; transition: all .15s; }
        .at-tab.active { background: #008b3e; color: #fff; border-color: #008b3e; }
        .at-filters { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .at-finput { height: 36px; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 11px; font-size: 13px; color: #1e293b; background: #fafbfc; outline: none; transition: border-color .15s; }
        .at-finput:focus { border-color: #008b3e; }
        .at-table-wrap { border-radius: 10px; border: 1.5px solid #e2e8f0; overflow-x: auto; }
        .at-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .at-table thead tr { background: #f8fafc; }
        .at-table th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; border-bottom: 1.5px solid #e2e8f0; white-space: nowrap; }
        .at-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .at-table tbody tr:last-child td { border-bottom: none; }
        .at-table tbody tr:hover td { background: #f8fbff; }
        .at-tfoot td { background: #f8fafc; font-size: 12px; font-weight: 700; color: #475569; border-top: 2px solid #e2e8f0; padding: 10px 14px; }
        .at-td-num { color: #94a3b8; font-size: 12px; width: 36px; }
        .at-emp-cell { display: flex; align-items: center; gap: 10px; }
        .at-avatar { width: 32px; height: 32px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; flex-shrink: 0; }
        .at-emp-name { font-weight: 700; font-size: 13px; color: #0f172a; }
        .at-emp-id { font-size: 11px; color: #94a3b8; }
        .at-status-badge { display: inline-flex; align-items: center; gap: 5px; border-radius: 20px; padding: 3px 10px; font-size: 11px; font-weight: 700; white-space: nowrap; }
        .at-time-mono { font-family: "SF Mono","Fira Code",monospace; font-size: 12px; color: #475569; }
        .at-wh { font-family: "SF Mono","Fira Code",monospace; font-weight: 700; color: #15803d; }
        .at-actions { display: flex; gap: 5px; }
        .at-act { width: 30px; height: 30px; border: none; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: transform .12s; }
        .at-act:hover { transform: scale(1.08); }
        .at-act--edit { background: #eff6ff; color: #2563eb; }
        .at-act--del { background: #fef2f2; color: #dc2626; }
        .at-empty { display: flex; flex-direction: column; align-items: center; padding: 52px 20px; color: #94a3b8; }
        .at-empty i { font-size: 40px; margin-bottom: 10px; }
        .at-empty p { margin: 0 0 4px; font-weight: 600; color: #64748b; font-size: 14px; }
        .at-loading { display: flex; align-items: center; gap: 12px; padding: 40px; justify-content: center; color: #64748b; }
        .at-spinner { width: 22px; height: 22px; border: 3px solid #e2e8f0; border-top-color: #008b3e; border-radius: 50%; animation: at-spin .7s linear infinite; }
        @keyframes at-spin { to { transform: rotate(360deg); } }
        .at-pagination { display: flex; justify-content: space-between; align-items: center; padding: 16px 0 0; border-top: 1px solid #f1f5f9; margin-top: 16px; flex-wrap: wrap; gap: 10px; }
        .at-pg-left { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
        .at-pg-select { height: 32px; border: 1.5px solid #e2e8f0; border-radius: 7px; padding: 0 8px; font-size: 13px; background: #fafbfc; cursor: pointer; outline: none; }
        .at-pg-right { display: flex; align-items: center; gap: 8px; }
        .at-pg-info { font-size: 13px; color: #64748b; }
        .at-pg-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border: 1.5px solid #e2e8f0; background: #fafbfc; border-radius: 8px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; transition: background .15s; }
        .at-pg-btn:hover:not(:disabled) { background: #f1f5f9; }
        .at-pg-btn:disabled { opacity: .45; cursor: not-allowed; }
        .at-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.55); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .at-modal { background: #fff; border-radius: 16px; width: 460px; max-width: 92vw; box-shadow: 0 24px 60px rgba(15,23,42,.22); animation: at-mi .22s cubic-bezier(.4,0,.2,1); overflow: hidden; }
        @keyframes at-mi { from { transform: translateY(18px) scale(.97); opacity: 0; } to { transform: none; opacity: 1; } }
        .at-modal__hd { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid #f1f5f9; }
        .at-modal__title { font-size: 16px; font-weight: 800; color: #dc2626; display: flex; align-items: center; gap: 8px; }
        .at-modal__close { width: 30px; height: 30px; border: none; background: #f1f5f9; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 13px; }
        .at-modal__body { padding: 24px 22px; text-align: center; }
        .at-modal__ft { padding: 14px 22px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }
        .at-footer { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; padding-top: 16px; border-top: 1px solid #f1f5f9; margin-top: 4px; }
        .at-status-summary { display: flex; gap: 14px; flex-wrap: wrap; }
        .at-ss-item { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #64748b; }
        @media (max-width: 1100px) {
          .at-root { width: 100%; max-width: 100%; min-width: 0; }
          .at-stats { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .at-form-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .at-fg--2 { grid-column: span 2; }
          .at-table { min-width: 1000px; }
        }

        @media (max-width: 768px) {
          .at-root { width: 100%; max-width: 100%; min-width: 0; overflow-x: hidden; }
          .at-header { align-items: flex-start; padding-bottom: 20px; margin-bottom: 20px; }
          .at-header__left { width: 100%; min-width: 0; }
          .at-header__left > div:last-child { min-width: 0; }
          .at-header__title { font-size: 20px; }
          .at-header__sub { line-height: 1.5; }
          .at-header > .at-btn { width: 100%; justify-content: center; }

          .at-stats {
            grid-template-columns: repeat(2,minmax(0,1fr));
            gap: 10px;
            margin-bottom: 20px;
          }
          .at-stat { padding: 14px; gap: 10px; min-width: 0; }
          .at-stat__icon { width: 38px; height: 38px; font-size: 17px; }
          .at-stat__label { font-size: 10px; }
          .at-stat__value { font-size: 19px; }
          .at-stat__sub { font-size: 10px; }

          .at-card { padding: 16px; border-radius: 12px; margin-bottom: 16px; }
          .at-form-grid { grid-template-columns: minmax(0,1fr); gap: 14px; }
          .at-fg, .at-fg--2 { grid-column: auto; min-width: 0; }
          .at-form-actions { flex-direction: column; }
          .at-form-actions .at-btn { width: 100%; justify-content: center; }

          .at-fg > div[style*="height: 40"] {
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
            overflow-y: visible;
            padding-bottom: 2px;
          }

          .at-tabs-row { align-items: stretch; }
          .at-tabs-row > div:first-child { width: 100%; }
          .at-filters {
            width: 100%;
            display: grid;
            grid-template-columns: minmax(0,1fr) minmax(0,1fr);
          }
          .at-filters .at-finput { width: 100% !important; min-width: 0; }
          .at-filters .at-finput:first-child { grid-column: 1 / -1; }
          .at-filters .at-pg-btn { width: 100%; justify-content: center; }

          .at-tabs {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 4px;
            scrollbar-width: thin;
            -webkit-overflow-scrolling: touch;
          }
          .at-tab { flex: 0 0 auto; white-space: nowrap; }

          .at-table-wrap {
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          .at-table { min-width: 1000px; }

          .at-pagination { flex-direction: column; align-items: stretch; }
          .at-pg-left { justify-content: center; flex-wrap: wrap; }
          .at-pg-right { justify-content: center; flex-wrap: wrap; }
          .at-pg-info { width: 100%; text-align: center; }
          .at-pg-right .at-pg-btn { flex: 1; justify-content: center; }

          .at-footer { align-items: flex-start; }
          .at-status-summary { gap: 10px; }

          .at-toast {
            top: 12px;
            right: 12px;
            left: 12px;
            width: auto;
            min-width: 0;
          }
          .at-overlay { padding: 16px; }
          .at-modal { width: 100%; max-width: 460px; }
        }

        @media (max-width: 480px) {
          .at-stats { grid-template-columns: 1fr; }
          .at-filters { grid-template-columns: 1fr; }
          .at-filters .at-finput:first-child { grid-column: auto; }
          .at-card { padding: 14px 12px; }
          .at-header__icon { width: 36px; height: 36px; }
          .at-modal__hd, .at-modal__body, .at-modal__ft {
            padding-left: 16px;
            padding-right: 16px;
          }
          .at-modal__ft { flex-direction: column-reverse; }
          .at-modal__ft .at-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      {toast.show && (
        <div className={`at-toast ${toast.type}`}>
          <i
            className={
              toast.type === "success"
                ? "bi bi-check-circle-fill"
                : "bi bi-exclamation-triangle-fill"
            }
          />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="at-header">
        <div className="at-header__left">
          <div className="at-header__icon">
            <i className="bi bi-calendar-check"></i>
          </div>
          <div>
            <h1 className="at-header__title">Attendance</h1>
            <p className="at-header__sub">
              Track daily attendance, leaves and working hours
            </p>
          </div>
        </div>
        <button
          className={`at-btn ${showForm ? "at-btn--warn" : "at-btn--primary"}`}
          disabled={!canMarkAttendance}
          title={
            !canMarkAttendance
              ? "Please select a specific branch to mark attendance"
              : ""
          }
          onClick={showForm ? closeForm : handleOpenForm}
        >
          <i className={`bi ${showForm ? "bi-x-lg" : "bi-plus-lg"}`} />
          {showForm ? "Close Form" : "Mark Attendance"}
        </button>
      </div>

      <div className="at-stats">
        {[
          {
            label: "Total Employees",
            value: stats.total_employees || 0,
            sub: `${todayRecords.length} marked today`,
            c: "#008b3e",
            bg: "#dcfce7",
            bd: "#86efac",
            icon: "bi-people-fill",
          },
          {
            label: "Present Today",
            value: todayPresent,
            sub:
              todayPresent > 0 && stats.total_employees
                ? `${Math.round((todayPresent / stats.total_employees) * 100)}% attendance`
                : "No records yet",
            c: "#15803d",
            bg: "#dcfce7",
            bd: "#86efac",
            icon: "bi-check-circle-fill",
          },
          {
            label: "Absent Today",
            value: todayAbsent,
            sub: `${todayHalf} half day`,
            c: "#dc2626",
            bg: "#fee2e2",
            bd: "#fca5a5",
            icon: "bi-x-circle-fill",
          },
          {
            label: "Work From Site",
            value: todayWFS,
            sub:
              todayWFS > 0 ? `${todayWFS} working from site` : "No WFS today",
            c: "#7c3aed",
            bg: "#ede9fe",
            bd: "#c4b5fd",
            icon: "bi-geo-alt-fill",
          },
        ].map((card) => (
          <div
            className="at-stat"
            key={card.label}
            style={{ "--c": card.c, "--bg": card.bg, "--bd": card.bd }}
          >
            <div className="at-stat__icon">
              <i className={`bi ${card.icon}`}></i>
            </div>
            <div>
              <div className="at-stat__label">{card.label}</div>
              <div className="at-stat__value">{card.value}</div>
              <div className="at-stat__sub">{card.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {showForm && canMarkAttendance && (
        <div className="at-card">
          <div className="at-card__head">
            <i
              className={`bi ${editingId ? "bi-pencil-fill" : "bi-person-check-fill"}`}
              style={{ color: editingId ? "#d97706" : "#008b3e" }}
            ></i>
            <span>
              {editingId ? "Edit Attendance Record" : "Mark New Attendance"}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <p className="at-form-section">Employee Information</p>
            <div className="at-form-grid">
              <div className="at-fg at-fg--2">
                <label className="at-label">
                  Employee Name <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <Select
                  menuPlacement="bottom"
                  menuPosition="fixed"
                  isClearable
                  isDisabled={empLoading}
                  placeholder={empLoading ? "Loading…" : "Select employee…"}
                  value={empValue}
                  onChange={handleEmployeeSelect}
                  options={empOptions}
                  styles={rsEmp}
                />
              </div>
              <div className="at-fg">
                <label className="at-label">Employee ID</label>
                <div className="at-readonly">
                  {form.employee_id || (
                    <span style={{ color: "#94a3b8" }}>Auto-filled</span>
                  )}
                </div>
              </div>
            </div>
            <p className="at-form-section">Attendance Details</p>
            <div className="at-form-grid">
              <div className="at-fg">
                <label className="at-label">
                  Date <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  className="at-input"
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="at-fg">
                <label className="at-label">
                  Status <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <select
                  className="at-select"
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
              {form.status === "On Leave" && (
                <div className="at-fg">
                  <label className="at-label">Leave Type</label>
                  <select
                    className="at-select"
                    name="leave_type"
                    value={form.leave_type}
                    onChange={handleChange}
                  >
                    <option value="">Select type…</option>
                    {LEAVE_TYPES.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="at-fg">
                <label className="at-label">
                  Check In{" "}
                  {isTimeRequired() && (
                    <span style={{ color: "#ef4444" }}>*</span>
                  )}
                </label>
                <TimePicker12
                  name="check_in"
                  value={form.check_in}
                  onChange={handleChange}
                  required={isTimeRequired()}
                />
              </div>
              <div className="at-fg">
                <label className="at-label">
                  Check Out{" "}
                  {isTimeRequired() && (
                    <span style={{ color: "#ef4444" }}>*</span>
                  )}
                </label>
                <TimePicker12
                  name="check_out"
                  value={form.check_out}
                  onChange={handleChange}
                  required={isTimeRequired()}
                />
              </div>
              <div className="at-fg">
                <label className="at-label">Work Hours</label>
                <div
                  className="at-readonly"
                  style={{
                    color: form.work_hours ? "#15803d" : "#94a3b8",
                    fontWeight: 700,
                  }}
                >
                  {form.work_hours ? `${form.work_hours} hrs` : "—"}
                </div>
              </div>
            </div>
            <div className="at-form-actions">
              <button type="submit" className="at-btn at-btn--primary">
                <i
                  className={`bi ${editingId ? "bi-check-circle" : "bi-check-lg"}`}
                />{" "}
                {editingId ? "Update Record" : "Save Attendance"}
              </button>
              <button
                type="button"
                className="at-btn at-btn--ghost"
                onClick={() => setForm(emptyForm)}
              >
                <i className="bi bi-arrow-counterclockwise" /> Reset
              </button>
              {editingId && (
                <button
                  type="button"
                  className="at-btn at-btn--warn"
                  onClick={closeForm}
                >
                  <i className="bi bi-x-lg" /> Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      <div className="at-card">
        <div className="at-tabs-row">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
              Attendance Records
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              {loading
                ? "Loading…"
                : `${records.length} record${records.length !== 1 ? "s" : ""} shown`}
            </div>
          </div>
          <div className="at-filters">
            <input
              className="at-finput"
              style={{ width: 180 }}
              type="text"
              placeholder="Search name / ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              className="at-finput"
              style={{ width: 140 }}
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <select
              className="at-finput"
              style={{ width: 140 }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Status</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button
              className="at-pg-btn"
              onClick={fetchRecords}
              title="Refresh"
            >
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>
        <div className="at-tabs">
          {[
            ["all", "All Records"],
            ["today", "Today"],
            ["week", "This Week"],
          ].map(([val, label]) => (
            <button
              key={val}
              className={`at-tab${activeTab === val ? " active" : ""}`}
              onClick={() => setActiveTab(val)}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          {loading ? (
            <div className="at-loading">
              <div className="at-spinner"></div>
              <span>Loading records…</span>
            </div>
          ) : records.length === 0 ? (
            <div className="at-empty">
              <i className="bi bi-calendar-x"></i>
              <p>No records found</p>
              <span>
                {apiError
                  ? "Check backend console."
                  : "Start by marking attendance above."}
              </span>
            </div>
          ) : (
            <>
              <div className="at-table-wrap">
                <table className="at-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Employee</th>
                      {showBranchColumn && <th>Branch</th>}
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Work Hrs</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRecords.map((rec, idx) => {
                      const meta = STATUS_META[rec.status] || {
                        bg: "#f1f5f9",
                        color: "#475569",
                        icon: "bi-dash-circle",
                      };
                      const hue = (rec.employee_name.charCodeAt(0) * 7) % 360;
                      return (
                        <tr key={rec.id}>
                          <td className="at-td-num">{startIndex + idx + 1}</td>
                          <td>
                            <div className="at-emp-cell">
                              <div
                                className="at-avatar"
                                style={{
                                  background: `hsl(${hue},60%,90%)`,
                                  color: `hsl(${hue},50%,35%)`,
                                }}
                              >
                                {rec.employee_name
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((w) => w[0])
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="at-emp-name">
                                  {rec.employee_name}
                                </div>
                                <div className="at-emp-id">
                                  {rec.employee_id || "—"}
                                </div>
                              </div>
                            </div>
                          </td>
                          {showBranchColumn && (
                            <td style={{ fontSize: 12, color: "#475569" }}>
                              {branchesMap[rec.branch_id] ||
                                `Branch #${rec.branch_id}` ||
                                "—"}
                            </td>
                          )}
                          <td
                            style={{
                              fontWeight: 600,
                              color: "#374151",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {rec.date}
                          </td>
                          <td>
                            <span className="at-time-mono">
                              {rec.check_in ? formatTime12(rec.check_in) : "—"}
                            </span>
                          </td>
                          <td>
                            <span className="at-time-mono">
                              {rec.check_out
                                ? formatTime12(rec.check_out)
                                : "—"}
                            </span>
                          </td>
                          <td>
                            <span className="at-wh">
                              {rec.work_hours > 0
                                ? `${parseFloat(rec.work_hours).toFixed(1)}h`
                                : "—"}
                            </span>
                          </td>
                          <td>
                            <span
                              className="at-status-badge"
                              style={{ background: meta.bg, color: meta.color }}
                            >
                              <i
                                className={`bi ${meta.icon}`}
                                style={{ fontSize: 10 }}
                              ></i>
                              {rec.status}
                            </span>
                          </td>
                          <td>
                            <span className="at-time-mono">
                              {formatTime(rec.created_at)}
                            </span>
                          </td>
                          <td>
                            <div
                              className="at-actions"
                              style={{ justifyContent: "flex-end" }}
                            >
                              {canEditDelete ? (
                                <>
                                  <button
                                    className="at-act at-act--edit"
                                    onClick={() => handleEdit(rec)}
                                    title="Edit"
                                  >
                                    <i className="bi bi-pencil-fill"></i>
                                  </button>
                                  <button
                                    className="at-act at-act--del"
                                    onClick={() => setDeleteConfirm(rec)}
                                    title="Delete"
                                  >
                                    <i className="bi bi-trash-fill"></i>
                                  </button>
                                </>
                              ) : (
                                <span
                                  style={{ color: "#cbd5e1", fontSize: 11 }}
                                >
                                  —
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="at-tfoot">
                      <td colSpan={showBranchColumn ? 5 : 4}>
                        Totals — {records.length} record
                        {records.length !== 1 ? "s" : ""}
                      </td>
                      <td style={{ color: "#15803d", fontFamily: "monospace" }}>
                        {records
                          .reduce((s, r) => s + (Number(r.work_hours) || 0), 0)
                          .toFixed(1)}
                        h
                      </td>
                      <td colSpan={4}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="at-pagination">
                <div className="at-pg-left">
                  Show
                  <select
                    className="at-pg-select"
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={-1}>All</option>
                  </select>
                  entries per page
                </div>
                {rowsPerPage !== -1 && (
                  <div className="at-pg-right">
                    <span className="at-pg-info">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className="at-pg-btn"
                      disabled={currentPage === 1}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      <i className="bi bi-chevron-left"></i> Previous
                    </button>
                    <button
                      className="at-pg-btn"
                      disabled={currentPage === totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Next <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                )}
              </div>
              <div className="at-footer">
                <div className="at-status-summary">
                  {STATUSES.map((s) => {
                    const cnt = records.filter((r) => r.status === s).length;
                    if (!cnt) return null;
                    const m = STATUS_META[s] || {
                      color: "#475569",
                      icon: "bi-dash-circle",
                    };
                    return (
                      <span key={s} className="at-ss-item">
                        <i
                          className={`bi ${m.icon}`}
                          style={{ color: m.color }}
                        ></i>
                        {cnt} {s}
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="at-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="at-modal" onClick={(e) => e.stopPropagation()}>
            <div className="at-modal__hd">
              <div className="at-modal__title">
                <i className="bi bi-trash"></i> Delete Record
              </div>
              <button
                className="at-modal__close"
                onClick={() => setDeleteConfirm(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="at-modal__body">
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "#fef2f2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 14px",
                  fontSize: 22,
                  color: "#dc2626",
                }}
              >
                <i className="bi bi-exclamation-triangle-fill"></i>
              </div>
              <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 15 }}>
                Remove attendance for{" "}
                <strong>{deleteConfirm.employee_name}</strong>
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                on <strong>{deleteConfirm.date}</strong>? This action is
                permanent.
              </p>
            </div>
            <div className="at-modal__ft">
              <button
                className="at-btn at-btn--ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="at-btn at-btn--danger"
                onClick={() => handleDelete(deleteConfirm.id)}
              >
                <i className="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
