package com.yourname.store.mapper;

import com.yourname.store.dto.response.OrderItemResponse;
import com.yourname.store.dto.response.OrderResponse;
import com.yourname.store.dto.response.OrderSummaryResponse;
import com.yourname.store.dto.response.PaymentResponse;
import com.yourname.store.entity.Order;
import com.yourname.store.entity.OrderItem;
import com.yourname.store.entity.Payment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OrderMapper {

    @Mapping(target = "items", source = "items")
    @Mapping(target = "payments", source = "payments")
    @Mapping(target = "customerName", expression = "java(order.getUser() != null ? order.getUser().getName() : null)")
    @Mapping(target = "customerPhone", expression = "java(order.getUser() != null ? order.getUser().getPhone() : null)")
    @Mapping(target = "customerAddress", expression = "java(order.getUser() != null ? order.getUser().getAddress() : null)")
    OrderResponse toResponse(Order order);

    @Mapping(target = "itemCount", expression = "java(order.getItems() != null ? order.getItems().size() : 0)")
    OrderSummaryResponse toSummary(Order order);

    @Mapping(target = "productId", source = "product.id")
    @Mapping(target = "productCode", source = "product.code")
    @Mapping(target = "productName", source = "product.name")
    OrderItemResponse toOrderItemResponse(OrderItem item);

    PaymentResponse toPaymentResponse(Payment payment);
}
