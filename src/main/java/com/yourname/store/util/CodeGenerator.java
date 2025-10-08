package com.yourname.store.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.UUID;
import lombok.experimental.UtilityClass;

@UtilityClass
public class CodeGenerator {

    private static final DateTimeFormatter ORDER_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss", Locale.US);

    public String generateOrderCode() {
        return "ORD-" + LocalDateTime.now().format(ORDER_FORMATTER) + "-" + randomSuffix();
    }

    public String generateTxnRef() {
        return "PAY" + LocalDateTime.now().format(ORDER_FORMATTER) + randomSuffix();
    }

    private String randomSuffix() {
        return UUID.randomUUID().toString().replaceAll("-", "").substring(0, 6).toUpperCase(Locale.US);
    }
}
