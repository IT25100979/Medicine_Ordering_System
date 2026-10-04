import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminDashboardRoute } from '../utils/roleRoutes';

const AdminLoginPage = () => {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const authData = await adminLogin(email, password);
      const destination = getAdminDashboardRoute(authData?.user?.role) || '/admin/catalog';
      navigate(destination);
    } catch (err) {
      console.error('Admin login error', err);
      const msg = err.response?.data?.message || err.message || 'Invalid administrator credentials. Access denied.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen flex flex-col justify-between bg-background">
      <div className="w-full flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
        
        {/* Left 2/3: Administrator & Clinical Operations Showcase */}
        <div className="relative w-full lg:w-2/3 h-64 sm:h-96 lg:h-auto min-h-[300px] lg:min-h-full overflow-hidden bg-gradient-to-br from-slate-950 via-zinc-900 to-black flex flex-col justify-between p-6 sm:p-10 lg:p-16 border-r border-zinc-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-blue-900/20 to-transparent pointer-events-none"></div>

          {/* Top Overlay Badge */}
          <div className="relative z-10 self-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm text-white">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-xs font-bold tracking-tight">PILLS • Operations & Administrative Console</span>
            </div>
          </div>

          {/* Editorial Headline */}
          <div className="relative z-10 max-w-xl text-white">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 backdrop-blur-md mb-4 text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-[15px]">admin_panel_settings</span>
              <span>Restricted Access Control</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm leading-tight">
              Clinical governance and logistics.
            </h2>
            <p className="text-sm sm:text-base text-white/80 mt-3 max-w-md leading-relaxed">
              Administrative oversight for inventory batches, cold-chain compliance, prescription approvals, and delivery dispatch networks.
            </p>
          </div>

          {/* Bottom Security Assurance */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-white/60">
            <span className="material-symbols-outlined text-[16px] text-amber-400">shield</span>
            <span>All administrative sessions are cryptographically signed, audited, and telemetry-recorded.</span>
          </div>
        </div>

        {/* Right 1/3: Focused Administrator Authentication Panel */}
        <div className="w-full lg:w-1/3 bg-white flex flex-col justify-between px-6 sm:px-12 py-10 shadow-xl lg:shadow-none border-l border-brand-border">
          <div className="max-w-md w-full mx-auto flex flex-col my-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-6">
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-black transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Store</span>
              </Link>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">security</span>
                <span>Admin Console</span>
              </span>
            </div>

            <div className="space-y-1 mb-6">
              <h1 className="text-2xl font-black uppercase tracking-tight text-brand-charcoal">
                Administrator Sign In
              </h1>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Provide your administrative credentials to manage pharmacy logistics, clinical workflows, and staff permissions.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
                  <span>{errorMessage}</span>
                </div>
                {(errorMessage.toLowerCase().includes('customer') || errorMessage.toLowerCase().includes('patient')) && (
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1 font-bold text-red-800 hover:text-black underline ml-6"
                  >
                    <span>Click here to open Patient / User Login</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </Link>
                )}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface" htmlFor="admin-email">
                  Admin Email
                </label>
                <div className="relative">
                  <input
                    id="admin-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@mediorder.com"
                    className="w-full h-11 px-4 pr-10 rounded-full bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-black border border-brand-border transition-all"
                  />
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
                    badge
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface" htmlFor="admin-password">
                  Security Key / Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-4 pr-10 rounded-full bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-black border border-brand-border transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 hover:text-black focus:outline-none transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-full bg-zinc-900 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-black active:scale-[0.99] transition-all shadow-md mt-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Verifying Credentials...</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">lock_open</span>
                    <span>Authenticate as Administrator</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-brand-border space-y-3 text-center">
              <p className="text-xs text-on-surface-variant">
                Are you looking for patient services?{' '}
                <Link to="/login" className="font-bold text-black hover:underline inline-flex items-center gap-0.5">
                  <span>Switch to User Login</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              </p>
              <div className="pt-2">
                <span className="text-[11px] text-zinc-400 block">
                  Unauthorized access attempts are prohibited and recorded under healthcare privacy and security standards.
                </span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminLoginPage;
