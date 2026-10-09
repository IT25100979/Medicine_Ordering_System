package com.mediorder.it25103946_order_processing_and_workflow.config;

import com.mediorder.system_build_functions.security.ModuleSecurityRules;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * URL rules for the cart & order module.
 * The cart is open to guests (session cart); order endpoints require login and are
 * further restricted with @PreAuthorize in OrderController.
 */
@Component
public class OrderWorkflowSecurityRules implements ModuleSecurityRules {

    @Override
    public void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth) {
        auth.requestMatchers(
                "/api/cart",
                "/api/cart/**",
                "/api/v1/cart",
                "/api/v1/cart/**"
        ).permitAll();
    }
}
