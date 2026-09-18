package com.medilink;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.medilink")
public class MediLinkApplication {
    public static void main(String[] args) {
        SpringApplication.run(MediLinkApplication.class, args);
    }
}