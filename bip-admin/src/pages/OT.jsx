import React, { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import { apiFetch } from "../utils/api";

const OT = () => {

  const [employees, setEmployees] = useState([]);
  const [otRecords, setOtRecords] = useState([]);
  const [branchesMap, setBranchesMap] = useState({});
  const [viewMode, setViewMode] = useState("add");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    emp_id: "",
    salary_min: "",
    hours_min: "",
    date_from: "",
    date_to: "",
  });
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(
      () => setToast({ show: false, message: "", type: "success" }),
      3000,
    );
  };

  const [formData, setFormData] = useState({
    selected_employee: "",
    emp_name: "",
    emp_id: "",
    salary_type: "",
    start_time_hour: "12",
    start_time_minute: "00",
    start_time_ampm: "AM",
    end_time_hour: "12",
    end_time_minute: "00",
    end_time_ampm: "AM",
    ot_date: "",
    ot_salary: "",
  });

  const role = localStorage.getItem("role");
  const selectedBranch = localStorage.getItem("admin_view_branch");
  const isAdmin = role === "admin";
  const isAllBranches = isAdmin && !selectedBranch;

  const getHeaders = (includeContentType = false) => {
    const headers = {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    };
    if (includeContentType) headers["Content-Type"] = "application/json";
    if (isAdmin && selectedBranch) headers["X-Branch-ID"] = selectedBranch;
    return headers;
  };

  const convertTo24Hour = (hour, minute, ampm) => {
    let h = parseInt(hour);
    if (ampm === "PM" && h !== 12) h += 12;
    else if (ampm === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minute.padStart(2, "0")}`;
  };
  const getFormattedTime = (hour, minute, ampm) =>
    `${hour}:${minute.padStart(2, "0")} ${ampm}`;
  const getStartTimeFormatted = () =>
    getFormattedTime(
      formData.start_time_hour,
      formData.start_time_minute,
      formData.start_time_ampm,
    );
  const getEndTimeFormatted = () =>
    getFormattedTime(
      formData.end_time_hour,
      formData.end_time_minute,
      formData.end_time_ampm,
    );

  const fetchBranches = async () => {
    if (!isAllBranches) return;
    try {
     const res = await apiFetch("/branches/get_branches.php?simple=1");
      if (!res.ok) return;
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.branches || [];
      const map = {};
      list.forEach((b) => {
        map[b.id] = b.name || b.branch_name || `Branch ${b.id}`;
      });
      setBranchesMap(map);
    } catch {}
  };

  const fetchEmployees = async () => {
    try {
      const res = await apiFetch("/employees/get_employees.php?simple=1");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEmployees(Array.isArray(data) ? data : data.data || []);
    } catch {
      showToast("Failed to fetch employees", "error");
    }
  };

  const fetchOTRecords = async () => {
    try {
      const res = await apiFetch("/ot/get_ot_details.php");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setOtRecords(Array.isArray(data) ? data : []);
    } catch {
      showToast("Failed to fetch OT records", "error");
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchOTRecords();
    fetchBranches();
  }, []);

  const handleEmployeeChange = (e) => {
    const id = e.target.value;
    const emp = employees.find((em) => String(em.id) === String(id));
    setFormData({
      ...formData,
      selected_employee: id,
      emp_name: emp?.employee_name || emp?.emp_name || "",
      emp_id: emp?.emp_id || "",
      salary_type: emp?.salary_type || "",
    });
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleMinuteChange = (field, value) => {
    let m = parseInt(value);
    if (isNaN(m)) m = 0;
    m = Math.min(59, Math.max(0, m));
    setFormData({ ...formData, [field]: m.toString().padStart(2, "0") });
  };

  const totalOTHours = useMemo(() => {
    const s = convertTo24Hour(
      formData.start_time_hour,
      formData.start_time_minute,
      formData.start_time_ampm,
    );
    const e = convertTo24Hour(
      formData.end_time_hour,
      formData.end_time_minute,
      formData.end_time_ampm,
    );
    if (!s || !e) return 0;
    let start = new Date(`2000-01-01T${s}`);
    let end = new Date(`2000-01-01T${e}`);
    if (end <= start) end = new Date(`2000-01-02T${e}`);
    return Number(((end - start) / 3600000).toFixed(2));
  }, [
    formData.start_time_hour,
    formData.start_time_minute,
    formData.start_time_ampm,
    formData.end_time_hour,
    formData.end_time_minute,
    formData.end_time_ampm,
  ]);

  const resetForm = () => {
    setFormData({
      selected_employee: "",
      emp_name: "",
      emp_id: "",
      salary_type: "",
      start_time_hour: "12",
      start_time_minute: "00",
      start_time_ampm: "AM",
      end_time_hour: "12",
      end_time_minute: "00",
      end_time_ampm: "AM",
      ot_date: "",
      ot_salary: "",
    });
    setEditingId(null);
  };

  const isDuplicate = () =>
    !editingId &&
    otRecords.some(
      (r) => r.emp_id === formData.emp_id && r.ot_date === formData.ot_date,
    );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isDuplicate()) {
      showToast(
        "OT entry already exists for this employee on this date",
        "error",
      );
      return;
    }
    const payload = {
      emp_name: formData.emp_name,
      emp_id: formData.emp_id,
      salary_type: formData.salary_type,
      start_time: getStartTimeFormatted(),
      end_time: getEndTimeFormatted(),
      total_ot_hours: totalOTHours,
      ot_salary: parseFloat(formData.ot_salary) || 0,
      ot_date: formData.ot_date,
    };
    try {
    const res = await apiFetch(
      editingId
        ? `/ot/update_ot_details.php?id=${editingId}`
        : "/ot/add_ot_details.php",
      {
        method: editingId ? "PUT" : "POST",
        body: JSON.stringify(payload),
      },
    );
      const result = await res.json();
      if (res.ok) {
        showToast(editingId ? "OT record updated" : "OT details saved");
        resetForm();
        fetchOTRecords();
        if (!editingId) setViewMode("records");
      } else showToast(result.message || "Operation failed", "error");
    } catch {
      showToast("Server error", "error");
    }
  };

  const handleEdit = (record) => {
    if (!isAdmin) {
      showToast("Only admin can edit records", "error");
      return;
    }
    const parseTime = (t) => {
      const [time, mod] = t.split(" ");
      let [h, m] = time.split(":");
      return {
        hour: String(parseInt(h)).padStart(2, "0"),
        minute: m,
        ampm: mod,
      };
    };
    const s = parseTime(record.start_time);
    const e = parseTime(record.end_time);
    setFormData({
      ...formData,
      emp_name: record.emp_name,
      emp_id: record.emp_id,
      salary_type: record.salary_type,
      start_time_hour: s.hour,
      start_time_minute: s.minute,
      start_time_ampm: s.ampm,
      end_time_hour: e.hour,
      end_time_minute: e.minute,
      end_time_ampm: e.ampm,
      ot_date: record.ot_date,
      ot_salary: record.ot_salary,
    });
    setEditingId(record.id);
    setViewMode("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await apiFetch(
        `/ot/delete_ot_details.php?id=${deleteConfirm.id}`,
        {
          method: "DELETE",
        },
      );
      const result = await res.json();
      if (res.ok) {
        showToast("OT record deleted");
        fetchOTRecords();
        setCurrentPage(1);
      } else showToast(result.message || "Delete failed", "error");
    } catch {
      showToast("Server error", "error");
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleToggleView = () => {
    if (viewMode === "add") {
      fetchOTRecords();
      setViewMode("records");
      resetForm();
    } else setViewMode("add");
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
    setCurrentPage(1);
  };

  const filteredRecords = otRecords.filter((rec) => {
    if (
      filters.emp_id &&
      !rec.emp_id.toLowerCase().includes(filters.emp_id.toLowerCase())
    )
      return false;
    if (
      filters.salary_min &&
      parseFloat(rec.ot_salary || 0) < parseFloat(filters.salary_min)
    )
      return false;
    if (
      filters.hours_min &&
      parseFloat(rec.total_ot_hours || 0) < parseFloat(filters.hours_min)
    )
      return false;
    if (filters.date_from && rec.ot_date < filters.date_from) return false;
    if (filters.date_to && rec.ot_date > filters.date_to) return false;
    return (
      searchTerm === "" ||
      rec.emp_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.emp_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.ot_date.includes(searchTerm)
    );
  });

  const totalFiltered = filteredRecords.length;
  const totalPages =
    rowsPerPage === -1 ? 1 : Math.ceil(totalFiltered / rowsPerPage);
  const startIndex = rowsPerPage === -1 ? 0 : (currentPage - 1) * rowsPerPage;
  const paginatedRecords =
    rowsPerPage === -1
      ? filteredRecords
      : filteredRecords.slice(startIndex, startIndex + rowsPerPage);
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const totalEntries = otRecords.length;
  const totalSavedHours = otRecords.reduce(
    (s, r) => s + Number(r.total_ot_hours || 0),
    0,
  );
  const totalSavedSalary = otRecords.reduce(
    (s, r) => s + Number(r.ot_salary || 0),
    0,
  );
  const totalEmployees = new Set(otRecords.map((r) => r.emp_id).filter(Boolean))
    .size;
  const hourOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1).padStart(2, "0"),
    label: String(i + 1).padStart(2, "0"),
  }));
  const formatTimeOnly = (ts) =>
    ts
      ? new Date(ts).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  return (
    <div className="ot-root">
      <style>{`
        .ot-root { color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        .ot-toast { position: fixed; top: 24px; right: 24px; z-index: 1200; display: flex; align-items: center; gap: 10px; padding: 13px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,0.18); color: #fff; min-width: 240px; animation: ot-slide .28s cubic-bezier(.4,0,.2,1); }
        .ot-toast.success { background: #008b3e; } .ot-toast.error { background: #dc2626; }
        @keyframes ot-slide { from { transform: translateX(110%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        .ot-header { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding-bottom: 28px; border-bottom: 1.5px solid #e2e8f0; margin-bottom: 28px; flex-wrap: wrap; }
        .ot-header__left { display: flex; align-items: center; gap: 14px; }
        .ot-header__icon { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #008b3e, #00b84f); display: flex; align-items: center; justify-content: center; color: #fff; font-size: 17px; flex-shrink: 0; box-shadow: 0 3px 10px rgba(0,139,62,.25); }
        .ot-header__title { margin: 0 0 2px; font-size: 22px; font-weight: 800; letter-spacing: -.4px; }
        .ot-header__sub { margin: 0; font-size: 13px; color: #64748b; }

        .ot-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
        .ot-stat { background: #fff; border: 1.5px solid var(--bd); border-radius: 12px; padding: 16px 18px; display: flex; align-items: center; gap: 14px; }
        .ot-stat__icon { width: 42px; height: 42px; border-radius: 10px; background: var(--bg); color: var(--c); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0; }
        .ot-stat__label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; color: #64748b; margin-bottom: 4px; }
        .ot-stat__value { font-size: 20px; font-weight: 800; color: var(--c); font-family: "SF Mono","Fira Code",monospace; }

        .ot-btn { display: inline-flex; align-items: center; gap: 7px; padding: 9px 20px; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; border: none; transition: box-shadow .15s; }
        .ot-btn--primary { background: linear-gradient(135deg,#008b3e,#00b84f); color:#fff; box-shadow: 0 2px 8px rgba(0,139,62,.3); }
        .ot-btn--primary:hover { box-shadow: 0 4px 16px rgba(0,139,62,.38); }
        .ot-btn--ghost { background: #f8fafc; color: #374151; border: 1.5px solid #e2e8f0; }
        .ot-btn--ghost:hover { background: #f1f5f9; }
        .ot-btn--warn { background: #fef3c7; color: #b45309; border: 1.5px solid #fde68a; }
        .ot-btn--danger { background: #dc2626; color: #fff; }

        .ot-card { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 24px; margin-bottom: 24px; }
        .ot-card__head { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 700; color: #1e293b; margin-bottom: 22px; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; }
        .ot-card__head i { color: #008b3e; font-size: 17px; }

        .ot-form-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px; }
        .ot-fg { display: flex; flex-direction: column; gap: 7px; }
        .ot-fg--full { grid-column: 1 / -1; }
        .ot-label { font-size: 13px; font-weight: 600; color: #374151; }
        .ot-req { color: #ef4444; margin-left: 3px; }
        .ot-input, .ot-select { height: 40px; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 12px; font-size: 14px; color: #1e293b; background: #fafbfc; width: 100%; box-sizing: border-box; outline: none; transition: border-color .15s, box-shadow .15s; }
        .ot-input:focus, .ot-select:focus { border-color: #008b3e; background: #fff; box-shadow: 0 0 0 3px rgba(0,139,62,.1); }
        .ot-input[readonly] { background: #f1f5f9; color: #64748b; cursor: not-allowed; }
        .ot-input:disabled, .ot-select:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }

        .ot-select-up { position: relative; }

        .ot-time-wrap { display: flex; align-items: center; gap: 6px; }
        .ot-time-wrap .ot-select { flex: 1; min-width: 0; padding: 0 6px; }
        .ot-time-sep { font-weight: 700; color: #64748b; font-size: 16px; flex-shrink: 0; }
        .ot-time-min { width: 56px; flex-shrink: 0; text-align: center; }
        .ot-ampm { display: flex; border-radius: 7px; border: 1.5px solid #e2e8f0; overflow: hidden; flex-shrink: 0; }
        .ot-ampm button { border: none; padding: 0 10px; font-size: 12px; font-weight: 700; cursor: pointer; height: 40px; transition: all .12s; }

        .ot-form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; flex-wrap: wrap; }

        .ot-tabs-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
        .ot-filters { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr; gap: 8px; margin-bottom: 18px; }
        .ot-finput { height: 36px; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 11px; font-size: 13px; color: #1e293b; background: #fafbfc; width: 100%; box-sizing: border-box; outline: none; }
        .ot-finput:focus { border-color: #008b3e; }

        .ot-table-wrap { border-radius: 10px; border: 1.5px solid #e2e8f0; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        .ot-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .ot-table thead tr { background: #f8fafc; }
        .ot-table th { padding: 11px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: .6px; border-bottom: 1.5px solid #e2e8f0; white-space: nowrap; }
        .ot-table td { padding: 12px 14px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; }
        .ot-table tbody tr:last-child td { border-bottom: none; }
        .ot-table tbody tr:hover td { background: #f8fffe; }
        .ot-id-tag { background: #f1f5f9; color: #475569; border-radius: 6px; padding: 2px 8px; font-size: 12px; font-weight: 700; font-family: "SF Mono","Fira Code",monospace; }
        .ot-salary { font-family: "SF Mono","Fira Code",monospace; font-weight: 700; color: #15803d; }
        .ot-hours { font-family: "SF Mono","Fira Code",monospace; font-weight: 600; color: #7c3aed; }
        .ot-time-cell { font-family: "SF Mono","Fira Code",monospace; font-size: 12px; color: #475569; }
        .ot-actions { display: flex; gap: 5px; }
        .ot-act { width: 30px; height: 30px; border: none; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: transform .12s; }
        .ot-act:hover { transform: scale(1.08); }
        .ot-act--edit { background: #eff6ff; color: #2563eb; }
        .ot-act--del  { background: #fef2f2; color: #dc2626; }

        .ot-empty { display: flex; flex-direction: column; align-items: center; padding: 52px 20px; color: #94a3b8; }
        .ot-empty i { font-size: 40px; margin-bottom: 10px; }
        .ot-empty p { margin: 0; font-weight: 600; color: #64748b; }

        .ot-pg { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 16px; border-top: 1px solid #f1f5f9; flex-wrap: wrap; gap: 10px; }
        .ot-pg-left { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #64748b; }
        .ot-pg-select { height: 32px; border: 1.5px solid #e2e8f0; border-radius: 7px; padding: 0 8px; font-size: 13px; background: #fafbfc; cursor: pointer; outline: none; }
        .ot-pg-right { display: flex; align-items: center; gap: 8px; }
        .ot-pg-info { font-size: 13px; color: #64748b; }
        .ot-pg-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 14px; border: 1.5px solid #e2e8f0; background: #fafbfc; border-radius: 8px; font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; }
        .ot-pg-btn:hover:not(:disabled) { background: #f1f5f9; }
        .ot-pg-btn:disabled { opacity: .45; cursor: not-allowed; }

        .ot-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.55); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: ot-fi .18s ease; }
        @keyframes ot-fi { from { opacity: 0; } to { opacity: 1; } }
        .ot-modal { background: #fff; border-radius: 16px; width: 400px; max-width: 92vw; box-shadow: 0 24px 60px rgba(15,23,42,.22); animation: ot-mi .22s cubic-bezier(.4,0,.2,1); overflow: hidden; }
        @keyframes ot-mi { from { transform: translateY(18px) scale(.97); opacity: 0; } to { transform: none; opacity: 1; } }
        .ot-modal__hd { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; border-bottom: 1px solid #f1f5f9; }
        .ot-modal__title { font-size: 16px; font-weight: 800; color: #dc2626; display: flex; align-items: center; gap: 8px; }
        .ot-modal__close { width: 30px; height: 30px; border: none; background: #f1f5f9; border-radius: 7px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 13px; }
        .ot-modal__body { padding: 24px 22px; text-align: center; }
        .ot-modal__ft { padding: 14px 22px; border-top: 1px solid #f1f5f9; display: flex; justify-content: flex-end; gap: 10px; }

        /* ── MOBILE RESPONSIVE ── */
        @media (max-width: 1100px) {
          .ot-form-grid { grid-template-columns: 1fr 1fr; }
          .ot-stats { grid-template-columns: 1fr 1fr; }
          .ot-filters { grid-template-columns: 1fr 1fr; }
        }

        @media (max-width: 640px) {
          .ot-root { font-size: 14px; }

          /* Header */
          .ot-header { padding-bottom: 16px; margin-bottom: 16px; gap: 10px; }
          .ot-header__title { font-size: 18px; }
          .ot-header__sub { font-size: 12px; }
          .ot-btn { padding: 8px 14px; font-size: 13px; }

          /* Toast */
          .ot-toast { top: 12px; right: 12px; left: 12px; min-width: unset; font-size: 13px; }

          /* Stats: 2 columns on mobile */
          .ot-stats { grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 16px; }
          .ot-stat { padding: 12px 12px; gap: 10px; }
          .ot-stat__icon { width: 34px; height: 34px; font-size: 15px; border-radius: 8px; }
          .ot-stat__value { font-size: 16px; }
          .ot-stat__label { font-size: 10px; }

          /* Card */
          .ot-card { padding: 16px; border-radius: 10px; margin-bottom: 16px; }
          .ot-card__head { font-size: 14px; margin-bottom: 16px; padding-bottom: 12px; }

          /* Form: single column */
          .ot-form-grid { grid-template-columns: 1fr; gap: 12px; }
          .ot-fg--full { grid-column: 1; }

          /* Time picker: tighten on small screens */
          .ot-time-wrap { gap: 4px; }
          .ot-time-min { width: 48px; }
          .ot-ampm button { padding: 0 8px; font-size: 11px; }

          /* Form actions: stack on very small screens */
          .ot-form-actions { flex-direction: column-reverse; align-items: stretch; }
          .ot-form-actions .ot-btn { justify-content: center; width: 100%; }

          /* Records toolbar */
          .ot-tabs-row { gap: 8px; }
          .ot-tabs-row input.ot-finput { width: 100% !important; }

          /* Filters: 1 column */
          .ot-filters { grid-template-columns: 1fr; gap: 8px; margin-bottom: 14px; }

          /* Pagination: stack */
          .ot-pg { flex-direction: column; align-items: flex-start; gap: 8px; }
          .ot-pg-right { width: 100%; justify-content: space-between; }
          .ot-pg-btn { flex: 1; justify-content: center; }

          /* Modal */
          .ot-modal { width: 94vw; }
          .ot-modal__hd, .ot-modal__body, .ot-modal__ft { padding-left: 16px; padding-right: 16px; }
          .ot-modal__ft { flex-direction: column-reverse; gap: 8px; }
          .ot-modal__ft .ot-btn { width: 100%; justify-content: center; }
        }

        @media (max-width: 400px) {
          /* Stats: keep 2 columns but shrink further */
          .ot-stat__value { font-size: 14px; }
          .ot-stat { padding: 10px; gap: 8px; }
        }
      `}</style>

      {toast.show && (
        <div className={`ot-toast ${toast.type}`}>
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

      {/* Header */}
      <div className="ot-header">
        <div className="ot-header__left">
          <div className="ot-header__icon">
            <i className="bi bi-clock-history"></i>
          </div>
          <div>
            <h1 className="ot-header__title">OT Details</h1>
            <p className="ot-header__sub">Manage employee overtime records</p>
          </div>
        </div>
        <button className="ot-btn ot-btn--primary" onClick={handleToggleView}>
          <i
            className={viewMode === "add" ? "bi bi-table" : "bi bi-plus-circle"}
          ></i>
          {viewMode === "add" ? "View OT Records" : "Add OT Entry"}
        </button>
      </div>

      {viewMode === "add" && (
        <>
          {/* Stats */}
          <div className="ot-stats">
            {[
              {
                label: "Entries",
                value: totalEntries,
                icon: "bi-receipt",
                c: "#1d4ed8",
                bg: "#dbeafe",
                bd: "#93c5fd",
              },
              {
                label: "Total Hours",
                value: `${totalSavedHours.toFixed(1)}h`,
                icon: "bi-clock-fill",
                c: "#7c3aed",
                bg: "#ede9fe",
                bd: "#c4b5fd",
              },
              {
                label: "Total Salary",
                value: `₹${totalSavedSalary.toFixed(0)}`,
                icon: "bi-cash-stack",
                c: "#15803d",
                bg: "#dcfce7",
                bd: "#86efac",
              },
              {
                label: "Employees",
                value: totalEmployees,
                icon: "bi-people-fill",
                c: "#b45309",
                bg: "#fef3c7",
                bd: "#fcd34d",
              },
            ].map((s) => (
              <div
                className="ot-stat"
                key={s.label}
                style={{ "--c": s.c, "--bg": s.bg, "--bd": s.bd }}
              >
                <div className="ot-stat__icon">
                  <i className={`bi ${s.icon}`}></i>
                </div>
                <div>
                  <div className="ot-stat__label">{s.label}</div>
                  <div className="ot-stat__value">{s.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="ot-card">
            <div className="ot-card__head">
              <i
                className={`bi ${editingId ? "bi-pencil-fill" : "bi-plus-circle"}`}
              ></i>
              <span>{editingId ? "Edit OT Entry" : "Add OT Entry"}</span>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="ot-form-grid">
                <div className="ot-fg ot-fg--full">
                  <label className="ot-label">
                    Employee <span className="ot-req">*</span>
                  </label>
                  <Select
                    menuPlacement="bottom"
                    menuPosition="fixed"
                    isDisabled={!!editingId}
                    value={
                      formData.selected_employee
                        ? {
                            value: formData.selected_employee,
                            label: employees.find(
                              (e) =>
                                String(e.id) ===
                                String(formData.selected_employee),
                            )
                              ? `${employees.find((e) => String(e.id) === String(formData.selected_employee))?.employee_name || employees.find((e) => String(e.id) === String(formData.selected_employee))?.emp_name} — ${employees.find((e) => String(e.id) === String(formData.selected_employee))?.emp_id}`
                              : "",
                          }
                        : null
                    }
                    onChange={(opt) =>
                      handleEmployeeChange({
                        target: { value: opt ? opt.value : "" },
                      })
                    }
                    options={employees.map((emp) => ({
                      value: String(emp.id),
                      label: `${emp.employee_name || emp.emp_name} — ${emp.emp_id}`,
                    }))}
                    placeholder="Select employee…"
                    isClearable
                    styles={{
                      control: (base, state) => ({
                        ...base,
                        height: 40,
                        minHeight: 40,
                        borderRadius: 8,
                        borderColor: state.isFocused ? "#008b3e" : "#e2e8f0",
                        boxShadow: state.isFocused
                          ? "0 0 0 3px rgba(0,139,62,.1)"
                          : "none",
                        background: "#fafbfc",
                        fontSize: 14,
                        "&:hover": { borderColor: "#008b3e" },
                      }),
                      valueContainer: (base) => ({
                        ...base,
                        padding: "0 12px",
                      }),
                      indicatorSeparator: () => ({ display: "none" }),
                      dropdownIndicator: (base) => ({
                        ...base,
                        padding: "0 8px",
                        color: "#94a3b8",
                      }),
                      menu: (base) => ({
                        ...base,
                        borderRadius: 8,
                        border: "1.5px solid #e2e8f0",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                        zIndex: 9999,
                      }),
                      option: (base, state) => ({
                        ...base,
                        fontSize: 14,
                        background: state.isSelected
                          ? "#008b3e"
                          : state.isFocused
                            ? "#f0fdf4"
                            : "#fff",
                        color: state.isSelected ? "#fff" : "#1e293b",
                      }),
                    }}
                  />
                </div>
                <div className="ot-fg">
                  <label className="ot-label">Name</label>
                  <input
                    className="ot-input"
                    type="text"
                    value={formData.emp_name}
                    readOnly
                  />
                </div>
                <div className="ot-fg">
                  <label className="ot-label">Employee ID</label>
                  <input
                    className="ot-input"
                    type="text"
                    value={formData.emp_id}
                    readOnly
                  />
                </div>
                <div className="ot-fg">
                  <label className="ot-label">Salary Type</label>
                  <input
                    className="ot-input"
                    type="text"
                    value={formData.salary_type}
                    readOnly
                  />
                </div>
                <div className="ot-fg">
                  <label className="ot-label">Total Hours</label>
                  <input
                    className="ot-input"
                    type="text"
                    value={`${totalOTHours} hrs`}
                    readOnly
                  />
                </div>

                <div className="ot-fg">
                  <label className="ot-label">
                    Start Time <span className="ot-req">*</span>
                  </label>
                  <div className="ot-time-wrap">
                    <Select
                      menuPlacement="bottom"
                      menuPosition="fixed"
                      value={{
                        value: formData.start_time_hour,
                        label: formData.start_time_hour,
                      }}
                      onChange={(opt) =>
                        setFormData((prev) => ({
                          ...prev,
                          start_time_hour: opt.value,
                        }))
                      }
                      options={hourOptions}
                      isSearchable={false}
                      styles={{
                        control: (b, s) => ({
                          ...b,
                          height: 40,
                          minHeight: 40,
                          width: 72,
                          borderRadius: 8,
                          borderColor: s.isFocused ? "#008b3e" : "#e2e8f0",
                          boxShadow: s.isFocused
                            ? "0 0 0 3px rgba(0,139,62,.1)"
                            : "none",
                          background: "#fafbfc",
                          fontSize: 14,
                          "&:hover": { borderColor: "#008b3e" },
                        }),
                        valueContainer: (b) => ({ ...b, padding: "0 6px" }),
                        indicatorSeparator: () => ({ display: "none" }),
                        dropdownIndicator: (b) => ({
                          ...b,
                          padding: "0 4px",
                          color: "#94a3b8",
                        }),
                        menu: (b) => ({
                          ...b,
                          width: 80,
                          borderRadius: 8,
                          border: "1.5px solid #e2e8f0",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          zIndex: 9999,
                        }),
                        menuList: (b) => ({
                          ...b,
                          maxHeight: 160,
                          overflowY: "auto",
                          padding: "2px 0",
                        }),
                        option: (b, s) => ({
                          ...b,
                          fontSize: 13,
                          padding: "5px 8px",
                          textAlign: "center",
                          background: s.isSelected
                            ? "#008b3e"
                            : s.isFocused
                              ? "#f0fdf4"
                              : "#fff",
                          color: s.isSelected ? "#fff" : "#1e293b",
                        }),
                      }}
                    />
                    <span className="ot-time-sep">:</span>
                    <input
                      className="ot-input ot-time-min"
                      type="number"
                      value={parseInt(formData.start_time_minute)}
                      onChange={(e) =>
                        handleMinuteChange("start_time_minute", e.target.value)
                      }
                      min="0"
                      max="59"
                    />
                    <div className="ot-ampm">
                      {["AM", "PM"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() =>
                            setFormData((f) => ({ ...f, start_time_ampm: p }))
                          }
                          style={{
                            background:
                              formData.start_time_ampm === p
                                ? p === "AM"
                                  ? "#dbeafe"
                                  : "#fef3c7"
                                : "#fff",
                            color:
                              formData.start_time_ampm === p
                                ? p === "AM"
                                  ? "#1d4ed8"
                                  : "#b45309"
                                : "#9ca3af",
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ot-fg">
                  <label className="ot-label">
                    End Time <span className="ot-req">*</span>
                  </label>
                  <div className="ot-time-wrap">
                    <Select
                      menuPlacement="bottom"
                      menuPosition="fixed"
                      value={{
                        value: formData.end_time_hour,
                        label: formData.end_time_hour,
                      }}
                      onChange={(opt) =>
                        setFormData((prev) => ({
                          ...prev,
                          end_time_hour: opt.value,
                        }))
                      }
                      options={hourOptions}
                      isSearchable={false}
                      styles={{
                        control: (b, s) => ({
                          ...b,
                          height: 40,
                          minHeight: 40,
                          width: 72,
                          borderRadius: 8,
                          borderColor: s.isFocused ? "#008b3e" : "#e2e8f0",
                          boxShadow: s.isFocused
                            ? "0 0 0 3px rgba(0,139,62,.1)"
                            : "none",
                          background: "#fafbfc",
                          fontSize: 14,
                          "&:hover": { borderColor: "#008b3e" },
                        }),
                        valueContainer: (b) => ({ ...b, padding: "0 6px" }),
                        indicatorSeparator: () => ({ display: "none" }),
                        dropdownIndicator: (b) => ({
                          ...b,
                          padding: "0 4px",
                          color: "#94a3b8",
                        }),
                        menu: (b) => ({
                          ...b,
                          width: 80,
                          borderRadius: 8,
                          border: "1.5px solid #e2e8f0",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                          zIndex: 9999,
                        }),
                        menuList: (b) => ({
                          ...b,
                          maxHeight: 160,
                          overflowY: "auto",
                          padding: "2px 0",
                        }),
                        option: (b, s) => ({
                          ...b,
                          fontSize: 13,
                          padding: "5px 8px",
                          textAlign: "center",
                          background: s.isSelected
                            ? "#008b3e"
                            : s.isFocused
                              ? "#f0fdf4"
                              : "#fff",
                          color: s.isSelected ? "#fff" : "#1e293b",
                        }),
                      }}
                    />
                    <span className="ot-time-sep">:</span>
                    <input
                      className="ot-input ot-time-min"
                      type="number"
                      value={parseInt(formData.end_time_minute)}
                      onChange={(e) =>
                        handleMinuteChange("end_time_minute", e.target.value)
                      }
                      min="0"
                      max="59"
                    />
                    <div className="ot-ampm">
                      {["AM", "PM"].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() =>
                            setFormData((f) => ({ ...f, end_time_ampm: p }))
                          }
                          style={{
                            background:
                              formData.end_time_ampm === p
                                ? p === "AM"
                                  ? "#dbeafe"
                                  : "#fef3c7"
                                : "#fff",
                            color:
                              formData.end_time_ampm === p
                                ? p === "AM"
                                  ? "#1d4ed8"
                                  : "#b45309"
                                : "#9ca3af",
                          }}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="ot-fg">
                  <label className="ot-label">
                    OT Salary <span className="ot-req">*</span>
                  </label>
                  <input
                    className="ot-input"
                    type="number"
                    name="ot_salary"
                    value={formData.ot_salary}
                    onChange={handleChange}
                    placeholder="Enter amount"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="ot-fg">
                  <label className="ot-label">
                    Date <span className="ot-req">*</span>
                  </label>
                  <input
                    className="ot-input"
                    type="date"
                    name="ot_date"
                    value={formData.ot_date}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="ot-form-actions">
                {editingId && (
                  <button
                    type="button"
                    className="ot-btn ot-btn--warn"
                    onClick={resetForm}
                  >
                    <i className="bi bi-x-circle"></i> Cancel Edit
                  </button>
                )}
                <button
                  type="button"
                  className="ot-btn ot-btn--ghost"
                  onClick={resetForm}
                >
                  <i className="bi bi-arrow-counterclockwise"></i> Reset
                </button>
                <button type="submit" className="ot-btn ot-btn--primary">
                  <i
                    className={`bi ${editingId ? "bi-check-circle" : "bi-check-lg"}`}
                  ></i>
                  {editingId ? "Update OT Details" : "Save OT Details"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {viewMode === "records" && (
        <div className="ot-card">
          <div className="ot-tabs-row">
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>
                OT Records
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                {totalFiltered} records
              </div>
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                alignItems: "center",
                width: "100%",
                maxWidth: 280,
              }}
            >
              <div style={{ position: "relative", flex: 1 }}>
                <i
                  className="bi bi-search"
                  style={{
                    position: "absolute",
                    left: 10,
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                ></i>
                <input
                  className="ot-finput"
                  style={{ paddingLeft: 30, width: "100%" }}
                  type="text"
                  placeholder="Search name / ID / date…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="ot-filters">
            <input
              className="ot-finput"
              type="text"
              name="emp_id"
              placeholder="Employee ID…"
              value={filters.emp_id}
              onChange={handleFilterChange}
            />
            <input
              className="ot-finput"
              type="number"
              name="salary_min"
              placeholder="Min salary…"
              value={filters.salary_min}
              onChange={handleFilterChange}
            />
            <input
              className="ot-finput"
              type="number"
              name="hours_min"
              placeholder="Min hours…"
              value={filters.hours_min}
              onChange={handleFilterChange}
            />
            <input
              className="ot-finput"
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              title="From date"
            />
            <input
              className="ot-finput"
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              title="To date"
            />
          </div>

          <div className="ot-table-wrap">
            <table className="ot-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>ID</th>
                  <th>Salary Type</th>
                  {isAllBranches && <th>Branch</th>}
                  <th>Start</th>
                  <th>End</th>
                  <th>Hours</th>
                  <th>OT Salary</th>
                  <th>Date</th>
                  <th>Time</th>
                  {isAdmin && <th style={{ textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paginatedRecords.length > 0 ? (
                  paginatedRecords.map((rec, idx) => (
                    <tr key={rec.id}>
                      <td style={{ color: "#94a3b8", fontSize: 12 }}>
                        {startIndex + idx + 1}
                      </td>
                      <td style={{ fontWeight: 700 }}>{rec.emp_name}</td>
                      <td>
                        <span className="ot-id-tag">{rec.emp_id}</span>
                      </td>
                      <td style={{ fontSize: 13, color: "#475569" }}>
                        {rec.salary_type}
                      </td>
                      {isAllBranches && (
                        <td style={{ fontSize: 12, color: "#475569" }}>
                          {branchesMap[rec.branch_id] ||
                            `Branch #${rec.branch_id}` ||
                            "—"}
                        </td>
                      )}
                      <td>
                        <span className="ot-time-cell">{rec.start_time}</span>
                      </td>
                      <td>
                        <span className="ot-time-cell">{rec.end_time}</span>
                      </td>
                      <td>
                        <span className="ot-hours">{rec.total_ot_hours}h</span>
                      </td>
                      <td>
                        <span className="ot-salary">
                          ₹{parseFloat(rec.ot_salary || 0).toFixed(2)}
                        </span>
                      </td>
                      <td
                        style={{
                          fontSize: 13,
                          color: "#374151",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {rec.ot_date}
                      </td>
                      <td>
                        <span className="ot-time-cell">
                          {formatTimeOnly(rec.created_at)}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div
                            className="ot-actions"
                            style={{ justifyContent: "flex-end" }}
                          >
                            <button
                              className="ot-act ot-act--edit"
                              onClick={() => handleEdit(rec)}
                              title="Edit"
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              className="ot-act ot-act--del"
                              onClick={() => setDeleteConfirm(rec)}
                              title="Delete"
                            >
                              <i className="bi bi-trash-fill"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={
                        isAllBranches ? (isAdmin ? 12 : 11) : isAdmin ? 11 : 10
                      }
                    >
                      <div className="ot-empty">
                        <i className="bi bi-inbox"></i>
                        <p>No OT records found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ot-pg">
            <div className="ot-pg-left">
              Show
              <select
                className="ot-pg-select"
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
              <div className="ot-pg-right">
                <span className="ot-pg-info">
                  Page {currentPage} of {totalPages || 1}
                </span>
                <button
                  className="ot-pg-btn"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                >
                  <i className="bi bi-chevron-left"></i> Previous
                </button>
                <button
                  className="ot-pg-btn"
                  disabled={currentPage === totalPages || totalPages === 0}
                  onClick={() => goToPage(currentPage + 1)}
                >
                  Next <i className="bi bi-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="ot-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="ot-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ot-modal__hd">
              <div className="ot-modal__title">
                <i className="bi bi-trash"></i> Confirm Delete
              </div>
              <button
                className="ot-modal__close"
                onClick={() => setDeleteConfirm(null)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <div className="ot-modal__body">
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
                Delete OT record for <strong>{deleteConfirm.emp_name}</strong>?
              </p>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                on {deleteConfirm.ot_date} — this cannot be undone.
              </p>
            </div>
            <div className="ot-modal__ft">
              <button
                className="ot-btn ot-btn--ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button className="ot-btn ot-btn--danger" onClick={handleDelete}>
                <i className="bi bi-trash"></i> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OT;
