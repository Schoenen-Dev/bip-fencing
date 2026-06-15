import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:8000";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/login.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      console.log("Login response:", data); // 🔍 DEBUG

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("branch_code", data.user.branch_code || "");

        // Clear any previous branch selection for admin
        if (data.user.role === "admin") {
          localStorage.removeItem("admin_view_branch");
        }

        setAuth(); // tell context we're logged in

        // 🔍 DEBUG: check role value
        console.log("User role:", data.user.role);
        console.log("Is admin?", data.user.role === "admin");

        // Redirect based on role
        if (data.user.role === "admin") {
          console.log("Redirecting to /branch-selection");
          // Try React Router navigate first
          navigate("/branch-selection");
          // Fallback in case route doesn't exist (after 1 second)
          setTimeout(() => {
            if (window.location.pathname !== "/branch-selection") {
              alert("Branch selection page not found. Did you add the route?");
            }
          }, 500);
        } else {
          console.log("Redirecting to /dashboard");
          navigate("/dashboard");
        }
      } else {
        setError(data.error || "Invalid username or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Cannot connect to server. Make sure PHP is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-bg-grid"></div>
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-icon">
            <i className="bi bi-shield-lock-fill"></i>
          </div>
          <h1>Bip Fencing Admin</h1>
          <p>Secure Access Portal</p>
        </div>

        {error && (
          <div className="alert-error mb-3">
            <i className="bi bi-exclamation-triangle-fill"></i> {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label>Username</label>
            <input
              type="text"
              className="form-control"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Authenticating...
              </>
            ) : (
              <>
                <i className="bi bi-unlock-fill me-2"></i>Sign In
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span
            style={{
              fontSize: 11,
              color: "#484f58",
              fontFamily: "JetBrains Mono, monospace",
            }}
          >
            admin / Admin@123 &nbsp;|&nbsp; branch_a / BranchA@123
          </span>
        </div>
      </div>
    </div>
  );
}
