package com.mediorder.system_build_functions.validation;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PhoneNumberValidatorTest {

    @Test
    void acceptsSriLankanFormats() {
        for (String ok : new String[]{"0771234567", "077 123 4567", "077-123-4567", "+94771234567", "+94 77 123 4567", "0112345678"}) {
            assertTrue(PhoneNumberValidator.isValid(ok), ok);
        }
    }

    @Test
    void rejectsWrongLengthLettersAndOtherFormats() {
        for (String bad : new String[]{"077123456", "07712345678", "abc1234567", "555-010-0001", "+1 555 123 4567", "0771  234567", ""}) {
            assertFalse(PhoneNumberValidator.isValid(bad), bad);
        }
    }

    @Test
    void blankIsLeftToNotBlank() {
        PhoneNumberValidator v = new PhoneNumberValidator();
        assertTrue(v.isValid(null, null));
        assertTrue(v.isValid("  ", null));
        assertFalse(v.isValid("12", null));
    }
}
