import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const client = axios.create({
  baseURL: API_BASE_URL,
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// A 401 on a request that carried a token means the session is no longer valid
// (expired token, account suspended...). Tell AuthContext so it can log out cleanly.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const sentToken = Boolean(error.config?.headers?.Authorization);
    const isAuthCall = error.config?.url?.includes('/auth/');
    if (error.response?.status === 401 && sentToken && !isAuthCall) {
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }
    return Promise.reject(error);
  }
);

/** Pulls the payload out of either a raw body or the backend's { success, message, data } wrapper. */
export const unwrap = (response) => {
  const body = response?.data;
  if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
    return body.data;
  }
  return body;
};

/** Best human-readable error message from an axios error (includes the first validation error). */
export const errorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const body = error?.response?.data;
  if (body?.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    const first = Object.values(body.data)[0];
    if (typeof first === 'string') return first;
  }
  return body?.message || error?.message || fallback;
};

export default client;
