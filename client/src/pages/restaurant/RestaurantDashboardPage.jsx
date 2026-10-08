import React from 'react';
import useAuth from '../../hooks/useAuth';
import { Store, Utensils, Users, Receipt, Clock, Calendar, CheckCircle2, Shield } from 'lucide-react';

const RestaurantDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-success">Tenant Workspace</span>
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
          gap: '0.75rem',
          background: 'rgba(16, 185, 129, 0.15)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(16, 185, 129, 0.3)'
        }}>
          <Store size={28} color="var(--accent-success)" />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Restaurant Tenant</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Trattoria Roma Demo</div>
          </div>
        </div>
      </div>

      {/* Tenant Isolation Banner */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.08)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}>
        <Shield size={24} color="var(--accent-primary)" />
        <div style={{ fontSize: '0.9rem' }}>
          <strong style={{ color: 'var(--text-main)' }}>Tenant Isolation Active:</strong> All tables, orders, customers, and menu items are scoped automatically to your restaurant token. No other restaurant can view or modify your data.
        </div>
      </div>

      {/* Restaurant Operational Quick Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>AVAILABLE TABLES</span>
            <Store size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>8 / 12</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>
            4 occupied currently
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE ORDERS</span>
            <Utensils size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>4</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            2 preparing, 2 served
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>WAITING QUEUE</span>
            <Clock size={18} color="var(--accent-warning)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>3</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-warning)', marginTop: '0.25rem' }}>
            FIFO wait ~15 mins
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TODAY'S REVENUE</span>
            <Receipt size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>₹14,850</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>
            18 bills paid
          </div>
        </div>
      </div>

      {/* Modules Roadmap Grid */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1.25rem' }}>Daily Operational Modules</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
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
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Billing & Payments (Phase 10)</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Subtotal, GST, discounts, and payment methods (Cash, UPI, Card) with table release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDashboardPage;
