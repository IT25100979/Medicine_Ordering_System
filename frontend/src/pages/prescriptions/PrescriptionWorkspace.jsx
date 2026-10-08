/**
 * PrescriptionWorkspace — Facade router component for prescription workspace views
 * IT25101923
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import CustomerPrescriptionsPage from './CustomerPrescriptionsPage';
import UploadPrescriptionPage from './UploadPrescriptionPage';
import PharmacistDashboardPage from './PharmacistDashboardPage';

export default function PrescriptionWorkspace({ isStaff = false, mode }) {
  const location = useLocation();

  if (isStaff || mode === 'staff') {
    return <PharmacistDashboardPage />;
  }

  if (location.pathname === '/prescriptions/new') {
    return <UploadPrescriptionPage />;
  }

  return <CustomerPrescriptionsPage />;
}
