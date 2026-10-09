import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  Building2,
  Activity,
  CheckCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Search,
  Check,
  X,
  Receipt,
  Utensils,
  PlusCircle,
  Eye,
  Send,
  Sliders,
  BarChart3,
} from 'lucide-react';
import {
  getDashboardStatsApi,
  getApplicationsApi,
  approveApplicationApi,
  rejectApplicationApi,
  getRestaurantsApi,
  getRestaurantDetailsApi,
  updateRestaurantStatusApi,
  submitApplicationApi,
  seedSampleApplicationsApi,
} from '../../services/adminService';
import { getPlatformReportsApi } from '../../services/reportService';

const AdminDashboardPage = () => {
  const { user, token } = useAuth();

  // Active Tab: 'overview' | 'applications' | 'restaurants' | 'apply'
  const [activeTab, setActiveTab] = useState('overview');

  // Dashboard Stats State
  const [stats, setStats] = useState(null);
  const [platformReports, setPlatformReports] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Applications State
  const [applications, setApplications] = useState([]);
  const [appFilter, setAppFilter] = useState('ALL');
  const [appSearch, setAppSearch] = useState('');
  const [loadingApps, setLoadingApps] = useState(false);
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectModalApp, setRejectModalApp] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Restaurants State
  const [restaurants, setRestaurants] = useState([]);
  const [restFilter, setRestFilter] = useState('ALL');
  const [restSearch, setRestSearch] = useState('');
  const [loadingRests, setLoadingRests] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Notifications & Modals
  const [notice, setNotice] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Application Submission Form State
  const [form, setForm] = useState({
    restaurantName: '',
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    address: '',
    city: '',
    state: '',
    cuisine: '',
    notes: '',
  });

  // 1. Fetch Dashboard Stats & Platform Reports
  const loadDashboardStats = useCallback(async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      const [data, reportData] = await Promise.all([
        getDashboardStatsApi(token),
        getPlatformReportsApi(token).catch((err) => {
          console.warn('Failed to load platform reports:', err.message);
          return null;
        }),
      ]);
      setStats(data);
      if (reportData) setPlatformReports(reportData);
    } catch (err) {
      console.warn('Failed to load stats:', err.message);
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  // 2. Fetch Applications
  const loadApplications = useCallback(async () => {
    if (!token) return;
    setLoadingApps(true);
    try {
      const res = await getApplicationsApi(token, { status: appFilter, search: appSearch });
      setApplications(res.applications || []);
    } catch (err) {
      console.warn('Failed to load applications:', err.message);
    } finally {
      setLoadingApps(false);
    }
  }, [token, appFilter, appSearch]);

  // 3. Fetch Restaurants
  const loadRestaurants = useCallback(async () => {
    if (!token) return;
    setLoadingRests(true);
    try {
      const res = await getRestaurantsApi(token, { status: restFilter, search: restSearch });
      setRestaurants(res.restaurants || []);
    } catch (err) {
      console.warn('Failed to load restaurants:', err.message);
    } finally {
      setLoadingRests(false);
    }
  }, [token, restFilter, restSearch]);

  // Initial Load
  useEffect(() => {
    loadDashboardStats();
    loadApplications();
    loadRestaurants();
  }, [loadDashboardStats, loadApplications, loadRestaurants]);

  // Handle Approve Application
  const handleApprove = async (appId) => {
    setActionLoading(true);
    try {
      const res = await approveApplicationApi(token, appId);
      setNotice({
        type: 'success',
        text: `Application for "${res.data.restaurant.name}" approved successfully! Created owner account for ${res.data.owner.email}.`,
      });
      setSelectedApp(null);
      await Promise.all([loadApplications(), loadRestaurants(), loadDashboardStats()]);
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Approval failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Application
  const handleReject = async () => {
    if (!rejectModalApp) return;
    setActionLoading(true);
    try {
      await rejectApplicationApi(token, rejectModalApp._id, rejectReason);
      setNotice({
        type: 'warning',
        text: `Application for "${rejectModalApp.restaurantName}" has been rejected.`,
      });
      setRejectModalApp(null);
      setRejectReason('');
      setSelectedApp(null);
      await Promise.all([loadApplications(), loadDashboardStats()]);
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Rejection failed' });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Update Restaurant Status (Suspend/Activate)
  const handleStatusChange = async (restaurantId, newStatus) => {
    setActionLoading(true);
    try {
      await updateRestaurantStatusApi(token, restaurantId, newStatus);
      setNotice({
        type: 'success',
        text: `Restaurant status updated to ${newStatus}.`,
      });
      await Promise.all([loadRestaurants(), loadDashboardStats()]);
      if (selectedRestaurant?._id === restaurantId) {
        const refreshed = await getRestaurantDetailsApi(token, restaurantId);
        setSelectedRestaurant(refreshed);
      }
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to update status' });
    } finally {
      setActionLoading(false);
    }
  };

  // View Restaurant Details
  const handleViewRestaurant = async (id) => {
    try {
      const res = await getRestaurantDetailsApi(token, id);
      setSelectedRestaurant(res);
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to fetch details' });
    }
  };

  // Handle Submit New Application (Simulator)
  const handleSubmitApp = async (e) => {
    e.preventDefault();
    if (!form.restaurantName || !form.applicantName || !form.applicantEmail) {
      setNotice({ type: 'error', text: 'Please fill in all required fields.' });
      return;
    }
    setActionLoading(true);
    try {
      await submitApplicationApi(form);
      setNotice({
        type: 'success',
        text: `Application for "${form.restaurantName}" submitted! Check the Applications tab to approve or reject.`,
      });
      setForm({
        restaurantName: '',
        applicantName: '',
        applicantEmail: '',
        applicantPhone: '',
        address: '',
        city: '',
        state: '',
        cuisine: '',
        notes: '',
      });
      setActiveTab('applications');
      await Promise.all([loadApplications(), loadDashboardStats()]);
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to submit application' });
    } finally {
      setActionLoading(false);
    }
  };

  // Seed sample applications
  const handleSeedSamples = async () => {
    setActionLoading(true);
    try {
      await seedSampleApplicationsApi();
      setNotice({ type: 'success', text: 'Sample applications initialized! Check the Applications tab.' });
      await Promise.all([loadApplications(), loadDashboardStats()]);
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to seed sample applications' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-cyan">Platform Admin Space</span>
            <span className="badge badge-success">Active Operations</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>
            Platform Administration Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Logged In: <code>{user?.email}</code> • Role: <strong>{user?.role}</strong> • Global Multi-Tenant Authority
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleSeedSamples}
            disabled={actionLoading}
            className="btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
          >
            <PlusCircle size={14} /> Seed Sample Applications
          </button>
          <button
            onClick={() => {
              loadDashboardStats();
              loadApplications();
              loadRestaurants();
            }}
            disabled={loadingStats || loadingApps || loadingRests}
            className="btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loadingStats ? 'spin-anim' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: notice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : notice.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          border: `1px solid ${notice.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : notice.type === 'warning' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
          borderRadius: 'var(--radius-sm)',
          padding: '0.85rem 1.25rem',
          fontSize: '0.9rem',
          color: notice.type === 'error' ? '#fca5a5' : notice.type === 'warning' ? '#fde68a' : '#a7f3d0',
        }}>
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '0.5rem',
        borderBottom: '1px solid var(--border-subtle)',
        paddingBottom: '0.5rem',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          className={activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Activity size={15} /> Overview & Analytics
        </button>
        <button
          onClick={() => setActiveTab('applications')}
          className={activeTab === 'applications' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Clock size={15} /> Restaurant Applications
          {stats?.applications?.pending > 0 && (
            <span style={{
              background: 'var(--accent-warning)',
              color: '#000',
              borderRadius: '999px',
              padding: '0.1rem 0.45rem',
              fontSize: '0.7rem',
              fontWeight: 800,
              marginLeft: '0.35rem'
            }}>
              {stats.applications.pending}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('restaurants')}
          className={activeTab === 'restaurants' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <Building2 size={15} /> Restaurant Management ({restaurants.length})
        </button>
        <button
          onClick={() => setActiveTab('apply')}
          className={activeTab === 'apply' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
        >
          <PlusCircle size={15} /> Submit Application (Simulator)
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* KPI Analytics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>TOTAL RESTAURANTS</span>
                <Building2 size={18} color="var(--accent-primary)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {stats?.restaurants?.total ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>
                {stats?.restaurants?.active ?? 0} active • {stats?.restaurants?.suspended ?? 0} suspended
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>PENDING APPLICATIONS</span>
                <Clock size={18} color="var(--accent-warning)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-warning)' }}>
                {stats?.applications?.pending ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Awaiting onboarding review
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>PLATFORM ORDERS</span>
                <Utensils size={18} color="var(--accent-cyan)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {stats?.orders?.total ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
                Orders across all tenants
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>PLATFORM REVENUE</span>
                <Receipt size={18} color="var(--accent-success)" />
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-success)' }}>
                ₹{stats?.revenue?.total?.toLocaleString('en-IN') ?? 0}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--accent-success)', marginTop: '0.25rem' }}>
                Aggregated paid bills
              </div>
            </div>
          </div>

          {/* Quick Onboarding Workflow Overview */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={20} color="var(--accent-primary)" />
              Platform Admin Workflow
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-cyan">Step 1</span>
                  <strong>Review Applications</strong>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Inspect applicant info, restaurant address, and cuisine. Decide whether to approve or reject.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-success">Step 2</span>
                  <strong>Automated Restaurant Creation</strong>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Approving automatically provisions the Restaurant and links a <code>RESTAURANT_OWNER</code> user account.
                </p>
              </div>

              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <span className="badge badge-danger">Step 3</span>
                  <strong>Status Governance</strong>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  Suspend violating restaurants on demand. Access control middleware blocks suspended restaurants from operational access.
                </p>
              </div>
            </div>
          </div>

          {/* Platform Reports & Restaurant Activity */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={20} color="var(--accent-primary)" />
                  Restaurant Activity & Performance Roster
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  Live business activity metrics: orders processed, gross revenue collected, and operational status.
                </p>
              </div>
            </div>

            {platformReports?.restaurantActivity && platformReports.restaurantActivity.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem' }}>RESTAURANT</th>
                      <th style={{ padding: '0.75rem' }}>CITY / STATE</th>
                      <th style={{ padding: '0.75rem' }}>STATUS</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>ORDERS</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>GROSS REVENUE</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>LAST ORDER</th>
                    </tr>
                  </thead>
                  <tbody>
                    {platformReports.restaurantActivity.map((r) => (
                      <tr key={r.restaurantId} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '600', color: 'var(--text-main)' }}>
                          {r.name}
                        </td>
                        <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>
                          {r.city || 'N/A'}{r.state ? `, ${r.state}` : ''}
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span
                            className={`badge ${
                              r.status === 'ACTIVE'
                                ? 'badge-success'
                                : r.status === 'SUSPENDED'
                                ? 'badge-danger'
                                : 'badge-warning'
                            }`}
                          >
                            {r.status}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>
                          {r.orderCount}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', color: '#4ade80' }}>
                          ₹{(r.totalRevenue || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', color: 'var(--text-muted)' }}>
                          {r.lastOrderDate ? new Date(r.lastOrderDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
                No tenant activity records found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RESTAURANT APPLICATIONS */}
      {activeTab === 'applications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Filters & Search */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setAppFilter(st)}
                  className={appFilter === st ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search applicant or restaurant..."
                value={appSearch}
                onChange={(e) => setAppSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Applications List */}
          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>RESTAURANT</th>
                  <th style={{ padding: '0.75rem' }}>APPLICANT</th>
                  <th style={{ padding: '0.75rem' }}>CITY / STATE</th>
                  <th style={{ padding: '0.75rem' }}>CUISINE</th>
                  <th style={{ padding: '0.75rem' }}>STATUS</th>
                  <th style={{ padding: '0.75rem' }}>SUBMITTED</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {applications.length > 0 ? (
                  applications.map((app) => (
                    <tr key={app._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {app.restaurantName}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div>{app.applicantName}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{app.applicantEmail}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>
                        {app.city}, {app.state}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        {app.cuisine?.join(', ') || 'General'}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span className={`badge ${app.status === 'APPROVED' ? 'badge-success' : app.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        {new Date(app.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => setSelectedApp(app)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            title="View Details"
                          >
                            <Eye size={13} />
                          </button>
                          {app.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(app._id)}
                                disabled={actionLoading}
                                className="btn-primary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}
                                title="Approve Restaurant"
                              >
                                <Check size={13} /> Approve
                              </button>
                              <button
                                onClick={() => {
                                  setRejectModalApp(app);
                                  setRejectReason('');
                                }}
                                disabled={actionLoading}
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--accent-danger)' }}
                                title="Reject Application"
                              >
                                <X size={13} /> Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No applications found. Click "Seed Sample Applications" above or use the "Submit Application" tab!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RESTAURANT MANAGEMENT */}
      {activeTab === 'restaurants' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Filters & Search */}
          <div className="glass-panel" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['ALL', 'ACTIVE', 'SUSPENDED', 'PENDING'].map((st) => (
                <button
                  key={st}
                  onClick={() => setRestFilter(st)}
                  className={restFilter === st ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(15, 23, 42, 0.8)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <Search size={16} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search restaurant by name or city..."
                value={restSearch}
                onChange={(e) => setRestSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Restaurants List Table */}
          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>RESTAURANT</th>
                  <th style={{ padding: '0.75rem' }}>OWNER</th>
                  <th style={{ padding: '0.75rem' }}>LOCATION</th>
                  <th style={{ padding: '0.75rem' }}>TABLES</th>
                  <th style={{ padding: '0.75rem' }}>PLAN</th>
                  <th style={{ padding: '0.75rem' }}>STATUS</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.length > 0 ? (
                  restaurants.map((r) => (
                    <tr key={r._id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                      <td style={{ padding: '0.85rem 0.75rem', fontWeight: 600 }}>
                        <div style={{ color: 'var(--text-main)' }}>{r.name}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}><code>{r._id}</code></div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <div>{r.ownerId?.name || 'Owner Assigned'}</div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{r.ownerId?.email || r.email}</div>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', color: 'var(--text-muted)' }}>
                        {r.city}, {r.state}
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span className="badge badge-cyan">{r.stats?.tables ?? 0} Tables</span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span className="badge badge-cyan">{r.subscriptionPlan}</span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem' }}>
                        <span className={`badge ${r.status === 'ACTIVE' ? 'badge-success' : r.status === 'SUSPENDED' ? 'badge-danger' : 'badge-warning'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: '0.85rem 0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => handleViewRestaurant(r._id)}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
                            title="View Full Profile"
                          >
                            <Eye size={13} /> Details
                          </button>
                          {r.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleStatusChange(r._id, 'SUSPENDED')}
                              disabled={actionLoading}
                              className="btn-secondary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--accent-danger)' }}
                              title="Suspend Restaurant"
                            >
                              <AlertTriangle size={13} /> Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(r._id, 'ACTIVE')}
                              disabled={actionLoading}
                              className="btn-primary"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}
                              title="Activate Restaurant"
                            >
                              <CheckCircle size={13} /> Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No restaurants found matching current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SUBMIT APPLICATION (SIMULATOR) */}
      {activeTab === 'apply' && (
        <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', margin: 0 }}>Restaurant Onboarding Application Simulator</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              Simulates a new restaurant owner submitting an onboarding application to test the approval workflow.
            </p>
          </div>

          <form onSubmit={handleSubmitApp} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spice Symphony"
                  value={form.restaurantName}
                  onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Applicant Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={form.applicantName}
                  onChange={(e) => setForm({ ...form, applicantName: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Applicant Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@spicesymphony.com"
                  value={form.applicantEmail}
                  onChange={(e) => setForm({ ...form, applicantEmail: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Contact Phone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+91 98000 12345"
                  value={form.applicantPhone}
                  onChange={(e) => setForm({ ...form, applicantPhone: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  City *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ahmedabad"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  State *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Gujarat"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Cuisine (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mughlai, North Indian"
                  value={form.cuisine}
                  onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                  style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 55 SG Highway"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff' }}
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="btn-primary"
              style={{ marginTop: '0.5rem', padding: '0.85rem 1.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
            >
              <Send size={16} /> Submit Application
            </button>
          </form>
        </div>
      )}

      {/* MODAL 1: VIEW APPLICATION DETAILS */}
      {selectedApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge badge-cyan" style={{ marginBottom: '0.35rem' }}>Application Detail</span>
                <h3 style={{ fontSize: '1.3rem', margin: 0 }}>{selectedApp.restaurantName}</h3>
              </div>
              <button onClick={() => setSelectedApp(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Applicant Name</div>
                <div style={{ fontWeight: 600 }}>{selectedApp.applicantName}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Email</div>
                <div style={{ fontWeight: 600 }}>{selectedApp.applicantEmail}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Phone</div>
                <div style={{ fontWeight: 600 }}>{selectedApp.applicantPhone}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Status</div>
                <span className={`badge ${selectedApp.status === 'APPROVED' ? 'badge-success' : selectedApp.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                  {selectedApp.status}
                </span>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--text-dim)' }}>Address</div>
                <div>{selectedApp.address}, {selectedApp.city}, {selectedApp.state}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--text-dim)' }}>Cuisine</div>
                <div>{selectedApp.cuisine?.join(', ') || 'N/A'}</div>
              </div>
              {selectedApp.notes && (
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ color: 'var(--text-dim)' }}>Notes</div>
                  <div style={{ color: 'var(--text-muted)' }}>{selectedApp.notes}</div>
                </div>
              )}
              {selectedApp.rejectionReason && (
                <div style={{ gridColumn: 'span 2', background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                  <div style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>Rejection Reason:</div>
                  <div style={{ color: '#fca5a5' }}>{selectedApp.rejectionReason}</div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button onClick={() => setSelectedApp(null)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                Close
              </button>
              {selectedApp.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => {
                      setRejectModalApp(selectedApp);
                      setRejectReason('');
                    }}
                    className="btn-secondary"
                    style={{ color: 'var(--accent-danger)', padding: '0.5rem 1rem' }}
                  >
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(selectedApp._id)}
                    disabled={actionLoading}
                    className="btn-primary"
                    style={{ background: 'var(--accent-success)', borderColor: 'var(--accent-success)', padding: '0.5rem 1.25rem' }}
                  >
                    Approve Application
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REJECT REASON DIALOG */}
      {rejectModalApp && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1100,
          padding: '1rem',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--accent-danger)' }}>
              Reject Application
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              Provide a reason for rejecting the onboarding application for <strong>{rejectModalApp.restaurantName}</strong>.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Incomplete restaurant address or verification documents could not be validated."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.8)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', color: '#fff', fontSize: '0.85rem' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setRejectModalApp(null)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="btn-primary"
                style={{ background: 'var(--accent-danger)', borderColor: 'var(--accent-danger)', padding: '0.5rem 1rem' }}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW RESTAURANT DETAILS & METRICS */}
      {selectedRestaurant && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '640px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span className="badge badge-cyan">Restaurant Profile</span>
                  <span className={`badge ${selectedRestaurant.restaurant?.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                    {selectedRestaurant.restaurant?.status}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.4rem', margin: 0 }}>{selectedRestaurant.restaurant?.name}</h3>
              </div>
              <button onClick={() => setSelectedRestaurant(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TABLES</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedRestaurant.stats?.totalTables ?? 0}</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>MENU ITEMS</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedRestaurant.stats?.totalMenuItems ?? 0}</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ORDERS</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{selectedRestaurant.stats?.totalOrders ?? 0}</div>
              </div>
              <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>REVENUE</div>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--accent-success)' }}>
                  ₹{(selectedRestaurant.stats?.totalRevenue ?? 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Profile Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Owner</div>
                <div style={{ fontWeight: 600 }}>{selectedRestaurant.restaurant?.ownerId?.name || 'N/A'}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{selectedRestaurant.restaurant?.ownerId?.email}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Contact Phone</div>
                <div style={{ fontWeight: 600 }}>{selectedRestaurant.restaurant?.phone}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--text-dim)' }}>Address</div>
                <div>{selectedRestaurant.restaurant?.address}, {selectedRestaurant.restaurant?.city}, {selectedRestaurant.restaurant?.state}</div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ color: 'var(--text-dim)' }}>Cuisine Types</div>
                <div>{selectedRestaurant.restaurant?.cuisine?.join(', ') || 'General'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
              <div>
                {selectedRestaurant.restaurant?.status === 'ACTIVE' ? (
                  <button
                    onClick={() => handleStatusChange(selectedRestaurant.restaurant._id, 'SUSPENDED')}
                    disabled={actionLoading}
                    className="btn-secondary"
                    style={{ color: 'var(--accent-danger)' }}
                  >
                    <AlertTriangle size={14} /> Suspend Restaurant
                  </button>
                ) : (
                  <button
                    onClick={() => handleStatusChange(selectedRestaurant.restaurant._id, 'ACTIVE')}
                    disabled={actionLoading}
                    className="btn-primary"
                    style={{ background: 'var(--accent-success)', borderColor: 'var(--accent-success)' }}
                  >
                    <CheckCircle size={14} /> Activate Restaurant
                  </button>
                )}
              </div>
              <button onClick={() => setSelectedRestaurant(null)} className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
