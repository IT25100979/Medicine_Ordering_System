package com.mediorder.it25101923_prescription_management.config;
import jakarta.servlet.MultipartConfigElement;
import org.springframework.boot.web.servlet.MultipartConfigFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.util.unit.DataSize;
@Configuration
public class PrescriptionConfig {
    @Bean
    MultipartConfigElement prescriptionMultipartConfig(
            @Value("${spring.servlet.multipart.max-file-size:10MB}") String fileSize,
            @Value("${spring.servlet.multipart.max-request-size:12MB}") String requestSize) {
        MultipartConfigFactory factory=new MultipartConfigFactory();
        factory.setMaxFileSize(DataSize.parse(fileSize));factory.setMaxRequestSize(DataSize.parse(requestSize));
        return factory.createMultipartConfig();
    }
}
