import React from 'react';
import useAuth from '../../hooks/useAuth';
import { ShieldCheck, Building2, TrendingUp, Users, Activity, CheckCircle, ArrowRight } from 'lucide-react';

const AdminDashboardPage = () => {
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-cyan">Platform Admin Space</span>
            <span className="badge badge-success">Tenant Scope: Global SaaS</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
            Welcome, {user?.name}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Authorized Account: <code>{user?.email}</code> • Role: <strong>{user?.role}</strong>
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(99, 102, 241, 0.15)',
          padding: '0.75rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}>
          <ShieldCheck size={28} color="var(--accent-primary)" />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Security Level</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Root SaaS Authority</div>
          </div>
        </div>
      </div>

      {/* Platform Analytics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>REGISTERED TENANTS</span>
            <Building2 size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>12</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>
            +2 pending applications
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>ACTIVE RESTAURANTS</span>
            <CheckCircle size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>10</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Operating live orders
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TOTAL USERS</span>
            <Users size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>48</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            Owners & floor staff
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>PLATFORM HEALTH</span>
            <Activity size={18} color="var(--accent-warning)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-success)' }}>99.9%</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
            All services responsive
          </div>
        </div>
      </div>

      {/* Platform Admin Core Features Preview */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Platform Management Roadmap (Phase 5)</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Restaurant Applications</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Approve or decline onboarding applications submitted by new restaurants.
            </p>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Tenant Activation & Suspension</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Toggle restaurant tenant status (Active, Inactive, Suspended).
            </p>
          </div>
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Platform Analytics</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Cross-platform aggregate order volume, active restaurants, and SaaS revenue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
