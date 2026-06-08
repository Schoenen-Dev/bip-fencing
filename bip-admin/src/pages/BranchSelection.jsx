import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BranchSelection() {
const [selectedBranch, setSelectedBranch] = useState(null);
const navigate = useNavigate();

const branches = [
  {
    id: 1,
    name: "Branch A",
    code: "BRA",
    location: "Main Street, Downtown",
    color: "#10b981",
    bg: "#d1fae5",
  },
  {
    id: 2,
    name: "Branch B",
    code: "BRB",
    location: "Industrial Area, Sector 5",
    color: "#3b82f6",
    bg: "#dbeafe",
  },
  {
    id: 3,
    name: "Branch C",
    code: "BRC",
    location: "Westside Commercial Hub",
    color: "#f59e0b",
    bg: "#fed7aa",
  },
];

const handleSubmit = () => {
  if (!selectedBranch) return;
  const branch = branches.find((b) => b.id === selectedBranch);
  localStorage.setItem("admin_view_branch", selectedBranch);
  localStorage.setItem("admin_view_branch_name", branch.name); // ✅ store branch name
  navigate("/dashboard");
};


  return (
    <div className="branch-selection-page">
      <div className="selection-container">
        <div className="selection-header">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <i className="bi bi-shield-lock-fill"></i>
            </div>
            <h1>Bip Fencing Admin</h1>
            <p>SECURE ACCESS PORTAL</p>
          </div>
          <h2>Select Branch to Manage</h2>
          <p className="subtext">
            You are logged in as Administrator. Choose which branch you want to
            monitor.
          </p>
        </div>

        <div className="branch-cards">
          {branches.map((branch) => (
            <div
              key={branch.id}
              className={`branch-card ${selectedBranch === branch.id ? "selected" : ""}`}
              onClick={() => setSelectedBranch(branch.id)}
            >
              <div
                className="branch-icon"
                style={{ backgroundColor: branch.bg, color: branch.color }}
              >
                <i className="bi bi-shop"></i>
              </div>
              <div className="branch-info">
                <h3>{branch.name}</h3>
                <span className="branch-code">{branch.code}</span>
                <p className="branch-location">
                  <i className="bi bi-geo-alt-fill"></i> {branch.location}
                </p>
              </div>
              <div className="selection-indicator">
                {selectedBranch === branch.id && (
                  <i
                    className="bi bi-check-circle-fill"
                    style={{ color: branch.color }}
                  ></i>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="selection-actions">
          <button
            className="btn-continue"
            onClick={handleSubmit}
            disabled={!selectedBranch}
          >
            Continue to Dashboard <i className="bi bi-arrow-right-short"></i>
          </button>
          <button
            className="btn-skip"
            onClick={() => {
              localStorage.removeItem("admin_view_branch");
              navigate("/dashboard");
            }}
          >
            View All Branches
          </button>
        </div>
      </div>

      <style>{`
        .branch-selection-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
        }

        .selection-container {
          max-width: 1200px;
          width: 100%;
          background: white;
          border-radius: 32px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          padding: 2.5rem;
        }

        .selection-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-wrapper {
          margin-bottom: 2rem;
        }

        .logo-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #008b3e, #00b4a0);
          border-radius: 18px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1rem;
          box-shadow: 0 8px 16px rgba(0, 139, 62, 0.2);
        }

        .logo-icon i {
          font-size: 28px;
          color: white;
        }

        .selection-header h1 {
          font-size: 24px;
          font-weight: 800;
          color: #0f172a;
          margin: 0 0 0.25rem;
        }

        .selection-header p {
          font-size: 11px;
          letter-spacing: 1.5px;
          color: #64748b;
          font-weight: 600;
          margin: 0;
        }

        .selection-header h2 {
          font-size: 28px;
          font-weight: 700;
          color: #0f172a;
          margin: 1.5rem 0 0.5rem;
        }

        .subtext {
          font-size: 15px;
          color: #475569;
          max-width: 500px;
          margin: 0 auto;
        }

        .branch-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2.5rem;
        }

        .branch-card {
          border: 2px solid #e2e8f0;
          border-radius: 20px;
          padding: 1.5rem;
          cursor: pointer;
          transition: all 0.25s ease;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          position: relative;
          background: white;
        }

        .branch-card:hover {
          transform: translateY(-4px);
          border-color: #008b3e;
          box-shadow: 0 12px 24px -12px rgba(0, 0, 0, 0.15);
        }

        .branch-card.selected {
          border-color: #008b3e;
          background: #f0fdf4;
        }

        .branch-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .branch-icon i {
          font-size: 24px;
        }

        .branch-info {
          flex: 1;
        }

        .branch-info h3 {
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 4px;
          color: #0f172a;
        }

        .branch-code {
          font-size: 11px;
          font-weight: 600;
          color: #475569;
          background: #f1f5f9;
          padding: 2px 8px;
          border-radius: 20px;
          display: inline-block;
          margin-bottom: 8px;
        }

        .branch-location {
          font-size: 13px;
          color: #475569;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .branch-location i {
          font-size: 11px;
          color: #94a3b8;
        }

        .selection-indicator {
          margin-left: auto;
        }

        .selection-indicator i {
          font-size: 22px;
        }

        .selection-actions {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-continue {
          background: #008b3e;
          color: white;
          border: none;
          padding: 12px 28px;
          border-radius: 40px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.2s, transform 0.1s;
        }

        .btn-continue:hover:not(:disabled) {
          background: #006b2f;
          transform: scale(1.02);
        }

        .btn-continue:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-skip {
          background: transparent;
          color: #1e293b;
          border: 1px solid #cbd5e1;
          padding: 12px 28px;
          border-radius: 40px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-skip:hover {
          background: #f8fafc;
          border-color: #94a3b8;
        }

        @media (max-width: 700px) {
          .selection-container {
            padding: 1.5rem;
          }
          .branch-cards {
            grid-template-columns: 1fr;
          }
          .selection-header h2 {
            font-size: 24px;
          }
        }
      `}</style>
    </div>
  );
}
