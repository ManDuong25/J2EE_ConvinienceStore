package com.yourname.store.service;

import com.yourname.store.dto.response.OrderResponse;
import com.yourname.store.dto.response.PaymentUrlResponse;
import java.util.Map;

public interface PaymentService {

    PaymentUrlResponse initiateVnpayPayment(Long orderId, String clientIp);

    OrderResponse handleVnpayReturn(Map<String, String> params);

    String handleVnpayIpn(Map<String, String> params);
}
