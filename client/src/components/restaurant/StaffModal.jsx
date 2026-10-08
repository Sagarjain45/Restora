import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Phone, Briefcase, Shield, CheckCircle2, AlertCircle } from 'lucide-react';
import { STAFF_DESIGNATIONS } from '../../services/staffService';

const StaffModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialStaff = null,
  isProcessing = false,
}) => {
  const isEditing = Boolean(initialStaff);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [designation, setDesignation] = useState('Floor Staff');
  const [role, setRole] = useState('RESTAURANT_STAFF');
  const [status, setStatus] = useState('ACTIVE');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialStaff) {
      setName(initialStaff.name || '');
      setEmail(initialStaff.email || '');
      setPassword('');
      setPhone(initialStaff.phone || '');
      setDesignation(initialStaff.designation || 'Floor Staff');
      setRole(initialStaff.role || 'RESTAURANT_STAFF');
      setStatus(initialStaff.status || 'ACTIVE');
    } else {
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setDesignation('Floor Staff');
      setRole('RESTAURANT_STAFF');
      setStatus('ACTIVE');
    }
    setError('');
  }, [initialStaff, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('Please provide the staff member\'s full name.');
      return;
    }

    if (!isEditing) {
      if (!email.trim()) {
        setError('Please provide a valid email address for login.');
        return;
      }
      if (!password || password.length < 6) {
        setError('Temporary login password must be at least 6 characters.');
        return;
      }
    } else if (password && password.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    setError('');

    const payload = {
      name: name.trim(),
      phone: phone.trim() || undefined,
      designation: designation.trim(),
    };

    if (!isEditing) {
      payload.email = email.trim();
      payload.password = password;
      payload.role = role;
    } else {
      if (password.trim()) {
        payload.password = password;
      }
      payload.status = status;
    }

    onSubmit(payload);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={(e) => e.target === e.currentTarget && !isProcessing && onClose()}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '2rem',
          background: 'rgba(15, 23, 42, 0.95)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
              {isEditing ? 'Edit Staff Profile' : 'Onboard New Staff Member'}
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
              {isEditing
                ? 'Update designation, contact details, or reset credentials'
                : 'Provision login access and assign floor roles to your team'}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              borderRadius: '8px',
              padding: '0.5rem',
              display: 'flex',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Full Name *
            </label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Email Address {isEditing ? '(Login ID)' : '*'}
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rahul@restaurant.com"
                required={!isEditing}
                disabled={isEditing}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  background: isEditing ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: isEditing ? 'var(--text-muted)' : 'var(--text-main)',
                  fontSize: '0.9rem',
                  cursor: isEditing ? 'not-allowed' : 'text',
                }}
              />
            </div>
            {isEditing && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'block' }}>
                Email is tied to identity and cannot be altered once created.
              </span>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Phone Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* Designation & Role Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Operational Role / Title *
              </label>
              <div style={{ position: 'relative' }}>
                <Briefcase size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: 'var(--text-main)',
                    fontSize: '0.85rem',
                  }}
                >
                  {STAFF_DESIGNATIONS.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                System Access Level
              </label>
              <div style={{ position: 'relative' }}>
                <Shield size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  disabled={isEditing}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                    background: isEditing ? 'rgba(255, 255, 255, 0.04)' : 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    color: isEditing ? 'var(--text-muted)' : 'var(--text-main)',
                    fontSize: '0.85rem',
                    cursor: isEditing ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="RESTAURANT_STAFF">Staff (POS & Floor)</option>
                  <option value="RESTAURANT_OWNER">Owner (Full Admin)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Password (Required for create, optional reset for edit) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              {isEditing ? 'Reset Password (leave empty to keep current)' : 'Account Password *'}
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isEditing ? 'Enter new password to reset...' : 'At least 6 characters'}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem 0.65rem 2.5rem',
                  background: 'rgba(0, 0, 0, 0.25)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--text-main)',
                  fontSize: '0.9rem',
                }}
              />
            </div>
          </div>

          {/* Status selector (editing only) */}
          {isEditing && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                Account Status
              </label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1rem',
                    background: status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: status === 'ACTIVE' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: status === 'ACTIVE' ? '#4ade80' : 'var(--text-muted)',
                  }}
                >
                  <input
                    type="radio"
                    name="staffStatus"
                    value="ACTIVE"
                    checked={status === 'ACTIVE'}
                    onChange={() => setStatus('ACTIVE')}
                    style={{ accentColor: '#22c55e' }}
                  />
                  Active (Can login)
                </label>
                <label
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1rem',
                    background: status === 'INACTIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    border: status === 'INACTIVE' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    color: status === 'INACTIVE' ? '#f87171' : 'var(--text-muted)',
                  }}
                >
                  <input
                    type="radio"
                    name="staffStatus"
                    value="INACTIVE"
                    checked={status === 'INACTIVE'}
                    onChange={() => setStatus('INACTIVE')}
                    style={{ accentColor: '#ef4444' }}
                  />
                  Inactive (Suspended)
                </label>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              style={{
                padding: '0.65rem 1.25rem',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-main)',
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="btn btn-primary"
              style={{
                padding: '0.65rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
              }}
            >
              <CheckCircle2 size={16} />
              {isProcessing ? 'Saving...' : isEditing ? 'Update Staff Profile' : 'Onboard Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffModal;
