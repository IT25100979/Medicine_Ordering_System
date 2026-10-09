package com.mediorder.it25100979_delivery_management.validation;

import com.mediorder.it25100979_delivery_management.enums.CourierCompany;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class CourierCompanyValidator implements ConstraintValidator<ValidCourier, String> {

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return value == null || value.isBlank() || CourierCompany.isValid(value);
    }
}
