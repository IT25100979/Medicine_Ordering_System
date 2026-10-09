/**
 * Fallback photos per category (used when a product has no image of its own).
 * All photos are freely licensed; see public/products/CREDITS.md.
 */
export const CLINICAL_FALLBACK_IMAGES = {
  'Prescription Medicines': '/products/amoxil.jpg',
  'Daily Health & Wellness': '/products/paracetamol-tablets.jpg',
  'Vitamins & Nutritional Supplements': '/products/sevenseas.jpg',
  'First Aid & Health Care': '/products/hansaplast.jpg',
  'First Aid & Wound Care': '/products/hansaplast.jpg',
  'Home Health & medical Care': '/products/omron.jpg',
  'Home Health & Medical Care': '/products/omron.jpg',
  General: '/products/paracetamol-tablets.jpg',
};

// Older catalogue rows and saved carts may still point at the drawn /products/*.svg pictures.
const upgradeLegacy = (url) => (url ? url.replace(/^\/products\/([a-z-]+)\.svg$/, '/products/$1.jpg') : url);

export const productImage = (product) =>
  upgradeLegacy(product?.imageUrl) || CLINICAL_FALLBACK_IMAGES[product?.category] || CLINICAL_FALLBACK_IMAGES.General;
