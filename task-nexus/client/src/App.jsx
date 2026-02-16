import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./modules/context/AuthContext";
import { NotificationProvider } from "./modules/context/NotificationContext";
import LayoutComponent from "./modules/Layout";
import Landing from "./pages/Landing"; // New Import
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Workspaces from "./pages/Workspaces";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";
import "./App.css";

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
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes (Wrapped in Layout) */}
            <Route
              element={
                <ProtectedRoute>
                  <LayoutComponent />
                </ProtectedRoute>
              }
            >
              {/* Note: Dashboard is now at /dashboard to match 
                  the redirect logic in your Landing.jsx 
              */}
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/workspaces" element={<Workspaces />} />
              <Route path="/workspaces/:workspaceId" element={<Projects />} />
              <Route path="/projects/:projectId" element={<Tasks />} />

              {/* Optional: Redirect root-level protected access to dashboard */}
              <Route
                path="/app"
                element={<Navigate to="/dashboard" replace />}
              />
            </Route>

            {/* Catch-all: Redirect unknown URLs to Landing or Dashboard based on Auth */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
