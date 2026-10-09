package com.mediorder.it25100979_delivery_management.service;

import com.mediorder.it25100979_delivery_management.dto.response.CourierAccountResponse;
import com.mediorder.it25100979_delivery_management.entity.CourierProfile;
import com.mediorder.it25100979_delivery_management.enums.CourierCompany;
import com.mediorder.it25100979_delivery_management.repository.CourierProfileRepository;
import com.mediorder.system_build_functions.model.Role;
import com.mediorder.system_build_functions.model.User;
import com.mediorder.system_build_functions.repository.UserRepository;
import com.mediorder.system_build_functions.security.CurrentUserProvider;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

/**
 * Courier logins. A user with role DELIVERY_RIDER works for one courier company and may only
 * see and update parcels assigned to that company. Coordinators/admins are not restricted.
 */
@Service
@Transactional
public class CourierAccountService {

    private final CourierProfileRepository courierProfileRepository;
    private final UserRepository userRepository;
    private final CurrentUserProvider currentUserProvider;

    public CourierAccountService(CourierProfileRepository courierProfileRepository,
                                 UserRepository userRepository,
                                 CurrentUserProvider currentUserProvider) {
        this.courierProfileRepository = courierProfileRepository;
        this.userRepository = userRepository;
        this.currentUserProvider = currentUserProvider;
    }

    /**
     * The company the caller is restricted to: empty for coordinators/admins (see everything),
     * the linked company for a courier. A courier without a company link is refused.
     */
    @Transactional(readOnly = true)
    public Optional<String> restrictedCompanyForCaller() {
        User me = currentUserProvider.requireCurrentUser();
        if (me.getRole() != Role.DELIVERY_RIDER) {
            return Optional.empty();
        }
        return Optional.of(courierProfileRepository.findByUserId(me.getId())
                .map(CourierProfile::getCourierCompany)
                .orElseThrow(() -> new AccessDeniedException(
                        "Your courier account is not linked to a courier company yet. Ask the Delivery Coordinator.")));
    }

    @Transactional(readOnly = true)
    public CourierAccountResponse me() {
        User me = currentUserProvider.requireCurrentUser();
        return toResponse(me);
    }

    @Transactional(readOnly = true)
    public List<CourierAccountResponse> listCouriers() {
        return userRepository.findByRole(Role.DELIVERY_RIDER).stream().map(this::toResponse).toList();
    }

    public CourierAccountResponse linkCourier(Long userId, String courierCompany) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getRole() == Role.DELIVERY_RIDER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Courier account not found: " + userId));
        String company = CourierCompany.fromString(courierCompany).getDisplayName();
        CourierProfile profile = courierProfileRepository.findByUserId(userId)
                .orElseGet(() -> CourierProfile.builder().userId(userId).build());
        profile.setCourierCompany(company);
        courierProfileRepository.save(profile);
        return toResponse(user);
    }

    private CourierAccountResponse toResponse(User user) {
        String company = courierProfileRepository.findByUserId(user.getId())
                .map(CourierProfile::getCourierCompany)
                .orElse(null);
        return new CourierAccountResponse(user.getId(), user.getFullName(), user.getEmail(),
                user.getStatus() != null ? user.getStatus().name() : null, company);
    }
}
