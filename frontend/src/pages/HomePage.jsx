import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaffRole, getAdminDashboardRoute } from '../utils/roleRoutes';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  // The landing page is strictly for regular customers and visitors.
  // Any logged-in administrator is automatically redirected into their specific dashboard.
  if (isAuthenticated && isStaffRole(user?.role)) {
    const targetDashboard = getAdminDashboardRoute(user.role) || '/admin/catalog';
    return <Navigate to={targetDashboard} replace />;
  }

  return (
    <div className="pt-24 pb-16 px-3 sm:px-5 md:px-8 max-w-[1580px] mx-auto selection:bg-black selection:text-white">
      {/* Master Canvas Container */}
      <main className="w-full bg-[#F6F7F9] rounded-[2.5rem] md:rounded-[3rem] p-4 sm:p-6 lg:p-8 shadow-2xl border border-white/70">
        <div className="space-y-8 lg:space-y-10">

          {/* ========================================================= */}
          {/* SECTION 1: HERO BANNER (Full Width across container)      */}
          {/* ========================================================= */}
          <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-[#A5CBE4] via-[#BFDCF0] to-[#E9F3FA] p-8 sm:p-14 lg:p-16 min-h-[520px] flex flex-col justify-between border border-white/50 shadow-inner w-full">
            {/* Realistic Cloud Overlays (Pure CSS & SVG gradients) */}
            <div
              className="absolute inset-0 bg-no-repeat bg-cover pointer-events-none opacity-40 mix-blend-screen animate-cloud-drift"
              style={{
                backgroundImage: 'radial-gradient(circle at 50% 20%, #ffffff 0%, rgba(255,255,255,0.6) 40%, transparent 75%)',
              }}
            />
            <div className="absolute -bottom-16 -left-12 w-96 h-96 bg-white/50 rounded-full blur-3xl pointer-events-none animate-pulse" />
            <div className="absolute -top-12 -right-12 w-96 h-96 bg-white/60 rounded-full blur-3xl pointer-events-none animate-pulse" />

            {/* Hero Top Heading: 3 Angled Floating Pill Bottles */}
            <div className="relative z-10 w-full flex justify-center items-center py-6 sm:py-12">
              <div className="flex items-center justify-center space-x-3 sm:space-x-10 max-w-3xl mx-auto">
                {/* Left Prescription Bottle */}
                <div className="bottle-float-left w-28 sm:w-36 md:w-48 select-none group cursor-pointer">
                  <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 rounded-[1.8rem] p-1.5 shadow-2xl border border-white/30 group-hover:border-amber-400/50 transition-colors">
                    <div className="h-6 w-16 mx-auto bg-stone-100 rounded-t-lg border-b border-stone-300 shadow-inner" />
                    <div className="bg-white rounded-[1.4rem] p-3 text-center my-1 text-[10px] space-y-1 shadow-sm">
                      <p className="font-black text-black tracking-tight text-xs uppercase">MedRelief</p>
                      <div className="w-10 h-0.5 bg-blue-600 mx-auto my-1" />
                      <div className="bg-gray-100 h-6 flex items-center justify-center rounded px-1">
                        <span className="font-mono text-[8px] text-gray-500 tracking-tighter">||| | | |||| |||</span>
                      </div>
                      <p className="text-[7px] leading-tight text-gray-500 line-clamp-2">Fast acting pain relief capsule formula</p>
                      <span className="inline-block bg-sky-100 text-sky-800 text-[8px] px-2 py-0.5 rounded-full font-bold">60 CAPS</span>
                    </div>
                  </div>
                </div>

                {/* Center Prescription Bottle (Prominent) */}
                <div className="bottle-float-center w-32 sm:w-44 md:w-56 z-20 select-none group cursor-pointer">
                  <div className="bg-gradient-to-br from-amber-600 via-amber-800 to-stone-900 rounded-[2.2rem] p-2 shadow-2xl border border-white/40 ring-4 ring-white/30 group-hover:ring-amber-300/50 transition-all">
                    <div className="h-7 w-20 mx-auto bg-stone-100 rounded-t-xl border-b border-stone-300 shadow-sm flex items-center justify-center">
                      <span className="w-8 h-1 bg-gray-300 rounded-full" />
                    </div>
                    <div className="bg-white rounded-[1.6rem] p-4 text-center my-1 text-[10px] space-y-1.5 shadow-md">
                      <p className="font-black text-gray-950 text-sm tracking-tight uppercase">MedRelief</p>
                      <div className="w-12 h-0.5 bg-blue-600 mx-auto" />
                      <div className="bg-gray-100 h-7 flex items-center justify-center rounded px-2">
                        <span className="font-mono text-[9px] text-gray-600 tracking-tight">||| |||| | |||||</span>
                      </div>
                      <p className="text-[8px] leading-snug text-gray-500 font-medium">Fast-acting premium medical formula</p>
                      <div className="pt-1">
                        <span className="bg-blue-50 text-blue-900 font-bold text-[8px] px-2.5 py-1 rounded-full border border-blue-200 uppercase tracking-wider">
                          Verified 100%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Prescription Bottle */}
                <div className="bottle-float-right w-28 sm:w-36 md:w-48 select-none group cursor-pointer">
                  <div className="bg-gradient-to-br from-amber-700 via-amber-800 to-amber-950 rounded-[1.8rem] p-1.5 shadow-2xl border border-white/30 group-hover:border-amber-400/50 transition-colors">
                    <div className="h-6 w-16 mx-auto bg-stone-100 rounded-t-lg border-b border-stone-300 shadow-inner" />
                    <div className="bg-white rounded-[1.4rem] p-3 text-center my-1 text-[10px] space-y-1 shadow-sm">
                      <p className="font-black text-black tracking-tight text-xs uppercase">MedRelief</p>
                      <div className="w-10 h-0.5 bg-blue-600 mx-auto my-1" />
                      <div className="bg-gray-100 h-6 flex items-center justify-center rounded px-1">
                        <span className="font-mono text-[8px] text-gray-500 tracking-tighter">|||| | ||| ||||</span>
                      </div>
                      <p className="text-[7px] leading-tight text-gray-500 line-clamp-2">Clinical daily protection essential</p>
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-[8px] px-2 py-0.5 rounded-full font-bold">60 CAPS</span>
                    </div>
                  </div>
                </div>
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
              to="/catalog?category=Prescription%20Rx"
              className="bg-[#E4F0F8] rounded-3xl p-6 flex flex-col justify-between h-96 border border-white/80 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 card-gleam"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 leading-snug">
                  Prescription<br />medicine
                </h2>
              </div>
              {/* Graphic Illustration: Pill Container */}
              <div className="my-auto py-2 flex items-center justify-center">
                <div className="relative w-40 h-32 flex items-center justify-center">
                  <div className="w-32 h-20 bg-gradient-to-r from-blue-400 via-teal-400 to-cyan-500 rounded-full flex items-center justify-around px-3 shadow-lg transform -rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-500">
                    <span className="w-6 h-10 bg-white/90 rounded-full border border-blue-200 shadow-sm" />
                    <span className="w-6 h-10 bg-emerald-300 rounded-full border border-teal-200 shadow-sm" />
                    <span className="w-6 h-10 bg-cyan-200 rounded-full border border-cyan-300 shadow-sm" />
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between pt-2 border-t border-blue-100/60">
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-700 max-w-[170px] leading-tight">
                  Over 1000+ Prescription Meds At Your Fingertips
                </p>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-gray-800 group-hover:bg-black group-hover:text-white group-hover:rotate-45 group-hover:scale-110 transition-all duration-300">
                  <i className="fa-solid fa-arrow-up-right text-xs" />
                </div>
              </div>
            </Link>

            {/* Bento 2: Surgical Product */}
            <Link
              to="/catalog"
              className="bg-[#E5F4E9] rounded-3xl p-6 flex flex-col justify-between h-96 border border-white/80 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 card-gleam"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 leading-snug">
                  Surgical<br />product
                </h2>
              </div>
              {/* Graphic Illustration: Surgical tools */}
              <div className="my-auto py-2 flex items-center justify-center">
                <div className="relative w-36 h-32 flex items-center justify-center">
                  <div className="flex items-end space-x-3 group-hover:scale-110 transition-transform duration-500">
                    <div className="w-2.5 h-24 bg-gradient-to-t from-gray-300 to-gray-100 rounded-full shadow-md transform -rotate-12 group-hover:-rotate-6 transition-transform" />
                    <div className="w-3 h-28 bg-gradient-to-t from-gray-400 via-zinc-200 to-gray-100 rounded-full shadow-md" />
                    <div className="w-2.5 h-20 bg-gradient-to-t from-gray-300 to-gray-100 rounded-full shadow-md transform rotate-12 group-hover:rotate-6 transition-transform" />
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between pt-2 border-t border-emerald-100/60">
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-700 max-w-[170px] leading-tight">
                  Trusted Surgical Tools At Your Disposal
                </p>
                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-gray-800 group-hover:bg-black group-hover:text-white group-hover:rotate-45 group-hover:scale-110 transition-all duration-300">
                  <i className="fa-solid fa-arrow-up-right text-xs" />
                </div>
              </div>
            </Link>

            {/* Bento 3: Supplements & Vitamins */}
            <Link
              to="/catalog?category=Dietary%20%26%20Vits"
              className="bg-[#FAF3D1] rounded-3xl p-6 flex flex-col justify-between h-96 border border-white/80 shadow-sm relative overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 card-gleam"
            >
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-gray-900 leading-snug">
                  Supplements<br />&amp; vitamins
                </h2>
              </div>
              {/* Graphic Illustration: Spilling golden gel pills */}
              <div className="my-auto py-2 flex items-center justify-center">
                <div className="relative flex items-center group-hover:scale-110 transition-transform duration-500">
                  <div className="w-16 h-24 bg-amber-900 rounded-2xl rotate-45 border-2 border-amber-800/40 shadow-xl flex items-end justify-center p-2">
                    <div className="w-10 h-3 bg-amber-400 rounded-full opacity-60" />
                  </div>
                  <div className="flex flex-wrap gap-1.5 w-20 -ml-4 z-10">
                    <span className="w-5 h-5 bg-amber-400 rounded-full shadow-md ring-2 ring-yellow-300/80 animate-pill-glow" />
                    <span className="w-4 h-4 bg-amber-300 rounded-full shadow-sm animate-pulse" />
                    <span className="w-5 h-5 bg-amber-500 rounded-full shadow-md animate-pill-glow" />
                    <span className="w-4 h-4 bg-yellow-400 rounded-full shadow animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex items-end justify-between pt-2 border-t border-amber-200/60">
                <p className="text-[10px] font-bold tracking-widest uppercase text-gray-700 max-w-[170px] leading-tight">
                  Essential Nutrients For A Healthier You
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
            {/* Row 1 Categories */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Category: Diabetes Care */}
              <Link
                to="/catalog"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Diabetes Care</span>
                <span className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 group-hover:scale-125 group-hover:rotate-6 transition-transform">
                  <i className="fa-solid fa-droplet text-xs" />
                </span>
              </Link>

              {/* Category: Vitamins & Supplements */}
              <Link
                to="/catalog?category=Dietary%20%26%20Vits"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Vitamins &amp; Supps</span>
                <span className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 transition-transform">
                  <div className="w-4 h-2 rounded-full bg-amber-400 border border-amber-500" />
                </span>
              </Link>

              {/* Category: Pain Relief */}
              <Link
                to="/catalog?category=Pain%20Relief"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Pain Relief</span>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 transition-transform">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 rotate-45 border border-emerald-600" />
                </span>
              </Link>

              {/* Category: Allergy */}
              <Link
                to="/catalog?category=Allergy"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Allergy</span>
                <span className="w-7 h-7 rounded-xl bg-yellow-50 flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 transition-transform">
                  <div className="w-4 h-2 rounded-full bg-yellow-400" />
                </span>
              </Link>
            </div>

            {/* Row 2 Categories */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Category: Skin Care Treatments */}
              <Link
                to="/catalog"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Skin Care Treatments</span>
                <span className="w-7 h-7 rounded-xl bg-teal-50 flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 transition-transform">
                  <div className="w-4 h-3 bg-teal-400 rounded-sm" />
                </span>
              </Link>

              {/* Category: Mental Wellness */}
              <Link
                to="/catalog"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Mental Wellness</span>
                <span className="w-7 h-7 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 transition-transform">
                  <div className="w-4 h-2 bg-indigo-500 rounded-full" />
                </span>
              </Link>

              {/* Category: Bone & Joint Support */}
              <Link
                to="/catalog"
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between border border-gray-200/70 hover:border-gray-400 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-xs font-bold text-gray-800 group-hover:text-black">Bone &amp; Joint Support</span>
                <span className="w-7 h-7 rounded-xl bg-rose-50 flex items-center justify-center group-hover:scale-125 group-hover:rotate-6 transition-transform">
                  <div className="w-4 h-2 bg-rose-400 rounded-full" />
                </span>
              </Link>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION 4: FEATURED MEDICATIONS (Horizontal Grid)          */}
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
              {/* Product: Cloroxomin */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Antibacterial</span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">Cloroxomin</h4>
                </div>
                <div className="h-28 flex items-center justify-center py-2">
                  <div className="w-20 h-16 bg-slate-100 rounded-lg border border-slate-300 grid grid-cols-3 gap-1 p-1.5 shadow-inner group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300">
                    <div className="bg-blue-400 rounded-full h-3" />
                    <div className="bg-blue-400 rounded-full h-3" />
                    <div className="bg-blue-400 rounded-full h-3" />
                    <div className="bg-blue-400 rounded-full h-3" />
                    <div className="bg-blue-400 rounded-full h-3" />
                    <div className="bg-blue-400 rounded-full h-3" />
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">$34.00</p>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors"
                  >
                    <span>Shop Now</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Product: The Killer */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Pain Killer</span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-rose-600 transition-colors">The Killer</h4>
                </div>
                <div className="h-28 flex items-center justify-center py-2">
                  <div className="w-16 h-20 bg-rose-50 rounded-xl border border-rose-200 flex flex-col items-center justify-center p-2 text-center shadow-sm group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300">
                    <span className="text-[8px] font-bold text-rose-700 leading-tight">The Killer</span>
                    <div className="w-6 h-0.5 bg-rose-300 my-1" />
                    <div className="text-[6px] text-gray-400">10 Caplets</div>
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">$29.00</p>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors"
                  >
                    <span>Shop Now</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Product: OnychoBath */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Fingernails</span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-cyan-600 transition-colors">Onychobath</h4>
                </div>
                <div className="h-28 flex items-center justify-center py-2">
                  <div className="w-16 h-18 bg-cyan-50 rounded-xl border border-cyan-200 flex flex-col items-center justify-center p-2 text-center shadow-sm group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300">
                    <span className="text-[8px] font-bold text-cyan-800">Onychobath</span>
                    <div className="w-5 h-5 mt-1 rounded-full bg-cyan-400/20 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-600 animate-pulse" />
                    </div>
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">$66.00</p>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors"
                  >
                    <span>Shop Now</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Product: Medrelief */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-0.5">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-gray-400">Pain Killer</span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition-colors">Medrelief</h4>
                </div>
                <div className="h-28 flex items-center justify-center py-2">
                  <div className="w-14 h-20 bg-teal-50 rounded-xl border border-teal-300 flex flex-col items-center justify-between p-1 shadow-sm group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300">
                    <div className="w-8 h-2.5 bg-stone-700 rounded-t-md" />
                    <span className="text-[7px] font-extrabold text-teal-900 uppercase">MedRelief</span>
                    <div className="w-6 h-0.5 bg-teal-300" />
                  </div>
                </div>
                <div className="space-y-1 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">$48.00</p>
                  <Link
                    to="/catalog"
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 group-hover:text-black transition-colors"
                  >
                    <span>Shop Now</span>
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
            {/* Promo 1: Exclusive Pain Relief Formula */}
            <div className="bg-[#E7F8EC] rounded-3xl p-6 relative overflow-hidden border border-white flex justify-between items-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group card-gleam">
              <div className="space-y-3 z-10 max-w-[65%]">
                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                  Exclusive pain<br />Relief formula
                </h4>
                <p className="text-[10px] text-gray-600 leading-snug">
                  Fast-acting pain relief for headaches, joint pain, and more
                </p>
                <Link
                  to="/catalog?category=Pain%20Relief"
                  className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Explore</span>
                  <i className="fa-solid fa-arrow-right text-[8px]" />
                </Link>
              </div>
              {/* Small Angled Bottle Image Mockup */}
              <div className="w-20 transform rotate-12 -mr-2 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-500">
                <div className="bg-amber-800 rounded-xl p-1 shadow-md border border-white/40">
                  <div className="bg-white rounded-lg p-1.5 text-center text-[7px] font-bold">MedRelief</div>
                </div>
              </div>
            </div>

            {/* Promo 2: Soothing Skin Repair Cream */}
            <div className="bg-[#DCEBFA] rounded-3xl p-6 relative overflow-hidden border border-white flex flex-col justify-between min-h-[220px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group card-gleam">
              <div className="space-y-2 z-10">
                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                  Soothing skin<br />repair cream
                </h4>
                <p className="text-[10px] text-gray-600 leading-snug max-w-[200px]">
                  Deeply hydrates, heals, and restores dry, irritated skin for a radiant glow.
                </p>
                <div className="pt-2">
                  <Link
                    to="/catalog"
                    className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>Explore</span>
                    <i className="fa-solid fa-arrow-right text-[8px]" />
                  </Link>
                </div>
              </div>
              {/* Visual representation */}
              <div className="absolute right-0 bottom-0 w-44 h-36 opacity-90 pointer-events-none flex items-end justify-end group-hover:scale-105 transition-transform duration-500">
                <div className="relative w-36 h-28 bg-gradient-to-tl from-orange-100 to-amber-50 rounded-tl-full border-t-2 border-l-2 border-white/60 shadow-lg flex items-center justify-center">
                  <span className="w-8 h-8 rounded-full bg-white/95 shadow-md flex items-center justify-center animate-pulse">
                    <span className="w-4 h-4 rounded-full bg-blue-100" />
                  </span>
                </div>
              </div>
            </div>

            {/* Promo 3: RestEase Sleep Support */}
            <div className="bg-[#F8F2E6] rounded-3xl p-6 relative overflow-hidden border border-white flex justify-between items-center shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group card-gleam">
              <div className="space-y-3 z-10 max-w-[65%]">
                <h4 className="text-lg font-bold text-gray-900 leading-tight">
                  RestEase<br />Sleep Support
                </h4>
                <p className="text-[10px] text-gray-600 leading-snug">
                  Restful sleep, helping you fall asleep faster and wake up refreshed.
                </p>
                <Link
                  to="/catalog?category=Dietary%20%26%20Vits"
                  className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-all"
                >
                  <span>Explore</span>
                  <i className="fa-solid fa-arrow-right text-[8px]" />
                </Link>
              </div>
              {/* Sleep supplement bottle mockup */}
              <div className="relative w-20 flex flex-col items-center group-hover:scale-110 transition-transform duration-500">
                <span className="absolute -top-2 -right-2 bg-emerald-700 text-white text-[7px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm animate-pulse">
                  best seller
                </span>
                <div className="w-14 h-22 bg-stone-900 rounded-xl p-1 text-center text-white border border-stone-700 shadow-md">
                  <div className="w-8 h-2 bg-stone-600 rounded mx-auto mb-1" />
                  <span className="text-[7px] font-bold text-amber-200">Sleep Support</span>
                </div>
              </div>
            </div>
          </section>

          {/* ========================================================= */}
          {/* SECTION 6: DAILY ESSENTIALS & VITAMINS                    */}
          {/* ========================================================= */}
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xl font-extrabold uppercase tracking-tight text-gray-900">
                Daily Essentials &amp; Vitamins
              </h3>
              <Link
                to="/catalog?category=Dietary%20%26%20Vits"
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors flex items-center gap-1 group"
              >
                <span>Browse All</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Item 1: Biotin Supplement */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400">Vitamins</span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">Biotin Supplement</h4>
                </div>
                <div className="h-36 flex items-center justify-center py-2">
                  <div className="w-16 h-28 bg-emerald-50 rounded-2xl border-2 border-emerald-200/60 flex flex-col items-center justify-between p-1.5 shadow-sm group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300">
                    <div className="w-10 h-3 bg-white rounded border border-emerald-200" />
                    <div className="bg-white w-full rounded-lg py-1 text-center text-[7px] font-bold text-emerald-900 uppercase">Biotin</div>
                    <div className="w-6 h-1 bg-emerald-200 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">$56.00</p>
                  <Link
                    to="/catalog?category=Dietary%20%26%20Vits"
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors"
                  >
                    <span>Shop Now</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Item 2: Goji Berry */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400">Vitamins</span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-rose-700 transition-colors">Goji Berry</h4>
                </div>
                <div className="h-36 flex items-center justify-center py-2">
                  <div className="w-16 h-28 bg-rose-50 rounded-2xl border-2 border-rose-200/60 flex flex-col items-center justify-between p-1.5 shadow-sm group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300">
                    <div className="w-10 h-3 bg-white rounded border border-rose-200" />
                    <div className="bg-white w-full rounded-lg py-1 text-center text-[7px] font-bold text-rose-900 uppercase">Goji Berry</div>
                    <div className="w-6 h-1 bg-rose-200 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">$65.00</p>
                  <Link
                    to="/catalog?category=Dietary%20%26%20Vits"
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors"
                  >
                    <span>Shop Now</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Item 3: Turmeric */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400">Vitamins</span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-amber-700 transition-colors">Turmeric</h4>
                </div>
                <div className="h-36 flex items-center justify-center py-2">
                  <div className="w-16 h-28 bg-amber-50 rounded-2xl border-2 border-amber-200/60 flex flex-col items-center justify-between p-1.5 shadow-sm group-hover:scale-105 group-hover:rotate-2 transition-transform duration-300">
                    <div className="w-10 h-3 bg-white rounded border border-amber-200" />
                    <div className="bg-white w-full rounded-lg py-1 text-center text-[7px] font-bold text-amber-900 uppercase">Turmeric</div>
                    <div className="w-6 h-1 bg-amber-200 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">$84.00</p>
                  <Link
                    to="/catalog?category=Dietary%20%26%20Vits"
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors"
                  >
                    <span>Shop Now</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Item 4: Cellular Nutrition */}
              <div className="bg-white rounded-3xl p-5 flex flex-col justify-between border border-gray-100 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group card-gleam">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold tracking-widest text-gray-400">Vitamins</span>
                  <h4 className="text-sm font-bold text-gray-900 group-hover:text-red-500 transition-colors">Cellular Nutrition</h4>
                </div>
                <div className="h-36 flex items-center justify-center py-2">
                  <div className="w-16 h-28 bg-stone-900 rounded-2xl border border-stone-800 flex flex-col items-center justify-between p-1.5 shadow-sm text-white group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300">
                    <div className="w-10 h-3 bg-stone-700 rounded" />
                    <div className="bg-stone-800 w-full rounded-lg py-1 text-center text-[7px] font-bold text-red-400 uppercase">Cellular</div>
                    <div className="w-6 h-1 bg-stone-700 rounded-full" />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t border-gray-50 flex items-center justify-between">
                  <p className="text-xs font-bold text-black">$90.00</p>
                  <Link
                    to="/catalog?category=Dietary%20%26%20Vits"
                    className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest text-gray-400 group-hover:text-black transition-colors"
                  >
                    <span>Shop Now</span>
                    <i className="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
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
                <h4 className="text-2xl font-extrabold text-black">@pills.co</h4>
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
            <div className="absolute -bottom-10 left-6 text-[110px] sm:text-[180px] font-black tracking-tighter text-black/5 pointer-events-none select-none uppercase">
              PILLS
            </div>

            <div className="relative z-10 space-y-10">
              {/* Top Banner: Provider Callout Card */}
              <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-yellow-300/40 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 hover:shadow-md transition-shadow">
                <div className="space-y-2 text-center md:text-left">
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <span className="inline-block bg-black text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      PILLS FOR PROVIDERS
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
                  <div className="w-16 shrink-0 hidden sm:block">
                    <div className="bg-gradient-to-b from-amber-700 to-amber-900 rounded-2xl p-1 shadow-lg border border-amber-500/50">
                      <div className="bg-white rounded-xl p-2 text-center text-[7px] font-bold space-y-1">
                        <span className="block text-gray-900 font-extrabold uppercase">MedRelief</span>
                        <div className="w-8 h-0.5 bg-blue-500 mx-auto" />
                        <div className="h-3.5 bg-gray-100 flex items-center justify-center rounded">
                          <span className="font-mono text-[7px] text-gray-500">||| ||</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Footer Content Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pt-4 items-start">
                {/* Col 1: Brand Info (4 cols) */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="flex items-baseline space-x-3">
                    <h2 className="text-3xl font-extrabold tracking-tight uppercase text-black">PILLS</h2>
                    <span className="w-2.5 h-2.5 rounded-full bg-black animate-pulse" />
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
                      <Link to="/catalog" className="hover:text-black transition-colors block">
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
                      <p className="font-bold text-black">care@pills.co</p>
                      <p className="text-[10px] text-gray-500">General: support@pills.co</p>
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
                <span>© 2025 PILLS HEALTH INC. ALL RIGHTS RESERVED.</span>
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
