import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Activity } from 'lucide-react';

const Navbar = () => {
  const { isAuthenticated } = useAuth();
  const [healthStatus, setHealthStatus] = useState('Checking...');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await client.get('/api/v1/health');
        if (response.data?.data?.status === 'UP') {
          setHealthStatus('Online');
        } else {
          setHealthStatus('Offline');
        }
      } catch (error) {
        setHealthStatus('Offline');
      }
    };
    checkHealth();
  }, []);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-xl font-bold text-teal-600">Online Pharmacy</span>
            </Link>
            
            <div className="ml-6 flex items-center">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                healthStatus === 'Online' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <Activity className="w-3 h-3 mr-1" />
                System: {healthStatus}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Link
                to="/profile"
                className="text-gray-700 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Profile
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-teal-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-teal-600 text-white hover:bg-teal-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
