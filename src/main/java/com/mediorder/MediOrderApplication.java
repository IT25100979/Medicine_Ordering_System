package com.mediorder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MediOrderApplication {

    public static void main(String[] args) {
        SpringApplication.run(MediOrderApplication.class, args);
    }
}
