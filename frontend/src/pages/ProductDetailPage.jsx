import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import client, { errorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CLINICAL_FALLBACK_IMAGES } from './CatalogPage';

const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

/** Units customers can still buy: stock on hand minus what is already reserved for orders. */
export const availableStock = (medicine) =>
  Math.max(0, Number(medicine?.stockQuantity || 0) - Number(medicine?.allocatedStock || 0));

/**
 * Product page: details, price, stock and buying.
 * "Buy now" goes through the normal cart checkout so the order reaches Delivery Management.
 */
const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, cartItems } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    client.get(`/api/v1/medicines/${id}`)
      .then((res) => setProduct(res.data?.data || res.data))
      .catch((err) => setError(errorMessage(err, 'This product could not be found.')))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <p className="pt-32 text-center text-sm text-neutral-500">Loading product...</p>;
  }
  if (error || !product) {
    return (
      <div className="pt-32 text-center space-y-3">
        <p className="text-sm text-neutral-700">{error || 'Product not found.'}</p>
        <Link to="/catalog" className="text-sm font-bold text-emerald-700 hover:underline">Back to catalog</Link>
      </div>
    );
  }

  const inCart = cartItems.find((i) => Number(i.medicineId ?? i.id) === Number(product.id))?.quantity || 0;
  const stock = availableStock(product);
  const maxQty = Math.max(0, Math.min(100, stock - inCart));
  const outOfStock = stock <= 0 || product.isQuarantined;
  const isStaff = isAuthenticated && user?.role && user.role !== 'CUSTOMER';
  const image = product.imageUrl || CLINICAL_FALLBACK_IMAGES[product.category] || CLINICAL_FALLBACK_IMAGES.General;

  const setQty = (value) => {
    const n = Math.floor(Number(value) || 1);
    setQuantity(Math.min(Math.max(1, n), Math.max(1, maxQty)));
  };

  const add = async (goToCart) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/product/${product.id}`);
      return;
    }
    if (quantity > maxQty) {
      setMessage({ type: 'error', text: `Only ${maxQty} more can be added (stock available: ${stock}, already in cart: ${inCart}).` });
      return;
    }
    setBusy(true);
    setMessage({ type: '', text: '' });
    try {
      await addToCart({
        id: product.id,
        name: product.name,
        genericName: product.genericName || '',
        category: product.category || 'General',
        price: Number(product.unitPrice),
        unitPrice: Number(product.unitPrice),
        imageUrl: image,
        requiresPrescription: Boolean(product.requiresPrescription),
      }, quantity);
      if (goToCart) {
        navigate('/cart');
      } else {
        setMessage({ type: 'success', text: `Added ${quantity} x ${product.name} to your cart.` });
        setQuantity(1);
      }
    } catch (err) {
      setMessage({ type: 'error', text: errorMessage(err, 'Could not add this item to your cart.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-6xl mx-auto min-h-screen">
      <nav className="text-xs text-neutral-500 mb-6 flex gap-1.5 flex-wrap">
        <Link to="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-black">Catalog</Link>
        <span>/</span>
        <span className="text-black font-semibold">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white rounded-3xl border border-neutral-200 p-6 sm:p-8">
        <img
          src={image}
          alt={product.name}
          onError={(e) => { e.currentTarget.src = CLINICAL_FALLBACK_IMAGES.General; }}
          className="w-full aspect-square object-cover rounded-2xl bg-neutral-50 border border-neutral-100"
        />

        <div className="space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">{product.category}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 mt-1">{product.name}</h1>
            {product.genericName && <p className="text-sm text-neutral-500 mt-0.5">{product.genericName}</p>}
          </div>

          <p className="text-2xl font-black text-emerald-800">{money(product.unitPrice)}</p>

          <div className="flex flex-wrap gap-2 text-xs">
            {product.requiresPrescription && (
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold">
                Prescription required
              </span>
            )}
            {product.isTemperatureSensitive && (
              <span className="px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-900 font-bold">Cold chain (2-8°C)</span>
            )}
            <span className={`px-2.5 py-1 rounded-full font-bold ${outOfStock ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'}`}>
              {outOfStock ? 'Out of stock' : `${stock} in stock`}
            </span>
          </div>

          {product.description && <p className="text-sm text-neutral-700 leading-relaxed">{product.description}</p>}

          <dl className="grid grid-cols-2 gap-3 text-xs">
            {product.storageRequirement && (
              <div>
                <dt className="font-bold text-neutral-500">Storage</dt>
                <dd className="text-neutral-800">{product.storageRequirement}</dd>
              </div>
            )}
            {product.expiryDate && (
              <div>
                <dt className="font-bold text-neutral-500">Expiry</dt>
                <dd className="text-neutral-800">{product.expiryDate}</dd>
              </div>
            )}
          </dl>

          {product.requiresPrescription && (
            <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
              You will be asked to choose a pharmacist-approved prescription at checkout.{' '}
              <Link to="/prescription" className="font-bold underline">Upload a prescription</Link>
            </p>
          )}

          {!isStaff && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3">
                <label htmlFor="qty" className="text-xs font-bold text-neutral-600">Quantity</label>
                <div className="flex items-center border border-neutral-300 rounded-full overflow-hidden">
                  <button type="button" aria-label="Decrease quantity" onClick={() => setQty(quantity - 1)}
                    className="w-9 h-9 hover:bg-neutral-100 font-bold" disabled={outOfStock}>-</button>
                  <input
                    id="qty"
                    type="number"
                    min="1"
                    max={Math.max(1, maxQty)}
                    value={quantity}
                    onChange={(e) => setQty(e.target.value)}
                    disabled={outOfStock}
                    className="w-14 text-center text-sm font-bold outline-none"
                  />
                  <button type="button" aria-label="Increase quantity" onClick={() => setQty(quantity + 1)}
                    className="w-9 h-9 hover:bg-neutral-100 font-bold" disabled={outOfStock || quantity >= maxQty}>+</button>
                </div>
                {inCart > 0 && <span className="text-xs text-neutral-500">{inCart} already in cart</span>}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => add(false)}
                  disabled={busy || outOfStock || maxQty === 0}
                  className="flex-1 py-3 rounded-xl border border-neutral-900 text-neutral-900 hover:bg-neutral-100 text-sm font-bold disabled:opacity-40"
                >
                  Add to cart
                </button>
                <button
                  type="button"
                  onClick={() => add(true)}
                  disabled={busy || outOfStock || maxQty === 0}
                  className="flex-1 py-3 rounded-xl bg-neutral-900 hover:bg-black text-white text-sm font-bold disabled:opacity-40"
                >
                  Buy now
                </button>
              </div>
              {!isAuthenticated && <p className="text-xs text-neutral-500">You will be asked to log in first.</p>}
              {maxQty === 0 && !outOfStock && (
                <p className="text-xs text-amber-800">You already have all available stock of this item in your cart.</p>
              )}
              {message.text && (
                <p className={`text-xs font-semibold ${message.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`} role="status">
                  {message.text}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
