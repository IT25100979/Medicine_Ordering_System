import React, { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useCatalog from '../hooks/useCatalog';
import ProductCard from '../components/ProductCard';

// Kept so existing imports (`import { CLINICAL_FALLBACK_IMAGES } from './CatalogPage'`) keep working.
export { CLINICAL_FALLBACK_IMAGES } from '../utils/productImages';

const SORTS = {
  name: { label: 'Name (A-Z)', fn: (a, b) => a.name.localeCompare(b.name) },
  priceLow: { label: 'Price: low to high', fn: (a, b) => Number(a.unitPrice) - Number(b.unitPrice) },
  priceHigh: { label: 'Price: high to low', fn: (a, b) => Number(b.unitPrice) - Number(a.unitPrice) },
};

/** Product catalog with search, category, prescription filter and sorting (state lives in the URL). */
const CatalogPage = () => {
  const { products, loading, error } = useCatalog();
  const [params, setParams] = useSearchParams();

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const rx = params.get('rx') || 'all';
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'name';

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    if (value && value !== 'all') next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products
      .filter((p) => !category || p.category === category)
      .filter((p) => rx === 'all' || (rx === 'rx' ? p.requiresPrescription : !p.requiresPrescription))
      .filter((p) => !q || [p.name, p.genericName, p.category].some((v) => v && v.toLowerCase().includes(q)))
      .sort(SORTS[sort].fn);
  }, [products, search, category, rx, sort]);

  return (
    <div className="pt-28 pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto">
      <nav className="text-xs text-neutral-500 mb-4 flex gap-1.5">
        <Link to="/" className="hover:text-black">Home</Link>
        <span>/</span>
        <span className="text-black font-semibold">Catalog</span>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end gap-3 mb-6">
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-neutral-900">Catalog</h1>
          <p className="text-xs text-neutral-500">{loading ? 'Loading...' : `${visible.length} of ${products.length} products`}</p>
        </div>
        <input
          type="search"
          aria-label="Search products"
          placeholder="Search by name or ingredient"
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
          className="w-full md:w-64 px-3 py-2 rounded-xl border border-neutral-300 text-sm"
        />
        <select aria-label="Category" value={category} onChange={(e) => setParam('category', e.target.value)}
          className="px-3 py-2 rounded-xl border border-neutral-300 text-sm">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select aria-label="Prescription filter" value={rx} onChange={(e) => setParam('rx', e.target.value)}
          className="px-3 py-2 rounded-xl border border-neutral-300 text-sm">
          <option value="all">All products</option>
          <option value="otc">No prescription needed</option>
          <option value="rx">Prescription only</option>
        </select>
        <select aria-label="Sort" value={sort} onChange={(e) => setParam('sort', e.target.value)}
          className="px-3 py-2 rounded-xl border border-neutral-300 text-sm">
          {Object.entries(SORTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
      </div>

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : loading ? (
        <p className="text-sm text-neutral-500">Loading products...</p>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 text-center text-sm text-neutral-600">
          No products match your filters.{' '}
          <button type="button" onClick={() => setParams({}, { replace: true })} className="font-bold text-emerald-700 hover:underline">
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {visible.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
