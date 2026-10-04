package com.mediorder.model;

public enum Role {
    CUSTOMER,
    PHARMACIST,
    DELIVERY_RIDER,
    ADMIN,
    DELIVERY_COORDINATOR,
    CHIEF_PHARMACIST,
    OPERATIONS_MANAGER,
    FINANCE_MANAGER;

    public boolean isAdminRole() {
        return this != CUSTOMER;
    }
}
