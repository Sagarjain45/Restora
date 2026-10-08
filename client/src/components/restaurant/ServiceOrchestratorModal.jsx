import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Users,
  LayoutGrid,
  Clock,
  Utensils,
  Receipt,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Plus,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { getTablesApi, updateTableStatusApi } from '../../services/tableService';
import { getMenuItemsApi } from '../../services/menuService';
import { createOrderApi } from '../../services/orderService';
import { generateBillApi, recordPaymentApi } from '../../services/billingService';
import { addToQueueApi, seatCustomerApi } from '../../services/queueService';

const ServiceOrchestratorModal = ({
  isOpen,
  onClose,
  token,
  onWorkflowComplete,
  currency = 'INR',
}) => {
  if (!isOpen) return null;

  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  // Active step: 1 = 'arrival' (Check Tables / Queue), 2 = 'order' (Build Order), 3 = 'billing' (Bill & Pay)
  const [activeStep, setActiveStep] = useState(1);

  // Data
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Step 1: Walk-in Arrival state
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [selectedTableId, setSelectedTableId] = useState('');

  // Step 2: Order state
  const [cartItems, setCartItems] = useState({}); // menuItemId -> quantity
  const [createdOrder, setCreatedOrder] = useState(null);

  // Step 3: Bill & Payment state
  const [generatedBill, setGeneratedBill] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentResult, setPaymentResult] = useState(null);

  // Load tables & menu items
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [tableRes, menuRes] = await Promise.all([
        getTablesApi(token),
        getMenuItemsApi(token, { availableOnly: true }),
      ]);
      setTables(tableRes.data || []);
      setMenuItems(menuRes.data || []);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to load restaurant data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
      setActiveStep(1);
      setGuestName('');
      setGuestPhone('');
      setGuestCount(2);
      setSelectedTableId('');
      setCartItems({});
      setCreatedOrder(null);
      setGeneratedBill(null);
      setPaymentResult(null);
      setFeedback(null);
    }
  }, [isOpen]);

  // Available tables matching party size
  const availableTables = tables.filter(
    (t) => t.status === 'AVAILABLE' && t.isActive !== false && t.capacity >= guestCount
  );

  // Handler: Seat directly at table & proceed to order
  const handleProceedToOrder = (tableId) => {
    setSelectedTableId(tableId);
    setActiveStep(2);
  };

  // Handler: Add to Queue if no table is immediately preferred
  const handleAddToQueue = async () => {
    if (!guestName.trim()) {
      setFeedback({ type: 'error', text: 'Please enter guest name to join waiting queue.' });
      return;
    }
    setProcessing(true);
    try {
      await addToQueueApi(token, {
        customerName: guestName.trim(),
        customerPhone: guestPhone.trim() || undefined,
        guestCount: parseInt(guestCount, 10),
      });
      setFeedback({
        type: 'success',
        text: `Party "${guestName}" added to the waiting queue! They will be suggested once a table is freed.`,
      });
      if (onWorkflowComplete) onWorkflowComplete();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to add guest to queue.' });
    } finally {
      setProcessing(false);
    }
  };

  // Cart operations
  const updateItemQty = (item, delta) => {
    setCartItems((prev) => {
      const current = prev[item._id]?.quantity || 0;
      const next = current + delta;
      if (next <= 0) {
        const copy = { ...prev };
        delete copy[item._id];
        return copy;
      }
      return {
        ...prev,
        [item._id]: {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: next,
        },
      };
    });
  };

  const cartList = Object.values(cartItems);
  const cartSubtotal = cartList.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const estimatedTax = Math.round(cartSubtotal * 0.05 * 100) / 100;
  const estimatedTotal = Math.round((cartSubtotal + estimatedTax) * 100) / 100;

  // Handler: Place Order on selected table
  const handlePlaceOrder = async () => {
    if (cartList.length === 0) {
      setFeedback({ type: 'error', text: 'Select at least one dish to place order.' });
      return;
    }
    setProcessing(true);
    try {
      const order = await createOrderApi(token, {
        tableId: selectedTableId,
        items: cartList.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
        notes: guestName ? `Guest: ${guestName}` : '',
      });
      setCreatedOrder(order);
      setFeedback({ type: 'success', text: `Order #${order.orderNumber} placed! Table is now OCCUPIED.` });
      setActiveStep(3);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to place order.' });
    } finally {
      setProcessing(false);
    }
  };

  // Handler: Generate Bill & Collect Payment
  const handleGenerateAndSettleBill = async () => {
    if (!createdOrder) return;
    setProcessing(true);
    try {
      // 1. Generate Bill
      const bill = await generateBillApi(token, {
        orderId: createdOrder._id,
      });
      setGeneratedBill(bill);

      // 2. Settle Payment
      const result = await recordPaymentApi(token, bill._id, {
        paymentMethod,
        amount: bill.total,
      });
      setPaymentResult(result);
      setFeedback({
        type: 'success',
        text: `Full workflow completed! Bill settled via ${paymentMethod}. Table released to AVAILABLE.`,
      });

      if (onWorkflowComplete) onWorkflowComplete();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Billing settlement failed.' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1.5rem',
      }}
      onClick={(e) => e.target === e.currentTarget && !processing && onClose()}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          padding: '2rem',
          background: 'rgba(15, 23, 42, 0.96)',
          borderRadius: '16px',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Zap size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                End-to-End Service Flow Orchestrator
              </h2>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                Walk-in Arrival &rarr; Seat / Queue &rarr; Order Food &rarr; Bill & Settle Payment &rarr; Release Table
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={processing}
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

        {/* Workflow Progress Breadcrumb */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            marginBottom: '1.5rem',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: activeStep >= 1 ? '#fbbf24' : 'var(--text-muted)', fontWeight: activeStep === 1 ? '700' : '500' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: activeStep >= 1 ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>1</span>
            Arrival & Table
          </div>
          <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: activeStep >= 2 ? '#818cf8' : 'var(--text-muted)', fontWeight: activeStep === 2 ? '700' : '500' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: activeStep >= 2 ? '#818cf8' : 'rgba(255, 255, 255, 0.1)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>2</span>
            Kitchen Order
          </div>
          <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: activeStep >= 3 ? '#4ade80' : 'var(--text-muted)', fontWeight: activeStep === 3 ? '700' : '500' }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: activeStep >= 3 ? '#4ade80' : 'rgba(255, 255, 255, 0.1)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '700' }}>3</span>
            Billing & Release
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            style={{
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: feedback.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
              border: `1px solid ${feedback.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
              color: feedback.type === 'error' ? '#f87171' : '#4ade80',
              fontSize: '0.85rem',
            }}
          >
            {feedback.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* STEP 1: ARRIVAL & CHECK TABLES */}
        {activeStep === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Guest Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Contact Phone</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Party Size (Guests)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={guestCount}
                  onChange={(e) => setGuestCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  style={{ width: '100%', padding: '0.6rem 0.75rem', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-subtle)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Table Availability Evaluation */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <LayoutGrid size={16} /> Available Floor Tables ({availableTables.length})
                </h4>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Party size: {guestCount} guest{guestCount > 1 ? 's' : ''}
                </span>
              </div>

              {availableTables.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {availableTables.map((t) => (
                    <button
                      key={t._id}
                      onClick={() => handleProceedToOrder(t._id)}
                      style={{
                        padding: '1rem 0.75rem',
                        background: 'rgba(34, 197, 94, 0.12)',
                        border: '1px solid rgba(34, 197, 94, 0.35)',
                        borderRadius: '10px',
                        color: 'var(--text-main)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.25rem',
                        transition: 'all 0.15s',
                      }}
                    >
                      <strong style={{ fontSize: '1.05rem', color: '#4ade80' }}>Table {t.tableNumber}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Seats: {t.capacity}</span>
                      <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '4px', background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80', fontWeight: '600', marginTop: '0.25rem' }}>
                        Seat & Order &rarr;
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '1.5rem', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '10px', border: '1px dashed rgba(239, 68, 68, 0.3)', textAlign: 'center' }}>
                  <p style={{ color: '#f87171', fontSize: '0.85rem', margin: '0 0 0.75rem 0' }}>
                    No available tables can accommodate {guestCount} guests right now.
                  </p>
                  <button
                    onClick={handleAddToQueue}
                    disabled={processing}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  >
                    <Clock size={15} /> Add to Waiting Queue &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 2: BUILD KITCHEN ORDER */}
        {activeStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.25)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                Seated at: <strong>Table {tables.find((t) => t._id === selectedTableId)?.tableNumber || 'Selected'}</strong>
                {guestName && ` • Guest: ${guestName}`}
              </span>
              <button onClick={() => setActiveStep(1)} style={{ background: 'none', border: 'none', color: '#818cf8', fontSize: '0.8rem', cursor: 'pointer' }}>
                Change Table
              </button>
            </div>

            {/* Menu Picker & Cart */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.25rem' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 0.5rem 0' }}>Add Dishes from Menu</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '280px', overflowY: 'auto' }}>
                  {menuItems.map((item) => (
                    <div
                      key={item._id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.65rem 0.85rem',
                        background: 'rgba(0, 0, 0, 0.25)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-main)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>{currencySymbol}{item.price}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => updateItemQty(item, -1)}
                          style={{ width: '24px', height: '24px', borderRadius: '4px', border: '1px solid var(--border-subtle)', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                        >
                          -
                        </button>
                        <span style={{ fontSize: '0.85rem', minWidth: '18px', textAlign: 'center' }}>
                          {cartItems[item._id]?.quantity || 0}
                        </span>
                        <button
                          onClick={() => updateItemQty(item, 1)}
                          style={{ width: '24px', height: '24px', borderRadius: '4px', border: 'none', background: 'var(--primary)', color: '#fff', cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Order Summary */}
              <div style={{ background: 'rgba(0, 0, 0, 0.35)', padding: '1rem', borderRadius: '10px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: '0 0 0.75rem 0' }}>Order Summary</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '180px', overflowY: 'auto' }}>
                    {cartList.map((i) => (
                      <div key={i.menuItemId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                        <span>{i.quantity}x {i.name}</span>
                        <span style={{ fontWeight: '600' }}>{currencySymbol}{i.price * i.quantity}</span>
                      </div>
                    ))}
                    {cartList.length === 0 && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No dishes selected yet</span>
                    )}
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.75rem', marginTop: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Subtotal:</span>
                    <span>{currencySymbol}{cartSubtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Tax (5%):</span>
                    <span>{currencySymbol}{estimatedTax}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '700', color: '#4ade80', marginTop: '0.25rem' }}>
                    <span>Total:</span>
                    <span>{currencySymbol}{estimatedTotal}</span>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={cartList.length === 0 || processing}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '0.75rem', padding: '0.55rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                  >
                    <Utensils size={15} /> Place Order & Occupy Table &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: BILLING & PAYMENT SETTLEMENT */}
        {activeStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {paymentResult ? (
              <div style={{ padding: '2rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)', textAlign: 'center' }}>
                <CheckCircle2 size={42} style={{ color: '#4ade80', margin: '0 auto 0.75rem auto' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                  Service Cycle Completed!
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 1.25rem 0' }}>
                  Bill settled via {paymentMethod}. Table has been automatically restored to AVAILABLE status.
                </p>

                {paymentResult.suggestedQueueParty && (
                  <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.15)', borderRadius: '8px', border: '1px solid rgba(99, 102, 241, 0.3)', marginBottom: '1.25rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#818cf8', margin: 0, fontWeight: '600' }}>
                      ⚡ Next in Queue: {paymentResult.suggestedQueueParty.customerName} (Party of {paymentResult.suggestedQueueParty.guestCount}) fits this table!
                    </p>
                  </div>
                )}

                <button onClick={onClose} className="btn btn-primary" style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem' }}>
                  Done
                </button>
              </div>
            ) : (
              <div>
                <div style={{ padding: '1.25rem', background: 'rgba(0, 0, 0, 0.25)', borderRadius: '10px', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      Active Order: <strong>#{createdOrder?.orderNumber}</strong>
                    </span>
                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#4ade80' }}>
                      Amount Due: {currencySymbol}{(createdOrder?.total || 0).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                    {['UPI', 'CARD', 'CASH'].map((m) => (
                      <button
                        key={m}
                        onClick={() => setPaymentMethod(m)}
                        style={{
                          flex: 1,
                          padding: '0.65rem',
                          borderRadius: '8px',
                          border: paymentMethod === m ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                          background: paymentMethod === m ? 'rgba(99, 102, 241, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                          color: paymentMethod === m ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button onClick={onClose} className="btn btn-secondary" style={{ padding: '0.55rem 1.25rem', fontSize: '0.85rem' }}>
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateAndSettleBill}
                    disabled={processing}
                    className="btn btn-primary"
                    style={{ padding: '0.55rem 1.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                  >
                    <CreditCard size={15} />
                    {processing ? 'Settling...' : 'Generate Bill, Settle & Release Table'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceOrchestratorModal;
