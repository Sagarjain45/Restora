import React from 'react';
import { Plus } from 'lucide-react';

const EmptyState = ({
  icon: Icon,
  title = 'No records found',
  description = 'There are currently no items matching your criteria.',
  actionText = null,
  onAction = null,
  actionIcon: ActionIcon = Plus,
}) => {
  return (
    <div
      className="glass-panel"
      style={{
        padding: '3.5rem 2rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        margin: '1rem 0',
      }}
    >
      {Icon && (
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <Icon size={30} color="#818cf8" />
        </div>
      )}

      <h3
        style={{
          fontSize: '1.2rem',
          fontWeight: 700,
          color: 'var(--text-main)',
          marginBottom: '0.5rem',
        }}
      >
        {title}
      </h3>

      <p
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-muted)',
          maxWidth: '440px',
          lineHeight: 1.5,
          marginBottom: actionText && onAction ? '1.5rem' : '0',
        }}
      >
        {description}
      </p>

      {actionText && onAction && (
        <button
          type="button"
          className="btn-primary"
          onClick={onAction}
          style={{ padding: '0.65rem 1.4rem', fontSize: '0.9rem' }}
        >
          {ActionIcon && <ActionIcon size={16} />}
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
