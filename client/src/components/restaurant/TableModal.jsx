import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const COMMON_SECTIONS = [
  'Main Dining',
  'Outdoor Patio',
  'Rooftop Terrace',
  'VIP Lounge',
  'Bar Area',
  'Private Room',
];

const TABLE_STATUSES = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'RESERVED', label: 'Reserved' },
  { value: 'BILLING', label: 'Billing' },
  { value: 'OUT_OF_SERVICE', label: 'Out of Service' },
];

const TableModal = ({
  isOpen,
  onClose,
  onSubmit,
  table = null,
  isSaving = false,
}) => {
  const [formData, setFormData] = useState({
    tableNumber: '',
    capacity: 4,
    section: 'Main Dining',
    status: 'AVAILABLE',
    isActive: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (table) {
      setFormData({
        tableNumber: table.tableNumber || '',
        capacity: table.capacity || 4,
        section: table.section || 'Main Dining',
        status: table.status || 'AVAILABLE',
        isActive: table.isActive !== false,
      });
    } else {
      setFormData({
        tableNumber: '',
        capacity: 4,
        section: 'Main Dining',
        status: 'AVAILABLE',
        isActive: true,
      });
    }
    setError('');
  }, [table, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.tableNumber.trim()) {
      setError('Table number or label is required (e.g. Table 01)');
      return;
    }
    if (formData.capacity < 1) {
      setError('Capacity must be at least 1 person');
      return;
    }
    setError('');
    onSubmit(formData);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
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
          padding: '2rem',
          position: 'relative',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-highlight)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
              {table ? 'Edit Restaurant Table' : 'Add New Table'}
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Configure seating capacity and floor location for this table
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--text-muted)', padding: '0.4rem' }}
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Table Number or Label <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.tableNumber}
              onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
              placeholder="e.g. Table 01, VIP-02"
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Capacity (Seats) <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 1 })}
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: 'rgba(0, 0, 0, 0.3)',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
                Initial Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: '#0f172a',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              >
                {TABLE_STATUSES.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Floor Section / Area
            </label>
            <input
              type="text"
              list="section-options"
              value={formData.section}
              onChange={(e) => setFormData({ ...formData, section: e.target.value })}
              placeholder="e.g. Main Dining, Patio"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
              }}
            />
            <datalist id="section-options">
              {COMMON_SECTIONS.map((sec) => (
                <option key={sec} value={sec} />
              ))}
            </datalist>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="isActiveCheck" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
              Table is active and available for customer dining operations
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn-secondary"
              style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary"
              style={{ padding: '0.6rem 1.4rem', fontSize: '0.85rem' }}
            >
              <Save size={15} />
              {isSaving ? 'Saving...' : table ? 'Save Changes' : 'Create Table'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TableModal;
