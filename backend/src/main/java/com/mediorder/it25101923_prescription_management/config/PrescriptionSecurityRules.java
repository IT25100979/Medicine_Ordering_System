package com.mediorder.it25101923_prescription_management.config;

import com.mediorder.system_build_functions.security.ModuleSecurityRules;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;
import org.springframework.stereotype.Component;

/**
 * URL rules for the prescription module. Prescription files are served by
 * their (unguessable) stored file name; every other endpoint requires login.
 */
@Component
public class PrescriptionSecurityRules implements ModuleSecurityRules {

    @Override
    public void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth) {
        auth.requestMatchers(
                "/api/prescriptions/files/**",
                "/api/v1/prescriptions/files/**"
        ).permitAll();
    }
}
