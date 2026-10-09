import React, { useState, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaffRole, getAdminDashboardRoute } from '../utils/roleRoutes';
import client from '../api/client';

export const HOMEPAGE_PRODUCTS = [
  {
    id: 1,
    name: 'Amoxil 500mg',
    genericName: 'Amoxicillin',
    sku: 'RX-AMX-500',
    category: 'Prescription Medicines',
    price: 850,
    imageUrl: '/products/amoxil.svg',
    description: 'Broad-spectrum antibiotic used to treat various bacterial infections.',
    badge: 'Rx Required',
    requiresPrescription: true,
  },
  {
    id: 2,
    name: 'Panadol Extra',
    genericName: 'Paracetamol & Caffeine',
    sku: 'HW-PND-EXT',
    category: 'Daily Health & Wellness',
    price: 120,
    imageUrl: '/products/panadol.svg',
    description: 'Fast, effective temporary relief of pain, headaches, and discomfort.',
    badge: 'Fast Relief',
    requiresPrescription: false,
  },
  {
    id: 3,
    name: 'Dettol Antiseptic Liquid 250ml',
    genericName: 'Chloroxylenol',
    sku: 'FA-DTL-250',
    category: 'First Aid & Health Care',
    price: 450,
    imageUrl: '/products/dettol.svg',
    description: 'Antiseptic disinfectant liquid for first aid, wound cleaning, and personal hygiene.',
    badge: 'First Aid',
    requiresPrescription: false,
  },
  {
    id: 4,
    name: 'Centrum Advance Multivitamin',
    genericName: 'Multivitamins & Minerals',
    sku: 'VS-CEN-ADV',
    category: 'Vitamins & Nutritional Supplements',
    price: 3500,
    imageUrl: '/products/centrum.svg',
    description: 'Comprehensive daily multivitamin tailored to support adult health and immunity.',
    badge: 'Complete Multi',
    requiresPrescription: false,
  },
  {
    id: 5,
    name: 'Omron M3 Blood Pressure Monitor',
    genericName: 'N/A (Digital Sphygmomanometer)',
    sku: 'HH-OMR-M3',
    category: 'Home Health & medical Care',
    price: 18500,
    imageUrl: '/products/omron.svg',
    description: 'Clinically validated upper arm blood pressure monitor for accurate home tracking.',
    badge: 'Clinical Device',
    requiresPrescription: false,
  },
  {
    id: 6,
    name: 'Lipitor 20mg',
    genericName: 'Atorvastatin',
    sku: 'RX-LPT-020',
    category: 'Prescription Medicines',
    price: 1200,
    imageUrl: '/products/lipitor.svg',
    description: 'Cholesterol-lowering medication used to reduce the risk of heart disease.',
    badge: 'Rx Required',
    requiresPrescription: true,
  },
  {
    id: 7,
    name: 'Hansaplast Fabric Plasters',
    genericName: 'N/A (Adhesive Bandage)',
    sku: 'FA-HNS-040',
    category: 'First Aid & Health Care',
    price: 250,
    imageUrl: '/products/hansaplast.svg',
    description: 'Breathable and durable fabric plasters for protecting minor cuts and scrapes.',
    badge: 'Wound Care',
    requiresPrescription: false,
  },
  {
    id: 8,
    name: 'Seven Seas Cod Liver Oil',
    genericName: 'Omega-3 & Vitamins A, D, E',
    sku: 'VS-SSC-120',
    category: 'Vitamins & Nutritional Supplements',
    price: 2800,
    imageUrl: '/products/sevenseas.svg',
    description: 'Traditional Omega-3 rich fish oil supplement to support heart, brain, and joint health.',
    badge: 'Omega-3',
    requiresPrescription: false,
  },
];

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();
  const [dbProducts, setDbProducts] = useState(HOMEPAGE_PRODUCTS);

  // Fetch live products to get exact database IDs
  useEffect(() => {
    let isMounted = true;
    const fetchLiveProducts = async () => {
      try {
        const res = await client.get('/api/v1/medicines?all=true');
        if (isMounted && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const merged = HOMEPAGE_PRODUCTS.map((local) => {
            const match = res.data.find(
              (d) => (d.sku && d.sku === local.sku) ||
                     (d.name && d.name.toLowerCase() === local.name.toLowerCase())
            );
            if (match) {
              return {
                ...local,
                id: match.id,
                price: match.unitPrice || match.price || local.price,
                imageUrl: match.imageUrl || local.imageUrl,
              };
            }
            return local;
          });
          setDbProducts(merged);
        }
      } catch (err) {
        console.warn('Could not fetch dynamic catalog for homepage:', err);
      }
    };
    fetchLiveProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to find item by SKU or fallback
  const getProduct = (sku) => {
    return dbProducts.find((p) => p.sku === sku) || HOMEPAGE_PRODUCTS.find((p) => p.sku === sku) || dbProducts[0];
  };

  // The landing page is strictly for regular customers and visitors.
  if (isAuthenticated && isStaffRole(user?.role)) {
    const targetDashboard = getAdminDashboardRoute(user.role) || '/admin/catalog';
    return <Navigate to={targetDashboard} replace />;
  }

  const pAmoxil = getProduct('RX-AMX-500');
  const pPanadol = getProduct('HW-PND-EXT');
  const pDettol = getProduct('FA-DTL-250');
  const pCentrum = getProduct('VS-CEN-ADV');
  const pOmron = getProduct('HH-OMR-M3');
  const pLipitor = getProduct('RX-LPT-020');
  const pHansaplast = getProduct('FA-HNS-040');
  const pSevenSeas = getProduct('VS-SSC-120');

  return (
    <div className="pt-28 pb-16 px-3 sm:px-5 md:px-8 max-w-[1580px] mx-auto selection:bg-black selection:text-white">
      {/* Master Canvas Container */}
      <main className="w-full bg-[#F6F7F9] rounded-[2.5rem] md:rounded-[3rem] p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/70">
        <div className="space-y-8 lg:space-y-10">

          {/* ========================================================= */}
          {/* SECTION 1: HERO BANNER (Full Width across container)      */}
          {/* ========================================================= */}
          <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[#A5CBE4] via-[#BFDCF0] to-[#E9F3FA] p-8 sm:p-14 lg:p-16 min-h-[520px] flex flex-col justify-between border border-white/50 shadow-inner w-full">
            {/* Realistic Cloud Overlays */}
            <div
              className="absolute inset-0 bg-no-repeat bg-cover pointer-events-none opacity-40 mix-blend-screen animate-cloud-drift"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 20%, #ffffff 0%, rgba(255,255,255,0.6) 40%, transparent 75%)',
              }}
            />
            <div className="absolute -bottom-16 -left-12 w-96 h-96 bg-white/50 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -top-12 -right-12 w-96 h-96 bg-white/60 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Hero Top Heading: 3 Angled Floating Product Cards with Real Images */}
            <div className="relative z-10 w-full flex justify-center items-center py-6 sm:py-10">
              <div className="flex items-center justify-center space-x-3 sm:space-x-8 max-w-4xl mx-auto">
                {/* Left Floating Card: Panadol Extra */}
                <Link
                  to={`/catalog/${pPanadol.id}`}
                  className="bottle-float-left w-32 sm:w-44 md:w-52 select-none group cursor-pointer block hover:scale-105 transition-all duration-300"
                >
                  <div className="bg-white/95 backdrop-blur-md rounded-[2rem] p-3 shadow-2xl border border-white/80 group-hover:border-emerald-400/80 transition-all">
                    <div className="relative h-32 sm:h-40 rounded-2xl bg-gradient-to-b from-emerald-50/60 to-white flex items-center justify-center p-2 overflow-hidden">
                      <span className="absolute top-2 left-2 bg-emerald-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                        LKR {pPanadol.price}
                      </span>
                      <img
                        src={pPanadol.imageUrl}
                        alt={pPanadol.name}
                        className="h-28 sm:h-36 w-auto object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-2 text-center space-y-0.5">
                      <p className="font-extrabold text-gray-900 text-xs tracking-tight truncate">{pPanadol.name}</p>
                      <p className="text-[9px] text-gray-500 font-medium">Fast Pain Relief</p>
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-[8px] px-2 py-0.5 rounded-full font-bold">
                        100% Authentic
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Center Floating Card: Amoxil 500mg (Prominent) */}
                <Link
                  to={`/catalog/${pAmoxil.id}`}
                  className="bottle-float-center w-36 sm:w-52 md:w-60 z-20 select-none group cursor-pointer block hover:scale-105 transition-all duration-300"
                >
                  <div className="bg-white rounded-[2.2rem] p-3.5 shadow-2xl border-2 border-white ring-4 ring-blue-200/50 group-hover:ring-blue-400/80 transition-all">
                    <div className="relative h-40 sm:h-48 rounded-2xl bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-3 overflow-hidden">
                      <span className="absolute top-2.5 left-2.5 bg-blue-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                        LKR {pAmoxil.price}
                      </span>
                      <span className="absolute top-2.5 right-2.5 bg-rose-100 text-rose-700 text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                        Rx Required
                      </span>
                      <img
                        src={pAmoxil.imageUrl}
                        alt={pAmoxil.name}
                        className="h-32 sm:h-44 w-auto object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-2.5 text-center space-y-1">
                      <p className="font-black text-gray-950 text-sm tracking-tight truncate">{pAmoxil.name}</p>
                      <p className="text-[9px] text-gray-600 font-medium">Broad-Spectrum Antibiotic</p>
                      <span className="bg-blue-50 text-blue-900 font-bold text-[9px] px-3 py-1 rounded-full border border-blue-200 uppercase tracking-wider inline-block">
                        Batch 1 Live Verified
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Right Floating Card: Centrum Advance */}
                <Link
                  to={`/catalog/${pCentrum.id}`}
                  className="bottle-float-right w-32 sm:w-44 md:w-52 select-none group cursor-pointer block hover:scale-105 transition-all duration-300"
                >
                  <div className="bg-white/95 backdrop-blur-md rounded-[2rem] p-3 shadow-2xl border border-white/80 group-hover:border-amber-400/80 transition-all">
                    <div className="relative h-32 sm:h-40 rounded-2xl bg-gradient-to-b from-amber-50/60 to-white flex items-center justify-center p-2 overflow-hidden">
                      <span className="absolute top-2 left-2 bg-amber-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                        LKR {pCentrum.price}
                      </span>
                      <img
                        src={pCentrum.imageUrl}
                        alt={pCentrum.name}
                        className="h-28 sm:h-36 w-auto object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-2 text-center space-y-0.5">
                      <p className="font-extrabold text-gray-900 text-xs tracking-tight truncate">{pCentrum.name}</p>
                      <p className="text-[9px] text-gray-500 font-medium">Adult Vitality Multi</p>
                      <span className="inline-block bg-amber-100 text-amber-800 text-[8px] px-2 py-0.5 rounded-full font-bold">
                        Daily Immunity
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Hero Bottom Title and CTA */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mt-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-black max-w-xl leading-[1.05] uppercase">
                Bringing Health<br />To Your Doorstep
              </h1>
              <Link
                to="/catalog"
                className="inline-flex items-center justify-center self-start sm:self-auto bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-full transition-all duration-300 shadow-md hover:scale-105 active:scale-95 group card-gleam"
              >
                <span>Explore</span>
                <i className="fa-solid fa-arrow-right ml-2 group-hover:translate-x-1.5 transition-transform duration-300 text-xs" />
              </Link>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION 2: THREE BENTO FEATURE CARDS                      */}
          {/* ========================================================= */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Bento 1: Prescription Medicine */}
            <Link
              to="/catalog?category=Prescription%20Medicines"
              className="bg-[#E4F0F8] rounded-3xl p-6 flex flex-col justify-between h-96 border border-white/80 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 card-gleam"
            >
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-blue-800 bg-blue-100/80 px-2.5 py-1 rounded-full inline-block mb-2">
                  Prescription Rx
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 leading-snug">
                  Prescription<br />Medicines
                </h2>
              </div>
              {/* Real Product Image Preview: Amoxil 500mg */}
              <div className="my-auto py-2 flex items-center justify-center">
                <div className="relative w-44 h-36 bg-white/80 backdrop-blur-xs rounded-2xl p-3 shadow-md border border-white flex items-center justify-center group-hover:scale-105 group-hover:shadow-lg transition-all duration-500">
                  <img
                    src={pAmoxil.imageUrl}
                    alt={pAmoxil.name}
                    className="h-28 w-auto object-contain drop-shadow"
                  />
                  <div className="absolute bottom-2 right-2 bg-black text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                    LKR {pAmoxil.price}
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between pt-2 border-t border-blue-100/60">
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-700 max-w-[170px] leading-tight">
                  Verified Antibiotics &amp; Regulated Therapeutics
                </p>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-gray-800 group-hover:bg-black group-hover:text-white group-hover:rotate-45 group-hover:scale-110 transition-all duration-300">
                  <i className="fa-solid fa-arrow-up-right text-xs" />
                </div>
              </div>
            </Link>

            {/* Bento 2: Home Health & Medical Care */}
            <Link
              to="/catalog?category=Home%20Health%20%26%20medical%20Care"
              className="bg-[#E5F4E9] rounded-3xl p-6 flex flex-col justify-between h-96 border border-white/80 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 card-gleam"
            >
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-emerald-800 bg-emerald-100/80 px-2.5 py-1 rounded-full inline-block mb-2">
                  Clinical Devices
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 leading-snug">
                  Home Health &amp;<br />Medical Care
                </h2>
              </div>
              {/* Real Product Image Preview: Omron M3 */}
              <div className="my-auto py-2 flex items-center justify-center">
                <div className="relative w-44 h-36 bg-white/80 backdrop-blur-xs rounded-2xl p-3 shadow-md border border-white flex items-center justify-center group-hover:scale-105 group-hover:shadow-lg transition-all duration-500">
                  <img
                    src={pOmron.imageUrl}
                    alt={pOmron.name}
                    className="h-28 w-auto object-contain drop-shadow"
                  />
                  <div className="absolute bottom-2 right-2 bg-emerald-700 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                    LKR {pOmron.price}
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between pt-2 border-t border-emerald-100/60">
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-700 max-w-[170px] leading-tight">
                  Clinically Validated Diagnostic Monitors
                </p>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-gray-800 group-hover:bg-black group-hover:text-white group-hover:rotate-45 group-hover:scale-110 transition-all duration-300">
                  <i className="fa-solid fa-arrow-up-right text-xs" />
                </div>
              </div>
            </Link>

            {/* Bento 3: Supplements & Vitamins */}
            <Link
              to="/catalog?category=Vitamins%20%26%20Nutritional%20Supplements"
              className="bg-[#FAF3D1] rounded-3xl p-6 flex flex-col justify-between h-96 border border-white/80 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 card-gleam"
            >
              <div>
                <span className="text-[10px] uppercase font-black tracking-widest text-amber-900 bg-amber-200/80 px-2.5 py-1 rounded-full inline-block mb-2">
                  Daily Vitality
                </span>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 leading-snug">
                  Supplements<br />&amp; Vitamins
                </h2>
              </div>
              {/* Real Product Image Preview: Centrum Advance */}
              <div className="my-auto py-2 flex items-center justify-center">
                <div className="relative w-44 h-36 bg-white/80 backdrop-blur-xs rounded-2xl p-3 shadow-md border border-white flex items-center justify-center group-hover:scale-105 group-hover:shadow-lg transition-all duration-500">
                  <img
                    src={pCentrum.imageUrl}
                    alt={pCentrum.name}
                    className="h-28 w-auto object-contain drop-shadow"
                  />
                  <div className="absolute bottom-2 right-2 bg-amber-700 text-white text-[8px] font-bold px-2 py-0.5 rounded-full">
                    LKR {pCentrum.price}
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between pt-2 border-t border-amber-200/60">
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-700 max-w-[170px] leading-tight">
                  Essential Nutrients For Adult Health &amp; Immunity
                </p>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-gray-800 group-hover:bg-black group-hover:text-white group-hover:rotate-45 group-hover:scale-110 transition-all duration-300">
                  <i className="fa-solid fa-arrow-up-right text-xs" />
                </div>
              </div>
            </Link>
          </section>

          {/* ========================================================= */}
          {/* SECTION 3: CATEGORY PILLS BAR                             */}
          {/* ========================================================= */}
          <section className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {/* Category: Prescription Medicines */}
              <Link
                to="/catalog?category=Prescription%20Medicines"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Prescription Meds</span>
                <span className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-prescription-bottle text-xs" />
                </span>
              </Link>

              {/* Category: Daily Health & Wellness */}
              <Link
                to="/catalog?category=Daily%20Health%20%26%20Wellness"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Daily Health</span>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-heart-pulse text-xs" />
                </span>
              </Link>

              {/* Category: First Aid & Health Care */}
              <Link
                to="/catalog?category=First%20Aid%20%26%20Health%20Care"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">First Aid Care</span>
                <span className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-kit-medical text-xs" />
                </span>
              </Link>

              {/* Category: Vitamins & Supplements */}
              <Link
                to="/catalog?category=Vitamins%20%26%20Nutritional%20Supplements"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Vitamins &amp; Supps</span>
                <span className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-capsules text-xs" />
                </span>
              </Link>

              {/* Category: Home Health & Devices */}
              <Link
                to="/catalog?category=Home%20Health%20%26%20medical%20Care"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group col-span-2 sm:col-span-1"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Medical Devices</span>
                <span className="w-7 h-7 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform">
                  <i className="fa-solid fa-stethoscope text-xs" />
                </span>
              </Link>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION 4: FEATURED MEDICATIONS (Live Batch 1 Items)       */}
          {/* ========================================================= */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-extrabold uppercase tracking-tight text-gray-900">
                Featured Medications
              </h3>
              <Link
                to="/catalog"
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors flex items-center gap-1 group"
              >
                <span>View All Catalog</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Product 1: Amoxil 500mg */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block">
                    {pAmoxil.category}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                    {pAmoxil.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono">{pAmoxil.sku}</p>
                </div>
                <div className="h-32 flex items-center justify-center py-2">
                  <img
                    src={pAmoxil.imageUrl}
                    alt={pAmoxil.name}
                    className="h-24 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="space-y-1 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">LKR {pAmoxil.price.toFixed(2)}</p>
                  <Link
                    to={`/catalog/${pAmoxil.id}`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black transition-colors"
                  >
                    <span>View Product</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Product 2: Panadol Extra */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">
                    {pPanadol.category}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate">
                    {pPanadol.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono">{pPanadol.sku}</p>
                </div>
                <div className="h-32 flex items-center justify-center py-2">
                  <img
                    src={pPanadol.imageUrl}
                    alt={pPanadol.name}
                    className="h-24 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="space-y-1 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">LKR {pPanadol.price.toFixed(2)}</p>
                  <Link
                    to={`/catalog/${pPanadol.id}`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black transition-colors"
                  >
                    <span>View Product</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Product 3: Dettol Antiseptic */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full inline-block">
                    {pDettol.category}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-rose-600 transition-colors truncate">
                    {pDettol.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono">{pDettol.sku}</p>
                </div>
                <div className="h-32 flex items-center justify-center py-2">
                  <img
                    src={pDettol.imageUrl}
                    alt={pDettol.name}
                    className="h-24 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="space-y-1 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">LKR {pDettol.price.toFixed(2)}</p>
                  <Link
                    to={`/catalog/${pDettol.id}`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black transition-colors"
                  >
                    <span>View Product</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Product 4: Centrum Advance */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block">
                    {pCentrum.category}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-600 transition-colors truncate">
                    {pCentrum.name}
                  </h4>
                  <p className="text-[10px] text-gray-400 font-mono">{pCentrum.sku}</p>
                </div>
                <div className="h-32 flex items-center justify-center py-2">
                  <img
                    src={pCentrum.imageUrl}
                    alt={pCentrum.name}
                    className="h-24 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="space-y-1 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">LKR {pCentrum.price.toFixed(2)}</p>
                  <Link
                    to={`/catalog/${pCentrum.id}`}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-black transition-colors"
                  >
                    <span>View Product</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION 5: PROMO BANNERS STACK (3 Cards)                  */}
          {/* ========================================================= */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Promo 1: Panadol Extra */}
            <div className="bg-[#E7F8EC] rounded-3xl p-6 relative overflow-hidden border border-white flex justify-between items-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group card-gleam">
              <div className="space-y-3 z-10 max-w-[65%]">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block">
                  LKR {pPanadol.price}
                </span>
                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                  {pPanadol.name}
                </h4>
                <p className="text-[10px] text-gray-600 leading-snug line-clamp-2">
                  {pPanadol.description}
                </p>
                <Link
                  to={`/catalog/${pPanadol.id}`}
                  className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Explore</span>
                  <i className="fa-solid fa-arrow-right text-[8px]" />
                </Link>
              </div>
              {/* Product image thumbnail */}
              <div className="w-24 h-24 bg-white/70 backdrop-blur-xs rounded-2xl p-2 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-500">
                <img
                  src={pPanadol.imageUrl}
                  alt={pPanadol.name}
                  className="h-20 w-auto object-contain drop-shadow"
                />
              </div>
            </div>

            {/* Promo 2: Dettol Antiseptic */}
            <div className="bg-[#DCEBFA] rounded-3xl p-6 relative overflow-hidden border border-white flex justify-between items-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group card-gleam">
              <div className="space-y-3 z-10 max-w-[65%]">
                <span className="text-[9px] font-black uppercase tracking-widest text-blue-800 bg-blue-100 px-2.5 py-0.5 rounded-full inline-block">
                  LKR {pDettol.price}
                </span>
                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                  {pDettol.name}
                </h4>
                <p className="text-[10px] text-gray-600 leading-snug line-clamp-2">
                  {pDettol.description}
                </p>
                <Link
                  to={`/catalog/${pDettol.id}`}
                  className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Explore</span>
                  <i className="fa-solid fa-arrow-right text-[8px]" />
                </Link>
              </div>
              {/* Product image thumbnail */}
              <div className="w-24 h-24 bg-white/70 backdrop-blur-xs rounded-2xl p-2 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-500">
                <img
                  src={pDettol.imageUrl}
                  alt={pDettol.name}
                  className="h-20 w-auto object-contain drop-shadow"
                />
              </div>
            </div>

            {/* Promo 3: Omron M3 Blood Pressure */}
            <div className="bg-[#F8F2E6] rounded-3xl p-6 relative overflow-hidden border border-white flex justify-between items-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group card-gleam">
              <div className="space-y-3 z-10 max-w-[65%]">
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block">
                  LKR {pOmron.price}
                </span>
                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                  {pOmron.name}
                </h4>
                <p className="text-[10px] text-gray-600 leading-snug line-clamp-2">
                  {pOmron.description}
                </p>
                <Link
                  to={`/catalog/${pOmron.id}`}
                  className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Explore</span>
                  <i className="fa-solid fa-arrow-right text-[8px]" />
                </Link>
              </div>
              {/* Product image thumbnail */}
              <div className="w-24 h-24 bg-white/70 backdrop-blur-xs rounded-2xl p-2 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-500">
                <img
                  src={pOmron.imageUrl}
                  alt={pOmron.name}
                  className="h-20 w-auto object-contain drop-shadow"
                />
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION 6: DAILY ESSENTIALS & VITAMINS (The 8 Products)   */}
          {/* ========================================================= */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-xl font-extrabold uppercase tracking-tight text-gray-900">
                  Daily Essentials &amp; Catalog Showcase
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Clinical-grade pharmaceutical formulations and health devices verified for quality
                </p>
              </div>
              <Link
                to="/catalog"
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors flex items-center gap-1 group"
              >
                <span>Browse Full Catalog</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            {/* 8 Product Grid: 2 Rows x 4 Columns */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dbProducts.map((p) => (
                <div
                  key={p.sku || p.id}
                  className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full truncate">
                        {p.category}
                      </span>
                      {p.requiresPrescription && (
                        <span className="text-[8px] font-black uppercase text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md shrink-0">
                          Rx
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 truncate">{p.genericName}</p>
                  </div>
                  <div className="h-36 flex items-center justify-center py-2 my-2 bg-gradient-to-b from-[#fbf8f5] to-white rounded-2xl p-2">
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/products/amoxil.svg';
                      }}
                      className="h-28 w-auto object-contain drop-shadow group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="space-y-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs font-black text-black">LKR {Number(p.price).toFixed(2)}</p>
                    <Link
                      to={`/catalog/${p.id}`}
                      className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors"
                    >
                      <span>Shop Now</span>
                      <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION 7: SOCIAL & COMMUNITY SECTION                     */}
          {/* ========================================================= */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
            {/* Card 1: Family / Warm Care (@heision) */}
            <div className="bg-amber-100/50 rounded-3xl p-6 relative overflow-hidden border border-white flex flex-col justify-between min-h-[220px] hover:shadow-md transition-shadow group card-gleam">
              <div className="flex items-center justify-between z-10">
                <span className="bg-black/10 backdrop-blur-md text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">
                  @heision
                </span>
                <i className="fa-brands fa-instagram text-gray-700 text-base group-hover:scale-125 transition-transform" />
              </div>
              <div className="my-auto py-4">
                <p className="text-lg font-semibold text-gray-800 italic">
                  "Safe, gentle daily relief that our entire family trusts."
                </p>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Childhood Care Verified
              </div>
            </div>

            {/* Card 2: Pharmacist Support (@robinson) */}
            <div className="bg-slate-200/60 rounded-3xl p-6 relative overflow-hidden border border-white flex flex-col justify-between min-h-[220px] hover:shadow-md transition-shadow group card-gleam">
              <div className="flex items-center justify-between z-10">
                <span className="bg-black/10 backdrop-blur-md text-gray-900 text-xs font-semibold px-3 py-1 rounded-full">
                  @robinson
                </span>
                <i className="fa-brands fa-instagram text-gray-700 text-base group-hover:scale-125 transition-transform" />
              </div>
              <div className="my-auto py-4">
                <p className="text-lg font-semibold text-gray-800 italic">
                  "Prescriptions double checked by licensed clinicians."
                </p>
              </div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Professional Advice
              </div>
            </div>

            {/* Card 3: Social Tag & QR Block with Laser Radar Scan-Line */}
            <div className="bg-white rounded-3xl p-6 border border-gray-200/80 flex flex-col justify-between min-h-[220px] hover:shadow-md transition-shadow group card-gleam">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">Social Media</span>
                <h4 className="text-2xl font-extrabold text-black">@pharma_plus</h4>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-gray-800">Scan to join with us</p>
                  <p className="text-[10px] text-gray-400">Daily health tips &amp; drops</p>
                </div>
                {/* Simulated QR Code Icon with animated scanner line */}
                <div className="relative w-14 h-14 bg-gray-50 rounded-2xl border border-gray-200 p-2 flex items-center justify-center shadow-inner overflow-hidden">
                  <i className="fa-solid fa-qrcode text-3xl text-gray-800" />
                  <span className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-radar-sweep shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION 8: FOOTER BRAND SECTION                           */}
          {/* ========================================================= */}
          <footer className="bg-[#F5F5CE] rounded-3xl p-8 sm:p-12 relative overflow-hidden border border-yellow-200/50">
            {/* Subtle Large Watermark Typography in Background */}
            <div className="absolute -bottom-10 left-6 text-[100px] sm:text-[160px] font-black tracking-tighter text-black/5 pointer-events-none select-none uppercase">
              PHARMA +
            </div>

            <div className="relative z-10 space-y-10">
              {/* Top Banner: Provider Callout Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-yellow-300/40 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="inline-block bg-black text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      PHARMA + FOR PROVIDERS
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Live Pharmacist On Call
                    </span>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950 leading-snug">
                    Hand us the script, we'll handle the rest.
                  </h3>
                  <p className="text-xs text-gray-600 max-w-xl">
                    Partner with our licensed pharmacy network for streamlined direct-to-patient dispatch, automated refills, and real-time adherence analytics.
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <Link
                    to="/login/admin"
                    className="inline-flex items-center justify-center bg-black hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest px-6 py-3.5 rounded-full transition-all shadow-sm hover:scale-105 active:scale-95 group card-gleam"
                  >
                    <span>Provider Portal</span>
                    <span className="ml-1.5 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <div className="w-16 h-16 bg-white/90 rounded-2xl p-1.5 shadow-md border border-yellow-300/50 hidden sm:flex items-center justify-center shrink-0">
                    <img
                      src={pAmoxil.imageUrl}
                      alt="Verified Rx"
                      className="h-12 w-auto object-contain drop-shadow"
                    />
                  </div>
                </div>
              </div>

              {/* Main Footer Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pt-4 items-start">
                {/* Col 1: Brand Info (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="flex items-baseline space-x-2">
                    <h2 className="text-3xl font-extrabold tracking-tight uppercase text-black">PHARMA</h2>
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white text-sm font-black shadow-sm">+</span>
                  </div>
                  <p className="text-xs text-gray-800 font-medium leading-relaxed max-w-sm">
                    Quality medications delivered directly to your doorstep with speed, care, and clinical precision. Certified online pharmacy serving thousands nationwide.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-white/70 backdrop-blur-sm border border-yellow-300/40 px-3 py-1.5 rounded-full text-[10px] font-bold text-gray-800 uppercase tracking-wider shadow-sm">
                    <i className="fa-solid fa-shield-halved text-emerald-700" />
                    <span>HIPAA Compliant &amp; LegitScript Certified</span>
                  </div>
                  {/* Social Media Icons */}
                  <div className="pt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">Join Our Community</p>
                    <div className="flex items-center gap-2">
                      <a href="#instagram" aria-label="Instagram" className="w-9 h-9 rounded-full bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center border border-yellow-200/50 text-gray-800 shadow-sm hover:scale-110">
                        <i className="fa-brands fa-instagram text-xs" />
                      </a>
                      <a href="#twitter" aria-label="X Twitter" className="w-9 h-9 rounded-full bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center border border-yellow-200/50 text-gray-800 shadow-sm hover:scale-110">
                        <i className="fa-brands fa-x-twitter text-xs" />
                      </a>
                      <a href="#linkedin" aria-label="LinkedIn" className="w-9 h-9 rounded-full bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center border border-yellow-200/50 text-gray-800 shadow-sm hover:scale-110">
                        <i className="fa-brands fa-linkedin-in text-xs" />
                      </a>
                      <a href="#facebook" aria-label="Facebook" className="w-9 h-9 rounded-full bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center border border-yellow-200/50 text-gray-800 shadow-sm hover:scale-110">
                        <i className="fa-brands fa-facebook-f text-xs" />
                      </a>
                      <a href="#youtube" aria-label="YouTube" className="w-9 h-9 rounded-full bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center border border-yellow-200/50 text-gray-800 shadow-sm hover:scale-110">
                        <i className="fa-brands fa-youtube text-xs" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Col 2: Shop & Categories (3 cols) */}
                <div className="lg:col-span-3 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-black border-b border-black/10 pb-2">
                    Shop &amp; Categories
                  </h4>
                  <ul className="space-y-2 text-xs font-semibold text-gray-700">
                    <li>
                      <Link to="/catalog?category=Prescription%20Rx" className="hover:text-black transition-colors block">
                        Prescription Medicine
                      </Link>
                    </li>
                    <li>
                      <Link to="/catalog" className="hover:text-black transition-colors block">
                        Surgical Products
                      </Link>
                    </li>
                    <li>
                      <Link to="/catalog?category=Dietary%20%26%20Vits" className="hover:text-black transition-colors block">
                        Daily Vitamins &amp; Supps
                      </Link>
                    </li>
                    <li>
                      <Link to="/catalog" className="hover:text-black transition-colors block">
                        Skin Care Treatments
                      </Link>
                    </li>
                    <li>
                      <Link to="/catalog?category=Pain%20Relief" className="hover:text-black transition-colors block">
                        Pain Relief Formulas
                      </Link>
                    </li>
                    <li>
                      <Link to="/catalog?category=Dietary%20%26%20Vits" className="hover:text-black transition-colors block">
                        Sleep &amp; Wellness
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Col 3: Quick Links (2 cols) */}
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-black border-b border-black/10 pb-2">
                    Quick Links
                  </h4>
                  <ul className="space-y-2 text-xs font-semibold text-gray-700">
                    <li>
                      <Link to="/modules/prescription" className="hover:text-black transition-colors block">
                        Request Order
                      </Link>
                    </li>
                    <li>
                      <Link to="/catalog?filter=offers" className="hover:text-black transition-colors block text-orange-600 font-bold">
                        Special Offers
                      </Link>
                    </li>
                    <li>
                      <Link to="/catalog" className="hover:text-black transition-colors block">
                        Browse Medicines
                      </Link>
                    </li>
                    <li>
                      <Link to="/modules/delivery" className="hover:text-black transition-colors block">
                        Delivery Fleet
                      </Link>
                    </li>
                    <li>
                      <Link to="/login" className="hover:text-black transition-colors block">
                        Customer Account
                      </Link>
                    </li>
                    <li>
                      <Link to="/login/admin" className="hover:text-black transition-colors block">
                        Staff Sign-In
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Col 4: Contact & Clinical HQ (3 cols) */}
                <div className="lg:col-span-3 space-y-3 bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-yellow-200/60 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-widest text-black flex items-center justify-between">
                    <span>Contact &amp; Support</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  </h4>
                  <div className="space-y-2.5 text-xs text-gray-700">
                    <div>
                      <p className="font-bold text-black">+1 (800) 745-5789</p>
                      <p className="text-[10px] text-gray-500">Mon-Fri 8am-8pm EST • 24/7 Hotline</p>
                    </div>
                    <div>
                      <p className="font-bold text-black">care@pharma-plus.com</p>
                      <p className="text-[10px] text-gray-500">General: support@pharma-plus.com</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Clinical HQ</p>
                      <p className="text-[11px] leading-tight text-gray-800">
                        450 Healthway Blvd, Suite 300<br />San Francisco, CA 94107
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legal & Policies Row */}
              <div className="pt-4 border-t border-black/10 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold text-gray-600">
                <div className="flex flex-wrap gap-4 sm:gap-6 uppercase tracking-wider">
                  <Link to="/catalog" className="hover:text-black transition-colors">Privacy Policy</Link>
                  <Link to="/catalog" className="hover:text-black transition-colors">Terms of Service</Link>
                  <Link to="/catalog" className="hover:text-black transition-colors">HIPAA Compliance</Link>
                  <Link to="/catalog" className="hover:text-black transition-colors">Prescription Drug Disclaimer</Link>
                  <Link to="/catalog" className="hover:text-black transition-colors">Refund Policy</Link>
                  <Link to="/catalog" className="hover:text-black transition-colors">Cookie Settings</Link>
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  Verified LegitScript Partner
                </div>
              </div>

              {/* Pharmaceutical FDA Disclaimer */}
              <div className="bg-white/40 rounded-xl p-3 border border-yellow-200/50">
                <p className="text-[9px] text-gray-500 leading-relaxed">
                  * Statements on this site have not been evaluated by the FDA for unprescribed dietary supplements. Prescription medicines are strictly dispensed by fully licensed, accredited partner pharmacies in compliance with state and federal regulations. In case of a medical emergency, call 911 immediately.
                </p>
              </div>

              {/* Copyright & Precision Signature Bar */}
              <div className="pt-2 border-t border-black/10 flex flex-col sm:flex-row justify-between items-center text-[10px] font-bold text-gray-600 uppercase tracking-widest gap-2">
                <span>© 2025 PHARMA + HEALTH INC. ALL RIGHTS RESERVED.</span>
                <span>DESIGNED WITH CARE &amp; PRECISION</span>
              </div>
            </div>
          </footer>

        </div>
      </main>
    </div>
  );
};

export default HomePage;
