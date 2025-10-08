package com.yourname.store;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourname.store.dto.request.CreateOrderRequest;
import com.yourname.store.dto.request.OrderItemRequest;
import com.yourname.store.dto.response.OrderResponse;
import com.yourname.store.dto.response.PageResponse;
import com.yourname.store.dto.response.ProductResponse;
import com.yourname.store.service.OrderService;
import com.yourname.store.service.ProductService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest
class OrderFlowIntegrationTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.3")
            .withDatabaseName("convenience_store_test")
            .withUsername("test")
            .withPassword("test");

    @DynamicPropertySource
    static void dataSourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> MYSQL.getJdbcUrl() + "?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=UTF-8&serverTimezone=UTC");
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
        registry.add("spring.flyway.enabled", () -> true);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "none");
    }

    @Autowired
    private ProductService productService;

    @Autowired
    private OrderService orderService;

    @Test
    void createOrder_persistsAndRetrievesDetails() {
        PageResponse<ProductResponse> products = productService.searchProducts(null, null, PageRequest.of(0, 1, Sort.by("id")));
        assertThat(products.content()).isNotEmpty();
        ProductResponse product = products.content().get(0);

        OrderItemRequest itemRequest = new OrderItemRequest();
        itemRequest.setProductId(product.id());
        itemRequest.setQuantity(2);

        CreateOrderRequest orderRequest = new CreateOrderRequest();
        orderRequest.setCustomerName("Integration Tester");
        orderRequest.setCustomerPhone("0900000000");
        orderRequest.setCustomerAddress("Ho Chi Minh City");
        orderRequest.setNote("Test order");
        orderRequest.setItems(List.of(itemRequest));

        OrderResponse created = orderService.createOrder(orderRequest);
        assertThat(created.code()).isNotBlank();
        assertThat(created.items()).hasSize(1);
        assertThat(created.totalAmount()).isPositive();

        OrderResponse fetched = orderService.getOrder(created.id());
        assertThat(fetched.code()).isEqualTo(created.code());
        assertThat(fetched.items().get(0).quantity()).isEqualTo(2);
    }
}

