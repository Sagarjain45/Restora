import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Building2, 
  Store, 
  Terminal, 
  Layers
} from 'lucide-react';
import { checkSystemHealth } from '../services/api';

const HomePage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastChecked, setLastChecked] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    const result = await checkSystemHealth();
    if (result.success) {
      setHealthData(result.data);
    } else {
      setError(result.error);
    }
    setLastChecked(new Date().toLocaleTimeString());
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '2rem 1rem 1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="badge badge-cyan">
            <span className="pulse-dot" /> Phase 1 Foundation Verified
          </span>
        </div>
        <h1 style={{ 
          fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', 
          fontWeight: 800, 
          lineHeight: 1.15, 
          marginBottom: '1rem',
          maxWidth: '850px',
          marginInline: 'auto'
        }}>
          Multi-Tenant SaaS <br />
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #34d399 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Restaurant Management System
          </span>
        </h1>
        <p style={{ 
          fontSize: '1.1rem', 
          color: 'var(--text-muted)', 
          maxWidth: '680px', 
          margin: '0 auto 1.75rem' 
        }}>
          Engineered on the MERN stack with strict application-level tenant isolation, 
          clean service layers, and unified dashboard workflows.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <a href="/auth/login" className="btn-primary" style={{ padding: '0.75rem 1.75rem' }}>
            Go to Sign In & Quick Roles
          </a>
          <a href="/admin/dashboard" className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
            Platform Admin Portal
          </a>
          <a href="/restaurant/dashboard" className="btn-secondary" style={{ padding: '0.75rem 1.5rem' }}>
            Restaurant Portal
          </a>
        </div>
      </section>

      {/* Backend & Database Health Status Card (Phase 1 Requirement) */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '1rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(99, 102, 241, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}>
              <Server size={22} color="var(--accent-primary)" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>System Communication Check</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                Live verification of Express REST API and MongoDB connection status
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {lastChecked && (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Last checked: {lastChecked}
              </span>
            )}
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
              {loading ? 'Checking...' : 'Refresh Status'}
            </button>
          </div>
        </div>

        {/* Health Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1.25rem',
          marginBottom: '1.5rem'
        }}>
          {/* Server API Metric */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>EXPRESS SERVER</span>
              {healthData?.data?.status === 'UP' ? (
                <span className="badge badge-success">OPERATIONAL</span>
              ) : (
                <span className="badge badge-danger">CONNECTING</span>
              )}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              {healthData?.data?.status === 'UP' ? 'HTTP 200 OK' : 'Pending Server'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Endpoint: <code style={{ color: 'var(--accent-cyan)' }}>/api/health</code>
            </div>
          </div>

          {/* Database Metric */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>MONGODB CONNECTION</span>
              {healthData?.data?.database?.isConnected ? (
                <span className="badge badge-success">CONNECTED</span>
              ) : (
                <span className="badge badge-warning">{healthData?.data?.database?.state || 'STANDBY'}</span>
              )}
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              {healthData?.data?.database?.isConnected ? 'Mongoose Active' : 'Configured & Ready'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Target: <code style={{ color: 'var(--accent-primary)' }}>restora_db</code>
            </div>
          </div>

          {/* Runtime Environment Metric */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ENVIRONMENT</span>
              <span className="badge badge-cyan">{healthData?.data?.environment || 'DEVELOPMENT'}</span>
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              Node v26 + Vite
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Uptime: {healthData?.data?.uptimeSeconds ?? 0}s
            </div>
          </div>
        </div>

        {/* Live Payload Preview */}
        {healthData && (
          <div style={{
            background: 'rgba(0, 0, 0, 0.45)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            fontFamily: 'monospace',
            fontSize: '0.8rem',
            color: '#a5f3fc',
            overflowX: 'auto'
          }}>
            <div style={{ color: 'var(--text-dim)', marginBottom: '0.5rem', fontWeight: 600 }}>
              &gt; Handshake Response Payload:
            </div>
            {JSON.stringify(healthData, null, 2)}
          </div>
        )}

        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            color: '#fca5a5',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={20} color="var(--accent-danger)" />
            <div>
              <strong>Connection Notice:</strong> {error}. Ensure backend is running on port 5000.
            </div>
          </div>
        )}
      </section>

      {/* Two Architecture Zones Overview */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Zone 1: Platform Admin */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <Building2 size={24} color="var(--accent-primary)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Platform Admin Portal</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            SaaS owner operations: onboarding, verification, approving new restaurants, 
            subscription tier management, and system-wide metric tracking.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--accent-success)" /> Restaurant approval workflow
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--accent-success)" /> Platform aggregate analytics
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--accent-success)" /> Tenant status & activation control
            </li>
          </ul>
        </div>

        {/* Zone 2: Restaurant Operations */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.25rem'
          }}>
            <Store size={24} color="var(--accent-success)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Restaurant Operations Portal</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            Tenant-isolated dashboard for owners and floor staff: live table states, order processing, 
            instant billing, waiting queue FIFO, and reservations.
          </p>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--accent-success)" /> Live table matrix & occupancy
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--accent-success)" /> POS ordering, bill calculation & receipts
            </li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle2 size={16} color="var(--accent-success)" /> Strict tenant-scoped data isolation
            </li>
          </ul>
        </div>
      </section>

      {/* Checklist Grid */}
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={20} color="var(--accent-success)" /> Phase 1 Foundation Deliverables
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--accent-success)" />
            <span>Express.js Modular API & Routing</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--accent-success)" />
            <span>Mongoose & Atlas Connection Setup</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--accent-success)" />
            <span>Standardized Error & Health Endpoints</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--accent-success)" />
            <span>Vite + React Single-Page Application</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--accent-success)" />
            <span>Rich Dark Mode & Design Tokens</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} color="var(--accent-success)" />
            <span>React ErrorBoundary & Navigation Layout</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
