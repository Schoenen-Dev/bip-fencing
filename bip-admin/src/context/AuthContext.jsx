import { createContext, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem("token"), // ← check token not isAuthenticated
  );

  const navigate = useNavigate();

  const logout = () => {
    // call logout.php to destroy session
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:8000/logout.php", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear(); // wipe any unsaved drafts (e.g. Tax Invoice form) so the next branch login starts clean
    setIsAuthenticated(false);
    navigate("/login");
  };

  // called by Login.jsx after successful PHP login
  const setAuth = () => {
    sessionStorage.clear(); // belt-and-suspenders: also clear on the way in, in case logout was skipped
    setIsAuthenticated(true);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
