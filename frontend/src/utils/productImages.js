/** Local fallback pictures per category (used when a product has no image of its own). */
export const CLINICAL_FALLBACK_IMAGES = {
  'Prescription Medicines': '/products/category-prescription.svg',
  'Daily Health & Wellness': '/products/category-wellness.svg',
  'Vitamins & Nutritional Supplements': '/products/category-vitamins.svg',
  'First Aid & Health Care': '/products/category-firstaid.svg',
  'First Aid & Wound Care': '/products/category-firstaid.svg',
  'Home Health & medical Care': '/products/category-homehealth.svg',
  'Home Health & Medical Care': '/products/category-homehealth.svg',
  General: '/products/category-general.svg',
};

export const productImage = (product) =>
  product?.imageUrl || CLINICAL_FALLBACK_IMAGES[product?.category] || CLINICAL_FALLBACK_IMAGES.General;
