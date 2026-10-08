import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  Calendar,
  Clock,
  Users,
  Plus,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  LayoutGrid,
  List,
  Store,
  UserCheck,
  CalendarCheck,
} from 'lucide-react';
import {
  getReservationsApi,
  getReservationSummaryApi,
  createReservationApi,
  updateReservationApi,
  updateReservationStatusApi,
  seatReservationApi,
} from '../../services/reservationService';
import { getTablesApi } from '../../services/tableService';
import ReservationCard from '../../components/restaurant/ReservationCard';
import ReservationModal from '../../components/restaurant/ReservationModal';

const ReservationManagementPage = () => {
  const { token } = useAuth();

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getTomorrowStr = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  // Data State
  const [reservations, setReservations] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Filters State
  const [dateFilter, setDateFilter] = useState(getTodayStr());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [seatingReservation, setSeatingReservation] = useState(null);
  const [selectedTableForSeat, setSelectedTableForSeat] = useState('');

  // 1. Load Reservations and Prerequisites
  const loadReservationsData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [resList, sumRes, tablesRes] = await Promise.all([
        getReservationsApi(token, {
          date: dateFilter || undefined,
          status: statusFilter,
          search: searchQuery.trim() || undefined,
        }).catch((err) => {
          console.warn('Reservations fetch warning:', err.message);
          return { data: [] };
        }),
        getReservationSummaryApi(token, dateFilter || null).catch((err) => {
          console.warn('Summary fetch warning:', err.message);
          return null;
        }),
        getTablesApi(token, { isActive: true }).catch((err) => {
          console.warn('Tables fetch warning:', err.message);
          return { data: [] };
        }),
      ]);

      setReservations(resList.data || []);
      if (sumRes) setSummary(sumRes);
      setTables(tablesRes.data || []);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to load reservations.' });
    } finally {
      setLoading(false);
    }
  }, [token, dateFilter, statusFilter, searchQuery]);

  useEffect(() => {
    loadReservationsData();
  }, [loadReservationsData]);

  // Handle Create or Edit Reservation
  const handleSaveReservation = async (reservationData) => {
    try {
      if (editingReservation) {
        await updateReservationApi(token, editingReservation._id, reservationData);
        setNotice({ type: 'success', message: 'Reservation updated successfully.' });
      } else {
        const newRes = await createReservationApi(token, reservationData);
        setNotice({
          type: 'success',
          message: `Reservation confirmed for ${newRes.customerName} on ${newRes.date} at ${newRes.startTime}!`,
        });
      }
      setIsModalOpen(false);
      setEditingReservation(null);
      await loadReservationsData();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to save reservation.' });
    }
  };

  // Handle Status Update (ARRIVED, COMPLETED, CANCELLED, NO_SHOW)
  const handleUpdateStatus = async (reservationId, newStatus) => {
    setProcessingId(reservationId);
    try {
      await updateReservationStatusApi(token, reservationId, newStatus);
      setNotice({
        type: 'success',
        message: `Reservation status updated to ${newStatus}.`,
      });
      await loadReservationsData();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to update reservation status.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle Seating Reservation Guests
  const handleSeatClick = async (reservation) => {
    if (reservation.tableId) {
      // Direct seating on assigned table
      setProcessingId(reservation._id);
      try {
        const res = await seatReservationApi(token, reservation._id, reservation.tableId._id || reservation.tableId);
        setNotice({
          type: 'success',
          message: `${res.reservation.customerName} seated at Table ${res.table.tableNumber}! Table occupied.`,
        });
        await loadReservationsData();
      } catch (err) {
        setNotice({ type: 'error', message: err.message || 'Failed to seat reservation.' });
      } finally {
        setProcessingId(null);
      }
    } else {
      // Need to assign a table first
      setSeatingReservation(reservation);
      // Pre-select first suitable available table
      const suitable = tables.filter((t) => t.capacity >= reservation.guestCount && t.status === 'AVAILABLE');
      if (suitable.length > 0) {
        setSelectedTableForSeat(suitable[0]._id);
      } else {
        setSelectedTableForSeat('');
      }
    }
  };

  const handleConfirmSeatingWithTable = async () => {
    if (!seatingReservation || !selectedTableForSeat) return;
    setProcessingId(seatingReservation._id);
    try {
      const res = await seatReservationApi(token, seatingReservation._id, selectedTableForSeat);
      setNotice({
        type: 'success',
        message: `${res.reservation.customerName} seated at Table ${res.table.tableNumber}! Table occupied.`,
      });
      setSeatingReservation(null);
      await loadReservationsData();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to seat reservation.' });
    } finally {
      setProcessingId(null);
    }
  };

  const suitableTablesForPendingSeat = seatingReservation
    ? tables.filter((t) => t.capacity >= seatingReservation.guestCount && t.status === 'AVAILABLE')
    : [];

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
                background: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              <CalendarCheck size={22} color="#ffffff" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Table Reservations</h1>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Bookings calendar, multi-timeframe conflict detection, party arrivals, and seating.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadReservationsData}
            disabled={loading}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingReservation(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* Notice Alert */}
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
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>CONFIRMED BOOKINGS</span>
            <CalendarCheck size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
            {summary?.confirmed ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            {dateFilter ? `On ${dateFilter}` : 'All upcoming'}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ARRIVED & SEATED</span>
            <UserCheck size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-success)' }}>
            {(summary?.arrived ?? 0) + (summary?.seated ?? 0)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            {summary?.arrived ?? 0} arrived • {summary?.seated ?? 0} seated
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>PENDING CONFIRMATION</span>
            <Clock size={18} color="var(--accent-warning)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-warning)' }}>
            {summary?.pending ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Awaiting guest confirmation
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>TOTAL RESERVATIONS</span>
            <Users size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {summary?.total ?? reservations.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Scheduled entries in system
          </div>
        </div>
      </div>

      {/* Date & Filter Navigation Bar */}
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
        {/* Date Selector Shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} /> Date:
          </span>
          <button
            type="button"
            onClick={() => setDateFilter(getTodayStr())}
            className={dateFilter === getTodayStr() ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: '20px' }}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setDateFilter(getTomorrowStr())}
            className={dateFilter === getTomorrowStr() ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: '20px' }}
          >
            Tomorrow
          </button>
          <button
            type="button"
            onClick={() => setDateFilter('')}
            className={dateFilter === '' ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem', padding: '0.35rem 0.75rem', borderRadius: '20px' }}
          >
            All Dates
          </button>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input-field"
            style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}
          />
        </div>

        {/* View Mode & Search */}
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

          <div style={{ position: 'relative', width: '250px', maxWidth: '100%' }}>
            <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guest or phone..."
              className="input-field"
              style={{ width: '100%', paddingLeft: '32px', fontSize: '0.85rem' }}
            />
          </div>
        </div>
      </div>

      {/* Status Chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Filter size={13} /> Status:
        </span>
        {['ALL', 'CONFIRMED', 'ARRIVED', 'SEATED', 'PENDING', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setStatusFilter(st)}
            className={statusFilter === st ? 'btn-primary' : 'btn-secondary'}
            style={{
              fontSize: '0.78rem',
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
            }}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Main Reservation Display */}
      {loading ? (
        <div className="glass-panel" style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 1rem' }} />
          <div>Loading reservation schedule...</div>
        </div>
      ) : reservations.length === 0 ? (
        <div
          className="glass-panel"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <Calendar size={48} color="var(--text-dim)" />
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>No reservations found</h3>
          <p style={{ color: 'var(--text-muted)', maxWidth: '420px', fontSize: '0.9rem', margin: 0 }}>
            {dateFilter
              ? `No reservations scheduled for ${dateFilter}.`
              : 'No reservations match the specified search and filter criteria.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingReservation(null);
              setIsModalOpen(true);
            }}
            className="btn-primary"
            style={{ marginTop: '0.5rem', padding: '0.65rem 1.25rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Book Table Reservation
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '1.25rem' }}>
          {reservations.map((res) => (
            <ReservationCard
              key={res._id}
              reservation={res}
              onEdit={(r) => {
                setEditingReservation(r);
                setIsModalOpen(true);
              }}
              onUpdateStatus={handleUpdateStatus}
              onSeat={handleSeatClick}
              isProcessing={processingId === res._id}
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
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>DATE / TIME</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>CUSTOMER</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>PARTY</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>TABLE</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>STATUS</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => {
                  return (
                    <tr
                      key={res._id}
                      style={{ borderBottom: '1px solid var(--border-subtle)' }}
                    >
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                          {res.startTime} {res.endTime ? `- ${res.endTime}` : ''}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {res.date}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <strong style={{ color: 'var(--text-main)' }}>{res.customerName}</strong>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {res.customerPhone} {res.notes ? `• ${res.notes}` : ''}
                        </div>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="badge badge-indigo">
                          <Users size={12} style={{ marginRight: '4px' }} /> {res.guestCount} Guests
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        {res.tableId ? (
                          <span className="badge badge-purple">
                            Table {res.tableId.tableNumber}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--accent-warning)', fontSize: '0.75rem' }}>
                            Unassigned
                          </span>
                        )}
                      </td>

                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className={`badge ${
                          res.status === 'CONFIRMED' ? 'badge-indigo' :
                          res.status === 'ARRIVED' ? 'badge-purple' :
                          res.status === 'SEATED' ? 'badge-success' :
                          res.status === 'PENDING' ? 'badge-cyan' : 'badge-gray'
                        }`}>
                          {res.status}
                        </span>
                      </td>

                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          {res.status === 'CONFIRMED' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(res._id, 'ARRIVED')}
                              className="btn-secondary"
                              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                            >
                              Arrived
                            </button>
                          )}
                          {(res.status === 'ARRIVED' || res.status === 'CONFIRMED') && (
                            <button
                              type="button"
                              onClick={() => handleSeatClick(res)}
                              className="btn-primary"
                              style={{ fontSize: '0.78rem', padding: '0.35rem 0.65rem' }}
                            >
                              Seat
                            </button>
                          )}
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

      {/* Modal 1: Create or Edit Reservation */}
      {isModalOpen && (
        <ReservationModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingReservation(null);
          }}
          onSubmit={handleSaveReservation}
          initialReservation={editingReservation}
          token={token}
          isProcessing={loading}
        />
      )}

      {/* Modal 2: Assign Table & Seat (for unassigned reservations) */}
      {seatingReservation && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 8, 16, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 65,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '1.5rem',
              border: '1px solid var(--border-glow)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Assign Table for {seatingReservation.customerName}</h3>
              <button
                type="button"
                onClick={() => setSeatingReservation(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1rem 0' }}>
              Party size: <strong>{seatingReservation.guestCount} Guests</strong>. Choose an available table to occupy:
            </p>

            {suitableTablesForPendingSeat.length === 0 ? (
              <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                No available tables with capacity &ge; {seatingReservation.guestCount} right now.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                {suitableTablesForPendingSeat.map((tbl) => (
                  <label
                    key={tbl._id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      background: selectedTableForSeat === tbl._id ? 'rgba(99, 102, 241, 0.15)' : 'rgba(0, 0, 0, 0.25)',
                      border: selectedTableForSeat === tbl._id ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="tableSelect"
                      value={tbl._id}
                      checked={selectedTableForSeat === tbl._id}
                      onChange={() => setSelectedTableForSeat(tbl._id)}
                    />
                    <div>
                      <strong style={{ color: 'var(--text-main)' }}>Table {tbl.tableNumber}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {tbl.capacity} Seats {tbl.section ? `• ${tbl.section}` : ''}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSeatingReservation(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSeatingWithTable}
                disabled={!selectedTableForSeat || Boolean(processingId)}
                className="btn-primary"
              >
                {processingId ? 'Seating...' : 'Confirm Seating & Occupy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationManagementPage;
