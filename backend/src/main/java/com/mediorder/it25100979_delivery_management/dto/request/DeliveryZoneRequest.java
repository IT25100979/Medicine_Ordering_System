package com.mediorder.it25100979_delivery_management.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Create / update a delivery zone (route). JSON keeps the snake_case names the UI already uses. */
@Data
@NoArgsConstructor
public class DeliveryZoneRequest {

    @NotBlank(message = "City / sector name is required")
    @Size(max = 100)
    private String city;

    @NotBlank(message = "Postal code (range) is required")
    @Size(max = 50)
    @JsonProperty("postal_code")
    @JsonAlias("postalCode")
    private String postalCode;

    @Min(value = 0, message = "is_active must be 0 or 1")
    @Max(value = 1, message = "is_active must be 0 or 1")
    @JsonProperty("is_active")
    @JsonAlias("isActive")
    private Integer isActive;

    @NotNull(message = "Delivery fee is required")
    @DecimalMin(value = "0.0", message = "Delivery fee cannot be negative")
    @DecimalMax(value = "100000.0", message = "Delivery fee is too large")
    @JsonProperty("delivery_fee")
    @JsonAlias("deliveryFee")
    private Double deliveryFee;

    @Min(value = 1, message = "Estimated delivery time must be at least 1 minute")
    @Max(value = 10080, message = "Estimated delivery time must be at most 7 days")
    @JsonProperty("estimated_delivery_time")
    @JsonAlias({"estimatedDeliveryTime", "esitmated_delivery_time"})
    private Integer estimatedDeliveryTime;
}
