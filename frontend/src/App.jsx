import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';

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
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Protected Routes */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Core Operational Modules */}
              <Route path="/modules/prescription" element={<PrescriptionPage />} />
              <Route path="/modules/inventory" element={<InventoryPage />} />
              <Route path="/modules/orders" element={<OrderProcessingPage />} />
              <Route path="/modules/cold-chain" element={<ColdChainPage />} />
              <Route path="/modules/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/modules/delivery" element={<DeliveryPage />} />
            </Routes>
          </main>

          <footer className="border-t border-gray-200 bg-white py-6 text-center text-xs text-gray-500">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-2">
              <div>
                MediOrder — Online Pharmacy &amp; Medicine Ordering System
              </div>
              <div>
                Order Management &amp; FEFO (First-Expired-First-Out) Engine
              </div>
            </div>
          </footer>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
