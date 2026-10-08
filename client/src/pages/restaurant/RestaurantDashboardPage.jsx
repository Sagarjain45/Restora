import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  Store,
  Utensils,
  Receipt,
  Clock,
  RefreshCw,
  Sliders,
  Calendar,
  Save,
  Power,
  X,
  Layers,
  LayoutGrid,
  BookOpen,
  Users,
  UserCheck,
} from 'lucide-react';
import TableManagementPage from './TableManagementPage';
import MenuManagementPage from './MenuManagementPage';
import OrderManagementPage from './OrderManagementPage';
import BillingManagementPage from './BillingManagementPage';
import QueueManagementPage from './QueueManagementPage';
import ReservationManagementPage from './ReservationManagementPage';
import CustomerManagementPage from './CustomerManagementPage';
import StaffManagementPage from './StaffManagementPage';
import {
  getRestaurantProfileApi,
  updateRestaurantProfileApi,
  updateOpeningHoursApi,
  updateRestaurantSettingsApi,
  toggleOpenStatusApi,
  getRestaurantDashboardMetricsApi,
} from '../../services/restaurantService';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_HOURS = DAYS_OF_WEEK.map((day) => ({
  day,
  openTime: '10:00',
  closeTime: '23:00',
  isClosed: false,
}));

const RestaurantDashboardPage = () => {
  const { user, token } = useAuth();

  // Active Tab: 'dashboard' | 'profile' | 'hours' | 'settings'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Dashboard Data
  const [metrics, setMetrics] = useState(null);
  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    website: '',
    cuisine: '',
  });

  // Hours State
  const [hours, setHours] = useState(DEFAULT_HOURS);

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    currency: 'INR',
    taxRatePercent: 5,
    serviceChargePercent: 0,
    autoAcceptReservations: false,
    allowSpecialRequests: true,
  });

  // 1. Load Profile & Metrics
  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [profileRes, metricsRes] = await Promise.all([
        getRestaurantProfileApi(token).catch((err) => {
          console.warn('Profile fetch warning:', err.message);
          return null;
        }),
        getRestaurantDashboardMetricsApi(token).catch((err) => {
          console.warn('Metrics fetch warning:', err.message);
          return null;
        }),
      ]);

      if (profileRes) {
        setRestaurantProfile(profileRes);
        setProfileForm({
          name: profileRes.name || '',
          description: profileRes.description || '',
          email: profileRes.email || '',
          phone: profileRes.phone || '',
          address: profileRes.address || '',
          city: profileRes.city || '',
          state: profileRes.state || '',
          postalCode: profileRes.postalCode || '',
          website: profileRes.website || '',
          cuisine: Array.isArray(profileRes.cuisine) ? profileRes.cuisine.join(', ') : '',
        });

        if (profileRes.openingHours && profileRes.openingHours.length > 0) {
          // Merge with all days
          const merged = DAYS_OF_WEEK.map((d) => {
            const found = profileRes.openingHours.find((h) => h.day === d);
            return found || { day: d, openTime: '10:00', closeTime: '23:00', isClosed: false };
          });
          setHours(merged);
        }

        if (profileRes.settings) {
          setSettingsForm({
            currency: profileRes.settings.currency || 'INR',
            taxRatePercent: profileRes.settings.taxRatePercent ?? 5,
            serviceChargePercent: profileRes.settings.serviceChargePercent ?? 0,
            autoAcceptReservations: Boolean(profileRes.settings.autoAcceptReservations),
            allowSpecialRequests: profileRes.settings.allowSpecialRequests !== false,
          });
        }
      }

      if (metricsRes) {
        setMetrics(metricsRes);
      }
    } catch (err) {
      console.warn('Dashboard load error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Profile Save
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateRestaurantProfileApi(token, profileForm);
      setRestaurantProfile(updated);
      setNotice({ type: 'success', text: 'Restaurant profile saved successfully!' });
      await loadData();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Hours Save
  const handleSaveHours = async () => {
    setSaving(true);
    try {
      await updateOpeningHoursApi(token, hours);
      setNotice({ type: 'success', text: 'Opening hours schedule updated!' });
      await loadData();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to update hours' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateRestaurantSettingsApi(token, settingsForm);
      setNotice({ type: 'success', text: 'Operational settings updated!' });
      await loadData();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setSaving(false);
    }
  };

  // Handle Toggle Open/Close Status
  const handleToggleOpen = async () => {
    setSaving(true);
    try {
      const currentStatus = Boolean(restaurantProfile?.isOpenNow);
      const res = await toggleOpenStatusApi(token, !currentStatus);
      setRestaurantProfile((prev) => prev ? { ...prev, isOpenNow: res.isOpenNow } : null);
      setNotice({
        type: 'success',
        text: `Dining status updated: Restaurant is now ${res.isOpenNow ? 'OPEN' : 'CLOSED'} for customers.`,
      });
      await loadData();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to toggle open status' });
    } finally {
      setSaving(false);
    }
  };

  const isOwner = user?.role === 'RESTAURANT_OWNER';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-success">Tenant Workspace</span>
            <span className="badge badge-cyan">
              {restaurantProfile?.status || 'ACTIVE'} Tenant
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
            {restaurantProfile?.name || 'Restaurant Operations Hub'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Authorized User: <code>{user?.email}</code> • Role: <strong>{user?.role}</strong> • Scoped: <code>{user?.restaurantId}</code>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Operational Status Toggle */}
          {isOwner && (
            <button
              onClick={handleToggleOpen}
              disabled={saving}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                borderColor: restaurantProfile?.isOpenNow ? 'var(--accent-success)' : 'var(--accent-danger)',
                color: restaurantProfile?.isOpenNow ? 'var(--accent-success)' : 'var(--accent-danger)',
                background: restaurantProfile?.isOpenNow ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                padding: '0.65rem 1.25rem',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <Power size={15} />
              {restaurantProfile?.isOpenNow ? 'Dining: OPEN' : 'Dining: CLOSED'}
            </button>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notice Alert */}
      {notice && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: notice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${notice.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem 1.25rem',
          fontSize: '0.9rem',
          color: notice.type === 'error' ? '#fca5a5' : '#a7f3d0',
        }}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={activeTab === 'dashboard' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Store size={15} /> Live Dashboard
        </button>
        <button
          onClick={() => setActiveTab('tables')}
          className={activeTab === 'tables' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <LayoutGrid size={15} /> Tables & Floor
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <BookOpen size={15} /> Menu Catalog
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Utensils size={15} /> Orders & Kitchen
        </button>
        <button
          onClick={() => setActiveTab('billing')}
          className={activeTab === 'billing' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Receipt size={15} /> Billing & Invoices
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={activeTab === 'queue' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Clock size={15} /> Waiting Queue
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={activeTab === 'reservations' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Calendar size={15} /> Reservations
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={activeTab === 'customers' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Users size={15} /> Customers
        </button>
        {isOwner && (
          <button
            onClick={() => setActiveTab('staff')}
            className={activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
          >
            <UserCheck size={15} /> Staff Management
          </button>
        )}
        <button
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Layers size={15} /> Restaurant Profile
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={activeTab === 'hours' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Calendar size={15} /> Opening Hours
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Sliders size={15} /> Settings
        </button>
      </div>

      {/* TAB 1: LIVE DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Operational Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>AVAILABLE TABLES</span>
                <Store size={18} color="var(--accent-success)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {metrics?.tables?.available ?? 0} / {metrics?.tables?.total ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>
                {metrics?.tables?.occupied ?? 0} occupied • {metrics?.tables?.reserved ?? 0} reserved
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE ORDERS</span>
                <Utensils size={18} color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {metrics?.orders?.active ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                {metrics?.orders?.today ?? 0} orders today
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>WAITING QUEUE</span>
                <Clock size={18} color="var(--accent-warning)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-warning)' }}>
                {metrics?.queue?.waiting ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', marginTop: '0.25rem' }}>
                FIFO waiting party count
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TODAY'S SALES</span>
                <Receipt size={18} color="var(--accent-cyan)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-success)' }}>
                ₹{(metrics?.sales?.todayRevenue ?? 0).toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>
                {metrics?.sales?.billsPaidToday ?? 0} bills settled
              </div>
            </div>
          </div>

          {/* Floor Layout Matrix Preview */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Restaurant Floor Layout</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  Live table occupancy scoped strictly to your restaurant tenant
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span className="badge badge-success">
                  {metrics?.tables?.total ?? 0} Tables Configured
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('tables')}
                  className="btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  Manage Floor &rarr;
                </button>
              </div>
            </div>

            {metrics?.tables?.matrix && metrics.tables.matrix.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {metrics.tables.matrix.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: 'rgba(15, 23, 42, 0.7)',
                      padding: '1.25rem',
                      borderRadius: 'var(--radius-md)',
                      border: `1px solid ${
                        t.status === 'AVAILABLE'
                          ? 'rgba(16, 185, 129, 0.3)'
                          : t.status === 'OCCUPIED'
                          ? 'rgba(99, 102, 241, 0.3)'
                          : t.status === 'BILLING'
                          ? 'rgba(168, 85, 247, 0.3)'
                          : 'var(--border-subtle)'
                      }`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{t.tableNumber}</strong>
                      <span
                        className={`badge ${
                          t.status === 'AVAILABLE'
                            ? 'badge-success'
                            : t.status === 'OCCUPIED'
                            ? 'badge-indigo'
                            : t.status === 'BILLING'
                            ? 'badge-purple'
                            : t.status === 'RESERVED'
                            ? 'badge-warning'
                            : 'badge-gray'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Capacity: <strong>{t.capacity} Guests</strong>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Section: {t.section || 'Main Dining'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No tables configured on your floor yet.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('tables')}
                  className="btn-primary"
                  style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  Setup Tables Now &rarr;
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TABLE MANAGEMENT (PHASE 7) */}
      {activeTab === 'tables' && (
        <TableManagementPage />
      )}

      {/* TAB 3: MENU MANAGEMENT (PHASE 8) */}
      {activeTab === 'menu' && (
        <MenuManagementPage />
      )}

      {/* TAB 4: ORDER MANAGEMENT (PHASE 9) */}
      {activeTab === 'orders' && (
        <OrderManagementPage />
      )}

      {/* TAB 5: BILLING & PAYMENTS (PHASE 10) */}
      {activeTab === 'billing' && (
        <BillingManagementPage />
      )}

      {/* TAB 6: WAITING QUEUE (PHASE 11) */}
      {activeTab === 'queue' && (
        <QueueManagementPage />
      )}

      {/* TAB 7: TABLE RESERVATIONS (PHASE 12) */}
      {activeTab === 'reservations' && (
        <ReservationManagementPage />
      )}

      {/* TAB 8: CUSTOMER DIRECTORY & CRM (PHASE 13) */}
      {activeTab === 'customers' && (
        <CustomerManagementPage />
      )}

      {/* TAB 9: STAFF ROSTER & MANAGEMENT (PHASE 14) */}
      {activeTab === 'staff' && isOwner && (
        <StaffManagementPage />
      )}

      {/* TAB 10: RESTAURANT PROFILE */}
      {activeTab === 'profile' && (
        <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '780px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Restaurant Profile & Information</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Update your public restaurant details, cuisine specialties, and contact points.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isOwner}
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  disabled={!isOwner}
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isOwner}
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Website URL
                </label>
                <input
                  type="url"
                  placeholder="https://myrestaurant.com"
                  disabled={!isOwner}
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Description / About Us
              </label>
              <textarea
                rows={3}
                placeholder="Brief summary of your restaurant experience, culinary vision, and ambience..."
                disabled={!isOwner}
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  City *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isOwner}
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  State *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isOwner}
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Postal Code
                </label>
                <input
                  type="text"
                  disabled={!isOwner}
                  value={profileForm.postalCode}
                  onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Street Address *
              </label>
              <input
                type="text"
                required
                disabled={!isOwner}
                value={profileForm.address}
                onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Cuisines (comma-separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Italian, Woodfire Pizza, Continental"
                disabled={!isOwner}
                value={profileForm.cuisine}
                onChange={(e) => setProfileForm({ ...profileForm, cuisine: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />
            </div>

            {isOwner ? (
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ marginTop: '0.5rem', padding: '0.85rem 1.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Save size={16} /> Save Profile Changes
              </button>
            ) : (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
                * Profile editing is restricted to Restaurant Owners.
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 3: OPENING HOURS */}
      {activeTab === 'hours' && (
        <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Weekly Operating Hours</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Set daily service times and toggle weekly closing days.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {hours.map((schedule, idx) => (
              <div
                key={schedule.day}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ minWidth: '110px', fontWeight: 600 }}>
                  {schedule.day}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Opens:</label>
                  <input
                    type="time"
                    disabled={!isOwner || schedule.isClosed}
                    value={schedule.openTime}
                    onChange={(e) => {
                      const updated = [...hours];
                      updated[idx].openTime = e.target.value;
                      setHours(updated);
                    }}
                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />

                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Closes:</label>
                  <input
                    type="time"
                    disabled={!isOwner || schedule.isClosed}
                    value={schedule.closeTime}
                    onChange={(e) => {
                      const updated = [...hours];
                      updated[idx].closeTime = e.target.value;
                      setHours(updated);
                    }}
                    style={{ padding: '0.4rem 0.6rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: isOwner ? 'pointer' : 'default', fontSize: '0.85rem' }}>
                    <input
                      type="checkbox"
                      disabled={!isOwner}
                      checked={schedule.isClosed}
                      onChange={(e) => {
                        const updated = [...hours];
                        updated[idx].isClosed = e.target.checked;
                        setHours(updated);
                      }}
                    />
                    <span style={{ color: schedule.isClosed ? 'var(--accent-danger)' : 'var(--text-muted)' }}>
                      {schedule.isClosed ? 'Closed All Day' : 'Open'}
                    </span>
                  </label>
                </div>
              </div>
            ))}

            {isOwner && (
              <button
                onClick={handleSaveHours}
                disabled={saving}
                className="btn-primary"
                style={{ marginTop: '0.75rem', padding: '0.85rem 1.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Save size={16} /> Save Operating Hours
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: OPERATIONAL SETTINGS */}
      {activeTab === 'settings' && (
        <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '680px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Operational Configuration & Billing Rules</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Configure tax percentages, service charges, and reservation preferences.
            </p>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Tax Rate (% GST / VAT)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  disabled={!isOwner}
                  value={settingsForm.taxRatePercent}
                  onChange={(e) => setSettingsForm({ ...settingsForm, taxRatePercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                  Standard restaurant GST is 5.0%
                </span>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Service Charge (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  disabled={!isOwner}
                  value={settingsForm.serviceChargePercent}
                  onChange={(e) => setSettingsForm({ ...settingsForm, serviceChargePercent: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.25rem', display: 'block' }}>
                  Optional voluntary service charge
                </span>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Default Currency
              </label>
              <select
                disabled={!isOwner}
                value={settingsForm.currency}
                onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              >
                <option value="INR">INR - Indian Rupee (₹)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="EUR">EUR - Euro (€)</option>
                <option value="GBP">GBP - British Pound (£)</option>
                <option value="AED">AED - UAE Dirham</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1rem', background: 'rgba(15, 23, 42, 0.5)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: isOwner ? 'pointer' : 'default' }}>
                <input
                  type="checkbox"
                  disabled={!isOwner}
                  checked={settingsForm.autoAcceptReservations}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoAcceptReservations: e.target.checked })}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Auto-Accept Table Reservations</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Automatically confirm guest reservation bookings if seats are available</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: isOwner ? 'pointer' : 'default' }}>
                <input
                  type="checkbox"
                  disabled={!isOwner}
                  checked={settingsForm.allowSpecialRequests}
                  onChange={(e) => setSettingsForm({ ...settingsForm, allowSpecialRequests: e.target.checked })}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enable Special Order Notes</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Allow kitchen staff to add custom dietary and preparation notes to order tickets</div>
                </div>
              </label>
            </div>

            {isOwner && (
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ padding: '0.85rem 1.5rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Save size={16} /> Save Configuration
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboardPage;
