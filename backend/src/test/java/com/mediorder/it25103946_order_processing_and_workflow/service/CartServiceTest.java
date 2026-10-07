package com.mediorder.it25103946_order_processing_and_workflow.service;

import com.mediorder.it25103946_order_processing_and_workflow.model.CartItem;
import com.mediorder.it25103946_order_processing_and_workflow.repository.CartItemRepository;
import com.mediorder.it25103946_order_processing_and_workflow.service.CartService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CartServiceTest {

    @InjectMocks
    private CartService cartService;

    @Mock
    private CartItemRepository cartItemRepository;

    private CartItem item1;
    private CartItem item2;

    @BeforeEach
    void setUp() {
        item1 = new CartItem("sess-123", null, 1L, "Hyaluronic Acid", "Hyaluronate", "Skin Care", new BigDecimal("42.00"), 2, "img.jpg", false);
        item1.setId(10L);

        item2 = new CartItem("sess-123", null, 2L, "Biotin", "D-Biotin", "Hair Care", new BigDecimal("34.00"), 1, "img2.jpg", false);
        item2.setId(11L);
    }

    @Test
    void testGetCartAndCount() {
        when(cartItemRepository.findBySessionIdOrUserId("sess-123", null)).thenReturn(Arrays.asList(item1, item2));

        List<CartItem> cart = cartService.getCart("sess-123", null);
        assertEquals(2, cart.size());

        int count = cartService.getCartCount("sess-123", null);
        assertEquals(3, count);
    }

    @Test
    void testAddNewItem() {
        when(cartItemRepository.findBySessionIdAndMedicineId("sess-123", 1L)).thenReturn(Optional.empty());
        when(cartItemRepository.save(any(CartItem.class))).thenReturn(item1);

        CartItem saved = cartService.addItem(item1);
        assertNotNull(saved);
        assertEquals("Hyaluronic Acid", saved.getName());
        verify(cartItemRepository, times(1)).save(item1);
    }

    @Test
    void testAddExistingItemIncrementsQuantity() {
        when(cartItemRepository.findBySessionIdAndMedicineId("sess-123", 1L)).thenReturn(Optional.of(item1));
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartItem toAdd = new CartItem("sess-123", null, 1L, "Hyaluronic Acid", "Hyaluronate", "Skin Care", new BigDecimal("42.00"), 3, "img.jpg", false);
        CartItem result = cartService.addItem(toAdd);

        assertEquals(5, result.getQuantity());
    }

    @Test
    void testUpdateQuantity() {
        when(cartItemRepository.findById(10L)).thenReturn(Optional.of(item1));
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        CartItem updated = cartService.updateQuantity(10L, 7);
        assertEquals(7, updated.getQuantity());
    }

    @Test
    void testClearCart() {
        doNothing().when(cartItemRepository).clearCart("sess-123", 5L);

        cartService.clearCart("sess-123", 5L);
        verify(cartItemRepository, times(1)).clearCart("sess-123", 5L);
    }
}


