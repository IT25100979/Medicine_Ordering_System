import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const { cartItems, updateQuantity, removeItem, clearCart, loading } = useCart();
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
  const [orderRef, setOrderRef] = useState('');

  const subtotal = cartItems.reduce((acc, item) => acc + (Number(item.price) || 0) * item.quantity, 0);
  const deliveryFee = deliveryZone?.delivery_fee !== undefined
    ? Number(deliveryZone.delivery_fee)
    : (deliveryZone?.deliveryFee !== undefined ? Number(deliveryZone.deliveryFee) : 5.00);
  const total = subtotal > 0 ? subtotal + deliveryFee : 0;

  const handleCheckout = async () => {
    const ref = `ORD-${Math.floor(100000 + Math.random() * 900000)}-LK`;
    setOrderRef(ref);
    setCheckoutStep('confirmed');
    await clearCart();
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

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 flex items-center gap-3">
            <i className="fa-solid fa-cart-shopping text-emerald-700" />
            <span>Shopping Cart &amp; Order Dispatch</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Verified licensed pharmacy fulfillment with cold-chain monitoring.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800 uppercase tracking-wider bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-full border border-red-200 transition-colors shadow-xs"
              title="Clear all items from database cart"
            >
              <i className="fa-solid fa-trash-can text-xs" />
              <span>Clear Cart</span>
            </button>
          )}
          <Link
            to="/catalog"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 uppercase tracking-wider bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-full border border-emerald-200 transition-colors"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>

      {checkoutStep === 'confirmed' ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xl border border-neutral-200 space-y-5 animate-scaleUp">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl shadow-sm">
            <i className="fa-solid fa-check" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
            Prescription Order Confirmed!
          </h2>
          <p className="text-xs text-neutral-600 leading-relaxed">
            Your pharmaceutical dispatch reference is{' '}
            <strong className="font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {orderRef}
            </strong>
            . Our licensed pharmacist will verify the allocation for dispatch to{' '}
            <strong>{deliveryLocation}</strong>.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/catalog"
              className="px-6 py-3 bg-neutral-900 hover:bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-md"
            >
              Browse Catalog
            </Link>
            <Link
              to="/modules/delivery"
              className="px-6 py-3 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-full text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Track Deliveries
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center gap-4 transition-all hover:shadow-md"
                >
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl border border-neutral-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-center sm:text-left">
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 tracking-wider">
                      {item.category}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-neutral-900 mt-1 truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">
                      {item.genericName}
                    </p>
                    <div className="text-sm font-extrabold text-neutral-900 mt-2">
                      LKR {item.price.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Quantity Adjuster */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex items-center border border-neutral-300 rounded-full overflow-hidden bg-neutral-50">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-neutral-200 text-neutral-700 font-bold transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-black text-neutral-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-neutral-200 text-neutral-700 font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600 flex items-center justify-center transition-colors"
                      title="Remove item"
                    >
                      <i className="fa-solid fa-trash text-xs" />
                    </button>
                  </div>
                </div>
              ))
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
                  VERIFIED DB ZONE
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

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-between text-sm font-black text-neutral-900">
                <span>Estimated Total</span>
                <span className="text-base text-emerald-800">
                  LKR {total.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <button
                type="button"
                disabled={cartItems.length === 0}
                onClick={handleCheckout}
                className="w-full py-3.5 bg-neutral-900 hover:bg-black disabled:bg-neutral-300 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md active:scale-95"
              >
                Proceed to Checkout
              </button>

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
