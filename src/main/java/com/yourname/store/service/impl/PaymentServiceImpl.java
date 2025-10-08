package com.yourname.store.service.impl;

import com.yourname.store.dto.response.OrderResponse;
import com.yourname.store.dto.response.PaymentUrlResponse;
import com.yourname.store.entity.Order;
import com.yourname.store.entity.OrderStatus;
import com.yourname.store.entity.Payment;
import com.yourname.store.entity.PaymentProvider;
import com.yourname.store.entity.PaymentStatus;
import com.yourname.store.exception.NotFoundException;
import com.yourname.store.exception.PaymentException;
import com.yourname.store.mapper.OrderMapper;
import com.yourname.store.payment.VnpayProperties;
import com.yourname.store.payment.VnpayService;
import com.yourname.store.repository.PaymentRepository;
import com.yourname.store.service.OrderService;
import com.yourname.store.service.PaymentService;
import com.yourname.store.util.CodeGenerator;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {

    private static final DateTimeFormatter VNPAY_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyyMMddHHmmss", Locale.US);
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);

    private final OrderService orderService;
    private final PaymentRepository paymentRepository;
    private final VnpayService vnpayService;
    private final VnpayProperties vnpayProperties;
    private final OrderMapper orderMapper;

    @Override
    @Transactional
    public PaymentUrlResponse initiateVnpayPayment(Long orderId, String clientIp) {
        Order order = orderService.getOrderEntity(orderId);
        if (order.getStatus() == OrderStatus.PAID) {
            throw new PaymentException("Order is already paid");
        }
        if (order.getStatus() == OrderStatus.CANCELED) {
            throw new PaymentException("Order has been canceled");
        }

        Payment payment = Payment.builder()
                .order(order)
                .provider(PaymentProvider.VNPAY)
                .txnRef(CodeGenerator.generateTxnRef())
                .amount(order.getTotalAmount())
                .currency(vnpayProperties.getCurrCode())
                .status(PaymentStatus.PENDING)
                .build();

        order.addPayment(payment);
        paymentRepository.save(payment);

        String paymentUrl = vnpayService.buildPaymentUrl(order, payment, clientIp);
        return new PaymentUrlResponse(paymentUrl);
    }

    @Override
    @Transactional
    public OrderResponse handleVnpayReturn(Map<String, String> params) {
        Payment payment = processVnpayCallback(params);
        return orderMapper.toResponse(payment.getOrder());
    }

    @Override
    @Transactional
    public String handleVnpayIpn(Map<String, String> params) {
        try {
            processVnpayCallback(params);
            return "{\"RspCode\":\"00\",\"Message\":\"Confirm Success\"}";
        } catch (PaymentException ex) {
            return "{\"RspCode\":\"99\",\"Message\":\"" + ex.getMessage() + "\"}";
        }
    }

    private Payment processVnpayCallback(Map<String, String> params) {
        if (!vnpayService.verifySignature(params)) {
            throw new PaymentException("Invalid VNPAY signature");
        }

        Payment payment = loadPayment(params);
        verifyAmount(payment, params);

        String responseCode = params.get("vnp_ResponseCode");
        String transactionStatus = params.get("vnp_TransactionStatus");

        PaymentStatus newStatus = mapStatus(responseCode, transactionStatus);
        if (payment.getStatus() == PaymentStatus.PAID || payment.getStatus() == newStatus) {
            return payment;
        }

        payment.setStatus(newStatus);
        payment.setBankCode(params.get("vnp_BankCode"));
        payment.setRawQuery(toRawQuery(params));

        String payDateRaw = params.get("vnp_PayDate");
        if (payDateRaw != null && !payDateRaw.isBlank()) {
            payment.setPayDate(LocalDateTime.parse(payDateRaw, VNPAY_DATE_FORMAT));
        }

        paymentRepository.save(payment);

        if (newStatus == PaymentStatus.PAID) {
            orderService.handleOrderPaid(payment.getOrder());
        } else if (newStatus == PaymentStatus.CANCELED || newStatus == PaymentStatus.FAILED) {
            orderService.handleOrderCanceled(payment.getOrder());
        }
        return payment;
    }

    private void verifyAmount(Payment payment, Map<String, String> params) {
        String amountRaw = params.get("vnp_Amount");
        if (amountRaw == null) {
            throw new PaymentException("Missing amount");
        }
        BigDecimal amount = new BigDecimal(amountRaw).divide(ONE_HUNDRED, 2, RoundingMode.UNNECESSARY);
        if (payment.getAmount().compareTo(amount) != 0) {
            throw new PaymentException("Amount mismatch");
        }
    }

    private Payment loadPayment(Map<String, String> params) {
        String txnRef = params.get("vnp_TxnRef");
        if (txnRef == null) {
            throw new PaymentException("Missing txnRef");
        }
        return paymentRepository.findByTxnRef(txnRef)
                .orElseThrow(() -> new NotFoundException("Payment not found: " + txnRef));
    }

    private PaymentStatus mapStatus(String responseCode, String transactionStatus) {
        if ("00".equals(responseCode) && (transactionStatus == null || "00".equals(transactionStatus))) {
            return PaymentStatus.PAID;
        }
        if ("24".equals(responseCode)) {
            return PaymentStatus.CANCELED;
        }
        return PaymentStatus.FAILED;
    }

    private String toRawQuery(Map<String, String> params) {
        return params.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&"));
    }
}
