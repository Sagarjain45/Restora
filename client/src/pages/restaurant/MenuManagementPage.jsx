import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  Plus,
  RefreshCw,
  Search,
  BookOpen,
  CheckCircle2,
  XCircle,
  Leaf,
  Beef,
  X
} from 'lucide-react';
import MenuItemCard from '../../components/restaurant/MenuItemCard';
import MenuItemModal from '../../components/restaurant/MenuItemModal';
import {
  getMenuItemsApi,
  createMenuItemApi,
  updateMenuItemApi,
  toggleMenuItemAvailabilityApi,
  deleteMenuItemApi,
} from '../../services/menuService';

const DIETARY_OPTIONS = [
  { id: 'ALL', label: 'All Dietary' },
  { id: 'true', label: 'Vegetarian Only' },
  { id: 'false', label: 'Non-Vegetarian Only' },
];

const AVAILABILITY_OPTIONS = [
  { id: 'ALL', label: 'All Stock' },
  { id: 'true', label: 'In Stock' },
  { id: 'false', label: 'Sold Out' },
];

const MenuManagementPage = () => {
  const { user, token } = useAuth();
  const isOwner = user?.role === 'RESTAURANT_OWNER';

  // Data State
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [dietaryFilter, setDietaryFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Load Menu Items
  const loadMenu = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getMenuItemsApi(token, {
        category: selectedCategory,
        isVegetarian: dietaryFilter,
        isAvailable: availabilityFilter,
        search: searchQuery,
      });
      setItems(res.data || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to load restaurant menu' });
    } finally {
      setLoading(false);
    }
  }, [token, selectedCategory, dietaryFilter, availabilityFilter, searchQuery]);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Categories list for pills
  const categoriesList = useMemo(() => {
    const list = summary?.categories || [];
    return ['ALL', ...list];
  }, [summary]);

  // Handle Quick Availability Toggle
  const handleToggleAvailability = async (itemId, nextAvailable) => {
    setProcessingId(itemId);
    try {
      await toggleMenuItemAvailabilityApi(token, itemId, nextAvailable);
      setNotice({
        type: 'success',
        text: `Item availability marked as ${nextAvailable ? 'IN STOCK' : 'SOLD OUT'}.`,
      });
      await loadMenu();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to toggle item availability' });
    } finally {
      setProcessingId(null);
    }
  };

  // Open Modal to Create
  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  // Handle Modal Submit
  const handleModalSubmit = async (formData) => {
    setModalSaving(true);
    try {
      if (editingItem) {
        await updateMenuItemApi(token, editingItem._id, formData);
        setNotice({ type: 'success', text: `Menu item "${formData.name}" updated successfully!` });
      } else {
        await createMenuItemApi(token, formData);
        setNotice({ type: 'success', text: `Menu item "${formData.name}" added to menu catalog!` });
      }
      setIsModalOpen(false);
      await loadMenu();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to save menu item' });
    } finally {
      setModalSaving(false);
    }
  };

  // Handle Delete / Deactivate
  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to deactivate "${item.name}" from the menu?`)) {
      return;
    }
    setProcessingId(item._id);
    try {
      await deleteMenuItemApi(token, item._id, false);
      setNotice({ type: 'success', text: `"${item.name}" removed from active catalog.` });
      await loadMenu();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to remove menu item' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-success">Menu Catalog</span>
            <span className="badge badge-indigo">Phase 8</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Restaurant Menu Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Configure dishes, categories, pricing, dietary flags, and kitchen availability.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={loadMenu}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            Refresh Catalog
          </button>

          {isOwner && (
            <button
              onClick={handleOpenCreate}
              className="btn-primary"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              Add Menu Item
            </button>
          )}
        </div>
      </div>

      {/* Notice Alert */}
      {notice && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: notice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${notice.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.25rem',
            fontSize: '0.9rem',
            color: notice.type === 'error' ? '#fca5a5' : '#a7f3d0',
          }}
        >
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Metrics Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>TOTAL DISHES</span>
            <BookOpen size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{summary?.total ?? items.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Catalogued items
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>IN STOCK</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
            {summary?.availableCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Ready to order
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #94a3b8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>SOLD OUT</span>
            <XCircle size={16} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#94a3b8' }}>
            {summary?.unavailableCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Unavailable in kitchen
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>VEGETARIAN</span>
            <Leaf size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
            {summary?.vegCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Veg options
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #ef4444' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>NON-VEG</span>
            <Beef size={16} color="#ef4444" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444' }}>
            {summary?.nonVegCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Non-veg items
          </div>
        </div>
      </div>

      {/* Filter and Search Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Category Navigation Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginRight: '0.25rem' }}>
            CATEGORY:
          </span>
          {categoriesList.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                {cat === 'ALL' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Search, Dietary, Availability */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Keyword Search */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dish or ingredients..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.25)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Dietary Filter */}
          <div>
            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: '#0f172a',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            >
              {DIETARY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: '#0f172a',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="spin-anim" style={{ margin: '0 auto 1rem' }} />
          <p>Loading restaurant menu items...</p>
        </div>
      ) : items.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <BookOpen size={48} color="var(--text-dim)" />
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>No dishes found matching your filters</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', fontSize: '0.9rem', margin: 0 }}>
            {isOwner
              ? 'Get started by creating delicious menu items, categories, and prices for your restaurant.'
              : 'There are currently no menu items matching the selected filters.'}
          </p>
          {isOwner && (
            <button
              onClick={handleOpenCreate}
              className="btn-primary"
              style={{ marginTop: '0.5rem', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} /> Add First Menu Item
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {items.map((item) => (
            <MenuItemCard
              key={item._id}
              item={item}
              isOwner={isOwner}
              onToggleAvailability={handleToggleAvailability}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteItem}
              isProcessing={processingId === item._id}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      <MenuItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        item={editingItem}
        isSaving={modalSaving}
        availableCategories={summary?.categories || []}
      />
    </div>
  );
};

export default MenuManagementPage;
