import React from 'react';
import { Check, X, BellRing, CheckCircle2 } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

export default function NotificationPanel({ isOpen, onClose }) {
    const { notifications, markAsRead, markAllRead } = useNotification();

    return (
        <>
            {/* Backdrop (Darken background when open) */}
            <div 
                className={`notification-backdrop ${isOpen ? 'open' : ''}`} 
                onClick={onClose}
            ></div>

            {/* Sliding Sidebar Drawer */}
            <div className={`notification-drawer glass ${isOpen ? 'open' : ''}`}>
                
                {/* Header */}
                <div className="drawer-header">
                    <div className="drawer-title">
                        <BellRing size={20} className="text-primary" />
                        <h3>Notifications</h3>
                        <span className="badge-count">{notifications.filter(n => !n.is_read).length}</span>
                    </div>
                    <button className="btn-icon-sm close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* List Area */}
                <div className="drawer-content">
                    {notifications.length === 0 ? (
                        <div className="empty-state-drawer">
                            <div className="empty-icon"><CheckCircle2 size={40} /></div>
                            <p>You're all caught up!</p>
                            <span className="text-muted text-sm">No new notifications.</span>
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div key={notif.id} className={`drawer-item ${notif.is_read ? 'read' : 'unread'}`}>
                                <div className="drawer-item-body">
                                    <p className="notif-message">{notif.message}</p>
                                    <span className="notif-timestamp">
                                        {new Date(notif.created_at).toLocaleString([], { 
                                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                                        })}
                                    </span>
                                </div>
                                {!notif.is_read && (
                                    <button 
                                        className="mark-read-btn" 
                                        onClick={() => markAsRead(notif.id)}
                                        title="Mark as read"
                                    >
                                        <div className="read-dot"></div>
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="drawer-footer">
                    <button className="btn-primary full-width" onClick={markAllRead} disabled={notifications.length === 0}>
                        <Check size={16} /> Mark all as read
                    </button>
                </div>
            </div>
        </>
    );
}