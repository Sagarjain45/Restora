import React from 'react';
import {
  Users,
  Clock,
  Phone,
  BellRing,
  UserCheck,
  UserX,
  XCircle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const STATUS_CONFIG = {
  WAITING: { label: 'Waiting', badgeClass: 'badge-warning', color: '#f59e0b' },
  NOTIFIED: { label: 'Notified', badgeClass: 'badge-purple', color: '#c084fc' },
  SEATED: { label: 'Seated', badgeClass: 'badge-success', color: '#10b981' },
  NO_SHOW: { label: 'No-Show', badgeClass: 'badge-gray', color: '#94a3b8' },
  CANCELLED: { label: 'Cancelled', badgeClass: 'badge-danger', color: '#ef4444' },
};

const QueueCard = ({
  entry,
  onOpenSeatModal,
  onNotify,
  onMarkNoShow,
  onCancel,
  isProcessing = false,
}) => {
  const statusInfo = STATUS_CONFIG[entry.status] || STATUS_CONFIG.WAITING;
  const isActive = entry.status === 'WAITING' || entry.status === 'NOTIFIED';

  // Calculate waiting time in minutes
  const arrivalDate = new Date(entry.arrivalTime);
  const now = new Date();
  const waitMinutes = Math.max(0, Math.floor((now - arrivalDate) / (1000 * 60)));

  const formattedTime = arrivalDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.75)',
        border: `1px solid ${isActive ? 'var(--border-subtle)' : 'rgba(255, 255, 255, 0.05)'}`,
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div>
        {/* Top Header: Position Pill & Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isActive && (
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 800,
                  color: 'var(--accent-warning)',
                  background: 'rgba(245, 158, 11, 0.15)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '20px',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                #{entry.position}
              </span>
            )}
            <span className={`badge ${statusInfo.badgeClass}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
              {statusInfo.label}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            <Clock size={12} />
            <span>{formattedTime}</span>
          </div>
        </div>

        {/* Customer Information */}
        <div style={{ marginBottom: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {entry.customerName}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            <Phone size={12} />
            <span>{entry.customerPhone}</span>
          </div>
        </div>

        {/* Party Details & Waiting Ticker */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '0.6rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '0.85rem',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontWeight: 600 }}>
            <Users size={14} color="var(--accent-primary)" />
            <span>{entry.guestCount} {entry.guestCount === 1 ? 'Guest' : 'Guests'}</span>
          </div>

          {isActive ? (
            <div style={{ color: waitMinutes > 20 ? 'var(--accent-danger)' : 'var(--text-dim)', fontSize: '0.75rem', fontWeight: 500 }}>
              Waiting {waitMinutes} min{waitMinutes === 1 ? '' : 's'}
            </div>
          ) : entry.status === 'SEATED' ? (
            <div style={{ color: 'var(--accent-success)', fontSize: '0.75rem', fontWeight: 600 }}>
              Seated: Table {entry.assignedTableId?.tableNumber || 'Assigned'}
            </div>
          ) : null}
        </div>

        {/* Notes if any */}
        {entry.notes && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.85rem', fontStyle: 'italic' }}>
            &ldquo;{entry.notes}&rdquo;
          </div>
        )}
      </div>

      {/* Action Controls for Active Queue Entries */}
      {isActive && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {/* Primary Action: Seat Customer */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onOpenSeatModal(entry)}
              className="btn-primary"
              style={{
                flex: 1,
                fontSize: '0.8rem',
                padding: '0.45rem 0.75rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem',
              }}
            >
              <UserCheck size={14} />
              <span>Seat Table</span>
            </button>

            {/* Notify Button if WAITING */}
            {entry.status === 'WAITING' && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onNotify(entry._id)}
                className="btn-secondary"
                style={{
                  fontSize: '0.78rem',
                  padding: '0.45rem 0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                }}
                title="Send notification / alert guest"
              >
                <BellRing size={13} color="var(--accent-purple, #c084fc)" />
                <span>Notify</span>
              </button>
            )}
          </div>

          {/* Secondary Actions: No-show or Cancel */}
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onMarkNoShow(entry._id)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(148, 163, 184, 0.25)',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.3rem 0.55rem',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
              title="Mark party as no-show"
            >
              No-Show
            </button>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onCancel(entry._id)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: 'var(--accent-danger)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.3rem 0.55rem',
                fontSize: '0.72rem',
                cursor: 'pointer',
              }}
              title="Cancel waitlist entry"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueueCard;
