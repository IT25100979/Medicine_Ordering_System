import React, { useState } from 'react';
import Navbar from './components/Navbar';
import OrderPlacementPage from './pages/OrderPlacementPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import InventoryBatchPage from './pages/InventoryBatchPage';

export default function App() {
  const [activeTab, setActiveTab] = useState('order');
  const [currentRole, setCurrentRole] = useState('assistant');
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState(null);

  const handleOrderPlaced = (newOrder) => {
    setSelectedOrderForTracking(newOrder);
    setActiveTab('tracking');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
      />

      <main className="container" style={{ flex: 1 }}>
        {activeTab === 'order' && (
          <OrderPlacementPage onOrderPlaced={handleOrderPlaced} />
        )}

        {activeTab === 'tracking' && (
          <OrderTrackingPage
            initialOrder={selectedOrderForTracking}
            currentRole={currentRole}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryBatchPage />
        )}
      </main>

      <footer style={{ borderTop: '1px solid var(--border-glass)', padding: '24px 0', background: 'rgba(9, 13, 22, 0.95)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <div className="container" style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            MediOrder — SE2030 Software Engineering | SLIIT IT25102867
          </div>
          <div>
            Order Management &amp; FEFO (First-Expired-First-Out) Engine
          </div>
        </div>
      </footer>
    </div>
  );
}
