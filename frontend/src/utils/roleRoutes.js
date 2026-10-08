/**
 * Centralized Role-to-Dashboard Routing Configuration
 * Covers all 8 canonical roles in the system.
 */

export const ADMIN_DASHBOARD_ROUTES = {
  OPERATIONS_MANAGER: '/admin/catalog',
  PHARMACIST: '/pharmacist_dashboard',
  CHIEF_PHARMACIST: '/pharmacist_dashboard',
  DELIVERY_COORDINATOR: '/modules/delivery',
  DELIVERY_RIDER: '/modules/delivery',
  FINANCE_MANAGER: '/admin/catalog',
  IT_MANAGER: '/admin/system',
  SYSTEM_ADMIN: '/admin/system',
  ADMIN: '/admin/system',
};

export const ADMIN_ROLE_LABELS = {
  CUSTOMER: 'Verified Patient',
  OPERATIONS_MANAGER: 'Operations Manager',
  PHARMACIST: 'Clinical Pharmacist',
  CHIEF_PHARMACIST: 'Chief Pharmacist',
  DELIVERY_COORDINATOR: 'Delivery Coordinator',
  DELIVERY_RIDER: 'Fleet Courier',
  FINANCE_MANAGER: 'Finance Manager',
  IT_MANAGER: 'IT Systems Manager',
  SYSTEM_ADMIN: 'Master System Admin',
  ADMIN: 'System Administrator',
};

export const ADMIN_WORKSPACE_NAMES = {
  CUSTOMER: 'Patient Portal',
  OPERATIONS_MANAGER: 'Catalog & Inventory Operations',
  PHARMACIST: 'Prescription Verification Queue',
  CHIEF_PHARMACIST: 'Prescription Review & Compliance',
  DELIVERY_COORDINATOR: 'Fleet Dispatch & Delivery Tracking',
  DELIVERY_RIDER: 'Courier Logistics Hub',
  FINANCE_MANAGER: 'Financial Ledger & Pricing Operations',
  IT_MANAGER: 'System Architecture & Telemetry Hub',
  SYSTEM_ADMIN: 'Master Administrative Console',
  ADMIN: 'Master Administrative Console',
};

/**
 * Returns true if the given role is considered an administrative/staff role.
 */
export const isStaffRole = (role) => {
  return Boolean(role && role !== 'CUSTOMER' && (ADMIN_DASHBOARD_ROUTES[role] || role.includes('ADMIN') || role.includes('MANAGER') || role.includes('PHARMACIST') || role.includes('COORDINATOR') || role.includes('RIDER')));
};

/**
 * Returns the designated landing path for any given role.
 */
export const getAdminDashboardRoute = (role) => {
  if (!role || role === 'CUSTOMER') return '/';
  return ADMIN_DASHBOARD_ROUTES[role] || '/admin/system';
};
