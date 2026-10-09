import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { errorMessage } from '../api/client';
import { CLINICAL_FALLBACK_IMAGES, productImage } from '../utils/productImages';

const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const available = (p) => Math.max(0, Number(p.stockQuantity || 0) - Number(p.allocatedStock || 0));

/** One product in a grid: picture, name, price, stock and an Add to cart button. */
const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart, cartItems } = useCart();
  const [note, setNote] = useState('');

  const stock = available(product);
  const inCart = cartItems.find((i) => Number(i.medicineId ?? i.id) === Number(product.id))?.quantity || 0;
  const isStaff = isAuthenticated && user?.role && user.role !== 'CUSTOMER';

  const add = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/product/${product.id}`);
      return;
    }
    if (inCart + 1 > stock) {
      setNote(`Only ${stock} in stock`);
      return;
    }
    try {
      await addToCart({
        id: product.id,
        name: product.name,
        genericName: product.genericName || '',
        category: product.category,
        price: Number(product.unitPrice),
        unitPrice: Number(product.unitPrice),
        imageUrl: productImage(product),
        requiresPrescription: Boolean(product.requiresPrescription),
      }, 1);
      setNote('Added to cart');
    } catch (err) {
      setNote(errorMessage(err, 'Could not add'));
    }
    setTimeout(() => setNote(''), 2500);
  };

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <Link to={`/product/${product.id}`} className="block bg-neutral-50 p-2">
        <img
          src={productImage(product)}
          alt={product.name}
          onError={(e) => { e.currentTarget.src = CLINICAL_FALLBACK_IMAGES.General; }}
          className="w-full aspect-square object-contain"
          loading="lazy"
        />
      </Link>
      <div className="p-4 flex flex-col gap-1.5 flex-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">{product.category}</span>
        <Link to={`/product/${product.id}`} className="text-sm font-bold text-neutral-900 hover:underline">
          {product.name}
        </Link>
        {product.genericName && <span className="text-xs text-neutral-500">{product.genericName}</span>}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {product.requiresPrescription && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">Prescription</span>
          )}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stock > 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </span>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="text-sm font-black text-neutral-900">{money(product.unitPrice)}</span>
          {!isStaff && (
            <button
              type="button"
              onClick={add}
              disabled={stock === 0}
              className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-bold disabled:opacity-40"
            >
              Add to cart
            </button>
          )}
        </div>
        {note && <span className="text-[11px] font-semibold text-emerald-700" role="status">{note}</span>}
      </div>
    </div>
  );
};

export default ProductCard;
