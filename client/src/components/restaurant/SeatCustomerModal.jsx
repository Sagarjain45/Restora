import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { getSuitableTablesApi } from '../../services/queueService';

const SeatCustomerModal = ({
  isOpen,
  onClose,
  entry,
  onSeat,
  token,
  isProcessing = false,
}) => {
  const [selectedTableId, setSelectedTableId] = useState('');
  const [tablesData, setTablesData] = useState(null);
  const [loadingTables, setLoadingTables] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !entry || !token) return;

    let mounted = true;
    setLoadingTables(true);
    setError('');
    setSelectedTableId('');

    getSuitableTablesApi(token, entry._id)
      .then((res) => {
        if (mounted) {
          setTablesData(res);
          // Automatically pre-select the first available table if present
          if (res.availableTables && res.availableTables.length > 0) {
            setSelectedTableId(res.availableTables[0]._id);
          }
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to find suitable tables.');
        }
      })
      .finally(() => {
        if (mounted) setLoadingTables(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, entry, token]);

  if (!isOpen || !entry) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTableId) {
      setError('Please select an available table to seat this party.');
      return;
    }
    setError('');
    onSeat(entry._id, selectedTableId);
  };

  const availableTables = tablesData?.availableTables || [];
  const occupiedTables = tablesData?.occupiedTables || [];

  return (
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
          maxWidth: '560px',
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
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-success)',
              }}
            >
              <Users size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>Seat Customer Party</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                Matching tables for party of {entry.guestCount} guests
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

        {/* Content */}
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
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Party Details Banner */}
          <div
            style={{
              padding: '1rem',
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                {entry.customerName}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                {entry.customerPhone} {entry.notes ? `• "${entry.notes}"` : ''}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-indigo" style={{ padding: '0.3rem 0.6rem' }}>
                <Users size={12} style={{ marginRight: '4px' }} /> {entry.guestCount} Guests
              </span>
              <span className="badge badge-warning" style={{ padding: '0.3rem 0.6rem' }}>
                Position #{entry.position}
              </span>
            </div>
          </div>

          {/* Table Selection */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                Select Table (Capacity &ge; {entry.guestCount}):
              </span>
              {availableTables.length > 0 && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Sparkles size={13} /> {availableTables.length} Available Suitable Table(s)
                </span>
              )}
            </div>

            {loadingTables ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Finding suitable tables...
              </div>
            ) : availableTables.length === 0 ? (
              <div
                style={{
                  padding: '1.25rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--accent-danger)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                  No Available Tables Fit This Party Size Right Now
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  All tables with capacity &ge; {entry.guestCount} are currently occupied or in billing. Party can remain in queue until a table frees up.
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
                {availableTables.map((tbl) => {
                  const isSelected = selectedTableId === tbl._id;
                  const excessSeats = tbl.capacity - entry.guestCount;

                  return (
                    <button
                      key={tbl._id}
                      type="button"
                      onClick={() => setSelectedTableId(tbl._id)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: '0.35rem',
                        padding: '0.85rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '2px solid var(--accent-success)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.6)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                          {tbl.tableNumber}
                        </strong>
                        <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}>
                          Ready
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {tbl.capacity} Seats {tbl.section ? `• ${tbl.section}` : ''}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: excessSeats === 0 ? 'var(--accent-success)' : 'var(--text-dim)' }}>
                        {excessSeats === 0 ? '★ Exact Capacity Fit' : `+${excessSeats} extra seats`}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Occupied Suitable Tables Info (if staff wants visibility on incoming turnover) */}
          {occupiedTables.length > 0 && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.4rem' }}>
                Currently in use ({occupiedTables.length} tables with capacity &ge; {entry.guestCount}):
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {occupiedTables.slice(0, 5).map((t) => (
                  <span
                    key={t._id}
                    className="badge badge-indigo"
                    style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', opacity: 0.8 }}
                  >
                    {t.tableNumber} ({t.capacity}s - {t.status})
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Safety Rule Note */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              padding: '0.65rem 0.85rem',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
            }}
          >
            <ShieldCheck size={16} color="var(--accent-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>
              <strong>Seating Integration:</strong> Confirming seating will mark this queue entry as <strong>SEATED</strong>, assign the table, update Table to <strong>OCCUPIED</strong>, and advance remaining queue positions.
            </span>
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
              disabled={isProcessing || !selectedTableId}
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle2 size={16} />
              <span>{isProcessing ? 'Seating Party...' : 'Confirm Seating & Occupy Table'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeatCustomerModal;
