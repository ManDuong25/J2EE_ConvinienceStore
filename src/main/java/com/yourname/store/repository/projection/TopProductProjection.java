package com.yourname.store.repository.projection;

import java.math.BigDecimal;

public interface TopProductProjection {

    Long getProductId();

    String getName();

    long getSoldQuantity();

    BigDecimal getRevenue();
}
