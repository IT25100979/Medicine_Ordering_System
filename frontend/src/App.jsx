import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import CatalogPage from './pages/CatalogPage';
import CartPage from './pages/CartPage';
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
import SystemAdminConsolePage from './pages/admin/SystemAdminConsolePage';

const App = () => {
  return (
    <AuthProvider>
      <CartProvider>
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
              <Route path="/cart" element={<CartPage />} />
              <Route path="/offers" element={<CatalogPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/login/admin" element={<AdminLoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/account" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              <Route path="/admin/system" element={
                <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN', 'IT_MANAGER', 'OPERATIONS_MANAGER']}>
                  <SystemAdminConsolePage />
                </ProtectedRoute>
              } />
              <Route path="/admin/console" element={
                <ProtectedRoute allowedRoles={['SYSTEM_ADMIN', 'ADMIN', 'IT_MANAGER', 'OPERATIONS_MANAGER']}>
                  <SystemAdminConsolePage />
                </ProtectedRoute>
              } />

              <Route path="/admin/catalog" element={
                <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'ADMIN']}>
                  <OperationsCatalogDashboard initialTab="catalog" />
                </ProtectedRoute>
              } />

              <Route path="/admin/stocks" element={
                <ProtectedRoute allowedRoles={['OPERATIONS_MANAGER', 'ADMIN']}>
                  <OperationsCatalogDashboard initialTab="stocks" />
                </ProtectedRoute>
              } />

              <Route path="/pharmacist_dashboard" element={
                <ProtectedRoute allowedRoles={['PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN']}>
                  <PharmacistPrescriptionDashboard />
                </ProtectedRoute>
              } />

              <Route path="/admin/prescriptions" element={
                <ProtectedRoute allowedRoles={['PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN']}>
                  <PharmacistPrescriptionDashboard />
                </ProtectedRoute>
              } />

              {/* Module Routes */}
              <Route path="/prescription" element={<PrescriptionPage />} />
              <Route path="/modules/prescription" element={<PrescriptionPage />} />
              <Route path="/modules/prescriptions" element={<PrescriptionPage />} />
              <Route path="/modules/inventory" element={<InventoryPage />} />
              <Route path="/modules/orders" element={<OrderProcessingPage />} />
              <Route path="/modules/cold-chain" element={<ColdChainPage />} />
              <Route path="/modules/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/modules/delivery" element={<DeliveryPage />} />
              <Route path="/delivery" element={<DeliveryPage />} />
              <Route path="/admin/delivery" element={<DeliveryPage />} />
            </Routes>
          </main>
        </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
