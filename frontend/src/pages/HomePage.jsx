import React from 'react';
import { Link } from 'react-router-dom';
import { 
  FileCheck2, 
  Boxes, 
  Activity, 
  ThermometerSnowflake, 
  RefreshCw, 
  Truck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const coreModules = [
  {
    name: '1. Prescription Test',
    path: '/modules/prescription',
    icon: FileCheck2,
  },
  {
    name: '2. Inventory & Expiry Management',
    path: '/modules/inventory',
    icon: Boxes,
  },
  {
    name: '3. Real-Time Order Processing',
    path: '/modules/orders',
    icon: Activity,
  },
  {
    name: '4. Cold Chain Tagging & Logistics Security',
    path: '/modules/cold-chain',
    icon: ThermometerSnowflake,
  },
  {
    name: '5. Automatic Medicine Refill & Subscription Management',
    path: '/modules/subscriptions',
    icon: RefreshCw,
  },
  {
    name: '6. Delivery Management & Notification Engine',
    path: '/modules/delivery',
    icon: Truck,
  },
];

const HomePage = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
          Welcome to Online Pharmacy
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          {isAuthenticated && user 
            ? `Hello, ${user.fullName}! Select a module below to proceed.` 
            : 'Select any of the 6 core operational modules below to test our infrastructure.'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coreModules.map((module, idx) => {
          const Icon = module.icon;
          return (
            <Link
              key={idx}
              to={module.path}
              className="group flex flex-col p-6 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-teal-500 transition-all duration-200"
            >
              <div className="mb-4">
                <div className="inline-flex p-3 rounded-lg bg-teal-50 text-teal-600 group-hover:bg-teal-100 transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                {module.name}
              </h2>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default HomePage;
