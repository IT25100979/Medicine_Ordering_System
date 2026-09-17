import React from 'react';
import { Pill, ShoppingBag, Truck, Package } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab }) {
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
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>Order System</span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Medicine Ordering &amp; FEFO Dispatch</span>
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
            <span>Place Order</span>
          </button>

          <button
            onClick={() => setActiveTab('tracking')}
            className={`btn btn-sm ${activeTab === 'tracking' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px', border: 'none' }}
          >
            <Truck size={16} />
            <span>Track Orders</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`btn btn-sm ${activeTab === 'inventory' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '10px', border: 'none' }}
          >
            <Package size={16} />
            <span>Inventory Batches</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
