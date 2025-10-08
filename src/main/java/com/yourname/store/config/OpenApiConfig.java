package com.yourname.store.config;

import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI convenienceStoreOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Convenience Store API")
                        .description("Backend APIs for managing products, orders, payments and reports")
                        .version("v1.0.0")
                        .contact(new Contact().name("Convenience Store").email("support@example.com")))
                .externalDocs(new ExternalDocumentation()
                        .description("Swagger UI")
                        .url("/swagger-ui/index.html"));
    }
}
