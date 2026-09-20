import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import InventoryBatchPage from '../InventoryBatchPage';

const InventoryPage = () => {
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
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
          Module 2: Operational
        </span>
      </div>

      {/* Main Inventory Batch Dashboard */}
      <InventoryBatchPage />
    </div>
  );
};

export default InventoryPage;
