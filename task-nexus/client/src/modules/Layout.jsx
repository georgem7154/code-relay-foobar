import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../modules/context/AuthContext";
import { useNotification } from "./context/NotificationContext"; // Import
import NotificationPanel from "./UI/NotificationPanel"; // Import
import Toast from "./UI/Toast"; // Import
import {
  LayoutDashboard,
  Building2,
  LogOut,
  User,
  Moon,
  Sun,
  Bell, // Import Bell
} from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Notification State
  const { unreadCount } = useNotification();
  const [showNotif, setShowNotif] = useState(false);

  // Theme State
  const [theme, setTheme] = useState(
    localStorage.getItem("nexus_theme") || "light",
  );

  // Effect to apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("nexus_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="app-layout">
      <aside className="sidebar glass">
        <div className="sidebar-header">
          <h1 className="sidebar-logo">
            Task<span className="text-primary">Nexus</span>
          </h1>
        </div>

        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink
            to="/workspaces"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
          >
            <Building2 size={20} />
            <span>Workspaces</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          {/* Notification Bell */}
          <button
            className="theme-toggle-btn"
            onClick={() => setShowNotif(!showNotif)}
            title="Notifications"
          >
            <div style={{ position: "relative", display: "flex" }}>
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="notif-badge">{unreadCount}</span>
              )}
            </div>
            <span>Notifications</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title="Toggle Dark Mode"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
          </button>

          <div className="user-info">
            <div className="user-avatar">
              <User size={18} />
            </div>
            <div className="user-details">
              <span className="user-name">
                {user?.username || user?.data?.username || "User"}
              </span>
              <span className="user-email">
                {user?.email || user?.data?.email || ""}
              </span>
            </div>
          </div>
          <button className="btn-ghost logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>

      {/* Render Global Notification Components */}
      <NotificationPanel
        isOpen={showNotif}
        onClose={() => setShowNotif(false)}
      />
      <Toast />
    </div>
  );
}
