import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  Shield,
  Briefcase,
  UserCheck,
  UserX,
  LayoutGrid,
  List,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  Power,
  Edit2,
} from 'lucide-react';
import {
  getStaffApi,
  getStaffSummaryApi,
  createStaffApi,
  updateStaffApi,
  toggleStaffStatusApi,
  STAFF_DESIGNATIONS,
} from '../../services/staffService';
import StaffCard from '../../components/restaurant/StaffCard';
import StaffModal from '../../components/restaurant/StaffModal';

const StaffManagementPage = () => {
  const { token, user } = useAuth();
  const currentUserId = user?.id;

  // Data State
  const [staffList, setStaffList] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [designationFilter, setDesignationFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Fetch Staff & Summary Data
  const loadStaffData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [listRes, sumRes] = await Promise.all([
        getStaffApi(token, {
          search: searchQuery.trim() || undefined,
          status: statusFilter,
          designation: designationFilter,
        }).catch((err) => {
          console.warn('Staff list warning:', err.message);
          return { data: [] };
        }),
        getStaffSummaryApi(token).catch((err) => {
          console.warn('Staff summary warning:', err.message);
          return null;
        }),
      ]);

      setStaffList(listRes.data || []);
      if (sumRes) setSummary(sumRes);
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to load staff roster.' });
    } finally {
      setLoading(false);
    }
  }, [token, searchQuery, statusFilter, designationFilter]);

  useEffect(() => {
    loadStaffData();
  }, [loadStaffData]);

  // Handle modal submit (Add or Edit)
  const handleSaveStaff = async (staffData) => {
    setIsProcessing(true);
    try {
      if (editingStaff) {
        await updateStaffApi(token, editingStaff._id, staffData);
        setNotice({ type: 'success', text: `Updated details for ${staffData.name}.` });
      } else {
        await createStaffApi(token, staffData);
        setNotice({ type: 'success', text: `Successfully onboarded ${staffData.name}.` });
      }
      setIsModalOpen(false);
      setEditingStaff(null);
      await loadStaffData();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Operation failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle toggle status (Activate / Deactivate)
  const handleToggleStatus = async (staff) => {
    if (staff._id === currentUserId) {
      setNotice({ type: 'error', text: 'You cannot deactivate your own account.' });
      return;
    }

    try {
      const updated = await toggleStaffStatusApi(token, staff._id);
      setNotice({
        type: 'success',
        text: `${staff.name} is now ${updated.status === 'ACTIVE' ? 'Active' : 'Deactivated'}.`,
      });
      await loadStaffData();
    } catch (err) {
      setNotice({ type: 'error', text: err.message || 'Failed to update staff status.' });
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Page Header */}
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
              <Users size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                Staff Management
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                Manage restaurant roster, assign floor roles, provision credentials, and toggle account access.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={loadStaffData}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1rem' }}
            title="Refresh Staff Roster"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => {
              setEditingStaff(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            <Plus size={18} />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Notice Banner */}
      {notice && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            marginBottom: '1.5rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background:
              notice.type === 'error'
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(34, 197, 94, 0.15)',
            border:
              notice.type === 'error'
                ? '1px solid rgba(239, 68, 68, 0.3)'
                : '1px solid rgba(34, 197, 94, 0.3)',
            color: notice.type === 'error' ? '#f87171' : '#4ade80',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {notice.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{notice.text}</span>
          </div>
          <button
            onClick={() => setNotice(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Total Roster
              </p>
              <h3 style={{ fontSize: '1.65rem', fontWeight: '700', color: 'var(--text-main)', margin: '0.25rem 0 0 0' }}>
                {summary?.totalStaff ?? staffList.length}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              <Users size={20} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
            All provisioned team members
          </p>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active On-Duty
              </p>
              <h3 style={{ fontSize: '1.65rem', fontWeight: '700', color: '#4ade80', margin: '0.25rem 0 0 0' }}>
                {summary?.activeStaff ?? staffList.filter((s) => s.status === 'ACTIVE').length}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#4ade80' }}>
              <UserCheck size={20} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
            Eligible to log in and operate POS
          </p>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Inactive / Suspended
              </p>
              <h3 style={{ fontSize: '1.65rem', fontWeight: '700', color: '#f87171', margin: '0.25rem 0 0 0' }}>
                {summary?.inactiveStaff ?? staffList.filter((s) => s.status === 'INACTIVE').length}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171' }}>
              <UserX size={20} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
            Account suspended from system access
          </p>
        </div>

        <div
          className="glass-panel"
          style={{
            padding: '1.25rem',
            borderRadius: '12px',
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Operational Roles
              </p>
              <h3 style={{ fontSize: '1.65rem', fontWeight: '700', color: '#fbbf24', margin: '0.25rem 0 0 0' }}>
                {summary?.designations ? Object.keys(summary.designations).length : STAFF_DESIGNATIONS.length}
              </h3>
            </div>
            <div style={{ padding: '0.5rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
              <Briefcase size={20} />
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>
            Distinct floor designations assigned
          </p>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem',
          borderRadius: '12px',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          {/* Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.25rem',
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Status Tab Filter */}
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '8px', padding: '0.2rem' }}>
            {['ALL', 'ACTIVE', 'INACTIVE'].map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: statusFilter === tab ? 'var(--primary)' : 'transparent',
                  color: statusFilter === tab ? '#fff' : 'var(--text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'ALL' ? 'All' : tab === 'ACTIVE' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>

          {/* Designation Dropdown */}
          <div style={{ minWidth: '170px' }}>
            <select
              value={designationFilter}
              onChange={(e) => setDesignationFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            >
              <option value="ALL">All Designations</option>
              {STAFF_DESIGNATIONS.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '8px', padding: '0.2rem' }}>
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: '0.4rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'grid' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
              }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '0.4rem',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'table' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                color: viewMode === 'table' ? 'var(--text-main)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
              }}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Staff Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0' }}>
          <RefreshCw size={32} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem auto' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading staff roster...</p>
        </div>
      ) : staffList.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '3.5rem 1.5rem',
            textAlign: 'center',
            borderRadius: '16px',
            border: '1px dashed var(--border-subtle)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(99, 102, 241, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              color: '#818cf8',
            }}
          >
            <Users size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: '600', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
            No staff members found
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            {searchQuery || statusFilter !== 'ALL' || designationFilter !== 'ALL'
              ? 'No staff match the current filters. Try resetting search parameters.'
              : 'Add your floor staff, chefs, and cashiers so they can log into the restaurant POS.'}
          </p>
          <button
            onClick={() => {
              setEditingStaff(null);
              setIsModalOpen(true);
            }}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem' }}
          >
            <Plus size={16} />
            Onboard First Staff Member
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {staffList.map((member) => (
            <StaffCard
              key={member._id}
              staff={member}
              currentUserId={currentUserId}
              onEdit={(staffToEdit) => {
                setEditingStaff(staffToEdit);
                setIsModalOpen(true);
              }}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div
          className="glass-panel"
          style={{
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Staff Member</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Contact</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Designation</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Access Level</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((member) => {
                  const isActive = member.status === 'ACTIVE';
                  const isOwner = member.role === 'RESTAURANT_OWNER';
                  const isSelf = member._id === currentUserId;

                  return (
                    <tr
                      key={member._id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        background: 'rgba(15, 23, 42, 0.4)',
                        transition: 'background 0.15s',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '8px',
                              background: isOwner
                                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                : 'linear-gradient(135deg, #6366f1, #3b82f6)',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: '600',
                              fontSize: '0.85rem',
                            }}
                          >
                            {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                                {member.name}
                              </span>
                              {isSelf && (
                                <span style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontWeight: '600' }}>
                                  You
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Joined: {member.createdAt ? new Date(member.createdAt).toLocaleDateString() : 'Active'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>{member.email}</div>
                        {member.phone && (
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{member.phone}</div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            background: 'rgba(99, 102, 241, 0.12)',
                            color: '#818cf8',
                            border: '1px solid rgba(99, 102, 241, 0.25)',
                          }}
                        >
                          {member.designation || 'Floor Staff'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            background: isOwner ? 'rgba(245, 158, 11, 0.12)' : 'rgba(148, 163, 184, 0.1)',
                            color: isOwner ? '#fbbf24' : '#94a3b8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Shield size={12} />
                          {isOwner ? 'Restaurant Owner' : 'Floor Staff'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '6px',
                            background: isActive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            color: isActive ? '#4ade80' : '#f87171',
                          }}
                        >
                          {isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => {
                              setEditingStaff(member);
                              setIsModalOpen(true);
                            }}
                            style={{
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid var(--border-subtle)',
                              borderRadius: '6px',
                              padding: '0.4rem',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                            title="Edit Staff Member"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(member)}
                            disabled={isSelf}
                            style={{
                              background: isActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                              border: isActive ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(34, 197, 94, 0.25)',
                              borderRadius: '6px',
                              padding: '0.4rem',
                              color: isActive ? '#f87171' : '#4ade80',
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                              opacity: isSelf ? 0.4 : 1,
                            }}
                            title={isSelf ? 'Cannot deactivate yourself' : isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Staff Add/Edit Modal */}
      <StaffModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingStaff(null);
        }}
        onSubmit={handleSaveStaff}
        initialStaff={editingStaff}
        isProcessing={isProcessing}
      />
    </div>
  );
};

export default StaffManagementPage;
