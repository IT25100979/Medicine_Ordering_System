package com.mediorder.it25100979_delivery_management.exception;

import com.mediorder.it25100979_delivery_management.enums.DeliveryStatus;

/** Thrown when an action is not allowed in the delivery's current status (HTTP 409). */
public class InvalidDeliveryStateException extends RuntimeException {

    public InvalidDeliveryStateException(String message) {
        super(message);
    }

    public static InvalidDeliveryStateException transition(Long id, DeliveryStatus from, DeliveryStatus to) {
        return new InvalidDeliveryStateException(
                "Delivery #" + id + " cannot move from " + from + " to " + to + ".");
    }
}
