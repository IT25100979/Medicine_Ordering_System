package com.mediorder.system_build_functions.config;

import com.mediorder.system_build_functions.service.CustomUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
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
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CustomUserDetailsService userDetailsService;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            CustomUserDetailsService userDetailsService,
            CorsConfigurationSource corsConfigurationSource) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.userDetailsService = userDetailsService;
        this.corsConfigurationSource = corsConfigurationSource;
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
                .cors(org.springframework.security.config.Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/health",
                                "/api/v1/health",
                                "/api/auth/**",
                                "/api/v1/auth/**",
                                "/api/realtime/**",
                                "/api/v1/realtime/**",
                                "/api/delivery-zones",
                                "/api/delivery-zones/**",
                                "/api/v1/delivery-zones",
                                "/api/v1/delivery-zones/**",
                                "/api/cart",
                                "/api/cart/**",
                                "/api/v1/cart",
                                "/api/v1/cart/**",
                                "/api/prescriptions/files/**",
                                "/api/v1/prescriptions/files/**",
                                "/error"
                        ).permitAll()
                        .requestMatchers(HttpMethod.GET,
                                "/api/medicines",
                                "/api/medicines/**",
                                "/api/v1/medicines",
                                "/api/v1/medicines/**",
                                "/api/reviews",
                                "/api/reviews/**",
                                "/api/v1/reviews",
                                "/api/v1/reviews/**"
                        ).permitAll()
                        .requestMatchers(
                                "/api/medicines/stats",
                                "/api/v1/medicines/stats"
                        ).hasAnyRole("OPERATIONS_MANAGER", "ADMIN", "SYSTEM_ADMIN")
                        .requestMatchers(
                                "/api/medicines",
                                "/api/medicines/**",
                                "/api/v1/medicines",
                                "/api/v1/medicines/**"
                        ).hasAnyRole("OPERATIONS_MANAGER", "ADMIN", "SYSTEM_ADMIN")
                        .requestMatchers(HttpMethod.GET,
                                "/api/deliveries",
                                "/api/deliveries/**",
                                "/api/v1/deliveries",
                                "/api/v1/deliveries/**",
                                "/api/courier",
                                "/api/courier/**"
                        ).permitAll()
                        .requestMatchers(
                                "/api/courier",
                                "/api/courier/**"
                        ).permitAll()
                        .requestMatchers(
                                "/api/deliveries",
                                "/api/deliveries/**",
                                "/api/v1/deliveries",
                                "/api/v1/deliveries/**"
                        ).hasAnyRole("DELIVERY_COORDINATOR", "ADMIN", "SYSTEM_ADMIN", "CHIEF_PHARMACIST", "OPERATIONS_MANAGER", "FINANCE_MANAGER", "DELIVERY_RIDER")
                        .requestMatchers(
                                "/api/audit-logs/**",
                                "/api/v1/audit-logs/**",
                                "/api/error-logs/**",
                                "/api/v1/error-logs/**",
                                "/api/feature-flags/**",
                                "/api/v1/feature-flags/**",
                                "/api/admin/system/**",
                                "/api/v1/admin/system/**"
                        ).hasAnyRole("ADMIN", "SYSTEM_ADMIN", "IT_MANAGER")
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}


