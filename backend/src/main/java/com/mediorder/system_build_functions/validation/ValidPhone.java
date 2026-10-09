package com.mediorder.system_build_functions.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.*;

/**
 * Sri Lankan phone number: 0XXXXXXXXX (10 digits) or +94XXXXXXXXX.
 * Spaces and dashes between digits are allowed ("077 123 4567", "+94-77-123-4567").
 * Null/blank passes - combine with @NotBlank when the number is mandatory.
 */
@Documented
@Constraint(validatedBy = PhoneNumberValidator.class)
@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidPhone {
    String message() default "Enter a valid phone number, e.g. 0771234567 or +94771234567";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
