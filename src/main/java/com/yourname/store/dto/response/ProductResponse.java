package com.yourname.store.dto.response;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.yourname.store.entity.ProductStatus;

public record ProductResponse(
        Long id,
        String code,
        String name,
        Long categoryId,
        String categoryName,
        BigDecimal price,
        Integer stockQty,
        ProductStatus status,
        LocalDateTime createdAt) {
}
