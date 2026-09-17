import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, Trash2 } from 'lucide-react';
import client from '../../api/client';

const DeliveryPage = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [formData, setFormData] = useState({
    userId: '',
    description: '',
    pharmacistId: '',
    deliveryAddress: '',
    coldChainTag: false,
    initialDate: '',
    finalDate: '',
    status: 'PENDING'
  });

  const fetchDeliveries = async () => {
    try {
      const response = await client.get('/api/v1/deliveries');
      setDeliveries(response.data);
    } catch (error) {
      console.error('Error fetching deliveries', error);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...formData };
      if (payload.userId) payload.userId = parseInt(payload.userId);
      if (payload.pharmacistId) payload.pharmacistId = parseInt(payload.pharmacistId);
      
      const response = await client.post('/api/v1/deliveries', payload);
      setDeliveries([...deliveries, response.data]);
      setFormData({
        userId: '',
        description: '',
        pharmacistId: '',
        deliveryAddress: '',
        coldChainTag: false,
        initialDate: '',
        finalDate: '',
        status: 'PENDING'
      });
    } catch (error) {
      console.error('Error publishing delivery', error);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await client.put(`/api/v1/deliveries/${id}/status`, { status });
      setDeliveries(deliveries.map(d => (d.id === id ? response.data : d)));
    } catch (error) {
      console.error('Error updating status', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await client.delete(`/api/v1/deliveries/${id}`);
      setDeliveries(deliveries.filter(d => d.id !== id));
    } catch (error) {
      console.error('Error deleting delivery', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link to="/" className="inline-flex items-center text-teal-600 hover:text-teal-700 mr-4">
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back
        </Link>
        <h1 className="text-3xl font-bold">Delivery Management Dashboard</h1>
      </div>

      <div className="bg-white p-6 rounded shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Create New Delivery</h2>
        <form onSubmit={handlePublish} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">User ID</label>
            <input type="number" name="userId" value={formData.userId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Pharmacist ID</label>
            <input type="number" name="pharmacistId" value={formData.pharmacistId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input type="text" name="description" value={formData.description} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Delivery Address</label>
            <input type="text" name="deliveryAddress" value={formData.deliveryAddress} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Initial Date</label>
            <input type="date" name="initialDate" value={formData.initialDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Final Date</label>
            <input type="date" name="finalDate" value={formData.finalDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
          </div>
          <div className="md:col-span-2 flex items-center">
            <input type="checkbox" name="coldChainTag" checked={formData.coldChainTag} onChange={handleChange} className="h-4 w-4 text-teal-600 border-gray-300 rounded" />
            <label className="ml-2 block text-sm text-gray-900">Requires Cold-Chain Transport</label>
          </div>
          <div className="md:col-span-2 mt-4">
            <button type="submit" className="w-full bg-teal-600 text-white p-2 rounded hover:bg-teal-700 transition font-semibold">
              Publish
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <h2 className="text-xl font-semibold p-6 bg-gray-50 border-b">All Deliveries</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cold-Chain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {deliveries.map((delivery) => (
                <tr key={delivery.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{delivery.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{delivery.userId}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{delivery.deliveryAddress}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>Start: {delivery.initialDate}</div>
                    <div>End: {delivery.finalDate}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {delivery.coldChainTag ? 'Yes' : 'No'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      delivery.status === 'SUCCESSFUL' ? 'bg-green-100 text-green-800' :
                      delivery.status === 'UNSUCCESSFUL' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {delivery.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex items-center space-x-2">
                    <button 
                      onClick={() => updateStatus(delivery.id, 'SUCCESSFUL')}
                      className="text-white bg-green-500 hover:bg-green-600 p-1 rounded"
                      title="Mark Successful"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => updateStatus(delivery.id, 'UNSUCCESSFUL')}
                      className="text-white bg-red-500 hover:bg-red-600 p-1 rounded"
                      title="Mark Unsuccessful"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="flex-grow"></div>
                    <button 
                      onClick={() => handleDelete(delivery.id)}
                      className="text-red-600 hover:text-red-900 ml-4"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
              {deliveries.length === 0 && (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    No deliveries found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DeliveryPage;
