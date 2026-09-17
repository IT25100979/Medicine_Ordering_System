import React, { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Check, AlertCircle, ArrowRight, Pill, ShieldAlert } from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';
import { orderApi } from '../api/orderApi';

export default function OrderPlacementPage({ onOrderPlaced }) {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cart state: { [medicineId]: quantity }
  const [cart, setCart] = useState({});

  // Checkout form
  const [customer, setCustomer] = useState({
    name: 'Kasun Bandara',
    email: 'kasun.bandara@gmail.com',
    phone: '+94 71 889 9123',
    address: 'No. 12/A, Kandy Road, Malabe',
  });

  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await inventoryApi.getMedicinesWithStock();
      setMedicines(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch medicines catalog');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id, delta, maxStock) => {
    const current = cart[id] || 0;
    const next = Math.max(0, Math.min(maxStock, current + delta));
    setCart((prev) => ({ ...prev, [id]: next }));
  };

  const cartItems = Object.entries(cart)
    .filter(([_, qty]) => qty > 0)
    .map(([id, qty]) => {
      const med = medicines.find((m) => m.id === Number(id));
      return { med, qty, subtotal: med ? med.unitPrice * qty : 0 };
    });

  const totalAmount = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        userId: 'user_sliit_patient_01',
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        shippingAddress: customer.address,
        items: cartItems.map((item) => ({
          medicineId: item.med.id,
          quantity: item.qty,
        })),
      };

      const res = await orderApi.placeOrder(payload);
      setOrderSuccess(res.data);
      setCart({});
      fetchMedicines(); // Refresh stock
      if (onOrderPlaced) {
        onOrderPlaced(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header Banner */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>
          Medicine Catalog & <span className="gradient-text-emerald">Order Placement</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Select medicines to place an order. Batches are automatically allocated by earliest expiry date (FEFO).
        </p>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '14px 18px', borderRadius: '12px', color: '#fb7185', fontSize: '0.9rem', marginBottom: '24px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {orderSuccess && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '20px', borderRadius: '16px', marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Check size={24} color="#34d399" />
            <h3 style={{ color: '#34d399', fontSize: '1.2rem', margin: 0 }}>Order Placed Successfully!</h3>
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Order Number: <strong className="font-mono" style={{ color: '#ffffff' }}>{orderSuccess.orderNumber}</strong> — Total: <strong>${Number(orderSuccess.totalAmount).toFixed(2)}</strong>
          </p>
          <div style={{ marginTop: '12px', display: 'flex', gap: '10px' }}>
            <button className="btn btn-sm btn-primary" onClick={() => onOrderPlaced && onOrderPlaced(orderSuccess)}>
              Track Order →
            </button>
            <button className="btn btn-sm btn-secondary" onClick={() => setOrderSuccess(null)}>
              Place Another Order
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Catalog + Cart Sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '28px', alignItems: 'start' }}>
        {/* Catalog List */}
        <div>
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading pharmaceuticals catalog...
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
              {medicines.map((med) => {
                const isOutOfStock = med.availableStock <= 0;
                const qtyInCart = cart[med.id] || 0;

                return (
                  <div
                    key={med.id}
                    className="glass-panel glass-panel-hover"
                    style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(16, 185, 129, 0.2)'
                      }}>
                        <Pill size={24} color="#10b981" />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>{med.name}</h3>
                          {med.requiresPrescription && (
                            <span className="badge badge-amber" style={{ fontSize: '0.65rem' }}>Rx Required</span>
                          )}
                          {med.isLowStock && (
                            <span className="badge badge-rose" style={{ fontSize: '0.65rem' }}>Low Stock</span>
                          )}
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <span>{med.genericName}</span> • <span>{med.dosage}</span> • <span style={{ color: 'var(--text-muted)' }}>{med.category}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', fontSize: '0.82rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Stock (Active Batches):</span>
                          <strong style={{ color: isOutOfStock ? '#fb7185' : '#34d399' }}>
                            {med.availableStock} units available
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Price & Quantity Actions */}
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
                        ${Number(med.unitPrice).toFixed(2)}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(15, 23, 42, 0.8)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-glass)' }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(med.id, -1, med.availableStock)}
                          disabled={qtyInCart === 0}
                          style={{ width: '28px', height: '28px', border: 'none', background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-mono" style={{ width: '32px', textAlign: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                          {qtyInCart}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(med.id, 1, med.availableStock)}
                          disabled={isOutOfStock || qtyInCart >= med.availableStock}
                          style={{ width: '28px', height: '28px', border: 'none', background: 'rgba(255, 255, 255, 0.05)', color: '#ffffff', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Cart & Checkout Panel */}
        <div className="glass-panel" style={{ padding: '24px', position: 'sticky', top: '90px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
            <ShoppingCart size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.15rem' }}>Order Cart</h3>
          </div>

          {cartItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Your cart is empty. Add medicines from the catalog to place an order.
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                {cartItems.map(({ med, qty, subtotal }) => (
                  <div key={med.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{med.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{qty} × ${med.unitPrice}</div>
                    </div>
                    <div className="font-mono" style={{ fontWeight: 700 }}>
                      ${subtotal.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Total Amount:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>
                  ${totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Customer Details Form */}
              <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Recipient Name</label>
                  <input
                    type="text"
                    className="input-glass"
                    value={customer.name}
                    onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Delivery Address</label>
                  <input
                    type="text"
                    className="input-glass"
                    value={customer.address}
                    onChange={(e) => setCustomer({ ...customer, address: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Contact Phone</label>
                  <input
                    type="text"
                    className="input-glass"
                    value={customer.phone}
                    onChange={(e) => setCustomer({ ...customer, phone: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting}
                  style={{ width: '100%', marginTop: '10px', height: '44px' }}
                >
                  {submitting ? 'Allocating Batches...' : 'Place Order & Allocate FEFO'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
