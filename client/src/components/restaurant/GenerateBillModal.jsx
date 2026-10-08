import React, { useState, useEffect } from 'react';
import { X, Receipt, Percent, Tag, FileText, AlertCircle, ArrowRight } from 'lucide-react';

const GenerateBillModal = ({
  isOpen,
  onClose,
  onSubmit,
  activeOrders = [],
  initialOrder = null,
  isProcessing = false,
  currency = 'INR',
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxRatePercent, setTaxRatePercent] = useState(5);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialOrder) {
      setSelectedOrderId(initialOrder._id);
    } else if (activeOrders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(activeOrders[0]._id);
    }
  }, [initialOrder, activeOrders]);

  if (!isOpen) return null;

  const currentOrder = initialOrder || activeOrders.find((o) => o._id === selectedOrderId);
  const subtotal = currentOrder ? (currentOrder.totalAmount || 0) : 0;
  const discount = Math.max(0, parseFloat(discountAmount) || 0);
  const taxableAmount = Math.max(0, subtotal - discount);
  const taxRateDecimal = (parseFloat(taxRatePercent) || 0) / 100;
  const taxAmount = Math.round(taxableAmount * taxRateDecimal * 100) / 100;
  const estimatedTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrderId) {
      setError('Please select an active order to generate bill for.');
      return;
    }
    if (discount > subtotal) {
      setError('Discount cannot exceed the order subtotal.');
      return;
    }

    setError('');
    onSubmit({
      orderId: selectedOrderId,
      discountAmount: discount,
      taxRate: taxRateDecimal,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 55,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--border-glow)',
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Receipt size={18} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Generate Table Bill</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Locks table into BILLING state and creates invoice
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-danger)',
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Select Active Order if not passed directly */}
          {!initialOrder && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Select Active Order:
              </label>
              {activeOrders.length === 0 ? (
                <div style={{ padding: '0.75rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  No active orders available to bill.
                </div>
              ) : (
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.9rem' }}
                >
                  {activeOrders.map((ord) => (
                    <option key={ord._id} value={ord._id}>
                      {ord.orderNumber || `ORD-${ord._id.slice(-4)}`} - Table {ord.tableId?.tableNumber || 'N/A'} ({currencySymbol}{ord.totalAmount})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {currentOrder && (
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                  Order: {currentOrder.orderNumber || currentOrder._id.slice(-6)}
                </span>
                <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                  Table {currentOrder.tableId?.tableNumber || 'N/A'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {currentOrder.items?.length || 0} order items • Base Amount: {currencySymbol}{subtotal.toFixed(2)}
              </div>
            </div>
          )}

          {/* Discount & Tax Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                <Tag size={13} /> Discount Amount ({currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                step="any"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                <Percent size={13} /> Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Invoice / Special Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 10% anniversary discount applied"
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* Live Bill Breakdown Preview */}
          <div
            style={{
              padding: '1rem',
              background: 'rgba(15, 23, 42, 0.7)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-glow)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>Subtotal</span>
              <span>{currencySymbol}{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--accent-success)' }}>
                <span>Discount</span>
                <span>-{currencySymbol}{discount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span>Tax ({taxRatePercent}%)</span>
              <span>+{currencySymbol}{taxAmount.toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginTop: '0.3rem',
                paddingTop: '0.4rem',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span>Estimated Bill Total</span>
              <span style={{ color: 'var(--accent-primary)' }}>
                {currencySymbol}{estimatedTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* State Transition Info */}
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
            💡 Generating this bill will set the table to <strong style={{ color: 'var(--accent-purple, #c084fc)' }}>BILLING</strong>. The table will stay occupied/billing until payment is collected.
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || !selectedOrderId}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <span>{isProcessing ? 'Generating Bill...' : 'Generate Bill'}</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GenerateBillModal;
