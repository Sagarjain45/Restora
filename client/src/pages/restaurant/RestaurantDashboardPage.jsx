import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Store,
  Utensils,
  Receipt,
  Clock,
  RefreshCw,
  Sliders,
  Power,
  X,
  LayoutGrid,
  CalendarDays,
  BarChart3,
  Zap,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import ServiceOrchestratorModal from '../../components/restaurant/ServiceOrchestratorModal';
import useToast from '../../hooks/useToast';
import {
  getRestaurantProfileApi,
  toggleOpenStatusApi,
  getRestaurantDashboardMetricsApi,
} from '../../services/restaurantService';

const RestaurantDashboardPage = () => {
  const { user, token } = useAuth();
  const toast = useToast();

  // Dashboard Data
  const [metrics, setMetrics] = useState(null);
  const [restaurantProfile, setRestaurantProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [isOrchestratorOpen, setIsOrchestratorOpen] = useState(false);

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

  // Handle Toggle Open/Close Status
  const handleToggleOpen = async () => {
    setSaving(true);
    try {
      const currentStatus = Boolean(restaurantProfile?.isOpenNow);
      const res = await toggleOpenStatusApi(token, !currentStatus);
      setRestaurantProfile((prev) => (prev ? { ...prev, isOpenNow: res.isOpenNow } : null));
      toast.success(`Dining status: Restaurant is now ${res.isOpenNow ? 'OPEN' : 'CLOSED'}!`);
      setNotice({
        type: 'success',
        text: `Dining status updated: Restaurant is now ${res.isOpenNow ? 'OPEN' : 'CLOSED'} for customers.`,
      });
      await loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to toggle open status');
      setNotice({ type: 'error', text: err.message || 'Failed to toggle open status' });
    } finally {
      setSaving(false);
    }
  };

  const isOwner = user?.role === 'RESTAURANT_OWNER' || user?.role === 'PLATFORM_ADMIN';
  const currency = restaurantProfile?.settings?.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : `${currency} `;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner - Executive Restaurant Command Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span className="badge badge-indigo">
              <Store size={13} /> {restaurantProfile?.cuisine ? (Array.isArray(restaurantProfile.cuisine) ? restaurantProfile.cuisine.join(', ') : restaurantProfile.cuisine) : 'Dining'}
            </span>
            <span className={`badge ${restaurantProfile?.isOpenNow ? 'badge-success' : 'badge-danger'}`}>
              <span className="pulse-dot" /> {restaurantProfile?.isOpenNow ? 'OPEN FOR DINING' : 'CLOSED'}
            </span>
            <span className="badge badge-purple">
              Plan: {restaurantProfile?.subscriptionPlan || 'BASIC'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {restaurantProfile?.name || 'Restaurant Operations Dashboard'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {restaurantProfile?.city && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={13} /> {restaurantProfile.city}{restaurantProfile?.state ? `, ${restaurantProfile.state}` : ''} •
              </span>
            )}
            <span>Logged in as <strong>{user?.name || user?.email}</strong> ({isOwner ? 'Owner' : 'Staff'})</span>
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
                padding: '0.65rem 1.15rem',
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <Power size={15} />
              {restaurantProfile?.isOpenNow ? 'Dining: OPEN' : 'Dining: CLOSED'}
            </button>
          )}

          <button
            onClick={() => setIsOrchestratorOpen(true)}
            className="btn-primary"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              border: 'none',
              fontWeight: 700,
            }}
            title="Start End-to-End Walk-in / Order / Billing Service Flow"
          >
            <Zap size={15} />
            Quick Service Flow
          </button>

          {isOwner && (
            <Link
              to="/restaurant/settings"
              className="btn-secondary"
              style={{
                padding: '0.65rem 1.1rem',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                textDecoration: 'none',
              }}
              title="Manage Restaurant Profile, Hours & POS Settings"
            >
              <Sliders size={14} color="var(--accent-primary)" />
              <span>Store Settings</span>
            </Link>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.65rem 0.95rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            Refresh
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
            background: notice.type === 'error' ? '#fef2f2' : '#ecfdf5',
            border: `1px solid ${notice.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.25rem',
            fontSize: '0.9rem',
            color: notice.type === 'error' ? '#b91c1c' : '#047857',
          }}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* LIVE OPERATIONS COMMAND CENTER */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* 4 Core Operational KPI Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
          <Link to="/restaurant/tables" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', transition: 'transform 0.15s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>AVAILABLE TABLES</span>
                <Store size={18} color="var(--accent-success)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {metrics?.tables?.available ?? 0}{' '}
                <span style={{ fontSize: '1.1rem', color: 'var(--text-dim)', fontWeight: 500 }}>
                  / {metrics?.tables?.total ?? 0}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.35rem' }}>
                {metrics?.tables?.occupied ?? 0} occupied • {metrics?.tables?.reserved ?? 0} reserved
              </div>
            </div>
          </Link>

          <Link to="/restaurant/orders" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', transition: 'transform 0.15s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>ACTIVE KITCHEN ORDERS</span>
                <Utensils size={18} color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {metrics?.orders?.active ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                {metrics?.orders?.today ?? 0} total orders taken today
              </div>
            </div>
          </Link>

          <Link to="/restaurant/queue" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', transition: 'transform 0.15s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>WAITING QUEUE</span>
                <Clock size={18} color="var(--accent-warning)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-warning)' }}>
                {metrics?.queue?.waiting ?? 0} <span style={{ fontSize: '1rem', color: 'var(--text-dim)', fontWeight: 500 }}>parties</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', marginTop: '0.35rem' }}>
                Live guest waitlist
              </div>
            </div>
          </Link>

          <Link to="/restaurant/billing" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', transition: 'transform 0.15s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>TODAY'S REVENUE</span>
                <Receipt size={18} color="var(--accent-cyan)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-success)' }}>
                {currencySymbol}{(metrics?.sales?.todayRevenue ?? 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.35rem' }}>
                {metrics?.sales?.billsPaidToday ?? 0} bills settled
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Operational Shortcuts Bar */}
        <div className="glass-panel" style={{ padding: '1.5rem 1.75rem' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
            Quick Floor Shortcuts
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <button
              type="button"
              onClick={() => setIsOrchestratorOpen(true)}
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', fontSize: '0.85rem' }}
            >
              <Zap size={15} color="var(--accent-warning)" />
              <span>Walk-in Service</span>
            </button>
            <Link
              to="/restaurant/tables"
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}
            >
              <LayoutGrid size={15} color="var(--accent-primary)" />
              <span>Floor Seating</span>
            </Link>
            <Link
              to="/restaurant/orders"
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}
            >
              <Utensils size={15} color="var(--accent-success)" />
              <span>Live Orders</span>
            </Link>
            <Link
              to="/restaurant/billing"
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}
            >
              <Receipt size={15} color="var(--accent-cyan)" />
              <span>Settle Billing</span>
            </Link>
            <Link
              to="/restaurant/reservations"
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}
            >
              <CalendarDays size={15} color="#ec4899" />
              <span>Reservations</span>
            </Link>
            <Link
              to="/restaurant/reports"
              className="btn-secondary"
              style={{ justifyContent: 'flex-start', padding: '0.75rem 1rem', fontSize: '0.85rem', textDecoration: 'none' }}
            >
              <BarChart3 size={15} color="#a855f7" />
              <span>Daily Sales</span>
            </Link>
          </div>
        </div>

        {/* Floor Layout Matrix Preview */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Restaurant Floor Layout Matrix</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Live table occupancy and dining status across all sections
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span className="badge badge-success">
                {metrics?.tables?.total ?? 0} Tables Total
              </span>
              <Link
                to="/restaurant/tables"
                className="btn-primary"
                style={{ fontSize: '0.82rem', padding: '0.45rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
              >
                Manage Floor & Seating <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {metrics?.tables?.matrix && metrics.tables.matrix.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {metrics.tables.matrix.map((t) => (
                <div
                  key={t.id}
                  style={{
                    background: '#ffffff',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${
                      t.status === 'AVAILABLE'
                        ? 'rgba(16, 185, 129, 0.4)'
                        : t.status === 'OCCUPIED'
                        ? 'rgba(79, 70, 229, 0.4)'
                        : t.status === 'BILLING'
                        ? 'rgba(168, 85, 247, 0.4)'
                        : 'var(--border-subtle)'
                    }`,
                    boxShadow: 'var(--shadow-xs)',
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
            <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ margin: 0 }}>No tables configured on your floor yet.</p>
              <Link
                to="/restaurant/tables"
                className="btn-primary"
                style={{ marginTop: '1rem', padding: '0.55rem 1.25rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}
              >
                Setup Floor Tables Now &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* End-to-End Quick Service Flow Orchestrator */}
      <ServiceOrchestratorModal
        isOpen={isOrchestratorOpen}
        onClose={() => setIsOrchestratorOpen(false)}
        token={token}
        onWorkflowComplete={loadData}
        currency={currency}
      />
    </div>
  );
};

export default RestaurantDashboardPage;
