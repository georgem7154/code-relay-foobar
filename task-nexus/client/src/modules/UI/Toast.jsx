import React from 'react';
import { useNotification } from '../context/NotificationContext';
import { CheckCircle, AlertCircle, Info } from 'lucide-react';

const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />
};

const colors = {
    success: 'var(--success)',
    error: 'var(--danger)',
    info: 'var(--primary)'
};

export default function Toast() {
    const { toast } = useNotification();

    if (!toast.show) return null;

    return (
        <div className="toast-container fade-in" style={{ borderLeftColor: colors[toast.type] }}>
            <div className="toast-icon" style={{ color: colors[toast.type] }}>
                {icons[toast.type]}
            </div>
            <span className="toast-message">{toast.message}</span>
        </div>
    );
}