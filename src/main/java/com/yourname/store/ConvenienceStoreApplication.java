package com.yourname.store;

import com.yourname.store.payment.VnpayProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(VnpayProperties.class)
public class ConvenienceStoreApplication {

    public static void main(String[] args) {
        SpringApplication.run(ConvenienceStoreApplication.class, args);
    }
}
