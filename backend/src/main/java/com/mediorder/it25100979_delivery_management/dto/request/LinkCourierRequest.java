package com.mediorder.it25100979_delivery_management.dto.request;

import com.mediorder.it25100979_delivery_management.validation.ValidCourier;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Coordinator assigns a courier login to a courier company. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LinkCourierRequest {
    @NotBlank(message = "Choose the courier company")
    @ValidCourier
    private String courierCompany;
}
