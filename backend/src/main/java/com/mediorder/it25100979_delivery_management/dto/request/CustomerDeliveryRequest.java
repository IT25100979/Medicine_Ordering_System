package com.mediorder.it25100979_delivery_management.dto.request;

import com.mediorder.it25100979_delivery_management.validation.ValidCourier;
import com.mediorder.it25100979_delivery_management.validation.ValidationPatterns;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Sent by the customer when they confirm checkout and pick a courier partner.
 * Name and e-mail are taken from the logged-in account, never from this body.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerDeliveryRequest {

    @NotBlank(message = "Please choose a delivery partner")
    @ValidCourier
    private String preferredCourier;

    @NotBlank(message = "Delivery address is required")
    @Size(min = 5, max = 500, message = "Delivery address must be between 5 and 500 characters")
    private String deliveryAddress;

    @NotBlank(message = "Contact phone number is required")
    @Pattern(regexp = ValidationPatterns.PHONE, message = "Phone number must be 7-15 digits (spaces, + and - allowed)")
    private String customerPhone;

    @Size(max = 1000, message = "Special instructions must be at most 1000 characters")
    private String specialInstructions;

    @DecimalMin(value = "0.0", message = "Delivery fee cannot be negative")
    @DecimalMax(value = "100000.0", message = "Delivery fee is too large")
    private BigDecimal deliveryFee;

    /** Approved prescription covering prescription-only items in the cart (required when there are any). */
    private Long prescriptionId;

    @NotEmpty(message = "Your cart is empty")
    @Size(max = 50, message = "A single order can contain at most 50 different items")
    private List<@Valid OrderLine> items;

    public CustomerDeliveryRequest(String preferredCourier, String deliveryAddress, String customerPhone,
                                   String specialInstructions, BigDecimal deliveryFee, List<OrderLine> items) {
        this(preferredCourier, deliveryAddress, customerPhone, specialInstructions, deliveryFee, null, items);
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderLine {
        private Long medicineId;

        @NotBlank(message = "Item name is required")
        @Size(max = 200)
        private String name;

        @NotNull(message = "Item quantity is required")
        @Min(value = 1, message = "Item quantity must be at least 1")
        @Max(value = 100, message = "Item quantity must be at most 100")
        private Integer quantity;

        @NotNull(message = "Item price is required")
        @DecimalMin(value = "0.0", message = "Item price cannot be negative")
        private BigDecimal unitPrice;
    }
}
