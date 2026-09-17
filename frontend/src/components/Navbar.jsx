import React from 'react';
import { Pill, ShoppingBag, Truck, ShieldAlert, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, currentRole, setCurrentRole }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border-glass)',
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div className="container" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => setActiveTab('order')}>
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            padding: '10px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.35)'
          }}>
            <Pill size={22} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>MediOrder</span>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>FEFO v1.0</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SE2030 Software Engineering</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', gap: '8px', background: 'rgba(15, 23, 42, 0.6)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
          <button
            onClick={() => setActiveTab('order')}
            className={`btn btn-sm ${activeTab === 'order' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px', border: 'none' }}
          >
            <ShoppingBag size={16} />
            <span>Order Medicine</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`btn btn-sm ${activeTab === 'tracking' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px', border: 'none' }}
          >
            <Truck size={16} />
            <span>Order Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`btn btn-sm ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px', border: 'none' }}
          >
            <ShieldAlert size={16} />
            <span>FEFO & Batches</span>
          </button>
        </nav>

        {/* User Role Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Role:</span>
            <select
              value={currentRole}
              onChange={(e) => setCurrentRole(e.target.value)}
              style={{
                background: 'rgba(30, 41, 59, 0.8)',
                color: '#ffffff',
                border: '1px solid var(--border-glass-bright)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                cursor: 'pointer',
                outline: 'none'
              }}
            >
              <option value="customer">Patient / Customer</option>
              <option value="assistant">Pharmacy Assistant (FEFO)</option>
              <option value="pharmacist">Licensed Pharmacist</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
