import { useEffect, useState } from "react";

const inr = (v) => `₹${Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

export default function Dashboard() {
  const [data, setData] = useState({
    invoices: [],
    purchases: [],
    quotations: [],
    employees: [],
    attendance: [],
    clients: [],
    products: [],
  });

  // Quote summary stats saved by Quotation.jsx
  const [quoteSummary, setQuoteSummary] = useState({
    totalQuotes: 0,
    totalSubtotal: 0,
    totalDiscount: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    setData({
      invoices:   JSON.parse(localStorage.getItem("invoices"))      || [],
      purchases:  JSON.parse(localStorage.getItem("purchaseBills")) || [],
      quotations: JSON.parse(localStorage.getItem("quotes"))        || [],
      employees:  JSON.parse(localStorage.getItem("employees"))     || [],
      attendance: JSON.parse(localStorage.getItem("bip_attendance_records")) || [],
      clients: JSON.parse(localStorage.getItem("bip_clients")) || [],      
      products:   JSON.parse(localStorage.getItem("products"))      || [],
    });

    // Read the summary that Quotation.jsx writes
    const saved = localStorage.getItem("quotes_summary");
    if (saved) {
      try { setQuoteSummary(JSON.parse(saved)); } catch (_) {}
    }
  }, []);

  // 🔢 CALCULATIONS
  const totalRevenue = data.invoices.reduce((s, i) => s + (i.total || 0), 0);
  const totalExpense = data.purchases.reduce((s, p) => s + (p.grandTotal || 0), 0);
  const profit = totalRevenue - totalExpense;

// 📅 Today's date
const today = new Date().toISOString().split("T")[0];

// 👨‍💼 Today's attendance only
const todayAttendance = data.attendance.filter(
  a => a.date === today
);

// 👥 Unique employees
const uniqueEmployees = [
  ...new Set(data.attendance.map(a => a.employeeId || a.employeeName))
];

// ✅ Employee counts
const totalEmployees = uniqueEmployees.length;

const present = todayAttendance.filter(
  a => a.status === "Present"
).length;

const absent = todayAttendance.filter(
  a => a.status === "Absent"
).length;
  const lowStock = data.products.filter(p => (p.stock || 0) < 10);

  // 🔷 STAT CARDS
  const statCards = [
    { label: 'Total Revenue',    value: totalRevenue.toFixed(2), icon: 'bi-currency-rupee',   color: 'card-green',  unit: '₹ ' },
    { label: 'Purchase Expense', value: totalExpense.toFixed(2), icon: 'bi-credit-card',       color: 'card-red',    unit: '₹ ' },
    { label: 'Profit',           value: profit.toFixed(2),       icon: 'bi-graph-up',          color: 'card-blue',   unit: '₹ ' },
    { label: 'Employees',        value: totalEmployees,   icon: 'bi-people',            color: 'card-orange'             },
    { label: 'Present Today',    value: present,                 icon: 'bi-check-circle',      color: 'card-green'              },
    { label: 'Clients',          value: data.clients.length,     icon: 'bi-person-lines-fill', color: 'card-blue'               },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's your business overview.</p>
      </div>

      {/* 🔥 SUMMARY CARDS */}
      {/* 🔥 SUMMARY CARDS */}
<div className="row g-4 mb-4">

  {statCards.map((card, i) => {

    const gradients = {
      "card-green": "linear-gradient(135deg, #1f9d45, #24923f)",
      "card-red": "linear-gradient(135deg, #d91f26, #ef2d2d)",
      "card-blue": "linear-gradient(135deg, #2f7de1, #4a9df8)",
      "card-orange": "linear-gradient(135deg, #e45b05, #ff6a00)",
    };

    return (
      <div className="col-xl-2 col-lg-4 col-md-4 col-6" key={i}>

        <div
          style={{
            background: gradients[card.color],
            borderRadius: 16,
            padding: "22px",
            height: 210,
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >

          {/* ICON */}
          <div>
            <i
              className={`bi ${card.icon}`}
              style={{
                fontSize: 26,
                color: "#fff",
              }}
            ></i>
          </div>

          {/* TEXT CONTENT */}
          <div>

            {/* LABEL */}
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                textTransform: "uppercase",
                opacity: 0.92,
                marginBottom: 12,
                lineHeight: 1.5,
              }}
            >
              {card.label}
            </div>

            {/* VALUE */}
            {/* VALUE */}
<div
  style={{
    fontSize: 26,
    fontWeight: 800,
    lineHeight: 1.25,
    color: "#fff",
    wordBreak: "break-word",
    overflowWrap: "break-word",
    whiteSpace: "normal",
    maxWidth: "100%",
    fontFamily: "'JetBrains Mono', monospace",
  }}
>
              {card.unit || ""}
              {card.value}
            </div>

          </div>

        </div>

      </div>
    );
  })}

</div>

      {/* 📊 SIMPLE GRAPH */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="chart-placeholder shadow-sm">
            <h6 style={{ fontWeight: 700 }}>
              <i className="bi bi-bar-chart-fill me-2"></i>Revenue vs Expense
            </h6>
            <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
              <div>
                <p style={{ fontSize: 12 }}>Revenue</p>
                <div style={{ height: totalRevenue / 50, width: 40, background: "#1a7f37" }}></div>
              </div>
              <div>
                <p style={{ fontSize: 12 }}>Expense</p>
                <div style={{ height: totalExpense / 50, width: 40, background: "#cf222e" }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 RECENT ACTIVITY */}
      <div className="row g-3">

        <div className="col-md-4">
          <div className="target-card shadow-sm p-3">
            <h6>Recent Invoices</h6>
            {data.invoices.length === 0 && <p style={{ color:"#aaa", fontSize:13 }}>No invoices yet</p>}
            {data.invoices.slice(-3).map((i, idx) => (
              <p key={idx}>{i.invoiceNo} - ₹ {i.total}</p>
            ))}
          </div>
        </div>

        <div className="col-md-4">
          <div className="target-card shadow-sm p-3">
            <h6>Recent Purchase Bills</h6>
            {data.purchases.length === 0 && <p style={{ color:"#aaa", fontSize:13 }}>No bills yet</p>}
            {data.purchases.slice(-3).map((p, idx) => (
              <p key={idx}>{p.billNo} - ₹ {p.grandTotal}</p>
            ))}
          </div>
        </div>

        {/* ── RECENT QUOTATIONS — structure unchanged, content enhanced ── */}
        <div className="col-md-4">
          <div className="target-card shadow-sm p-3">
            <h6>Recent Quotations</h6>

            {/* 4-stat summary strip (mirrors Quotation page) */}
            {quoteSummary.totalQuotes > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px 10px',
                marginBottom: 10,
                padding: '8px 10px',
                background: '#f6f8fa',
                borderRadius: 8,
                border: '1px solid #e1e8ed',
              }}>
                {[
                  { lbl: 'Total Quotes',    val: quoteSummary.totalQuotes,    mono: false, color: '#24292f' },
                  { lbl: 'Total Subtotal',  val: inr(quoteSummary.totalSubtotal),  mono: true,  color: '#24292f' },
                  { lbl: 'Total Discount',  val: inr(quoteSummary.totalDiscount),  mono: true,  color: '#cf222e' },
                  { lbl: 'Total Revenue',   val: inr(quoteSummary.totalRevenue),   mono: true,  color: '#bc4c00' },
                ].map(s => (
                  <div key={s.lbl}>
                    <div style={{ fontSize: 9.5, color: '#8c959f', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      {s.lbl}
                    </div>
                    <div style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: s.color,
                      fontFamily: s.mono ? "'JetBrains Mono',monospace" : 'inherit',
                    }}>
                      {s.val}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Recent quote rows */}
            {data.quotations.length === 0 && <p style={{ color:"#aaa", fontSize:13 }}>No quotations yet</p>}
            {data.quotations.slice(-3).map((q, idx) => (
              <p key={idx} style={{ marginBottom: 4, fontSize: 13 }}>
                <span style={{ fontWeight: 600, color: '#bc4c00' }}>{q.quoteNo}</span>
                {' - '}
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 600 }}>
                  {inr(q.total)}
                </span>
                {q.clientName && (
                  <span style={{ color: '#8c959f', fontSize: 11.5 }}> · {q.clientName}</span>
                )}
              </p>
            ))}
          </div>
        </div>

      </div>

      {/* 🧑‍💼 EMPLOYEE + STOCK */}
      <div className="row g-3 mt-2">

        <div className="col-md-6">
          <div className="target-card shadow-sm p-3">
            <h6>Employee Status</h6>
            <p>Present: {present}</p>
            <p>Absent: {absent}</p>
          </div>
        </div>

        <div className="col-md-6">
          <div className="target-card shadow-sm p-3">
            <h6>Low Stock Alert</h6>
            {lowStock.length === 0 && <p>No low stock</p>}
            {lowStock.map((p, i) => (
              <p key={i}>{p.name} - {p.stock}</p>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}