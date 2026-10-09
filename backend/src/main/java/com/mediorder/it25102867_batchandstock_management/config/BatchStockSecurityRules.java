package com.mediorder.it25102867_batchandstock_management.config;

import com.mediorder.system_build_functions.security.ModuleSecurityRules;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * URL rules for the batch & stock / catalog module.
 * Storefront browsing is public; catalog changes are restricted to operations staff.
 */
@Component
public class BatchStockSecurityRules implements ModuleSecurityRules {

    @Override
    public void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth) {
        auth.requestMatchers(HttpMethod.GET,
                "/api/medicines",
                "/api/medicines/**",
                "/api/v1/medicines",
                "/api/v1/medicines/**"
        ).permitAll();
        auth.requestMatchers(
                "/api/medicines",
                "/api/medicines/**",
                "/api/v1/medicines",
                "/api/v1/medicines/**"
        ).hasAnyRole("OPERATIONS_MANAGER", "ADMIN", "SYSTEM_ADMIN");
    }
}
