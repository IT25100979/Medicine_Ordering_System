package com.mediorder.it25100979_delivery_management.dto.request;

import com.mediorder.it25100979_delivery_management.validation.ValidCourier;
import com.mediorder.system_build_functions.validation.ValidPhone;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Pharmacist dispenses an approved prescription: picks the medicines (from the catalog) and
 * confirms where to deliver. Address/phone/courier default to what the customer gave at upload.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DispensePrescriptionRequest {

    @NotEmpty(message = "Pick at least one medicine")
    @Size(max = 30, message = "At most 30 different medicines per prescription")
    private List<@Valid Line> items;

    @Size(min = 5, max = 500, message = "Delivery address must be between 5 and 500 characters")
    private String deliveryAddress;

    @ValidPhone
    private String contactPhone;

    @ValidCourier
    private String preferredCourier;

    @Size(max = 1000, message = "Note must be at most 1000 characters")
    private String note;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Line {
        @NotNull(message = "Choose a medicine")
        private Long medicineId;

        @NotNull(message = "Quantity is required")
        @Min(value = 1, message = "Quantity must be at least 1")
        @Max(value = 100, message = "Quantity must be at most 100")
        private Integer quantity;
    }
}
