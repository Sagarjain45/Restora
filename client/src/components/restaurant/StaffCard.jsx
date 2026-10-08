import React from 'react';
import {
  User,
  Phone,
  Mail,
  Briefcase,
  Shield,
  Edit2,
  Power,
  CheckCircle,
  AlertOctagon,
} from 'lucide-react';

const StaffCard = ({
  staff,
  onEdit,
  onToggleStatus,
  currentUserId,
  isProcessing = false,
}) => {
  const isActive = staff.status === 'ACTIVE';
  const isOwner = staff.role === 'RESTAURANT_OWNER';
  const isSelf = staff._id === currentUserId;

  // Initials
  const initials = staff.name
    ? staff.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'ST';

  // Palette accent per designation
  const getDesignationStyle = (title) => {
    switch (title) {
      case 'Chef / Kitchen Staff':
        return { bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171' };
      case 'Server / Waitstaff':
        return { bg: 'rgba(59, 130, 246, 0.15)', border: 'rgba(59, 130, 246, 0.3)', text: '#60a5fa' };
      case 'Cashier / Billing':
        return { bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.3)', text: '#34d399' };
      case 'Bartender':
        return { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', text: '#c084fc' };
      case 'Shift Supervisor':
        return { bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' };
      case 'Host / Reception':
        return { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)', text: '#f472b6' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.15)', border: 'rgba(148, 163, 184, 0.3)', text: '#94a3b8' };
    }
  };

  const badgeStyle = getDesignationStyle(staff.designation);

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.75)',
        border: isActive
          ? '1px solid var(--border-subtle)'
          : '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '14px',
        position: 'relative',
        transition: 'all 0.2s ease',
        opacity: isActive ? 1 : 0.75,
      }}
    >
      <div>
        {/* Top Header: Avatar, Name, Role Badge, Edit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: isOwner
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : isActive
                  ? 'linear-gradient(135deg, #6366f1, #3b82f6)'
                  : 'linear-gradient(135deg, #475569, #334155)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '700',
                fontSize: '1rem',
                boxShadow: isOwner
                  ? '0 4px 12px rgba(245, 158, 11, 0.3)'
                  : '0 4px 12px rgba(99, 102, 241, 0.25)',
              }}
            >
              {initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
                  {staff.name}
                </h3>
                {isSelf && (
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#818cf8',
                      fontWeight: '600',
                    }}
                  >
                    You
                  </span>
                )}
              </div>

              {/* Designation badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '6px',
                    background: badgeStyle.bg,
                    border: `1px solid ${badgeStyle.border}`,
                    color: badgeStyle.text,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Briefcase size={12} />
                  {staff.designation || 'Floor Staff'}
                </span>

                {isOwner && (
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: '600',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '6px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#fbbf24',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                    }}
                  >
                    <Shield size={11} />
                    Owner
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => onEdit(staff)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.45rem',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
            title="Edit Staff Member"
          >
            <Edit2 size={15} />
          </button>
        </div>

        {/* Contact details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', margin: '0.85rem 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <Mail size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {staff.email}
            </span>
          </div>

          {staff.phone && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <Phone size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span>{staff.phone}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer: Status Indicator & Quick Action */}
      <div
        style={{
          borderTop: '1px solid var(--border-subtle)',
          paddingTop: '0.75rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isActive ? (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#4ade80',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontWeight: '600',
              }}
            >
              <CheckCircle size={13} />
              Active
            </span>
          ) : (
            <span
              style={{
                fontSize: '0.75rem',
                color: '#f87171',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
                fontWeight: '600',
              }}
            >
              <AlertOctagon size={13} />
              Suspended
            </span>
          )}
        </div>

        <button
          onClick={() => onToggleStatus(staff)}
          disabled={isSelf || isProcessing}
          style={{
            background: isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
            border: isActive ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(34, 197, 94, 0.25)',
            color: isActive ? '#f87171' : '#4ade80',
            borderRadius: '6px',
            padding: '0.35rem 0.65rem',
            fontSize: '0.75rem',
            fontWeight: '600',
            cursor: isSelf ? 'not-allowed' : 'pointer',
            opacity: isSelf ? 0.4 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
          title={isSelf ? 'Cannot deactivate your own account' : isActive ? 'Deactivate Staff' : 'Activate Staff'}
        >
          <Power size={12} />
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
      </div>
    </div>
  );
};

export default StaffCard;
