package com.yourname.store.dto.response;

import com.yourname.store.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record OrderResponse(
        Long id,
        String code,
        String customerName,
        String customerPhone,
        String customerAddress,
        LocalDateTime orderDate,
        OrderStatus status,
        BigDecimal totalAmount,
        String note,
        List<OrderItemResponse> items,
        List<PaymentResponse> payments) {
}
