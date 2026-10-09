package com.mediorder.it25100979_delivery_management.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * The value must be one of the supported courier partners
 * (DHL, Koombiyo, Lanka Delivery, In Company Delivery). Null/blank is allowed;
 * combine with {@code @NotBlank} when the courier is mandatory.
 */
@Documented
@Constraint(validatedBy = CourierCompanyValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidCourier {
    String message() default "Unknown courier partner. Choose DHL, Koombiyo, Lanka Delivery or In Company Delivery";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
