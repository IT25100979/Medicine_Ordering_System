package com.mediorder.system_build_functions.model;

public enum Role {
    CUSTOMER,
    PHARMACIST,
    DELIVERY_RIDER,
    ADMIN,
    DELIVERY_COORDINATOR,
    CHIEF_PHARMACIST,
    OPERATIONS_MANAGER,
    FINANCE_MANAGER,
    IT_MANAGER,
    SYSTEM_ADMIN;

    public boolean isAdminRole() {
        return this != CUSTOMER;
    }
}

