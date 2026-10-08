import React, { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Printer,
  AlertCircle,
  FileText,
  ShieldCheck,
  Receipt,
  Clock,
  User,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'CASH', label: 'Cash', icon: Banknote, description: 'Cash received at counter/table' },
  { id: 'UPI', label: 'UPI / QR', icon: QrCode, description: 'GooglePay, PhonePe, Paytm QR' },
  { id: 'CARD', label: 'Card (POS)', icon: CreditCard, description: 'Debit / Credit Card Swiped' },
];

const PaymentModal = ({
  isOpen,
  onClose,
  bill,
  onRecordPayment,
  onVoidBill,
  isProcessing = false,
  currency = 'INR',
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [voidReason, setVoidReason] = useState('');
  const [showVoidConfirm, setShowVoidConfirm] = useState(false);
  const [formError, setFormError] = useState('');

  if (!isOpen || !bill) return null;

  const isPaid = bill.paymentStatus === 'PAID';
  const isVoid = bill.paymentStatus === 'VOID';
  const isUnpaid = bill.paymentStatus === 'UNPAID';

  const handlePaySubmit = (e) => {
    e.preventDefault();
    setFormError('');
    if (!paymentMethod) {
      setFormError('Please select a payment method.');
      return;
    }

    onRecordPayment({
      paymentMethod,
      amount: bill.totalAmount,
      transactionRef: transactionRef.trim() || undefined,
      notes: paymentNotes.trim() || undefined,
    });
  };

  const handleVoidSubmit = (e) => {
    e.preventDefault();
    if (!voidReason.trim()) {
      setFormError('Please provide a reason to void this bill.');
      return;
    }
    onVoidBill(bill._id, voidReason.trim());
    setShowVoidConfirm(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(bill.createdAt).toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedPaidDate = bill.paidAt
    ? new Date(bill.paidAt).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        overflowY: 'auto',
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '620px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          border: '1px solid var(--border-glow)',
          overflow: 'hidden',
          boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6)',
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
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: isPaid
                  ? 'rgba(16, 185, 129, 0.15)'
                  : isVoid
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isPaid ? 'var(--accent-success)' : isVoid ? 'var(--accent-danger)' : 'var(--accent-primary)',
              }}
            >
              <Receipt size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                {isPaid ? 'Payment Receipt' : 'Invoice & Settlement'}
              </h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Bill #{bill.billNumber || bill._id?.slice(-6)?.toUpperCase()} • Table {bill.tableId?.tableNumber || 'N/A'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {isPaid && (
              <button
                type="button"
                onClick={handlePrint}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                title="Print Receipt"
              >
                <Printer size={14} /> Print
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.3rem',
                borderRadius: '6px',
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {formError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-danger)',
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          {/* Status Banner */}
          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: isPaid
                ? 'rgba(16, 185, 129, 0.08)'
                : isVoid
                ? 'rgba(239, 68, 68, 0.08)'
                : 'rgba(245, 158, 11, 0.08)',
              border: `1px solid ${
                isPaid
                  ? 'rgba(16, 185, 129, 0.25)'
                  : isVoid
                  ? 'rgba(239, 68, 68, 0.25)'
                  : 'rgba(245, 158, 11, 0.25)'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              {isPaid ? (
                <CheckCircle2 size={18} color="var(--accent-success)" />
              ) : isVoid ? (
                <AlertCircle size={18} color="var(--accent-danger)" />
              ) : (
                <Clock size={18} color="var(--accent-warning)" />
              )}
              <div>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: isPaid
                      ? 'var(--accent-success)'
                      : isVoid
                      ? 'var(--accent-danger)'
                      : 'var(--accent-warning)',
                  }}
                >
                  {isPaid ? 'PAID & SETTLED' : isVoid ? 'VOIDED BILL' : 'UNPAID - READY FOR PAYMENT'}
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  Generated on {formattedDate}
                </div>
              </div>
            </div>

            {isPaid && formattedPaidDate && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Paid at: {formattedPaidDate}
              </div>
            )}
          </div>

          {/* Invoice Summary Details */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
              Itemized Order Summary
            </div>

            {/* Items Table */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {(bill.items || []).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    paddingBottom: '0.4rem',
                    borderBottom: idx < bill.items.length - 1 ? '1px dashed rgba(255, 255, 255, 0.06)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>{item.quantity}x</span>
                    <span style={{ color: 'var(--text-main)' }}>{item.name}</span>
                  </div>
                  <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                    {currencySymbol}{((item.price || 0) * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations Divider */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '0.75rem', paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Subtotal</span>
                <span>{currencySymbol}{(bill.subtotal || 0).toFixed(2)}</span>
              </div>

              {(bill.discountAmount || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--accent-success)' }}>
                  <span>Discount</span>
                  <span>-{currencySymbol}{(bill.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                <span>Tax ({bill.taxRate ? `${(bill.taxRate * 100).toFixed(0)}%` : '5%'})</span>
                <span>+{currencySymbol}{(bill.taxAmount || 0).toFixed(2)}</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  marginTop: '0.4rem',
                  paddingTop: '0.4rem',
                  borderTop: '1px solid var(--border-glow)',
                }}
              >
                <span>Grand Total</span>
                <span style={{ color: 'var(--accent-primary)' }}>
                  {currencySymbol}{(bill.totalAmount || 0).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Details Section: Either settle or display settled info */}
          {isUnpaid && !showVoidConfirm && (
            <form onSubmit={handlePaySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Choose Payment Method:
              </div>

              {/* Payment Method Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                {PAYMENT_METHODS.map((method) => {
                  const Icon = method.icon;
                  const isSelected = paymentMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.85rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                        color: isSelected ? 'var(--text-main)' : 'var(--text-muted)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Icon size={22} color={isSelected ? 'var(--accent-primary)' : 'var(--text-dim)'} />
                      <span style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500 }}>
                        {method.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Transaction Ref (for UPI/Card) */}
              {(paymentMethod === 'UPI' || paymentMethod === 'CARD') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    {paymentMethod === 'UPI' ? 'UPI Reference / UTR Number (Optional)' : 'Card Approval Code / Last 4 Digits (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder={paymentMethod === 'UPI' ? 'e.g. UPI-928172918' : 'e.g. CARD-4412'}
                    className="input-field"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                </div>
              )}

              {/* Settlement Notes */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                  Settlement Notes (Optional)
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. Customer split payment or VIP promo"
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              {/* Safety State Transition Notice */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  color: 'var(--text-muted)',
                }}
              >
                <ShieldCheck size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Safety Protocol:</strong> Recording payment will mark the Order as <strong>COMPLETED</strong>, Bill as <strong>PAID</strong>, and release Table {bill.tableId?.tableNumber || ''} to <strong>AVAILABLE</strong>.
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowVoidConfirm(true)}
                  disabled={isProcessing}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'var(--accent-danger)',
                    padding: '0.65rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Void Bill
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {isProcessing ? 'Processing Settlement...' : `Collect ${currencySymbol}${(bill.totalAmount || 0).toFixed(2)} & Release Table`}
                  </span>
                </button>
              </div>
            </form>
          )}

          {/* Void Confirmation Mode */}
          {showVoidConfirm && isUnpaid && (
            <div
              style={{
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-danger)' }}>
                Confirm Voiding Bill #{bill.billNumber || bill._id?.slice(-6)}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Voiding this bill will revert the table out of the billing state. Please specify why:
              </p>
              <input
                type="text"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Reason (e.g. incorrect items added, customer changed mind)"
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowVoidConfirm(false)}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleVoidSubmit}
                  disabled={isProcessing}
                  style={{
                    background: 'var(--accent-danger)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.4rem 0.85rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Confirm Void
                </button>
              </div>
            </div>
          )}

          {/* Already Settled / Voided Footer Display */}
          {isPaid && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                color: 'var(--accent-success)',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '0.5rem',
              }}
            >
              <CheckCircle2 size={18} />
              <span>Table has been freed and order marked completed.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
