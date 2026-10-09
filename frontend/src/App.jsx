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
import MyDeliveriesPage from './pages/MyDeliveriesPage';
import SystemAdminConsolePage from './pages/admin/SystemAdminConsolePage';

const DELIVERY_ROLES = ['DELIVERY_COORDINATOR', 'DELIVERY_RIDER', 'ADMIN', 'SYSTEM_ADMIN'];
const STOCK_ROLES = ['OPERATIONS_MANAGER', 'CHIEF_PHARMACIST', 'PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN'];

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
                <ProtectedRoute allowedRoles={['PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN']}>
                  <PharmacistPrescriptionDashboard />
                </ProtectedRoute>
              } />

              <Route path="/admin/prescriptions" element={
                <ProtectedRoute allowedRoles={['PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN']}>
                  <PharmacistPrescriptionDashboard />
                </ProtectedRoute>
              } />

              {/* Customer delivery tracking */}
              <Route path="/my-deliveries" element={
                <ProtectedRoute allowedRoles={['CUSTOMER']} loginPath="/login">
                  <MyDeliveriesPage />
                </ProtectedRoute>
              } />

              {/* Module Routes (every module page requires login; staff modules also check role) */}
              <Route path="/prescription" element={<ProtectedRoute loginPath="/login"><PrescriptionPage /></ProtectedRoute>} />
              <Route path="/modules/prescription" element={<ProtectedRoute loginPath="/login"><PrescriptionPage /></ProtectedRoute>} />
              <Route path="/modules/prescriptions" element={<ProtectedRoute loginPath="/login"><PrescriptionPage /></ProtectedRoute>} />
              <Route path="/modules/inventory" element={
                <ProtectedRoute allowedRoles={STOCK_ROLES}><InventoryPage /></ProtectedRoute>
              } />
              <Route path="/modules/orders" element={<ProtectedRoute><OrderProcessingPage /></ProtectedRoute>} />
              <Route path="/modules/cold-chain" element={
                <ProtectedRoute allowedRoles={STOCK_ROLES}><ColdChainPage /></ProtectedRoute>
              } />
              <Route path="/modules/subscriptions" element={<ProtectedRoute loginPath="/login"><SubscriptionsPage /></ProtectedRoute>} />
              <Route path="/modules/delivery" element={
                <ProtectedRoute allowedRoles={DELIVERY_ROLES}><DeliveryPage /></ProtectedRoute>
              } />
              <Route path="/delivery" element={
                <ProtectedRoute allowedRoles={DELIVERY_ROLES}><DeliveryPage /></ProtectedRoute>
              } />
              <Route path="/admin/delivery" element={
                <ProtectedRoute allowedRoles={DELIVERY_ROLES}><DeliveryPage /></ProtectedRoute>
              } />
            </Routes>
          </main>
        </div>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
