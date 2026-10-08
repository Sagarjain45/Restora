import React, { createContext, useState, useCallback, useMemo } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toastHelpers = useMemo(() => ({
    showToast,
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration),
    warning: (msg, duration) => showToast(msg, 'warning', duration),
    info: (msg, duration) => showToast(msg, 'info', duration),
    removeToast,
  }), [showToast, removeToast]);

  const getToastIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={18} color="#10b981" />;
      case 'error':
        return <AlertCircle size={18} color="#ef4444" />;
      case 'warning':
        return <AlertTriangle size={18} color="#f59e0b" />;
      case 'info':
      default:
        return <Info size={18} color="#6366f1" />;
    }
  };

  const getToastStyle = (type) => {
    switch (type) {
      case 'success':
        return {
          borderColor: 'rgba(16, 185, 129, 0.4)',
          background: 'rgba(15, 23, 42, 0.95)',
          boxShadow: '0 8px 30px rgba(16, 185, 129, 0.2)',
        };
      case 'error':
        return {
          borderColor: 'rgba(239, 68, 68, 0.4)',
          background: 'rgba(15, 23, 42, 0.95)',
          boxShadow: '0 8px 30px rgba(239, 68, 68, 0.2)',
        };
      case 'warning':
        return {
          borderColor: 'rgba(245, 158, 11, 0.4)',
          background: 'rgba(15, 23, 42, 0.95)',
          boxShadow: '0 8px 30px rgba(245, 158, 11, 0.2)',
        };
      case 'info':
      default:
        return {
          borderColor: 'rgba(99, 102, 241, 0.4)',
          background: 'rgba(15, 23, 42, 0.95)',
          boxShadow: '0 8px 30px rgba(99, 102, 241, 0.2)',
        };
    }
  };

  return (
    <ToastContext.Provider value={toastHelpers}>
      {children}
      {/* Toast Notification Container */}
      <div
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
          maxWidth: '400px',
          width: 'calc(100vw - 2.5rem)',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((toast) => {
          const style = getToastStyle(toast.type);
          return (
            <div
              key={toast.id}
              className="toast-entrance"
              style={{
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.125rem',
                borderRadius: '12px',
                border: '1px solid',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                color: '#f8fafc',
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.4,
                ...style,
              }}
            >
              <div style={{ flexShrink: 0 }}>{getToastIcon(toast.type)}</div>
              <div style={{ flex: 1, wordBreak: 'break-word' }}>{toast.message}</div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.7,
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.7'; }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};
