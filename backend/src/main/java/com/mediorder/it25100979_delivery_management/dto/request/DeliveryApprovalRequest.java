package com.mediorder.it25100979_delivery_management.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Optional note the coordinator can add when approving a delivery request. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryApprovalRequest {

    @Size(max = 500, message = "Note must be at most 500 characters")
    private String note;
}
