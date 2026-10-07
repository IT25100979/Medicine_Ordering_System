import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaffRole, getAdminDashboardRoute, ADMIN_ROLE_LABELS, ADMIN_WORKSPACE_NAMES } from '../utils/roleRoutes';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isAdmin = isAuthenticated && isStaffRole(user?.role);
  const dashboardRoute = getAdminDashboardRoute(user?.role) || '/admin/catalog';
  const roleLabel = ADMIN_ROLE_LABELS[user?.role] || user?.role || 'Staff';
  const workspaceTitle = ADMIN_WORKSPACE_NAMES[user?.role] || 'Management Console';

  // Only show the dark Admin Topbar when actively viewing Admin Workspace / Inventory pages
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname === '/modules/inventory';

  // -------------------------------------------------------------
  // ADMIN DASHBOARD TOPBAR (Strictly inside Admin Workspace routes)
  // -------------------------------------------------------------
  if (isAdmin && isAdminRoute) {
    return (
      <header className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800 text-white">
        <div className="h-16 max-w-[1536px] mx-auto px-4 md:px-8 flex items-center justify-between">
          
          {/* Left: Brand & Admin Console Identifier */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              title="Visit Storefront / Home"
              className="font-sans text-xl font-black tracking-tight uppercase flex items-center gap-1.5 text-white group"
            >
              <span>PILLS</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 group-hover:scale-125 transition-transform"></span>
            </Link>

            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-extrabold uppercase tracking-widest">
              <span className="material-symbols-outlined text-[12px]">security</span>
              <span>ADMIN CONSOLE</span>
            </span>
          </div>

          {/* Center: Current Workspace Context Indicator */}
          <div className="hidden md:flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              {workspaceTitle}
            </span>
          </div>

          {/* Right: Assigned Dashboard Action, User Pill & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/modules/inventory"
              id="admin-smart-inventory-btn"
              className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-3 py-1.5 rounded-full transition-all border ${
                isActive('/modules/inventory') || isActive('/admin/smart-inventory')
                  ? 'bg-emerald-400 text-black border-emerald-400 shadow-sm font-black'
                  : 'bg-zinc-900 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/20 hover:border-emerald-400'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">inventory_2</span>
              <span>Smart Inventory & FEFO</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </Link>

            <Link
              to={dashboardRoute}
              className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase px-3.5 py-1.5 rounded-full transition-all border ${
                isActive(dashboardRoute)
                  ? 'bg-amber-400 text-black border-amber-400 shadow-sm font-black'
                  : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">space_dashboard</span>
              <span className="hidden sm:inline">My Dashboard</span>
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-zinc-800">
              <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full text-xs font-semibold text-zinc-200">
                <span className="max-w-[120px] truncate">{user?.fullName || 'Admin'}</span>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-full bg-amber-400 text-black font-extrabold">
                  {roleLabel}
                </span>
              </div>

              <button
                onClick={logout}
                title="Log Out of Admin Console"
                className="w-8 h-8 rounded-full bg-zinc-900 hover:bg-red-500/20 hover:text-red-400 text-zinc-400 flex items-center justify-center transition-colors border border-zinc-800"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // -------------------------------------------------------------
  // REGULAR USER / CUSTOMER NAVBAR
  // -------------------------------------------------------------
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
              {isAdmin && (
                <Link
                  to={dashboardRoute}
                  className="inline-flex items-center gap-1.5 bg-black hover:bg-zinc-800 text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-wider uppercase transition-all shadow-sm"
                  title="Go to Admin Dashboard"
                >
                  <span className="material-symbols-outlined text-[15px]">space_dashboard</span>
                  <span className="hidden sm:inline">DASHBOARD</span>
                </Link>
              )}
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
