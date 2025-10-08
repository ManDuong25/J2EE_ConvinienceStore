package com.yourname.store.dto.response;

import com.yourname.store.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record OrderSummaryResponse(
        Long id,
        String code,
        OrderStatus status,
        String customerName,
        BigDecimal totalAmount,
        LocalDateTime orderDate,
        int itemCount) {
}

