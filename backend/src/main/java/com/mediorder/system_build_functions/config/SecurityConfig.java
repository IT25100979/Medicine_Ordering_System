package com.mediorder.system_build_functions.config;

import com.mediorder.system_build_functions.security.ModuleSecurityRules;
import com.mediorder.system_build_functions.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.util.List;

/**
 * Core security configuration.
 *
 * This class deliberately knows nothing about feature modules (delivery, prescriptions, stock...).
 * Each module contributes its own URL rules through a {@link ModuleSecurityRules} bean, and can
 * additionally use {@code @PreAuthorize} on its controllers. That keeps the auth system
 * independent while still being applied to every module.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final SecurityErrorHandlers securityErrorHandlers;
    private final List<ModuleSecurityRules> moduleSecurityRules;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomUserDetailsService userDetailsService,
            SecurityErrorHandlers securityErrorHandlers,
            List<ModuleSecurityRules> moduleSecurityRules) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.securityErrorHandlers = securityErrorHandlers;
        this.moduleSecurityRules = moduleSecurityRules;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(securityErrorHandlers.authenticationEntryPoint())
                        .accessDeniedHandler(securityErrorHandlers.accessDeniedHandler()))
                .authorizeHttpRequests(auth -> {
                    // 1. Core public endpoints owned by the auth/system module
                    auth.requestMatchers(
                            "/api/health",
                            "/api/health/**",
                            "/api/v1/health",
                            "/api/v1/health/**",
                            "/api/auth/**",
                            "/api/v1/auth/**",
                            "/api/realtime/**",
                            "/api/v1/realtime/**",
                            "/error"
                    ).permitAll();
                    auth.requestMatchers(HttpMethod.GET,
                            "/api/reviews",
                            "/api/reviews/**",
                            "/api/v1/reviews",
                            "/api/v1/reviews/**"
                    ).permitAll();

                    // 2. Core admin endpoints
                    auth.requestMatchers(
                            "/api/audit-logs/**",
                            "/api/v1/audit-logs/**",
                            "/api/error-logs/**",
                            "/api/v1/error-logs/**",
                            "/api/feature-flags/**",
                            "/api/v1/feature-flags/**",
                            "/api/admin/system/**",
                            "/api/v1/admin/system/**"
                    ).hasAnyRole("ADMIN", "SYSTEM_ADMIN", "IT_MANAGER");

                    // 3. Rules contributed by each feature module
                    moduleSecurityRules.forEach(rules -> rules.configure(auth));

                    // 4. Everything else requires a valid JWT
                    auth.anyRequest().authenticated();
                })
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
