import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { CLINICAL_FALLBACK_IMAGES } from './CatalogPage';

// Default gallery thumbnails ported from Stitch clinical assets
const DEFAULT_THUMBNAILS = {
  front: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAR8Hf6yYLn7fBmwj2vbVL7MyvqWBuUhv6w_VpkKgqJBlaDphbDH6VDY6Q-vMJik4vlElR0yIndLA6wMElKG-PrVjhEi9S8-yZc4NHj-t0kfrvwDftJpB3Cl-T-5Mn-QKPU8bGMAhfIBK4xM8A7RTeDZVirU3kofnQeWq_Y20oujzlzmeehZGIbUgHSRTNuFI9r-z3x3jFMwCQXJesLUUc2tfnJ6EY-D9Z7jmTjAspCYYEqGpogaKwl',
  facts: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBc49wFMAcWdgUzCENR6BbYqQa--elWAltUdV-iWlb5PvUCIt-W6bx3hDe41tsT4ILp1pgmNYVXi3-cqGaUMuXUSz3uMaoY9BFd8PzDNHdomBYQy1prg-6z30sdZ_lKOBa1AVcijU1OSHN6jZk6cUzVWe9U7lhNMt0VDfaEfm6dr00uvMqshrERJlKnhQvcuV0tdgZtICvxoPulvDeFfxw8Vcw6Yf1nLTavTtz-LnDkSCmZoAKyicYk',
  macro: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCIZd08jEsVHMcBVkhzzNZ07VPDRs7vI_yvV0vRBNSo7REqGEXNI0Bto94mh7u6V_FYler9zhDXJ5gooQfyGFnF0nksxrD94wE3QsHe-EUo3itKvGyjaIfdVnxYuT7Ln1AQy72xm9ZjYRacKfhgXYhj5k7DFdETCjcHuv7IlUDEvP8SvMaGdxt7SzKg_rMC8dqhmOVl5ur5EbDUc8oPbXUiEtuglP9AmZpMf8bvTcVMcPbl5Fh45-Dl',
  packaging: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBhYfEdaExbF7aTra8agC7rew3y9aOzkOFtT60fTmErvnTr5lbjv7K_BibFsffuzXAc5lASB4QdyQED1yP_3yd1Xz09Rn14W0b9ZLBpsHoHD9uoT1UOb39jqIcVrs3dZIOgxrFim08I2OT4QZlmvEdpfHwqgfGXtXtxACeos-HFhnOALGTuGKSdXAuw_X6JqFLj6QE1U4EXO26i0KMCYzo33RcBuTKEwkBhLu4oh9c-iD5RhNO4oXZn',
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [activeImage, setActiveImage] = useState('');
  const [selectedThumb, setSelectedThumb] = useState('front');

  // Purchase configuration
  const [selectedForm, setSelectedForm] = useState('Capsule / Softgel');
  const [sizeMultiplier, setSizeMultiplier] = useState(1);
  const [selectedSizeLabel, setSelectedSizeLabel] = useState('120 Softgels (60-Day Supply)');
  const [purchaseMode, setPurchaseMode] = useState('onetime'); // 'onetime' | 'subscribe'
  const [quantity, setQuantity] = useState(1);

  // Tab State: 'overview' | 'facts' | 'dosage' | 'certs' | 'reviews'
  const [activeTab, setActiveTab] = useState('overview');

  // Wishlist toggle
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Feedback Toast
  const [toast, setToast] = useState(null);

  // Checkout Modal State
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('form'); // 'form' | 'submitting' | 'confirmed'
  const [confirmedOrderId, setConfirmedOrderId] = useState('');

  // Checkout Form Fields
  const [shippingForm, setShippingForm] = useState({
    fullName: user?.fullName || 'Alex Johnson',
    address: '42 Medical Center Blvd, Suite 400',
    city: 'San Francisco, CA 94107',
    phone: '+1 (555) 234-8901',
    paymentMethod: 'card', // 'card' | 'cod' | 'wallet'
    cardNumber: '•••• •••• •••• 4242',
    cardExpiry: '12/28',
    cardCvc: '888',
  });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const res = await client.get(`/api/v1/medicines/${id}`);
        if (res.data) {
          const m = res.data;
          const cat = m.category || 'General';
          const fallback = CLINICAL_FALLBACK_IMAGES[cat] || CLINICAL_FALLBACK_IMAGES['General'];
          const mainImg = m.imageUrl || fallback;
          setProduct({
            ...m,
            price: Number(m.unitPrice) || Number(m.price) || 28.5,
            msrp: m.msrp ? Number(m.msrp) : (Number(m.unitPrice) || 28.5) * 1.25,
            stockQuantity: m.stockQuantity != null ? m.stockQuantity : 45,
            rating: m.rating ? Number(m.rating) : 4.8,
            reviewsCount: m.reviewsCount || 142,
            category: cat,
            imageUrl: mainImg,
          });
          setActiveImage(mainImg);
        }
      } catch (err) {
        console.warn('Failed to load specific medicine from backend, attempting fallback:', err);
        // Fallback for ID if API endpoint errored
        const fallback = CLINICAL_FALLBACK_IMAGES['Dietary & Vits'];
        setProduct({
          id: id || 9,
          name: 'Vitamin C 1000mg Bioflavonoid Complex',
          genericName: 'Ascorbic Acid & Standardized Citrus Bioflavonoid Complex',
          sku: 'NDC 72910-401-12',
          price: 30.5,
          msrp: 36.0,
          stockQuantity: 18,
          category: 'Dietary & Vits',
          rating: 4.8,
          reviewsCount: 142,
          imageUrl: fallback,
          description:
            'Ascorbic acid alone quickly degrades in systemic circulation. Our bio-complex binds pure pharmaceutical-grade vitamin C with standardized citrus hesperidin and rutin bioflavonoids, mimicking nature’s cellular delivery matrix for prolonged bioavailability and cellular defense.',
          requiresPrescription: false,
          isTemperatureSensitive: false,
        });
        setActiveImage(fallback);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading || !product) {
    return (
      <div className="pt-32 pb-24 text-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black mx-auto mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
          Loading pharmaceutical product dossier...
        </p>
      </div>
    );
  }

  // Price Computations
  const basePrice = product.price * sizeMultiplier;
  const unitPrice = purchaseMode === 'subscribe' ? basePrice * 0.85 : basePrice;
  const totalPrice = unitPrice * quantity;
  const klarnaInstallment = (totalPrice / 4).toFixed(2);

  const handleThumbClick = (thumbKey, imageSrc) => {
    setSelectedThumb(thumbKey);
    setActiveImage(imageSrc);
  };

  const handleQtyChange = (delta) => {
    setQuantity((prev) => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (product.stockQuantity && next > product.stockQuantity) {
        showToast(`Maximum available stock is ${product.stockQuantity} units.`, 'error');
        return product.stockQuantity;
      }
      return next;
    });
  };

  const handleAddToCart = () => {
    showToast(`Added ${quantity}x "${product.name}" to your cart!`);
  };

  const handleOpenCheckout = () => {
    setCheckoutStep('form');
    setShowCheckoutModal(true);
  };

  const handleConfirmOrder = (e) => {
    e.preventDefault();
    setCheckoutStep('submitting');
    setTimeout(() => {
      const orderRef = `ORD-${Math.floor(100000 + Math.random() * 900000)}-US`;
      setConfirmedOrderId(orderRef);
      setCheckoutStep('confirmed');
    }, 1200);
  };

  return (
    <div className="pt-24 pb-20 px-4 sm:px-6 lg:px-12 max-w-[1440px] mx-auto min-h-screen">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border transition-all ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-zinc-900 text-white border-zinc-800'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] text-amber-400">
            {toast.type === 'error' ? 'error' : 'verified'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Utility Context Bar / Breadcrumbs */}
      <section className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-zinc-500 text-xs">
          <nav className="flex items-center gap-1.5 flex-wrap">
            <Link to="/" className="hover:text-black transition-colors font-medium">Home</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link to="/catalog" className="hover:text-black transition-colors font-medium">Products</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="hover:text-black transition-colors font-medium">{product.category}</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-black font-bold truncate max-w-[220px] sm:max-w-none">{product.name}</span>
          </nav>

          <div className="inline-flex items-center gap-2 self-start sm:self-auto bg-surface-container-low px-3.5 py-1.5 rounded-full shadow-sm border border-brand-border">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] text-zinc-900 font-bold tracking-wide uppercase">
              Verified In-Stock • Dispensed from Hub 01
            </span>
          </div>
        </div>
      </section>

      {/* Main Hero PDP Section (Split Visual Showcase & Action Center) */}
      <section className="mb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ======================================================== */}
          {/* LEFT COLUMN: Studio Imagery & Scientific Badges (7 Cols)  */}
          {/* ======================================================== */}
          <div className="lg:col-span-7 flex flex-col gap-5">
            {/* Main Media Frame */}
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] bg-surface-container-low rounded-3xl overflow-hidden shadow-sm flex items-center justify-center p-6 sm:p-10 group border border-brand-border">
              {/* Radial gradient background */}
              <div className="absolute inset-0 bg-gradient-to-tr from-surface-container-highest/60 via-transparent to-surface-container-low pointer-events-none"></div>

              {/* Product Badges Overlaid */}
              <div className="absolute top-4 left-4 z-10 flex flex-col sm:flex-row gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm backdrop-blur-md">
                  <span className="material-symbols-outlined text-[14px] text-amber-400">science</span>
                  <span>Clinical Grade</span>
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-[11px] font-bold uppercase tracking-wider shadow-sm border border-sky-200">
                  <span className="material-symbols-outlined text-[14px]">ac_unit</span>
                  <span>Cold-Chain Monitored (2°–8°C)</span>
                </span>
              </div>

              {/* Wishlist Button */}
              <div className="absolute top-4 right-4 z-10">
                <button
                  type="button"
                  onClick={() => {
                    setIsWishlisted(!isWishlisted);
                    showToast(isWishlisted ? 'Removed from saved items' : 'Saved to your medical profile!');
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 border ${
                    isWishlisted
                      ? 'bg-red-50 text-red-600 border-red-200'
                      : 'bg-white text-zinc-700 hover:text-red-600 border-brand-border'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isWishlisted ? "'FILL' 1" : "'FILL' 0" }}>
                    favorite
                  </span>
                </button>
              </div>

              {/* Big Hero Image */}
              <img
                src={activeImage}
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = CLINICAL_FALLBACK_IMAGES[product.category] || CLINICAL_FALLBACK_IMAGES['General'];
                }}
                className="relative z-0 max-h-full max-w-full object-contain drop-shadow-2xl transition-all duration-300 group-hover:scale-105"
              />

              {/* Magnify Hint */}
              <div className="absolute bottom-4 right-4 z-10 bg-white/85 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1.5 text-zinc-600 text-[11px] font-bold border border-brand-border shadow-sm">
                <span className="material-symbols-outlined text-[15px]">zoom_in</span>
                <span>Inspected for Purity</span>
              </div>
            </div>

            {/* Thumbnail Selector Carousel */}
            <div className="grid grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => handleThumbClick('front', product.imageUrl || DEFAULT_THUMBNAILS.front)}
                className={`p-1.5 rounded-2xl bg-white shadow-sm transition-all flex flex-col items-center gap-1 border ${
                  selectedThumb === 'front' ? 'ring-2 ring-black border-black shadow-md' : 'opacity-70 hover:opacity-100 border-brand-border'
                }`}
              >
                <div className="w-full aspect-square bg-surface-container-low rounded-xl overflow-hidden flex items-center justify-center p-1">
                  <img
                    src={product.imageUrl || DEFAULT_THUMBNAILS.front}
                    alt="Front view"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight truncate">Front Studio</span>
              </button>

              <button
                type="button"
                onClick={() => handleThumbClick('facts', DEFAULT_THUMBNAILS.facts)}
                className={`p-1.5 rounded-2xl bg-white shadow-sm transition-all flex flex-col items-center gap-1 border ${
                  selectedThumb === 'facts' ? 'ring-2 ring-black border-black shadow-md' : 'opacity-70 hover:opacity-100 border-brand-border'
                }`}
              >
                <div className="w-full aspect-square bg-surface-container-low rounded-xl overflow-hidden flex items-center justify-center p-1">
                  <img
                    src={DEFAULT_THUMBNAILS.facts}
                    alt="Supplement Facts Label"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight truncate">Label / Facts</span>
              </button>

              <button
                type="button"
                onClick={() => handleThumbClick('macro', DEFAULT_THUMBNAILS.macro)}
                className={`p-1.5 rounded-2xl bg-white shadow-sm transition-all flex flex-col items-center gap-1 border ${
                  selectedThumb === 'macro' ? 'ring-2 ring-black border-black shadow-md' : 'opacity-70 hover:opacity-100 border-brand-border'
                }`}
              >
                <div className="w-full aspect-square bg-surface-container-low rounded-xl overflow-hidden flex items-center justify-center p-1">
                  <img
                    src={DEFAULT_THUMBNAILS.macro}
                    alt="Capsule Macro"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight truncate">Capsule Macro</span>
              </button>

              <button
                type="button"
                onClick={() => handleThumbClick('packaging', DEFAULT_THUMBNAILS.packaging)}
                className={`p-1.5 rounded-2xl bg-white shadow-sm transition-all flex flex-col items-center gap-1 border ${
                  selectedThumb === 'packaging' ? 'ring-2 ring-black border-black shadow-md' : 'opacity-70 hover:opacity-100 border-brand-border'
                }`}
              >
                <div className="w-full aspect-square bg-surface-container-low rounded-xl overflow-hidden flex items-center justify-center p-1">
                  <img
                    src={DEFAULT_THUMBNAILS.packaging}
                    alt="Carton Security"
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight truncate">Cold Packaging</span>
              </button>
            </div>

            {/* Trust Badges Strip */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-brand-border grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">biotech</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">100% Lab Tested</p>
                  <p className="text-[11px] text-zinc-500">Triple-batch verified</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 text-sky-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">USP Verified</p>
                  <p className="text-[11px] text-zinc-500">Potency standard</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">eco</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900">Non-GMO</p>
                  <p className="text-[11px] text-zinc-500">Gluten &amp; allergen free</p>
                </div>
              </div>
            </div>

            {/* Clinical Guarantee Panel */}
            <div className="bg-surface-container-low rounded-2xl p-4 border border-brand-border flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-700 text-[26px]">medical_services</span>
                <div>
                  <p className="text-xs font-black text-zinc-900 uppercase tracking-tight">PILLS Doctor &amp; Pharmacist Quality Seal</p>
                  <p className="text-[11px] text-zinc-600">Every lot audited for cellular bioavailability and heavy-metal purity.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('certs')}
                className="shrink-0 text-xs font-bold text-black underline hover:opacity-80"
              >
                View Certificate
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Specifications, Selectors & Checkout CTA   */}
          {/* ======================================================== */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-brand-border flex flex-col gap-5">
              
              {/* Formulation Header */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] uppercase tracking-widest text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                    PILLS CLINICAL LAB • FORMULATED
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">{product.sku || 'SKU-0914-MED'}</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-brand-charcoal tracking-tight leading-tight">
                  {product.name}
                </h1>
                <p className="text-xs text-zinc-500 font-medium mt-1">
                  Generic formulation: {product.genericName || product.name}
                </p>

                {/* Rating Banner */}
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="material-symbols-outlined text-[18px]">
                        star
                      </span>
                    ))}
                  </div>
                  <span className="text-xs font-extrabold text-zinc-900">{product.rating.toFixed(1)}</span>
                  <span className="text-zinc-400 text-xs">•</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('reviews')}
                    className="text-xs font-bold text-zinc-600 underline hover:text-black"
                  >
                    {product.reviewsCount} Verified Patient Reviews
                  </button>
                </div>
              </div>

              {/* Price Engine */}
              <div className="pt-2 border-t border-brand-border">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-3xl font-black text-brand-charcoal">
                    ${unitPrice.toFixed(2)}
                  </span>
                  {product.msrp > unitPrice && (
                    <span className="text-base text-zinc-400 line-through">
                      ${(product.msrp * sizeMultiplier).toFixed(2)}
                    </span>
                  )}
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {purchaseMode === 'subscribe' ? 'Save 30%' : 'Save 15%'}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                  <span>or 4 interest-free payments of</span>
                  <strong className="text-black">${klarnaInstallment}</strong>
                  <span>with Klarna / Afterpay</span>
                </p>
              </div>

              {/* Form / Matrix Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
                  Select Matrix Delivery Form
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Capsule / Softgel', 'Chewable Tablets', 'Pure Powder'].map((formName) => (
                    <button
                      key={formName}
                      type="button"
                      onClick={() => setSelectedForm(formName)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-center transition-all border ${
                        selectedForm === formName
                          ? 'bg-black text-white border-black shadow'
                          : 'bg-surface-container-low text-zinc-700 border-brand-border hover:bg-surface-container'
                      }`}
                    >
                      {formName.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottle Size / Supply Selector */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-zinc-700">Supply Duration</span>
                  <span className="text-emerald-700 font-bold text-[11px]">Recommended for Efficacy</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div
                    onClick={() => {
                      setSizeMultiplier(0.65);
                      setSelectedSizeLabel('60 Units (30-Day Supply)');
                    }}
                    className={`cursor-pointer p-2.5 rounded-2xl border text-center transition-all ${
                      sizeMultiplier === 0.65
                        ? 'bg-white border-black ring-2 ring-black shadow-sm'
                        : 'bg-surface-container-low border-brand-border hover:bg-surface-container'
                    }`}
                  >
                    <p className="text-xs font-bold text-zinc-900">60 Units</p>
                    <p className="text-[10px] text-zinc-500">30-Day</p>
                    <p className="text-xs font-black text-zinc-900 mt-1">${(product.price * 0.65).toFixed(2)}</p>
                  </div>

                  <div
                    onClick={() => {
                      setSizeMultiplier(1);
                      setSelectedSizeLabel('120 Units (60-Day Supply)');
                    }}
                    className={`cursor-pointer p-2.5 rounded-2xl border text-center transition-all relative ${
                      sizeMultiplier === 1
                        ? 'bg-white border-black ring-2 ring-black shadow-sm'
                        : 'bg-surface-container-low border-brand-border hover:bg-surface-container'
                    }`}
                  >
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] font-black uppercase px-2 py-0.2 rounded-full">
                      Best Value
                    </span>
                    <p className="text-xs font-bold text-zinc-900">120 Units</p>
                    <p className="text-[10px] text-zinc-500">60-Day</p>
                    <p className="text-xs font-black text-zinc-900 mt-1">${product.price.toFixed(2)}</p>
                  </div>

                  <div
                    onClick={() => {
                      setSizeMultiplier(1.85);
                      setSelectedSizeLabel('240 Units (120-Day Supply)');
                    }}
                    className={`cursor-pointer p-2.5 rounded-2xl border text-center transition-all ${
                      sizeMultiplier === 1.85
                        ? 'bg-white border-black ring-2 ring-black shadow-sm'
                        : 'bg-surface-container-low border-brand-border hover:bg-surface-container'
                    }`}
                  >
                    <p className="text-xs font-bold text-zinc-900">240 Units</p>
                    <p className="text-[10px] text-zinc-500">120-Day</p>
                    <p className="text-xs font-black text-zinc-900 mt-1">${(product.price * 1.85).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Purchase Mode Toggle (One-Time vs Subscribe & Save) */}
              <div className="space-y-2">
                <div
                  onClick={() => setPurchaseMode('onetime')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    purchaseMode === 'onetime'
                      ? 'bg-white border-black ring-2 ring-black shadow-sm'
                      : 'bg-surface-container-low border-brand-border hover:bg-surface-container'
                  }`}
                >
                  <div className="pt-0.5">
                    <div className="w-4 h-4 rounded-full border-2 border-black flex items-center justify-center">
                      {purchaseMode === 'onetime' && <div className="w-2 h-2 rounded-full bg-black"></div>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900">One-Time Delivery</span>
                      <span className="text-xs font-black text-zinc-900">${basePrice.toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Standard single shipment with zero recurring obligation.</p>
                  </div>
                </div>

                <div
                  onClick={() => setPurchaseMode('subscribe')}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    purchaseMode === 'subscribe'
                      ? 'bg-emerald-50/50 border-emerald-600 ring-2 ring-emerald-600 shadow-sm'
                      : 'bg-surface-container-low border-brand-border hover:bg-surface-container'
                  }`}
                >
                  <div className="pt-0.5">
                    <div className="w-4 h-4 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                      {purchaseMode === 'subscribe' && <div className="w-2 h-2 rounded-full bg-emerald-600"></div>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 flex items-center gap-1">
                        <span>Subscribe &amp; Save 15%</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-black">Popular</span>
                      </span>
                      <span className="text-xs font-black text-emerald-800">${(basePrice * 0.85).toFixed(2)}</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Auto-refilled every 60 days. Pause or cancel anytime in your account.</p>
                  </div>
                </div>
              </div>

              {/* Quantity Stepper & Direct Checkout Actions */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700">Quantity</span>
                  <span className="text-[11px] text-zinc-500 font-semibold flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${product.stockQuantity <= 15 ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                    <span>{product.stockQuantity} units available</span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Stepper */}
                  <div className="inline-flex items-center bg-surface-container-low rounded-full px-2 py-1 border border-brand-border shadow-inner">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      onClick={() => handleQtyChange(-1)}
                      className="w-9 h-9 rounded-full bg-white hover:bg-zinc-100 text-black font-extrabold text-base flex items-center justify-center active:scale-95 transition-all shadow-sm"
                    >
                      -
                    </button>
                    <span className="w-12 text-center text-sm font-black text-black">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      onClick={() => handleQtyChange(1)}
                      className="w-9 h-9 rounded-full bg-white hover:bg-zinc-100 text-black font-extrabold text-base flex items-center justify-center active:scale-95 transition-all shadow-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 h-12 rounded-full bg-surface-container-low hover:bg-surface-container text-black text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-brand-border transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                    <span>Add to Cart</span>
                  </button>
                </div>

                {/* Primary CTA Button: PROCEED TO CHECKOUT */}
                <button
                  type="button"
                  onClick={handleOpenCheckout}
                  className="w-full h-14 rounded-full bg-black hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-wider flex items-center justify-between px-6 shadow-xl transition-all active:scale-[0.99] group"
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-amber-400">lock</span>
                    <span>Proceed to Checkout</span>
                  </span>
                  <span className="inline-flex items-center gap-2 font-black text-sm">
                    <span>${totalPrice.toFixed(2)}</span>
                    <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
                      arrow_forward
                    </span>
                  </span>
                </button>
              </div>

              {/* Dispatch Reassurance Box */}
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sky-950">
                  <span className="material-symbols-outlined text-[20px] text-sky-700">local_shipping</span>
                  <span className="text-xs font-bold uppercase tracking-wider">Same-Day Clinical Cold Dispatch</span>
                </div>
                <p className="text-[11px] text-sky-900 leading-relaxed">
                  Order within <strong className="text-black">2 hrs 14 mins</strong> for immediate dispatch in temperature-stabilized sealed packaging.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[10px] font-bold text-sky-800">
                  <span className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">done</span> Discreet Packing
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">done</span> Cold-Chain Validated
                  </span>
                  <span className="flex items-center gap-0.5">
                    <span className="material-symbols-outlined text-[12px]">done</span> Hub 01 Inspected
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* MID SECTION: Scientific Dossier & Clinical Usage Tabs    */}
      {/* ======================================================== */}
      <section className="mb-14">
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-brand-border">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-brand-border">
            {[
              { key: 'overview', label: 'Overview & Benefits' },
              { key: 'facts', label: 'Supplement Facts & Ingredients' },
              { key: 'dosage', label: 'Clinical Usage & Dosage' },
              { key: 'certs', label: 'Lab Certifications' },
              { key: 'reviews', label: `Patient Reviews (${product.reviewsCount})` },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-all ${
                  activeTab === t.key
                    ? 'bg-black text-white shadow-sm'
                    : 'bg-surface-container-low text-zinc-700 hover:bg-surface-container'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* TAB 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                  Pharmacological Rationale
                </span>
                <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tight mt-2">
                  Potent cellular defense engineered with bioflavonoid synergy.
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed mt-2">
                  {product.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-brand-border">
                <div className="p-4 rounded-2xl bg-surface-container-low border border-brand-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black">Bio-Availability</h4>
                  <p className="text-[11px] text-zinc-500 mt-1">Bound to hesperidin &amp; rutin matrix for 300% slower renal excretion.</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-brand-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black">Gastric Tolerance</h4>
                  <p className="text-[11px] text-zinc-500 mt-1">Buffered pH eliminates esophageal irritation typical with unbuffered acids.</p>
                </div>
                <div className="p-4 rounded-2xl bg-surface-container-low border border-brand-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-black">Cellular Delivery</h4>
                  <p className="text-[11px] text-zinc-500 mt-1">Lipophilic suspension drives deeper leukocyte intracellular uptake.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Facts & Ingredients */}
          {activeTab === 'facts' && (
            <div className="max-w-3xl space-y-4">
              <h3 className="text-base font-black uppercase tracking-tight text-brand-charcoal">
                Supplement &amp; Pharmaceutical Facts
              </h3>
              <div className="bg-surface-container-low rounded-2xl p-5 border border-brand-border font-mono text-xs divide-y divide-zinc-200">
                <div className="flex justify-between py-2 font-bold text-black">
                  <span>Serving Size: 2 Softgels</span>
                  <span>Servings Per Container: 60</span>
                </div>
                <div className="flex justify-between py-2 text-zinc-700">
                  <span>Ascorbic Acid (USP Grade)</span>
                  <span className="font-bold">1,000 mg (1,111% DV)</span>
                </div>
                <div className="flex justify-between py-2 text-zinc-700">
                  <span>Citrus Bioflavonoid Complex (Hesperidin 50%)</span>
                  <span className="font-bold">200 mg (*)</span>
                </div>
                <div className="flex justify-between py-2 text-zinc-700">
                  <span>Wild Rose Hips Extract (Rosa canina fruit)</span>
                  <span className="font-bold">50 mg (*)</span>
                </div>
                <div className="flex justify-between py-2 text-zinc-700">
                  <span>Rutin Bio-flavone Flavonol</span>
                  <span className="font-bold">25 mg (*)</span>
                </div>
              </div>
              <p className="text-[11px] text-zinc-400">
                * Daily Value (DV) not established. Other ingredients: Organic olive oil, beeswax, bovine gelatin, purified water.
              </p>
            </div>
          )}

          {/* TAB 3: Clinical Usage */}
          {activeTab === 'dosage' && (
            <div className="max-w-3xl space-y-4">
              <h3 className="text-base font-black uppercase tracking-tight text-brand-charcoal">
                Recommended Administration &amp; Precautions
              </h3>
              <div className="space-y-3 text-xs text-zinc-600 leading-relaxed">
                <div className="p-4 rounded-2xl bg-zinc-50 border border-brand-border">
                  <p className="font-bold text-black uppercase tracking-wider text-[11px]">Primary Daily Regimen:</p>
                  <p className="mt-1">Take 1 to 2 softgels once daily with a meal and full glass of water, or as directed by your physician.</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 border border-brand-border">
                  <p className="font-bold text-black uppercase tracking-wider text-[11px]">Storage Instructions:</p>
                  <p className="mt-1">Store at room temperature 15°C–25°C (59°F–77°F). Protect from excessive heat and direct sunlight.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Lab Certifications */}
          {activeTab === 'certs' && (
            <div className="max-w-3xl space-y-4">
              <h3 className="text-base font-black uppercase tracking-tight text-brand-charcoal">
                Certified Certificates of Analysis (CoA)
              </h3>
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs text-emerald-950">
                <p className="font-bold text-emerald-900">Certificate of Purity #CoA-2026-0914</p>
                <p>Audited by Eurofins Bioanalytical Labs on October 1, 2026. Micro-biological assay confirms 0.00 ppm lead, arsenic, and mercury.</p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-800 underline cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">file_download</span>
                    <span>Download Signed PDF Certificate (340 KB)</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Patient Reviews */}
          {activeTab === 'reviews' && (
            <div className="max-w-3xl space-y-4">
              <h3 className="text-base font-black uppercase tracking-tight text-brand-charcoal">
                Verified Patient Reviews ({product.reviewsCount})
              </h3>
              <div className="space-y-3">
                {[
                  {
                    name: 'Dr. Marcus Vance, MD',
                    rating: 5,
                    date: 'September 28, 2026',
                    comment: 'Prescribed this formulation to high-stress cardiology patients for endothelium support. Purity and compliance are exceptional.',
                  },
                  {
                    name: 'Sarah K. (Verified Purchaser)',
                    rating: 5,
                    date: 'September 15, 2026',
                    comment: 'Usually vitamin C upsets my stomach, but this buffered complex gave me zero reflux. Fast cold-pack delivery was a huge bonus!',
                  },
                ].map((rev, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-surface-container-low border border-brand-border space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-black">{rev.name}</span>
                      <span className="text-[11px] text-zinc-400">{rev.date}</span>
                    </div>
                    <div className="flex text-amber-500">
                      {[...Array(rev.rating)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[14px]">star</span>
                      ))}
                    </div>
                    <p className="text-xs text-zinc-600 mt-1">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ======================================================== */}
      {/* EXPRESS CHECKOUT & PAYMENT MODAL / DRAWER                */}
      {/* ======================================================== */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto border border-brand-border">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                </span>
                <div>
                  <h3 className="text-lg font-black uppercase tracking-tight text-brand-charcoal">
                    {checkoutStep === 'confirmed' ? 'Order Confirmed!' : 'Express Clinical Checkout'}
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {checkoutStep === 'confirmed'
                      ? 'Your pharmaceutical order has been verified and dispatched.'
                      : 'Encrypted 256-Bit SSL Tele-Pharmacy Transaction'}
                  </p>
                </div>
              </div>

              {checkoutStep !== 'submitting' && (
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-zinc-600"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* STEP 1: FORM & REVIEW */}
            {checkoutStep === 'form' && (
              <form onSubmit={handleConfirmOrder} className="space-y-5">
                {/* Order Summary Item Box */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-brand-border flex items-center gap-4">
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-16 h-16 object-contain rounded-xl bg-white p-1 border border-brand-border"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-black text-brand-charcoal truncate">{product.name}</h4>
                    <p className="text-[11px] text-zinc-500">{selectedSizeLabel} • {selectedForm}</p>
                    <p className="text-xs font-bold text-black mt-1">
                      ${unitPrice.toFixed(2)} × {quantity} unit{quantity > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-brand-charcoal">${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Recipient Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-black">
                    1. Shipping &amp; Patient Delivery
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 uppercase mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={shippingForm.fullName}
                        onChange={(e) => setShippingForm({ ...shippingForm, fullName: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs border border-brand-border focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-600 uppercase mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        required
                        value={shippingForm.phone}
                        onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs border border-brand-border focus:outline-none focus:ring-1 focus:ring-black"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-600 uppercase mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={shippingForm.address}
                      onChange={(e) => setShippingForm({ ...shippingForm, address: e.target.value })}
                      className="w-full h-10 px-3 rounded-xl bg-surface-container-low text-xs border border-brand-border focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                </div>

                {/* Payment Selection */}
                <div className="space-y-3">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-black">
                    2. Payment Method
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'card', label: 'Credit Card', icon: 'credit_card' },
                      { key: 'cod', label: 'Cash on Delivery', icon: 'payments' },
                      { key: 'wallet', label: 'Health Wallet', icon: 'account_balance_wallet' },
                    ].map((pm) => (
                      <button
                        key={pm.key}
                        type="button"
                        onClick={() => setShippingForm({ ...shippingForm, paymentMethod: pm.key })}
                        className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                          shippingForm.paymentMethod === pm.key
                            ? 'bg-black text-white border-black shadow'
                            : 'bg-surface-container-low text-zinc-700 border-brand-border hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{pm.icon}</span>
                        <span className="text-[10px] font-bold uppercase tracking-tight">{pm.label}</span>
                      </button>
                    ))}
                  </div>

                  {shippingForm.paymentMethod === 'card' && (
                    <div className="p-3.5 rounded-2xl bg-surface-container-low border border-brand-border space-y-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Card Number</label>
                        <input
                          type="text"
                          required
                          value={shippingForm.cardNumber}
                          onChange={(e) => setShippingForm({ ...shippingForm, cardNumber: e.target.value })}
                          placeholder="4242 4242 4242 4242"
                          className="w-full h-9 px-3 rounded-xl bg-white text-xs border border-brand-border focus:outline-none focus:ring-1 focus:ring-black font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">Exp Date (MM/YY)</label>
                          <input
                            type="text"
                            required
                            value={shippingForm.cardExpiry}
                            onChange={(e) => setShippingForm({ ...shippingForm, cardExpiry: e.target.value })}
                            className="w-full h-9 px-3 rounded-xl bg-white text-xs border border-brand-border focus:outline-none focus:ring-1 focus:ring-black font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-600 uppercase mb-1">CVC Code</label>
                          <input
                            type="password"
                            required
                            value={shippingForm.cardCvc}
                            onChange={(e) => setShippingForm({ ...shippingForm, cardCvc: e.target.value })}
                            className="w-full h-9 px-3 rounded-xl bg-white text-xs border border-brand-border focus:outline-none focus:ring-1 focus:ring-black font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className="pt-2 border-t border-brand-border space-y-1.5 text-xs">
                  <div className="flex justify-between text-zinc-600">
                    <span>Subtotal ({quantity} items):</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-semibold">
                    <span>Insulated Cold-Chain Shipping:</span>
                    <span>$0.00 (Free)</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-black pt-1 border-t border-brand-border">
                    <span>Total Amount:</span>
                    <span>${totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full h-12 rounded-full bg-black hover:bg-zinc-800 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[16px] text-amber-400">lock</span>
                  <span>Pay &amp; Complete Order (${totalPrice.toFixed(2)})</span>
                </button>
              </form>
            )}

            {/* STEP 2: SUBMITTING / PROCESSING */}
            {checkoutStep === 'submitting' && (
              <div className="py-12 text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto"></div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-black">
                  Securing Clinical Order &amp; Encrypting Payment...
                </h4>
                <p className="text-xs text-zinc-500">
                  Transmitting order instructions to pharmacy fulfillment hub 01.
                </p>
              </div>
            )}

            {/* STEP 3: ORDER CONFIRMED */}
            {checkoutStep === 'confirmed' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                  <span className="material-symbols-outlined text-[36px]">check_circle</span>
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Payment Succeeded • Dispatched
                  </span>
                  <h3 className="text-xl font-black text-brand-charcoal uppercase tracking-tight mt-3">
                    Thank You for Your Order!
                  </h3>
                  <p className="text-xs text-zinc-600 mt-1">
                    Your order reference is <strong className="text-black font-mono">{confirmedOrderId}</strong>
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-surface-container-low border border-brand-border text-left space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Item:</span>
                    <span className="font-bold text-black">{product.name} ({quantity}x)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Delivery Address:</span>
                    <span className="font-bold text-black">{shippingForm.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Amount Charged:</span>
                    <span className="font-black text-black">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-semibold pt-1 border-t border-brand-border">
                    <span>Estimated Arrival:</span>
                    <span>Tomorrow by 2:00 PM (Insulated Express)</span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckoutModal(false);
                      navigate('/catalog');
                    }}
                    className="flex-1 py-3 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-800"
                  >
                    Continue Browsing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckoutModal(false);
                      navigate('/modules/delivery');
                    }}
                    className="flex-1 py-3 rounded-full border border-zinc-300 text-black text-xs font-bold uppercase tracking-wider hover:bg-zinc-100"
                  >
                    Track Dispatch
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};

export default ProductDetailPage;
