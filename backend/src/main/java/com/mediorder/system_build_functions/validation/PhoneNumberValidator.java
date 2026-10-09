package com.mediorder.system_build_functions.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.util.regex.Pattern;

public class PhoneNumberValidator implements ConstraintValidator<ValidPhone, String> {

    /** 0 or +94, then 9 digits, optionally separated by single spaces/dashes. */
    static final Pattern SRI_LANKA_PHONE = Pattern.compile("^(?:\\+94|0)(?:[ -]?\\d){9}$");

    public static boolean isValid(String value) {
        return value != null && SRI_LANKA_PHONE.matcher(value.trim()).matches();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.isBlank() || isValid(value);
    }
}
