package com.mediorder.it25103946_order_processing_and_workflow.service;

import com.mediorder.it25103946_order_processing_and_workflow.model.CartItem;
import com.mediorder.it25103946_order_processing_and_workflow.repository.CartItemRepository;
import com.mediorder.system_build_functions.service.RealtimeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional
public class CartService {

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired(required = false)
    private RealtimeService realtimeService;

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

        CartItem result;
        if (existing.isPresent()) {
            CartItem current = existing.get();
            current.setQuantity(current.getQuantity() + item.getQuantity());
            current.setUpdatedAt(LocalDateTime.now());
            if (item.getUnitPrice() != null) {
                current.setUnitPrice(item.getUnitPrice());
            }
            result = cartItemRepository.save(current);
        } else {
            item.setCreatedAt(LocalDateTime.now());
            item.setUpdatedAt(LocalDateTime.now());
            result = cartItemRepository.save(item);
        }

        notifyCartUpdate(result.getSessionId(), result.getUserId());
        return result;
    }

    public CartItem updateQuantity(Long itemId, int quantity) {
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + itemId));

        String sessionId = item.getSessionId();
        Long userId = item.getUserId();

        if (quantity <= 0) {
            cartItemRepository.deleteById(itemId);
            notifyCartUpdate(sessionId, userId);
            return null;
        }

        item.setQuantity(quantity);
        item.setUpdatedAt(LocalDateTime.now());
        CartItem saved = cartItemRepository.save(item);
        notifyCartUpdate(sessionId, userId);
        return saved;
    }

    public void removeItem(Long itemId) {
        Optional<CartItem> itemOpt = cartItemRepository.findById(itemId);
        if (itemOpt.isPresent()) {
            CartItem item = itemOpt.get();
            String sessionId = item.getSessionId();
            Long userId = item.getUserId();
            cartItemRepository.deleteById(itemId);
            notifyCartUpdate(sessionId, userId);
        }
    }

    public void clearCart(String sessionId, Long userId) {
        if (userId != null || sessionId != null) {
            cartItemRepository.clearCart(sessionId, userId);
        } else {
            cartItemRepository.deleteAll();
        }
        notifyCartUpdate(sessionId, userId);
    }

    public List<CartItem> mergeCart(String sessionId, Long userId) {
        if (sessionId == null || userId == null) {
            return getCart(sessionId, userId);
        }

        List<CartItem> sessionItems = cartItemRepository.findBySessionId(sessionId);
        for (CartItem sItem : sessionItems) {
            if (sItem.getMedicineId() != null) {
                Optional<CartItem> userItemOpt = cartItemRepository.findByUserIdAndMedicineId(userId, sItem.getMedicineId());
                if (userItemOpt.isPresent()) {
                    CartItem userItem = userItemOpt.get();
                    userItem.setQuantity(userItem.getQuantity() + sItem.getQuantity());
                    userItem.setUpdatedAt(LocalDateTime.now());
                    cartItemRepository.save(userItem);
                    cartItemRepository.delete(sItem);
                } else {
                    sItem.setUserId(userId);
                    sItem.setSessionId(null);
                    sItem.setUpdatedAt(LocalDateTime.now());
                    cartItemRepository.save(sItem);
                }
            } else {
                sItem.setUserId(userId);
                sItem.setSessionId(null);
                sItem.setUpdatedAt(LocalDateTime.now());
                cartItemRepository.save(sItem);
            }
        }

        notifyCartUpdate(null, userId);
        return cartItemRepository.findByUserId(userId);
    }

    @Transactional(readOnly = true)
    public int getCartCount(String sessionId, Long userId) {
        List<CartItem> items = getCart(sessionId, userId);
        return items.stream().mapToInt(CartItem::getQuantity).sum();
    }

    private void notifyCartUpdate(String sessionId, Long userId) {
        if (realtimeService == null) return;
        try {
            int count = getCartCount(sessionId, userId);
            Map<String, Object> payload = Map.of(
                    "event", "CART_UPDATED",
                    "userId", userId != null ? userId : 0L,
                    "sessionId", sessionId != null ? sessionId : "",
                    "count", count,
                    "timestamp", System.currentTimeMillis()
            );
            if (userId != null) {
                realtimeService.publish("cart:" + userId, "CART_UPDATED", payload);
            }
            if (sessionId != null && !sessionId.isBlank()) {
                realtimeService.publish("cart:" + sessionId, "CART_UPDATED", payload);
            }
        } catch (Exception e) {
            // Ignore realtime notification failure
        }
    }
}


