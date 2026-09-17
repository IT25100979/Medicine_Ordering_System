import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CUSTOMER');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(fullName, email, password, role, phoneNumber);
      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.message ||
        (typeof err.response?.data?.data === 'object'
          ? Object.values(err.response.data.data).join(', ')
          : 'Registration failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow border border-gray-100">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Create Account</h2>
        {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="John Doe"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 bg-white focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="CUSTOMER">Customer</option>
              <option value="ADMIN">Admin</option>
              <option value="PHARMACIST">Pharmacist</option>
              <option value="DELIVERY_COORDINATOR">Delivery Coordinator</option>
              <option value="CHIEF_PHARMACIST">Chief Pharmacist</option>
              <option value="OPERATIONS_MANAGER">Operations Manager</option>
              <option value="DELIVERY_RIDER">Delivery Rider</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              placeholder="0771234567"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-teal-500 focus:border-teal-500"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-600 text-white rounded py-2 font-medium hover:bg-teal-700 transition disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Already have an account? <Link to="/login" className="text-teal-600 hover:underline font-medium">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
