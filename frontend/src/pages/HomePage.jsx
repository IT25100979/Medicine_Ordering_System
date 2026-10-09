import React from 'react';
import { Link } from 'react-router-dom';
import useCatalog from '../hooks/useCatalog';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  { name: 'Prescription Medicines', icon: 'fa-file-prescription' },
  { name: 'Daily Health & Wellness', icon: 'fa-heart-pulse' },
  { name: 'Vitamins & Nutritional Supplements', icon: 'fa-capsules' },
  { name: 'First Aid & Health Care', icon: 'fa-kit-medical' },
  { name: 'Home Health & medical Care', icon: 'fa-stethoscope' },
];

const STEPS = [
  { icon: 'fa-cart-shopping', title: 'Order online', text: 'Choose your medicines and a delivery partner at checkout.' },
  { icon: 'fa-file-prescription', title: 'Prescription checked', text: 'Upload your prescription; our pharmacist verifies it before dispensing.' },
  { icon: 'fa-truck-fast', title: 'Delivered to you', text: 'Track your parcel live and give the courier your 6-digit code.' },
];

/** Storefront home: short intro, categories, featured products and how ordering works. */
const HomePage = () => {
  const { products, loading, error } = useCatalog();
  const { isAuthenticated, user } = useAuth();
  const featured = products.slice(0, 8);
  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto space-y-12">
      {/* Intro */}
      <section className="bg-emerald-50 border border-emerald-100 rounded-3xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900">Your pharmacy, delivered.</h1>
          <p className="text-sm text-neutral-700 max-w-lg">
            Order everyday health products and prescription medicines from a licensed pharmacy,
            checked by our pharmacists and delivered to your door.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/catalog" className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-black text-white text-sm font-bold">
              Shop now
            </Link>
            <Link
              to={isCustomer ? '/prescription' : '/login?redirect=/prescription'}
              className="px-5 py-2.5 rounded-xl border border-neutral-900 text-neutral-900 hover:bg-white text-sm font-bold"
            >
              Upload a prescription
            </Link>
          </div>
        </div>
        <img src="/products/paracetamol-tablets.jpg" alt="Paracetamol 500 mg tablets" className="w-48 h-48 sm:w-64 sm:h-64 rounded-2xl object-cover" />
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-lg font-extrabold text-neutral-900 mb-4">Shop by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.name}
              to={`/catalog?category=${encodeURIComponent(c.name)}`}
              className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center gap-3 hover:border-neutral-400"
            >
              <i className={`fa-solid ${c.icon} text-emerald-700 text-lg`} />
              <span className="text-xs font-bold text-neutral-800">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured products */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-lg font-extrabold text-neutral-900">Featured products</h2>
          <Link to="/catalog" className="text-xs font-bold text-emerald-700 hover:underline">View all</Link>
        </div>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading products...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : featured.length === 0 ? (
          <p className="text-sm text-neutral-500">No products are available right now.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-lg font-extrabold text-neutral-900 mb-4">How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-white border border-neutral-200 rounded-2xl p-5">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white text-sm font-black flex items-center justify-center">{i + 1}</span>
                <i className={`fa-solid ${s.icon} text-neutral-700`} />
                <h3 className="text-sm font-bold text-neutral-900">{s.title}</h3>
              </div>
              <p className="text-xs text-neutral-600 mt-2">{s.text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default HomePage;
