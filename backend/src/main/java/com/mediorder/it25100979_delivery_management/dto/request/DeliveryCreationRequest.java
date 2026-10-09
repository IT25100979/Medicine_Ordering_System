package com.mediorder.it25100979_delivery_management.dto.request;

import com.mediorder.it25100979_delivery_management.validation.ValidCourier;
import com.mediorder.it25100979_delivery_management.validation.ValidationPatterns;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Used by staff to record a delivery manually from the Delivery Management console. */
@Data
@NoArgsConstructor
public class DeliveryCreationRequest {

    @NotBlank(message = "Customer name is required")
    @Size(max = 150, message = "Customer name must be at most 150 characters")
    private String customerName;

    @NotBlank(message = "Delivery address is required")
    @Size(min = 5, max = 500, message = "Delivery address must be between 5 and 500 characters")
    private String orderAddress;

    @NotBlank(message = "Customer phone is required")
    @Pattern(regexp = ValidationPatterns.PHONE, message = "Phone number must be 7-15 digits (spaces, + and - allowed)")
    private String customerPhone;

    @Email(message = "Customer email is not valid")
    @Size(max = 150)
    private String customerEmail;

    @Size(max = 1000, message = "Special instructions must be at most 1000 characters")
    private String specialInstructions;

    @Size(max = 150)
    private String validatingPharmacist;

    @Size(max = 150)
    private String arrangingStaff;

    /** Courier partner requested for this delivery (becomes the preferred courier). */
    @ValidCourier
    private String assignedCourier;

    @Size(max = 100)
    private String assignedRoute;

    private Boolean coldChainTag;
}
