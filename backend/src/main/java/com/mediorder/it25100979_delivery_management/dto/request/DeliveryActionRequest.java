package com.mediorder.it25100979_delivery_management.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryActionRequest {

    @NotBlank(message = "Action must be provided (HOLD, POSTPONE, TERMINATE, RESUME)")
    @Pattern(regexp = "(?i)HOLD|POSTPONE|TERMINATE|RESUME", message = "Action must be HOLD, POSTPONE, TERMINATE or RESUME")
    private String action;

    @Size(max = 500, message = "Reason must be at most 500 characters")
    private String reason;
}
