import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await register(fullName, email, password, role, phoneNumber);
      navigate('/');
    } catch (err) {
      console.error('Registration error', err);
      const msg = err.response?.data?.message || err.message || 'Registration failed. Please check your details and try again.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 min-h-screen flex flex-col justify-between bg-background">
      <div className="w-full flex flex-col lg:flex-row min-h-[calc(100vh-5rem)]">
        
        {/* Left 2/3: Clinical Visual Showcase */}
        <div className="relative w-full lg:w-2/3 h-64 sm:h-96 lg:h-auto min-h-[300px] lg:min-h-full overflow-hidden bg-gradient-to-br from-slate-900 via-brand-charcoal to-black flex flex-col justify-between p-6 sm:p-10 lg:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-emerald-950/40 via-transparent to-transparent pointer-events-none"></div>

          {/* Top Overlay Badge */}
          <div className="relative z-10 self-start">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 shadow-sm text-white">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold tracking-tight">PILLS • Care Portal Onboarding</span>
            </div>
          </div>

          {/* Editorial Headline */}
          <div className="relative z-10 max-w-xl text-white">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md mb-4 text-xs font-bold text-white uppercase tracking-wider">
              <span className="material-symbols-outlined text-[15px]">medical_services</span>
              <span>Next-Gen Pharmacy Automation</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white drop-shadow-sm leading-tight">
              Clinical precision at your fingertips.
            </h2>
            <p className="text-sm sm:text-base text-white/80 mt-3 max-w-md leading-relaxed">
              Join thousands of patients and clinical specialists managing certified drug distribution, real-time prescription verification, and refrigerated transit.
            </p>
          </div>
        </div>

        {/* Right 1/3: Focused Patient Registration Panel */}
        <div className="w-full lg:w-1/3 bg-white flex flex-col justify-between px-6 sm:px-12 py-10 shadow-xl lg:shadow-none border-l border-brand-border">
          <div className="max-w-md w-full mx-auto flex flex-col my-auto">
            
            {/* Header Navigation */}
            <div className="flex items-center justify-between pb-4">
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-on-surface-variant hover:text-black transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Back to Store</span>
              </Link>
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
            </div>

            <div className="space-y-1 mb-5">
              <div className="flex items-center gap-1.5 text-black">
                <span className="text-lg font-black tracking-tighter">PILLS</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-container"></span>
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-brand-charcoal">
                Create your account
              </h2>
              <p className="text-xs text-on-surface-variant">
                Join PILLS for streamlined prescription delivery and licensed pharmacist support.
              </p>
            </div>

            {/* Error Feedback */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] shrink-0 text-red-600">error</span>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Full Legal Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface" htmlFor="fullName">
                  Full Legal Name
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
                    person
                  </span>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Eleanor Vance"
                    className="w-full h-11 pl-10 pr-4 rounded-full bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-black border border-brand-border transition-all"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface" htmlFor="regEmail">
                  Email Address
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
                    mail
                  </span>
                  <input
                    id="regEmail"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="eleanor@example.com"
                    className="w-full h-11 pl-10 pr-4 rounded-full bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-black border border-brand-border transition-all"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface" htmlFor="phone">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
                    smartphone
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full h-11 pl-10 pr-4 rounded-full bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-black border border-brand-border transition-all"
                  />
                </div>
              </div>

              {/* Role Picker */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface">
                  Account Role
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['CUSTOMER', 'PHARMACIST', 'ADMIN'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`h-9 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                        role === r
                          ? 'bg-black text-white border-black'
                          : 'bg-surface-container-low text-on-surface border-brand-border hover:bg-surface-container'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface" htmlFor="regPassword">
                  Password
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px] pointer-events-none">
                    lock
                  </span>
                  <input
                    id="regPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full h-11 pl-10 pr-10 rounded-full bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-black border border-brand-border transition-all"
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
                className="w-full h-11 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-[0.99] transition-all shadow-md mt-4 disabled:opacity-50"
              >
                {loading ? (
                  <span>Registering...</span>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-brand-border text-center">
              <p className="text-xs text-on-surface-variant">
                Already registered?{' '}
                <Link to="/login" className="font-bold text-black hover:underline">
                  Sign In
                </Link>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RegisterPage;
