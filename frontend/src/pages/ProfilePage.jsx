import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow border border-gray-200 p-8">
        <h2 className="text-2xl font-bold mb-6 border-b pb-4">Profile Information</h2>
        
        <div className="space-y-4 mb-8">
          <div>
            <span className="block text-sm text-gray-500 font-medium">Full Name</span>
            <span className="text-lg text-gray-900">{user?.fullName || 'N/A'}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500 font-medium">Email</span>
            <span className="text-lg text-gray-900">{user?.email || 'N/A'}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500 font-medium">Role</span>
            <span className="inline-block bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded mt-1">
              {user?.role || 'CUSTOMER'}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 px-6 py-2 rounded-md transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
