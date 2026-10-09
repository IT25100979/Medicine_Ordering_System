package com.mediorder.system_build_functions.security;

import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AuthorizeHttpRequestsConfigurer;

/**
 * Extension point that keeps the core auth system independent of feature modules.
 *
 * The core {@code SecurityConfig} only knows about authentication (JWT, entry points,
 * public auth/health endpoints). Each feature module publishes a Spring bean implementing
 * this interface to declare the URL rules for its own endpoints. The core config collects
 * every bean and applies them before its final "any other request must be authenticated" rule.
 *
 * Use {@link org.springframework.core.annotation.Order} on implementations if rule order matters.
 */
public interface ModuleSecurityRules {

    void configure(AuthorizeHttpRequestsConfigurer<HttpSecurity>.AuthorizationManagerRequestMatcherRegistry auth);
}
