package com.yourname.store.service;

import com.yourname.store.dto.response.RevenueStatsResponse;
import com.yourname.store.dto.response.TopProductResponse;
import java.time.LocalDate;
import java.util.List;

public interface StatisticsService {

    List<RevenueStatsResponse> getDailyRevenueStats(LocalDate from, LocalDate to);

    List<TopProductResponse> getTopProducts(LocalDate from, LocalDate to, int limit);
}
