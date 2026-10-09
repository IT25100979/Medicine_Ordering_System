package com.mediorder.it25100979_delivery_management.exception;

public class DeliveryNotFoundException extends RuntimeException {
    public DeliveryNotFoundException(Long id) {
        super("Delivery not found with id: " + id);
    }
}
