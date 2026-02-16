import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./modules/context/AuthContext";
import { NotificationProvider } from "./modules/context/NotificationContext";
import LayoutComponent from "./modules/Layout";
import Landing from "./pages/Landing"; // New Landing Page
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Workspaces from "./pages/Workspaces";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import "./App.css";

// ProtectedRoute: Ensures only logged-in users can access the dashboard
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login if user tries to hit /dashboard without being authed
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* --- Public Routes --- */}
            {/* Landing page is now the entry point */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* --- Protected App Routes --- */}
            {/* All protected logic now lives under /dashboard */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <LayoutComponent />
                </ProtectedRoute>
              }
            >
              {/* This renders at /dashboard */}
              <Route index element={<Dashboard />} />
              
              {/* These render at /dashboard/workspaces, etc. */}
              <Route path="workspaces" element={<Workspaces />} />
              <Route path="workspaces/:workspaceId" element={<Projects />} />
              <Route path="projects/:projectId" element={<Tasks />} />
            </Route>

            {/* --- Catch-all --- */}
            {/* Redirect unknown URLs back to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;