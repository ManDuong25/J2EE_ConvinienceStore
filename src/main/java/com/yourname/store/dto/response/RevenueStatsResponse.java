package com.yourname.store.dto.response;

import java.math.BigDecimal;

public record RevenueStatsResponse(String bucket, BigDecimal revenue, long orderCount) {
}
