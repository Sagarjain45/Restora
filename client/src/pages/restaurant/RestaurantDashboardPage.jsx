import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  Store,
  Utensils,
  Receipt,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Boxes
} from 'lucide-react';
import {
  getCurrentTenantApi,
  verifyTenantIsolationApi,
  getTenantTablesApi,
  seedSandboxApi,
} from '../../services/tenantService';

const RestaurantDashboardPage = () => {
  const { user, token } = useAuth();
  const [tenantInfo, setTenantInfo] = useState(null);
  const [tablesData, setTablesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState(null);

  const loadTenantData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [tenantRes, , tablesRes] = await Promise.all([
        getCurrentTenantApi(token).catch((err) => ({ tenant: null, error: err.message })),
        verifyTenantIsolationApi(token).catch(() => null),
        getTenantTablesApi(token).catch(() => ({ tables: [] })),
      ]);

      if (tenantRes?.tenant) {
        setTenantInfo(tenantRes.tenant);
      }
      if (tablesRes?.tables) {
        setTablesData(tablesRes.tables);
      }
    } catch (err) {
      console.warn('Error loading tenant context:', err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTenantData();
  }, [loadTenantData]);

  const handleSeedSandbox = async () => {
    try {
      setActionNotice('Initializing multi-tenant sandbox restaurants (Tenant A & Tenant B)...');
      await seedSandboxApi();
      setActionNotice('Sandbox successfully initialized! Reloading tenant data...');
      await loadTenantData();
      setTimeout(() => setActionNotice(null), 4000);
    } catch (err) {
      setActionNotice(`Failed to seed: ${err.message}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-success">Phase 4 Active</span>
            <span className="badge badge-cyan">
              Tenant ID: {user?.restaurantId ? String(user.restaurantId).substring(0, 10) + '...' : 'Assigned'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
            Welcome, {user?.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Account: <code>{user?.email}</code> • Role: <strong>{user?.role}</strong>
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(16, 185, 129, 0.15)',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(16, 185, 129, 0.3)'
          }}>
            <Store size={28} color="var(--accent-success)" />
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Restaurant</div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {tenantInfo?.name || 'Trattoria Roma Demo'}
              </div>
            </div>
          </div>

          <button
            onClick={loadTenantData}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {actionNotice && (
        <div style={{
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.75rem 1rem',
          fontSize: '0.85rem',
          color: '#c7d2fe',
        }}>
          {actionNotice}
        </div>
      )}

      {/* Phase 4 Live Multi-Tenant Isolation Status Box */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(99, 102, 241, 0.4)'
            }}>
              <ShieldCheck size={22} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Multi-Tenant Isolation Architecture (Phase 4)</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Strict runtime scoping prevents cross-tenant access between restaurants
              </p>
            </div>
          </div>

          <button
            onClick={handleSeedSandbox}
            className="btn-secondary"
            style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }}
          >
            <Boxes size={14} /> Seed Test Sandbox (A & B)
          </button>
        </div>

        {/* Isolation Rules Check */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <CheckCircle2 size={16} color="var(--accent-success)" />
              <strong style={{ fontSize: '0.85rem' }}>Automatic Query Scoping</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              All Mongoose operations inject <code>restaurantId = req.tenantId</code>
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <CheckCircle2 size={16} color="var(--accent-success)" />
              <strong style={{ fontSize: '0.85rem' }}>Spoofing Protection</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Client cannot override or swap restaurantId in body or query
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <CheckCircle2 size={16} color="var(--accent-success)" />
              <strong style={{ fontSize: '0.85rem' }}>Cross-Tenant Read Block</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Attempts to query resources of other restaurants return 403 Forbidden
            </div>
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <CheckCircle2 size={16} color="var(--accent-success)" />
              <strong style={{ fontSize: '0.85rem' }}>Reference Integrity</strong>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Cannot reference tables, menu items or orders of foreign tenants
            </div>
          </div>
        </div>

        {/* Live Scoped Data Preview */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Live Tenant-Scoped Tables (<code style={{ color: 'var(--accent-cyan)' }}>GET /api/tenant/tables</code>):
            </span>
            <span className="badge badge-success">
              {tablesData.length} Isolated Table(s) Loaded
            </span>
          </div>

          {tablesData.length > 0 ? (
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {tablesData.map((t) => (
                <div
                  key={t._id}
                  style={{
                    background: 'rgba(30, 41, 59, 0.7)',
                    padding: '0.6rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: '0.8rem'
                  }}
                >
                  <strong style={{ color: 'var(--accent-cyan)' }}>{t.tableNumber}</strong>
                  <span style={{ color: 'var(--text-dim)', marginLeft: '0.5rem' }}>({t.capacity} seats)</span>
                  <span className="badge badge-cyan" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              No tables loaded yet for this tenant. Click "Seed Test Sandbox" above to initialize sample data for both Restaurant A and B.
            </div>
          )}
        </div>
      </div>

      {/* Restaurant Operational Quick Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>AVAILABLE TABLES</span>
            <Store size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
            {tablesData.filter((t) => t.status === 'AVAILABLE').length} / {tablesData.length || 0}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>
            Scoped strictly to {tenantInfo?.name || 'current tenant'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE ORDERS</span>
            <Utensils size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>0</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Prepared for Phase 9
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>WAITING QUEUE</span>
            <Clock size={18} color="var(--accent-warning)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>0</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', marginTop: '0.25rem' }}>
            Prepared for Phase 11
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TODAY'S REVENUE</span>
            <Receipt size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹0</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>
            Prepared for Phase 10
          </div>
        </div>
      </div>

      {/* Modules Roadmap Grid */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Upcoming Operational Phases</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Restaurant Onboarding (Phase 6)</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Profile editing, opening hours, cuisine types, and operational settings.
            </p>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Table Management (Phase 7)</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Real-time floor layout with Available, Occupied, Reserved, and Cleaning indicators.
            </p>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Menu Management (Phase 8)</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Categories, items, pricing, veg/non-veg tags, and kitchen availability.
            </p>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Live Ordering (Phase 9)</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Table-assigned orders, line items, kitchen prep lifecycle, and served status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboardPage;
