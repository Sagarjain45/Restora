import React, { useState, useEffect, useCallback } from 'react';
import useAuth from '../../hooks/useAuth';
import {
  Receipt,
  Search,
  RefreshCw,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Banknote,
  QrCode,
  DollarSign,
  TrendingUp,
  FileText,
  X,
  Filter,
} from 'lucide-react';
import {
  getBillsApi,
  generateBillApi,
  recordPaymentApi,
  voidBillApi,
} from '../../services/billingService';
import { getOrdersApi } from '../../services/orderService';
import PaymentModal from '../../components/restaurant/PaymentModal';
import GenerateBillModal from '../../components/restaurant/GenerateBillModal';

const BillingManagementPage = () => {
  const { token, restaurant } = useAuth();
  const currency = restaurant?.settings?.currency || 'INR';
  const currencySymbol = currency === 'INR' ? '₹' : currency === 'USD' ? '$' : `${currency} `;

  // Bills and Active Orders State
  const [bills, setBills] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [notice, setNotice] = useState(null);

  // Modals State
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [orderForBilling, setOrderForBilling] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 1. Fetch Bills & Active Orders
  const loadBillingData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [billsRes, ordersRes] = await Promise.all([
        getBillsApi(token, {
          paymentStatus: statusFilter,
          search: searchQuery.trim() || undefined,
        }).catch((err) => {
          console.warn('Error fetching bills:', err.message);
          return { data: [] };
        }),
        getOrdersApi(token, {
          activeOnly: true,
        }).catch((err) => {
          console.warn('Error fetching active orders:', err.message);
          return { data: [] };
        }),
      ]);

      setBills(billsRes.data || []);
      // Orders that can be billed: active orders not CANCELLED or COMPLETED
      const openOrders = (ordersRes.data || []).filter(
        (o) => o.status !== 'CANCELLED' && o.status !== 'COMPLETED'
      );
      setActiveOrders(openOrders);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to load billing records.' });
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, searchQuery]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  // Handle Bill Generation
  const handleGenerateBill = async (billData) => {
    setIsProcessing(true);
    try {
      const newBill = await generateBillApi(token, billData);
      setNotice({
        type: 'success',
        message: `Bill #${newBill.billNumber || newBill._id.slice(-6)} created! Table moved to BILLING state.`,
      });
      setIsGenerateModalOpen(false);
      setOrderForBilling(null);
      await loadBillingData();
      // Directly open Payment Modal for the generated bill
      setSelectedBillForPayment(newBill);
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to generate bill.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Payment Settlement
  const handleRecordPayment = async (paymentData) => {
    if (!selectedBillForPayment) return;
    setIsProcessing(true);
    try {
      const settledPayment = await recordPaymentApi(token, selectedBillForPayment._id, paymentData);
      const queueAlert = settledPayment?.suggestedQueueParty
        ? ` 🎉 Queue Party "${settledPayment.suggestedQueueParty.customerName}" (Party of ${settledPayment.suggestedQueueParty.guestCount}) is waiting and fits this newly available table!`
        : '';
      setNotice({
        type: 'success',
        message: `Payment settled via ${paymentData.paymentMethod}! Table released to AVAILABLE and order closed.${queueAlert}`,
      });
      setSelectedBillForPayment(null);
      await loadBillingData();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Payment settlement failed.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Void Bill
  const handleVoidBill = async (billId, reason) => {
    setIsProcessing(true);
    try {
      await voidBillApi(token, billId, reason);
      setNotice({
        type: 'success',
        message: 'Bill has been successfully voided and table state refreshed.',
      });
      setSelectedBillForPayment(null);
      await loadBillingData();
    } catch (err) {
      setNotice({ type: 'error', message: err.message || 'Failed to void bill.' });
    } finally {
      setIsProcessing(false);
    }
  };

  // Calculations for Metrics
  const paidBills = bills.filter((b) => b.paymentStatus === 'PAID');
  const unpaidBills = bills.filter((b) => b.paymentStatus === 'UNPAID');
  const totalRevenueSettled = paidBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const pendingCollectionAmount = unpaidBills.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  // Client search filtering
  const filteredBills = bills.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const billNum = (b.billNumber || '').toLowerCase();
    const tableNum = (b.tableId?.tableNumber || '').toLowerCase();
    const orderNum = (b.orderId?.orderNumber || '').toLowerCase();
    return billNum.includes(q) || tableNum.includes(q) || orderNum.includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {/* Top Banner & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              <Receipt size={22} color="#ffffff" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Billing & Payment Operations</h1>
          </div>
          <p style={{ margin: '0.35rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Multi-method settlement (Cash, UPI, Card), automatic table release guard, and invoice records.
          </p>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={loadBillingData}
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
              setOrderForBilling(null);
              setIsGenerateModalOpen(true);
            }}
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
          >
            <Plus size={16} />
            <span>New Bill / Settle Table</span>
          </button>
        </div>
      </div>

      {/* Notice Banner */}
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

      {/* 4 Financial & Operational Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>REVENUE SETTLED</span>
            <DollarSign size={18} color="var(--accent-success)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-success)' }}>
            {currencySymbol}{totalRevenueSettled.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            {paidBills.length} invoices cleared
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>PENDING / UNPAID</span>
            <Clock size={18} color="var(--accent-warning)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--accent-warning)' }}>
            {currencySymbol}{pendingCollectionAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-warning)', marginTop: '0.2rem' }}>
            {unpaidBills.length} unpaid bill(s) awaiting payment
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>ACTIVE DINING ORDERS</span>
            <TrendingUp size={18} color="var(--accent-primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {activeOrders.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            Tables currently dining or ready to bill
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>TOTAL BILLS ISSUED</span>
            <Receipt size={18} color="var(--accent-cyan)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {bills.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
            All-time audit & billing ledger
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
          {['ALL', 'UNPAID', 'PAID', 'VOID'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={statusFilter === st ? 'btn-primary' : 'btn-secondary'}
              style={{
                fontSize: '0.78rem',
                padding: '0.35rem 0.75rem',
                borderRadius: '20px',
              }}
            >
              {st} {st === 'UNPAID' && unpaidBills.length > 0 && `(${unpaidBills.length})`}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', width: '280px', maxWidth: '100%' }}>
          <Search size={15} color="var(--text-dim)" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Bill #, Table, Order..."
            className="input-field"
            style={{ width: '100%', paddingLeft: '32px', fontSize: '0.85rem' }}
          />
        </div>
      </div>

      {/* Bills Ledger List */}
      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
        <div
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
            Invoices & Settlements ({filteredBills.length})
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Strict tenant isolation enforced
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.75rem' }} />
            <div>Loading billing records...</div>
          </div>
        ) : filteredBills.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Receipt size={40} style={{ margin: '0 auto 1rem', opacity: 0.3 }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>No bills found</h3>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.85rem', color: 'var(--text-dim)' }}>
              {statusFilter !== 'ALL'
                ? `No bills match filter "${statusFilter}".`
                : 'Generate a bill for any active table to begin settlement.'}
            </p>
            {activeOrders.length > 0 && (
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(true)}
                className="btn-primary"
                style={{ fontSize: '0.85rem' }}
              >
                <Plus size={15} /> Generate Bill from Active Table
              </button>
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-dim)' }}>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>BILL # / TIME</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>TABLE</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>ORDER INFO</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>SUBTOTAL / TAX</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>TOTAL AMOUNT</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600 }}>PAYMENT STATUS</th>
                  <th style={{ padding: '0.85rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredBills.map((b) => {
                  const isPaid = b.paymentStatus === 'PAID';
                  const isVoid = b.paymentStatus === 'VOID';
                  const isUnpaid = b.paymentStatus === 'UNPAID';

                  const createdTime = new Date(b.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const createdDate = new Date(b.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <tr
                      key={b._id}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      {/* Bill # */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <FileText size={14} color="var(--accent-primary)" />
                          <span>{b.billNumber || b._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                          {createdDate} • {createdTime}
                        </div>
                      </td>

                      {/* Table */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                          Table {b.tableId?.tableNumber || 'N/A'}
                        </span>
                        {b.tableId?.section && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {b.tableId.section}
                          </div>
                        )}
                      </td>

                      {/* Order info */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ color: 'var(--text-main)', fontWeight: 500 }}>
                          {b.orderId?.orderNumber || 'ORD-REF'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {b.items?.length || 0} items snapshot
                        </div>
                      </td>

                      {/* Subtotal / Tax */}
                      <td style={{ padding: '1rem 1.25rem', color: 'var(--text-muted)' }}>
                        <div>Sub: {currencySymbol}{(b.subtotal || 0).toFixed(2)}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          Tax: +{currencySymbol}{(b.taxAmount || 0).toFixed(2)}
                          {(b.discountAmount || 0) > 0 && ` • Disc: -${currencySymbol}${b.discountAmount}`}
                        </div>
                      </td>

                      {/* Total */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                          {currencySymbol}{(b.totalAmount || 0).toFixed(2)}
                        </div>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {isPaid && (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> PAID
                          </span>
                        )}
                        {isUnpaid && (
                          <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> UNPAID
                          </span>
                        )}
                        {isVoid && (
                          <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={12} /> VOID
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          {isUnpaid && (
                            <button
                              type="button"
                              onClick={() => setSelectedBillForPayment(b)}
                              className="btn-primary"
                              style={{
                                fontSize: '0.78rem',
                                padding: '0.4rem 0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <Banknote size={14} />
                              <span>Settle & Release</span>
                            </button>
                          )}

                          {isPaid && (
                            <button
                              type="button"
                              onClick={() => setSelectedBillForPayment(b)}
                              className="btn-secondary"
                              style={{
                                fontSize: '0.78rem',
                                padding: '0.4rem 0.85rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                              }}
                            >
                              <FileText size={14} />
                              <span>Receipt</span>
                            </button>
                          )}

                          {isVoid && (
                            <button
                              type="button"
                              onClick={() => setSelectedBillForPayment(b)}
                              className="btn-secondary"
                              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem' }}
                            >
                              Details
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
        )}
      </div>

      {/* Payment & Receipt Modal */}
      {selectedBillForPayment && (
        <PaymentModal
          isOpen={Boolean(selectedBillForPayment)}
          onClose={() => setSelectedBillForPayment(null)}
          bill={selectedBillForPayment}
          onRecordPayment={handleRecordPayment}
          onVoidBill={handleVoidBill}
          isProcessing={isProcessing}
          currency={currency}
        />
      )}

      {/* Generate Bill Modal */}
      {isGenerateModalOpen && (
        <GenerateBillModal
          isOpen={isGenerateModalOpen}
          onClose={() => {
            setIsGenerateModalOpen(false);
            setOrderForBilling(null);
          }}
          onSubmit={handleGenerateBill}
          activeOrders={activeOrders}
          initialOrder={orderForBilling}
          isProcessing={isProcessing}
          currency={currency}
        />
      )}
    </div>
  );
};

export default BillingManagementPage;
