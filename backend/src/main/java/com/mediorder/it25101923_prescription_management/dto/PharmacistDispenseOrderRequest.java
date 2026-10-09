package com.mediorder.it25101923_prescription_management.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PharmacistDispenseOrderRequest {
    private String verificationNotes;
    private String deliveryAddress;
    private String customerPhone;
    private String preferredCourier;
    private String specialInstructions;
    private List<DispensedItemLine> items;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DispensedItemLine {
        private Long medicineId;
        private String name;
        private Integer quantity;
        private BigDecimal unitPrice;
        private String dosageInstructions;
    }
}
