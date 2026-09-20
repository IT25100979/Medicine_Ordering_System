import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingBag, Truck } from 'lucide-react';
import OrderPlacementPage from '../OrderPlacementPage';
import OrderTrackingPage from '../OrderTrackingPage';

const OrderProcessingPage = () => {
  const [activeTab, setActiveTab] = useState('place');
  const [trackingOrder, setTrackingOrder] = useState(null);

  const handleOrderPlaced = (newOrder) => {
    setTrackingOrder(newOrder);
    setActiveTab('track');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
            Module 3: Operational
          </span>
        </div>
      </div>

      {/* Subnavigation Tabs */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 rounded-xl bg-gray-100 border border-gray-200">
          <button
            onClick={() => setActiveTab('place')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'place'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Place New Order
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'track'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            Track &amp; Manage Orders
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div>
        {activeTab === 'place' ? (
          <OrderPlacementPage onOrderPlaced={handleOrderPlaced} />
        ) : (
          <OrderTrackingPage initialOrder={trackingOrder} />
        )}
      </div>
    </div>
  );
};

export default OrderProcessingPage;
