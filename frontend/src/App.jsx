import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OperationsCatalogDashboard from './pages/OperationsCatalogDashboard';
import PharmacistPrescriptionDashboard from './pages/PharmacistPrescriptionDashboard';

// Module Pages
import PrescriptionPage from './pages/modules/PrescriptionPage';
import InventoryPage from './pages/modules/InventoryPage';
import OrderProcessingPage from './pages/modules/OrderProcessingPage';
import ColdChainPage from './pages/modules/ColdChainPage';
import SubscriptionsPage from './pages/modules/SubscriptionsPage';
import DeliveryPage from './pages/modules/DeliveryPage';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow bg-[#f9f9ff]">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="/catalog/:id" element={<ProductDetailPage />} />
              <Route path="/product/:id" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/admin" element={<AdminLoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              <Route path="/admin/catalog" element={
                <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER']}>
                  <OperationsCatalogDashboard />
                </ProtectedRoute>
              } />

              <Route path="/admin/prescriptions" element={
                <ProtectedRoute allowedRoles={['PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN']}>
                  <PharmacistPrescriptionDashboard />
                </ProtectedRoute>
              } />

              <Route path="/admin/smart-inventory" element={
                <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN']}>
                  <InventoryPage />
                </ProtectedRoute>
              } />
              <Route path="/admin/inventory" element={
                <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN']}>
                  <InventoryPage />
                </ProtectedRoute>
              } />

              {/* Module Routes */}
              <Route path="/prescription" element={<PrescriptionPage />} />
              <Route path="/modules/prescription" element={<PrescriptionPage />} />
              <Route path="/modules/inventory" element={
                <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN']}>
                  <InventoryPage />
                </ProtectedRoute>
              } />
              <Route path="/modules/orders" element={<OrderProcessingPage />} />
              <Route path="/modules/cold-chain" element={<ColdChainPage />} />
              <Route path="/modules/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/modules/delivery" element={<DeliveryPage />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
