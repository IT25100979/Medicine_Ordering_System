import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';

export const CLINICAL_FALLBACK_IMAGES = {
  'Dietary & Vits': 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJDdVfCIjMPAceT_mPyIaw2J3QGOB9oVsJ1V_huFsmPJQuMxH0XuqgNAVW0oDGkEpKzN9bzKDe5YlH8zkdfGH5E_Bl0QWb3pRQOVOQ2efCnKqR7KcabZd0UqUxj2WWLH-DLAnrogqf69opvl7ezDXW7aAV8EmTFnhQjhemjfrmZfUtI1maYFC6IXWu8cqHYuVlacD7orqh-WNgG4mzL1qwuoiqDJTWsIDHJl8SxV91zcB_uYvJq0y5',
  'Dermatology': 'https://lh3.googleusercontent.com/aida-public/AB6AXuAxLcY1zBGmCKQhX5yXcWVhGZbsfoMbAWaWU4Nftaw42TfyMtFnl03t1_ayFOmafhKZHFVwDR82N6QJz72DkQOZDj1NHfgJBRhKAQeAEJZBygQSfYyR29HmRH9JwuFnJNriSoqciS_7R48NKHBxlXX4lxeu8ZsQDjcv8t1nGp-J4XZpYUT5ZTv9ceAl5KaZXe5JN6NwBpmKvnPvB08i8BFkcZx5U8-UsX9z5ffWLC51WZ14Gdp8sfRt',
  'Cardiovascular': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
  'Prescription Rx': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=500&auto=format&fit=crop&q=80',
  'Mental Wellness': 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=500&auto=format&fit=crop&q=80',
  'Chronic Care': 'https://images.unsplash.com/photo-1550572017-ed26177b96ad?w=500&auto=format&fit=crop&q=80',
  'Antibiotics': 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=500&auto=format&fit=crop&q=80',
  'Gastroenterology': 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=500&auto=format&fit=crop&q=80',
  'General': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
};

const CATEGORIES = [
  'All Medications',
  'Dietary & Vits',
  'Dermatology',
  'Cardiovascular',
  'Prescription Rx',
  'Mental Wellness',
  'Antibiotics',
];

const CatalogPage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Medications');
  const [onlyRx, setOnlyRx] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMedicines = async () => {
      try {
        const response = await client.get('/api/v1/medicines');
        if (isMounted && response.data && Array.isArray(response.data)) {
          const mapped = response.data.map((m) => {
            const cat = m.category || 'General';
            const fallbackImg = CLINICAL_FALLBACK_IMAGES[cat] || CLINICAL_FALLBACK_IMAGES['General'];
            return {
              id: m.id,
              name: m.genericName || m.name,
              brandName: m.name,
              category: cat,
              strength: m.sku || 'Standard Dose',
              form: m.requiresPrescription ? 'Prescription Only' : 'Clinical OTC',
              price: Number(m.unitPrice) || Number(m.price) || 25.0,
              msrp: m.msrp ? Number(m.msrp) : (Number(m.unitPrice) || 25.0) * 1.2,
              requiresRx: Boolean(m.requiresPrescription),
              isChronic: Boolean(m.isTemperatureSensitive),
              inStock: (m.stockQuantity || 0) > 0,
              stockQuantity: m.stockQuantity != null ? m.stockQuantity : 45,
              imageUrl: m.imageUrl || fallbackImg,
              rating: m.rating ? Number(m.rating) : 4.8,
              reviewsCount: m.reviewsCount || 64,
              manufacturer: m.isTemperatureSensitive ? 'Cold-Chain Certified' : 'Licensed Pharmaceutical Lab',
              description: m.description || `Certified pharmaceutical formulation. Generic: ${m.genericName || m.name}. SKU: ${m.sku}.`,
            };
          });
          setProducts(mapped);
        }
      } catch (err) {
        console.warn('Live catalog fetch failed:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMedicines();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'All Medications' ||
      p.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.brandName && p.brandName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRx = onlyRx ? p.requiresRx : true;
    return matchesCategory && matchesSearch && matchesRx;
  });

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-12 max-w-[1536px] mx-auto min-h-screen">
      {/* Header Container */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              <Link to="/" className="hover:text-black transition-colors">HOME</Link>
              <span>/</span>
              <span className="text-black">PRODUCT CATALOG</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-brand-charcoal">
              Pharmaceutical Catalog &amp; Remedies
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Board-certified medications, temperature-stabilized formulations, and verified nutritional therapeutics.
            </p>
          </div>

          <Link
            to="/modules/prescription"
            className="inline-flex items-center gap-2 bg-black hover:bg-zinc-800 text-white font-bold text-xs tracking-wider uppercase px-5 py-3 rounded-full transition-all shadow-sm shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
            <span>Have an Rx? Upload Script</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="mt-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-brand-border shadow-sm">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-colors ${
                  selectedCategory === cat
                    ? 'bg-black text-white'
                    : 'bg-surface-container-low text-on-surface hover:bg-surface-container'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box & Rx Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-on-surface-variant cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyRx}
                onChange={(e) => setOnlyRx(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-0 accent-black cursor-pointer"
              />
              <span>Rx Required Only</span>
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder="Search drug, generic or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-56 sm:w-72 h-10 pl-9 pr-3 rounded-full bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-black border border-brand-border"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px] pointer-events-none">
                search
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs font-semibold text-zinc-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
          Loading pharmaceutical catalog...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center border border-brand-border space-y-3">
          <span className="material-symbols-outlined text-[48px] text-zinc-300">inventory_2</span>
          <h3 className="text-base font-bold text-zinc-800 uppercase tracking-tight">No medications match your filter</h3>
          <p className="text-xs text-zinc-500">Try adjusting your search terms or clearing the Rx filter.</p>
          <button
            onClick={() => { setSelectedCategory('All Medications'); setSearchQuery(''); setOnlyRx(false); }}
            className="mt-2 px-4 py-2 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              onClick={() => navigate(`/catalog/${product.id}`)}
              className="group bg-white rounded-3xl p-4 border border-brand-border shadow-sm hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
            >
              <div>
                {/* STUDIO PRODUCT PHOTOGRAPHY CONTAINER */}
                <div className="relative w-full aspect-[4/3] rounded-2xl bg-surface-container-low overflow-hidden flex items-center justify-center p-3 mb-4 group-hover:bg-surface-container transition-colors">
                  <img
                    src={product.imageUrl}
                    alt={product.brandName}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = CLINICAL_FALLBACK_IMAGES[product.category] || CLINICAL_FALLBACK_IMAGES['General'];
                    }}
                    className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  />

                  {/* Badges Over Image */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/85 text-white backdrop-blur-md shadow-sm">
                      {product.category}
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    {product.requiresRx ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-black font-extrabold shadow-sm flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">medical_services</span>
                        <span>Rx</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold shadow-sm flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px]">verified</span>
                        <span>OTC</span>
                      </span>
                    )}
                  </div>

                  {/* Stock Pill at Bottom Left */}
                  <div className="absolute bottom-2 left-2.5 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-bold text-zinc-700 shadow-sm flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${product.stockQuantity <= 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    <span>{product.stockQuantity} in stock</span>
                  </div>
                </div>

                {/* Rating & Reviews */}
                <div className="flex items-center gap-1 text-[11px] mb-1.5">
                  <div className="flex items-center text-amber-500">
                    <span className="material-symbols-outlined text-[14px]">star</span>
                  </div>
                  <span className="font-bold text-zinc-800">{product.rating.toFixed(1)}</span>
                  <span className="text-zinc-400">({product.reviewsCount})</span>
                </div>

                {/* Title & Brand */}
                <h3 className="font-extrabold text-base text-brand-charcoal leading-snug group-hover:text-black transition-colors line-clamp-1">
                  {product.brandName}
                </h3>
                <p className="text-xs text-on-surface-variant font-medium line-clamp-1 mb-2">
                  {product.name}
                </p>

                {/* Strength & Packaging Chips */}
                <div className="flex flex-wrap gap-1.5 my-2.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container-low border border-brand-border text-on-surface">
                    {product.strength}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">
                    {product.form}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed mt-1">
                  {product.description}
                </p>
              </div>

              {/* Price & Action Button */}
              <div className="mt-5 pt-3 border-t border-brand-border flex items-center justify-between">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-black text-brand-charcoal">${product.price.toFixed(2)}</span>
                    {product.msrp > product.price && (
                      <span className="text-xs text-zinc-400 line-through">${product.msrp.toFixed(2)}</span>
                    )}
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-emerald-700 block">
                    Free cold-chain shipping
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/catalog/${product.id}`);
                  }}
                  className="bg-black group-hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-full transition-all flex items-center gap-1 shadow-sm"
                >
                  <span>View &amp; Buy</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
