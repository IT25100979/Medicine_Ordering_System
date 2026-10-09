package com.mediorder.it25100979_delivery_management.dto.request;

import com.mediorder.it25100979_delivery_management.validation.ValidCourier;
import com.mediorder.it25100979_delivery_management.validation.ValidationPatterns;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;

/**
 * Assign a courier (and optionally a route / batch code) to one or more APPROVED deliveries.
 * When {@code courier} is left empty each delivery keeps the partner the customer chose.
 */
@Data
@NoArgsConstructor
public class AssignDeliveryRequest {

    @Size(max = 100, message = "You can assign at most 100 deliveries at once")
    private List<Long> deliveryIds;

    private Long deliveryId;

    @Pattern(regexp = ValidationPatterns.BATCH_CODE, message = "Batch code may contain letters, digits, '-' and '_' only (max 40)")
    private String batchId;

    @Size(max = 100)
    private String route;

    @ValidCourier
    private String courier;

    @AssertTrue(message = "At least one deliveryId must be provided for assignment")
    public boolean isAnyDeliverySelected() {
        return !resolveDeliveryIds().isEmpty();
    }

    /** Combines {@code deliveryIds} and {@code deliveryId}, removing duplicates and nulls. */
    public List<Long> resolveDeliveryIds() {
        LinkedHashSet<Long> ids = new LinkedHashSet<>();
        if (deliveryIds != null) {
            deliveryIds.stream().filter(id -> id != null).forEach(ids::add);
        }
        if (deliveryId != null) {
            ids.add(deliveryId);
        }
        return new ArrayList<>(ids);
    }
}
