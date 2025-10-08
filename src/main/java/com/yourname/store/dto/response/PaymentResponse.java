package com.yourname.store.dto.response;

import com.yourname.store.entity.PaymentProvider;
import com.yourname.store.entity.PaymentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentResponse(
        Long id,
        PaymentProvider provider,
        String txnRef,
        BigDecimal amount,
        String currency,
        PaymentStatus status,
        String bankCode,
        LocalDateTime payDate) {
}
