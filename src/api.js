const API = "/api";

// Wraps fetch(): attaches the JWT from localStorage automatically and
// forces a re-login if the backend says the session is no longer valid.
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("nw_token");
  const headers = { ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (options.body && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem("nw_token");
    if (window.location.pathname !== "/login") window.location.href = "/login";
  }

  return res;
}

export default apiFetch;
