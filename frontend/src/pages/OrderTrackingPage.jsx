import React, { useState, useEffect } from 'react';
import { Search, Package, Clock, FileText, Ban, ArrowRight, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { orderApi } from '../api/orderApi';
import OrderStepper from '../components/OrderStepper';
import PackingSlipModal from '../components/PackingSlipModal';

const NEXT_STATUS = {
  PLACED: { next: 'VERIFIED', label: 'Verify Order (Pharmacist)' },
  VERIFIED: { next: 'PACKED', label: 'Pack & Scan (Dispensing)' },
  PACKED: { next: 'OUT_FOR_DELIVERY', label: 'Dispatch to Courier' },
  OUT_FOR_DELIVERY: { next: 'DELIVERED', label: 'Confirm OTP Handover' },
};

export default function OrderTrackingPage({ initialOrder, currentRole }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(initialOrder || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Packing slip modal
  const [packingSlipData, setPackingSlipData] = useState(null);

  // Cancel modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Customer requested prescription dosage modification');

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (initialOrder) {
      setSelectedOrder(initialOrder);
    }
  }, [initialOrder]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await orderApi.getOrders();
      const list = res.data || [];
      setOrders(list);
      if (!selectedOrder && list.length > 0) {
        setSelectedOrder(list[0]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError(null);
      const res = await orderApi.trackOrderByNumber(searchQuery.trim());
      setSelectedOrder(res.data);
    } catch (err) {
      setError(err.message || `No order found with number: ${searchQuery}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async (nextStatus) => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await orderApi.updateOrderStatus(selectedOrder.id, nextStatus, 'Workflow stage advanced via portal');
      setSelectedOrder(res.data);
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to advance order status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await orderApi.cancelOrder(selectedOrder.id, cancelReason);
      setSelectedOrder(res.data);
      setShowCancelModal(false);
      fetchOrders();
    } catch (err) {
      setError(err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewPackingSlip = async () => {
    if (!selectedOrder) return;
    try {
      setActionLoading(true);
      const res = await orderApi.getPackingSlip(selectedOrder.id);
      setPackingSlipData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to generate packing slip');
    } finally {
      setActionLoading(false);
    }
  };

  const isTerminal = selectedOrder?.status === 'DELIVERED' || selectedOrder?.status === 'CANCELLED';
  const nextAction = selectedOrder ? NEXT_STATUS[selectedOrder.status] : null;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>
            Real-Time <span className="gradient-text">Order Fulfillment Tracker</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Track end-to-end pharmacy dispensing stages and inspect manufacturer batch traceability.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={fetchOrders} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'pulse-indicator' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', marginBottom: '28px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '16px', top: '14px' }} />
          <input
            type="text"
            className="input-glass font-mono"
            style={{ paddingLeft: '44px' }}
            placeholder="Search by order number (e.g. ORD-123456-ABCD)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          Track Order
        </button>
      </form>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '14px 18px', borderRadius: '12px', color: '#fb7185', fontSize: '0.88rem', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Layout: Order List + Order Detail */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2.4fr', gap: '24px', alignItems: 'start' }}>
        {/* Recent Orders List */}
        <div className="glass-panel" style={{ padding: '18px' }}>
          <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
            Recent Orders ({orders.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '550px', overflowY: 'auto' }}>
            {orders.map((ord) => {
              const isSelected = selectedOrder?.id === ord.id;
              return (
                <div
                  key={ord.id}
                  onClick={() => setSelectedOrder(ord)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.5)',
                    border: `1px solid ${isSelected ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-glass)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span className="font-mono" style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? '#34d399' : '#ffffff' }}>
                      {ord.orderNumber}
                    </span>
                    <span className={`badge ${
                      ord.status === 'DELIVERED' ? 'badge-emerald' :
                      ord.status === 'CANCELLED' ? 'badge-rose' : 'badge-blue'
                    }`} style={{ fontSize: '0.65rem' }}>
                      {ord.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <span>{ord.customerName}</span>
                    <strong style={{ color: '#f8fafc' }}>${Number(ord.totalAmount).toFixed(2)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Order Detailed View */}
        {selectedOrder ? (
          <div className="glass-panel" style={{ padding: '28px' }}>
            {/* Order Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-glass)', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 className="font-mono" style={{ fontSize: '1.4rem', margin: 0 }}>{selectedOrder.orderNumber}</h2>
                  <span className={`badge ${
                    selectedOrder.status === 'DELIVERED' ? 'badge-emerald' :
                    selectedOrder.status === 'CANCELLED' ? 'badge-rose' : 'badge-blue'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()} • Recipient: <strong style={{ color: '#ffffff' }}>{selectedOrder.customerName}</strong>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981' }}>
                  ${Number(selectedOrder.totalAmount).toFixed(2)}
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>FEFO Allocated Value</span>
              </div>
            </div>

            {/* Stepper Progress Bar (T-04.1 & T-04.4) */}
            <OrderStepper
              currentStatus={selectedOrder.status}
              estimatedDispatch={selectedOrder.estimatedDispatchTime}
              estimatedDelivery={selectedOrder.estimatedDeliveryTime}
            />

            {/* Actions Bar (Advance Status, Packing Slip, Cancel) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0', background: 'rgba(15, 23, 42, 0.6)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="btn btn-sm btn-secondary" onClick={handleViewPackingSlip} disabled={actionLoading}>
                  <FileText size={15} />
                  <span>Generate Packing Slip</span>
                </button>

                {!isTerminal && (
                  <button className="btn btn-sm btn-danger" onClick={() => setShowCancelModal(true)} disabled={actionLoading}>
                    <Ban size={15} />
                    <span>Cancel & Restock</span>
                  </button>
                )}
              </div>

              {/* Workflow Stepper Transition (SP1-04 / T-04.2) */}
              {nextAction && !isTerminal && (
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => handleAdvanceStatus(nextAction.next)}
                  disabled={actionLoading}
                >
                  <span>{nextAction.label}</span>
                  <ArrowRight size={15} />
                </button>
              )}
            </div>

            {/* Allocated Batches & Line Items Table */}
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                Allocated Batches & Warehouse Shelf Locations (FEFO Dispensed)
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedOrder.items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'rgba(30, 41, 59, 0.4)',
                      borderRadius: '10px',
                      border: '1px solid var(--border-glass)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{item.medicineName} ({item.dosage})</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', marginTop: '2px' }}>
                        <span>Allocated Batch: <strong className="font-mono" style={{ color: '#38bdf8' }}>{item.batchNumber}</strong></span>
                        <span>Shelf: <strong style={{ color: '#c084fc' }}>{item.shelfLocation || 'Main Aisle'}</strong></span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div>{item.quantity} units × ${Number(item.unitPrice).toFixed(2)}</div>
                      <strong className="font-mono" style={{ color: '#10b981' }}>${Number(item.subtotal).toFixed(2)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Select an order to inspect real-time fulfillment and batch traceability.
          </div>
        )}
      </div>

      {/* Packing Slip Modal */}
      {packingSlipData && (
        <PackingSlipModal slipData={packingSlipData} onClose={() => setPackingSlipData(null)} />
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', color: '#fb7185' }}>
              <Ban size={22} />
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Cancel Order & Restock Batches</h3>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Cancelling order <strong className="font-mono">{selectedOrder.orderNumber}</strong> will immediately restock all allocated units back into their respective inventory batches (SP3-06 / T-04.4).
            </p>

            <form onSubmit={handleCancelOrder}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                Cancellation & Refund Audit Reason
              </label>
              <textarea
                className="input-glass"
                rows="3"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                required
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '18px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCancelModal(false)}>
                  Close
                </button>
                <button type="submit" className="btn btn-danger" disabled={actionLoading}>
                  {actionLoading ? 'Restocking...' : 'Confirm Cancellation & Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
