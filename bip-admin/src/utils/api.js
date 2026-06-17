const API_BASE = "https://backend.bipfencing.in/backend";

export const apiFetch = (path, options = {}) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  // If admin and has selected a view branch, add custom header
  if (role === "admin") {
    const viewBranch = localStorage.getItem("admin_view_branch");
    if (viewBranch) {
      headers["X-Branch-ID"] = viewBranch;
    }
  }

  return fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });
};
