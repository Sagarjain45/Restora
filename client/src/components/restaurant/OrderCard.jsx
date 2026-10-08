import {
  Clock,
  Plus,
  Minus,
  ArrowRight,
  User
} from 'lucide-react';

const STATUS_CONFIG = {
  NEW: { label: 'New', badgeClass: 'badge-cyan', color: '#06b6d4', next: 'PREPARING', nextLabel: 'Start Preparing' },
  PLACED: { label: 'Placed', badgeClass: 'badge-cyan', color: '#06b6d4', next: 'PREPARING', nextLabel: 'Start Preparing' },
  PREPARING: { label: 'Preparing', badgeClass: 'badge-warning', color: '#f59e0b', next: 'READY', nextLabel: 'Mark Ready' },
  READY: { label: 'Ready for Pickup', badgeClass: 'badge-purple', color: '#c084fc', next: 'SERVED', nextLabel: 'Serve to Table' },
  SERVED: { label: 'Served', badgeClass: 'badge-indigo', color: '#818cf8', next: 'COMPLETED', nextLabel: 'Finish / Close' },
  COMPLETED: { label: 'Completed', badgeClass: 'badge-success', color: '#10b981', next: null, nextLabel: null },
  CANCELLED: { label: 'Cancelled', badgeClass: 'badge-danger', color: '#ef4444', next: null, nextLabel: null },
};

const OrderCard = ({
  order,
  onUpdateStatus,
  onUpdateItemQuantity,
  onRemoveItem,
  onOpenAddItem,
  isProcessing = false,
  currency = 'INR',
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.PLACED;
  const isEditable = order.status !== 'COMPLETED' && order.status !== 'CANCELLED';

  const timeFormatted = new Date(order.createdAt).toLocaleTimeString([], {
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
        border: `1px solid ${statusInfo.color ? `${statusInfo.color}33` : 'var(--border-subtle)'}`,
        position: 'relative',
        transition: 'all 0.2s ease',
      }}
    >
      <div>
        {/* Card Header: Order #, Table Label, Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                {order.orderNumber || `ORD-${order._id.slice(-4).toUpperCase()}`}
              </span>
              <span className={`badge ${statusInfo.badgeClass}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                {statusInfo.label}
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '0.2rem' }}>
              {order.tableId?.tableNumber || 'Assigned Table'}
              {order.tableId?.section ? ` • ${order.tableId.section}` : ''}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            <Clock size={12} />
            <span>{timeFormatted}</span>
          </div>
        </div>

        {/* Customer info if provided */}
        {order.customerId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
            <User size={12} />
            <span>{order.customerId.name || 'Guest'}</span>
          </div>
        )}

        {/* Items List */}
        <div
          style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.75rem',
            marginBottom: '0.85rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '180px',
            overflowY: 'auto',
          }}
        >
          {order.items && order.items.length > 0 ? (
            order.items.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem',
                  paddingBottom: '0.35rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>
                      {item.quantity}x
                    </span>
                    <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                      {item.name}
                    </span>
                  </div>
                  {item.notes && (
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-warning)', fontStyle: 'italic', marginTop: '0.1rem' }}>
                      Note: {item.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                  </span>

                  {isEditable && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <button
                        type="button"
                        onClick={() => onUpdateItemQuantity(order._id, item._id, item.quantity - 1)}
                        style={{ padding: '0.2rem', color: 'var(--text-dim)', cursor: 'pointer' }}
                        title="Reduce quantity"
                      >
                        <Minus size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateItemQuantity(order._id, item._id, item.quantity + 1)}
                        style={{ padding: '0.2rem', color: 'var(--text-dim)', cursor: 'pointer' }}
                        title="Increase quantity"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '0.5rem 0' }}>
              No dishes added yet.
            </div>
          )}
        </div>

        {/* Order Notes */}
        {order.notes && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '0.4rem 0.6rem', borderRadius: '4px' }}>
            <strong>Special Note:</strong> {order.notes}
          </div>
        )}
      </div>

      {/* Footer: Financial Totals & Action Progression Buttons */}
      <div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 0',
            borderTop: '1px solid var(--border-subtle)',
            marginBottom: '0.75rem',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
            Subtotal: {currencySymbol}{order.subtotal?.toFixed(2) || '0.00'} • Tax ({order.taxRate || 5}%): {currencySymbol}{order.tax?.toFixed(2) || '0.00'}
            {order.discount > 0 && ` • Disc: -${currencySymbol}${order.discount.toFixed(2)}`}
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
            {currencySymbol}{order.total?.toFixed(2) || '0.00'}
          </div>
        </div>

        {/* Workflow Progression Controls */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isEditable && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onOpenAddItem(order)}
              className="btn-secondary"
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.75rem',
                flex: '1 1 auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.3rem',
              }}
            >
              <Plus size={13} /> Add Dish
            </button>
          )}

          {statusInfo.next && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onUpdateStatus(order._id, statusInfo.next)}
              className="btn-primary"
              style={{
                fontSize: '0.75rem',
                padding: '0.4rem 0.85rem',
                flex: '2 1 auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.4rem',
              }}
            >
              <span>{statusInfo.nextLabel}</span>
              <ArrowRight size={13} />
            </button>
          )}

          {/* Quick Cancel button if not finished */}
          {isEditable && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onUpdateStatus(order._id, 'CANCELLED')}
              style={{
                fontSize: '0.7rem',
                color: 'var(--accent-danger)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.35rem 0.6rem',
                cursor: 'pointer',
              }}
              title="Cancel Order"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderCard;
