package com.mediorder.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI mediOrderOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("MediOrder REST API")
                        .description("Order Management and First-Expired-First-Out (FEFO) Inventory Allocation Engine for SLIIT SE2030")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("MediOrder Team")
                                .email("it25102867@my.sliit.lk"))
                        .license(new License()
                                .name("Educational Use Only - SLIIT")
                                .url("https://www.sliit.lk")));
    }
}
