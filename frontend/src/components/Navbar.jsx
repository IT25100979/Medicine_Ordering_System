import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { isStaffRole, getAdminDashboardRoute, ADMIN_ROLE_LABELS, ADMIN_WORKSPACE_NAMES } from '../utils/roleRoutes';
import client from '../api/client';

export const CATEGORY_OPTIONS = [
  'Prescription Medicines',
  'Daily Health & Wellness',
  'Vitamins & Nutritional Supplements',
  'First Aid & Wound Care',
  'Home Health & Medical Care',
];

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  // Floating navbar state
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState(() => {
    return localStorage.getItem('pharma_plus_location') || 'Colombo 01 (0100)';
  });

  // Geo-enforced Location Modal state
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [locationSearchInput, setLocationSearchInput] = useState('');
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState(null); // { type: 'success'|'error', message: string, zone?: object }
  const [dbDeliveryZones, setDbDeliveryZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(false);

  const dropdownRef = useRef(null);

  // Close category dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch live delivery zones from database when modal opens
  useEffect(() => {
    if (isLocationModalOpen) {
      setLocationFeedback(null);
      setLocationSearchInput('');
      const fetchZones = async () => {
        setLoadingZones(true);
        try {
          const res = await client.get('/api/v1/delivery-zones');
          if (Array.isArray(res.data)) {
            setDbDeliveryZones(res.data);
          } else if (res.data && Array.isArray(res.data.data)) {
            setDbDeliveryZones(res.data.data);
          }
        } catch (err) {
          console.warn('Failed to fetch delivery zones:', err);
        } finally {
          setLoadingZones(false);
        }
      };
      fetchZones();
    }
  }, [isLocationModalOpen]);

  // Sync selectedCategory from URL if on catalog
  useEffect(() => {
    if (location.pathname === '/catalog') {
      const params = new URLSearchParams(location.search);
      const cat = params.get('category');
      if (cat && CATEGORY_OPTIONS.includes(cat)) {
        setSelectedCategory(cat);
      } else if (!cat) {
        setSelectedCategory('All Categories');
      }
    }
  }, [location.pathname, location.search]);

  // =============================================================
  // 1. SUPPRESS NAVBAR ON LOGIN & REGISTER PAGES
  // The nav should be removed on login and register pages.
  // Visible only on common pages: landing, catalog, inside cart, offer, product pages.
  // Suppressed on auth pages and dedicated pharmacist dashboard.
  // =============================================================
  const suppressedRoutes = ['/login', '/login/admin', '/register', '/pharmacist_dashboard', '/admin/prescriptions', '/admin/catalog'];
  if (suppressedRoutes.some((route) => location.pathname === route || location.pathname.startsWith(route + '/'))) {
    return null;
  }

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isAdmin = isAuthenticated && isStaffRole(user?.role);
  const dashboardRoute = getAdminDashboardRoute(user?.role) || '/admin/catalog';
  const roleLabel = ADMIN_ROLE_LABELS[user?.role] || user?.role || 'Staff';
  const workspaceTitle = ADMIN_WORKSPACE_NAMES[user?.role] || 'Management Console';

  // Handle Search Submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    if (selectedCategory && selectedCategory !== 'All Categories') {
      params.set('category', selectedCategory);
    }
    navigate(`/catalog?${params.toString()}`);
  };

  // Handle Category Selection (5 requested categories)
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setIsCategoryOpen(false);
    const params = new URLSearchParams(location.search);
    if (category === 'All Categories') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    if (searchQuery.trim()) {
      params.set('search', searchQuery.trim());
    }
    navigate(`/catalog?${params.toString()}`);
  };

  // =============================================================
  // GEO-ENFORCED LOCATION VERIFICATION VIA DATABASE
  // Checks if typed location or selected zone is available in DB
  // =============================================================
  const handleCheckLocation = async (queryToCheck) => {
    const query = (queryToCheck || locationSearchInput).trim();
    if (!query) {
      setLocationFeedback({
        type: 'error',
        message: 'Please enter a city name or postal code to check delivery availability.',
      });
      return;
    }

    setCheckingLocation(true);
    setLocationFeedback(null);

    try {
      const res = await client.get('/api/v1/delivery-zones/check', {
        params: { city: query },
      });

      const data = res.data;
      if (data && data.available === true) {
        const formattedLoc = `${data.city} (${data.postal_code || data.postalCode || ''})`.trim();
        setDeliveryLocation(formattedLoc);
        localStorage.setItem('pharma_plus_location', formattedLoc);
        localStorage.setItem('pharma_plus_delivery_zone', JSON.stringify(data));

        setLocationFeedback({
          type: 'success',
          message: 'Yes - Location Available for Delivery!',
          zone: data,
        });
      } else {
        setLocationFeedback({
          type: 'error',
          message: 'Location not available',
          details: `We do not currently deliver to "${query}". Please verify the location or select an enabled region.`,
        });
      }
    } catch (err) {
      console.error('Error verifying delivery location:', err);
      setLocationFeedback({
        type: 'error',
        message: 'Location not available',
        details: 'Unable to verify location with delivery network. Please try again.',
      });
    } finally {
      setCheckingLocation(false);
    }
  };

  // -------------------------------------------------------------
  // ADMIN DASHBOARD TOPBAR (Strictly for Administrator / Staff Accounts)
  // -------------------------------------------------------------
  if (isAdmin) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 text-white">
        <div className="h-16 max-w-[1536px] mx-auto px-4 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to={dashboardRoute}
              className="font-sans text-xl font-black tracking-tight uppercase flex items-center gap-1.5 text-white group"
            >
              <span>PHARMA</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-black text-xs font-black shadow-sm">
                +
              </span>
            </Link>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest">
              <span className="material-symbols-outlined text-[12px]">security</span>
              <span>ADMIN CONSOLE</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              {workspaceTitle}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={dashboardRoute}
              className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-3.5 py-1.5 rounded-full transition-all border ${
                isActive(dashboardRoute)
                  ? 'bg-amber-400 text-black border-amber-400 shadow-sm font-black'
                  : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">space_dashboard</span>
              <span className="hidden sm:inline">My Dashboard</span>
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs font-semibold text-zinc-200">
                <span className="max-w-[120px] truncate">{user?.fullName || 'Admin'}</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold">
                  {roleLabel}
                </span>
              </div>
              <button
                onClick={logout}
                title="Log Out of Admin Console"
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 flex items-center justify-center transition-colors border border-zinc-800"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------
  // REGULAR USER / CUSTOMER FLOATING NAVBAR
  // Features:
  // - Clean equal/proportional spacing across elements
  // - Transparent search icon without dark segment
  // - 5 specific categories in dropdown
  // - Symbol-only account without circle background or title
  // - Geo-enforced database verification on "Deliver to"
  // -------------------------------------------------------------
  return (
    <>
      <header className="fixed top-3 left-2 right-2 sm:left-4 sm:right-4 md:left-6 md:right-6 lg:left-8 lg:right-8 z-50 max-w-[1580px] mx-auto pointer-events-none">
        <div className="bg-[#EEEEEE] border border-neutral-300/90 rounded-2xl md:rounded-full px-4 sm:px-6 py-2 shadow-xl backdrop-blur-md pointer-events-auto flex items-center justify-between gap-3 sm:gap-4 md:gap-6 text-neutral-800 transition-all duration-300">
          
          {/* ======================================================= */}
          {/* LEFT: App Brand: PHARMA +                               */}
          {/* ======================================================= */}
          <div className="flex items-center shrink-0">
            <Link
              to="/"
              className="flex items-center gap-1 font-sans font-black text-lg sm:text-xl md:text-2xl tracking-tight uppercase text-black hover:opacity-90 transition-opacity shrink-0"
            >
              <span>PHARMA</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm">
                +
              </span>
            </Link>
          </div>

          {/* ======================================================= */}
          {/* CENTER: Deliver to (Closer to Search) & Search Bar      */}
          {/* ======================================================= */}
          <div className="flex-1 max-w-3xl mx-1 sm:mx-2 flex items-center gap-2 sm:gap-2.5">
            {/* Geo-enforced Delivery Location Button - snug next to search bar */}
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/70 hover:bg-white transition-all text-left border border-neutral-300/80 shrink-0 group shadow-xs"
              title="Click to verify and select your delivery location"
            >
              <i className="fa-solid fa-location-dot text-emerald-700 text-xs sm:text-sm group-hover:scale-110 transition-transform shrink-0" />
              <div className="leading-tight">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-neutral-500 block">
                  Deliver to
                </span>
                <span className="text-xs font-bold text-neutral-900 block truncate max-w-[85px] sm:max-w-[130px]">
                  {deliveryLocation}
                </span>
              </div>
            </button>

            {/* Search Bar Form */}
            <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center min-w-0">
              <div className="relative flex items-center w-full bg-white rounded-full border border-neutral-300/80 shadow-inner transition-all h-10">
                
                {/* 5-Category Dropdown Selector */}
                <div className="relative shrink-0" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCategoryOpen(!isCategoryOpen)}
                    className="h-10 px-3 sm:px-4 bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-xs font-bold flex items-center gap-1.5 border-r border-neutral-300 transition-colors rounded-l-full shrink-0"
                    title="Browse Categories"
                  >
                    <span className="max-w-[75px] sm:max-w-[130px] truncate">
                      {selectedCategory}
                    </span>
                    <i
                      className={`fa-solid fa-chevron-down text-[10px] text-neutral-500 transition-transform ${
                        isCategoryOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Options: Exactly the 5 requested categories */}
                  {isCategoryOpen && (
                    <div className="absolute left-0 top-12 w-60 bg-white rounded-2xl shadow-2xl border border-neutral-200 py-2 z-[100] animate-fadeIn text-left">
                      <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 border-b border-neutral-100 flex items-center justify-between">
                        <span>Select Category</span>
                        {selectedCategory !== 'All Categories' && (
                          <button
                            type="button"
                            onClick={() => handleSelectCategory('All Categories')}
                            className="text-[10px] text-emerald-600 hover:underline lowercase font-semibold"
                          >
                            reset all
                          </button>
                        )}
                      </div>
                      <div className="py-1">
                        {CATEGORY_OPTIONS.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleSelectCategory(cat)}
                            className={`w-full text-left px-3.5 py-2.5 text-xs font-semibold hover:bg-neutral-100 transition-colors flex items-center justify-between ${
                              selectedCategory === cat
                                ? 'bg-emerald-50 text-emerald-800 font-bold'
                                : 'text-neutral-700'
                            }`}
                          >
                            <span>{cat}</span>
                            {selectedCategory === cat && (
                              <i className="fa-solid fa-check text-[10px] text-emerald-600" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Search Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search medicines, vitamins, skin care..."
                  className="flex-1 min-w-0 h-full px-3.5 text-xs bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                />

                {/* Transparent Search Button - NO black segment / background */}
                <button
                  type="submit"
                  aria-label="Search"
                  title="Search Catalog"
                  className="h-full px-3 sm:px-4 bg-transparent hover:text-black text-neutral-500 hover:scale-110 active:scale-95 flex items-center justify-center transition-all shrink-0 focus:outline-none rounded-r-full"
                >
                  <i className="fa-solid fa-magnifying-glass text-xs sm:text-sm" />
                </button>
              </div>
            </form>
          </div>

          {/* ======================================================= */}
          {/* RIGHT: Equal/Proportionally Spaced Action Elements      */}
          {/* ======================================================= */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-5 shrink-0">
            
            {/* Offer Link with Symbol in Orange Colour */}
            <Link
              to="/offers"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-neutral-200/80 transition-colors font-bold text-xs uppercase tracking-wider text-neutral-800 group shrink-0"
              title="Special Discounts & Limited Offers"
            >
              <i className="fa-solid fa-tag text-orange-500 text-sm group-hover:scale-125 transition-transform" />
              <span className="hidden sm:inline font-extrabold text-neutral-900">Offers</span>
            </Link>

            {/* Cart Link with Reactive Count Badge */}
            <Link
              to="/cart"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full hover:bg-neutral-200/80 transition-colors font-bold text-xs uppercase tracking-wider text-neutral-800 group shrink-0"
              title="View Shopping Cart"
            >
              <div className="relative">
                <i className="fa-solid fa-cart-shopping text-neutral-700 text-sm group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1.5 -right-2 bg-black text-white text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              </div>
              <span className="hidden sm:inline font-extrabold text-neutral-900">Cart</span>
            </Link>

            {/* Account: Symbol ONLY, NO circle background, NO text title */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1 shrink-0">
                <Link
                  to="/profile"
                  className="p-1.5 sm:p-2 text-emerald-700 hover:text-emerald-900 hover:scale-110 active:scale-95 transition-all flex items-center justify-center shrink-0"
                  title={`Signed in as ${user?.fullName || 'User'}`}
                  aria-label="User Profile"
                >
                  <i className="fa-solid fa-circle-user text-lg sm:text-xl" />
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  title="Sign Out"
                  className="p-1.5 text-neutral-500 hover:text-red-600 transition-colors"
                  aria-label="Logout"
                >
                  <i className="fa-solid fa-arrow-right-from-bracket text-xs sm:text-sm" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="p-1.5 sm:p-2 text-neutral-700 hover:text-black hover:scale-110 active:scale-95 transition-all flex items-center justify-center shrink-0"
                title="Customer Sign In / Account"
                aria-label="Account"
              >
                <i className="fa-solid fa-user text-base sm:text-lg" />
              </Link>
            )}

          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* MODAL: Geo-Enforced Delivery Location DB Verification      */}
      {/* ========================================================= */}
      {isLocationModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-neutral-200 space-y-5 animate-scaleUp">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                  <i className="fa-solid fa-location-dot text-base" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 uppercase tracking-tight">
                    Choose Delivery Destination
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-medium">
                    Geo-Enforced Delivery Database Verification
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>

            {/* Current Active Location Display */}
            <div className="bg-neutral-50 rounded-2xl p-3 border border-neutral-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Current Delivery Zone
                </span>
                <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5 mt-0.5">
                  <i className="fa-solid fa-circle-check text-emerald-600 text-xs" />
                  {deliveryLocation}
                </span>
              </div>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                ACTIVE
              </span>
            </div>

            {/* Interactive Search Option to check if typed location is in DB */}
            <div className="space-y-2">
              <label htmlFor="geoSearchInput" className="text-[11px] font-bold uppercase tracking-wider text-neutral-700 block">
                Search &amp; Verify Delivery Location
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <i className="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs" />
                  <input
                    id="geoSearchInput"
                    type="text"
                    value={locationSearchInput}
                    onChange={(e) => setLocationSearchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckLocation();
                      }
                    }}
                    placeholder="Enter city or postal code (e.g. Colombo 01, 0100)..."
                    className="w-full h-11 pl-9 pr-3 rounded-xl bg-neutral-50 border border-neutral-300 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <button
                  type="button"
                  disabled={checkingLocation}
                  onClick={() => handleCheckLocation()}
                  className="h-11 px-5 bg-neutral-900 hover:bg-black disabled:bg-neutral-400 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-wider shadow-sm flex items-center gap-1.5 shrink-0"
                >
                  {checkingLocation ? (
                    <>
                      <i className="fa-solid fa-spinner animate-spin text-xs" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-check text-xs text-emerald-400" />
                      <span>Check DB</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Feedback Message Display */}
            {locationFeedback && (
              <div className="animate-fadeIn">
                {locationFeedback.type === 'success' ? (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 space-y-2">
                    <div className="flex items-center gap-2 font-black text-sm text-emerald-800 uppercase tracking-tight">
                      <i className="fa-solid fa-circle-check text-emerald-600 text-base" />
                      <span>{locationFeedback.message}</span>
                    </div>
                    {locationFeedback.zone && (
                      <div className="text-xs text-emerald-800 space-y-1">
                        <p>
                          Serviced Area: <strong>{locationFeedback.zone.city}</strong> (Postal: {locationFeedback.zone.postal_code || locationFeedback.zone.postalCode})
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-emerald-900 pt-1">
                          <span>
                            Est. Delivery: {locationFeedback.zone.estimated_delivery_time || locationFeedback.zone.estimatedDeliveryTime || 30} mins
                          </span>
                          <span>•</span>
                          <span>
                            Delivery Fee: ${Number(locationFeedback.zone.delivery_fee || locationFeedback.zone.deliveryFee || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-emerald-200">
                      <span className="text-[11px] font-extrabold text-emerald-700">
                        Delivery destination updated successfully.
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsLocationModalOpen(false)}
                        className="text-xs font-black uppercase text-emerald-800 hover:underline"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-900 space-y-1">
                    <div className="flex items-center gap-2 font-black text-sm text-red-800 uppercase tracking-tight">
                      <i className="fa-solid fa-circle-xmark text-red-600 text-base" />
                      <span>{locationFeedback.message}</span>
                    </div>
                    <p className="text-xs text-red-700">
                      {locationFeedback.details || 'Location is not registered in our delivery database.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Database Serviced Zones Quick-Pick */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
                  Serviced Delivery Zones in Database
                </span>
                {loadingZones && (
                  <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                    <i className="fa-solid fa-spinner animate-spin text-[10px]" /> Loading DB...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
                {dbDeliveryZones.length > 0 ? (
                  dbDeliveryZones.map((zone) => {
                    const isZoneActive = zone.is_active !== undefined ? zone.is_active === 1 : zone.isActive === 1;
                    const zonePostal = zone.postal_code || zone.postalCode || '';
                    const zoneLabel = `${zone.city} (${zonePostal})`;
                    const isCurrentlySelected = deliveryLocation.toLowerCase().includes(zone.city.toLowerCase());

                    return (
                      <button
                        key={zone.id}
                        type="button"
                        onClick={() => handleCheckLocation(zone.city)}
                        className={`p-2.5 rounded-xl text-left border text-xs font-bold transition-all relative ${
                          isCurrentlySelected
                            ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
                            : isZoneActive
                            ? 'bg-neutral-50 hover:bg-neutral-100 border-neutral-200 text-neutral-800'
                            : 'bg-neutral-100 border-neutral-200 text-neutral-400 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] uppercase font-extrabold tracking-wider opacity-75">
                            {isZoneActive ? 'Available' : 'Unavailable'}
                          </span>
                          {isCurrentlySelected && (
                            <i className="fa-solid fa-check text-[10px] text-emerald-400" />
                          )}
                        </div>
                        <p className="truncate font-black text-xs capitalize">{zone.city}</p>
                        <p className="text-[10px] opacity-70 font-mono">{zonePostal}</p>
                      </button>
                    );
                  })
                ) : (
                  <div className="col-span-3 text-center py-4 text-xs text-neutral-400">
                    No delivery zones loaded from server.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
