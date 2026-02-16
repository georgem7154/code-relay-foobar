import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './modules/context/AuthContext';
import LayoutComponent from './modules/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Workspaces from './pages/Workspaces';
import Projects from './pages/Projects';
import Tasks from './pages/Tasks';
import './App.css';

// Fix: Redirect unauthenticated users to Login instead of returning null
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth();

    // Show spinner while checking auth status
    if (loading) {
        return (
            <div className="page-loading">
                <div className="spinner"></div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Render the protected page if authenticated
    return children;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Protected Routes (Wrapped in Layout) */}
                    <Route path="/" element={<ProtectedRoute><LayoutComponent /></ProtectedRoute>}>
                        <Route index element={<Dashboard />} />
                        <Route path="workspaces" element={<Workspaces />} />
                        <Route path="workspaces/:workspaceId" element={<Projects />} />
                        <Route path="projects/:projectId" element={<Tasks />} />
                    </Route>

                    {/* Catch-all: Redirect unknown URLs to home */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;