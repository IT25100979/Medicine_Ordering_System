package com.mediorder.system_build_functions.security;

import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Shared way for any module to find out who is calling, without each module
 * re-implementing SecurityContext parsing.
 */
@Component
public class CurrentUserProvider {

    private final UserRepository userRepository;

    public CurrentUserProvider(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || auth instanceof AnonymousAuthenticationToken) {
            return Optional.empty();
        }
        return userRepository.findByEmail(auth.getName());
    }

    public User requireCurrentUser() {
        return currentUser().orElseThrow(
                () -> new AuthenticationCredentialsNotFoundException("You must be logged in to perform this action"));
    }
}
