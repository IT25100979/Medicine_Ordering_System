package com.mediorder.it25100979_delivery_management.dto.response;

/** A courier login and the company it delivers for (null when not linked yet). */
public record CourierAccountResponse(Long userId, String name, String email, String status, String courierCompany) {
}
