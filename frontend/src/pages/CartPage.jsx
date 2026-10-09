import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { CLINICAL_FALLBACK_IMAGES } from './CatalogPage';
import { deliveryApi, COURIER_PARTNERS_FALLBACK } from '../api/deliveryApi';
import { errorMessage } from '../api/client';

const PHONE_PATTERN = /^[0-9+ -]{7,15}$/;

/** Default saved address from the Profile page (stored in localStorage), formatted as one line. */
const defaultSavedAddress = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('pharma_user_addresses') || '[]');
    const addr = saved.find((a) => a.isDefault) || saved[0];
    if (!addr) return null;
    return {
      text: [addr.street, addr.city, addr.postalCode].filter(Boolean).join(', '),
      phone: addr.phone,
    };
  } catch {
    return null;
  }
};

const CartPage = () => {
  const { cartItems, updateQuantity, removeItem, removeFromCart, clearCart, loading, isGuest } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    return localStorage.getItem('pharma_plus_location') || 'Colombo 01 (0100)';
  });
  const [deliveryZone, setDeliveryZone] = useState(() => {
    try {
      const stored = localStorage.getItem('pharma_plus_delivery_zone');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [checkoutStep, setCheckoutStep] = useState('review'); // 'review' | 'confirmed'
  const [placedDelivery, setPlacedDelivery] = useState(null);

  // Checkout details: courier partner chosen by the customer + where to deliver
  const savedAddress = defaultSavedAddress();
  const [courierPartners, setCourierPartners] = useState(COURIER_PARTNERS_FALLBACK);
  const [preferredCourier, setPreferredCourier] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState(savedAddress?.text || '');
  const [contactPhone, setContactPhone] = useState(savedAddress?.phone || user?.contactNumber || '');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [checkoutErrors, setCheckoutErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);

  useEffect(() => {
    deliveryApi.courierPartners()
      .then((list) => Array.isArray(list) && list.length > 0 && setCourierPartners(list))
      .catch(() => { /* keep the built-in list */ });
  }, []);

  useEffect(() => {
    if (!contactPhone && user?.contactNumber) setContactPhone(user.contactNumber);
  }, [user]);

  const actualIsGuest = isGuest || !isAuthenticated || !user;

  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price || item.unitPrice) || 0) * item.quantity, 0);
  const deliveryFee = deliveryZone?.delivery_fee !== undefined
    ? Number(deliveryZone.delivery_fee)
    : (deliveryZone?.deliveryFee !== undefined ? Number(deliveryZone.deliveryFee) : 5.00);
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;

  const handleDeleteItem = (itemId) => {
    if (removeItem) {
      removeItem(itemId);
    } else if (removeFromCart) {
      removeFromCart(itemId);
    } else {
      updateQuantity(itemId, 0);
    }
  };

  const validateCheckout = () => {
    const errors = {};
    if (!preferredCourier) errors.courier = 'Please choose a delivery partner.';
    if (deliveryAddress.trim().length < 5) errors.address = 'Enter your full delivery address (at least 5 characters).';
    if (!PHONE_PATTERN.test(contactPhone.trim())) errors.phone = 'Enter a valid phone number (7-15 digits).';
    if (deliveryNotes.length > 1000) errors.notes = 'Instructions must be at most 1000 characters.';
    if (cartItems.length === 0) errors.cart = 'Your cart is empty.';
    setCheckoutErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'cod' | 'gateway'

  // Customer confirms the order with the chosen courier partner -> backend creates the
  // order + a PENDING delivery, which appears live on the Delivery Management page.
  const handleCheckout = async () => {
    if (actualIsGuest) {
      navigate('/login?redirect=/cart');
      return;
    }
    if (placingOrder || !validateCheckout()) return;

    setPlacingOrder(true);
    setSubmitError('');
    try {
      const delivery = await deliveryApi.placeOrder({
        preferredCourier,
        deliveryAddress: deliveryAddress.trim(),
        customerPhone: contactPhone.trim(),
        specialInstructions: deliveryNotes.trim() || null,
        deliveryFee: subtotal > 0 ? deliveryFee : 0,
        items: cartItems.map((item) => ({
          medicineId: Number(item.medicineId) || null,
          name: item.name || 'Pharmaceutical Item',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice ?? item.price ?? 0),
        })),
      });
      setPlacedDelivery(delivery);
      setCheckoutStep('confirmed');
      await clearCart();
    } catch (err) {
      setSubmitError(errorMessage(err, 'Could not place your order. Please try again.'));
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-6">
        <Link to="/" className="hover:text-black transition-colors">Home</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-black transition-colors">Catalog</Link>
        <span>/</span>
        <span className="text-black">Inside Cart</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 flex items-center gap-3">
            <i className="fa-solid fa-cart-shopping text-emerald-700" />
            <span>Shopping Cart &amp; Order Dispatch</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Verified licensed pharmacy fulfillment with cold-chain monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-full border border-red-200 transition-colors shadow-xs"
              title="Clear all items from cart"
            >
              <i className="fa-solid fa-trash-can text-xs" />
              <span>Clear Cart</span>
            </button>
          )}
          <Link
            to="/catalog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full border border-emerald-200 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {/* Guest Warning Banner if Not Logged In */}
      {actualIsGuest && cartItems.length > 0 && checkoutStep !== 'confirmed' && (
        <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <i className="fa-solid fa-user-clock text-lg" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-2">
                <span>Guest Session Cart Active</span>
                <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full">
                  Saved in Session
                </span>
              </h3>
              <p className="text-xs text-amber-800/90 mt-0.5 max-w-xl">
                Your items are stored in this browser session. To complete prescription verification and purchase, please sign in or register your account.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              to="/login?redirect=/cart"
              className="flex-1 sm:flex-none text-center px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-extrabold uppercase tracking-wider rounded-full transition shadow-xs"
            >
              Sign In
            </Link>
            <Link
              to="/register?redirect=/cart"
              className="flex-1 sm:flex-none text-center px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-300 text-xs font-bold uppercase tracking-wider rounded-full transition"
            >
              Register
            </Link>
          </div>
        </div>
      )}

      {checkoutStep === 'confirmed' ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl border border-emerald-100 space-y-6 animate-scaleUp">
          {/* Payment Success Header */}
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl shadow-inner animate-bounce">
            <i className="fa-solid fa-check-double" />
          </div>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-widest">
            <i className="fa-solid fa-circle-check text-emerald-600" />
            <span>Payment Successful &amp; Order Verified</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
            Payment Completed &amp; Order Placed!
          </h2>

          {/* Validation Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-extrabold uppercase tracking-wider text-emerald-900 flex items-center gap-2">
                <i className="fa-solid fa-receipt text-emerald-700" />
                <span>Transaction Confirmation</span>
              </span>
              <span className="font-bold text-emerald-700 bg-white px-2.5 py-0.5 rounded-md border border-emerald-200">
                Payment Success
              </span>
            </div>
            <p className="text-neutral-700 leading-relaxed">
              Your payment of <strong className="text-emerald-900">LKR {Number(placedDelivery?.orderTotal || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}</strong> has been authorized and cleared. Your order details have been synchronized with your account <strong>Order History</strong> and sent to <strong>Delivery Management</strong> in real time.
            </p>
          </div>

          {/* Order Summary Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-left">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="block text-[10px] font-extrabold uppercase text-neutral-500">Order ID</span>
              <span className="font-mono font-bold text-xs text-neutral-900">ORD-{placedDelivery?.orderId}</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="block text-[10px] font-extrabold uppercase text-neutral-500">Delivery Reference</span>
              <span className="font-mono font-bold text-xs text-emerald-800">#DEL-{placedDelivery?.id}</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 col-span-2 sm:col-span-1">
              <span className="block text-[10px] font-extrabold uppercase text-neutral-500">Courier Partner</span>
              <span className="font-bold text-xs text-neutral-900">{placedDelivery?.preferredCourier || 'DHL'}</span>
            </div>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            Delivering to: <strong className="text-neutral-800">{placedDelivery?.orderAddress}</strong>
            <br />
            You will receive a 4-digit handover OTP (1234) on the tracking console as soon as a courier rider dispatches your parcel.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/profile?tab=orders"
              className="px-6 py-3.5 bg-neutral-900 hover:bg-black text-white rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-clock-rotate-left text-xs text-emerald-400" />
              <span>View in Order History</span>
            </Link>
            <Link
              to="/my-deliveries"
              className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-truck-fast text-xs" />
              <span>Track Delivery Live</span>
            </Link>
            <Link
              to="/catalog"
              className="px-5 py-3.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5"
            >
              <i className="fa-solid fa-store text-xs" />
              <span>Catalog</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length > 0 ? (
              cartItems.map((item) => {
                const itemImg = item.imageUrl || CLINICAL_FALLBACK_IMAGES[item.category] || CLINICAL_FALLBACK_IMAGES['General'] || '';
                const itemUnitPrice = Number(item.unitPrice ?? item.price ?? 0);
                const itemTotal = itemUnitPrice * item.quantity;

                return (
                  <div
                    key={item.id || item.medicineId}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 transition-all hover:shadow-md"
                  >
                    {itemImg ? (
                      <img
                        src={itemImg}
                        alt={item.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-neutral-100 shrink-0 bg-neutral-50"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl border border-neutral-100 bg-neutral-100 flex items-center justify-center text-neutral-400 shrink-0">
                        <i className="fa-solid fa-pills text-xl" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 tracking-wider">
                        {item.category || 'General'}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-neutral-900 mt-1 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">
                        {item.genericName || ''}
                      </p>
                      <div className="text-sm font-extrabold text-neutral-900 mt-2 flex items-center gap-2 justify-center sm:justify-start">
                        <span>
                          LKR {itemUnitPrice.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {item.quantity > 1 && (
                          <span className="text-xs text-neutral-400 font-normal">
                            (Total: LKR {itemTotal.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quantity Adjuster */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center border border-neutral-300 rounded-full overflow-hidden bg-neutral-50">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-neutral-200 text-neutral-700 font-bold transition-colors active:scale-95"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-black text-neutral-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-neutral-200 text-neutral-700 font-bold transition-colors active:scale-95"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-8 h-8 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600 flex items-center justify-center transition-colors active:scale-95"
                        title="Remove item"
                      >
                        <i className="fa-solid fa-trash text-xs" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 shadow-sm space-y-4">
                <div className="w-14 h-14 rounded-full bg-neutral-100 text-neutral-400 flex items-center justify-center mx-auto text-xl">
                  <i className="fa-solid fa-cart-shopping" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 uppercase tracking-tight">
                  Your Cart is Empty
                </h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                  Explore our certified catalog to find essential medications, vitamins, and clinical skin care treatments.
                </p>
                <Link
                  to="/catalog"
                  className="inline-block px-6 py-2.5 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-sm transition-colors"
                >
                  Explore Catalog
                </Link>
              </div>
            )}
          </div>

          {/* Right Col: Order Dispatch & Summary */}
          <div className="space-y-4">
            
            {/* Delivery Destination Card */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Delivery Destination
                </span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {actualIsGuest ? 'SESSION DESTINATION' : 'VERIFIED DB ZONE'}
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <i className="fa-solid fa-location-dot text-emerald-700 text-sm mt-0.5" />
                <div>
                  <p className="text-xs font-black text-neutral-900">{deliveryLocation}</p>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    Est. Transit Time: {deliveryZone?.estimated_delivery_time || 30} mins
                  </p>
                </div>
              </div>
            </div>

            {/* Checkout details: delivery partner, address, phone */}
            {!actualIsGuest && cartItems.length > 0 && (
              <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                    Choose Delivery Partner *
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-2 mt-2" role="radiogroup" aria-label="Delivery partner">
                    {courierPartners.map((partner) => {
                      const selected = preferredCourier === partner.name;
                      return (
                        <button
                          key={partner.code}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            setPreferredCourier(partner.name);
                            setCheckoutErrors((prev) => ({ ...prev, courier: undefined }));
                          }}
                          className={`text-left p-3 rounded-xl border transition-all ${
                            selected
                              ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-500/30'
                              : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-black text-neutral-900">{partner.name}</span>
                            {selected && <i className="fa-solid fa-circle-check text-emerald-600 text-xs" />}
                          </div>
                          <p className="text-[10px] text-neutral-500 mt-0.5 leading-snug">{partner.description}</p>
                          <p className="text-[10px] font-bold text-neutral-700 mt-1">
                            ~{partner.estimatedDays} day{partner.estimatedDays > 1 ? 's' : ''}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {checkoutErrors.courier && <p className="text-[11px] text-red-600 font-semibold mt-1.5">{checkoutErrors.courier}</p>}
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label htmlFor="checkout-address" className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                      Delivery Address *
                    </label>
                    <textarea
                      id="checkout-address"
                      rows="2"
                      maxLength={500}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder={`e.g. 12 Flower Road, ${deliveryLocation}`}
                      className={`w-full px-3 py-2 rounded-xl bg-neutral-50 border ${checkoutErrors.address ? 'border-red-400' : 'border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    />
                    {checkoutErrors.address && <p className="text-[11px] text-red-600 font-semibold mt-1">{checkoutErrors.address}</p>}
                  </div>
                  <div>
                    <label htmlFor="checkout-phone" className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                      Contact Phone *
                    </label>
                    <input
                      id="checkout-phone"
                      type="tel"
                      maxLength={15}
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="e.g. 0771234567"
                      className={`w-full px-3 py-2 rounded-xl bg-neutral-50 border ${checkoutErrors.phone ? 'border-red-400' : 'border-neutral-200'} focus:outline-none focus:ring-2 focus:ring-emerald-500/20`}
                    />
                    {checkoutErrors.phone && <p className="text-[11px] text-red-600 font-semibold mt-1">{checkoutErrors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="checkout-notes" className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">
                      Delivery Instructions (optional)
                    </label>
                    <input
                      id="checkout-notes"
                      type="text"
                      maxLength={1000}
                      value={deliveryNotes}
                      onChange={(e) => setDeliveryNotes(e.target.value)}
                      placeholder="e.g. Call on arrival"
                      className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 pb-3 border-b border-neutral-100">
                Order Summary
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Subtotal ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} items)</span>
                  <span className="font-bold text-neutral-900">
                    LKR {subtotal.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-neutral-600">
                  <span>Delivery Dispatch Fee</span>
                  <span className="font-bold text-neutral-900">
                    {subtotal > 0
                      ? `LKR ${deliveryFee.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                      : 'LKR 0.00'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold pt-1">
                  <span>Prescription Verification</span>
                  <span>Free</span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2 border-t border-neutral-100 space-y-2">
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                  Payment Method
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'card'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <i className="fa-solid fa-credit-card text-xs" />
                    <span>Card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cod')}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'cod'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <i className="fa-solid fa-money-bill-wave text-xs" />
                    <span>COD</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gateway')}
                    className={`py-2 px-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex flex-col items-center justify-center gap-1 ${
                      paymentMethod === 'gateway'
                        ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100'
                    }`}
                  >
                    <i className="fa-solid fa-laptop-medical text-xs" />
                    <span>Health Rx</span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-sm font-black text-neutral-900">
                <span>Total Due</span>
                <span className="text-base text-emerald-800 font-extrabold">
                  LKR {total.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              {actualIsGuest ? (
                <div className="space-y-2">
                  <Link
                    to="/login?redirect=/cart"
                    className="w-full py-3.5 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-lock text-amber-400 text-xs" />
                    <span>Sign In to Complete Purchase</span>
                  </Link>
                  <p className="text-[10px] text-center text-neutral-500 font-medium">
                    Guests must log in to verify prescription items and finalize delivery.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {submitError && (
                    <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-semibold" role="alert">
                      {submitError}
                    </div>
                  )}
                  <button
                    type="button"
                    disabled={cartItems.length === 0 || placingOrder}
                    onClick={handleCheckout}
                    className="w-full py-3.5 bg-neutral-900 hover:bg-black disabled:bg-neutral-300 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
                  >
                    <i className="fa-solid fa-shield-halved text-emerald-400 text-xs" />
                    <span>{placingOrder ? 'Placing Order...' : 'Confirm & Place Order'}</span>
                  </button>
                  {preferredCourier && (
                    <p className="text-[10px] text-center text-neutral-500">
                      Delivery partner: <strong>{preferredCourier}</strong>
                    </p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-400 font-medium pt-1">
                <i className="fa-solid fa-shield-halved text-emerald-600 text-xs" />
                <span>256-Bit Encrypted Healthcare Checkout</span>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  );
};

export default CartPage;
