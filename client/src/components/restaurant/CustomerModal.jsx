import React, { useState, useEffect } from 'react';
import { X, User, Phone, Mail, FileText, CheckCircle2, AlertCircle, Award } from 'lucide-react';

const CustomerModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialCustomer = null,
  isProcessing = false,
  currency = 'INR',
}) => {
  const isEditing = Boolean(initialCustomer);
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [visitCount, setVisitCount] = useState(1);
  const [totalSpent, setTotalSpent] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCustomer) {
      setName(initialCustomer.name || '');
      setPhone(initialCustomer.phone || '');
      setEmail(initialCustomer.email || '');
      setNotes(initialCustomer.notes || '');
      setVisitCount(initialCustomer.visitCount || 1);
      setTotalSpent(initialCustomer.totalSpent || 0);
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      setVisitCount(1);
      setTotalSpent(0);
    }
    setError('');
  }, [initialCustomer, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide the customer name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide a phone number for profile identification.');
      return;
    }

    setError('');
    onSubmit({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      notes: notes.trim() || undefined,
      visitCount: isEditing ? parseInt(visitCount, 10) : undefined,
      totalSpent: isEditing ? parseFloat(totalSpent) : undefined,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-success)',
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                {isEditing ? 'Edit Customer Profile' : 'Add New Customer Profile'}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Reusable guest records across orders, waitlists, and bookings
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

        {/* Content */}
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

          {/* Name & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <User size={13} /> Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Priya Sharma"
                className="input-field"
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <Phone size={13} /> Phone Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="input-field"
                style={{ width: '100%', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <Mail size={13} /> Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="priya@example.com"
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* Special Notes / Preferences */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
              <FileText size={13} /> Dining Preferences & Notes
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Vegetarian, nut allergy, prefers corner booths"
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem' }}
            />
          </div>

          {/* Edit Stats if editing */}
          {isEditing && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', background: 'rgba(0, 0, 0, 0.25)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                  Total Visits
                </label>
                <input
                  type="number"
                  min="0"
                  value={visitCount}
                  onChange={(e) => setVisitCount(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.25rem' }}>
                  Total Spent ({currencySymbol})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={totalSpent}
                  onChange={(e) => setTotalSpent(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
            </div>
          )}

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
              <CheckCircle2 size={16} />
              <span>{isProcessing ? 'Saving...' : isEditing ? 'Save Profile' : 'Register Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerModal;
