package com.mediorder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(scanBasePackages = {"com.mediorder", "com.online_pharmacy"})
@EntityScan(basePackages = "com.mediorder.model")
@EnableJpaRepositories(basePackages = {"com.mediorder.repository", "com.online_pharmacy.repository"})
public class MediorderApplication {
    public static void main(String[] args) {
        SpringApplication.run(MediorderApplication.class, args);
    }
}
