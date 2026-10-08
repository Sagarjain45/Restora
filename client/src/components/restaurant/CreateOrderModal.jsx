import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingCart, AlertCircle } from 'lucide-react';

const CreateOrderModal = ({
  isOpen,
  onClose,
  onSubmit,
  tables = [],
  menuItems = [],
  isSaving = false,
  currency = 'INR',
  taxRate = 5,
  defaultTableId = null,
}) => {
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  const [selectedTableId, setSelectedTableId] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [discount, setDiscount] = useState(0);
  const [error, setError] = useState('');

  // Menu search/category filter inside modal
  const [itemCategory, setItemCategory] = useState('ALL');
  const [itemSearch, setItemSearch] = useState('');

  // Extract distinct categories from menuItems
  const categories = ['ALL', ...Array.from(new Set(menuItems.map((m) => m.category))).filter(Boolean)];

  useEffect(() => {
    if (isOpen) {
      setSelectedTableId(defaultTableId || (tables.length > 0 ? tables[0]._id : ''));
      setSelectedItems([]);
      setOrderNotes('');
      setDiscount(0);
      setError('');
    }
  }, [isOpen, defaultTableId, tables]);

  if (!isOpen) return null;

  // Filter available menu items
  const filteredMenuItems = menuItems.filter((item) => {
    if (!item.isAvailable || item.isActive === false) return false;
    if (itemCategory !== 'ALL' && item.category !== itemCategory) return false;
    if (itemSearch && !item.name.toLowerCase().includes(itemSearch.toLowerCase())) return false;
    return true;
  });

  // Add item to cart
  const handleAddItem = (menuItem) => {
    const existingIndex = selectedItems.findIndex((i) => i.menuItemId === menuItem._id);
    if (existingIndex > -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += 1;
      setSelectedItems(updated);
    } else {
      setSelectedItems([
        ...selectedItems,
        {
          menuItemId: menuItem._id,
          name: menuItem.name,
          price: menuItem.price,
          quantity: 1,
          notes: '',
        },
      ]);
    }
  };

  // Change quantity
  const handleUpdateQty = (index, delta) => {
    const updated = [...selectedItems];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].quantity = newQty;
    }
    setSelectedItems(updated);
  };

  // Update item note
  const handleUpdateItemNote = (index, note) => {
    const updated = [...selectedItems];
    updated[index].notes = note;
    setSelectedItems(updated);
  };

  // Financial calculations
  const subtotal = selectedItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const cleanDiscount = Math.min(Math.max(parseFloat(discount) || 0, 0), subtotal);
  const taxable = Math.max(0, subtotal - cleanDiscount);
  const tax = Math.round(taxable * (taxRate / 100) * 100) / 100;
  const total = Math.round((taxable + tax) * 100) / 100;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTableId) {
      setError('Please select a restaurant table for this order');
      return;
    }
    if (selectedItems.length === 0) {
      setError('Please add at least one dish to the order');
      return;
    }

    setError('');
    onSubmit({
      tableId: selectedTableId,
      items: selectedItems,
      notes: orderNotes,
      discount: cleanDiscount,
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.78)',
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
          maxWidth: '920px',
          padding: '2rem',
          position: 'relative',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-highlight)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Create Table Order</h2>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.2rem' }}>
              Select dining table, add available menu items, and send order to kitchen
            </p>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: '0.4rem' }}>
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
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Table Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Select Table <span style={{ color: 'var(--accent-danger)' }}>*</span>
            </label>
            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
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
              <option value="">-- Choose Dining Table --</option>
              {tables.map((tbl) => (
                <option key={tbl._id} value={tbl._id}>
                  {tbl.tableNumber} ({tbl.capacity} Seats) - {tbl.section || 'Main Dining'} [{tbl.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Two-Column Layout: Menu Picker on Left, Order Ticket on Right */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', minHeight: '340px' }}>
            {/* Left: Available Menu Items Catalog */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Menu Catalog (In Stock Only)
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {filteredMenuItems.length} available
                </span>
              </div>

              {/* Category Pills & Search */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Search dish..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.45rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#fff',
                    fontSize: '0.8rem',
                  }}
                />

                <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem', width: '100%' }}>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setItemCategory(cat)}
                      style={{
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        borderRadius: '9999px',
                        background: itemCategory === cat ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                        color: itemCategory === cat ? '#fff' : 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Items List */}
              <div style={{ flex: 1, overflowY: 'auto', maxHeight: '240px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredMenuItems.map((item) => (
                  <div
                    key={item._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem 0.75rem',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {currencySymbol}{item.price.toFixed(2)} • {item.isVegetarian ? '🌱 Veg' : '🍗 Non-Veg'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddItem(item)}
                      className="btn-primary"
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }}
                    >
                      <Plus size={12} /> Add
                    </button>
                  </div>
                ))}

                {filteredMenuItems.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', padding: '2rem 0' }}>
                    No available dishes found.
                  </div>
                )}
              </div>
            </div>

            {/* Right: Selected Order Items Ticket */}
            <div
              style={{
                background: 'rgba(0, 0, 0, 0.25)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <ShoppingCart size={16} color="var(--accent-primary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Current Order ({selectedItems.length} items)
                  </span>
                </div>

                <div style={{ overflowY: 'auto', maxHeight: '180px', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {selectedItems.map((item, idx) => (
                    <div
                      key={item.menuItemId}
                      style={{
                        padding: '0.5rem',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</span>
                        <span style={{ fontWeight: 700, color: 'var(--text-muted)' }}>
                          {currencySymbol}{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, -1)}
                            style={{ padding: '0.2rem', color: 'var(--text-dim)' }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(idx, 1)}
                            style={{ padding: '0.2rem', color: 'var(--text-dim)' }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <input
                          type="text"
                          placeholder="Dish instructions (e.g. less salt)..."
                          value={item.notes}
                          onChange={(e) => handleUpdateItemNote(idx, e.target.value)}
                          style={{
                            padding: '0.2rem 0.4rem',
                            fontSize: '0.7rem',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid var(--border-subtle)',
                            color: '#fff',
                            borderRadius: '3px',
                            width: '160px',
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  {selectedItems.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.8rem', padding: '1.5rem 0' }}>
                      Click "Add" on any dish to populate this table ticket.
                    </div>
                  )}
                </div>
              </div>

              {/* Order Calculations */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Subtotal:</span>
                  <span>{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  <span>Tax ({taxRate}%):</span>
                  <span>{currencySymbol}{tax.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.4rem' }}>
                  <span>Estimated Total:</span>
                  <span>{currencySymbol}{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Table & Order Special Instructions
            </label>
            <input
              type="text"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g. VIP guests, prompt service requested, serving dessert after mains"
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.3)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
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
              disabled={isSaving || selectedItems.length === 0}
              className="btn-primary"
              style={{ padding: '0.6rem 1.5rem', fontSize: '0.85rem' }}
            >
              <ShoppingCart size={15} />
              {isSaving ? 'Placing Order...' : 'Place Order'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrderModal;
