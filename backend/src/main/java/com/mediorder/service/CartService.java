package com.mediorder.service;

import com.mediorder.model.CartItem;
import com.mediorder.repository.CartItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class CartService {

    @Autowired
    private CartItemRepository cartItemRepository;

    @Transactional(readOnly = true)
    public List<CartItem> getCart(String sessionId, Long userId) {
        if (userId != null || sessionId != null) {
            return cartItemRepository.findBySessionIdOrUserId(sessionId, userId);
        }
        return cartItemRepository.findAll();
    }

    public CartItem addItem(CartItem item) {
        if (item.getQuantity() == null || item.getQuantity() <= 0) {
            item.setQuantity(1);
        }

        // Check if existing
        Optional<CartItem> existing = Optional.empty();
        if (item.getUserId() != null && item.getMedicineId() != null) {
            existing = cartItemRepository.findByUserIdAndMedicineId(item.getUserId(), item.getMedicineId());
        } else if (item.getSessionId() != null && item.getMedicineId() != null) {
            existing = cartItemRepository.findBySessionIdAndMedicineId(item.getSessionId(), item.getMedicineId());
        }

        if (existing.isPresent()) {
            CartItem current = existing.get();
            current.setQuantity(current.getQuantity() + item.getQuantity());
            current.setUpdatedAt(LocalDateTime.now());
            if (item.getUnitPrice() != null) {
                current.setUnitPrice(item.getUnitPrice());
            }
            return cartItemRepository.save(current);
        }

        item.setCreatedAt(LocalDateTime.now());
        item.setUpdatedAt(LocalDateTime.now());
        return cartItemRepository.save(item);
    }

    public CartItem updateQuantity(Long itemId, int quantity) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + itemId));

        if (quantity <= 0) {
            cartItemRepository.deleteById(itemId);
            return null;
        }

        item.setQuantity(quantity);
        item.setUpdatedAt(LocalDateTime.now());
        return cartItemRepository.save(item);
    }

    public void removeItem(Long itemId) {
        cartItemRepository.deleteById(itemId);
    }

    public void clearCart(String sessionId, Long userId) {
        if (userId != null || sessionId != null) {
            cartItemRepository.clearCart(sessionId, userId);
        } else {
            cartItemRepository.deleteAll();
        }
    }

    @Transactional(readOnly = true)
    public int getCartCount(String sessionId, Long userId) {
        List<CartItem> items = getCart(sessionId, userId);
        return items.stream().mapToInt(CartItem::getQuantity).sum();
    }
}
