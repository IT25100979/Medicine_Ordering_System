export const CLINICAL_ROLES = ['PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN'];
export const PRESCRIPTION_CATALOG = '/catalog?category=Prescription+Medicines';
export const CUSTOMER_PRESCRIPTIONS = '/prescriptions';
export const UPLOAD_PRESCRIPTION = '/prescriptions/new';
export const PHARMACIST_PRESCRIPTIONS = '/pharmacist_dashboard';

export const isClinicalRole = role => CLINICAL_ROLES.includes(role);
