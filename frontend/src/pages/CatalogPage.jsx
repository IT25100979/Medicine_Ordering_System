import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';

const SAMPLE_PRODUCTS = [
  {
    id: 1,
    name: 'Atorvastatin Calcium',
    brandName: 'Lipitor',
    category: 'Cardiology',
    strength: '20mg',
    form: '30 Film-Coated Tablets',
    price: 24.50,
    requiresRx: true,
    isChronic: true,
    inStock: true,
    manufacturer: 'Pfizer Labs',
    description: 'HMG-CoA reductase inhibitor for management of hypercholesterolemia and cardiovascular risk reduction.'
  },
  {
    id: 2,
    name: 'Amoxicillin Trihydrate',
    brandName: 'Amoxil',
    category: 'Antibiotics',
    strength: '500mg',
    form: '21 Capsules',
    price: 14.20,
    requiresRx: true,
    isChronic: false,
    inStock: true,
    manufacturer: 'Teva Pharmaceuticals',
    description: 'Broad-spectrum beta-lactam antibacterial indicated for bacterial ear, nose, throat, and skin infections.'
  },
  {
    id: 3,
    name: 'Metformin Hydrochloride',
    brandName: 'Glucophage',
    category: 'Chronic Care',
    strength: '500mg',
    form: '60 Extended-Release Tablets',
    price: 18.00,
    requiresRx: true,
    isChronic: true,
    inStock: true,
    manufacturer: 'Merck Sante',
    description: 'First-line biguanide antihyperglycemic medication for the management of type 2 diabetes mellitus.'
  },
  {
    id: 4,
    name: 'Omeprazole Delayed-Release',
    brandName: 'Prilosec OTC',
    category: 'Gastroenterology',
    strength: '20mg',
    form: '28 Delayed-Release Capsules',
    price: 12.90,
    requiresRx: false,
    isChronic: false,
    inStock: true,
    manufacturer: 'AstraZeneca',
    description: 'Proton pump inhibitor for frequent heartburn, acid indigestion, and gastroesophageal reflux disease.'
  },
  {
    id: 5,
    name: 'Lisinopril Dihydrate',
    brandName: 'Prinivil',
    category: 'Cardiology',
    strength: '10mg',
    form: '30 Tablets',
    price: 16.50,
    requiresRx: true,
    isChronic: true,
    inStock: true,
    manufacturer: 'Sandoz Pharmaceuticals',
    description: 'ACE inhibitor prescribed for hypertension and adjunctive therapy in systolic heart failure.'
  },
  {
    id: 6,
    name: 'Azithromycin Monohydrate',
    brandName: 'Zithromax Z-Pak',
    category: 'Antibiotics',
    strength: '250mg',
    form: '6 Tablets (6-Dose Pack)',
    price: 22.00,
    requiresRx: true,
    isChronic: false,
    inStock: true,
    manufacturer: 'Pfizer Labs',
    description: 'Macrolide antibiotic for acute bacterial sinusitis, community-acquired pneumonia, and urethritis.'
  },
  {
    id: 7,
    name: 'Sertraline Hydrochloride',
    brandName: 'Zoloft',
    category: 'Mental Health',
    strength: '50mg',
    form: '30 Scored Tablets',
    price: 19.80,
    requiresRx: true,
    isChronic: true,
    inStock: true,
    manufacturer: 'Viatris',
    description: 'Selective serotonin reuptake inhibitor (SSRI) indicated for major depressive disorder and panic disorders.'
  },
  {
    id: 8,
    name: 'Ibuprofen Suspension',
    brandName: 'Advil Ultra',
    category: 'Pain & Inflammation',
    strength: '400mg',
    form: '40 Liquid Softgels',
    price: 9.75,
    requiresRx: false,
    isChronic: false,
    inStock: true,
    manufacturer: 'GSK Consumer Health',
    description: 'Nonsteroidal anti-inflammatory drug (NSAID) for relief of acute pain, minor arthritis, and fever.'
  }
];

const CATEGORIES = ['All Medications', 'Cardiology', 'Antibiotics', 'Chronic Care', 'Mental Health', 'Pain & Inflammation'];

const CatalogPage = () => {
  const [products, setProducts] = useState(SAMPLE_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All Medications');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyRx, setOnlyRx] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const res = await client.get('/api/v1/medicines');
        if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map(m => {
            let cat = 'Pain & Inflammation';
            if (m.requiresPrescription) {
              if (m.isTemperatureSensitive) cat = 'Chronic Care';
              else if (m.name.toLowerCase().includes('amox') || m.name.toLowerCase().includes('azith')) cat = 'Antibiotics';
              else cat = 'Cardiology';
            }
            return {
              id: m.id,
              name: m.genericName || m.name,
              brandName: m.name,
              category: cat,
              strength: m.sku || 'Standard Dose',
              form: m.isTemperatureSensitive ? 'Cold-Chain Refrigerated' : 'Verified Clinical Unit',
              price: Number(m.unitPrice) || 0,
              requiresRx: Boolean(m.requiresPrescription),
              isChronic: Boolean(m.isTemperatureSensitive),
              inStock: true,
              manufacturer: m.isTemperatureSensitive ? 'Certified Cold-Chain' : 'Licensed Supplier',
              description: `Licensed pharmaceutical formulation. Generic: ${m.genericName || m.name}. SKU: ${m.sku}.`
            };
          });
          setProducts(mapped);
        }
      } catch (err) {
        console.warn('Live catalog fetch failed, keeping fallback catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchMedicines();
    return () => { isMounted = false; };
  }, []);

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'All Medications' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRx = onlyRx ? p.requiresRx : true;
    return matchesCategory && matchesSearch && matchesRx;
  });

  return (
    <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-12 max-w-[1536px] mx-auto">
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
              Pharmaceutical Catalog
            </h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Licensed clinical medications, OTC remedies, and verified dosage schedules.
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
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-brand-border shadow-sm">
          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map(cat => (
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
                onChange={e => setOnlyRx(e.target.checked)}
                className="w-4 h-4 rounded text-black focus:ring-0 accent-black cursor-pointer"
              />
              <span>Rx Required Only</span>
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder="Search drug or brand..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-48 sm:w-64 h-9 pl-8 pr-3 rounded-full bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-black"
              />
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[16px] pointer-events-none">
                search
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="bg-white rounded-3xl p-5 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
          >
            <div>
              {/* Badges */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant">
                  {product.category}
                </span>

                {product.requiresRx ? (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    Rx Required
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    OTC Available
                  </span>
                )}
              </div>

              {/* Title & Brand */}
              <h3 className="font-extrabold text-base text-brand-charcoal leading-snug">
                {product.brandName}
              </h3>
              <p className="text-xs text-on-surface-variant mb-2">
                {product.name}
              </p>

              {/* Strength & Packaging Chips */}
              <div className="flex flex-wrap gap-1.5 my-3">
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-surface-container-low border border-brand-border text-on-surface">
                  {product.strength}
                </span>
                <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-surface-container-low text-on-surface-variant">
                  {product.form}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-on-surface-variant/90 line-clamp-2 leading-relaxed">
                {product.description}
              </p>

              {/* Manufacturer */}
              <p className="text-[10px] uppercase font-semibold text-on-surface-variant/70 mt-3">
                Mfg: {product.manufacturer}
              </p>
            </div>

            {/* Price and Action */}
            <div className="mt-5 pt-3 border-t border-brand-border flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-on-surface-variant block">Price</span>
                <span className="text-lg font-black text-brand-charcoal">${product.price.toFixed(2)}</span>
              </div>

              {product.requiresRx ? (
                <Link
                  to="/modules/prescription"
                  className="bg-black hover:bg-zinc-800 text-white text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>Upload Rx</span>
                  <span className="material-symbols-outlined text-[14px]">upload</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => alert(`Added ${product.brandName} to your cart!`)}
                  className="bg-surface-container-low hover:bg-black hover:text-white text-on-surface text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full transition-colors flex items-center gap-1 border border-brand-border"
                >
                  <span>Add to Cart</span>
                  <span className="material-symbols-outlined text-[14px]">add_shopping_cart</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CatalogPage;
