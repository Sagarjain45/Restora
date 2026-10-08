import React, { useEffect } from 'react';
import { AlertTriangle, AlertCircle, HelpCircle, X } from 'lucide-react';

const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger', // 'danger' | 'warning' | 'primary'
  onConfirm,
  onCancel,
  loading = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <AlertCircle size={24} color="#ef4444" />,
          iconBg: 'rgba(239, 68, 68, 0.15)',
          buttonBg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          buttonShadow: '0 4px 14px rgba(239, 68, 68, 0.4)',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={24} color="#f59e0b" />,
          iconBg: 'rgba(245, 158, 11, 0.15)',
          buttonBg: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          buttonShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
        };
      case 'primary':
      default:
        return {
          icon: <HelpCircle size={24} color="#6366f1" />,
          iconBg: 'rgba(99, 102, 241, 0.15)',
          buttonBg: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          buttonShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(5, 8, 15, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div
        className="glass-panel modal-entrance"
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: '1.75rem',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}
      >
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: loading ? 'not-allowed' : 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={18} />
        </button>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: vStyles.iconBg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {vStyles.icon}
          </div>

          <div style={{ flex: 1, paddingTop: '2px' }}>
            <h3
              style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                color: 'var(--text-main)',
                marginBottom: '0.5rem',
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1.75rem',
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onCancel}
            disabled={loading}
            style={{ padding: '0.6rem 1.25rem', fontSize: '0.88rem' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              background: vStyles.buttonBg,
              color: '#ffffff',
              padding: '0.6rem 1.35rem',
              fontSize: '0.88rem',
              fontWeight: 600,
              borderRadius: 'var(--radius-md)',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: vStyles.buttonShadow,
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
