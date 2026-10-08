# Antigravity Prompt: Restrict Component & Entity Scanning to Canonical Package

Please clean up the root package configuration in the Spring Boot backend to eliminate multi-package scanning conflicts and duplicate bean declarations.

### 1. Update Main Application Class
Locate the primary `@SpringBootApplication` entry point class (e.g., `backend/src/main/java/com/mediorder/MediorderApplication.java` or `OnlinePharmacyApplication.java`):
- Restrict `@ComponentScan`, `@EntityScan`, and `@EnableJpaRepositories` to standard canonical packages under `com.mediorder`:
  ```java
  package com.mediorder;

  import org.springframework.boot.SpringApplication;
  import org.springframework.boot.autoconfigure.SpringBootApplication;
  import org.springframework.boot.autoconfigure.domain.EntityScan;
  import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

  @SpringBootApplication
  @EntityScan(basePackages = "com.mediorder.model")
  @EnableJpaRepositories(basePackages = "com.mediorder.repository")
  public class MediorderApplication {
      public static void main(String[] args) {
          SpringApplication.run(MediorderApplication.class, args);
      }
  }