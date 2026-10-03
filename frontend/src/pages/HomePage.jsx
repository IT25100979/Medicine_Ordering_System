import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="pt-24 pb-16 px-3 sm:px-5 md:px-8 max-w-[1580px] mx-auto">
      {/* Master Canvas Container */}
      <main className="w-full bg-[#F6F7F9] rounded-[2.5rem] md:rounded-[3rem] p-4 sm:p-6 lg:p-8 shadow-xl border border-white/70">
        
        {/* BEGIN: Hero Section */}
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#E8F0F7] via-[#F4F6F9] to-[#FAF8DE] p-6 sm:p-10 lg:p-14 border border-brand-border/80 shadow-sm mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Editorial Headline & Actions (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md shadow-sm border border-brand-border text-xs font-bold tracking-wider uppercase text-on-surface">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Licensed Healthcare Infrastructure • v2.4</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-charcoal uppercase leading-[1.08]">
                Prescribing <br className="hidden sm:inline" />
                <span className="underline decoration-secondary-container decoration-4 underline-offset-8">peace of mind</span>.
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed">
                Seamless digital prescription ingestion, licensed pharmacist tele-verification, temperature-controlled cold-chain logistics, and doorstep medicine fulfillment.
              </p>

              {/* Primary Call to Action */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/modules/prescription"
                  className="inline-flex items-center gap-2 bg-black hover:bg-zinc-800 text-white font-bold text-sm tracking-wider uppercase px-6 py-3.5 rounded-full transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
                  <span>Upload Doctor's Script</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </Link>

                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-100 text-brand-charcoal font-bold text-sm tracking-wider uppercase px-6 py-3.5 rounded-full transition-all border border-brand-border shadow-sm hover:scale-[1.02]"
                >
                  <span className="material-symbols-outlined text-[18px]">medication</span>
                  <span>Browse Medications</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center gap-6 pt-4 text-xs font-semibold text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">verified</span>
                  <span>Board-Certified Pharmacists</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">thermostat</span>
                  <span>Cold-Chain Monitored</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-secondary text-[18px]">lock</span>
                  <span>HIPAA 256-bit Secure</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Pill Showcase (5 Cols) */}
            <div className="lg:col-span-5 relative flex items-center justify-center min-h-[300px]">
              <div className="relative w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl p-6 border border-white shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-[16px]">health_and_safety</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">Quick Rx Intake</h4>
                      <p className="text-[11px] text-on-surface-variant">Upload in seconds • Verified in &lt; 2 hrs</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    Active
                  </span>
                </div>

                <div className="bg-[#FAF8DE] rounded-2xl p-4 border border-[#EFE298] text-xs text-brand-charcoal space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-amber-700">pill</span>
                    <span>Chronic Subscription Protection</span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant leading-relaxed">
                    Check "Chronic Subscription" when uploading to preserve your prescription indefinitely until your pharmacist reviews or updates it.
                  </p>
                </div>

                <Link
                  to="/modules/prescription"
                  className="w-full py-3 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors"
                >
                  <span>Start Prescription Upload</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

          </div>
        </section>

        {/* BEGIN: Core Modules Bento Grid */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-brand-charcoal">
                Pharmacy Operation Modules
              </h2>
              <p className="text-sm text-on-surface-variant">
                Full-suite clinical pharmacy management, fulfillment, and cold-chain infrastructure
              </p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-surface-container text-on-surface-variant">
              6 Core Modules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Prescription Upload & Clinical Verification */}
            <Link
              to="/modules/prescription"
              className="group bg-white rounded-3xl p-6 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-black text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">clinical_notes</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-brand-charcoal uppercase tracking-tight">
                    Prescription &amp; Clinical Verification
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    ACTIVE
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Upload patient scripts, local disk storage, clinical approval/rejection queue, and chronic subscription preservation logic.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-brand-border text-xs font-bold uppercase text-brand-charcoal group-hover:text-secondary transition-colors">
                <span>Open Rx Module</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            {/* Card 2: Product Catalog */}
            <Link
              to="/catalog"
              className="group bg-white rounded-3xl p-6 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-brand-sky text-secondary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">inventory_2</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-brand-charcoal uppercase tracking-tight">
                    Product Catalog &amp; Medicines
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                    NEW UI
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Comprehensive drug catalog with dosage pills, pricing, category filters, and prescription-required tags.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-brand-border text-xs font-bold uppercase text-brand-charcoal group-hover:text-secondary transition-colors">
                <span>Browse Catalog</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            {/* Card 3: Delivery Management */}
            <Link
              to="/modules/delivery"
              className="group bg-white rounded-3xl p-6 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E0F2FE] text-secondary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-brand-charcoal uppercase tracking-tight">
                    Delivery Management &amp; Zones
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    OPERATIONAL
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Role-based dispatch tracking, address routing, delivery zone fee rates, and rider coordination.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-brand-border text-xs font-bold uppercase text-brand-charcoal group-hover:text-secondary transition-colors">
                <span>Manage Deliveries</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            {/* Card 4: Cold Chain Tagging */}
            <Link
              to="/modules/cold-chain"
              className="group bg-white rounded-3xl p-6 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#D8F0DE] text-emerald-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">ac_unit</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-brand-charcoal uppercase tracking-tight">
                    Cold Chain Tagging &amp; Telemetry
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                    PHASE 2
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Temperature-sensitive drug monitors, continuous telemetry logging, and thermal threshold breach alerts.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-brand-border text-xs font-bold uppercase text-brand-charcoal group-hover:text-secondary transition-colors">
                <span>View Telemetry</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            {/* Card 5: Subscriptions & Refills */}
            <Link
              to="/modules/subscriptions"
              className="group bg-white rounded-3xl p-6 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#FAF8DE] text-amber-900 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">autorenew</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-brand-charcoal uppercase tracking-tight">
                    Automatic Refills &amp; Subscriptions
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                    PHASE 2
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Recurring medication schedules, automated customer refills, and chronic prescription linkage.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-brand-border text-xs font-bold uppercase text-brand-charcoal group-hover:text-secondary transition-colors">
                <span>View Subscriptions</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>

            {/* Card 6: Inventory & Expiry */}
            <Link
              to="/modules/inventory"
              className="group bg-white rounded-3xl p-6 border border-brand-border shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#E5E8FD] text-indigo-900 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">warehouse</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-base text-brand-charcoal uppercase tracking-tight">
                    Inventory &amp; Expiry Management
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold">
                    PHASE 2
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed mt-2">
                  Batch tracking, manufacturing dates, FEFO dispensing order, and automatic expiry alerts.
                </p>
              </div>
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-brand-border text-xs font-bold uppercase text-brand-charcoal group-hover:text-secondary transition-colors">
                <span>Manage Inventory</span>
                <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </Link>
          </div>
        </section>

        {/* BEGIN: Clinical Guarantees Strip */}
        <section className="bg-[#FAF8DE] rounded-3xl p-6 sm:p-8 border border-[#EFE298] shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">shield_with_heart</span>
              </div>
              <div>
                <h3 className="font-bold text-base text-brand-charcoal uppercase tracking-tight">
                  Clinical Care &amp; Safety Protocols
                </h3>
                <p className="text-xs text-on-surface-variant max-w-lg mt-0.5">
                  Every uploaded prescription undergoes multi-point clinician inspection before order packaging. No medication is dispensed without licensed sign-off.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                to="/modules/prescription"
                className="bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider px-5 py-2.5 rounded-full transition-all shadow-sm"
              >
                Upload Prescription Now
              </Link>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
};

export default HomePage;
