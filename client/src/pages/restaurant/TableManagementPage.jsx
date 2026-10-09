import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import {
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Users,
  Clock,
  Receipt,
  AlertTriangle,
  X,
  LayoutGrid,
  Zap,
} from 'lucide-react';
import TableCard from '../../components/restaurant/TableCard';
import TableModal from '../../components/restaurant/TableModal';
import ServiceOrchestratorModal from '../../components/restaurant/ServiceOrchestratorModal';
import ConfirmModal from '../../components/common/ConfirmModal';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonGrid } from '../../components/common/LoadingState';
import useToast from '../../hooks/useToast';
import {
  getTablesApi,
  createTableApi,
  updateTableApi,
  updateTableStatusApi,
  deleteTableApi,
} from '../../services/tableService';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Tables' },
  { id: 'AVAILABLE', label: 'Available', color: '#10b981' },
  { id: 'OCCUPIED', label: 'Occupied', color: '#818cf8' },
  { id: 'RESERVED', label: 'Reserved', color: '#f59e0b' },
  { id: 'BILLING', label: 'Billing', color: '#c084fc' },
  { id: 'OUT_OF_SERVICE', label: 'Out of Service', color: '#94a3b8' },
];

const TableManagementPage = () => {
  const { user, token } = useAuth();
  const isOwner = user?.role === 'RESTAURANT_OWNER';
  const toast = useToast();

  // Data State
  const [tables, setTables] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Filters State
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [minSeats, setMinSeats] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [isOrchestratorOpen, setIsOrchestratorOpen] = useState(false);
  const [deactivatingTable, setDeactivatingTable] = useState(null);

  // Load Tables
  const loadTables = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await getTablesApi(token, {
        status: statusFilter,
        section: sectionFilter,
        search: searchQuery,
        minCapacity: minSeats,
      });
      setTables(res.data || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load restaurant tables');
      setNotice({ type: 'error', text: err.message || 'Failed to load restaurant tables' });
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, sectionFilter, searchQuery, minSeats, toast]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  // Unique sections for filtering
  const availableSections = useMemo(() => {
    const set = new Set();
    tables.forEach((t) => {
      if (t.section) set.add(t.section);
    });
    return Array.from(set);
  }, [tables]);

  // Handle Quick Status Transition
  const handleStatusChange = async (tableId, nextStatus) => {
    setProcessingId(tableId);
    try {
      await updateTableStatusApi(token, tableId, nextStatus);
      toast.success(`Table transitioned to ${nextStatus}`);
      setNotice({
        type: 'success',
        text: `Table status transitioned to ${nextStatus}`,
      });
      await loadTables();
    } catch (err) {
      toast.error(err.message || 'Status transition failed');
      setNotice({ type: 'error', text: err.message || 'Status transition failed' });
    } finally {
      setProcessingId(null);
    }
  };

  // Open Modal to Create
  const handleOpenCreate = () => {
    setEditingTable(null);
    setIsModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEdit = (table) => {
    setEditingTable(table);
    setIsModalOpen(true);
  };

  // Handle Modal Submit
  const handleModalSubmit = async (formData) => {
    setModalSaving(true);
    try {
      if (editingTable) {
        await updateTableApi(token, editingTable._id, formData);
        toast.success(`Table ${formData.tableNumber} updated successfully!`);
        setNotice({ type: 'success', text: `Table ${formData.tableNumber} updated successfully!` });
      } else {
        await createTableApi(token, formData);
        toast.success(`Table ${formData.tableNumber} added to floor!`);
        setNotice({ type: 'success', text: `Table ${formData.tableNumber} added to floor!` });
      }
      setIsModalOpen(false);
      await loadTables();
    } catch (err) {
      toast.error(err.message || 'Could not save table configuration');
      setNotice({ type: 'error', text: err.message || 'Could not save table configuration' });
    } finally {
      setModalSaving(false);
    }
  };

  // Handle Deactivate / Delete Table
  const handleDeleteTable = (table) => {
    setDeactivatingTable(table);
  };

  const handleConfirmDeactivate = async () => {
    if (!deactivatingTable) return;
    setProcessingId(deactivatingTable._id);
    try {
      await deleteTableApi(token, deactivatingTable._id, false);
      toast.success(`Table ${deactivatingTable.tableNumber} deactivated.`);
      setNotice({
        type: 'success',
        text: `Table ${deactivatingTable.tableNumber} deactivated.`,
      });
      await loadTables();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate table');
      setNotice({ type: 'error', text: err.message || 'Failed to deactivate table' });
    } finally {
      setProcessingId(null);
      setDeactivatingTable(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Header Banner */}
      <div
        className="glass-panel"
        style={{
          padding: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span className="badge badge-indigo">Floor Management</span>
            {summary && (
              <span className="badge badge-success">{summary.totalTables || tables.length} Tables Active</span>
            )}
          </div>
          <h1 style={{ fontSize: '1.8rem', margin: 0 }}>Restaurant Table Layout</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Real-time floor seating, capacity assignments, and dining lifecycle transitions.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={loadTables}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
            Refresh Floor
          </button>

          <button
            onClick={() => setIsOrchestratorOpen(true)}
            className="btn-primary"
            style={{
              padding: '0.65rem 1.25rem',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
              border: 'none',
              fontWeight: 700,
            }}
          >
            <Zap size={15} />
            Quick Service Flow
          </button>

          <Link
            to="/restaurant/queue"
            className="btn-secondary"
            style={{ padding: '0.65rem 1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Clock size={14} color="var(--accent-warning)" />
            <span>Waiting Queue</span>
          </Link>

          {isOwner && (
            <button
              onClick={handleOpenCreate}
              className="btn-primary"
              style={{ padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
            >
              <Plus size={16} />
              Add Table
            </button>
          )}
        </div>
      </div>

      {/* Notice Alert */}
      {notice && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: notice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: `1px solid ${notice.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1.25rem',
            fontSize: '0.9rem',
            color: notice.type === 'error' ? '#fca5a5' : '#a7f3d0',
          }}
        >
          <span>{notice.text}</span>
          <button
            onClick={() => setNotice(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Metric Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>TOTAL TABLES</span>
            <LayoutGrid size={16} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800 }}>{summary?.total ?? tables.length}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Configured on floor
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>AVAILABLE</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
            {summary?.available ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Ready for walk-ins
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #818cf8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>OCCUPIED</span>
            <Users size={16} color="#818cf8" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#818cf8' }}>
            {summary?.occupied ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Currently dining
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>RESERVED</span>
            <Clock size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>
            {summary?.reserved ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Booked for guests
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #c084fc' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>BILLING</span>
            <Receipt size={16} color="#c084fc" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#c084fc' }}>
            {summary?.billing ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Awaiting payment
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem', borderLeft: '3px solid #94a3b8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>OUT OF SERVICE</span>
            <AlertTriangle size={16} color="#94a3b8" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#94a3b8' }}>
            {summary?.outOfService ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Maintenance / clean
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {/* Status Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginRight: '0.25rem' }}>
            STATUS:
          </span>
          {STATUS_FILTERS.map((filter) => {
            const isActive = statusFilter === filter.id;
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.85rem',
                  borderRadius: '9999px',
                  background: isActive ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  border: `1px solid ${isActive ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                  transition: 'all 0.15s ease',
                  cursor: 'pointer',
                }}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Search, Section, Min Capacity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Search Table Number */}
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search table number..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem 0.55rem 2.2rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.25)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            />
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: '#0f172a',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            >
              <option value="ALL">All Sections</option>
              {availableSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Min Capacity Filter */}
          <div>
            <input
              type="number"
              min="1"
              value={minSeats}
              onChange={(e) => setMinSeats(e.target.value)}
              placeholder="Min seats (e.g. 4)..."
              style={{
                width: '100%',
                padding: '0.55rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: 'rgba(0, 0, 0, 0.25)',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
              }}
            />
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      {loading ? (
        <SkeletonGrid count={8} height="240px" />
      ) : tables.length === 0 ? (
        <EmptyState
          icon={LayoutGrid}
          title="No tables found matching your filters"
          description={
            isOwner
              ? "Get started by creating your restaurant floor seating layout with table numbers, capacities, and sections."
              : "There are currently no tables configured matching your selected filter criteria."
          }
          actionText={isOwner ? "Create First Table" : null}
          onAction={isOwner ? handleOpenCreate : null}
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {tables.map((table) => (
            <TableCard
              key={table._id}
              table={table}
              isOwner={isOwner}
              onStatusChange={handleStatusChange}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteTable}
              isProcessing={processingId === table._id}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Table Modal */}
      <TableModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        table={editingTable}
        isSaving={modalSaving}
      />

      {/* Confirmation Dialog for Table Deactivation */}
      <ConfirmModal
        isOpen={Boolean(deactivatingTable)}
        title="Deactivate Floor Table"
        message={`Are you sure you want to deactivate Table ${deactivatingTable?.tableNumber}? It will no longer be available for walk-in seating or orders.`}
        confirmText="Deactivate Table"
        variant="danger"
        loading={Boolean(processingId)}
        onConfirm={handleConfirmDeactivate}
        onCancel={() => setDeactivatingTable(null)}
      />

      {/* End-to-End Service Flow Orchestrator (Phase 16) */}
      <ServiceOrchestratorModal
        isOpen={isOrchestratorOpen}
        onClose={() => setIsOrchestratorOpen(false)}
        token={token}
        onWorkflowComplete={loadTables}
      />
    </div>
  );
};

export default TableManagementPage;
