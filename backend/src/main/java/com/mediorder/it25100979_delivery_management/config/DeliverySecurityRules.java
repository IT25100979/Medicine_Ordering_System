package com.mediorder.it25100979_delivery_management.config;

import com.mediorder.system_build_functions.security.ModuleSecurityRules;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * URL rules for the Delivery Management module, plugged into the core SecurityConfig.
 * Controllers repeat the same roles with @PreAuthorize (defence in depth).
 */
@Component
public class DeliverySecurityRules implements ModuleSecurityRules {

    public static final String[] COORDINATOR_ROLES = {"DELIVERY_COORDINATOR", "ADMIN", "SYSTEM_ADMIN"};
    public static final String[] COURIER_ROLES = {"DELIVERY_RIDER", "DELIVERY_COORDINATOR", "ADMIN", "SYSTEM_ADMIN"};

    @Override
    public void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth) {
        // Zones/routes and courier partner list are needed by the storefront before login.
        auth.requestMatchers(HttpMethod.GET,
                "/api/delivery-zones", "/api/delivery-zones/**",
                "/api/v1/delivery-zones", "/api/v1/delivery-zones/**",
                "/api/v1/customer/deliveries/courier-partners"
        ).permitAll();
        auth.requestMatchers(
                "/api/delivery-zones", "/api/delivery-zones/**",
                "/api/v1/delivery-zones", "/api/v1/delivery-zones/**"
        ).hasAnyRole(COORDINATOR_ROLES);

        // Customer checkout + tracking
        auth.requestMatchers("/api/v1/customer/deliveries", "/api/v1/customer/deliveries/**").hasRole("CUSTOMER");

        // Delivery Management console
        auth.requestMatchers(
                "/api/deliveries", "/api/deliveries/**",
                "/api/v1/deliveries", "/api/v1/deliveries/**"
        ).hasAnyRole(COORDINATOR_ROLES);

        // Courier work queue
        auth.requestMatchers(
                "/api/courier", "/api/courier/**",
                "/api/v1/courier", "/api/v1/courier/**"
        ).hasAnyRole(COURIER_ROLES);
    }
}
