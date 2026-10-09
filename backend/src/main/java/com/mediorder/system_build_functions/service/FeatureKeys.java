package com.mediorder.system_build_functions.service;

/** Names of the System Admin kill switches (feature_flags.flag_key). */
public final class FeatureKeys {
    public static final String ORDERING = "ORDERING";
    public static final String DELIVERY = "DELIVERY";
    public static final String PRESCRIPTIONS = "PRESCRIPTIONS";
    public static final String REFILLS = "REFILLS";
    public static final String STOCK_INTAKE = "STOCK_INTAKE";

    private FeatureKeys() {
    }
}
