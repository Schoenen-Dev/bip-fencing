import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

export default function Topbar() {
  const { logout } = useAuth();
  const [userName, setUserName] = useState("User");
  const [userRole, setUserRole] = useState("");
  const [branchName, setBranchName] = useState("");
  const [viewBranch, setViewBranch] = useState("");

  // Load user data from localStorage
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserName(user.full_name || user.username || "User");
        setUserRole(
          user.role === "admin"
            ? "Administrator"
            : user.branch_name || "Branch User",
        );
        setBranchName(user.branch_name || "");
      } catch (e) {}
    }
    const role = localStorage.getItem("role");
    if (role === "admin") {
      const savedViewBranch = localStorage.getItem("admin_view_branch");
      setViewBranch(savedViewBranch || "");
    }
  }, []);

  // Handle branch switch for admin
  const handleBranchSwitch = (branchId) => {
    const branchNames = { 1: "Branch A", 2: "Branch B", 3: "Branch C" };
    if (branchId === "") {
      localStorage.removeItem("admin_view_branch");
      localStorage.removeItem("admin_view_branch_name");
    } else {
      localStorage.setItem("admin_view_branch", branchId);
      localStorage.setItem("admin_view_branch_name", branchNames[branchId]);
    }
    window.location.reload();
  };

  // Get branch display text for admin
  const getAdminBranchDisplay = () => {
    if (!viewBranch) return "All Branches";
    const branches = { 1: "Branch A", 2: "Branch B", 3: "Branch C" };
    return branches[viewBranch] || `Branch ${viewBranch}`;
  };

  const role = localStorage.getItem("role");

  return (
    <header className="topbar">
      <div className="topbar-title">
        Bip Fencing <span>Admin</span>
      </div>
      <div className="topbar-right">
        {/* Branch Indicator */}
        {role === "admin" ? (
          <div className="branch-indicator admin-branch">
            <i className="bi bi-building"></i>
            <span>{getAdminBranchDisplay()}</span>
          </div>
        ) : (
          branchName && (
            <div className="branch-indicator">
              <i className="bi bi-shop"></i>
              <span>{branchName}</span>
            </div>
          )
        )}

        {/* Admin Branch Switcher */}
        {role === "admin" && (
          <select
            className="branch-switcher"
            value={viewBranch}
            onChange={(e) => handleBranchSwitch(e.target.value)}
          >
            <option value="">All Branches</option>
            <option value="1">Branch A</option>
            <option value="2">Branch B</option>
            <option value="3">Branch C</option>
          </select>
        )}

        <div style={{ textAlign: "right", marginRight: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#24292f" }}>
            {userName}
          </div>
          <div style={{ fontSize: 11, color: "#57606a" }}>{userRole}</div>
        </div>
        <div className="topbar-avatar">{userName.charAt(0)}</div>
        <button className="btn-logout-top" onClick={logout}>
          <i className="bi bi-box-arrow-right"></i> Logout
        </button>
      </div>

      <style>{`
        .branch-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f0f2f4;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: #1f2937;
          margin-right: 12px;
        }
        .branch-indicator i {
          font-size: 13px;
          color: #008b3e;
        }
        .branch-indicator.admin-branch i {
          color: #6366f1;
        }
        .branch-switcher {
          background: #f6f8fa;
          border: 1px solid #d0d7de;
          border-radius: 20px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 500;
          color: #24292f;
          margin-right: 12px;
          cursor: pointer;
        }
        .branch-switcher:focus {
          outline: none;
          border-color: #008b3e;
        }
        @media (max-width: 700px) {
          .branch-indicator span, .branch-switcher {
            display: none;
          }
          .branch-indicator {
            padding: 4px 8px;
          }
        }
      `}</style>
    </header>
  );
}
