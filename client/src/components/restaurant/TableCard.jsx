import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Receipt,
  AlertTriangle,
  Edit2,
  Trash2,
  ArrowRight,
  MoreVertical,
} from 'lucide-react';

const STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Available',
    badgeClass: 'badge-success',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    icon: CheckCircle2,
  },
  OCCUPIED: {
    label: 'Occupied',
    badgeClass: 'badge-indigo',
    color: '#818cf8',
    bgColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.35)',
    icon: Users,
  },
  RESERVED: {
    label: 'Reserved',
    badgeClass: 'badge-warning',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
    icon: Clock,
  },
  BILLING: {
    label: 'Billing',
    badgeClass: 'badge-purple',
    color: '#c084fc',
    bgColor: 'rgba(168, 85, 247, 0.08)',
    borderColor: 'rgba(168, 85, 247, 0.35)',
    icon: Receipt,
  },
  OUT_OF_SERVICE: {
    label: 'Out of Service',
    badgeClass: 'badge-gray',
    color: '#94a3b8',
    bgColor: 'rgba(148, 163, 184, 0.08)',
    borderColor: 'rgba(148, 163, 184, 0.25)',
    icon: AlertTriangle,
  },
  CLEANING: {
    label: 'Cleaning',
    badgeClass: 'badge-cyan',
    color: '#38bdf8',
    bgColor: 'rgba(6, 182, 212, 0.08)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
    icon: Clock,
  },
};

const NEXT_TRANSITIONS = {
  AVAILABLE: [
    { target: 'OCCUPIED', label: 'Seat Customers', color: 'var(--accent-primary)' },
    { target: 'RESERVED', label: 'Mark Reserved', color: 'var(--accent-warning)' },
    { target: 'OUT_OF_SERVICE', label: 'Set Out of Service', color: 'var(--text-dim)' },
  ],
  OCCUPIED: [
    { target: 'BILLING', label: 'Request Bill', color: '#c084fc' },
    { target: 'AVAILABLE', label: 'Release Table', color: 'var(--accent-success)' },
  ],
  RESERVED: [
    { target: 'OCCUPIED', label: 'Seat Guests', color: 'var(--accent-primary)' },
    { target: 'AVAILABLE', label: 'Cancel Booking', color: 'var(--text-dim)' },
  ],
  BILLING: [
    { target: 'AVAILABLE', label: 'Clear & Available', color: 'var(--accent-success)' },
  ],
  OUT_OF_SERVICE: [
    { target: 'AVAILABLE', label: 'Restore to Service', color: 'var(--accent-success)' },
  ],
  CLEANING: [
    { target: 'AVAILABLE', label: 'Finished Cleaning', color: 'var(--accent-success)' },
  ],
};

const TableCard = ({
  table,
  isOwner,
  onStatusChange,
  onEdit,
  onDelete,
  isProcessing = false,
}) => {
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const statusInfo = STATUS_CONFIG[table.status] || STATUS_CONFIG.AVAILABLE;
  const StatusIcon = statusInfo.icon;
  const quickActions = NEXT_TRANSITIONS[table.status] || [];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        background: statusInfo.bgColor,
        borderColor: statusInfo.borderColor,
        opacity: table.isActive ? 1 : 0.6,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      {/* Card Header: Table Number & Section */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>
                {table.tableNumber}
              </h3>
              {!table.isActive && (
                <span className="badge badge-danger" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                  Inactive
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
              {table.section || 'Main Dining'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {/* Status Badge */}
            <span
              className={`badge ${statusInfo.badgeClass}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
            >
              <StatusIcon size={12} />
              {statusInfo.label}
            </span>

            {/* Owner Management Menu */}
            {isOwner && (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  style={{
                    padding: '0.3rem',
                    color: 'var(--text-muted)',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                  title="Table actions"
                >
                  <MoreVertical size={16} />
                </button>

                {showActionsMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '110%',
                      background: '#131b2e',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.35rem',
                      zIndex: 30,
                      boxShadow: 'var(--shadow-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem',
                      minWidth: '130px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionsMenu(false);
                        onEdit(table);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.8rem',
                        color: 'var(--text-main)',
                        textAlign: 'left',
                        borderRadius: '4px',
                      }}
                    >
                      <Edit2 size={13} /> Edit Table
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowActionsMenu(false);
                        onDelete(table);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.8rem',
                        color: 'var(--accent-danger)',
                        textAlign: 'left',
                        borderRadius: '4px',
                      }}
                    >
                      <Trash2 size={13} /> Deactivate
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Capacity / Seating Info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 0.75rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '1rem',
            fontSize: '0.85rem',
          }}
        >
          <Users size={15} color="var(--text-muted)" />
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            {table.capacity} {table.capacity === 1 ? 'Seat' : 'Seats'}
          </span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', marginLeft: 'auto' }}>
            ID: {table.tableNumber}
          </span>
        </div>
      </div>

      {/* Operational State Transition Buttons */}
      <div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Action / Next State:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {quickActions.map((action) => (
            <button
              key={action.target}
              type="button"
              disabled={isProcessing}
              onClick={() => onStatusChange(table._id, action.target)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.45rem 0.75rem',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: action.color,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-sm)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.09)';
                e.currentTarget.style.borderColor = action.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              <span>{action.label}</span>
              <ArrowRight size={13} />
            </button>
          ))}

          {quickActions.length === 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '0.25rem 0' }}>
              No immediate transitions required.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TableCard;
