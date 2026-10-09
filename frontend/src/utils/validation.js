/**
 * Shared form rules (the backend checks the same things).
 * Phone: Sri Lankan number, 0XXXXXXXXX or +94XXXXXXXXX; spaces/dashes allowed between digits.
 */
export const PHONE_REGEX = /^(?:\+94|0)(?:[ -]?\d){9}$/;
export const PHONE_HINT = 'Enter a valid phone number, e.g. 0771234567 or +94771234567';

export const isValidPhone = (value) => PHONE_REGEX.test(String(value || '').trim());
