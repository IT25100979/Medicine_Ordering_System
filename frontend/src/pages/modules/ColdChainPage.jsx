import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const ColdChainPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 text-center">
      <h1 className="text-3xl font-bold mb-4">Cold Chain Tagging & Logistics Security</h1>
      <div className="inline-block bg-amber-100 text-amber-800 px-4 py-2 rounded-full font-medium mb-8">
        Module Under Construction - Phase 2
      </div>
      <div>
        <Link to="/" className="inline-flex items-center text-teal-600 hover:text-teal-700">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default ColdChainPage;
