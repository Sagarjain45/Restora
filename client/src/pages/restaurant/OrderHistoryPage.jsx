import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  History,
  Search,
  Filter,
  Calendar,
  CreditCard,
  DollarSign,
  Utensils,
  Receipt,
  Eye,
  RefreshCw,
  Clock,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  X,
} from 'lucide-react';
import { getOrderHistoryApi } from '../../services/reportService';
import { getTablesApi } from '../../services/tableService';
import OrderDetailsModal from '../../components/restaurant/OrderDetailsModal';

const OrderHistoryPage = () => {
  const { token, restaurant } = useAuth();
  const currency = restaurant?.settings?.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  // State
  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [datePreset, setDatePreset] = useState('30days'); // 'today' | 'yesterday' | '7days' | '30days' | 'custom' | 'all'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTable, setSelectedTable] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Fetch restaurant tables for filter dropdown
  useEffect(() => {
    if (!token) return;
    getTablesApi(token)
      .then((res) => setTables(res.data || []))
      .catch((err) => console.warn('Could not load tables for filtering:', err.message));
  }, [token]);

  // 2. Fetch order history
  const loadOrderHistory = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getOrderHistoryApi(token, {
        search: searchQuery.trim() || undefined,
        datePreset: datePreset !== 'all' ? datePreset : undefined,
        startDate: datePreset === 'custom' && startDate ? startDate : undefined,
        endDate: datePreset === 'custom' && endDate ? endDate : undefined,
        tableId: selectedTable !== 'ALL' ? selectedTable : undefined,
        status: statusFilter,
        paymentStatus: paymentStatusFilter,
        paymentMethod: paymentMethodFilter,
        page,
        limit: 25,
      });

      setOrders(res.data || []);
      setSummary(res.summary || null);
      setPagination(res.pagination || { total: 0, page: 1, limit: 25, totalPages: 1 });
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to load order history.' });
    } finally {
      setLoading(false);
    }
  }, [
    token,
    searchQuery,
    datePreset,
    startDate,
    endDate,
    selectedTable,
    statusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    page,
  ]);

  useEffect(() => {
    loadOrderHistory();
  }, [loadOrderHistory]);

  const resetFilters = () => {
    setSearchQuery('');
    setDatePreset('30days');
    setStartDate('');
    setEndDate('');
    setSelectedTable('ALL');
    setStatusFilter('ALL');
    setPaymentStatusFilter('ALL');
    setPaymentMethodFilter('ALL');
    setPage(1);
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <History size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                Order History
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Search, filter, and inspect past dining orders, bills, and settlement records.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadOrderHistory}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem' }}
          title="Refresh History"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Notice Alert */}
      {notice && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filtered Metrics Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Matched Orders
          </p>
          <h3 style={{ fontSize: '1.65rem', fontWeight: '700', color: 'var(--text-main)', margin: '0.25rem 0 0 0' }}>
            {summary?.totalOrders ?? pagination.total}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>In selected filter range</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Gross Sales
          </p>
          <h3 style={{ fontSize: '1.65rem', fontWeight: '700', color: '#4ade80', margin: '0.25rem 0 0 0' }}>
            {currencySymbol}{(summary?.totalSales || 0).toLocaleString()}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Excludes cancelled orders</span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Settlement Status
          </p>
          <h3 style={{ fontSize: '1.65rem', fontWeight: '700', color: '#818cf8', margin: '0.25rem 0 0 0' }}>
            {summary?.paidCount ?? 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>Paid</span>
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {(summary?.cancelledCount ?? 0)} cancelled
          </span>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderRadius: '12px', background: 'rgba(15, 23, 42, 0.6)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Average Order Value
          </p>
          <h3 style={{ fontSize: '1.65rem', fontWeight: '700', color: '#fbbf24', margin: '0.25rem 0 0 0' }}>
            {currencySymbol}{(summary?.aov || 0).toLocaleString()}
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Per fulfilled order</span>
        </div>
      </div>

      {/* Multi-Criteria Filters Panel */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          borderRadius: '14px',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Top Filter Row: Search & Date Preset Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          {/* Search bar */}
          <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by order #, notes, or item name..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Date Presets */}
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '0.25rem', flexWrap: 'wrap', gap: '0.2rem' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom' },
              { id: 'all', label: 'All Time' },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setDatePreset(preset.id);
                  setPage(1);
                }}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: datePreset === preset.id ? 'var(--primary)' : 'transparent',
                  color: datePreset === preset.id ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Date Range Row (visible if 'custom' is selected) */}
        {datePreset === 'custom' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', background: 'rgba(0, 0, 0, 0.2)', padding: '0.75rem', borderRadius: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Calendar size={14} /> Custom Date Bounds:
            </span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.45rem 0.65rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
              }}
            />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              style={{
                padding: '0.45rem 0.65rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '6px',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
              }}
            />
          </div>
        )}

        {/* Dropdowns Row: Table, Order Status, Payment Status, Payment Method */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.75rem' }}>
          {/* Table Selector */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Dining Table
            </label>
            <select
              value={selectedTable}
              onChange={(e) => {
                setSelectedTable(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.65rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
              }}
            >
              <option value="ALL">All Tables</option>
              {tables.map((t) => (
                <option key={t._id} value={t._id}>
                  Table {t.tableNumber} {t.section ? `(${t.section})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Order Status */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Order Lifecycle Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.65rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
              }}
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
              <option value="SERVED">Served</option>
              <option value="READY">Ready</option>
              <option value="PREPARING">Preparing</option>
              <option value="PLACED">Placed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Settlement Status
            </label>
            <select
              value={paymentStatusFilter}
              onChange={(e) => {
                setPaymentStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.65rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
              }}
            >
              <option value="ALL">All Payment States</option>
              <option value="PAID">Paid / Settled</option>
              <option value="PENDING">Pending Payment</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
              Payment Method
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => {
                setPaymentMethodFilter(e.target.value);
                setPage(1);
              }}
              style={{
                width: '100%',
                padding: '0.5rem 0.65rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.8rem',
              }}
            >
              <option value="ALL">All Payment Methods</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Link */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={resetFilters}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Querying order history...</p>
        </div>
      ) : orders.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          <History size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
            No Orders Found
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            No past orders match the specified date range and filters. Try widening your criteria.
          </p>
          <button onClick={resetFilters} className="btn btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
            Clear Filters
          </button>
        </div>
      ) : (
        <div
          className="glass-panel"
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Order #</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Date & Time</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Table & Guest</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Items Preview</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Payment</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Total</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const isPaid = order.paymentStatus === 'PAID';
                  const isCancelled = order.status === 'CANCELLED';

                  return (
                    <tr
                      key={order._id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'rgba(15, 23, 42, 0.4)',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                          {order.orderNumber || `#${order._id.slice(-6).toUpperCase()}`}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontWeight: '600', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {order.tableId?.tableNumber ? `Table ${order.tableId.tableNumber}` : 'Direct'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.customerId?.name || 'Walk-in'}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '220px' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {order.items && order.items.length > 0
                            ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')
                            : 'No items'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {order.items?.length || 0} distinct items
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          className={`badge ${
                            order.status === 'COMPLETED'
                              ? 'badge-success'
                              : isCancelled
                              ? 'badge-danger'
                              : 'badge-indigo'
                          }`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {order.status}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              color: isPaid ? '#4ade80' : isCancelled ? '#f87171' : '#fbbf24',
                            }}
                          >
                            {isPaid ? 'PAID' : isCancelled ? 'CANCELLED' : 'PENDING'}
                          </span>
                          {order.bill?.paymentMethod && (
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '0.1rem 0.35rem',
                                borderRadius: '4px',
                                background: 'rgba(99, 102, 241, 0.15)',
                                color: '#818cf8',
                                fontWeight: '600',
                              }}
                            >
                              {order.bill.paymentMethod}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: '700', fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        {currencySymbol}{(order.total || 0).toLocaleString()}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setIsModalOpen(true);
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '6px',
                            padding: '0.4rem 0.65rem',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                          }}
                        >
                          <Eye size={13} />
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div
              style={{
                padding: '0.85rem 1.25rem',
                borderTop: '1px solid var(--border-subtle)',
                background: 'rgba(15, 23, 42, 0.6)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total orders)
              </span>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    color: pagination.page <= 1 ? 'rgba(255, 255, 255, 0.2)' : 'var(--text-main)',
                    cursor: pagination.page <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.8rem',
                  }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '6px',
                    padding: '0.35rem 0.75rem',
                    color: pagination.page >= pagination.totalPages ? 'rgba(255, 255, 255, 0.2)' : 'var(--text-main)',
                    cursor: pagination.page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontSize: '0.8rem',
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        currency={currency}
      />
    </div>
  );
};

export default OrderHistoryPage;
