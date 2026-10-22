import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import useToast from '../../hooks/useToast';
import {
  Store,
  Sliders,
  Calendar,
  Layers,
  Save,
  Power,
  RefreshCw,
  MapPin,
  Phone,
  Mail,
  Globe,
  FileText,
  DollarSign,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
} from 'lucide-react';
import {
  getRestaurantProfileApi,
  updateRestaurantProfileApi,
  updateOpeningHoursApi,
  updateRestaurantSettingsApi,
  toggleOpenStatusApi,
} from '../../services/restaurantService';
import EmptyState from '../../components/common/EmptyState';

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const DEFAULT_HOURS = DAYS_OF_WEEK.map((day) => ({
  day,
  openTime: '10:00',
  closeTime: '23:00',
  isClosed: false,
}));

const CURRENCY_OPTIONS = [
  { code: 'INR', symbol: '₹', label: 'INR (₹) - Indian Rupee' },
  { code: 'USD', symbol: '$', label: 'USD ($) - US Dollar' },
  { code: 'EUR', symbol: '€', label: 'EUR (€) - Euro' },
  { code: 'GBP', symbol: '£', label: 'GBP (£) - British Pound' },
  { code: 'AED', symbol: 'AED', label: 'AED - UAE Dirham' },
  { code: 'CAD', symbol: '$', label: 'CAD ($) - Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'AUD ($) - Australian Dollar' },
];

const POPULAR_CUISINES = [
  'North Indian',
  'South Indian',
  'Mughlai',
  'Chinese',
  'Italian',
  'Continental',
  'Pan-Asian',
  'Mexican',
  'Cafe & Beverages',
  'Bakery & Desserts',
  'Fast Food & Burgers',
  'Biryani',
  'Street Food',
];

const RestaurantSettingsPage = () => {
  const { user, token, restaurant, refreshRestaurant } = useAuth();
  const toast = useToast();

  const isOwner = user?.role === 'RESTAURANT_OWNER' || user?.role === 'PLATFORM_ADMIN';

  // Tabs: 'profile' | 'hours' | 'pos' | 'compliance'
  const [activeTab, setActiveTab] = useState('profile');

  // Loading & Action states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    description: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
    website: '',
    cuisine: [],
    businessType: 'Dine-In Restaurant',
    fssaiNumber: '',
    gstNumber: '',
    seatingCapacity: 0,
  });

  const [hours, setHours] = useState(DEFAULT_HOURS);

  const [settingsForm, setSettingsForm] = useState({
    currency: 'INR',
    taxRatePercent: 5,
    serviceChargePercent: 0,
    autoAcceptReservations: false,
    allowSpecialRequests: true,
  });

  // Load Profile from API
  const loadProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getRestaurantProfileApi(token);
      setProfileData(data);

      setProfileForm({
        name: data.name || '',
        description: data.description || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        country: data.country || 'India',
        postalCode: data.postalCode || '',
        website: data.website || '',
        cuisine: Array.isArray(data.cuisine)
          ? data.cuisine
          : typeof data.cuisine === 'string' && data.cuisine
          ? data.cuisine.split(',').map((c) => c.trim())
          : [],
        businessType: data.businessType || 'Dine-In Restaurant',
        fssaiNumber: data.fssaiNumber || '',
        gstNumber: data.gstNumber || '',
        seatingCapacity: data.seatingCapacity || 0,
      });

      if (data.openingHours && data.openingHours.length > 0) {
        const merged = DAYS_OF_WEEK.map((d) => {
          const found = data.openingHours.find((h) => h.day === d);
          return found || { day: d, openTime: '10:00', closeTime: '23:00', isClosed: false };
        });
        setHours(merged);
      }

      if (data.settings) {
        setSettingsForm({
          currency: data.settings.currency || 'INR',
          taxRatePercent: data.settings.taxRatePercent ?? 5,
          serviceChargePercent: data.settings.serviceChargePercent ?? 0,
          autoAcceptReservations: Boolean(data.settings.autoAcceptReservations),
          allowSpecialRequests: data.settings.allowSpecialRequests !== false,
        });
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load restaurant settings.');
    } finally {
      setLoading(false);
    }
  }, [token, toast]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Cuisine tag toggle
  const toggleCuisineTag = (cuisine) => {
    setProfileForm((prev) => {
      const exists = prev.cuisine.includes(cuisine);
      if (exists) {
        return { ...prev, cuisine: prev.cuisine.filter((c) => c !== cuisine) };
      }
      return { ...prev, cuisine: [...prev.cuisine, cuisine] };
    });
  };

  // 1. Save Profile Details
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!isOwner) {
      toast.error('Only the restaurant owner can modify restaurant profile.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateRestaurantProfileApi(token, {
        ...profileForm,
        cuisine: profileForm.cuisine,
      });
      setProfileData(updated);
      if (refreshRestaurant) refreshRestaurant();
      toast.success('Restaurant profile and branding updated successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update restaurant profile.');
    } finally {
      setSaving(false);
    }
  };

  // 2. Save Operating Hours
  const handleSaveHours = async () => {
    if (!isOwner) {
      toast.error('Only the restaurant owner can configure operating hours.');
      return;
    }
    setSaving(true);
    try {
      const updatedHours = await updateOpeningHoursApi(token, hours);
      setHours(updatedHours);
      if (refreshRestaurant) refreshRestaurant();
      toast.success('Operating hours schedule saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update operating hours.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Action: Apply 10:00 - 23:00 to all open days
  const handleApplyStandardHours = () => {
    setHours((prev) =>
      prev.map((h) => ({
        ...h,
        openTime: '10:00',
        closeTime: '23:00',
        isClosed: false,
      }))
    );
    toast.info('Standard hours (10:00 AM - 11:00 PM) applied to all days. Click Save to persist.');
  };

  // 3. Save POS & Tax Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!isOwner) {
      toast.error('Only the restaurant owner can configure operational settings.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateRestaurantSettingsApi(token, {
        currency: settingsForm.currency,
        taxRatePercent: parseFloat(settingsForm.taxRatePercent) || 0,
        serviceChargePercent: parseFloat(settingsForm.serviceChargePercent) || 0,
        autoAcceptReservations: Boolean(settingsForm.autoAcceptReservations),
        allowSpecialRequests: Boolean(settingsForm.allowSpecialRequests),
      });
      setSettingsForm({
        currency: updated.currency || 'INR',
        taxRatePercent: updated.taxRatePercent ?? 5,
        serviceChargePercent: updated.serviceChargePercent ?? 0,
        autoAcceptReservations: Boolean(updated.autoAcceptReservations),
        allowSpecialRequests: updated.allowSpecialRequests !== false,
      });
      if (refreshRestaurant) refreshRestaurant();
      toast.success('POS, Billing & Tax configuration saved successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to update operational settings.');
    } finally {
      setSaving(false);
    }
  };

  // 4. Toggle Open / Close Status
  const handleToggleOpenStatus = async () => {
    if (!isOwner) {
      toast.error('Only restaurant owners can open or close the dining service.');
      return;
    }
    setTogglingOpen(true);
    try {
      const nextStatus = !profileData?.isOpenNow;
      const res = await toggleOpenStatusApi(token, nextStatus);
      setProfileData((prev) => (prev ? { ...prev, isOpenNow: res.isOpenNow } : null));
      if (refreshRestaurant) refreshRestaurant();
      toast.success(
        res.isOpenNow
          ? '🎉 Dining Service OPEN! Guests can be seated and new orders accepted.'
          : '⚠️ Dining Service CLOSED. New dine-in orders paused.'
      );
    } catch (err) {
      toast.error(err.message || 'Failed to toggle dining open status.');
    } finally {
      setTogglingOpen(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <RefreshCw size={28} className="spin-anim" style={{ color: 'var(--accent-primary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading restaurant settings & profile...</p>
      </div>
    );
  }

  const isOpen = Boolean(profileData?.isOpenNow);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1320px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner / Store Header */}
      <div
        className="glass-panel"
        style={{
          padding: '1.75rem 2rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(168, 85, 247, 0.25))',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.15)',
            }}
          >
            <Store size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
              <span className={`badge ${isOpen ? 'badge-success' : 'badge-danger'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span className="pulse-dot" style={{ backgroundColor: isOpen ? '#34d399' : '#f87171' }} />
                {isOpen ? 'OPEN FOR DINING' : 'CLOSED'}
              </span>
              <span className="badge badge-purple">
                Plan: {profileData?.subscriptionPlan || 'BASIC'}
              </span>
              <span className="badge badge-indigo">
                {profileData?.businessType || 'Dine-In Restaurant'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              {profileData?.name || 'Restaurant Settings'}
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0.25rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span>Owner: <strong>{user?.name || user?.email}</strong></span>
              {profileData?.city && (
                <span>• <MapPin size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> {profileData.city}, {profileData.state}</span>
              )}
              {profileData?.fssaiNumber && (
                <span>• FSSAI: <span style={{ fontFamily: 'monospace', color: '#34d399' }}>{profileData.fssaiNumber}</span></span>
              )}
            </p>
          </div>
        </div>

        {/* Master Quick Open/Close Action */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          {isOwner && (
            <button
              onClick={handleToggleOpenStatus}
              disabled={togglingOpen}
              className="btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.55rem',
                borderColor: isOpen ? 'var(--accent-success)' : 'var(--accent-danger)',
                color: isOpen ? 'var(--accent-success)' : 'var(--accent-danger)',
                background: isOpen ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                padding: '0.75rem 1.35rem',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                boxShadow: isOpen ? '0 0 16px rgba(16, 185, 129, 0.15)' : 'none',
              }}
              title="Toggle Live Floor Dining Acceptance"
            >
              <Power size={17} className={togglingOpen ? 'spin-anim' : ''} />
              <span>{isOpen ? 'Dining is OPEN' : 'Dining is CLOSED'}</span>
            </button>
          )}

          <button
            onClick={loadProfile}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '0.75rem 1rem', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <RefreshCw size={15} className={loading ? 'spin-anim' : ''} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.65rem',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setActiveTab('profile')}
          className={activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.88rem', padding: '0.6rem 1.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Layers size={16} /> Restaurant Profile & Branding
        </button>
        <button
          onClick={() => setActiveTab('hours')}
          className={activeTab === 'hours' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.88rem', padding: '0.6rem 1.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Calendar size={16} /> Weekly Operating Hours
        </button>
        <button
          onClick={() => setActiveTab('pos')}
          className={activeTab === 'pos' ? 'btn-primary' : 'btn-secondary'}
          style={{ fontSize: '0.88rem', padding: '0.6rem 1.35rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Sliders size={16} /> POS, Tax & Billing Configuration
        </button>
      </div>

      {/* TAB 1: RESTAURANT PROFILE & BRANDING */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveProfile} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={20} color="var(--accent-primary)" />
              Establishment Information & Identity
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Update your restaurant public profile, customer-facing contact details, and dining classifications.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {/* Restaurant Name */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Restaurant Name *
              </label>
              <input
                type="text"
                className="input-field"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
                disabled={!isOwner}
              />
            </div>

            {/* Business Type */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Business Category
              </label>
              <select
                className="input-field"
                value={profileForm.businessType}
                onChange={(e) => setProfileForm({ ...profileForm, businessType: e.target.value })}
                disabled={!isOwner}
              >
                <option value="Dine-In Restaurant">Dine-In Restaurant</option>
                <option value="Fine Dining">Fine Dining</option>
                <option value="Casual Dining Bistro">Casual Dining Bistro</option>
                <option value="Cafe & Lounge">Cafe & Lounge</option>
                <option value="Quick Service / Fast Casual">Quick Service / Fast Casual</option>
                <option value="Buffet & Banquet">Buffet & Banquet</option>
                <option value="Bar & Kitchen">Bar & Kitchen</option>
              </select>
            </div>

            {/* Contact Email */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Operational Email *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input-field"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  required
                  disabled={!isOwner}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Contact Phone */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Contact Phone *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  className="input-field"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  required
                  disabled={!isOwner}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Phone size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Website URL */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Official Website
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://myrestaurant.com"
                  value={profileForm.website}
                  onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                  disabled={!isOwner}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Globe size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            {/* Seating Capacity */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Total Seating Capacity
              </label>
              <input
                type="number"
                min="0"
                className="input-field"
                value={profileForm.seatingCapacity}
                onChange={(e) => setProfileForm({ ...profileForm, seatingCapacity: parseInt(e.target.value, 10) || 0 })}
                disabled={!isOwner}
              />
            </div>
          </div>

          {/* Location & Address */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MapPin size={17} color="var(--accent-primary)" />
              Physical Address & Location
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div style={{ gridColumn: 'span 2' }}>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  Street Address *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="123 Dining Promenade, Landmark"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  required
                  disabled={!isOwner}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  City *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.city}
                  onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                  required
                  disabled={!isOwner}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  State / Region *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.state}
                  onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                  required
                  disabled={!isOwner}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.postalCode}
                  onChange={(e) => setProfileForm({ ...profileForm, postalCode: e.target.value })}
                  disabled={!isOwner}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  Country
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={profileForm.country}
                  onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}
                  disabled={!isOwner}
                />
              </div>
            </div>
          </div>

          {/* Description & Cuisines */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              Cuisines & Dining Story
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
              Select the culinary specialties your kitchen prepares. Click to toggle.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
              {POPULAR_CUISINES.map((cuisine) => {
                const selected = profileForm.cuisine.includes(cuisine);
                return (
                  <button
                    key={cuisine}
                    type="button"
                    onClick={() => toggleCuisineTag(cuisine)}
                    disabled={!isOwner}
                    style={{
                      padding: '0.4rem 0.85rem',
                      borderRadius: '999px',
                      fontSize: '0.82rem',
                      fontWeight: selected ? 700 : 500,
                      cursor: isOwner ? 'pointer' : 'default',
                      border: selected ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                      background: selected ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                      color: selected ? '#ffffff' : 'var(--text-muted)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {selected ? '✓ ' : '+ '} {cuisine}
                  </button>
                );
              })}
            </div>

            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Restaurant Bio / Story
              </label>
              <textarea
                className="input-field"
                rows="3"
                placeholder="Share your culinary heritage, chef philosophy, or ambience..."
                value={profileForm.description}
                onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                disabled={!isOwner}
              />
            </div>
          </div>

          {/* Legal / License details */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={18} color="var(--accent-success)" />
              Food Safety & Tax Compliance
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
              <div>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  FSSAI Food Safety License Number
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 11521018000452"
                  value={profileForm.fssaiNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, fssaiNumber: e.target.value })}
                  disabled={!isOwner}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                  GSTIN / Tax Identification
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  value={profileForm.gstNumber}
                  onChange={(e) => setProfileForm({ ...profileForm, gstNumber: e.target.value })}
                  disabled={!isOwner}
                  style={{ fontFamily: 'monospace' }}
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          {isOwner && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', padding: '0.75rem 1.75rem' }}
              >
                <Save size={16} />
                <span>{saving ? 'Saving Changes...' : 'Save Profile & Branding'}</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* TAB 2: OPERATING HOURS SCHEDULE */}
      {activeTab === 'hours' && (
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Clock size={20} color="var(--accent-primary)" />
                Weekly Dining & Kitchen Schedule
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
                Define floor opening and closing hours for each day of the week. Reservations and walk-ins adhere to this window.
              </p>
            </div>

            {isOwner && (
              <button
                type="button"
                onClick={handleApplyStandardHours}
                className="btn-secondary"
                style={{ fontSize: '0.82rem', padding: '0.5rem 0.95rem' }}
              >
                Apply 10:00 AM - 11:00 PM All Days
              </button>
            )}
          </div>

          {/* Schedule Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                  <th style={{ padding: '0.85rem 1rem' }}>Day</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Opening Time</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Closing Time</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Hours Preview</th>
                </tr>
              </thead>
              <tbody>
                {hours.map((h, idx) => {
                  return (
                    <tr
                      key={h.day}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        backgroundColor: h.isClosed ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
                        {h.day}
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: isOwner ? 'pointer' : 'default', fontSize: '0.85rem' }}>
                          <input
                            type="checkbox"
                            checked={!h.isClosed}
                            onChange={(e) => {
                              if (!isOwner) return;
                              const updated = [...hours];
                              updated[idx].isClosed = !e.target.checked;
                              setHours(updated);
                            }}
                            disabled={!isOwner}
                          />
                          <span style={{ color: h.isClosed ? '#f87171' : '#34d399', fontWeight: 600 }}>
                            {h.isClosed ? 'Closed' : 'Open'}
                          </span>
                        </label>
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <input
                          type="time"
                          className="input-field"
                          value={h.openTime || '10:00'}
                          onChange={(e) => {
                            if (!isOwner) return;
                            const updated = [...hours];
                            updated[idx].openTime = e.target.value;
                            setHours(updated);
                          }}
                          disabled={h.isClosed || !isOwner}
                          style={{ maxWidth: '140px', padding: '0.45rem 0.65rem', opacity: h.isClosed ? 0.4 : 1 }}
                        />
                      </td>

                      <td style={{ padding: '1rem' }}>
                        <input
                          type="time"
                          className="input-field"
                          value={h.closeTime || '23:00'}
                          onChange={(e) => {
                            if (!isOwner) return;
                            const updated = [...hours];
                            updated[idx].closeTime = e.target.value;
                            setHours(updated);
                          }}
                          disabled={h.isClosed || !isOwner}
                          style={{ maxWidth: '140px', padding: '0.45rem 0.65rem', opacity: h.isClosed ? 0.4 : 1 }}
                        />
                      </td>

                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        {h.isClosed ? (
                          <span className="badge badge-danger">Not Accepting Orders</span>
                        ) : (
                          <span>{h.openTime} to {h.closeTime}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {isOwner && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
              <button
                type="button"
                onClick={handleSaveHours}
                disabled={saving}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', padding: '0.75rem 1.75rem' }}
              >
                <Save size={16} />
                <span>{saving ? 'Saving Hours...' : 'Save Operating Hours'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: POS, TAX & BILLING SETTINGS */}
      {activeTab === 'pos' && (
        <form onSubmit={handleSaveSettings} className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 0.35rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sliders size={20} color="var(--accent-primary)" />
              Point-of-Sale, Tax & Calculation Parameters
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Adjust default billing currency, value-added taxes, service surcharges, and guest handling behaviors.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {/* Currency Selector */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Primary Billing Currency *
              </label>
              <select
                className="input-field"
                value={settingsForm.currency}
                onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                disabled={!isOwner}
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Shown on orders, printed bills, receipts, and revenue reports.
              </span>
            </div>

            {/* Tax Rate % */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Standard Tax / GST Rate (%) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="input-field"
                  value={settingsForm.taxRatePercent}
                  onChange={(e) => setSettingsForm({ ...settingsForm, taxRatePercent: e.target.value })}
                  required
                  disabled={!isOwner}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Percent size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Automatically calculated on order food subtotal during bill generation (e.g. 5% GST).
              </span>
            </div>

            {/* Service Charge % */}
            <div>
              <label className="form-label" style={{ fontWeight: 600, display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                Service Charge / Gratuity (%)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="50"
                  className="input-field"
                  value={settingsForm.serviceChargePercent}
                  onChange={(e) => setSettingsForm({ ...settingsForm, serviceChargePercent: e.target.value })}
                  disabled={!isOwner}
                  style={{ paddingLeft: '2.4rem' }}
                />
                <Percent size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '4px', display: 'block' }}>
                Optional restaurant service charge percentage added before tax.
              </span>
            </div>
          </div>

          {/* Guest Experience & Reservation Policy */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: 'var(--text-main)' }}>
              Guest Experience & Table Operations Policy
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  cursor: isOwner ? 'pointer' : 'default',
                }}
              >
                <input
                  type="checkbox"
                  checked={settingsForm.autoAcceptReservations}
                  onChange={(e) => setSettingsForm({ ...settingsForm, autoAcceptReservations: e.target.checked })}
                  disabled={!isOwner}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    Auto-Confirm Table Reservations
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    When checked, reservation requests that have no table conflicts are automatically confirmed without requiring manual staff review.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.85rem',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  cursor: isOwner ? 'pointer' : 'default',
                }}
              >
                <input
                  type="checkbox"
                  checked={settingsForm.allowSpecialRequests}
                  onChange={(e) => setSettingsForm({ ...settingsForm, allowSpecialRequests: e.target.checked })}
                  disabled={!isOwner}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                    Allow Food Preparation & Seating Special Requests
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Permits guests and waitstaff to add custom preparation notes (e.g. allergies, no spice, booth preference).
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          {isOwner && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.55rem', padding: '0.75rem 1.75rem' }}
              >
                <Save size={16} />
                <span>{saving ? 'Saving Settings...' : 'Save POS & Tax Settings'}</span>
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default RestaurantSettingsPage;
