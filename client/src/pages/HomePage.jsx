import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed,
  LayoutGrid, 
  Receipt, 
  Clock, 
  CalendarDays, 
  Users, 
  BarChart3, 
  ArrowRight, 
  ShieldCheck, 
  Zap,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import useAuth from '../hooks/useAuth';

const HomePage = () => {
  const { isAuthenticated, role } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect straight to their operational hub
  useEffect(() => {
    if (isAuthenticated) {
      if (role === 'PLATFORM_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/restaurant/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, role, navigate]);

  const features = [
    {
      icon: LayoutGrid,
      color: '#3b82f6',
      title: 'Floor & Table Management',
      description: 'Interactive floor matrix with real-time status tracking (Available, Occupied, Billing, Reserved) and instant seat assignment.',
    },
    {
      icon: UtensilsCrossed,
      color: '#8b5cf6',
      title: 'Kitchen & Order Workflow',
      description: 'Table-based order tickets, kitchen status tracking, dish modifications, and instant item additions during dining.',
    },
    {
      icon: Receipt,
      color: '#10b981',
      title: 'POS Billing & Settlements',
      description: 'Flexible multi-method payment settlements (Cash, Card, UPI), automatic tax calculation, and instant itemized bills.',
    },
    {
      icon: Clock,
      color: '#f59e0b',
      title: 'Waiting Queue Management',
      description: 'Streamline busy dinner rushes with automated party waitlists, party size matching, and table assignment alerts.',
    },
    {
      icon: CalendarDays,
      color: '#06b6d4',
      title: 'Table Reservations',
      description: 'Advance booking schedule, party guest details, special requests, and conflict-free table allocation.',
    },
    {
      icon: BarChart3,
      color: '#ec4899',
      title: 'Sales & Performance Reports',
      description: 'Live revenue totals, daily sales summaries, table utilization rates, and top-selling dishes at a glance.',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3.5rem', padding: '1rem 0 3rem' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '2.5rem 1rem 1rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <span className="badge badge-indigo" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <Sparkles size={14} /> Restaurant Operations Platform
          </span>
        </div>
        <h1 style={{ 
          fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)', 
          fontWeight: 800, 
          lineHeight: 1.15, 
          marginBottom: '1.25rem',
          maxWidth: '900px',
          marginInline: 'auto'
        }}>
          The Operating System for <br />
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #34d399 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            High-Performing Restaurants
          </span>
        </h1>
        <p style={{ 
          fontSize: '1.15rem', 
          color: 'var(--text-muted)', 
          maxWidth: '720px', 
          margin: '0 auto 2.25rem',
          lineHeight: 1.6
        }}>
          Manage your dining floor, kitchen order ticketing, split billing, waitlists, 
          and guest analytics in one seamless cloud workspace built for owners and floor teams.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <Link to="/auth/register" className="btn-primary" style={{ padding: '0.85rem 2rem', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Register Your Restaurant <ArrowRight size={18} />
          </Link>
          <Link to="/auth/login" className="btn-secondary" style={{ padding: '0.85rem 1.75rem', fontSize: '1rem' }}>
            Sign In to Existing Account
          </Link>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
            Engineered for Front-of-House & Kitchen Speed
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Everything your restaurant needs to turn tables faster and keep guests delighted.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
        }}>
          {features.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx} 
                className="glass-panel" 
                style={{ 
                  padding: '1.75rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '1rem',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  background: `${item.color}20`,
                  border: `1px solid ${item.color}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Icon size={24} color={item.color} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.35rem', color: 'var(--text-main)' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Quick Service Flow Showcase */}
      <section className="glass-panel" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        padding: '2.5rem 2rem',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          alignItems: 'center',
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
              <span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>
                <Zap size={13} /> 1-Click Operations
              </span>
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.75rem' }}>
              Unified Service Flow
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
              During peak hours, every second matters. Restora's Quick Service Flow guides staff from walk-in guest seating, menu item ordering, to instant payment settlement in a single streamlined modal.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} color="var(--accent-success)" />
                <span>Zero duplicate entries between seating and orders</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} color="var(--accent-success)" />
                <span>Auto-releases tables immediately upon bill settlement</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} color="var(--accent-success)" />
                <span>Live revenue metrics updated in real-time</span>
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '2rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            textAlign: 'center',
          }}>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Ready to Get Started?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              Register your restaurant today with your FSSAI license, or sign in to your existing operational dashboard.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                to="/auth/register"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.8rem 1.5rem' }}
              >
                Register Your Restaurant <ArrowRight size={16} />
              </Link>
              <Link
                to="/auth/login"
                className="btn-secondary"
                style={{ width: '100%', justifyContent: 'center', padding: '0.7rem 1.5rem', fontSize: '0.88rem' }}
              >
                Sign In to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
