package com.mediorder.it25100979_delivery_management.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** A courier partner option shown to the customer at checkout. */
@Getter
@AllArgsConstructor
public class CourierPartnerResponse {
    private String code;
    private String name;
    private String description;
    private int estimatedDays;
}
