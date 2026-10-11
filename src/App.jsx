import { Routes, Route, Navigate } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { createContext, useContext, useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import Notes from "./pages/Notes";
import WebFetch from "./pages/WebFetch";
import AIAdvisor from "./pages/AIAdvisor";
import News from "./pages/News";
import Game from "./pages/Game";
import Daily from "./pages/Daily";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import Layout from "./components/Layout";

const API = "/api";

// Real auth context — persists the JWT + user in localStorage and
// re-validates the session against the backend on load.
export const AuthContext = createContext(null);
export function useAuth() { return useContext(AuthContext); }

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("nw_token"));
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("nw_token");
    if (!storedToken) { setCheckingSession(false); return; }

    fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${storedToken}` } })
      .then(res => {
        if (!res.ok) throw new Error("Session expired");
        return res.json();
      })
      .then(data => { setUser(data.user); setToken(storedToken); })
      .catch(() => { localStorage.removeItem("nw_token"); setUser(null); setToken(null); })
      .finally(() => setCheckingSession(false));
  }, []);

  const login = (userData, authToken) => {
    localStorage.setItem("nw_token", authToken);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("nw_token");
    setToken(null);
    setUser(null);
  };

  if (checkingSession) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#f5ecdd", color: "var(--text-secondary, #6f5a4b)", fontFamily: "Outfit" }}>
        Loading NeuraWealth…
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
          <Route path="/" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
          <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/assets" element={<ProtectedRoute><Layout><Assets /></Layout></ProtectedRoute>} />
          <Route path="/notes" element={<ProtectedRoute><Layout><Notes /></Layout></ProtectedRoute>} />
          <Route path="/advisor" element={<ProtectedRoute><Layout><WebFetch /></Layout></ProtectedRoute>} />
          <Route path="/ai-advisor" element={<ProtectedRoute><Layout><AIAdvisor /></Layout></ProtectedRoute>} />
          <Route path="/daily" element={<ProtectedRoute><Layout><Daily /></Layout></ProtectedRoute>} />
          <Route path="/news" element={<ProtectedRoute><Layout><News /></Layout></ProtectedRoute>} />
          <Route path="/game" element={<ProtectedRoute><Layout><Game /></Layout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
          <Route path="*" element={<Navigate to={token ? "/dashboard" : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

export default App;
