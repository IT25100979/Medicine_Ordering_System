import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const GUEST_CART_KEY = 'pharma_guest_cart_items';
const CART_COUNT_KEY = 'pharma_cart_count';

const getGuestCartFromStorage = () => {
  try {
    const raw = sessionStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Failed to parse guest cart from sessionStorage:', e);
    return [];
  }
};

const saveGuestCartToStorage = (items) => {
  try {
    sessionStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    const totalCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
    sessionStorage.setItem(CART_COUNT_KEY, String(totalCount));
    localStorage.setItem(CART_COUNT_KEY, String(totalCount));
    return totalCount;
  } catch (e) {
    console.warn('Failed to save guest cart to sessionStorage:', e);
    return 0;
  }
};

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Reliably resolve userId across various user object models (user.id vs user.userId)
  const userId = (user && (user.id || user.userId)) ? (user.id || user.userId) : null;

  // Recalculate derived count and subtotal
  const updateDerivedTotals = useCallback((items) => {
    const count = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
    const sub = items.reduce((acc, i) => {
      const price = Number(i.unitPrice ?? i.price ?? i.unit_price ?? 0);
      const qty = Number(i.quantity) || 0;
      return acc + (price * qty);
    }, 0);
    setCartCount(count);
    setSubtotal(sub);
    sessionStorage.setItem(CART_COUNT_KEY, String(count));
    localStorage.setItem(CART_COUNT_KEY, String(count));
  }, []);

  // Fetch cart (DB if customer, Session if guest)
  const fetchCart = useCallback(async () => {
    if (!userId) {
      // Guest: Load strictly from sessionStorage
      const items = getGuestCartFromStorage();
      setCartItems(items);
      updateDerivedTotals(items);
      return;
    }

    // Customer: Load from Database
    try {
      setLoading(true);
      const res = await client.get('/api/v1/cart', {
        params: { userId, user_id: userId },
      });

      if (res.data) {
        const items = (res.data.items || []).map(item => {
          const itemPrice = Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0);
          return {
            ...item,
            id: item.id,
            medicineId: item.medicineId ?? item.medicine_id ?? item.id,
            name: item.name,
            genericName: item.genericName ?? item.generic_name ?? '',
            category: item.category || 'General',
            price: itemPrice,
            unitPrice: itemPrice,
            quantity: Number(item.quantity) || 1,
            imageUrl: item.imageUrl ?? item.image_url ?? '',
          };
        });
        setCartItems(items);
        const count = res.data.count !== undefined ? Number(res.data.count) : items.reduce((a, b) => a + b.quantity, 0);
        const sub = res.data.subtotal !== undefined ? Number(res.data.subtotal) : items.reduce((a, b) => a + (b.unitPrice * b.quantity), 0);
        setCartCount(count);
        setSubtotal(sub);
        sessionStorage.setItem(CART_COUNT_KEY, String(count));
        localStorage.setItem(CART_COUNT_KEY, String(count));
      }
    } catch (err) {
      console.warn('Failed to load cart from DB, using current state:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, updateDerivedTotals]);

  // Handle guest cart merge upon login
  useEffect(() => {
    const syncOnAuthChange = async () => {
      if (userId) {
        const guestItems = getGuestCartFromStorage();
        if (guestItems.length > 0) {
          try {
            // Push guest items to backend database for the logged in user
            for (const item of guestItems) {
              await client.post('/api/v1/cart/add', {
                userId,
                user_id: userId,
                medicineId: item.medicineId || item.id || null,
                medicine_id: item.medicineId || item.id || null,
                name: item.name || 'Pharmaceutical Item',
                genericName: item.genericName || '',
                generic_name: item.genericName || '',
                category: item.category || 'General',
                unitPrice: Number(item.unitPrice || item.price || 0),
                unit_price: Number(item.unitPrice || item.price || 0),
                quantity: Number(item.quantity) || 1,
                imageUrl: item.imageUrl || '',
                image_url: item.imageUrl || '',
                requiresPrescription: Boolean(item.requiresPrescription),
                requires_prescription: Boolean(item.requiresPrescription),
              });
            }
          } catch (mergeErr) {
            console.warn('Error merging guest cart to DB:', mergeErr);
          } finally {
            sessionStorage.removeItem(GUEST_CART_KEY);
          }
        }
        await fetchCart();
      } else {
        // Guest mode
        await fetchCart();
      }
    };

    syncOnAuthChange();
  }, [userId, fetchCart]);

  // Add Item to Cart (Real-Time for Guest & Customer)
  const addToCart = async (product, quantity = 1) => {
    const qty = Math.max(1, Number(quantity) || 1);
    const unitPrice = Number(product.price ?? product.unitPrice ?? 0);
    const prodId = product.id ?? product.medicineId;

    if (!userId) {
      // -------------------------------------------------------------
      // GUEST: Save in sessionStorage ONLY (No DB query)
      // Real-time reactive update
      // -------------------------------------------------------------
      const currentItems = getGuestCartFromStorage();
      const existingIndex = currentItems.findIndex(
        i => (prodId && (i.id === prodId || i.medicineId === prodId)) || (i.name === (product.name || product.title))
      );

      let updated;
      if (existingIndex >= 0) {
        updated = [...currentItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + qty,
          unitPrice: unitPrice > 0 ? unitPrice : updated[existingIndex].unitPrice,
          price: unitPrice > 0 ? unitPrice : updated[existingIndex].price,
        };
      } else {
        const newItem = {
          id: prodId || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          medicineId: prodId || null,
          name: product.name || product.title || 'Pharmaceutical Item',
          genericName: product.genericName || product.subtitle || '',
          category: product.category || 'General',
          price: unitPrice,
          unitPrice: unitPrice,
          quantity: qty,
          imageUrl: product.imageUrl || '',
          requiresPrescription: Boolean(product.requiresPrescription || product.requiresRx),
        };
        updated = [...currentItems, newItem];
      }

      saveGuestCartToStorage(updated);
      setCartItems(updated);
      updateDerivedTotals(updated);
      return { success: true, items: updated };
    }

    // -------------------------------------------------------------
    // CUSTOMER: Save in Database via Backend API
    // Real-time reactive optimistic update + backend persistence
    // -------------------------------------------------------------
    const payload = {
      userId,
      user_id: userId,
      medicineId: prodId || null,
      medicine_id: prodId || null,
      name: product.name || product.title || 'Pharmaceutical Item',
      genericName: product.genericName || product.subtitle || '',
      generic_name: product.genericName || product.subtitle || '',
      category: product.category || 'General',
      unitPrice: unitPrice,
      unit_price: unitPrice,
      price: unitPrice,
      quantity: qty,
      imageUrl: product.imageUrl || '',
      image_url: product.imageUrl || '',
      requiresPrescription: Boolean(product.requiresPrescription || product.requiresRx),
      requires_prescription: Boolean(product.requiresPrescription || product.requiresRx),
    };

    // Optimistic state update for instant zero-lag feedback
    setCartItems(prev => {
      const idx = prev.findIndex(i => (prodId && (i.id === prodId || i.medicineId === prodId)) || i.name === payload.name);
      let next;
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
      } else {
        next = [...prev, { ...payload, id: prodId || Date.now(), price: unitPrice, unitPrice: unitPrice }];
      }
      updateDerivedTotals(next);
      return next;
    });

    try {
      const res = await client.post('/api/v1/cart/add', payload);
      await fetchCart();
      return res.data;
    } catch (err) {
      console.error('Error saving item to DB cart:', err);
      await fetchCart();
      throw err;
    }
  };

  // Update item quantity (Real-Time for Guest & Customer)
  const updateQuantity = async (itemId, newQty) => {
    const targetQty = Number(newQty);

    if (!userId) {
      // GUEST
      const currentItems = getGuestCartFromStorage();
      let updated;
      if (targetQty <= 0) {
        updated = currentItems.filter(i => i.id !== itemId && i.medicineId !== itemId);
      } else {
        updated = currentItems.map(i =>
          (i.id === itemId || i.medicineId === itemId) ? { ...i, quantity: targetQty } : i
        );
      }
      saveGuestCartToStorage(updated);
      setCartItems(updated);
      updateDerivedTotals(updated);
      return;
    }

    // CUSTOMER: Database
    // Optimistic update
    setCartItems(prev => {
      let next;
      if (targetQty <= 0) {
        next = prev.filter(i => i.id !== itemId);
      } else {
        next = prev.map(i => (i.id === itemId ? { ...i, quantity: targetQty } : i));
      }
      updateDerivedTotals(next);
      return next;
    });

    try {
      await client.put(`/api/v1/cart/${itemId}`, null, {
        params: {
          quantity: targetQty,
          userId,
          user_id: userId,
        },
      });
      await fetchCart();
    } catch (err) {
      console.error('Error updating item quantity in DB:', err);
      await fetchCart();
      throw err; // let the page show why (e.g. not enough stock)
    }
  };

  // Remove item from Cart
  const removeFromCart = async (itemId) => {
    if (!userId) {
      // GUEST
      const currentItems = getGuestCartFromStorage();
      const updated = currentItems.filter(i => i.id !== itemId && i.medicineId !== itemId);
      saveGuestCartToStorage(updated);
      setCartItems(updated);
      updateDerivedTotals(updated);
      return;
    }

    // CUSTOMER
    setCartItems(prev => {
      const next = prev.filter(i => i.id !== itemId);
      updateDerivedTotals(next);
      return next;
    });

    try {
      await client.delete(`/api/v1/cart/${itemId}`, {
        params: { userId, user_id: userId },
      });
      await fetchCart();
    } catch (err) {
      console.error('Error removing item from DB cart:', err);
      await fetchCart();
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    setCartItems([]);
    setCartCount(0);
    setSubtotal(0);
    sessionStorage.removeItem(GUEST_CART_KEY);
    sessionStorage.setItem(CART_COUNT_KEY, '0');
    localStorage.setItem(CART_COUNT_KEY, '0');

    if (userId) {
      try {
        await client.delete('/api/v1/cart/clear', {
          params: { userId, user_id: userId },
        });
      } catch (err) {
        console.warn('Error clearing cart in DB:', err);
      }
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
        removeItem: removeFromCart, // alias for consistency
        clearCart,
        fetchCart,
        isGuest: !userId,
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
