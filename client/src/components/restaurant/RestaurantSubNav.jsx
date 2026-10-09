import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid,
  ClipboardList,
  History,
  CreditCard,
  Users,
  CalendarDays,
  UserCheck,
  Utensils,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

const RestaurantSubNav = () => {
  const { role } = useAuth();
  const isOwner = role === 'RESTAURANT_OWNER' || role === 'PLATFORM_ADMIN';

  const navItems = [
    { to: '/restaurant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/restaurant/tables', label: 'Tables & Floor', icon: Grid },
    { to: '/restaurant/orders', label: 'Live Orders', icon: ClipboardList },
    { to: '/restaurant/order-history', label: 'Order History', icon: History },
    { to: '/restaurant/billing', label: 'Billing & Payments', icon: CreditCard },
    { to: '/restaurant/queue', label: 'Waiting Queue', icon: Users },
    { to: '/restaurant/reservations', label: 'Reservations', icon: CalendarDays },
    { to: '/restaurant/customers', label: 'Customers', icon: UserCheck },
    { to: '/restaurant/menu', label: 'Menu Catalog', icon: Utensils },
    ...(isOwner ? [{ to: '/restaurant/staff', label: 'Staff Roster', icon: ShieldCheck }] : []),
    { to: '/restaurant/reports', label: 'Reports & Analytics', icon: BarChart3 },
  ];

  return (
    <nav
      style={{
        backgroundColor: 'rgba(11, 17, 33, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: '58px',
        zIndex: 40,
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          gap: '0.35rem',
          alignItems: 'center',
          minWidth: 'max-content',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/restaurant/dashboard'}
              style={({ isActive }) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.85rem 0.95rem',
                fontSize: '0.82rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? '#f8fafc' : 'var(--text-muted)',
                borderBottom: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
              })}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default RestaurantSubNav;
