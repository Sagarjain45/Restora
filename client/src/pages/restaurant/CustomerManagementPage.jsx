import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Award,
  DollarSign,
  TrendingUp,
  Filter,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
  X,
  History,
  Calendar,
  Utensils,
  Clock,
  Phone,
  Mail,
} from 'lucide-react';
import {
  getCustomersApi,
  getCustomerSummaryApi,
  getCustomerByIdApi,
  createCustomerApi,
  updateCustomerApi,
} from '../../services/customerService';
import CustomerCard from '../../components/restaurant/CustomerCard';
import CustomerModal from '../../components/restaurant/CustomerModal';

const CustomerManagementPage = () => {
  const { token, restaurant } = useAuth();
  const currency = restaurant?.settings?.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  // Data State
  const [customers, setCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  // Filters & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'FREQUENT' | 'VIP'
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'visits' | 'spent' | 'name'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [historyCustomer, setHistoryCustomer] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 1. Load Customers & Summary
  const loadCustomersData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        getCustomersApi(token, {
          search: searchQuery.trim() || undefined,
          filter: filterType,
          sortBy,
        }).catch((err) => {
          console.warn('Customer list warning:', err.message);
          return { data: [] };
        }),
        getCustomerSummaryApi(token).catch((err) => {
          console.warn('Summary warning:', err.message);
          return null;
        }),
      ]);

      setCustomers(listRes.data || []);
      if (sumRes) setSummary(sumRes);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to load customer directory.' });
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, filterType, sortBy]);

  useEffect(() => {
    loadCustomersData();
  }, [loadCustomersData]);

  // Handle Create / Edit Customer
  const handleSaveCustomer = async (customerData) => {
    try {
      if (editingCustomer) {
        await updateCustomerApi(token, editingCustomer._id, customerData);
        setNotice({ type: 'success', message: 'Customer profile updated successfully.' });
      } else {
        const result = await createCustomerApi(token, customerData);
        setNotice({
          type: 'success',
          message: result.isExisting
            ? `Existing profile recognized for ${result.data.name} and updated!`
            : `New customer profile registered for ${result.data.name}!`,
        });
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      await loadCustomersData();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to save customer profile.' });
    }
  };

  // Handle View History Modal
  const handleOpenHistory = async (customer) => {
    setHistoryCustomer(customer);
    setLoadingHistory(true);
    try {
      const fullProfile = await getCustomerByIdApi(token, customer._id);
      setHistoryData(fullProfile);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to load customer history.' });
    } finally {
      setLoadingHistory(false);
    }
  };

  const repeatPercent = summary?.totalCustomers
    ? Math.round((summary.repeatCustomers / summary.totalCustomers) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Users size={22} color="#ffffff" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Customer Directory & CRM</h1>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Reusable diner profiles, visit frequency tracking, lifetime spend, and history.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadCustomersData}
            disabled={loading}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Notice Alert */}
      {notice && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: notice.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${notice.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: notice.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {notice.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>TOTAL PROFILES</span>
            <Users size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {summary?.totalCustomers ?? customers.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Unique guest records registered
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>REPEAT PATRONS</span>
            <Award size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-success)' }}>
            {summary?.repeatCustomers ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-success)', marginTop: '0.2rem' }}>
            {repeatPercent}% retention rate (&gt;1 visit)
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>TOTAL LIFETIME SPEND</span>
            <DollarSign size={18} color="var(--accent-warning)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-warning)' }}>
            {currencySymbol}{(summary?.totalLifetimeRevenue ?? 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Accumulated patron value
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>AVG SPEND / GUEST</span>
            <TrendingUp size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {currencySymbol}{(summary?.avgSpendPerCustomer ?? 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Per registered diner average
          </div>
        </div>
      </div>

      {/* Filter and Search Navigation Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Status / Category Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> View:
          </span>
          {[
            { id: 'ALL', label: 'All Diners' },
            { id: 'FREQUENT', label: 'Frequent Diners (>1 visit)' },
            { id: 'VIP', label: 'VIP Guests (High Spend)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterType(tab.id)}
              className={filterType === tab.id ? 'btn-primary' : 'btn-secondary'}
              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: '20px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sort & Search Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input-field"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }}
          >
            <option value="recent">Sort: Most Recent Visit</option>
            <option value="visits">Sort: Most Visits</option>
            <option value="spent">Sort: Highest Spend</option>
            <option value="name">Sort: Alphabetical</option>
          </select>

          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
                border: 'none',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-dim)',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--accent-primary)' : 'transparent',
                border: 'none',
                color: viewMode === 'table' ? '#fff' : 'var(--text-dim)',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>

          <div style={{ position: 'relative', width: '250px', maxWidth: '100%' }}>
            <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or phone..."
              className="input-field"
              style={{ width: '100%', paddingLeft: '32px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Main Customers List */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
          <div>Loading customer records...</div>
        </div>
      ) : customers.length === 0 ? (
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
          <Users size={48} color="var(--text-dim)" />
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>No customer profiles found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', fontSize: '0.9rem', margin: 0 }}>
            {searchQuery
              ? `No customer profiles match "${searchQuery}".`
              : 'Add your first customer to enable quick lookups and repeat guest insights.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingCustomer(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
            style={{ marginTop: '0.5rem', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add First Customer
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
          {customers.map((c) => (
            <CustomerCard
              key={c._id}
              customer={c}
              currency={currency}
              onEdit={(cust) => {
                setEditingCustomer(cust);
                setIsModalOpen(true);
              }}
              onViewHistory={handleOpenHistory}
            />
          ))}
        </div>
      ) : (
        /* Detailed Table List View */
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>CUSTOMER NAME</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>PHONE & EMAIL</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>VISIT COUNT</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>TOTAL SPENT</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>LAST VISIT</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => {
                  return (
                    <tr
                      key={c._id}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{c.name}</strong>
                        {c.totalSpent >= 2000 && (
                          <span className="badge badge-warning" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
                            VIP
                          </span>
                        )}
                        {c.notes && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                            {c.notes}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ color: 'var(--text-muted)' }}>{c.phone}</div>
                        {c.email && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{c.email}</div>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="badge badge-indigo">
                          {c.visitCount} visits
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: 'var(--accent-success)' }}>
                        {currencySymbol}{Math.round(c.totalSpent || 0).toLocaleString('en-IN')}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-dim)' }}>
                        {c.lastVisit ? new Date(c.lastVisit).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            type="button"
                            onClick={() => handleOpenHistory(c)}
                            className="btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                          >
                            History
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(c);
                              setIsModalOpen(true);
                            }}
                            className="btn-secondary"
                            style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Create or Edit Customer */}
      {isModalOpen && (
        <CustomerModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingCustomer(null);
          }}
          onSubmit={handleSaveCustomer}
          initialCustomer={editingCustomer}
          currency={currency}
          isProcessing={loading}
        />
      )}

      {/* Modal 2: 360-degree Customer Activity History Modal */}
      {historyCustomer && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 65,
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
              maxWidth: '620px',
              maxHeight: '92vh',
              overflowY: 'auto',
              border: '1px solid var(--border-glow)',
              padding: '1.5rem',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <History size={20} color="var(--accent-primary)" />
                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Diner History: {historyCustomer.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHistoryCustomer(null);
                  setHistoryData(null);
                }}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {loadingHistory ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Loading activity history...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Stats quick overview */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', background: 'rgba(0, 0, 0, 0.3)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Phone</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{historyCustomer.phone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Total Visits</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>{historyCustomer.visitCount} visits</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Lifetime Spend</div>
                    <div style={{ fontWeight: 600, color: 'var(--accent-success)', fontSize: '0.85rem' }}>
                      {currencySymbol}{Math.round(historyCustomer.totalSpent || 0)}
                    </div>
                  </div>
                </div>

                {/* Section 1: Recent Orders */}
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Utensils size={15} color="var(--accent-primary)" /> Recent Table Orders
                  </h4>
                  {historyData?.recentOrders?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {historyData.recentOrders.map((ord) => (
                        <div
                          key={ord._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div>
                            <strong>{ord.orderNumber || 'ORD'}</strong> • Table {ord.tableId?.tableNumber || 'N/A'} ({ord.status})
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--accent-success)' }}>
                            {currencySymbol}{ord.totalAmount}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>No direct orders recorded yet.</div>
                  )}
                </div>

                {/* Section 2: Recent Reservations */}
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={15} color="var(--accent-indigo, #6366f1)" /> Table Reservations
                  </h4>
                  {historyData?.recentReservations?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {historyData.recentReservations.map((res) => (
                        <div
                          key={res._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div>
                            {res.date} at {res.startTime} • {res.guestCount} guests
                          </div>
                          <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
                            {res.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>No reservations on file.</div>
                  )}
                </div>

                {/* Section 3: Recent Queue Waitlists */}
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Clock size={15} color="var(--accent-warning)" /> Waiting Queue Entries
                  </h4>
                  {historyData?.recentQueueEntries?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {historyData.recentQueueEntries.map((q) => (
                        <div
                          key={q._id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '4px',
                            fontSize: '0.8rem',
                          }}
                        >
                          <div>
                            {new Date(q.createdAt).toLocaleDateString()} • {q.guestCount} guests
                          </div>
                          <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                            {q.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>No queue sessions on file.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagementPage;
