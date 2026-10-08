import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Utensils,
  CreditCard,
  LayoutGrid,
  Calendar,
  RefreshCw,
  Award,
  Layers,
  ArrowUpRight,
  PieChart,
  ShoppingBag,
  Clock,
  AlertCircle,
  X,
} from 'lucide-react';
import { getRestaurantReportsApi } from '../../services/reportService';

const ReportsPage = () => {
  const { token, restaurant } = useAuth();
  const currency = restaurant?.settings?.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  // State
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [datePreset, setDatePreset] = useState('30days'); // 'today' | '7days' | '30days' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTrendView, setActiveTrendView] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getRestaurantReportsApi(token, {
        datePreset: datePreset !== 'custom' ? datePreset : undefined,
        startDate: datePreset === 'custom' && startDate ? startDate : undefined,
        endDate: datePreset === 'custom' && endDate ? endDate : undefined,
      });
      setReports(data);
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to load restaurant analytics reports.' });
    } finally {
      setLoading(false);
    }
  }, [token, datePreset, startDate, endDate]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Max value calculation for bar chart relative heights
  const currentTrendData = activeTrendView === 'daily'
    ? reports?.dailySales || []
    : activeTrendView === 'weekly'
    ? reports?.weeklySales || []
    : reports?.monthlySales || [];

  const maxRevenueInTrend = Math.max(...currentTrendData.map((d) => d.revenue || 0), 1);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#818cf8',
              }}
            >
              <BarChart3 size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                Restaurant Reports & Analytics
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Real database performance reports: revenue trends, top-selling dishes, payment methods, and table utilization.
              </p>
            </div>
          </div>
        </div>

        {/* Date Filter & Refresh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '0.25rem' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'custom', label: 'Custom' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setDatePreset(p.id)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: datePreset === p.id ? 'var(--primary)' : 'transparent',
                  color: datePreset === p.id ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={loadReports}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem' }}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Custom Date Range selector if active */}
      {datePreset === 'custom' && (
        <div
          className="glass-panel"
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={15} /> Select Report Period:
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
            }}
          />
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
            }}
          />
          <button
            onClick={loadReports}
            className="btn btn-primary"
            style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Notice Alert */}
      {notice && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} />
            <span>{notice.text}</span>
          </div>
          <button onClick={() => setNotice(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {loading && !reports ? (
        <div style={{ textAlign: 'center', padding: '5rem 0' }}>
          <RefreshCw size={36} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Calculating database aggregations...</p>
        </div>
      ) : (
        <>
          {/* Top KPI Metrics Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.7)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Gross Sales Revenue
                  </p>
                  <h3 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#4ade80', margin: '0.35rem 0 0 0' }}>
                    {currencySymbol}{(reports?.kpis?.totalRevenue || 0).toLocaleString()}
                  </h3>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
                  <DollarSign size={22} />
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.65rem 0 0 0' }}>
                Net sales from settled dining orders
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.7)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Total Orders Placed
                  </p>
                  <h3 style={{ fontSize: '1.85rem', fontWeight: '800', color: 'var(--text-main)', margin: '0.35rem 0 0 0' }}>
                    {(reports?.kpis?.totalOrders || 0).toLocaleString()}
                  </h3>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                  <ShoppingBag size={22} />
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.65rem 0 0 0' }}>
                {reports?.kpis?.completedOrders || 0} completed • {reports?.kpis?.cancelledOrders || 0} cancelled
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.7)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Average Order Value (AOV)
                  </p>
                  <h3 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#fbbf24', margin: '0.35rem 0 0 0' }}>
                    {currencySymbol}{(reports?.kpis?.aov || 0).toLocaleString()}
                  </h3>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                  <TrendingUp size={22} />
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.65rem 0 0 0' }}>
                Average ticket size per dining party
              </p>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '14px', background: 'rgba(15, 23, 42, 0.7)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Settled Bills
                  </p>
                  <h3 style={{ fontSize: '1.85rem', fontWeight: '800', color: '#38bdf8', margin: '0.35rem 0 0 0' }}>
                    {(reports?.kpis?.paidOrders || 0).toLocaleString()}
                  </h3>
                </div>
                <div style={{ padding: '0.6rem', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  <CreditCard size={22} />
                </div>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0.65rem 0 0 0' }}>
                Paid in full via Cash, Card, or UPI
              </p>
            </div>
          </div>

          {/* Sales Trends Chart Panel */}
          <div
            className="glass-panel"
            style={{
              padding: '1.75rem',
              borderRadius: '16px',
              marginBottom: '2rem',
              background: 'rgba(15, 23, 42, 0.75)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                  Revenue & Sales Progression
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  Aggregated revenue and volume over the selected timeframe
                </p>
              </div>

              {/* View Selector: Daily, Weekly, Monthly */}
              <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '8px', padding: '0.2rem' }}>
                {['daily', 'weekly', 'monthly'].map((view) => (
                  <button
                    key={view}
                    onClick={() => setActiveTrendView(view)}
                    style={{
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: 'none',
                      background: activeTrendView === view ? 'rgba(99, 102, 241, 0.3)' : 'transparent',
                      color: activeTrendView === view ? '#818cf8' : 'var(--text-muted)',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Bar Graph */}
            {currentTrendData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                No completed orders recorded in this date range.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: '0.75rem',
                    height: '220px',
                    padding: '1rem 0 0.5rem 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    overflowX: 'auto',
                  }}
                >
                  {currentTrendData.map((d, index) => {
                    const heightPercent = Math.max(12, Math.round(((d.revenue || 0) / maxRevenueInTrend) * 100));
                    const label = d.date ? d.date.slice(5) : d.weekLabel || d.monthLabel || `P${index + 1}`;

                    return (
                      <div
                        key={index}
                        style={{
                          flex: '1 0 36px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          height: '100%',
                          justifyContent: 'flex-end',
                        }}
                        title={`${label}: ${currencySymbol}${(d.revenue || 0).toLocaleString()} (${d.orderCount} orders)`}
                      >
                        <span style={{ fontSize: '0.7rem', color: '#4ade80', fontWeight: '600' }}>
                          {currencySymbol}{d.revenue >= 1000 ? `${Math.round(d.revenue / 1000)}k` : d.revenue}
                        </span>
                        <div
                          style={{
                            width: '28px',
                            height: `${heightPercent}%`,
                            background: 'linear-gradient(180deg, #6366f1, #3b82f6)',
                            borderRadius: '6px 6px 2px 2px',
                            transition: 'height 0.3s ease',
                          }}
                        />
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Grid: Top Selling Dishes & Payment Method Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Top-Selling Dishes */}
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.75)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Award size={18} color="#fbbf24" /> Top-Selling Menu Items
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Ranked by total quantity ordered & revenue generated
                  </p>
                </div>
              </div>

              {reports?.topSellingItems && reports.topSellingItems.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {reports.topSellingItems.map((item, idx) => {
                    const topQty = reports.topSellingItems[0].quantitySold || 1;
                    const percent = Math.round((item.quantitySold / topQty) * 100);

                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                          <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                            <span style={{ color: 'var(--text-muted)', marginRight: '0.4rem' }}>#{idx + 1}</span>
                            {item.name}
                          </span>
                          <span style={{ fontWeight: '700', color: '#4ade80' }}>
                            {currencySymbol}{(item.totalRevenue || 0).toLocaleString()}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ flex: 1, height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: '3px' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '70px', textAlign: 'right' }}>
                            {item.quantitySold} sold
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No item sales data available yet.
                </div>
              )}
            </div>

            {/* Payment Method Breakdown */}
            <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.75)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <PieChart size={18} color="#818cf8" /> Payment Method Breakdown
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                    Settled distribution across UPI, Cards, and Cash
                  </p>
                </div>
              </div>

              {reports?.paymentBreakdown && reports.paymentBreakdown.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {reports.paymentBreakdown.map((pm, idx) => (
                    <div key={idx} style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: pm.method === 'UPI' ? '#38bdf8' : pm.method === 'CARD' ? '#c084fc' : '#4ade80',
                            }}
                          >
                            {pm.method}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ({pm.count} transactions)
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontWeight: '700', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                            {currencySymbol}{(pm.totalAmount || 0).toLocaleString()}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                            {pm.percentage}%
                          </span>
                        </div>
                      </div>

                      <div style={{ height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${pm.percentage}%`,
                            height: '100%',
                            background:
                              pm.method === 'UPI'
                                ? 'linear-gradient(90deg, #0284c7, #38bdf8)'
                                : pm.method === 'CARD'
                                ? 'linear-gradient(90deg, #9333ea, #c084fc)'
                                : 'linear-gradient(90deg, #16a34a, #4ade80)',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '2.5rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  No settled payments found in this period.
                </div>
              )}
            </div>
          </div>

          {/* Table Utilization Matrix */}
          <div className="glass-panel" style={{ padding: '1.75rem', borderRadius: '16px', background: 'rgba(15, 23, 42, 0.75)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LayoutGrid size={18} color="#38bdf8" /> Dining Table Utilization
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                  Orders handled and revenue produced by individual floor tables
                </p>
              </div>
            </div>

            {reports?.tableUtilization && reports.tableUtilization.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0, 0, 0, 0.3)', borderBottom: '1px solid var(--border-subtle)' }}>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Table</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Section</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: '600' }}>Capacity</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'center' }}>Total Orders</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Average Ticket</th>
                      <th style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.tableUtilization.map((tu) => (
                      <tr key={tu.tableId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: '700', color: 'var(--text-main)' }}>
                          Table {tu.tableNumber}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                          {tu.section}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                          {tu.capacity} seats
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: '600', color: 'var(--text-main)' }}>
                          {tu.orderCount}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {currencySymbol}{(tu.aov || 0).toLocaleString()}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '700', color: '#4ade80' }}>
                          {currencySymbol}{(tu.totalRevenue || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No table utilization records found for this period.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;
