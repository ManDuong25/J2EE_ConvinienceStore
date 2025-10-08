package com.yourname.store.repository.projection;

import java.math.BigDecimal;

public interface RevenueStatsProjection {

    String getBucket();

    BigDecimal getRevenue();

    long getOrderCount();
}

