package com.mediorder.it25103946_order_processing_and_workflow.service;

import com.mediorder.it25102867_batchandstock_management.model.Medicine;
import com.mediorder.it25102867_batchandstock_management.repository.MedicineRepository;
import com.mediorder.it25103946_order_processing_and_workflow.model.CartItem;
import com.mediorder.it25103946_order_processing_and_workflow.repository.CartItemRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/** Customers cannot put more in the cart than is really in stock. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CartStockLimitTest {

    @Mock private CartItemRepository cartItemRepository;
    @Mock private MedicineRepository medicineRepository;
    @InjectMocks private CartService cartService;

    @BeforeEach
    void setUp() {
        Medicine omron = new Medicine();
        omron.setId(5L);
        omron.setName("Omron M3");
        omron.setStockQuantity(45);
        omron.setAllocatedStock(4); // 41 available
        when(medicineRepository.findById(5L)).thenReturn(Optional.of(omron));
        when(cartItemRepository.save(any(CartItem.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private CartItem item(int qty) {
        CartItem item = new CartItem();
        item.setUserId(1L);
        item.setMedicineId(5L);
        item.setQuantity(qty);
        return item;
    }

    @Test
    void addingMoreThanAvailableStockIsRefused() {
        when(cartItemRepository.findByUserIdAndMedicineId(1L, 5L)).thenReturn(Optional.empty());
        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> cartService.addItem(item(42)));
        assertEquals(409, ex.getStatusCode().value());
        assertTrue(ex.getReason().contains("Only 41"));
    }

    @Test
    void existingCartQuantityCountsTowardsTheLimit() {
        CartItem existing = item(40);
        when(cartItemRepository.findByUserIdAndMedicineId(1L, 5L)).thenReturn(Optional.of(existing));
        assertThrows(ResponseStatusException.class, () -> cartService.addItem(item(2)));
        assertDoesNotThrow(() -> cartService.addItem(item(1)));
    }

    @Test
    void updatingAboveStockIsRefused() {
        CartItem existing = item(1);
        existing.setId(9L);
        when(cartItemRepository.findById(9L)).thenReturn(Optional.of(existing));
        assertThrows(ResponseStatusException.class, () -> cartService.updateQuantity(9L, 50));
        assertNotNull(cartService.updateQuantity(9L, 41));
    }
}
