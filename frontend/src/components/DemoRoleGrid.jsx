import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminDashboardRoute } from '../utils/roleRoutes';

export const DEMO_ROLES = [
  {
    role: 'CUSTOMER',
    title: 'Customer',
    email: 'customer1@gmail.com',
    dest: '/catalog',
  },
  {
    role: 'SYSTEM_ADMIN',
    title: 'System Admin',
    email: 'systemadmin1@gmail.com',
    dest: '/admin/system',
  },
  {
    role: 'CHIEF_PHARMACIST',
    title: 'Pharmacist',
    email: 'pharmacist1@gmail.com',
    dest: '/pharmacist_dashboard',
  },
  {
    role: 'OPERATIONS_MANAGER',
    title: 'Operations Manager',
    email: 'operationsmanager1@gmail.com',
    dest: '/admin/catalog',
  },
  {
    role: 'DELIVERY_COORDINATOR',
    title: 'Delivery Coordinator',
    email: 'deliverycoordinator1@gmail.com',
    dest: '/modules/delivery',
  },
];

const DemoRoleGrid = ({ onSelectRole }) => {
  const { login, adminLogin, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [activeLoadingRole, setActiveLoadingRole] = useState(null);
  const [error, setError] = useState('');

  const handleRoleLogin = async (item) => {
    setError('');
    setActiveLoadingRole(item.role);
    try {
      let authData;
      if (item.role === 'CUSTOMER') {
        try {
          authData = await login(item.email, 'admin123');
        } catch {
          authData = await demoLogin('CUSTOMER');
        }
      } else {
        try {
          authData = await adminLogin(item.email, 'admin123');
        } catch {
          authData = await demoLogin(item.role);
        }
      }

      if (onSelectRole) {
        onSelectRole(authData);
      }
      const destination = item.dest || getAdminDashboardRoute(item.role) || '/';
      navigate(destination);
    } catch (err) {
      console.error('Role login error', err);
      setError('Failed to sign in as ' + item.title + ': ' + (err.message || 'Unknown error'));
    } finally {
      setActiveLoadingRole(null);
    }
  };

  return (
    <div className="w-full space-y-2">
      {error && (
        <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2 justify-center">
        {DEMO_ROLES.map((item) => {
          const isLoading = activeLoadingRole === item.role;
          return (
            <button
              key={item.role}
              type="button"
              disabled={isLoading}
              onClick={() => handleRoleLogin(item)}
              className="flex-1 min-w-[120px] px-3.5 py-2.5 rounded-xl bg-neutral-100 hover:bg-black text-neutral-800 hover:text-white border border-neutral-300 hover:border-black text-xs font-bold transition-all text-center cursor-pointer disabled:opacity-50 active:scale-95 shadow-2xs"
            >
              <span>{isLoading ? 'Signing in...' : item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DemoRoleGrid;
