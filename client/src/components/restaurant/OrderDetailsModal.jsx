import React from 'react';
import {
  X,
  Receipt,
  Utensils,
  User,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Layers,
  FileText,
} from 'lucide-react';

const OrderDetailsModal = ({
  isOpen,
  onClose,
  order,
  currency = 'INR',
}) => {
  if (!isOpen || !order) return null;

  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  const isPaid = order.paymentStatus === 'PAID';
  const isCancelled = order.status === 'CANCELLED';

  const orderTimeFormatted = order.createdAt
    ? new Date(order.createdAt).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'N/A';

  const paidTimeFormatted = order.bill?.paidAt
    ? new Date(order.bill.paidAt).toLocaleString([], {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '600px',
          padding: '2rem',
          background: 'rgba(15, 23, 42, 0.95)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                {order.orderNumber || `Order #${order._id.slice(-6).toUpperCase()}`}
              </h2>
              <span
                className={`badge ${
                  order.status === 'COMPLETED'
                    ? 'badge-success'
                    : order.status === 'CANCELLED'
                    ? 'badge-danger'
                    : 'badge-indigo'
                }`}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}
              >
                {order.status}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.35rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Clock size={14} /> Placed: {orderTimeFormatted}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              borderRadius: '8px',
              padding: '0.5rem',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Operational Context: Table & Customer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Dining Table
            </span>
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : 'Direct Order'}
              {order.tableId?.section && (
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '0.4rem' }}>
                  ({order.tableId.section})
                </span>
              )}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Customer Details
            </span>
            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <User size={14} style={{ color: 'var(--text-muted)' }} />
              {order.customerId?.name || 'Walk-in Guest'}
            </div>
            {order.customerId?.phone && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Phone size={12} /> {order.customerId.phone}
              </div>
            )}
          </div>
        </div>

        {/* Order Items Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Utensils size={16} /> Ordered Items ({order.items?.length || 0})
          </h3>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(0, 0, 0, 0.3)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-muted)', fontWeight: '600' }}>Item</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>Qty</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Price</th>
                  <th style={{ padding: '0.65rem 0.85rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <tr key={item._id || idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.75rem 0.85rem' }}>
                        <div style={{ fontWeight: '500', color: 'var(--text-main)' }}>{item.name}</div>
                        {item.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.15rem' }}>
                            Note: {item.notes}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', color: 'var(--text-main)' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                        {currencySymbol}{(item.price || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '0.75rem 0.85rem', textAlign: 'right', fontWeight: '600', color: 'var(--text-main)' }}>
                        {currencySymbol}{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No items recorded on this order.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill & Settlement Details */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            padding: '1.25rem',
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Settlement Status
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
              {isPaid ? (
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#4ade80',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    background: 'rgba(34, 197, 94, 0.15)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                  }}
                >
                  <CheckCircle2 size={14} /> Paid & Settled
                </span>
              ) : isCancelled ? (
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#f87171',
                    background: 'rgba(239, 68, 68, 0.15)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                  }}
                >
                  Order Cancelled
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    color: '#fbbf24',
                    background: 'rgba(245, 158, 11, 0.15)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '6px',
                  }}
                >
                  Payment Pending
                </span>
              )}
            </div>

            {order.bill && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <div>Bill Ref: <strong style={{ color: 'var(--text-main)' }}>{order.bill.billNumber || 'Generated'}</strong></div>
                {order.bill.paymentMethod && (
                  <div>Method: <strong style={{ color: '#818cf8' }}>{order.bill.paymentMethod}</strong></div>
                )}
                {paidTimeFormatted && <div>Paid At: {paidTimeFormatted}</div>}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Subtotal:</span>
              <span>{currencySymbol}{(order.subtotal || 0).toLocaleString()}</span>
            </div>

            {order.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                <span>Discount:</span>
                <span>-{currencySymbol}{(order.discount || 0).toLocaleString()}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Tax ({order.taxRate || 5}%):</span>
              <span>{currencySymbol}{(order.tax || 0).toLocaleString()}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: '700',
                fontSize: '1.15rem',
                color: 'var(--text-main)',
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: '0.5rem',
                marginTop: '0.25rem',
              }}
            >
              <span>Total:</span>
              <span style={{ color: 'var(--primary)' }}>
                {currencySymbol}{(order.total || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1.5rem', fontSize: '0.875rem' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
