import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import client from '../api/client';

export const CLINICAL_FALLBACK_IMAGES = {
  'Prescription Medicines': '/products/category-prescription.svg',
  'Daily Health & Wellness': '/products/category-wellness.svg',
  'Vitamins & Nutritional Supplements': '/products/category-vitamins.svg',
  'First Aid & Health Care': '/products/category-firstaid.svg',
  'First Aid & Wound Care': '/products/category-firstaid.svg',
  'Home Health & medical Care': '/products/category-homehealth.svg',
  'Home Health & Medical Care': '/products/category-homehealth.svg',
  'Vitamins & Supps': '/products/category-vitamins.svg',
  'Dietary & Vits': '/products/category-vitamins.svg',
  'Skin Care': '/products/category-wellness.svg',
  'General': '/products/category-general.svg',
};

// Initial Catalog Items strictly matching the 5 Live Batch 1 Products from manualCodeEdits.md
export const CATALOG_ITEMS = [
  {
    id: 1,
    title: 'Amoxil 500mg',
    brand: 'PHARMA + Lab Clinical',
    category: 'Prescription Medicines',
    healthGoal: 'Immunity',
    gender: 'Unisex & Family',
    form: 'Capsule & Softgel',
    price: 850.00,
    rating: 4.9,
    reviewsCount: 142,
    badge: 'Rx Required',
    subtitle: 'BROAD SPECTRUM RX',
    description: 'Broad-spectrum antibiotic used to treat various bacterial infections.',
    imageUrl: '/products/amoxil.svg',
    requiresPrescription: true,
    genericName: 'Amoxicillin',
    sku: 'RX-AMX-500',
  },
  {
    id: 2,
    title: 'Panadol Extra',
    brand: 'PHARMA + Lab Clinical',
    category: 'Daily Health & Wellness',
    healthGoal: 'Daily Vitality',
    gender: 'Unisex & Family',
    form: 'Capsule & Softgel',
    price: 120.00,
    rating: 4.8,
    reviewsCount: 210,
    badge: 'Fast Relief',
    subtitle: 'PAIN & FEVER RELIEF',
    description: 'Fast, effective temporary relief of pain, headaches, and discomfort.',
    imageUrl: '/products/panadol.svg',
    requiresPrescription: false,
    genericName: 'Paracetamol & Caffeine',
    sku: 'HW-PND-EXT',
  },
  {
    id: 3,
    title: 'Dettol Antiseptic Liquid 250ml',
    brand: 'Reckitt / PHARMA +',
    category: 'First Aid & Health Care',
    healthGoal: 'Immunity',
    gender: 'Unisex & Family',
    form: 'Tincture / Syrup',
    price: 450.00,
    rating: 4.9,
    reviewsCount: 178,
    badge: 'Antiseptic',
    subtitle: 'FIRST AID & HYGIENE',
    description: 'Antiseptic disinfectant liquid for first aid, wound cleaning, and personal hygiene.',
    imageUrl: '/products/dettol.svg',
    requiresPrescription: false,
    genericName: 'Chloroxylenol',
    sku: 'FA-DTL-250',
  },
  {
    id: 4,
    title: 'Centrum Advance Multivitamin',
    brand: 'Centrum Clinical',
    category: 'Vitamins & Nutritional Supplements',
    healthGoal: 'Daily Vitality',
    gender: 'Unisex & Family',
    form: 'Capsule & Softgel',
    price: 3500.00,
    rating: 4.9,
    reviewsCount: 195,
    badge: 'Complete Multi',
    subtitle: 'ADULT IMMUNITY & VITALITY',
    description: 'Comprehensive daily multivitamin tailored to support adult health and immunity.',
    imageUrl: '/products/centrum.svg',
    requiresPrescription: false,
    genericName: 'Multivitamins & Minerals',
    sku: 'VS-CEN-ADV',
  },
  {
    id: 5,
    title: 'Omron M3 Blood Pressure Monitor',
    brand: 'Omron Healthcare',
    category: 'Home Health & medical Care',
    healthGoal: 'Daily Vitality',
    gender: 'Unisex & Family',
    form: 'Digital Device',
    price: 18500.00,
    rating: 5.0,
    reviewsCount: 88,
    badge: 'Clinically Validated',
    subtitle: 'CARDIO MONITORING HUB',
    description: 'Clinically validated upper arm blood pressure monitor for accurate home tracking.',
    imageUrl: '/products/omron.svg',
    requiresPrescription: false,
    genericName: 'N/A (Digital Sphygmomanometer)',
    sku: 'HH-OMR-M3',
  },
];

// Helper Product Image Display with Clean Aesthetic and Real Image
const ProductImageCard = ({ item }) => {
  const fallbackImg = CLINICAL_FALLBACK_IMAGES[item.category] || CLINICAL_FALLBACK_IMAGES['General'] || '';
  const imgSrc = item.imageUrl || fallbackImg;

  return (
    <div className="relative bg-gradient-to-b from-[#fbf8f5] to-[#f5ede4] rounded-2xl h-56 flex items-center justify-center p-4 overflow-hidden group-hover:scale-[1.01] transition-transform duration-300">
      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full text-slate-800 tracking-wider shadow-xs z-10">
        {item.badge || (item.requiresPrescription ? 'Rx Required' : 'Verified 100%')}
      </span>
      <img
        src={imgSrc}
        alt={item.title || item.name}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = fallbackImg;
        }}
        className="h-44 w-auto max-w-[90%] object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
      />
    </div>
  );
};

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();

  // URL state
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';

  // Dynamic products state from backend
  const [productsList, setProductsList] = useState(CATALOG_ITEMS);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await client.get('/api/v1/medicines');
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((m) => {
            const cat = m.category || 'General';
            const fallback = CLINICAL_FALLBACK_IMAGES[cat] || CLINICAL_FALLBACK_IMAGES['General'];
            return {
              id: m.id,
              title: m.name,
              name: m.name,
              brand: m.brand || (m.name.includes('Centrum') ? 'Centrum Clinical' : m.name.includes('Dettol') ? 'Reckitt / PHARMA +' : m.name.includes('Omron') ? 'Omron Healthcare' : 'PHARMA + Lab Clinical'),
              category: cat,
              healthGoal: cat.includes('Immunity') || cat.includes('Vitamin') ? 'Immunity' : 'Daily Vitality',
              gender: 'Unisex & Family',
              form: m.name.includes('Monitor') ? 'Digital Device' : m.name.includes('Liquid') ? 'Tincture / Syrup' : 'Capsule & Softgel',
              price: Number(m.unitPrice) || Number(m.price) || 850,
              rating: m.rating ? Number(m.rating) : 4.9,
              reviewsCount: m.reviewsCount || 120,
              badge: m.requiresPrescription ? 'Rx Required' : 'Verified 100%',
              subtitle: m.genericName || 'PHARMA + CLINICAL',
              description: m.description || '',
              imageUrl: m.imageUrl || fallback,
              requiresPrescription: Boolean(m.requiresPrescription),
              sku: m.sku,
            };
          });
          setProductsList(mapped);
        }
      } catch (err) {
        console.warn('Using local fallback catalog dataset:', err);
      }
    };
    fetchCatalog();
  }, []);

  // Interactive Filter States (Empty by default: all products visible)
  const [priceMax, setPriceMax] = useState(25000);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedForms, setSelectedForms] = useState([]);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [sortBy, setSortBy] = useState('Recommended');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Added-to-cart toast/animation state
  const [addedIds, setAddedIds] = useState({});

  // Sync category or search query from URL if user used top Navbar
  const activeCategory = urlCategory || 'All Categories';
  const activeSearch = urlSearch;

  // Toggle helpers
  const toggleGender = (g) => {
    setSelectedGenders((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
    setCurrentPage(1);
  };

  const toggleBrand = (b) => {
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    );
    setCurrentPage(1);
  };

  const toggleForm = (f) => {
    setSelectedForms((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    );
    setCurrentPage(1);
  };

  const toggleGoal = (g) => {
    setSelectedGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
    setCurrentPage(1);
  };

  const resetAllFilters = () => {
    setPriceMax(25000);
    setSelectedGenders([]);
    setSelectedBrands([]);
    setSelectedForms([]);
    setSelectedGoals([]);
    setSortBy('Recommended');
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('category');
    newParams.delete('search');
    setSearchParams(newParams);
  };

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    let result = productsList.filter((item) => {
      // 1. Search Query Filter
      if (activeSearch.trim()) {
        const query = activeSearch.toLowerCase().trim();
        const matchesName = (item.title || item.name || '').toLowerCase().includes(query);
        const matchesBrand = (item.brand || '').toLowerCase().includes(query);
        const matchesDesc = (item.description || '').toLowerCase().includes(query);
        const matchesCat = (item.category || '').toLowerCase().includes(query);
        if (!matchesName && !matchesBrand && !matchesDesc && !matchesCat) {
          return false;
        }
      }

      // 2. Category Filter
      if (activeCategory && activeCategory !== 'All Categories') {
        const catNorm = activeCategory.toLowerCase();
        const itemCat = (item.category || '').toLowerCase();
        const matches =
          itemCat === catNorm ||
          itemCat.includes(catNorm) ||
          catNorm.includes(itemCat);
        if (!matches) return false;
      }

      // 3. Price Filter
      if (item.price > priceMax) return false;

      // 4. Target Gender Filter
      if (selectedGenders.length > 0 && !selectedGenders.includes(item.gender)) {
        return false;
      }

      // 5. Brand Filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(item.brand)) {
        return false;
      }

      // 6. Form Filter
      if (selectedForms.length > 0 && !selectedForms.includes(item.form)) {
        return false;
      }

      // 7. Health Goal Filter
      if (selectedGoals.length > 0 && !selectedGoals.includes(item.healthGoal)) {
        return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'Clinical Rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'Newest Arrivals') {
      result.sort((a, b) => b.id - a.id);
    }

    return result;
  }, [
    productsList,
    activeSearch,
    activeCategory,
    priceMax,
    selectedGenders,
    selectedBrands,
    selectedForms,
    selectedGoals,
    sortBy,
  ]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Handle Add to Cart (Real-Time for Guest & Customer)
  const handleAddToCart = async (item) => {
    try {
      const fallbackImg = CLINICAL_FALLBACK_IMAGES[item.category] || CLINICAL_FALLBACK_IMAGES['General'] || '';
      await addToCart({
        id: item.id,
        name: item.title,
        genericName: item.subtitle || item.description || '',
        price: Number(item.price),
        unitPrice: Number(item.price),
        category: item.category || 'General',
        imageUrl: item.imageUrl || fallbackImg,
        requiresPrescription: Boolean(item.requiresPrescription),
      }, 1);
      setAddedIds((prev) => ({ ...prev, [item.id]: true }));
      setTimeout(() => {
        setAddedIds((prev) => ({ ...prev, [item.id]: false }));
      }, 1500);
    } catch (err) {
      console.error('Failed to add item to cart:', err);
    }
  };

  return (
    <div className="bg-[#fcfbf9] text-slate-900 font-sans antialiased min-h-screen pt-24 pb-12 selection:bg-sky-100 selection:text-sky-900">
      
      {/* Master Page Wrapper */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12 py-5">
        
        {/* BEGIN: BreadcrumbAndToolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8" data-purpose="catalog-toolbar">
          {/* Breadcrumb Hierarchy */}
          <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-semibold text-slate-400 tracking-wide flex-wrap">
            <Link to="/" className="text-slate-600 hover:text-black transition-colors">Home</Link>
            <span>&gt;</span>
            <Link to="/catalog" className="text-slate-600 hover:text-black transition-colors">Products</Link>
            <span>&gt;</span>
            <span className="text-black font-bold">{activeCategory}</span>
            <span className="text-slate-300 font-normal">(&gt;)</span>
            <span className="bg-sky-50 text-sky-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
              Showing {paginatedProducts.length} of {filteredProducts.length}
            </span>
          </nav>

          {/* Sort & Display Controls */}
          <div className="flex items-center space-x-3 w-full sm:w-auto justify-between sm:justify-end">
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Sort by:</span>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-slate-200 text-slate-800 text-xs font-bold rounded-full pl-4 pr-9 py-2 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-sm transition"
              >
                <option value="Recommended">Recommended</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
                <option value="Clinical Rating">Clinical Rating</option>
                <option value="Newest Arrivals">Newest Arrivals</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* END: BreadcrumbAndToolbar */}

        {/* BEGIN: TwoColumnCatalogLayout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-20" data-purpose="catalog-grid-wrapper">
          
          {/* ======================================================= */}
          {/* BEGIN: FilterSidebar                                    */}
          {/* ======================================================= */}
          <aside aria-label="Catalog filters" className="lg:col-span-3 w-full" data-purpose="filter-sidebar">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-7">
              
              {/* Price Range Section */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Price Range</h3>
                  <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                    LKR 10 - LKR {priceMax.toLocaleString('en-LK')}
                  </span>
                </div>
                {/* Slider Control */}
                <div className="mt-4 px-1">
                  <input
                    aria-label="Price range filter"
                    className="w-full accent-sky-600 cursor-pointer"
                    max="25000"
                    min="10"
                    type="range"
                    value={priceMax}
                    onChange={(e) => {
                      setPriceMax(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  />
                  <div className="flex justify-between items-center mt-3 text-xs font-bold text-slate-600">
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">LKR 10</span>
                    <span className="text-slate-400 font-mono text-[10px]">—</span>
                    <span className="bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200/60">LKR 25,000</span>
                  </div>
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Vitamin Target Gender */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">
                    Target Demographic
                  </h3>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <div className="space-y-2.5 pt-1 text-xs">
                  {[
                    { label: 'Unisex & Family', count: 5 },
                    { label: 'Male', count: 2 },
                    { label: 'Female', count: 3 },
                  ].map((g) => (
                    <label key={g.label} className="flex items-center space-x-3 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={selectedGenders.includes(g.label)}
                        onChange={() => toggleGender(g.label)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 transition cursor-pointer"
                      />
                      <span className={`font-semibold group-hover:text-black ${selectedGenders.includes(g.label) ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                        {g.label}
                      </span>
                      <span className="ml-auto text-[10px] text-slate-400 font-mono">{g.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Brands Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Brands</h3>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <div className="space-y-2.5 pt-1 text-xs">
                  {[
                    { label: 'PHARMA + Lab Clinical', count: 2 },
                    { label: 'Centrum Clinical', count: 1 },
                    { label: 'Reckitt / PHARMA +', count: 1 },
                    { label: 'Omron Healthcare', count: 1 },
                  ].map((b) => (
                    <label key={b.label} className="flex items-center space-x-3 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={selectedBrands.includes(b.label)}
                        onChange={() => toggleBrand(b.label)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 transition cursor-pointer"
                      />
                      <span className={`font-semibold group-hover:text-black ${selectedBrands.includes(b.label) ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                        {b.label}
                      </span>
                      <span className="ml-auto text-[10px] text-slate-400 font-mono">{b.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Item Form Filter */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Item Form</h3>
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 15l7-7 7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
                <div className="space-y-2.5 pt-1 text-xs">
                  {[
                    { label: 'Capsule & Softgel', count: 3 },
                    { label: 'Tincture / Syrup', count: 1 },
                    { label: 'Digital Device', count: 1 },
                  ].map((f) => (
                    <label key={f.label} className="flex items-center space-x-3 cursor-pointer group select-none">
                      <input
                        type="checkbox"
                        checked={selectedForms.includes(f.label)}
                        onChange={() => toggleForm(f.label)}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300 transition cursor-pointer"
                      />
                      <span className={`font-semibold group-hover:text-black ${selectedForms.includes(f.label) ? 'text-slate-900 font-bold' : 'text-slate-600'}`}>
                        {f.label}
                      </span>
                      <span className="ml-auto text-[10px] text-slate-400 font-mono">{f.count}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-100" />

              {/* Health Goal Filter Pills */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-3">Health Goal</h3>
                <div className="flex flex-wrap gap-2 text-[11px]">
                  {['Immunity', 'Daily Vitality'].map((goal) => {
                    const isSelected = selectedGoals.includes(goal);
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => toggleGoal(goal)}
                        className={`px-3 py-1 rounded-full font-medium transition cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white font-bold shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {goal}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage(1)}
                  className="w-full bg-black hover:bg-slate-800 text-white text-xs font-extrabold py-3.5 px-4 rounded-2xl tracking-wider transition shadow-sm active:scale-95"
                >
                  UPDATE RESULTS
                </button>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 font-semibold py-2 transition"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                  <span>Reset All Filters</span>
                </button>
              </div>

            </div>
          </aside>
          {/* END: FilterSidebar */}

          {/* ======================================================= */}
          {/* BEGIN: MainProductGrid                                  */}
          {/* ======================================================= */}
          <main className="lg:col-span-9" data-purpose="product-catalog-results">
            
            {/* Active Filter Indicator Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
              <span className="text-slate-400 font-medium">Applied:</span>

              {selectedGenders.map((g) => (
                <span key={g} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 rounded-full font-medium text-slate-700 shadow-2xs">
                  {g} Target
                  <button onClick={() => toggleGender(g)} className="hover:text-black font-bold ml-1">×</button>
                </span>
              ))}

              {selectedBrands.map((b) => (
                <span key={b} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 rounded-full font-medium text-slate-700 shadow-2xs">
                  {b}
                  <button onClick={() => toggleBrand(b)} className="hover:text-black font-bold ml-1">×</button>
                </span>
              ))}

              {selectedForms.map((f) => (
                <span key={f} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 rounded-full font-medium text-slate-700 shadow-2xs">
                  {f}
                  <button onClick={() => toggleForm(f)} className="hover:text-black font-bold ml-1">×</button>
                </span>
              ))}

              {selectedGoals.map((g) => (
                <span key={g} className="inline-flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 rounded-full font-medium text-slate-700 shadow-2xs">
                  {g}
                  <button onClick={() => toggleGoal(g)} className="hover:text-black font-bold ml-1">×</button>
                </span>
              ))}

              {priceMax < 25000 && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-3 py-1 rounded-full font-medium text-slate-700 shadow-2xs">
                  Under LKR {priceMax.toLocaleString('en-LK')}
                  <button onClick={() => setPriceMax(25000)} className="hover:text-black font-bold ml-1">×</button>
                </span>
              )}

              {activeCategory !== 'All Categories' && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold text-emerald-800 shadow-2xs">
                  Category: {activeCategory}
                  <button
                    onClick={() => {
                      const p = new URLSearchParams(searchParams);
                      p.delete('category');
                      setSearchParams(p);
                    }}
                    className="hover:text-black font-bold ml-1"
                  >
                    ×
                  </button>
                </span>
              )}

              {(selectedGenders.length > 0 ||
                selectedBrands.length > 0 ||
                selectedForms.length > 0 ||
                selectedGoals.length > 0 ||
                priceMax < 25000 ||
                activeCategory !== 'All Categories') && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="text-sky-600 hover:underline font-bold text-[11px] ml-1"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* 3-Column Grid for Products */}
            {paginatedProducts.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-slate-200 space-y-4">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
                  <i className="fa-solid fa-box-open" />
                </div>
                <h3 className="text-base font-bold text-slate-800 uppercase tracking-tight">
                  No products match your selected filters
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try broadening your price range, choosing different forms or resetting all filter tags.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {paginatedProducts.map((product) => {
                  const isAdded = addedIds[product.id];
                  return (
                    <article
                      key={product.id}
                      className="group bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft-card hover:shadow-subtle-hover transition-all duration-300 flex flex-col justify-between"
                      data-purpose="product-card"
                    >
                      {/* Clickable Product Header leading to Product Page */}
                      <Link to={`/product/${product.id}`} className="block group/link cursor-pointer">
                        {/* Product Image Container */}
                        <ProductImageCard item={product} />

                        {/* Product Details */}
                        <div className="pt-5">
                          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                            {product.subtitle || product.genericName}
                          </span>
                          <h2 className="text-base font-bold text-slate-900 mt-1 leading-snug group-hover/link:text-sky-700 transition-colors">
                            {product.title || product.name}
                          </h2>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {product.description}
                          </p>
                        </div>
                      </Link>

                      {/* Price & Actions: See More and Add to Cart */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 block -mb-0.5">Price</span>
                          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                            LKR {product.price.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/product/${product.id}`}
                            className="flex-1 text-center py-2.5 px-3 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition active:scale-95 flex items-center justify-center gap-1 shadow-2xs"
                            title={`View dossier and details for ${product.title}`}
                          >
                            <span>See More</span>
                            <span className="text-xs leading-none">→</span>
                          </Link>
                          <button
                            type="button"
                            aria-label={`Add ${product.title} to cart`}
                            onClick={() => handleAddToCart(product)}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-bold transition duration-200 active:scale-95 shadow-xs ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-black hover:bg-slate-800 text-white'
                            }`}
                          >
                            <span>{isAdded ? 'Added!' : 'Add to Cart'}</span>
                            <span className="text-sm leading-none font-bold">
                              {isAdded ? '✓' : '+'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* BEGIN: PaginationBar */}
            {totalPages > 1 && (
              <nav aria-label="Catalog pagination" className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white rounded-2xl p-4 border border-slate-200/90 shadow-soft-card" data-purpose="pagination">
                <div className="text-xs text-slate-500 font-medium">
                  Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredProducts.length)}</span> of <span className="font-bold text-slate-900">{filteredProducts.length}</span> products
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold ${
                      currentPage === 1
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 transition'
                    }`}
                  >
                    ←
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition ${
                        currentPage === page
                          ? 'bg-black text-white shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-xs font-bold transition ${
                      currentPage === totalPages
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    →
                  </button>
                </div>
              </nav>
            )}
            {/* END: PaginationBar */}

          </main>
          {/* END: MainProductGrid */}

        </div>
        {/* END: TwoColumnCatalogLayout */}

        {/* ======================================================= */}
        {/* BEGIN: WarmClinicalFooter                               */}
        {/* ======================================================= */}
        <footer className="mt-12 bg-[#f8f6ea] rounded-3xl p-6 sm:p-10 lg:p-12 border border-amber-100/80" data-purpose="brand-footer">
          {/* Top Provider Banner Card */}
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 sm:p-8 mb-12 shadow-sm border border-black/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-6" data-purpose="provider-portal-card">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-black text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
                  PHARMA + FOR PROVIDERS
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  LIVE PHARMACIST ON CALL
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Hand us the script, we'll handle the rest.
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                Partner with our licensed pharmacy network for streamlined direct-to-patient dispatch, automated refills, and real-time adherence analytics.
              </p>
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
              <Link
                to="/modules/prescription"
                className="inline-flex items-center justify-center gap-2 bg-black hover:bg-slate-800 text-white font-bold text-xs px-6 py-3.5 rounded-full tracking-wider transition whitespace-nowrap"
              >
                <span>PROVIDER PORTAL</span>
                <span>→</span>
              </Link>
              {/* MedRelief Card Preview Mini Mockup */}
              <div className="w-12 h-14 bg-amber-50 rounded-lg border-2 border-amber-800 p-1 flex flex-col items-center justify-between shadow-xs hidden sm:flex">
                <span className="text-[5px] font-bold text-amber-900">PHARMA+</span>
                <div className="w-6 h-1 bg-amber-200 rounded-full"></div>
                <span className="text-[4px] font-mono text-slate-500">|||| ||||</span>
              </div>
            </div>
          </div>

          {/* Footer Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-black/10">
            {/* Col 1: Brand & Compliance Info */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black uppercase tracking-tight text-slate-900">PHARMA</span>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm">
                  +
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pr-4">
                Quality medications delivered directly to your doorstep with speed, care, and clinical precision. Certified online pharmacy serving thousands nationwide.
              </p>
              {/* HIPAA and LegitScript Certified Capsule */}
              <div className="inline-flex items-center gap-2 bg-[#eef7f0] border border-emerald-200/60 text-emerald-900 px-3.5 py-1.5 rounded-full text-[11px] font-bold">
                <svg className="w-3.5 h-3.5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path clipRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
                </svg>
                <span>HIPAA COMPLIANT &amp; LEGITSCRIPT CERTIFIED</span>
              </div>
              {/* Social Media Icons */}
              <div className="pt-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">JOIN OUR COMMUNITY</span>
                <div className="flex items-center space-x-2.5">
                  <a aria-label="Social Link" className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 hover:text-black hover:bg-slate-100 shadow-xs transition" href="#">
                    <i className="fa-brands fa-instagram text-xs" />
                  </a>
                  <a aria-label="Social Link" className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 hover:text-black hover:bg-slate-100 shadow-xs transition" href="#">
                    <i className="fa-brands fa-x-twitter text-xs" />
                  </a>
                  <a aria-label="Social Link" className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 hover:text-black hover:bg-slate-100 shadow-xs transition" href="#">
                    <i className="fa-brands fa-linkedin-in text-xs" />
                  </a>
                  <a aria-label="Social Link" className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-700 hover:text-black hover:bg-slate-100 shadow-xs transition" href="#">
                    <i className="fa-brands fa-youtube text-xs" />
                  </a>
                </div>
              </div>
            </div>

            {/* Col 2: Shop & Categories */}
            <div className="lg:col-span-3 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Shop &amp; Categories</h4>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li><Link className="hover:text-black transition-colors" to="/catalog?category=Prescription+Medicines">Prescription Medicines</Link></li>
                <li><Link className="hover:text-black transition-colors" to="/catalog?category=Daily+Health+%26+Wellness">Daily Health &amp; Wellness</Link></li>
                <li><Link className="hover:text-black transition-colors" to="/catalog?category=Vitamins+%26+Nutritional+Supplements">Vitamins &amp; Nutritional Supplements</Link></li>
                <li><Link className="hover:text-black transition-colors" to="/catalog?category=First+Aid+%26+Wound+Care">First Aid &amp; Wound Care</Link></li>
                <li><Link className="hover:text-black transition-colors" to="/catalog?category=Home+Health+%26+Medical+Care">Home Health &amp; Medical Care</Link></li>
                <li><Link className="hover:text-black transition-colors font-bold text-slate-900" to="/catalog">All Categories</Link></li>
              </ul>
            </div>

            {/* Col 3: Quick Links */}
            <div className="lg:col-span-2 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Quick Links</h4>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                <li><Link className="hover:text-black transition-colors" to="/modules/prescription">Request Order</Link></li>
                <li><Link className="hover:text-black transition-colors" to="/offers">Special Offers</Link></li>
                <li><Link className="hover:text-black transition-colors" to="/cart">My Cart</Link></li>
                <li><Link className="hover:text-black transition-colors" to="/catalog">Refill Prescription</Link></li>
                <li><Link className="hover:text-black transition-colors" to="/">How It Works</Link></li>
              </ul>
            </div>

            {/* Col 4: Contact & Clinical Support */}
            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900">Contact &amp; Support</h4>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <div className="bg-white/80 p-3.5 rounded-2xl border border-black/5 space-y-2 text-xs">
                <div>
                  <span className="block text-slate-900 font-extrabold text-sm">+94 11 234 5678</span>
                  <span className="text-[10px] text-slate-500">Mon-Fri 8am-8pm EST • 24/7 Hotline</span>
                </div>
                <div className="pt-1">
                  <a className="font-bold text-sky-700 hover:underline block" href="mailto:care@pharmaplus.lk">care@pharmaplus.lk</a>
                  <span className="text-[10px] text-slate-500">Clinical Support: support@pharmaplus.lk</span>
                </div>
                <div className="pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="font-bold text-slate-700 block">CLINICAL HQ</span>
                  <span>450 Healthway Blvd, Suite 300<br />Colombo 01, Sri Lanka</span>
                </div>
              </div>
            </div>
          </div>

          {/* Legal Sub-navigation Links */}
          <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <a className="hover:text-black transition-colors" href="#">Privacy Policy</a>
              <a className="hover:text-black transition-colors" href="#">Terms of Service</a>
              <a className="hover:text-black transition-colors" href="#">HIPAA Compliance</a>
              <a className="hover:text-black transition-colors" href="#">Prescription Drug Disclaimer</a>
              <a className="hover:text-black transition-colors" href="#">Refund Policy</a>
              <a className="hover:text-black transition-colors" href="#">Cookie Settings</a>
            </div>
            <div className="text-slate-600 font-semibold">
              VERIFIED LEGITSCRIPT PARTNER
            </div>
          </div>

          {/* FDA Disclaimer Note */}
          <div className="mt-6 pt-6 border-t border-black/10 text-[10px] text-slate-500 leading-relaxed max-w-5xl">
            * Statements on this site have not been evaluated by the FDA for unprescribed dietary supplements. Prescription medicines are strictly dispensed by fully licensed, accredited partner pharmacies in compliance with state and federal regulations. In case of a medical emergency, call 1990 / 911 immediately.
          </div>

          {/* Copyright & Precision Badge */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
            <p>© 2025 PHARMA + HEALTH INC. ALL RIGHTS RESERVED.</p>
            <p className="font-semibold tracking-wide uppercase text-[10px]">DESIGNED WITH CARE &amp; PRECISION</p>
          </div>
        </footer>
        {/* END: WarmClinicalFooter */}

      </div>
    </div>
  );
};

export default CatalogPage;
