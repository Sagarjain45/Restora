import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';

const PRESET_CATEGORIES = [
  'Starters',
  'Main Course',
  'Rice & Biryani',
  'Breads',
  'Beverages',
  'Desserts',
  'Snacks',
  'Soups & Salads',
];

const MenuItemModal = ({
  isOpen,
  onClose,
  onSubmit,
  item = null,
  isSaving = false,
  availableCategories = [],
  currency = 'INR',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Main Course',
    price: '',
    preparationTime: 15,
    isVegetarian: true,
    isAvailable: true,
    image: '',
  });
  const [error, setError] = useState('');

  const combinedCategories = Array.from(
    new Set([...PRESET_CATEGORIES, ...availableCategories])
  );

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        description: item.description || '',
        category: item.category || 'Main Course',
        price: item.price !== undefined ? item.price : '',
        preparationTime: item.preparationTime || 15,
        isVegetarian: item.isVegetarian !== undefined ? item.isVegetarian : true,
        isAvailable: item.isAvailable !== undefined ? item.isAvailable : true,
        image: item.image || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        category: 'Main Course',
        price: '',
        preparationTime: 15,
        isVegetarian: true,
        isAvailable: true,
        image: '',
      });
    }
    setError('');
  }, [item, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!formData.category.trim()) {
      setError('Item category is required');
      return;
    }
    const parsedPrice = parseFloat(formData.price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setError('Please provide a valid price (0 or greater)');
      return;
    }
    const parsedPrep = parseInt(formData.preparationTime, 10);
    if (isNaN(parsedPrep) || parsedPrep < 1) {
      setError('Preparation time must be at least 1 minute');
      return;
    }

    setError('');
    onSubmit({
      ...formData,
      price: parsedPrice,
      preparationTime: parsedPrep,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
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
          maxWidth: '560px',
          padding: '2rem',
          position: 'relative',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0, color: 'var(--text-main)', fontWeight: 700 }}>
              {item ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Configure dish details, category, pricing, and dietary labels
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              color: 'var(--text-muted)',
              borderRadius: '8px',
              padding: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
            }}
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-sm)',
              color: '#dc2626',
              fontSize: '0.85rem',
              marginBottom: '1.25rem',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Dish Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Dish / Item Name <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Butter Chicken, Paneer Tikka, Garlic Naan"
              required
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Category & Price */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Category <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <input
                type="text"
                list="category-suggestions"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Main Course"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
              <datalist id="category-suggestions">
                {combinedCategories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Price ({currency}) <span style={{ color: 'var(--accent-danger)' }}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
              Description & Ingredients
            </label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. Tender chicken simmered in a mildly spiced buttery tomato curry..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: '#ffffff',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Prep time & Image URL */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Prep Time (min)
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={formData.preparationTime}
                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Image URL (optional)
              </label>
              <input
                type="text"
                value={formData.image}
                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                placeholder="https://example.com/dish.jpg"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: '#ffffff',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* Dietary & Availability Flags */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
              padding: '1rem',
              background: '#f8fafc',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="isVegCheckbox"
                checked={formData.isVegetarian}
                onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="isVegCheckbox" style={{ fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-main)' }}>
                <strong>Vegetarian</strong> (Green icon)
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="isAvailCheckbox"
                checked={formData.isAvailable}
                onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="isAvailCheckbox" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                <strong>Available Now</strong> (In Stock)
              </label>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
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
              {isSaving ? 'Saving...' : item ? 'Update Item' : 'Add to Menu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MenuItemModal;
