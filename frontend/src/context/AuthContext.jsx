import React, { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize and verify authentication state on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const response = await client.get('/api/v1/auth/me');
          if (response.data && response.data.data) {
            setUser(response.data.data);
            localStorage.setItem('user', JSON.stringify(response.data.data));
            setToken(storedToken);
          } else {
            logout();
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // The API client fires this when a request with our token comes back 401 (expired / suspended).
  useEffect(() => {
    const handleExpired = () => logout();
    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    const response = await client.post('/api/v1/auth/login', { email, password });
    const authData = response.data.data;
    if (authData && authData.token) {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      setToken(authData.token);
      setUser(authData.user);
      return authData;
    }
    throw new Error('Invalid login response');
  };

  const adminLogin = async (email, password) => {
    const response = await client.post('/api/v1/auth/admin/login', { email, password });
    const authData = response.data.data;
    if (authData && authData.token) {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      setToken(authData.token);
      setUser(authData.user);
      return authData;
    }
    throw new Error('Invalid admin login response');
  };

  const demoLogin = async (role) => {
    const response = await client.post('/api/v1/auth/demo', { role });
    const authData = response.data.data;
    if (authData && authData.token) {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      setToken(authData.token);
      setUser(authData.user);
      return authData;
    }
    throw new Error('Invalid demo login response');
  };

  const register = async (fullName, email, password, role = 'CUSTOMER', phoneNumber = '') => {
    const response = await client.post('/api/v1/auth/register', {
      fullName,
      email,
      password,
      role: role || 'CUSTOMER',
      contactNumber: phoneNumber || '0770000000',
      phoneNumber: phoneNumber || '0770000000'
    });
    const authData = response.data.data;
    if (authData && authData.token) {
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData.user));
      setToken(authData.token);
      setUser(authData.user);
      return authData;
    }
    // Staff registrations are created as PENDING_APPROVAL and receive no token until approved.
    return { ...authData, pendingApproval: true, message: response.data?.message };
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        adminLogin,
        demoLogin,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
