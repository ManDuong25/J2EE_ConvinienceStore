package com.yourname.store.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.yourname.store.dto.response.RevenueStatsResponse;
import com.yourname.store.dto.response.TopProductResponse;
import com.yourname.store.repository.OrderItemRepository;
import com.yourname.store.repository.OrderRepository;
import com.yourname.store.repository.projection.RevenueStatsProjection;
import com.yourname.store.repository.projection.TopProductProjection;
import com.yourname.store.service.impl.StatisticsServiceImpl;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class StatisticsServiceImplTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderItemRepository orderItemRepository;

    @InjectMocks
    private StatisticsServiceImpl statisticsService;

    @Test
    void getDailyRevenueStats_shouldMapProjectionData() {
        LocalDate from = LocalDate.of(2025, 1, 1);
        LocalDate to = LocalDate.of(2025, 1, 31);

        RevenueStatsProjection projection = new RevenueStatsProjection() {
            @Override
            public String getBucket() {
                return "2025-01-15";
            }

            @Override
            public BigDecimal getRevenue() {
                return new BigDecimal("1200000");
            }

            @Override
            public long getOrderCount() {
                return 5;
            }
        };

        when(orderRepository.calculateDailyRevenue(from.atStartOfDay(), to.atTime(23, 59, 59, 999_000_000)))
                .thenReturn(List.of(projection));

        List<RevenueStatsResponse> responses = statisticsService.getDailyRevenueStats(from, to);

        assertThat(responses).hasSize(1);
        RevenueStatsResponse response = responses.get(0);
        assertThat(response.bucket()).isEqualTo("2025-01-15");
        assertThat(response.revenue()).isEqualByComparingTo("1200000");
        assertThat(response.orderCount()).isEqualTo(5);
    }

    @Test
    void getTopProducts_shouldReturnOrderedData() {
        LocalDate from = LocalDate.of(2025, 2, 1);
        LocalDate to = LocalDate.of(2025, 2, 28);

        TopProductProjection projection = new TopProductProjection() {
            @Override
            public Long getProductId() {
                return 1L;
            }

            @Override
            public String getName() {
                return "Bottled Water";
            }

            @Override
            public long getSoldQuantity() {
                return 25;
            }

            @Override
            public BigDecimal getRevenue() {
                return new BigDecimal("250000");
            }
        };

        when(orderItemRepository.findTopProducts(from.atStartOfDay(), to.atTime(23, 59, 59, 999_000_000), 5))
                .thenReturn(List.of(projection));

        List<TopProductResponse> responses = statisticsService.getTopProducts(from, to, 5);

        assertThat(responses).hasSize(1);
        TopProductResponse result = responses.get(0);
        assertThat(result.productId()).isEqualTo(1L);
        assertThat(result.name()).isEqualTo("Bottled Water");
        assertThat(result.soldQuantity()).isEqualTo(25);
        assertThat(result.revenue()).isEqualByComparingTo("250000");
    }
}

