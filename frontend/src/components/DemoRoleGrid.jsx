import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAdminDashboardRoute } from '../utils/roleRoutes';

const DEMO_ROLES = [
  {
    role: 'CUSTOMER',
    name: 'John Doe',
    title: 'Customer / Patient',
    icon: 'person',
    badge: 'Storefront',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
    dest: '/catalog',
    desc: 'Browse catalog, upload Rx, place OTC orders, track delivery'
  },
  {
    role: 'CHIEF_PHARMACIST',
    name: 'Dr. Silva',
    title: 'Chief Pharmacist',
    icon: 'medical_services',
    badge: 'Clinical Rx',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    dest: '/pharmacist_dashboard',
    desc: 'Prescription review, drug interaction checks, dosage validation'
  },
  {
    role: 'OPERATIONS_MANAGER',
    name: 'Elena Rostova',
    title: 'Operations Manager',
    icon: 'inventory_2',
    badge: 'Inventory & Cold Chain',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
    dest: '/admin/catalog',
    desc: 'Stock intake, FEFO batches, cold chain 5-tier classification'
  },
  {
    role: 'DELIVERY_COORDINATOR',
    name: 'Kamal Perera',
    title: 'Delivery Coordinator',
    icon: 'local_shipping',
    badge: 'Dispatch Logistics',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
    dest: '/modules/delivery',
    desc: 'Zone routing, batch dispatch, courier assignments & holds'
  },
  {
    role: 'DELIVERY_RIDER',
    name: 'Sunil Express',
    title: 'Fleet Courier Rider',
    icon: 'two_wheeler',
    badge: 'Courier Mobile',
    badgeColor: 'bg-teal-100 text-teal-800 border-teal-200',
    dest: '/modules/delivery',
    desc: 'Assigned deliveries, OTP verification at doorstep, delivery proof'
  },
  {
    role: 'FINANCE_MANAGER',
    name: 'Anura Kumara',
    title: 'Finance Manager',
    icon: 'payments',
    badge: 'Financial Ledger',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    dest: '/admin/catalog',
    desc: 'Settlements, prescription billing audit, subscription billing'
  },
  {
    role: 'IT_MANAGER',
    name: 'DevOps IT Lead',
    title: 'IT Systems Manager',
    icon: 'dns',
    badge: 'Telemetry & Logs',
    badgeColor: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    dest: '/admin/system',
    desc: 'Error telemetry, audit trail, server health & SSE monitoring'
  },
  {
    role: 'SYSTEM_ADMIN',
    name: 'Master Admin',
    title: 'Master System Admin',
    icon: 'admin_panel_settings',
    badge: 'Full Governance',
    badgeColor: 'bg-rose-100 text-rose-800 border-rose-200',
    dest: '/admin/system',
    desc: '10 master control modules, kill switches, RBAC user provisioning'
  }
];

const DemoRoleGrid = ({ onSelectRole }) => {
  const { demoLogin } = useAuth();
  const navigate = useNavigate();
  const [activeLoadingRole, setActiveLoadingRole] = useState(null);
  const [error, setError] = useState('');

  const handleDemoClick = async (item) => {
    setError('');
    setActiveLoadingRole(item.role);
    try {
      const authData = await demoLogin(item.role);
      if (onSelectRole) {
        onSelectRole(authData);
      }
      const destination = item.dest || getAdminDashboardRoute(item.role) || '/';
      navigate(destination);
    } catch (err) {
      console.error('Demo login error', err);
      setError('Failed to login as demo role: ' + (err.message || 'Unknown error'));
    } finally {
      setActiveLoadingRole(null);
    }
  };

  return (
    <div className="w-full bg-surface-container-low border border-brand-border rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500 text-[20px]">bolt</span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
              1-Click Demo Access
            </h3>
            <p className="text-[11px] text-on-surface-variant">
              Instant login as any of the 8 canonical system roles for evaluation and testing.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
          8 Roles Ready
        </span>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {DEMO_ROLES.map((item) => {
          const isLoading = activeLoadingRole === item.role;
          return (
            <button
              key={item.role}
              type="button"
              disabled={isLoading}
              onClick={() => handleDemoClick(item)}
              className="text-left p-3 rounded-xl bg-white border border-brand-border hover:border-black hover:shadow-md transition-all group relative flex flex-col justify-between min-h-[95px] disabled:opacity-50"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-on-surface group-hover:text-black transition-colors">
                      {item.icon}
                    </span>
                    <span className="text-[11px] font-bold text-brand-charcoal truncate max-w-[110px]">
                      {item.name}
                    </span>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                </div>
                <div className="text-[10px] font-semibold text-on-surface-variant truncate">
                  {item.title}
                </div>
                <div className="text-[9px] text-on-surface-variant/70 line-clamp-1 mt-0.5">
                  {item.desc}
                </div>
              </div>

              <div className="mt-2 pt-1 border-t border-brand-border/60 flex items-center justify-between text-[10px] font-bold text-black group-hover:text-primary transition-colors">
                <span>{isLoading ? 'Authenticating...' : 'Enter as ' + item.role.split('_')[0]}</span>
                <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DemoRoleGrid;
