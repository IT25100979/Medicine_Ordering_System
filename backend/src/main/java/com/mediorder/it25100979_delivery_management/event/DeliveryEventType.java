package com.mediorder.it25100979_delivery_management.event;

/** Everything that can happen to a delivery. Observers subscribe to the types they care about. */
public enum DeliveryEventType {
    /** Customer confirmed checkout and chose a courier partner. */
    DELIVERY_REQUESTED,
    /** Staff recorded a delivery manually from the delivery console. */
    DELIVERY_RECORDED,
    DELIVERY_APPROVED,
    DELIVERY_REJECTED,
    COURIER_ASSIGNED,
    OUT_FOR_DELIVERY,
    DELIVERED,
    DELIVERY_FAILED,
    OTP_VERIFICATION_FAILED,
    OTP_REGENERATED,
    PUT_ON_HOLD,
    POSTPONED,
    RESUMED,
    TERMINATED
}
