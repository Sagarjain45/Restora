import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, ShieldCheck, Activity, Server, LogIn, LogOut, LayoutDashboard, User } from 'lucide-react';
import { checkSystemHealth } from '../../services/api';
import useAuth from '../../hooks/useAuth';

const Navbar = () => {
  const [serverOnline, setServerOnline] = useState(null);
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    checkSystemHealth().then((res) => {
      if (mounted) {
        setServerOnline(res.success);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (role === 'PLATFORM_ADMIN') return '/admin/dashboard';
    return '/restaurant/dashboard';
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '1rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
          }}>
            <UtensilsCrossed size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.03em',
              background: 'linear-gradient(90deg, #ffffff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              RESTORA
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '-2px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Multi-Tenant SaaS
            </div>
          </div>
        </Link>

        {/* Status, Navigation & Auth Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          {/* Live Backend Connection Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.8rem',
            fontWeight: 500,
          }}>
            <Server size={14} color="var(--text-muted)" />
            <span>API:</span>
            {serverOnline === null ? (
              <span style={{ color: 'var(--text-dim)' }}>Checking...</span>
            ) : serverOnline ? (
              <span style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="pulse-dot" /> Online
              </span>
            ) : (
              <span style={{ color: 'var(--accent-danger)' }}>Offline</span>
            )}
          </div>

          <Link to="/" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>
            Home
          </Link>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {(role === 'RESTAURANT_OWNER' || role === 'RESTAURANT_STAFF') && (
                <>
                  <Link
                    to="/restaurant/tables"
                    style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}
                  >
                    Floor Tables
                  </Link>
                  <Link
                    to="/restaurant/menu"
                    style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}
                  >
                    Menu
                  </Link>
                  <Link
                    to="/restaurant/orders"
                    style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 500 }}
                  >
                    Orders
                  </Link>
                </>
              )}
              <Link
                to={getDashboardPath()}
                className="btn-primary"
                style={{ padding: '0.45rem 1rem', fontSize: '0.85rem' }}
              >
                <LayoutDashboard size={15} />
                My Dashboard
              </Link>

              {/* User badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.8rem',
                border: '1px solid var(--border-subtle)'
              }}>
                <User size={13} color="var(--accent-primary)" />
                <span style={{ fontWeight: 600 }}>{user?.name?.split(' ')[0]}</span>
                <span className={role === 'PLATFORM_ADMIN' ? 'badge badge-cyan' : 'badge badge-success'} style={{ padding: '0.1rem 0.5rem', fontSize: '0.65rem' }}>
                  {role === 'PLATFORM_ADMIN' ? 'ADMIN' : role === 'RESTAURANT_OWNER' ? 'OWNER' : 'STAFF'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                title="Sign Out"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          ) : (
            <Link
              to="/auth/login"
              className="btn-primary"
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
            >
              <LogIn size={15} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
