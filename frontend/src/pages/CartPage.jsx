import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { deliveryApi, COURIER_PARTNERS_FALLBACK } from '../api/deliveryApi';
import client, { errorMessage, unwrap } from '../api/client';
import useFeatureStatus from '../hooks/useFeatureStatus';
import FeaturePausedBanner from '../components/FeaturePausedBanner';
import { isValidPhone, PHONE_HINT } from '../utils/validation';
import { CLINICAL_FALLBACK_IMAGES, productImage } from '../utils/productImages';

const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

/** Default saved address from the Profile page (kept in this browser), as one line. */
const savedAddress = () => {
  try {
    const list = JSON.parse(localStorage.getItem('pharma_user_addresses') || '[]');
    const a = list.find((x) => x.isDefault) || list[0];
    return a ? { text: [a.street, a.city, a.postalCode].filter(Boolean).join(', '), phone: a.phone } : null;
  } catch {
    return null;
  }
};

/**
 * Cart + checkout. The customer picks a delivery partner and address and places the order;
 * the backend creates the order + a delivery waiting for approval in Delivery Management.
 */
const CartPage = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { status: featureStatus, isEnabled } = useFeatureStatus();
  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';
  const orderingPaused = !isEnabled('ORDERING') || !isEnabled('DELIVERY');

  // catalog facts per medicine: available stock and whether it needs a prescription
  const [catalog, setCatalog] = useState({});
  const [partners, setPartners] = useState(COURIER_PARTNERS_FALLBACK);
  const [approvedPrescriptions, setApprovedPrescriptions] = useState([]);

  // checkout form
  const [initialAddress] = useState(savedAddress);
  const [preferredCourier, setPreferredCourier] = useState('');
  const [address, setAddress] = useState(initialAddress?.text || '');
  const [phone, setPhone] = useState(initialAddress?.phone || user?.contactNumber || '');
  const [notes, setNotes] = useState('');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [zone, setZone] = useState(null); // { available, delivery_fee, city } for the typed address
  const [errors, setErrors] = useState({});
  const [cartError, setCartError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced] = useState(null);

  useEffect(() => {
    client.get('/api/v1/medicines')
      .then((res) => {
        const list = unwrap(res);
        setCatalog(Object.fromEntries((Array.isArray(list) ? list : []).map((m) => [Number(m.id), {
          available: Math.max(0, Number(m.stockQuantity || 0) - Number(m.allocatedStock || 0)),
          requiresPrescription: Boolean(m.requiresPrescription),
        }])));
      })
      .catch(() => {});
    deliveryApi.courierPartners()
      .then((list) => Array.isArray(list) && list.length && setPartners(list))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isCustomer) return;
    if (!phone && user?.contactNumber) setPhone(user.contactNumber);
    client.get('/api/v1/prescriptions', { params: { status: 'APPROVED' } })
      .then((res) => {
        const list = (unwrap(res) || []).filter((p) => p.status === 'APPROVED');
        setApprovedPrescriptions(list);
        if (list.length === 1) setPrescriptionId(String(list[0].id));
      })
      .catch(() => {});
  }, [isCustomer]);

  // Look up the delivery zone (and its fee) for the typed address, shortly after typing stops
  useEffect(() => {
    if (address.trim().length < 3) {
      setZone(null);
      return undefined;
    }
    const timer = setTimeout(() => {
      deliveryApi.checkZone(address.trim()).then(setZone).catch(() => setZone(null));
    }, 400);
    return () => clearTimeout(timer);
  }, [address]);

  const rxItems = useMemo(
    () => cartItems.filter((i) => catalog[Number(i.medicineId)]?.requiresPrescription || i.requiresPrescription),
    [cartItems, catalog],
  );
  const subtotal = cartItems.reduce((sum, i) => sum + Number(i.unitPrice ?? i.price ?? 0) * i.quantity, 0);
  const deliveryFee = zone?.available ? Number(zone.delivery_fee || 0) : null;
  const total = subtotal + (deliveryFee || 0);

  const changeQuantity = async (item, next) => {
    setCartError('');
    const available = catalog[Number(item.medicineId)]?.available;
    if (next > item.quantity && available !== undefined && next > available) {
      setCartError(`Only ${available} unit(s) of ${item.name} are in stock.`);
      return;
    }
    try {
      await updateQuantity(item.id, next);
    } catch (err) {
      setCartError(errorMessage(err, 'Could not update the quantity.'));
    }
  };

  const validate = () => {
    const e = {};
    if (!preferredCourier) e.courier = 'Choose a delivery partner.';
    if (address.trim().length < 5) e.address = 'Enter your full delivery address.';
    else if (zone && !zone.available) e.address = "We don't deliver to this address yet. Include your city, e.g. \"Colombo 03\".";
    if (!isValidPhone(phone)) e.phone = PHONE_HINT;
    if (rxItems.length > 0 && !prescriptionId) e.prescription = 'Choose an approved prescription.';
    cartItems.forEach((i) => {
      const available = catalog[Number(i.medicineId)]?.available;
      if (available !== undefined && i.quantity > available) e.stock = `Only ${available} unit(s) of ${i.name} are in stock.`;
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const placeOrder = async () => {
    if (placing || !validate()) return;
    setPlacing(true);
    setSubmitError('');
    try {
      const delivery = await deliveryApi.placeOrder({
        preferredCourier,
        deliveryAddress: address.trim(),
        customerPhone: phone.trim(),
        specialInstructions: notes.trim() || null,
        prescriptionId: rxItems.length > 0 ? Number(prescriptionId) : null,
        items: cartItems.map((i) => ({
          medicineId: Number(i.medicineId) || null,
          name: i.name || 'Item',
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice ?? i.price ?? 0),
        })),
      });
      setPlaced(delivery);
      await clearCart();
    } catch (err) {
      setSubmitError(errorMessage(err, 'Could not place your order. Please try again.'));
    } finally {
      setPlacing(false);
    }
  };

  // ---------------------------------------------------------------- views

  if (placed) {
    return (
      <div className="pt-28 pb-20 px-4 max-w-xl mx-auto">
        <div className="bg-white rounded-3xl border border-neutral-200 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-xl">
            <i className="fa-solid fa-check" />
          </div>
          <h1 className="text-2xl font-extrabold text-neutral-900">Order placed</h1>
          <p className="text-sm text-neutral-600">
            Delivery <strong>#DEL-{placed.id}</strong> (order #{placed.orderId}) is waiting for approval.
            Our team will assign it to <strong>{placed.preferredCourier}</strong>.
          </p>
          <p className="text-sm text-neutral-600">Total: <strong>{money(placed.orderTotal)}</strong></p>
          <p className="text-xs text-neutral-500">Your 6-digit handover code appears on the tracking page once a courier is assigned.</p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/my-deliveries" className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold">Track my delivery</Link>
            <Link to="/catalog" className="px-5 py-2.5 rounded-xl border border-neutral-300 text-sm font-bold">Continue shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="pt-28 pb-20 px-4 max-w-xl mx-auto text-center space-y-3">
        <h1 className="text-2xl font-extrabold">Your cart</h1>
        <p className="text-sm text-neutral-600">Please log in to see your cart and check out.</p>
        <Link to="/login?redirect=/cart" className="inline-block px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold">Log in</Link>
      </div>
    );
  }

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto">
      <div className="flex items-end justify-between mb-6">
        <h1 className="text-2xl font-extrabold text-neutral-900">Your cart</h1>
        <Link to="/catalog" className="text-sm font-bold text-emerald-700 hover:underline">Continue shopping</Link>
      </div>

      <FeaturePausedBanner title="Online ordering" info={featureStatus.ORDERING} />
      <FeaturePausedBanner title="Home delivery" info={featureStatus.DELIVERY} />

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-neutral-200 p-10 text-center space-y-3">
          <p className="text-sm text-neutral-600">Your cart is empty.</p>
          <Link to="/catalog" className="inline-block px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-sm font-bold">Browse products</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {cartError && <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold" role="alert">{cartError}</p>}
            {cartItems.map((item) => {
              const available = catalog[Number(item.medicineId)]?.available;
              const price = Number(item.unitPrice ?? item.price ?? 0);
              return (
                <div key={item.id} className="bg-white rounded-2xl border border-neutral-200 p-4 flex items-center gap-4">
                  <img
                    src={productImage(item)}
                    alt={item.name}
                    onError={(e) => { e.currentTarget.src = CLINICAL_FALLBACK_IMAGES.General; }}
                    className="w-16 h-16 rounded-xl object-cover bg-neutral-50 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-neutral-900 truncate">{item.name}</p>
                    <p className="text-xs text-neutral-500">{money(price)} each</p>
                    {(catalog[Number(item.medicineId)]?.requiresPrescription || item.requiresPrescription) && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">Prescription</span>
                    )}
                  </div>
                  <div className="flex items-center border border-neutral-300 rounded-full overflow-hidden">
                    <button type="button" aria-label={`Decrease ${item.name}`} onClick={() => changeQuantity(item, item.quantity - 1)}
                      className="w-8 h-8 hover:bg-neutral-100 font-bold">-</button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button type="button" aria-label={`Increase ${item.name}`} onClick={() => changeQuantity(item, item.quantity + 1)}
                      disabled={available !== undefined && item.quantity >= available}
                      className="w-8 h-8 hover:bg-neutral-100 font-bold disabled:opacity-30">+</button>
                  </div>
                  <span className="w-28 text-right text-sm font-bold">{money(price * item.quantity)}</span>
                  <button type="button" aria-label={`Remove ${item.name}`} onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600">
                    <i className="fa-solid fa-trash text-xs" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Checkout */}
          <div className="space-y-4">
            {!isCustomer ? (
              <p className="bg-white rounded-2xl border border-neutral-200 p-5 text-sm text-neutral-600">
                Only customer accounts can place orders.
              </p>
            ) : (
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-bold text-neutral-600 mb-2">Delivery partner *</p>
                  <div className="space-y-2" role="radiogroup" aria-label="Delivery partner">
                    {partners.map((p) => (
                      <label key={p.code} className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer ${
                        preferredCourier === p.name ? 'border-emerald-600 bg-emerald-50' : 'border-neutral-200'}`}>
                        <input type="radio" name="courier" value={p.name} checked={preferredCourier === p.name}
                          onChange={() => setPreferredCourier(p.name)} className="mt-1" />
                        <span>
                          <span className="block text-sm font-bold">{p.name}</span>
                          <span className="block text-xs text-neutral-500">{p.description} · ~{p.estimatedDays} day(s)</span>
                        </span>
                      </label>
                    ))}
                  </div>
                  {errors.courier && <p className="text-xs text-red-600 mt-1">{errors.courier}</p>}
                </div>

                <label className="block">
                  <span className="text-xs font-bold text-neutral-600">Delivery address *</span>
                  <textarea rows="2" maxLength={500} value={address} onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. 12 Flower Road, Colombo 07"
                    className={`mt-1 w-full px-3 py-2 rounded-xl border ${errors.address ? 'border-red-400' : 'border-neutral-300'}`} />
                  {zone && (
                    <span className={`block text-xs mt-1 ${zone.available ? 'text-emerald-700' : 'text-red-600'}`}>
                      {zone.available ? `Delivering to ${zone.city} · fee ${money(zone.delivery_fee)}` : "Sorry, we don't deliver to this area yet."}
                    </span>
                  )}
                  {errors.address && <span className="block text-xs text-red-600 mt-1">{errors.address}</span>}
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-neutral-600">Phone *</span>
                  <input type="tel" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0771234567"
                    className={`mt-1 w-full px-3 py-2 rounded-xl border ${errors.phone ? 'border-red-400' : 'border-neutral-300'}`} />
                  {errors.phone && <span className="block text-xs text-red-600 mt-1">{errors.phone}</span>}
                </label>

                <label className="block">
                  <span className="text-xs font-bold text-neutral-600">Delivery note (optional)</span>
                  <input type="text" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Call on arrival"
                    className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
                </label>

                {rxItems.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                    <p className="text-xs font-bold text-amber-900">
                      Prescription needed for: {rxItems.map((i) => i.name).join(', ')}
                    </p>
                    {approvedPrescriptions.length > 0 ? (
                      <select aria-label="Approved prescription" value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white">
                        <option value="">Choose an approved prescription</option>
                        {approvedPrescriptions.map((p) => (
                          <option key={p.id} value={p.id}>Rx #{p.id}{p.doctorName ? ` · ${p.doctorName}` : ''}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-amber-900">
                        You have no approved prescription. <Link to="/prescription" className="font-bold underline">Upload one</Link> and wait for the pharmacist.
                      </p>
                    )}
                    {errors.prescription && <p className="text-xs text-red-600">{errors.prescription}</p>}
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
              <div className="flex justify-between">
                <span>Delivery</span>
                <span>{deliveryFee === null ? 'Enter address' : money(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-black pt-2 border-t border-neutral-100"><span>Total</span><span>{money(total)}</span></div>
              {errors.stock && <p className="text-xs text-red-600">{errors.stock}</p>}
              {submitError && <p className="text-xs text-red-600 font-semibold" role="alert">{submitError}</p>}
              {isCustomer && (
                <button type="button" onClick={placeOrder} disabled={placing || orderingPaused}
                  className="w-full mt-2 py-3 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold disabled:opacity-40">
                  {placing ? 'Placing order...' : 'Place order'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
