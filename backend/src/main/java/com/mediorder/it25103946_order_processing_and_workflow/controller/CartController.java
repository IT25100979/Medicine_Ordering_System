package com.mediorder.it25103946_order_processing_and_workflow.controller;

import com.mediorder.it25103946_order_processing_and_workflow.model.CartItem;
import com.mediorder.it25103946_order_processing_and_workflow.service.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/cart", "/api/cart"})
@CrossOrigin(origins = "*")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getCart(
            @RequestParam(value = "sessionId", required = false) String sessionId,
            @RequestParam(value = "session_id", required = false) String sessionIdSnake,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "user_id", required = false) Long userIdSnake) {

        String effectiveSessionId = sessionId != null ? sessionId : sessionIdSnake;
        Long effectiveUserId = userId != null ? userId : userIdSnake;

        List<CartItem> items = cartService.getCart(effectiveSessionId, effectiveUserId);
        int totalCount = items.stream().mapToInt(CartItem::getQuantity).sum();
        BigDecimal subtotal = items.stream()
                .map(i -> (i.getUnitPrice() != null ? i.getUnitPrice() : BigDecimal.ZERO).multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> response = new HashMap<>();
        response.put("items", items);
        response.put("count", totalCount);
        response.put("subtotal", subtotal);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addToCart(@RequestBody CartItem item) {
        CartItem saved = cartService.addItem(item);
        int totalCount = cartService.getCartCount(item.getSessionId(), item.getUserId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("item", saved);
        response.put("count", totalCount);
        response.put("message", "Item added to database cart");
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateQuantity(
            @PathVariable Long id,
            @RequestParam("quantity") int quantity,
            @RequestParam(value = "sessionId", required = false) String sessionId,
            @RequestParam(value = "session_id", required = false) String sessionIdSnake,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "user_id", required = false) Long userIdSnake) {

        String effectiveSessionId = sessionId != null ? sessionId : sessionIdSnake;
        Long effectiveUserId = userId != null ? userId : userIdSnake;

        CartItem updated = cartService.updateQuantity(id, quantity);
        int totalCount = cartService.getCartCount(effectiveSessionId, effectiveUserId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("item", updated);
        response.put("count", totalCount);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> removeItem(
            @PathVariable Long id,
            @RequestParam(value = "sessionId", required = false) String sessionId,
            @RequestParam(value = "session_id", required = false) String sessionIdSnake,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "user_id", required = false) Long userIdSnake) {

        String effectiveSessionId = sessionId != null ? sessionId : sessionIdSnake;
        Long effectiveUserId = userId != null ? userId : userIdSnake;

        cartService.removeItem(id);
        int totalCount = cartService.getCartCount(effectiveSessionId, effectiveUserId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", totalCount);
        response.put("message", "Item removed from cart");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/merge")
    public ResponseEntity<Map<String, Object>> mergeCart(@RequestBody Map<String, Object> body) {
        String sessionId = (String) (body.get("sessionId") != null ? body.get("sessionId") : body.get("session_id"));
        Long userId = null;
        Object rawUserId = body.get("userId") != null ? body.get("userId") : body.get("user_id");
        if (rawUserId != null) {
            userId = Long.valueOf(rawUserId.toString());
        }

        List<CartItem> mergedItems = cartService.mergeCart(sessionId, userId);
        int totalCount = mergedItems.stream().mapToInt(CartItem::getQuantity).sum();
        BigDecimal subtotal = mergedItems.stream()
                .map(i -> (i.getUnitPrice() != null ? i.getUnitPrice() : BigDecimal.ZERO).multiply(BigDecimal.valueOf(i.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("items", mergedItems);
        response.put("count", totalCount);
        response.put("subtotal", subtotal);
        response.put("message", "Guest cart successfully merged to authenticated user profile");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearCart(
            @RequestParam(value = "sessionId", required = false) String sessionId,
            @RequestParam(value = "session_id", required = false) String sessionIdSnake,
            @RequestParam(value = "userId", required = false) Long userId,
            @RequestParam(value = "user_id", required = false) Long userIdSnake) {

        String effectiveSessionId = sessionId != null ? sessionId : sessionIdSnake;
        Long effectiveUserId = userId != null ? userId : userIdSnake;

        cartService.clearCart(effectiveSessionId, effectiveUserId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", 0);
        response.put("message", "Cart successfully cleared from database");
        return ResponseEntity.ok(response);
    }
}


