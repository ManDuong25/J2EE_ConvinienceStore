package com.yourname.store.report;

import java.math.BigDecimal;

public record InvoiceItem(
        String productCode,
        String productName,
        Integer quantity,
        BigDecimal unitPrice,
        BigDecimal lineTotal) {
}
