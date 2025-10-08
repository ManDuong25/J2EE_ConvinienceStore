package com.yourname.store.service;

import com.yourname.store.dto.request.CreateOrderRequest;
import com.yourname.store.dto.response.OrderResponse;
import com.yourname.store.dto.response.OrderSummaryResponse;
import com.yourname.store.dto.response.PageResponse;
import com.yourname.store.entity.Order;
import java.time.LocalDateTime;
import org.springframework.data.domain.Pageable;

public interface OrderService {

    OrderResponse createOrder(CreateOrderRequest request);

    OrderResponse getOrder(Long id);

    Order getOrderEntity(Long id);

    void handleOrderPaid(Order order);

    void handleOrderCanceled(Order order);

    PageResponse<OrderSummaryResponse> searchOrders(String code, LocalDateTime from, LocalDateTime to,
            Pageable pageable);
}
