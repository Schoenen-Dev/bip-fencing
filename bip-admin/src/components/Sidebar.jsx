import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function DropdownItem({ label, icon, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="nav-item-link" onClick={() => setOpen(!open)}>
        <i className={`bi ${icon}`}></i>
        <span>{label}</span>
        <i className={`bi bi-chevron-right chevron ${open ? 'open' : ''}`}></i>
      </div>
      <div className={`nav-dropdown-items ${open ? 'open' : ''}`}>
        <div className="nav-dropdown-inner">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #0969da, #58a6ff)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, color: 'white', fontWeight: 700, flexShrink: 0,
          }}>B</div>
          <div>
            <div className="brand-name">Bip Fencing</div>
            <div className="brand-sub">Admin Panel</div>
          </div>
        </div>

        <button
          className="sidebar-close-btn"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <i className="bi bi-x-lg"></i>
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-grid-1x2-fill"></i>
          <span>Dashboard</span>
        </NavLink>

        <div className="nav-section-label">Billing</div>

        <DropdownItem label="Billing" icon="bi-receipt">
          <NavLink to="/tax-invoice" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-file-earmark-text"></i><span>Tax Invoice</span>
          </NavLink>
          <NavLink to="/purchase-bill" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-bag-check"></i><span>Purchase Bill</span>
          </NavLink>
          <NavLink to="/quotation" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-file-earmark-spreadsheet"></i><span>Quotation</span>
          </NavLink>
        </DropdownItem>

        <div className="nav-section-label">Inventory</div>

        <DropdownItem label="Stock Management" icon="bi-boxes">
          <NavLink to="/purchase-inventory" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-cart-plus"></i><span>Purchase Inventory</span>
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-box-seam"></i><span>Products</span>
          </NavLink>
        </DropdownItem>

        <div className="nav-section-label">HR</div>

        <DropdownItem label="Staff Management" icon="bi-people">
           <NavLink to="/employee-details" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-person-vcard"></i><span>Employee Details</span>
          </NavLink>
          <NavLink to="/salary" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-cash-stack"></i><span>Salary</span>
          </NavLink>
          <NavLink to="/attendance" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-calendar-check"></i><span>Attendance</span>
          </NavLink>
          <NavLink to="/ot" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
            <i className="bi bi-clock-history"></i><span>OT</span>
          </NavLink>
        </DropdownItem>

        <div className="nav-section-label">CRM</div>

        <NavLink to="/clients" className={({ isActive }) => `nav-item-link ${isActive ? 'active' : ''}`}>
          <i className="bi bi-person-lines-fill"></i>
          <span>Clients</span>
        </NavLink>

        <div style={{ padding: '12px 0 8px' }}>
          <div style={{ height: 1, background: '#1c2333', margin: '0 16px 12px' }}></div>
          <button className="nav-item-link sidebar-logout-btn" onClick={logout} style={{ color: '#f85149' }}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Logout</span>
          </button>
        </div>
      </nav>
    </>
  );

  return (
    <>
      <style>{`
        .sidebar {
          width: 260px;
          height: 100vh;
          background: #0d1117;
          display: flex;
          flex-direction: column;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1000;
          overflow-y: auto;
          overflow-x: hidden;
          scrollbar-width: thin;
          scrollbar-color: #30363d #0d1117;
        }
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: #0d1117; }
        .sidebar::-webkit-scrollbar-thumb { background: #30363d; border-radius: 4px; }
        .sidebar::-webkit-scrollbar-thumb:hover { background: #484f58; }

        .sidebar-brand {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid #1c2333;
          position: sticky;
          top: 0;
          background: #0d1117;
          z-index: 10;
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 14px;
          font-weight: 600;
          color: #e6edf3;
          line-height: 1.2;
        }
        .brand-sub {
          font-size: 11px;
          color: #58a6ff;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .sidebar-nav {
          padding: 8px 0 16px;
          flex: 1;
        }

        .nav-section-label {
          font-size: 10px;
          font-weight: 600;
          color: #484f58;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          padding: 12px 16px 4px;
        }

        .nav-item-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          color: #8b949e;
          text-decoration: none;
          font-size: 13.5px;
          cursor: pointer;
          border: none;
          background: none;
          width: 100%;
          text-align: left;
          transition: color 0.15s, background 0.15s;
          position: relative;
          box-sizing: border-box;
        }
        .nav-item-link:hover {
          color: #e6edf3;
          background: rgba(255,255,255,0.05);
        }
        .nav-item-link.active {
          color: #58a6ff;
          background: rgba(88,166,255,0.1);
        }
        .nav-item-link.active::before {
          content: '';
          position: absolute;
          left: 0; top: 0; bottom: 0;
          width: 3px;
          background: #58a6ff;
          border-radius: 0 2px 2px 0;
        }
        .nav-item-link i { font-size: 15px; flex-shrink: 0; }
        .nav-item-link span { flex: 1; }

        .chevron {
          font-size: 11px !important;
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }
        .chevron.open { transform: rotate(90deg); }

        /* KEY FIX: grid-template-rows animation — no auto-open, controlled by click only */
        .nav-dropdown-items {
          display: grid;
          grid-template-rows: 0fr;
          transition: grid-template-rows 0.25s ease;
        }
        .nav-dropdown-items.open {
          grid-template-rows: 1fr;
        }
        .nav-dropdown-inner {
          min-height: 0;
          overflow: hidden;
        }
        .nav-dropdown-items .nav-item-link {
          padding-left: 42px;
          font-size: 13px;
        }

        .hamburger-btn {
          display: none;
          position: fixed;
          top: 14px;
          left: 14px;
          z-index: 1100;
          width: 40px;
          height: 40px;
          border: none;
          border-radius: 10px;
          background: linear-gradient(135deg, #0969da, #58a6ff);
          color: #fff;
          font-size: 18px;
          cursor: pointer;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(9,105,218,.35);
          transition: transform .15s;
        }
        .hamburger-btn:active { transform: scale(.93); }

        .sidebar-close-btn {
          display: none;
          background: none;
          border: none;
          color: #8b949e;
          font-size: 18px;
          cursor: pointer;
          padding: 4px 6px;
          border-radius: 6px;
          transition: color .15s, background .15s;
        }
        .sidebar-close-btn:hover { color: #fff; background: rgba(255,255,255,.08); }

        .sidebar-overlay {
          display: none;
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          z-index: 1050;
          animation: fadeIn .2s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        @media (max-width: 768px) {
          .hamburger-btn { display: flex; }
          .sidebar-close-btn { display: flex; align-items: center; }

          .sidebar {
            position: fixed !important;
            top: 0; left: 0;
            height: 100dvh;
            z-index: 1100;
            transform: translateX(-110%);
            transition: transform .25s cubic-bezier(.4,0,.2,1);
            box-shadow: none;
          }
          .sidebar.mobile-open {
            transform: translateX(0);
            box-shadow: 4px 0 32px rgba(0,0,0,.45);
          }
          .sidebar-overlay { display: block; }
          .main-content, .page-wrapper, main { padding-top: 64px !important; }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .sidebar { width: 200px; }
          .brand-name { font-size: 13px; }
          .brand-sub { font-size: 10px; }
          .nav-item-link span { font-size: 12.5px; }
        }
      `}</style>

      <button className="hamburger-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
        <i className="bi bi-list"></i>
      </button>

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
        {sidebarContent}
      </aside>
    </>
  );
}