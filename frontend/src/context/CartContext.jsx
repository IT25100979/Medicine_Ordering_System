import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const getOrCreateSessionId = () => {
  let sess = localStorage.getItem('pharma_cart_session');
  if (!sess) {
    sess = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('pharma_cart_session', sess);
  }
  return sess;
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [sessionId] = useState(getOrCreateSessionId);
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const userId = user?.id || user?.userId || null;

  // Fetch cart from backend DB
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/v1/cart', {
        params: {
          sessionId,
          userId: userId || undefined,
        },
      });

      if (res.data) {
        const items = (res.data.items || []).map(item => ({
          ...item,
          price: Number(item.unitPrice ?? item.price ?? item.unit_price ?? 0),
          unitPrice: Number(item.unitPrice ?? item.price ?? item.unit_price ?? 0),
        }));
        setCartItems(items);
        setCartCount(res.data.count || 0);
        setSubtotal(Number(res.data.subtotal || 0));
        localStorage.setItem('pharma_cart_count', String(res.data.count || 0));
      }
    } catch (err) {
      console.warn('Failed to load cart from DB, using local state:', err);
      const localCount = parseInt(localStorage.getItem('pharma_cart_count') || '0', 10);
      setCartCount(localCount);
    } finally {
      setLoading(false);
    }
  }, [sessionId, userId]);

  // Merge guest session cart upon user login
  useEffect(() => {
    if (userId && sessionId) {
      client.post('/api/v1/cart/merge', { sessionId, userId })
        .then(() => fetchCart())
        .catch((err) => {
          console.warn('Guest cart auto-merge notice:', err);
          fetchCart();
        });
    } else {
      fetchCart();
    }
  }, [userId, sessionId, fetchCart]);

  // Add Item to Cart in DB
  const addToCart = async (product, quantity = 1) => {
    try {
      const payload = {
        sessionId,
        userId: userId || undefined,
        medicineId: product.id || null,
        name: product.name || 'Pharmaceutical Item',
        genericName: product.genericName || product.brandName || '',
        category: product.category || 'General',
        unitPrice: Number(product.unitPrice || product.price || 0),
        quantity: Number(quantity) || 1,
        imageUrl: product.imageUrl || '',
        requiresPrescription: Boolean(product.requiresPrescription || product.requiresRx),
      };

      const res = await client.post('/api/v1/cart/add', payload);
      if (res.data) {
        await fetchCart();
        return res.data;
      }
    } catch (err) {
      console.error('Error adding item to cart:', err);
      // Fallback local update
      setCartItems((prev) => {
        const existingIdx = prev.findIndex((i) => (product.id ? i.medicineId === product.id : i.name === product.name));
        let updated;
        if (existingIdx >= 0) {
          updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: updated[existingIdx].quantity + quantity,
          };
        } else {
          updated = [
            ...prev,
            {
              id: Date.now(),
              name: product.name,
              genericName: product.genericName || '',
              category: product.category || 'General',
              unitPrice: Number(product.unitPrice || product.price || 0),
              quantity,
              imageUrl: product.imageUrl || '',
            },
          ];
        }
        const newCount = updated.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(newCount);
        localStorage.setItem('pharma_cart_count', String(newCount));
        return updated;
      });
    }
  };

  // Update item quantity in DB
  const updateQuantity = async (itemId, qty) => {
    try {
      await client.put(`/api/v1/cart/${itemId}`, null, {
        params: {
          quantity: qty,
          sessionId,
          userId: userId || undefined,
        },
      });
      await fetchCart();
    } catch (err) {
      console.error('Error updating quantity:', err);
      setCartItems((prev) =>
        prev
          .map((item) => (item.id === itemId ? (qty > 0 ? { ...item, quantity: qty } : null) : item))
          .filter(Boolean)
      );
      setCartCount((prev) => Math.max(0, prev + (qty > 0 ? 1 : -1)));
    }
  };

  // Remove item from DB
  const removeFromCart = async (itemId) => {
    try {
      await client.delete(`/api/v1/cart/${itemId}`, {
        params: {
          sessionId,
          userId: userId || undefined,
        },
      });
      await fetchCart();
    } catch (err) {
      console.error('Error removing item:', err);
      setCartItems((prev) => prev.filter((item) => item.id !== itemId));
    }
  };

  // Clear entire cart from DB and reset count to 0
  const clearCart = async () => {
    try {
      await client.delete('/api/v1/cart/clear', {
        params: {
          sessionId,
          userId: userId || undefined,
        },
      });
    } catch (err) {
      console.warn('Error clearing cart on server:', err);
    } finally {
      setCartItems([]);
      setCartCount(0);
      setSubtotal(0);
      localStorage.setItem('pharma_cart_count', '0');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        subtotal,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
