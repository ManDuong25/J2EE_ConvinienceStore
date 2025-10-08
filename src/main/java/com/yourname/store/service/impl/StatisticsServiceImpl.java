package com.yourname.store.service.impl;

import com.yourname.store.dto.response.RevenueStatsResponse;
import com.yourname.store.dto.response.TopProductResponse;
import com.yourname.store.repository.OrderItemRepository;
import com.yourname.store.repository.OrderRepository;
import com.yourname.store.repository.projection.RevenueStatsProjection;
import com.yourname.store.repository.projection.TopProductProjection;
import com.yourname.store.service.StatisticsService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class StatisticsServiceImpl implements StatisticsService {

    private static final LocalTime END_OF_DAY = LocalTime.of(23, 59, 59, 999_000_000);

    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    public List<RevenueStatsResponse> getDailyRevenueStats(LocalDate from, LocalDate to) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(END_OF_DAY);
        List<RevenueStatsProjection> projections =
                orderRepository.calculateDailyRevenue(fromDateTime, toDateTime);
        return projections.stream()
                .map(p -> new RevenueStatsResponse(p.getBucket(), p.getRevenue(), p.getOrderCount()))
                .toList();
    }

    @Override
    public List<TopProductResponse> getTopProducts(LocalDate from, LocalDate to, int limit) {
        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(END_OF_DAY);
        List<TopProductProjection> projections =
                orderItemRepository.findTopProducts(fromDateTime, toDateTime, limit);
        return projections.stream()
                .map(p -> new TopProductResponse(p.getProductId(), p.getName(), p.getSoldQuantity(), p.getRevenue()))
                .toList();
    }
}
