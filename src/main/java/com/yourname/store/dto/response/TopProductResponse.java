package com.yourname.store.dto.response;

import java.math.BigDecimal;

public record TopProductResponse(
        Long productId,
        String name,
        long soldQuantity,
        BigDecimal revenue) {
}
