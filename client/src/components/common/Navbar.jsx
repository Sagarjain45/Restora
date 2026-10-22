import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UtensilsCrossed, LogIn, LogOut, LayoutDashboard, User, ShieldCheck, Settings } from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
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
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-subtle)',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0.85rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        {/* Brand Logo */}
        <Link to={isAuthenticated ? getDashboardPath() : '/'} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)',
          }}>
            <UtensilsCrossed size={20} color="#ffffff" />
          </div>
          <div>
            <div style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
              color: 'var(--text-main)',
              lineHeight: 1.1,
            }}>
              RESTORA
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
              Restaurant Operations
            </div>
          </div>
        </Link>

        {/* Auth & Navigation Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <>
              {role === 'PLATFORM_ADMIN' && (
                <Link
                  to="/admin/dashboard"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: 'var(--text-muted)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    padding: '0.4rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    textDecoration: 'none',
                  }}
                >
                  <ShieldCheck size={15} color="var(--accent-primary)" />
                  Platform Admin
                </Link>
              )}

              <Link
                to={getDashboardPath()}
                className="btn-secondary"
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>

              {role === 'RESTAURANT_OWNER' && (
                <Link
                  to="/restaurant/settings"
                  className="btn-secondary"
                  style={{
                    padding: '0.45rem 0.85rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                  title="Restaurant Profile & Settings"
                >
                  <Settings size={14} />
                  Settings
                </Link>
              )}

              {/* User badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#f1f5f9',
                padding: '0.4rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.82rem',
                border: '1px solid var(--border-subtle)',
              }}>
                <User size={13} color="var(--accent-primary)" />
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {user?.name?.split(' ')[0] || user?.email?.split('@')[0]}
                </span>
                <span
                  className={role === 'PLATFORM_ADMIN' ? 'badge badge-cyan' : role === 'RESTAURANT_OWNER' ? 'badge badge-success' : 'badge badge-warning'}
                  style={{ padding: '0.1rem 0.45rem', fontSize: '0.65rem', fontWeight: 700 }}
                >
                  {role === 'PLATFORM_ADMIN' ? 'ADMIN' : role === 'RESTAURANT_OWNER' ? 'OWNER' : 'STAFF'}
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
                title="Sign Out"
              >
                <LogOut size={14} />
                Logout
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <Link
                to="/auth/register"
                className="btn-secondary"
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-primary)',
                  fontWeight: 600,
                }}
              >
                <UtensilsCrossed size={14} color="var(--accent-primary)" />
                Register Restaurant
              </Link>
              <Link
                to="/auth/login"
                className="btn-primary"
                style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
              >
                <LogIn size={15} />
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
