package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.entity.Delivery;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.LocalDateTime;

/** Issues and checks the 6-digit code the customer gives the courier at handover. */
@Service
public class DeliveryOtpService {

    public static final int OTP_VALIDITY_HOURS = 24;
    public static final int MAX_OTP_ATTEMPTS = 5;

    public enum Result { VALID, INVALID, EXPIRED, LOCKED, NOT_ISSUED }

    private final SecureRandom secureRandom = new SecureRandom();

    public String generateOtp() {
        return String.valueOf(100000 + secureRandom.nextInt(900000));
    }

    /** Issues a fresh OTP, resetting the attempt counter. */
    public void issue(Delivery delivery) {
        delivery.setDeliveryOtp(generateOtp());
        delivery.setOtpExpiresAt(LocalDateTime.now().plusHours(OTP_VALIDITY_HOURS));
        delivery.setOtpAttempts(0);
    }

    /** Checks the entered code and counts failed attempts on the delivery. */
    public Result verify(Delivery delivery, String enteredOtp) {
        if (delivery.getDeliveryOtp() == null) {
            return Result.NOT_ISSUED;
        }
        if (delivery.getOtpAttempts() >= MAX_OTP_ATTEMPTS) {
            return Result.LOCKED;
        }
        if (delivery.getOtpExpiresAt() != null && delivery.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            return Result.EXPIRED;
        }
        // Constant-time comparison so response timing doesn't leak how many digits matched.
        boolean matches = enteredOtp != null && MessageDigest.isEqual(
                delivery.getDeliveryOtp().getBytes(), enteredOtp.trim().getBytes());
        if (matches) {
            return Result.VALID;
        }
        delivery.setOtpAttempts(delivery.getOtpAttempts() + 1);
        return delivery.getOtpAttempts() >= MAX_OTP_ATTEMPTS ? Result.LOCKED : Result.INVALID;
    }

    /** Single-use: once the parcel is handed over the code is discarded. */
    public void consume(Delivery delivery) {
        delivery.setDeliveryOtp(null);
        delivery.setOtpExpiresAt(null);
    }

    public int remainingAttempts(Delivery delivery) {
        return Math.max(0, MAX_OTP_ATTEMPTS - delivery.getOtpAttempts());
    }
}
