// Auto-detect the backend: same host as the page, port 8000 (dev) or
// a sibling path/subdomain (production).  Works on localhost, on the
// live server from a desktop browser and on a mobile browser, because
// the mobile phone cannot reach "localhost:8000" on the developer's PC.
function getApiBase() {
  const h = window.location.hostname;
  // Local development: Vite runs on 5173 / 4173, backend on 8000
  if (h === "localhost" || h === "127.0.0.1") return "http://localhost:8000";
  // Production: backend lives at backend.bipbilling.co.in
  // Adjust this URL to match wherever your PHP files are deployed.
  const proto = window.location.protocol;
  // Allow an override via localStorage (useful during setup/testing)
  const override = localStorage.getItem("api_base");
  if (override) return override;
  // ── PRODUCTION URL ─────────────────────────────────────────────────────
  //  Change the line below to wherever your PHP backend is hosted.
  //  Examples:
  //    Same domain in a /backend/ subfolder: `${proto}//${h}/backend`
  //    A subdomain: `${proto}//backend.${h}`
  //
  //  For bipbilling.co.in the PHP files are at backend.bipbilling.co.in
  // Production backend
  return "https://backend.bipfencing.in/backend";
}

const API_BASE = getApiBase();

export const apiFetch = (path, options = {}) => {
  const { branchId, ...restOptions } = options;
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    // Same token in a header hosts don't strip (fixes mobile "invalid session")
    "X-Auth-Token": token || "",
    ...(restOptions.headers || {}),
  };

  // If admin, add the branch header — an explicit branchId override wins,
  // otherwise fall back to whichever branch is globally selected.
  if (role === "admin") {
    const effectiveBranch =
      branchId ?? localStorage.getItem("admin_view_branch");
    if (effectiveBranch) {
      headers["X-Branch-ID"] = effectiveBranch;
    }
  }

  return fetch(`${API_BASE}${path}`, {
    ...restOptions,
    headers,
  });
};
