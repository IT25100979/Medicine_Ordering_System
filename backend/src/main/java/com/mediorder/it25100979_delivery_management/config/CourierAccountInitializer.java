package com.mediorder.it25100979_delivery_management.config;

import com.mediorder.it25100979_delivery_management.entity.CourierProfile;
import com.mediorder.it25100979_delivery_management.enums.CourierCompany;
import com.mediorder.it25100979_delivery_management.repository.CourierProfileRepository;
import com.mediorder.system_build_functions.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Links the demo courier (courier1@gmail.com) to "In Company Delivery".
 * Runs after the global user seeder, which re-creates users on every start.
 */
@Component
@Order(10)
public class CourierAccountInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(CourierAccountInitializer.class);
    static final String DEMO_COURIER_EMAIL = "courier1@gmail.com";

    private final UserRepository userRepository;
    private final CourierProfileRepository courierProfileRepository;

    public CourierAccountInitializer(UserRepository userRepository, CourierProfileRepository courierProfileRepository) {
        this.userRepository = userRepository;
        this.courierProfileRepository = courierProfileRepository;
    }

    @Override
    public void run(String... args) {
        userRepository.findByEmail(DEMO_COURIER_EMAIL).ifPresent(courier -> {
            CourierProfile profile = courierProfileRepository.findByUserId(courier.getId())
                    .orElseGet(() -> CourierProfile.builder().userId(courier.getId()).build());
            profile.setCourierCompany(CourierCompany.IN_COMPANY_DELIVERY.getDisplayName());
            courierProfileRepository.save(profile);
            log.info("Demo courier {} linked to {}", DEMO_COURIER_EMAIL, profile.getCourierCompany());
        });
    }
}
