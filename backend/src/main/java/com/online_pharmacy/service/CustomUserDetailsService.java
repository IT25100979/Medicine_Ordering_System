package com.online_pharmacy.service;

import com.mediorder.model.User;
import com.online_pharmacy.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        List<GrantedAuthority> authorities = new ArrayList<>();
        String roleName = user.getRole() != null ? user.getRole().name() : "CUSTOMER";
        
        authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName));
        authorities.add(new SimpleGrantedAuthority(roleName));

        if (roleName.equalsIgnoreCase("DELIVERY_COORDINATOR")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_DELIVERY_COORDINATOR"));
            authorities.add(new SimpleGrantedAuthority("DELIVERY_COORDINATOR"));
            authorities.add(new SimpleGrantedAuthority("ROLE_COORDINATOR"));
            authorities.add(new SimpleGrantedAuthority("COORDINATOR"));
        } else if (roleName.equalsIgnoreCase("ADMIN")) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            authorities.add(new SimpleGrantedAuthority("ADMIN"));
        }

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPasswordHash(),
                authorities
        );
    }
}
