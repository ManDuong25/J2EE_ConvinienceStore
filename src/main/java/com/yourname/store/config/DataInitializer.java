package com.yourname.store.config;

import com.yourname.store.entity.Category;
import com.yourname.store.entity.Product;
import com.yourname.store.entity.ProductStatus;
import com.yourname.store.repository.CategoryRepository;
import com.yourname.store.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (productRepository.count() > 0) {
            return;
        }

        log.info("Seeding default categories and products");

        Map<String, Category> categories = new LinkedHashMap<>();
        categories.put("Beverages", createCategoryIfNotExists("Beverages"));
        categories.put("Snacks", createCategoryIfNotExists("Snacks"));
        categories.put("Dairy", createCategoryIfNotExists("Dairy"));

        createProductIfNotExists("P0001", "Bottled Water 500ml", categories.get("Beverages"), BigDecimal.valueOf(8000), 200);
        createProductIfNotExists("P0002", "Sparkling Water 500ml", categories.get("Beverages"), BigDecimal.valueOf(12000), 150);
        createProductIfNotExists("P1001", "Potato Chips Original", categories.get("Snacks"), BigDecimal.valueOf(18000), 120);
        createProductIfNotExists("P1002", "Chocolate Bar 55g", categories.get("Snacks"), BigDecimal.valueOf(22000), 100);
        createProductIfNotExists("P2001", "Fresh Milk 1L", categories.get("Dairy"), BigDecimal.valueOf(32000), 80);
    }

    private Category createCategoryIfNotExists(String name) {
        return categoryRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> categoryRepository.save(Category.builder().name(name).build()));
    }

    private void createProductIfNotExists(String code, String name, Category category, BigDecimal price, int stock) {
        productRepository.findByCode(code).ifPresentOrElse(
                existing -> {},
                () -> productRepository.save(Product.builder()
                        .code(code)
                        .name(name)
                        .category(category)
                        .price(price)
                        .stockQty(stock)
                        .status(ProductStatus.ACTIVE)
                        .build()));
    }
}

