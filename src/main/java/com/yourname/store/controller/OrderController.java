package com.yourname.store.controller;

import com.yourname.store.dto.request.CreateOrderRequest;
import com.yourname.store.dto.response.OrderResponse;
import com.yourname.store.dto.response.OrderSummaryResponse;
import com.yourname.store.dto.response.PageResponse;
import com.yourname.store.dto.response.PaymentUrlResponse;
import com.yourname.store.exception.BadRequestException;
import com.yourname.store.service.OrderService;
import com.yourname.store.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final PaymentService paymentService;

    @GetMapping
    public PageResponse<OrderSummaryResponse> searchOrders(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "from", required = false) String from,
            @RequestParam(value = "to", required = false) String to,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        System.out.println("Search Orders Request - Parameters:");
        System.out.println("code: " + code);
        System.out.println("from: " + from);
        System.out.println("to: " + to);
        System.out.println("page: " + page);
        System.out.println("size: " + size);

        LocalDateTime fromTimestamp = parseDateTime(from, true);
        LocalDateTime toTimestamp = parseDateTime(to, false);

        System.out.println("Parsed dates:");
        System.out.println("fromTimestamp: " + (fromTimestamp != null ? fromTimestamp.toString() : "null"));
        System.out.println("toTimestamp: " + (toTimestamp != null ? toTimestamp.toString() : "null"));

        if (fromTimestamp != null && toTimestamp != null && fromTimestamp.isAfter(toTimestamp)) {
            System.out.println("Swapping dates as from is after to");
            LocalDateTime temp = fromTimestamp;
            fromTimestamp = toTimestamp;
            toTimestamp = temp;
        }

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.max(size, 1),
                Sort.by(Sort.Direction.DESC, "orderDate"));

        PageResponse<OrderSummaryResponse> response = orderService.searchOrders(code, fromTimestamp, toTimestamp,
                pageable);
        System.out.println("Search result: Found " + response.totalElements() + " orders");

        return response;
    }

    @PostMapping
    public OrderResponse createOrder(@Valid @RequestBody CreateOrderRequest request) {
        return orderService.createOrder(request);
    }

    @GetMapping("/{id}")
    public OrderResponse getOrder(@PathVariable("id") Long id) {
        System.out.println("Fetching order with ID: " + id);
        OrderResponse orderResponse = orderService.getOrder(id);
        System.out.println("Order details: " + orderResponse);
        return orderResponse;
    }

    @PostMapping("/{id}/payments/vnpay")
    public PaymentUrlResponse initiateVnpayPayment(@PathVariable("id") Long id, HttpServletRequest request) {
        String clientIp = resolveClientIp(request);
        return paymentService.initiateVnpayPayment(id, clientIp);
    }

    private LocalDateTime parseDateTime(String value, boolean startOfDay) {
        System.out.println("Parsing date: " + value + " (startOfDay: " + startOfDay + ")");

        if (!StringUtils.hasText(value)) {
            System.out.println("Value is empty, returning null");
            return null;
        }

        try {
            String candidate = value.trim();
            System.out.println("Trimmed value: " + candidate);

            if (candidate.contains(" ") && !candidate.contains("T")) {
                candidate = candidate.replace(' ', 'T');
                System.out.println("Replaced space with T: " + candidate);
            }

            // Try to parse as LocalDateTime
            try {
                LocalDateTime result = LocalDateTime.parse(candidate);
                System.out.println("Successfully parsed with default formatter: " + result);
                return result;
            } catch (DateTimeParseException e) {
                System.out.println("Default parse failed: " + e.getMessage());

                // If standard format fails, try with formatter
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
                LocalDateTime result = LocalDateTime.parse(candidate, formatter);
                System.out.println("Successfully parsed with custom formatter: " + result);
                return result;
            }
        } catch (DateTimeParseException ignored) {
            System.out.println("All LocalDateTime parsing failed, trying LocalDate");

            try {
                LocalDate date = LocalDate.parse(value);
                LocalDateTime result = startOfDay
                        ? date.atStartOfDay()
                        : date.atTime(LocalTime.of(23, 59, 59, 999_000_000));
                System.out.println("Successfully parsed as LocalDate and converted to LocalDateTime: " + result);
                return result;
            } catch (DateTimeParseException ex) {
                System.err.println("Failed to parse date: " + value + " - " + ex.getMessage());
                throw new BadRequestException("Invalid date format: " + value);
            }
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
