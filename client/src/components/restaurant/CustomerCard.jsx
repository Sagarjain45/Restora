import React from 'react';
import {
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Award,
  Edit2,
  Clock,
  History,
  FileText,
} from 'lucide-react';

const CustomerCard = ({
  customer,
  onEdit,
  onViewHistory,
  currency = 'INR',
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  const isVIP = customer.totalSpent >= 2000;
  const isFrequent = customer.visitCount > 1;

  const lastVisitFormatted = customer.lastVisit
    ? new Date(customer.lastVisit).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Never';

  // Initials
  const initials = customer.name
    ? customer.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'C';

  return (
    <div
      className="glass-panel"
      style={{
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'rgba(15, 23, 42, 0.75)',
        border: isVIP
          ? '1px solid rgba(245, 158, 11, 0.35)'
          : isFrequent
          ? '1px solid rgba(99, 102, 241, 0.3)'
          : '1px solid var(--border-subtle)',
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div>
        {/* Card Header: Avatar, Name, Status Badge, Edit */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: isVIP
                  ? 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.95rem',
                color: '#ffffff',
                boxShadow: isVIP ? '0 4px 12px rgba(245, 158, 11, 0.3)' : '0 4px 12px rgba(99, 102, 241, 0.25)',
              }}
            >
              {initials}
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {customer.name}
                </h4>
              </div>
              <div style={{ marginTop: '2px' }}>
                {isVIP ? (
                  <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                    <Award size={10} style={{ marginRight: '3px' }} /> VIP Patron
                  </span>
                ) : isFrequent ? (
                  <span className="badge badge-indigo" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                    Frequent ({customer.visitCount} visits)
                  </span>
                ) : (
                  <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}>
                    New Diner
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onEdit(customer)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-dim)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: '4px',
            }}
            title="Edit Customer"
          >
            <Edit2 size={15} />
          </button>
        </div>

        {/* Contact info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            <Phone size={12} color="var(--accent-primary)" />
            <span>{customer.phone}</span>
          </div>
          {customer.email && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              <Mail size={12} />
              <span>{customer.email}</span>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            background: 'rgba(0, 0, 0, 0.25)',
            padding: '0.6rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '0.85rem',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Visits</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {customer.visitCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Spend</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-success)' }}>
              {currencySymbol}{Math.round(customer.totalSpent || 0).toLocaleString('en-IN')}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Last Visit</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginTop: '2px' }}>
              {lastVisitFormatted}
            </div>
          </div>
        </div>

        {/* Notes if any */}
        {customer.notes && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.5rem', fontStyle: 'italic', display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
            <FileText size={12} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>&ldquo;{customer.notes}&rdquo;</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
        <button
          type="button"
          onClick={() => onViewHistory(customer)}
          className="btn-secondary"
          style={{
            width: '100%',
            fontSize: '0.78rem',
            padding: '0.4rem 0.6rem',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
          }}
        >
          <History size={13} />
          <span>View Diner History</span>
        </button>
      </div>
    </div>
  );
};

export default CustomerCard;
