import React from 'react';
import {
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  UserCheck,
  CheckCircle2,
  XCircle,
  UserX,
  Edit2,
  AlertCircle,
  Store,
} from 'lucide-react';

const STATUS_CONFIG = {
  PENDING: { label: 'Pending', badgeClass: 'badge-cyan', color: '#06b6d4' },
  CONFIRMED: { label: 'Confirmed', badgeClass: 'badge-indigo', color: '#6366f1' },
  ARRIVED: { label: 'Arrived', badgeClass: 'badge-purple', color: '#c084fc' },
  SEATED: { label: 'Seated', badgeClass: 'badge-success', color: '#10b981' },
  COMPLETED: { label: 'Completed', badgeClass: 'badge-success', color: '#10b981' },
  CANCELLED: { label: 'Cancelled', badgeClass: 'badge-danger', color: '#ef4444' },
  NO_SHOW: { label: 'No-Show', badgeClass: 'badge-gray', color: '#94a3b8' },
};

const ReservationCard = ({
  reservation,
  onEdit,
  onUpdateStatus,
  onSeat,
  isProcessing = false,
}) => {
  const statusInfo = STATUS_CONFIG[reservation.status] || STATUS_CONFIG.CONFIRMED;
  const isEditable = reservation.status !== 'COMPLETED' && reservation.status !== 'CANCELLED' && reservation.status !== 'NO_SHOW';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.75)',
        border: `1px solid ${statusInfo.color ? `${statusInfo.color}33` : 'var(--border-subtle)'}`,
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div>
        {/* Header: Time, Date & Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-main)', fontWeight: 800, fontSize: '1.05rem' }}>
              <Clock size={16} color="var(--accent-primary)" />
              <span>
                {reservation.startTime} {reservation.endTime ? `- ${reservation.endTime}` : ''}
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} />
              <span>{reservation.date}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className={`badge ${statusInfo.badgeClass}`} style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}>
              {statusInfo.label}
            </span>
            {isEditable && (
              <button
                type="button"
                onClick={() => onEdit(reservation)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  padding: '0.2rem',
                }}
                title="Edit Reservation"
              >
                <Edit2 size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div style={{ marginBottom: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {reservation.customerName}
          </h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
            <Phone size={12} />
            <span>{reservation.customerPhone}</span>
            {reservation.customerEmail && (
              <>
                <span style={{ color: 'var(--text-dim)' }}>•</span>
                <span style={{ color: 'var(--text-dim)' }}>{reservation.customerEmail}</span>
              </>
            )}
          </div>
        </div>

        {/* Guest & Table Info Bar */}
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
            <span>{reservation.guestCount} {reservation.guestCount === 1 ? 'Guest' : 'Guests'}</span>
          </div>

          <div>
            {reservation.tableId ? (
              <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                <Store size={11} style={{ marginRight: '3px' }} />
                Table {reservation.tableId.tableNumber}
              </span>
            ) : (
              <span style={{ color: 'var(--accent-warning)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                Unassigned Table
              </span>
            )}
          </div>
        </div>

        {/* Notes */}
        {reservation.notes && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.85rem', fontStyle: 'italic' }}>
            &ldquo;{reservation.notes}&rdquo;
          </div>
        )}
      </div>

      {/* Operational Actions */}
      {isEditable && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {reservation.status === 'CONFIRMED' && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onUpdateStatus(reservation._id, 'ARRIVED')}
                className="btn-secondary"
                style={{
                  flex: 1,
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}
              >
                <CheckCircle2 size={13} color="var(--accent-purple, #c084fc)" />
                <span>Mark Arrived</span>
              </button>
            )}

            {(reservation.status === 'ARRIVED' || reservation.status === 'CONFIRMED') && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onSeat(reservation)}
                className="btn-primary"
                style={{
                  flex: 1,
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}
              >
                <UserCheck size={13} />
                <span>Seat Guests</span>
              </button>
            )}

            {reservation.status === 'SEATED' && (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onUpdateStatus(reservation._id, 'COMPLETED')}
                className="btn-primary"
                style={{
                  flex: 1,
                  fontSize: '0.78rem',
                  padding: '0.4rem 0.65rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.3rem',
                }}
              >
                <CheckCircle2 size={13} />
                <span>Finish & Complete</span>
              </button>
            )}
          </div>

          {/* Quick No-Show / Cancel Controls */}
          {reservation.status !== 'SEATED' && (
            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => onUpdateStatus(reservation._id, 'NO_SHOW')}
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
                onClick={() => onUpdateStatus(reservation._id, 'CANCELLED')}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: 'var(--accent-danger)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.3rem 0.55rem',
                  fontSize: '0.72rem',
                  cursor: 'pointer',
                }}
                title="Cancel reservation"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReservationCard;
