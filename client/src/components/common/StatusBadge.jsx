import React from 'react';

/**
 * Universal Semantic Status Badge (Phase 19)
 * Handles status formatting and color coding across all Restora entities:
 * Tables, Orders, Bills, Queue, Reservations, Staff, and Tenant Statuses.
 */
const StatusBadge = ({ status, type = 'general', size = 'md' }) => {
  if (!status) return null;

  const normalized = String(status).toUpperCase();

  const getBadgeConfig = () => {
    switch (normalized) {
      // Table & General Available / Active
      case 'AVAILABLE':
      case 'ACTIVE':
      case 'APPROVED':
      case 'CONFIRMED':
      case 'PAID':
      case 'COMPLETED':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          text: '#34d399',
          border: 'rgba(16, 185, 129, 0.3)',
          dot: '#10b981',
          label: normalized === 'AVAILABLE' ? 'Available' : normalized,
        };

      // In Progress / Warning / Attention
      case 'OCCUPIED':
      case 'SEATED':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          text: '#f87171',
          border: 'rgba(239, 68, 68, 0.3)',
          dot: '#ef4444',
          label: normalized === 'OCCUPIED' ? 'Occupied' : 'Seated',
        };

      case 'RESERVED':
      case 'PENDING':
      case 'PREPARING':
      case 'WAITING':
      case 'BILLING':
      case 'PARTIALLY_PAID':
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          text: '#fbbf24',
          border: 'rgba(245, 158, 11, 0.3)',
          dot: '#f59e0b',
          label: normalized,
        };

      // Ready / Notified / Cyan
      case 'READY':
      case 'NOTIFIED':
      case 'ARRIVED':
      case 'PLACED':
      case 'NEW':
        return {
          bg: 'rgba(6, 182, 212, 0.12)',
          text: '#38bdf8',
          border: 'rgba(6, 182, 212, 0.3)',
          dot: '#06b6d4',
          label: normalized,
        };

      // Served / Purple
      case 'SERVED':
        return {
          bg: 'rgba(168, 85, 247, 0.12)',
          text: '#c084fc',
          border: 'rgba(168, 85, 247, 0.3)',
          dot: '#a855f7',
          label: 'Served',
        };

      // Cleaning / Maintenance / Inactive
      case 'CLEANING':
      case 'DIRTY':
      case 'OUT_OF_SERVICE':
      case 'UNAVAILABLE':
      case 'INACTIVE':
      case 'SUSPENDED':
      case 'REJECTED':
      case 'CANCELLED':
      case 'NO_SHOW':
        return {
          bg: 'rgba(148, 163, 184, 0.12)',
          text: '#94a3b8',
          border: 'rgba(148, 163, 184, 0.25)',
          dot: '#64748b',
          label: normalized.replace(/_/g, ' '),
        };

      default:
        return {
          bg: 'rgba(99, 102, 241, 0.12)',
          text: '#818cf8',
          border: 'rgba(99, 102, 241, 0.3)',
          dot: '#6366f1',
          label: normalized,
        };
    }
  };

  const config = getBadgeConfig();

  const isSmall = size === 'sm';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? '0.3rem' : '0.45rem',
        padding: isSmall ? '0.15rem 0.55rem' : '0.25rem 0.75rem',
        fontSize: isSmall ? '0.72rem' : '0.78rem',
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: config.bg,
        color: config.text,
        border: `1px solid ${config.border}`,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: isSmall ? '5px' : '6px',
          height: isSmall ? '5px' : '6px',
          borderRadius: '50%',
          backgroundColor: config.dot,
          boxShadow: `0 0 6px ${config.dot}`,
        }}
      />
      {config.label}
    </span>
  );
};

export default StatusBadge;
