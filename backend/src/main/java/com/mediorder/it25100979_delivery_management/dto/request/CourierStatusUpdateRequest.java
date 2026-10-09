package com.mediorder.it25100979_delivery_management.dto.request;

import com.mediorder.it25100979_delivery_management.validation.ValidationPatterns;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourierStatusUpdateRequest {

    @NotBlank(message = "Status is required (IN_TRANSIT, FAILED, DELIVERED)")
    @Pattern(regexp = "(?i)IN_TRANSIT|FAILED|DELIVERED", message = "Courier status must be IN_TRANSIT, FAILED or DELIVERED")
    private String status;

    @Pattern(regexp = ValidationPatterns.OTP, message = "OTP must be exactly 6 digits")
    private String otp;

    @Size(max = 500, message = "Failure reason must be at most 500 characters")
    private String failureReason;
}
