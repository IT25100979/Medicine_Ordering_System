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
            @RequestParam(value = "userId", required = false) Long userId) {

        List<CartItem> items = cartService.getCart(sessionId, userId);
        int totalCount = items.stream().mapToInt(CartItem::getQuantity).sum();
        BigDecimal subtotal = items.stream()
                .map(i -> i.getUnitPrice().multiply(BigDecimal.valueOf(i.getQuantity())))
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
            @RequestParam(value = "userId", required = false) Long userId) {

        CartItem updated = cartService.updateQuantity(id, quantity);
        int totalCount = cartService.getCartCount(sessionId, userId);

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
            @RequestParam(value = "userId", required = false) Long userId) {

        cartService.removeItem(id);
        int totalCount = cartService.getCartCount(sessionId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", totalCount);
        response.put("message", "Item removed from cart");
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/clear")
    public ResponseEntity<Map<String, Object>> clearCart(
            @RequestParam(value = "sessionId", required = false) String sessionId,
            @RequestParam(value = "userId", required = false) Long userId) {

        cartService.clearCart(sessionId, userId);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", 0);
        response.put("message", "Cart successfully cleared from database");
        return ResponseEntity.ok(response);
    }
}


