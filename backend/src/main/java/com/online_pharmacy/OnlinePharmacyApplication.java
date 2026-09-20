package com.online_pharmacy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"com.online_pharmacy", "com.mediorder"})
@EntityScan(basePackages = {"com.online_pharmacy.model", "com.mediorder.model"})
@EnableJpaRepositories(basePackages = {"com.online_pharmacy.repository", "com.mediorder.repository"})
public class OnlinePharmacyApplication {

    public static void main(String[] args) {
        SpringApplication.run(OnlinePharmacyApplication.class, args);
    }
}
