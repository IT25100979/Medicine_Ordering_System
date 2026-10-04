/**
 * Centralized Role-to-Dashboard Routing Configuration
 * Ensures every administrative role is strictly isolated to their relevant dashboard,
 * and future admin roles can be registered in a single place.
 */

export const ADMIN_DASHBOARD_ROUTES = {
  OPERATIONS_MANAGER: '/admin/catalog',
  PHARMACIST: '/admin/prescriptions',
  CHIEF_PHARMACIST: '/admin/prescriptions',
  DELIVERY_COORDINATOR: '/modules/delivery',
  DELIVERY_RIDER: '/modules/delivery',
  ADMIN: '/admin/catalog',
  FINANCE_MANAGER: '/admin/catalog',
};

export const ADMIN_ROLE_LABELS = {
  OPERATIONS_MANAGER: 'Operations Manager',
  PHARMACIST: 'Clinical Pharmacist',
  CHIEF_PHARMACIST: 'Chief Pharmacist',
  DELIVERY_COORDINATOR: 'Delivery Coordinator',
  DELIVERY_RIDER: 'Fleet Courier',
  ADMIN: 'System Administrator',
  FINANCE_MANAGER: 'Finance Manager',
};

export const ADMIN_WORKSPACE_NAMES = {
  OPERATIONS_MANAGER: 'Catalog & Inventory Operations',
  PHARMACIST: 'Prescription Verification Queue',
  CHIEF_PHARMACIST: 'Prescription Review & Compliance',
  DELIVERY_COORDINATOR: 'Fleet Dispatch & Delivery Tracking',
  DELIVERY_RIDER: 'Courier Logistics Hub',
  ADMIN: 'Master Administrative Console',
  FINANCE_MANAGER: 'Financial Ledger & Pricing Operations',
};

/**
 * Returns true if the given role is considered an administrative/staff role.
 */
export const isStaffRole = (role) => {
  return Boolean(role && role !== 'CUSTOMER' && ADMIN_DASHBOARD_ROUTES[role]);
};

/**
 * Returns the designated dashboard path for the given role.
 */
export const getAdminDashboardRoute = (role) => {
  if (!role || role === 'CUSTOMER') return null;
  return ADMIN_DASHBOARD_ROUTES[role] || '/admin/catalog';
};
