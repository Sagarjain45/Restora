import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';

const AddItemToOrderModal = ({
  isOpen,
  onClose,
  onSubmit,
  order = null,
  menuItems = [],
  isSaving = false,
  currency = 'INR',
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;
  const [selectedMenuItemId, setSelectedMenuItemId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const availableItems = menuItems.filter((m) => m.isAvailable && m.isActive !== false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedMenuItemId) {
      setError('Please choose a dish to add');
      return;
    }
    if (quantity < 1) {
      setError('Quantity must be at least 1');
      return;
    }

    setError('');
    onSubmit({
      menuItemId: selectedMenuItemId,
      quantity,
      notes,
    });
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
          maxWidth: '480px',
          padding: '2rem',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-highlight)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', margin: 0 }}>
              Add Dish to {order.orderNumber || 'Order'}
            </h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Table: <strong>{order.tableId?.tableNumber || 'Assigned Table'}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#fca5a5',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Select Available Dish
            </label>
            <select
              value={selectedMenuItemId}
              onChange={(e) => setSelectedMenuItemId(e.target.value)}
              required
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
              <option value="">-- Choose Menu Item --</option>
              {availableItems.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name} ({currencySymbol}{item.price.toFixed(2)}) - {item.category}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Quantity
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
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
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Instructions (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. extra sauce, spicy"
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
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="btn-secondary"
              style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !selectedMenuItemId}
              className="btn-primary"
              style={{ padding: '0.55rem 1.3rem', fontSize: '0.85rem' }}
            >
              <Plus size={14} />
              {isSaving ? 'Adding...' : 'Add to Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemToOrderModal;
