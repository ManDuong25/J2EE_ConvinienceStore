package com.yourname.store.controller;

import com.yourname.store.dto.response.OrderResponse;
import com.yourname.store.service.PaymentService;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/payments/vnpay")
@RequiredArgsConstructor
public class VnpayController {

    private final PaymentService paymentService;

    @GetMapping("/return")
    public OrderResponse handleReturn(@RequestParam Map<String, String> params) {
        return paymentService.handleVnpayReturn(params);
    }

    @PostMapping(value = "/ipn", consumes = MediaType.APPLICATION_FORM_URLENCODED_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    @ResponseBody
    public String handleIpn(@RequestParam Map<String, String> params) {
        return paymentService.handleVnpayIpn(params);
    }
}
