import React, { useState } from 'react';
import { X, Users, User, Phone, Clock, AlertCircle, Plus, FileText } from 'lucide-react';

const AddToQueueModal = ({
  isOpen,
  onClose,
  onSubmit,
  currentWaitingCount = 0,
  isProcessing = false,
}) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const estimatedPosition = currentWaitingCount + 1;
  const estimatedWaitMinutes = estimatedPosition * 10;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Please enter the customer name.');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Please enter a phone number to notify the guest.');
      return;
    }
    if (!guestCount || guestCount < 1) {
      setError('Guest count must be at least 1.');
      return;
    }

    setError('');
    onSubmit({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      guestCount: parseInt(guestCount, 10),
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
        zIndex: 60,
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
          maxWidth: '500px',
          maxHeight: '92vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-warning)',
              }}
            >
              <Clock size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Add Walk-in to Queue</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Position #{estimatedPosition} • ~{estimatedWaitMinutes} mins estimated wait
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
              padding: '0.3rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
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
              <span>{error}</span>
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <User size={13} /> Customer / Party Name *
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ananya Roy"
              className="input-field"
              style={{ width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          {/* Customer Phone & Guest Count */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <Phone size={13} /> Phone Number *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="input-field"
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                <Users size={13} /> Guests *
              </label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Special Notes / Requests */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <FileText size={13} /> Seating Preferences / Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. High chair needed, prefers outdoor or quiet table"
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* Information Notice */}
          <div
            style={{
              padding: '0.85rem 1rem',
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.25rem',
            }}
          >
            <div style={{ fontWeight: 600, color: 'var(--accent-warning)' }}>
              FIFO Queue Ordering Rule
            </div>
            <div>
              This party will be placed at <strong>Position #{estimatedPosition}</strong>. When a table with capacity &ge; {guestCount} seats becomes available, the system will automatically recommend seating this party.
            </div>
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
              disabled={isProcessing}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <Plus size={16} />
              <span>{isProcessing ? 'Adding...' : 'Add to Waiting Queue'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToQueueModal;
