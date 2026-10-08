import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  User,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { checkAvailableTablesApi } from '../../services/reservationService';

const ReservationModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialReservation = null,
  token,
  isProcessing = false,
}) => {
  const isEditing = Boolean(initialReservation);

  const getTodayDateStr = () => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  };

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [date, setDate] = useState(getTodayDateStr());
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:30');
  const [selectedTableId, setSelectedTableId] = useState('');
  const [status, setStatus] = useState('CONFIRMED');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Live Table Availability Checking
  const [availabilityData, setAvailabilityData] = useState(null);
  const [checkingTables, setCheckingTables] = useState(false);

  // Auto-calculate end time 90 minutes after start time
  const handleStartTimeChange = (newStart) => {
    setStartTime(newStart);
    if (newStart && newStart.includes(':')) {
      const [h, m] = newStart.split(':').map(Number);
      const totalMins = (h || 0) * 60 + (m || 0) + 90;
      const endH = Math.floor((totalMins % 1440) / 60);
      const endM = totalMins % 60;
      const calculatedEnd = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
      setEndTime(calculatedEnd);
    }
  };

  // Populate form if editing
  useEffect(() => {
    if (initialReservation) {
      setCustomerName(initialReservation.customerName || '');
      setCustomerPhone(initialReservation.customerPhone || '');
      setCustomerEmail(initialReservation.customerEmail || '');
      setGuestCount(initialReservation.guestCount || 2);
      setDate(initialReservation.date || getTodayDateStr());
      setStartTime(initialReservation.startTime || '19:00');
      setEndTime(initialReservation.endTime || '20:30');
      setSelectedTableId(
        initialReservation.tableId?._id || initialReservation.tableId || ''
      );
      setStatus(initialReservation.status || 'CONFIRMED');
      setNotes(initialReservation.notes || '');
    } else {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setGuestCount(2);
      setDate(getTodayDateStr());
      setStartTime('19:00');
      setEndTime('20:30');
      setSelectedTableId('');
      setStatus('CONFIRMED');
      setNotes('');
    }
    setError('');
  }, [initialReservation, isOpen]);

  // Live slot availability query
  useEffect(() => {
    if (!isOpen || !token || !date || !startTime) return;

    let mounted = true;
    setCheckingTables(true);

    checkAvailableTablesApi(token, {
      date,
      startTime,
      endTime,
      guestCount,
    })
      .then((res) => {
        if (mounted) {
          setAvailabilityData(res);
        }
      })
      .catch((err) => {
        console.warn('Availability check warning:', err.message);
      })
      .finally(() => {
        if (mounted) setCheckingTables(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, token, date, startTime, endTime, guestCount]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Please provide customer name.');
      return;
    }
    if (!customerPhone.trim()) {
      setError('Please provide a contact phone number.');
      return;
    }
    if (!guestCount || guestCount < 1) {
      setError('Guest count must be at least 1.');
      return;
    }
    if (!date) {
      setError('Please choose a reservation date.');
      return;
    }
    if (!startTime) {
      setError('Please choose a reservation start time.');
      return;
    }

    setError('');
    onSubmit({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim() || undefined,
      guestCount: parseInt(guestCount, 10),
      date: date.trim(),
      startTime: startTime.trim(),
      endTime: endTime.trim() || undefined,
      tableId: selectedTableId || null,
      status,
      notes: notes.trim() || undefined,
    });
  };

  const availableTables = availabilityData?.availableTables || [];
  const bookedTables = availabilityData?.bookedTables || [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(5, 8, 16, 0.8)',
        backdropFilter: 'blur(8px)',
        zIndex: 60,
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
          maxWidth: '580px',
          maxHeight: '92vh',
          overflowY: 'auto',
          border: '1px solid var(--border-glow)',
          padding: 0,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                {isEditing ? 'Edit Table Reservation' : 'New Table Reservation'}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Conflict detection & capacity matching enabled
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.3rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--accent-danger)',
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Customer Details Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <User size={13} /> Customer Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Aarav Mehta"
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <Phone size={13} /> Phone Number *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Email & Guests Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <Mail size={13} /> Email Address (Optional)
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="aarav@example.com"
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <Users size={13} /> Guests *
              </label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Date & Time Slot Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <Calendar size={13} /> Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <Clock size={13} /> Start Time *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <Clock size={13} /> End Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Table Selection with Live Conflict Status */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Assign Table (Capacity &ge; {guestCount})
              </label>
              {checkingTables ? (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Checking slot...</span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Sparkles size={12} /> {availableTables.length} Free Table(s)
                </span>
              )}
            </div>

            <select
              value={selectedTableId}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="input-field"
              style={{ width: '100%', fontSize: '0.85rem' }}
            >
              <option value="">-- Leave Unassigned (Assign Upon Arrival) --</option>
              {availableTables.map((tbl) => (
                <option key={tbl._id} value={tbl._id}>
                  {tbl.tableNumber} ({tbl.capacity} Seats{tbl.section ? ` - ${tbl.section}` : ''}) — Available for Slot
                </option>
              ))}
              {bookedTables.map((b) => (
                <option key={b.table._id} value={b.table._id} disabled>
                  {b.table.tableNumber} ({b.table.capacity} Seats) — Booked ({b.conflictWith?.startTime}-{b.conflictWith?.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* Status & Special Notes Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Booking Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              >
                <option value="CONFIRMED">CONFIRMED</option>
                <option value="PENDING">PENDING</option>
                {isEditing && (
                  <>
                    <option value="ARRIVED">ARRIVED</option>
                    <option value="SEATED">SEATED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="NO_SHOW">NO_SHOW</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                <FileText size={13} /> Special Occasion / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Birthday celebration, booth request"
                className="input-field"
                style={{ width: '100%', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle2 size={16} />
              <span>{isProcessing ? 'Saving...' : isEditing ? 'Save Changes' : 'Confirm Reservation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReservationModal;
