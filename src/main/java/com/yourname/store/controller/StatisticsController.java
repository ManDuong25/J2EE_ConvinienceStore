package com.yourname.store.controller;

import com.yourname.store.dto.response.RevenueStatsResponse;
import com.yourname.store.dto.response.TopProductResponse;
import com.yourname.store.service.StatisticsService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stats")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/revenue")
    public List<RevenueStatsResponse> getRevenue(
            @RequestParam(value = "from", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(value = "to", required = false)
                    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        LocalDate today = LocalDate.now();
        LocalDate defaultFrom = today.withDayOfMonth(1);
        LocalDate effectiveFrom = from != null ? from : defaultFrom;
        LocalDate effectiveTo = to != null ? to : today;
        validateRange(effectiveFrom, effectiveTo);
        return statisticsService.getDailyRevenueStats(effectiveFrom, effectiveTo);
    }

    @GetMapping("/top-products")
    public List<TopProductResponse> getTopProducts(
            @RequestParam("from") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam("to") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        validateRange(from, to);
        int sanitizedLimit = Math.max(1, Math.min(limit, 100));
        return statisticsService.getTopProducts(from, to, sanitizedLimit);
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (to.isBefore(from)) {
            throw new IllegalArgumentException("Parameter 'to' must be greater than or equal to 'from'");
        }
    }
}
