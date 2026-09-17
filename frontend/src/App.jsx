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
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />

              {/* Module Routes */}
              <Route path="/modules/prescription" element={<PrescriptionPage />} />
              <Route path="/modules/inventory" element={<InventoryPage />} />
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
