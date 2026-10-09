package com.mediorder.it25100979_delivery_management.enums;

import org.junit.jupiter.api.Test;

import static com.mediorder.it25100979_delivery_management.enums.DeliveryStatus.*;
import static org.junit.jupiter.api.Assertions.*;

class DeliveryStatusTest {

    @Test
    void happyPathTransitionsAreAllowed() {
        assertTrue(PENDING.canTransitionTo(APPROVED));
        assertTrue(PENDING.canTransitionTo(DISPATCHED));
        assertTrue(APPROVED.canTransitionTo(DISPATCHED));
        assertTrue(DISPATCHED.canTransitionTo(IN_TRANSIT));
        assertTrue(DISPATCHED.canTransitionTo(DELIVERED));
        assertTrue(IN_TRANSIT.canTransitionTo(DELIVERED));
    }

    @Test
    void invalidTransitionsAreRejected() {
        assertFalse(APPROVED.canTransitionTo(DELIVERED), "must be dispatched first");
        assertFalse(DELIVERED.canTransitionTo(PENDING), "cannot reopen delivered order");
    }

    @Test
    void finalStatesHaveNoExits() {
        assertTrue(DELIVERED.isFinal());
        assertTrue(REJECTED.isFinal());
        assertTrue(TERMINATED.isFinal());
        assertFalse(FAILED.isFinal(), "failed deliveries can be re-dispatched");
    }

    @Test
    void parsingIsCaseInsensitiveAndRejectsUnknown() {
        assertEquals(IN_TRANSIT, DeliveryStatus.from(" in_transit "));
        assertThrows(IllegalArgumentException.class, () -> DeliveryStatus.from("LOST"));
        assertThrows(IllegalArgumentException.class, () -> DeliveryStatus.from(null));
    }
}
