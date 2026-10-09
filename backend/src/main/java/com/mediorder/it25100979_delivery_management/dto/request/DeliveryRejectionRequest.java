package com.mediorder.it25100979_delivery_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Rejecting a delivery request always needs a reason the customer can see. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryRejectionRequest {

    @NotBlank(message = "A rejection reason is required")
    @Size(min = 5, max = 500, message = "Rejection reason must be between 5 and 500 characters")
    private String reason;
}
