import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ADMIN_ROLE_LABELS } from '../utils/roleRoutes';

/**
 * Guards a route by login state and (optionally) role.
 * `loginPath` lets customer pages send guests to the customer login instead of the staff portal.
 */
const ProtectedRoute = ({ children, allowedRoles, loginPath = '/login/admin' }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    const target = loginPath === '/login' ? `/login?redirect=${redirect}` : loginPath;
    return <Navigate to={target} state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f9f9ff] px-4 pt-16">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 mx-auto flex items-center justify-center">
            <span className="material-symbols-outlined text-[32px]">lock</span>
          </div>
          <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Access Restricted</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            This page is restricted to:{' '}
            <strong>{allowedRoles.map((r) => ADMIN_ROLE_LABELS[r] || r).join(', ')}</strong>.
          </p>
          <div className="bg-gray-50 p-3 rounded-2xl border text-xs text-gray-500">
            Current Authenticated Role: <span className="font-bold text-black uppercase">{user?.role || 'None'}</span>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <Link
              to="/profile"
              className="w-full py-2.5 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors"
            >
              Return to Profile
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 rounded-full border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
