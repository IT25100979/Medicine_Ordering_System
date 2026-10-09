package com.mediorder;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.PropertiesLoaderUtils;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.IOException;
import java.util.Properties;

@SpringBootApplication(scanBasePackages = "com.mediorder")
@EntityScan(basePackages = "com.mediorder")
@EnableJpaRepositories(basePackages = "com.mediorder")
@EnableScheduling
public class MediorderApplication {

    public static void main(String[] args) {
        SpringApplication app = new SpringApplication(MediorderApplication.class);
        // Lowest-precedence fallbacks: a fresh clone starts without a local application.yml,
        // while anyone's own application.yml / env vars still override every value.
        app.setDefaultProperties(loadDefaults());
        app.run(args);
    }

    static Properties loadDefaults() {
        try {
            return PropertiesLoaderUtils.loadProperties(new ClassPathResource("mediorder-defaults.properties"));
        } catch (IOException ex) {
            return new Properties();
        }
    }
}
