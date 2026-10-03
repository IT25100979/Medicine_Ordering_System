import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-brand-border/60">
      <div className="h-20 max-w-[1280px] mx-auto px-4 md:px-8 flex items-center justify-between">
        {/* Left Nav Links */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            to="/"
            className={`text-xs font-bold tracking-wider uppercase transition-colors px-3 py-1.5 rounded-full ${
              isActive('/') && location.pathname === '/'
                ? 'bg-black text-white'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            HOME
          </Link>
          <Link
            to="/modules/prescription"
            className={`text-xs font-bold tracking-wider uppercase transition-colors px-3 py-1.5 rounded-full ${
              isActive('/modules/prescription')
                ? 'bg-black text-white'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            REQUEST ORDER
          </Link>
          <Link
            to="/catalog"
            className={`text-xs font-bold tracking-wider uppercase transition-colors px-3 py-1.5 rounded-full ${
              isActive('/catalog')
                ? 'bg-black text-white'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            CATALOG
          </Link>
          <Link
            to="/modules/delivery"
            className={`hidden md:inline-block text-xs font-bold tracking-wider uppercase transition-colors px-3 py-1.5 rounded-full ${
              isActive('/modules/delivery')
                ? 'bg-black text-white'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            DELIVERY
          </Link>
        </nav>

        {/* Center Brand Logo */}
        <div className="flex items-center justify-center">
          <Link
            to="/"
            className="font-sans text-2xl md:text-3xl font-extrabold tracking-tight text-on-surface uppercase flex items-center group"
          >
            <span>PILLS</span>
            <span className="inline-block w-2 h-2 rounded-full bg-black ml-0.5 group-hover:bg-secondary-container transition-colors"></span>
          </Link>
        </div>

        {/* Right User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            to="/catalog"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase text-on-surface-variant hover:text-on-surface px-2 py-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">search</span>
            <span>SEARCH</span>
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 bg-surface-container-low hover:bg-surface-container px-3 py-1.5 rounded-full text-xs font-bold text-on-surface transition-all border border-brand-border"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="max-w-[100px] truncate">{user?.fullName || 'Account'}</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full bg-black text-white font-semibold">
                  {user?.role || 'CUSTOMER'}
                </span>
              </Link>
              <button
                onClick={logout}
                title="Log Out"
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-red-50 hover:text-red-600 text-on-surface-variant flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                to="/login"
                className={`text-xs font-bold tracking-wider uppercase transition-colors px-3 py-1.5 rounded-full ${
                  location.pathname === '/login'
                    ? 'bg-black text-white'
                    : 'text-on-surface hover:text-black'
                }`}
              >
                LOGIN
              </Link>
              <Link
                to="/login/admin"
                title="Administrator Portal"
                className={`inline-flex items-center gap-1 text-xs font-bold tracking-wider uppercase transition-colors px-2.5 py-1.5 rounded-full border border-brand-border ${
                  location.pathname === '/login/admin'
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'text-on-surface-variant hover:text-black hover:border-black bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[14px] text-amber-600">shield</span>
                <span>ADMIN</span>
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center bg-black hover:bg-zinc-800 text-white text-xs font-bold tracking-wider uppercase px-4 py-2 rounded-full transition-all shadow-sm"
              >
                REGISTER
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
