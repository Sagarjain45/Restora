import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Building2,
  ShieldCheck,
  FileCheck2,
  MapPin,
  User,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Search,
  ExternalLink,
  Copy,
  Check,
  UtensilsCrossed,
} from 'lucide-react';
import { submitApplicationApi, checkApplicationStatusApi } from '../../services/adminService';

const CUISINE_OPTIONS = [
  'North Indian',
  'South Indian',
  'Italian',
  'Chinese',
  'Continental',
  'Mughlai',
  'Pan-Asian',
  'Mexican',
  'Fast Food & Cafe',
  'Bakery & Desserts',
  'Mediterranean',
  'Seafood',
];

const BUSINESS_TYPES = [
  'Fine Dining',
  'Casual Dining Bistro',
  'Cafe & Lounge',
  'Quick Service Restaurant (QSR)',
  'Traditional Family Diner',
  'Bar & Kitchen',
  'Cloud Kitchen',
];

const RegisterRestaurantPage = () => {
  const navigate = useNavigate();

  // Active Main View: 'register' | 'track' | 'success'
  const [activeView, setActiveView] = useState('register');

  // Form State
  const [formData, setFormData] = useState({
    restaurantName: '',
    businessType: 'Casual Dining Bistro',
    cuisines: ['North Indian', 'Continental'],
    seatingCapacity: '',
    description: '',
    website: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    fssaiNumber: '',
    gstNumber: '',
    applicantName: '',
    applicantEmail: '',
    applicantPhone: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false,
  });

  // Submission Status & Feedback
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [submittedApp, setSubmittedApp] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Status Tracker State
  const [trackQuery, setTrackQuery] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackedApp, setTrackedApp] = useState(null);
  const [trackError, setTrackError] = useState(null);

  // Toggle Cuisine tag
  const toggleCuisine = (cuisine) => {
    setFormData((prev) => {
      const exists = prev.cuisines.includes(cuisine);
      if (exists) {
        return { ...prev, cuisines: prev.cuisines.filter((c) => c !== cuisine) };
      }
      return { ...prev, cuisines: [...prev.cuisines, cuisine] };
    });
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!formData.restaurantName.trim()) {
      setErrorMessage('Please enter your restaurant name.');
      return;
    }
    if (!formData.address.trim() || !formData.city.trim() || !formData.state.trim()) {
      setErrorMessage('Please provide complete restaurant address details (address, city, state).');
      return;
    }
    if (!formData.fssaiNumber.trim()) {
      setErrorMessage('FSSAI license number is required for food safety verification.');
      return;
    }
    if (formData.fssaiNumber.trim().length < 8) {
      setErrorMessage('Please enter a valid FSSAI license number (standard Indian FSSAI is 14 digits).');
      return;
    }
    if (!formData.applicantName.trim()) {
      setErrorMessage('Please enter the restaurant owner / applicant name.');
      return;
    }
    if (!formData.applicantEmail.trim() || !formData.applicantPhone.trim()) {
      setErrorMessage('Please provide valid contact email and phone number.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setErrorMessage('Please enter a secure password with at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your password confirmation.');
      return;
    }
    if (!formData.agreedToTerms) {
      setErrorMessage('Please accept the food safety & platform declaration to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        restaurantName: formData.restaurantName.trim(),
        applicantName: formData.applicantName.trim(),
        applicantEmail: formData.applicantEmail.toLowerCase().trim(),
        applicantPhone: formData.applicantPhone.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
        fssaiNumber: formData.fssaiNumber.trim(),
        cuisine: formData.cuisines,
        businessType: formData.businessType,
        seatingCapacity: Number(formData.seatingCapacity) || 0,
        gstNumber: formData.gstNumber.trim(),
        website: formData.website.trim(),
        password: formData.password,
        notes: formData.description.trim(),
      };

      const res = await submitApplicationApi(payload);
      setSubmittedApp(res.data);
      setActiveView('success');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit registration. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Copy Application ID
  const handleCopyId = (id) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // Handle Track Application Query
  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    if (!trackQuery.trim()) return;

    setTrackingLoading(true);
    setTrackError(null);
    setTrackedApp(null);

    try {
      const isEmail = trackQuery.includes('@');
      const params = isEmail ? { email: trackQuery.trim() } : { id: trackQuery.trim() };
      const data = await checkApplicationStatusApi(params);
      setTrackedApp(data);
    } catch (err) {
      setTrackError(err.message || 'No application found with the provided details.');
    } finally {
      setTrackingLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '940px', margin: '1.5rem auto 4rem', padding: '0 1rem' }}>
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <span className="badge badge-indigo" style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}>
            <Sparkles size={14} /> Partner Onboarding Portal
          </span>
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 4vw, 2.8rem)', fontWeight: 800, margin: '0 0 0.75rem', lineHeight: 1.2 }}>
          Register Your Restaurant on{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #818cf8 0%, #38bdf8 50%, #34d399 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Restora
          </span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.6 }}>
          Submit your establishment details and FSSAI credentials for platform verification. Once approved by our team, your restaurant goes live instantly.
        </p>

        {/* View Switcher Tabs */}
        <div
          style={{
            display: 'inline-flex',
            background: 'rgba(15, 23, 42, 0.7)',
            padding: '0.35rem',
            borderRadius: '999px',
            border: '1px solid var(--border-subtle)',
            marginTop: '1.75rem',
            gap: '0.35rem',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveView('register')}
            style={{
              padding: '0.5rem 1.4rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s',
              backgroundColor: activeView === 'register' ? 'var(--accent-primary)' : 'transparent',
              color: activeView === 'register' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <Building2 size={15} />
            Restaurant Registration
          </button>
          <button
            type="button"
            onClick={() => setActiveView('track')}
            style={{
              padding: '0.5rem 1.4rem',
              borderRadius: '999px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.88rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s',
              backgroundColor: activeView === 'track' ? 'var(--accent-primary)' : 'transparent',
              color: activeView === 'track' ? '#ffffff' : 'var(--text-muted)',
            }}
          >
            <Search size={15} />
            Track Approval Status
          </button>
        </div>
      </div>

      {/* VIEW 1: REGISTRATION FORM */}
      {activeView === 'register' && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem 1.25rem',
                color: '#fca5a5',
                fontSize: '0.92rem',
              }}
            >
              <AlertCircle size={18} color="var(--accent-danger)" style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Restaurant Identity */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: 'var(--accent-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                1
              </div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Restaurant Identity & Style</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Restaurant Business Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <Building2 size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Saffron & Sage Trattoria"
                    value={formData.restaurantName}
                    onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.4rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Business Category *
                </label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                >
                  {BUSINESS_TYPES.map((bt) => (
                    <option key={bt} value={bt} style={{ background: '#0f172a' }}>
                      {bt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Dining Seating Capacity (Seats / Covers)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 50"
                  value={formData.seatingCapacity}
                  onChange={(e) => setFormData({ ...formData, seatingCapacity: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Official Website / Instagram (Optional)
                </label>
                <input
                  type="text"
                  placeholder="https://spicesymphony.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Cuisines Pills */}
            <div style={{ marginTop: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Cuisines Served (Select all that apply)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {CUISINE_OPTIONS.map((c) => {
                  const isSelected = formData.cuisines.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCuisine(c)}
                      style={{
                        padding: '0.4rem 0.85rem',
                        borderRadius: '999px',
                        fontSize: '0.82rem',
                        fontWeight: 500,
                        border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                        background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && <Check size={12} color="var(--accent-primary)" />}
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 2: Location & Address */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(56, 189, 248, 0.2)',
                  color: 'var(--accent-cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                2
              </div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Restaurant Location & Address</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Street / Area Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
                  <textarea
                    required
                    rows={2}
                    placeholder="e.g. Shop 12, Ground Floor, Phoenix Market City, Whitefield Main Road"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.4rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'none',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karnataka"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                    PIN / Postal Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 560066"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Food Safety & Licensing (FSSAI) */}
          <div
            className="glass-panel"
            style={{
              padding: '2rem',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(52, 211, 153, 0.2)',
                    color: 'var(--accent-success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  3
                </div>
                <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Food Safety & Government License</h2>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                <ShieldCheck size={13} /> Mandatory Verification
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>FSSAI License / Registration Number *</span>
                  <span style={{ color: 'var(--accent-success)', fontSize: '0.75rem' }}>14-digit India Standard</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <FileCheck2 size={16} color="var(--accent-success)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    maxLength={30}
                    placeholder="e.g. 11521018000452"
                    value={formData.fssaiNumber}
                    onChange={(e) => setFormData({ ...formData, fssaiNumber: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.4rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid rgba(52, 211, 153, 0.4)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '1rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.05em',
                      outline: 'none',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  Issued by Food Safety and Standards Authority of India. Admin verifies this prior to approval.
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  GSTIN / Tax ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 29ABCDE1234F1Z5"
                  value={formData.gstNumber}
                  onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.35rem' }}>
                  Used for tax invoicing on bills once your restaurant is activated.
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Owner Account Credentials */}
          <div className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.25rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(168, 85, 247, 0.2)',
                  color: 'var(--accent-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                }}
              >
                4
              </div>
              <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>Restaurant Owner Account & Sign-In Details</h2>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 1.25rem', lineHeight: 1.5 }}>
              These credentials will become your <strong>Restaurant Owner</strong> login account once your application is accepted by the platform administrator.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Owner Full Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Patel"
                    value={formData.applicantName}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.4rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Official Mobile / Phone *
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.applicantPhone}
                    onChange={(e) => setFormData({ ...formData, applicantPhone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.4rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Login Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="email"
                    required
                    placeholder="ramesh@spicesymphony.com"
                    value={formData.applicantEmail}
                    onChange={(e) => setFormData({ ...formData, applicantEmail: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.4rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Set Account Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.4rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  Confirm Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem 0.75rem 2.4rem',
                      background: 'rgba(15, 23, 42, 0.8)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: '#ffffff',
                      fontSize: '0.95rem',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Declaration and Submit CTA */}
          <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                required
                checked={formData.agreedToTerms}
                onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                style={{ marginTop: '0.2rem', accentColor: 'var(--accent-primary)', width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                I certify that the restaurant information and FSSAI license number provided above are true and accurate. I understand that my establishment will be reviewed by the platform administrator before receiving operational activation.
              </span>
            </label>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem' }}>
              <Link to="/auth/login" style={{ color: 'var(--text-dim)', fontSize: '0.88rem', textDecoration: 'none' }}>
                Already registered? <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Sign In here</span>
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{
                  padding: '0.85rem 2.25rem',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: 700,
                }}
              >
                {submitting ? (
                  'Submitting for Approval...'
                ) : (
                  <>
                    Submit Restaurant for Approval <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* VIEW 2: SUCCESS SUBMISSION SCREEN */}
      {activeView === 'success' && submittedApp && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.75rem' }}>
          <div
            style={{
              width: '68px',
              height: '68px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.2) 0%, rgba(16, 185, 129, 0.4) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.25)',
            }}
          >
            <CheckCircle2 size={36} color="var(--accent-success)" />
          </div>

          <div>
            <span className="badge badge-warning" style={{ marginBottom: '0.75rem', padding: '0.35rem 0.85rem', fontSize: '0.8rem' }}>
              <Clock size={13} /> Queued in Admin Dashboard
            </span>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem' }}>
              Registration Submitted for Approval!
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '600px', margin: '0 auto', lineHeight: 1.6 }}>
              Your restaurant <strong>"{submittedApp.restaurantName}"</strong> has been successfully submitted. It is now awaiting review by the Restora platform administration team.
            </p>
          </div>

          {/* Application Details Card */}
          <div
            style={{
              width: '100%',
              maxWidth: '540px',
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>APPLICATION REFERENCE ID</span>
                <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.95rem', color: 'var(--accent-primary)' }}>
                  {submittedApp._id}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleCopyId(submittedApp._id)}
                className="btn-secondary"
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem' }}
              >
                {copiedId ? <Check size={13} color="var(--accent-success)" /> : <Copy size={13} />}
                {copiedId ? 'Copied' : 'Copy ID'}
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.88rem' }}>
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>RESTAURANT NAME</div>
                <div style={{ fontWeight: 600 }}>{submittedApp.restaurantName}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>LOCATION</div>
                <div style={{ fontWeight: 600 }}>{submittedApp.city}, {submittedApp.state}</div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>FSSAI LICENSE NO.</div>
                <div style={{ fontWeight: 600, color: 'var(--accent-success)', fontFamily: 'monospace' }}>
                  {submittedApp.fssaiNumber || 'Recorded'}
                </div>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>OWNER LOGIN EMAIL</div>
                <div style={{ fontWeight: 600 }}>{submittedApp.applicantEmail}</div>
              </div>
            </div>
          </div>

          {/* Workflow Steps Indicator */}
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              textAlign: 'left',
            }}
          >
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Step 1: Admin Review</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Platform admin verifies your FSSAI registration & dining establishment address.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--accent-success)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Step 2: Instant Approval</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Once approved, your restaurant is provisioned and your owner account is activated.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.25rem' }}>Step 3: Go Live</div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Log in with your chosen password and start managing dining tables, menus, and POS bills.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '1rem' }}>
            <button
              onClick={() => {
                setTrackQuery(submittedApp.applicantEmail);
                setActiveView('track');
              }}
              className="btn-primary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
            >
              <Search size={16} /> Track Status in Real-Time
            </button>
            <Link
              to="/auth/login"
              className="btn-secondary"
              style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem' }}
            >
              Go to Login Page
            </Link>
          </div>
        </div>
      )}

      {/* VIEW 3: TRACK APPLICATION STATUS */}
      {activeView === 'track' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
            <h2 style={{ fontSize: '1.35rem', margin: '0 0 0.5rem', fontWeight: 700 }}>
              Check Restaurant Approval Status
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem' }}>
              Enter the email address you registered with or your Application Reference ID to check whether your restaurant has been accepted.
            </p>

            <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. owner@bistro.com or Application ID"
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.4rem',
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: '#ffffff',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={trackingLoading}
                className="btn-primary"
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                {trackingLoading ? 'Checking...' : 'Check Status'}
              </button>
            </form>

            {trackError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  color: '#fca5a5',
                  fontSize: '0.9rem',
                  marginTop: '1.5rem',
                }}
              >
                <AlertCircle size={18} color="var(--accent-danger)" style={{ flexShrink: 0 }} />
                <span>{trackError}</span>
              </div>
            )}
          </div>

          {/* Tracked Result Card */}
          {trackedApp && (
            <div className="glass-panel" style={{ padding: '2rem', maxWidth: '640px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', margin: '0 0 0.25rem' }}>{trackedApp.restaurantName}</h3>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                    Submitted on: {new Date(trackedApp.createdAt).toLocaleDateString()}
                  </div>
                </div>

                <span
                  className={`badge ${
                    trackedApp.status === 'APPROVED'
                      ? 'badge-success'
                      : trackedApp.status === 'REJECTED'
                      ? 'badge-danger'
                      : 'badge-warning'
                  }`}
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  {trackedApp.status === 'PENDING' && <Clock size={13} style={{ marginRight: '4px' }} />}
                  {trackedApp.status === 'APPROVED' && <CheckCircle2 size={13} style={{ marginRight: '4px' }} />}
                  {trackedApp.status}
                </span>
              </div>

              {/* Status Specific Message */}
              {trackedApp.status === 'PENDING' && (
                <div
                  style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    color: '#fde68a',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                  }}
                >
                  Your restaurant registration is currently awaiting verification by the platform administrator. The admin will verify your FSSAI license ({trackedApp.fssaiNumber || '14-digit'}) and restaurant details. Check back shortly!
                </div>
              )}

              {trackedApp.status === 'APPROVED' && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    color: '#a7f3d0',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                  }}
                >
                  🎉 <strong>Congratulations!</strong> Your restaurant has been accepted and activated on Restora. You can now log into your dashboard using your registered email (<code>{trackedApp.applicantEmail}</code>) and password!
                </div>
              )}

              {trackedApp.status === 'REJECTED' && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    color: '#fca5a5',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                  }}
                >
                  <strong>Application Rejected:</strong> {trackedApp.rejectionReason || 'Details could not be verified by platform compliance.'}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', fontSize: '0.88rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>APPLICANT</div>
                  <div style={{ fontWeight: 600 }}>{trackedApp.applicantName}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>CITY / STATE</div>
                  <div style={{ fontWeight: 600 }}>{trackedApp.city}, {trackedApp.state}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>FSSAI LICENSE NO.</div>
                  <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{trackedApp.fssaiNumber || 'Recorded'}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>EMAIL</div>
                  <div style={{ fontWeight: 600 }}>{trackedApp.applicantEmail}</div>
                </div>
              </div>

              {trackedApp.status === 'APPROVED' && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                  <Link to="/auth/login" className="btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}>
                    Sign In to Your Restaurant Portal <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RegisterRestaurantPage;
