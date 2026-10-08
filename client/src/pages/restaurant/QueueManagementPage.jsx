import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  Users,
  Clock,
  Plus,
  RefreshCw,
  Search,
  BellRing,
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  LayoutGrid,
  List,
  Store,
  UserCheck,
} from 'lucide-react';
import {
  getQueueApi,
  getQueueSummaryApi,
  addToQueueApi,
  seatCustomerApi,
  notifyPartyApi,
  cancelQueueEntryApi,
  markNoShowApi,
} from '../../services/queueService';
import { getTablesApi } from '../../services/tableService';
import QueueCard from '../../components/restaurant/QueueCard';
import AddToQueueModal from '../../components/restaurant/AddToQueueModal';
import SeatCustomerModal from '../../components/restaurant/SeatCustomerModal';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonGrid } from '../../components/common/LoadingState';
import useToast from '../../hooks/useToast';

const QueueManagementPage = () => {
  const { token } = useAuth();
  const toast = useToast();

  // Queue Data State
  const [queueEntries, setQueueEntries] = useState([]);
  const [summary, setSummary] = useState(null);
  const [availableTablesCount, setAvailableTablesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ACTIVE');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [notice, setNotice] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Modals State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEntryForSeat, setSelectedEntryForSeat] = useState(null);

  // 1. Load Queue and Prerequisites
  const loadQueueData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [queueRes, summaryRes, tablesRes] = await Promise.all([
        getQueueApi(token, {
          activeOnly: selectedFilter === 'ACTIVE',
          status: selectedFilter === 'ACTIVE' ? undefined : selectedFilter,
          search: searchQuery.trim() || undefined,
        }).catch((err) => {
          console.warn('Queue fetch warning:', err.message);
          return { data: [] };
        }),
        getQueueSummaryApi(token).catch((err) => {
          console.warn('Summary fetch warning:', err.message);
          return null;
        }),
        getTablesApi(token, { isActive: true }).catch((err) => {
          console.warn('Tables fetch warning:', err.message);
          return { data: [] };
        }),
      ]);

      setQueueEntries(queueRes.data || []);
      if (summaryRes) setSummary(summaryRes);
      
      const tablesList = tablesRes.data || [];
      const freeTables = tablesList.filter((t) => t.status === 'AVAILABLE');
      setAvailableTablesCount(freeTables.length);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to load waiting queue.' });
    } finally {
      setLoading(false);
    }
  }, [token, selectedFilter, searchQuery]);

  useEffect(() => {
    loadQueueData();
  }, [loadQueueData]);

  // Handle Add To Queue
  const handleAddToQueue = async (partyData) => {
    try {
      const newEntry = await addToQueueApi(token, partyData);
      setNotice({
        type: 'success',
        message: `${newEntry.customerName} added to waitlist at Position #${newEntry.position}!`,
      });
      setIsAddModalOpen(false);
      await loadQueueData();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to add party to queue.' });
    }
  };

  // Handle Seat Customer
  const handleSeatCustomer = async (entryId, tableId) => {
    setProcessingId(entryId);
    try {
      const result = await seatCustomerApi(token, entryId, tableId);
      setNotice({
        type: 'success',
        message: `${result.queueEntry.customerName} seated at Table ${result.table.tableNumber}! Table marked OCCUPIED.`,
      });
      setSelectedEntryForSeat(null);
      await loadQueueData();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to seat customer.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Notify Party
  const handleNotify = async (entryId) => {
    setProcessingId(entryId);
    try {
      await notifyPartyApi(token, entryId);
      toast.success('Party notified via SMS/Alert! Status updated to NOTIFIED.');
      setNotice({
        type: 'success',
        message: 'Party notified! Status updated to NOTIFIED.',
      });
      await loadQueueData();
    } catch (err) {
      toast.error(err.message || 'Failed to notify party.');
      setNotice({ type: 'error', message: err.message || 'Failed to notify party.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Mark No-Show
  const handleMarkNoShow = async (entryId) => {
    setProcessingId(entryId);
    try {
      await markNoShowApi(token, entryId);
      toast.warning('Party marked as NO-SHOW. Queue positions advanced.');
      setNotice({
        type: 'success',
        message: 'Party marked as NO-SHOW. Position advanced for remaining queue.',
      });
      await loadQueueData();
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
      setNotice({ type: 'error', message: err.message || 'Failed to update status.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Cancel Queue Entry
  const handleCancel = async (entryId) => {
    setProcessingId(entryId);
    try {
      await cancelQueueEntryApi(token, entryId);
      toast.info('Queue entry cancelled and removed from active waitlist.');
      setNotice({
        type: 'success',
        message: 'Queue entry cancelled and removed from active waitlist.',
      });
      await loadQueueData();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel entry.');
      setNotice({ type: 'error', message: err.message || 'Failed to cancel entry.' });
    } finally {
      setProcessingId(null);
    }
  };

  const activeWaitingParties = queueEntries.filter((e) => e.status === 'WAITING');
  const activeNotifiedParties = queueEntries.filter((e) => e.status === 'NOTIFIED');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
              }}
            >
              <Clock size={22} color="#ffffff" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Waiting Queue Management</h1>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            FIFO waitlist, capacity-based table matching, guest notifications, and instant seating.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadQueueData}
            disabled={loading}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>Add Walk-in Party</span>
          </button>
        </div>
      </div>

      {/* Notification Notice */}
      {notice && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: notice.type === 'error' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
            border: `1px solid ${notice.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: notice.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)',
            fontSize: '0.9rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {notice.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>{notice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>WAITING PARTIES</span>
            <Users size={18} color="var(--accent-warning)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-warning)' }}>
            {summary?.waitingParties ?? activeWaitingParties.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            {summary?.totalWaitingGuests ?? 0} total waiting guests
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>NOTIFIED GUESTS</span>
            <BellRing size={18} color="var(--accent-purple, #c084fc)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-purple, #c084fc)' }}>
            {summary?.notifiedParties ?? activeNotifiedParties.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Alerted and ready to be seated
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>AVAILABLE TABLES</span>
            <Store size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-success)' }}>
            {availableTablesCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Floor tables free for immediate seating
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>SEATED TODAY</span>
            <UserCheck size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {summary?.seatedToday ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Queue turnovers processed today
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '1rem 1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* Status Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Filter size={13} /> Filter:
          </span>
          {[
            { id: 'ACTIVE', label: 'Active Queue' },
            { id: 'ALL', label: 'All History' },
            { id: 'WAITING', label: 'Waiting' },
            { id: 'NOTIFIED', label: 'Notified' },
            { id: 'SEATED', label: 'Seated' },
            { id: 'NO_SHOW', label: 'No-Show' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedFilter(tab.id)}
              className={selectedFilter === tab.id ? 'btn-primary' : 'btn-secondary'}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* View Mode & Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'rgba(0, 0, 0, 0.3)', borderRadius: 'var(--radius-sm)', padding: '2px', border: '1px solid var(--border-subtle)' }}>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              style={{
                background: viewMode === 'grid' ? 'var(--accent-primary)' : 'transparent',
                border: 'none',
                color: viewMode === 'grid' ? '#fff' : 'var(--text-dim)',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              style={{
                background: viewMode === 'table' ? 'var(--accent-primary)' : 'transparent',
                border: 'none',
                color: viewMode === 'table' ? '#fff' : 'var(--text-dim)',
                padding: '0.3rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Table View"
            >
              <List size={15} />
            </button>
          </div>

          <div style={{ position: 'relative', width: '260px', maxWidth: '100%' }}>
            <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search party or phone..."
              className="input-field"
              style={{ width: '100%', paddingLeft: '32px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Main Content: Grid or Table List */}
      {loading ? (
        <SkeletonGrid count={6} height="200px" />
      ) : queueEntries.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No waiting parties found"
          description={
            selectedFilter === 'ACTIVE'
              ? 'The waiting queue is currently empty. Add a walk-in party when all tables are occupied.'
              : `No queue entries match the filter "${selectedFilter}".`
          }
          actionText="Add Walk-in to Queue"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
          {queueEntries.map((entry) => (
            <QueueCard
              key={entry._id}
              entry={entry}
              onOpenSeatModal={(e) => setSelectedEntryForSeat(e)}
              onNotify={handleNotify}
              onMarkNoShow={handleMarkNoShow}
              onCancel={handleCancel}
              isProcessing={processingId === entry._id}
            />
          ))}
        </div>
      ) : (
        /* Detailed Table List View */
        <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>POS / ARRIVAL</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>CUSTOMER</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>PARTY SIZE</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>SEATED TABLE</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {queueEntries.map((entry) => {
                  const isActive = entry.status === 'WAITING' || entry.status === 'NOTIFIED';
                  const arrivalTime = new Date(entry.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr
                      key={entry._id}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--accent-warning)', fontSize: '0.95rem' }}>
                          #{entry.position}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {arrivalTime}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{entry.customerName}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {entry.customerPhone} {entry.notes ? `• ${entry.notes}` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="badge badge-indigo">
                          <Users size={12} style={{ marginRight: '4px' }} /> {entry.guestCount} Guests
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={`badge ${
                          entry.status === 'WAITING' ? 'badge-warning' :
                          entry.status === 'NOTIFIED' ? 'badge-purple' :
                          entry.status === 'SEATED' ? 'badge-success' : 'badge-gray'
                        }`}>
                          {entry.status}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-dim)' }}>
                        {entry.assignedTableId ? (
                          <span className="badge badge-success">
                            Table {entry.assignedTableId.tableNumber}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        {isActive && (
                          <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => setSelectedEntryForSeat(entry)}
                              className="btn-primary"
                              style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
                            >
                              Seat Table
                            </button>
                            {entry.status === 'WAITING' && (
                              <button
                                type="button"
                                onClick={() => handleNotify(entry._id)}
                                className="btn-secondary"
                                style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                              >
                                Notify
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal 1: Add To Queue */}
      {isAddModalOpen && (
        <AddToQueueModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddToQueue}
          currentWaitingCount={activeWaitingParties.length}
        />
      )}

      {/* Modal 2: Seat Customer */}
      {selectedEntryForSeat && (
        <SeatCustomerModal
          isOpen={Boolean(selectedEntryForSeat)}
          onClose={() => setSelectedEntryForSeat(null)}
          entry={selectedEntryForSeat}
          onSeat={handleSeatCustomer}
          token={token}
          isProcessing={processingId === selectedEntryForSeat._id}
        />
      )}
    </div>
  );
};

export default QueueManagementPage;
