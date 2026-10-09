import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Plus,
  RefreshCw,
  Search,
  ShoppingCart,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  X,
  ChefHat,
  BellRing
} from 'lucide-react';
import OrderCard from '../../components/restaurant/OrderCard';
import CreateOrderModal from '../../components/restaurant/CreateOrderModal';
import AddItemToOrderModal from '../../components/restaurant/AddItemToOrderModal';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonGrid } from '../../components/common/LoadingState';
import useToast from '../../hooks/useToast';
import {
  getOrdersApi,
  createOrderApi,
  updateOrderStatusApi,
  updateOrderItemApi,
  removeOrderItemApi,
  addItemToOrderApi,
} from '../../services/orderService';
import { getTablesApi } from '../../services/tableService';
import { getMenuItemsApi } from '../../services/menuService';

const STATUS_TABS = [
  { id: 'ACTIVE', label: 'Active Orders', activeOnly: true },
  { id: 'ALL', label: 'All Orders' },
  { id: 'PLACED', label: 'Placed / New' },
  { id: 'PREPARING', label: 'Preparing (Kitchen)' },
  { id: 'READY', label: 'Ready for Service' },
  { id: 'SERVED', label: 'Served' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const OrderManagementPage = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Data State
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Filter State
  const [selectedTab, setSelectedTab] = useState('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [activeOrderForAdd, setActiveOrderForAdd] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);

  // Load Auxiliary Data (Tables & Menu Items)
  const loadPrerequisites = useCallback(async () => {
    if (!token) return;
    try {
      const [tableRes, menuRes] = await Promise.all([
        getTablesApi(token, { isActive: true }).catch(() => ({ data: [] })),
        getMenuItemsApi(token, { isActive: true }).catch(() => ({ data: [] })),
      ]);
      setTables(tableRes.data || []);
      setMenuItems(menuRes.data || []);
    } catch (err) {
      console.warn('Prerequisites load warning:', err.message);
    }
  }, [token]);

  // Load Orders
  const loadOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = {
        search: searchQuery,
      };

      if (selectedTab === 'ACTIVE') {
        params.activeOnly = true;
      } else if (selectedTab !== 'ALL') {
        params.status = selectedTab;
      }

      const res = await getOrdersApi(token, params);
      setOrders(res.data || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to retrieve orders' });
    } finally {
      setLoading(false);
    }
  }, [token, selectedTab, searchQuery]);

  useEffect(() => {
    loadPrerequisites();
  }, [loadPrerequisites]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle Order Status Update
  const handleUpdateStatus = async (orderId, nextStatus) => {
    setProcessingId(orderId);
    try {
      await updateOrderStatusApi(token, orderId, nextStatus);
      setNotice({
        type: 'success',
        text: `Order status transitioned to ${nextStatus}`,
      });
      await loadOrders();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to update order status' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Item Quantity Adjustment
  const handleUpdateItemQuantity = async (orderId, itemId, newQty) => {
    setProcessingId(orderId);
    try {
      if (newQty <= 0) {
        await removeOrderItemApi(token, orderId, itemId);
        setNotice({ type: 'success', text: 'Item removed from order.' });
      } else {
        await updateOrderItemApi(token, orderId, itemId, { quantity: newQty });
      }
      await loadOrders();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to update item quantity' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Remove Item
  const handleRemoveItem = async (orderId, itemId) => {
    setProcessingId(orderId);
    try {
      await removeOrderItemApi(token, orderId, itemId);
      setNotice({ type: 'success', text: 'Item removed from order.' });
      await loadOrders();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to remove item' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Create Order Submit
  const handleCreateOrderSubmit = async (formData) => {
    setModalSaving(true);
    try {
      const created = await createOrderApi(token, formData);
      setNotice({
        type: 'success',
        text: `Order ${created.orderNumber} successfully sent to kitchen floor!`,
      });
      setIsCreateModalOpen(false);
      await loadOrders();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to place order' });
    } finally {
      setModalSaving(false);
    }
  };

  // Handle Add Item to Active Order Submit
  const handleAddItemSubmit = async (itemData) => {
    if (!activeOrderForAdd) return;
    setModalSaving(true);
    try {
      await addItemToOrderApi(token, activeOrderForAdd._id, itemData);
      setNotice({ type: 'success', text: 'Dish added to order ticket.' });
      setIsAddItemModalOpen(false);
      setActiveOrderForAdd(null);
      await loadOrders();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to add dish' });
    } finally {
      setModalSaving(false);
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
            <span className="badge badge-cyan">Kitchen & Floor</span>
            <span className="badge badge-indigo">Live Orders</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Table-Based Order Management</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Live table orders, kitchen ticket preparation, dish modifications, and status tracking.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            Refresh Orders
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="btn-primary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            New Table Order
          </button>
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

      {/* Summary Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>ACTIVE ORDERS</span>
            <ChefHat size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{summary?.activeCount ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            In preparation / served
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>TODAY'S ORDERS</span>
            <ShoppingCart size={16} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#06b6d4' }}>
            {summary?.todayCount ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Tickets placed today
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>TODAY'S SALES</span>
            <Receipt size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
            ₹{(summary?.todaySales ?? 0).toFixed(2)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Gross order volume
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>ALL-TIME ORDERS</span>
            <CheckCircle2 size={16} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{summary?.total ?? 0}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Lifetime recorded
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {STATUS_TABS.map((tab) => {
            const isActive = selectedTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedTab(tab.id)}
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
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: '380px' }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order number or dish name..."
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
      </div>

      {/* Orders Grid */}
      {loading ? (
        <SkeletonGrid count={6} height="220px" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders found"
          description={
            selectedTab === 'ACTIVE'
              ? "There are currently no active orders on the floor. Take an order by selecting a table."
              : "No orders match the selected filter criteria."
          }
          actionText="Place First Order"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {orders.map((ord) => (
            <OrderCard
              key={ord._id}
              order={ord}
              onUpdateStatus={handleUpdateStatus}
              onUpdateItemQuantity={handleUpdateItemQuantity}
              onRemoveItem={handleRemoveItem}
              onOpenAddItem={(orderToEdit) => {
                setActiveOrderForAdd(orderToEdit);
                setIsAddItemModalOpen(true);
              }}
              onGenerateBill={() => navigate('/restaurant/billing')}
              isProcessing={processingId === ord._id}
            />
          ))}
        </div>
      )}

      {/* Modal 1: Place New Order */}
      <CreateOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrderSubmit}
        tables={tables}
        menuItems={menuItems}
        isSaving={modalSaving}
      />

      {/* Modal 2: Add Dish to Active Order */}
      <AddItemToOrderModal
        isOpen={isAddItemModalOpen}
        onClose={() => {
          setIsAddItemModalOpen(false);
          setActiveOrderForAdd(null);
        }}
        onSubmit={handleAddItemSubmit}
        order={activeOrderForAdd}
        menuItems={menuItems}
        isSaving={modalSaving}
      />
    </div>
  );
};

export default OrderManagementPage;
