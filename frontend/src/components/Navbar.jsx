import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Activity, Pill, Package, ShoppingBag } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated, user } = useAuth();
  const [healthStatus, setHealthStatus] = useState('Checking...');
  const location = useLocation();

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await client.get('/api/v1/health');
        if (response.data?.status === 'UP' || response.data?.data?.status === 'UP') {
          setHealthStatus('Online');
        } else {
          setHealthStatus('Offline');
        }
      } catch (error) {
        // Fallback check to /api/health
        try {
          const fb = await client.get('/api/health');
          if (fb.data?.status === 'UP' || fb.data?.data?.status === 'UP') {
            setHealthStatus('Online');
          } else {
            setHealthStatus('Offline');
          }
        } catch (e) {
          setHealthStatus('Offline');
        }
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const isCurrent = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left: Brand & Health Status */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="p-2 bg-gradient-to-tr from-teal-600 to-emerald-500 rounded-xl text-white shadow-md group-hover:scale-105 transition-transform">
                <Pill className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                  MediOrder
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                    Pharmacy
                  </span>
                </span>
              </div>
            </Link>

            {/* Live System Health Badge */}
            <div className="flex items-center">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  healthStatus === 'Online'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <Activity className={`w-3 h-3 mr-1.5 ${healthStatus === 'Online' ? 'text-emerald-500 animate-pulse' : 'text-red-500'}`} />
                System: {healthStatus}
              </span>
            </div>
          </div>

          {/* Center/Quick module navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link
              to="/modules/orders"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isCurrent('/modules/orders')
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Order Processing
            </Link>
            <Link
              to="/modules/inventory"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isCurrent('/modules/inventory')
                  ? 'bg-teal-50 text-teal-700 font-semibold'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Package className="w-4 h-4" />
              Inventory &amp; Batches
            </Link>
          </div>

          {/* Right: Auth links */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="flex items-center gap-2 text-gray-700 hover:text-teal-700 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 hover:border-teal-300 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold">
                  {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span>{user?.fullName || 'Profile'}</span>
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-teal-600 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
