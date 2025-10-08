package com.yourname.store.service.impl;

import com.yourname.store.dto.request.CreateOrderRequest;
import com.yourname.store.dto.request.OrderItemRequest;
import com.yourname.store.dto.response.OrderResponse;
import com.yourname.store.dto.response.OrderSummaryResponse;
import com.yourname.store.dto.response.PageResponse;
import com.yourname.store.entity.Order;
import com.yourname.store.entity.OrderItem;
import com.yourname.store.entity.OrderStatus;
import com.yourname.store.entity.Product;
import com.yourname.store.entity.ProductStatus;
import com.yourname.store.entity.User;
import com.yourname.store.exception.BadRequestException;
import com.yourname.store.exception.NotFoundException;
import com.yourname.store.mapper.OrderMapper;
import com.yourname.store.repository.OrderRepository;
import com.yourname.store.repository.ProductRepository;
import com.yourname.store.service.OrderService;
import com.yourname.store.service.UserService;
import com.yourname.store.util.CodeGenerator;
import com.yourname.store.util.OrderSpecifications;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final OrderMapper orderMapper;
    private final UserService userService;

    @Override
    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request) {
        validateUniqueProducts(request.getItems());

        List<Long> productIds = request.getItems().stream()
                .map(OrderItemRequest::getProductId)
                .toList();

        Map<Long, Product> products = productRepository.findAllById(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));

        if (products.size() != productIds.size()) {
            throw new NotFoundException("One or more products not found");
        }

        Order order = Order.builder()
                .code(CodeGenerator.generateOrderCode())
                .orderDate(LocalDateTime.now())
                .status(OrderStatus.PAID) // Tạm thời đặt là PAID, sau này có thể thay đổi tuỳ theo luồng thanh toán
                .totalAmount(BigDecimal.ZERO)
                .note(request.getNote())
                .build();

        BigDecimal totalAmount = BigDecimal.ZERO;

        for (OrderItemRequest itemRequest : request.getItems()) {
            Product product = products.get(itemRequest.getProductId());
            if (product.getStatus() == ProductStatus.INACTIVE) {
                throw new BadRequestException("Product is inactive: " + product.getCode());
            }
            if (product.getStockQty() < itemRequest.getQuantity()) {
                throw new BadRequestException("Insufficient stock for product: " + product.getCode());
            }

            BigDecimal unitPrice = product.getPrice();
            BigDecimal lineTotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            OrderItem orderItem = OrderItem.builder()
                    .product(product)
                    .unitPrice(unitPrice)
                    .quantity(itemRequest.getQuantity())
                    .lineTotal(lineTotal)
                    .build();

            order.addItem(orderItem);
            totalAmount = totalAmount.add(lineTotal);
        }

        order.setTotalAmount(totalAmount);

        // cập nhật user nếu có thông tin khách hàng
        User user = null;
        String sanitizedPhone = request.getCustomerPhone() != null ? request.getCustomerPhone().trim() : null;
        String sanitizedName = request.getCustomerName() != null ? request.getCustomerName().trim() : null;
        String sanitizedAddress = request.getCustomerAddress() != null ? request.getCustomerAddress().trim() : null;

        // Chỉ gán user khi có đầy đủ thông tin khách hàng (cả số điện thoại, tên và địa
        // chỉ)
        if (StringUtils.hasText(sanitizedPhone) && StringUtils.hasText(sanitizedName)
                && StringUtils.hasText(sanitizedAddress)) {
            user = userService.upsertUser(
                    sanitizedName,
                    sanitizedPhone,
                    sanitizedAddress);

            // Chỉ khi có user mới gán vào order
            order.setUser(user);

            // cộng điểm thưởng cho user (nếu không phải khách vãng lai)
            if (!userService.isGuest(user) && user.getPhone() != null && !user.getPhone().isBlank()) {
                int currentPoint = user.getPoint() == null ? 0 : user.getPoint();
                int earnedPoint = totalAmount.multiply(BigDecimal.valueOf(0.01))
                        .setScale(0, RoundingMode.FLOOR)
                        .intValue();
                if (earnedPoint > 0) {
                    user.setPoint(currentPoint + earnedPoint);
                    userService.save(user);
                }
            }
        }
        // Nếu không có thông tin khách hàng, không gán user cho order (user_id sẽ là
        // null)

        Order saved = orderRepository.save(order);
        return orderMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long id) {
        Order order = getOrderEntity(id);
        return orderMapper.toResponse(order);
    }

    @Override
    @Transactional(readOnly = true)
    public Order getOrderEntity(Long id) {
        // Fetch order with basic information first
        Order baseOrder = orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Order not found with id: " + id));

        // Fetch items and product details separately
        Order orderWithItems = orderRepository.findWithDetailsById(id)
                .orElseThrow(() -> new NotFoundException("Order not found with id: " + id));
        baseOrder.setItems(orderWithItems.getItems());

        // Fetch payments separately
        Order orderWithPayments = orderRepository.findWithPaymentsById(id)
                .orElseThrow(() -> new NotFoundException("Order not found with id: " + id));
        baseOrder.setPayments(orderWithPayments.getPayments());

        // Fetch user information separately if available
        Order orderWithUser = orderRepository.findWithUserById(id)
                .orElseThrow(() -> new NotFoundException("Order not found with id: " + id));
        baseOrder.setUser(orderWithUser.getUser());

        return baseOrder;
    }

    @Override
    @Transactional
    public void handleOrderPaid(Order order) {
        if (order.getStatus() == OrderStatus.PAID) {
            return;
        }
        order.setStatus(OrderStatus.PAID);

        order.getItems().forEach(item -> {
            Product product = item.getProduct();
            int remaining = product.getStockQty() - item.getQuantity();
            if (remaining < 0) {
                throw new BadRequestException(
                        "Insufficient stock while completing payment for product: " + product.getCode());
            }
            product.setStockQty(remaining);
            if (remaining == 0) {
                product.setStatus(ProductStatus.OUT_OF_STOCK);
            }
        });

        orderRepository.save(order);
        productRepository.saveAll(order.getItems().stream()
                .map(OrderItem::getProduct)
                .collect(Collectors.toSet()));
    }

    @Override
    @Transactional
    public void handleOrderCanceled(Order order) {
        if (order.getStatus() == OrderStatus.CANCELED) {
            return;
        }
        order.setStatus(OrderStatus.CANCELED);
        orderRepository.save(order);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<OrderSummaryResponse> searchOrders(
            String code, LocalDateTime from, LocalDateTime to, Pageable pageable) {
        System.out.println("OrderServiceImpl.searchOrders called with:");
        System.out.println("  - code: " + code);
        System.out.println("  - from: " + from);
        System.out.println("  - to: " + to);
        System.out.println("  - pageable: page=" + pageable.getPageNumber() + ", size=" + pageable.getPageSize());

        Specification<Order> specification = OrderSpecifications.filter(code, from, to);
        Page<Order> page = orderRepository.findAll(specification, pageable);

        System.out.println("Query returned " + page.getTotalElements() + " orders");
        if (page.getTotalElements() == 0) {
            System.out.println("No orders found - checking if any orders exist in the date range");
            // Manual check for debugging
            List<Order> allOrders = orderRepository.findAll();
            System.out.println("Total orders in database: " + allOrders.size());
            for (Order order : allOrders) {
                System.out.println("Order ID: " + order.getId() +
                        ", Code: " + order.getCode() +
                        ", Date: " + order.getOrderDate() +
                        " matches filter? " +
                        (from == null || !order.getOrderDate().isBefore(from)) + " && " +
                        (to == null || !order.getOrderDate().isAfter(to)));
            }
        }

        List<OrderSummaryResponse> content = page.stream()
                .map(orderMapper::toSummary)
                .toList();
        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isLast());
    }

    private void validateUniqueProducts(List<OrderItemRequest> items) {
        Set<Long> uniqueIds = items.stream()
                .map(OrderItemRequest::getProductId)
                .collect(Collectors.toSet());
        if (uniqueIds.size() != items.size()) {
            throw new BadRequestException("Duplicate product detected in order items");
        }
    }
}