import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const API_BASE = 'https://code-relay-foobar.onrender.com/api';

export function NotificationProvider({ children }) {
    const { user, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [toast, setToast] = useState({ show: false, message: '', type: 'info' });

    // Toast Logic
    const showToast = useCallback((message, type = 'info') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
    }, []);

    // Fetch Notifications
    const fetchNotifications = useCallback(() => {
        if (!token) return;
        
        // We use the token from AuthContext
        // If your AuthContext exposes token directly, use it. 
        // If it's in localStorage only, grab it there as fallback.
        const actualToken = token || localStorage.getItem('nexus_token');

        if (!actualToken) return;

        axios.get(`${API_BASE}/notifications`, {
            headers: { Authorization: `Bearer ${actualToken}` }
        })
        .then(res => {
            setNotifications(res.data);
            setUnreadCount(res.data.filter(n => !n.is_read).length);
        })
        .catch(console.error);
    }, [token]);

    // Polling (Every 60s)
    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 60000);
            return () => clearInterval(interval);
        }
    }, [user, fetchNotifications]);

    const markAsRead = async (id) => {
        const actualToken = token || localStorage.getItem('nexus_token');
        try {
            await axios.put(`${API_BASE}/notifications/${id}/read`, {}, { 
                headers: { Authorization: `Bearer ${actualToken}` } 
            });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) { console.error(err); }
    };

    const markAllRead = async () => {
        const actualToken = token || localStorage.getItem('nexus_token');
        try {
            await axios.put(`${API_BASE}/notifications/read-all`, {}, { 
                headers: { Authorization: `Bearer ${actualToken}` } 
            });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) { console.error(err); }
    };

    return (
        <NotificationContext.Provider value={{ 
            notifications, unreadCount, markAsRead, markAllRead, 
            toast, showToast, fetchNotifications 
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    return useContext(NotificationContext);
}