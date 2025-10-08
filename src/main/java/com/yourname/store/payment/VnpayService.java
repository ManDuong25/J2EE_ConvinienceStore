package com.yourname.store.payment;

import com.yourname.store.entity.Order;
import com.yourname.store.entity.Payment;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

@Component
public class VnpayService {

    private static final DateTimeFormatter DATE_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss", Locale.US);
    private static final ZoneId VNPAY_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final VnpayProperties properties;

    public VnpayService(VnpayProperties properties) {
        this.properties = properties;
    }

    /**
     * Builds VNPAY payment URL following the official signing procedure: sort parameters alphabetically,
     * URL-encode each key/value, then sign the canonical string with HMAC-SHA512.
     */
    public String buildPaymentUrl(Order order, Payment payment, String clientIp) {
        Map<String, String> params = new LinkedHashMap<>();
        params.put("vnp_Version", properties.getVersion());
        params.put("vnp_Command", properties.getCommand());
        params.put("vnp_TmnCode", properties.getTmnCode());
        params.put("vnp_TxnRef", payment.getTxnRef());
        params.put("vnp_OrderInfo", "Payment for order " + order.getCode());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Amount", scaleAmount(order.getTotalAmount()));
        params.put("vnp_CurrCode", properties.getCurrCode());
        params.put("vnp_Locale", properties.getLocale());
        params.put("vnp_ReturnUrl", properties.getReturnUrl());
        params.put("vnp_IpAddr", Objects.requireNonNullElse(clientIp, "127.0.0.1"));
        ZonedDateTime now = ZonedDateTime.now(VNPAY_ZONE);
        params.put("vnp_CreateDate", DATE_TIME_FORMATTER.format(now));
        params.put("vnp_ExpireDate", DATE_TIME_FORMATTER.format(now.plusMinutes(15)));

        Map<String, String> filtered = params.entrySet().stream()
                .filter(entry -> entry.getValue() != null && !entry.getValue().isBlank())
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        String query = buildQueryString(filtered);
        String signed = hmacSHA512(properties.getHashSecret(), canonicalString(filtered));
        return properties.getPayUrl() + "?" + query + "&vnp_SecureHash=" + signed;
    }

    public boolean verifySignature(Map<String, String> params) {
        Map<String, String> filtered = params.entrySet().stream()
                .filter(entry -> entry.getValue() != null)
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));
        String provided = filtered.remove("vnp_SecureHash");
        filtered.remove("vnp_SecureHashType");
        if (provided == null) {
            return false;
        }
        String recalculated = hmacSHA512(properties.getHashSecret(), canonicalString(filtered));
        return provided.equalsIgnoreCase(recalculated);
    }

    private String buildQueryString(Map<String, String> params) {
        return params.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(entry -> encode(entry.getKey()) + "=" + encode(entry.getValue()))
                .collect(Collectors.joining("&"));
    }

    private String canonicalString(Map<String, String> params) {
        return params.entrySet().stream()
                .sorted(Comparator.comparing(Map.Entry::getKey))
                .map(entry -> entry.getKey() + "=" + entry.getValue())
                .collect(Collectors.joining("&"));
    }

    private String encode(String input) {
        return URLEncoder.encode(input, StandardCharsets.UTF_8).replace("+", "%20");
    }

    private String hmacSHA512(String secret, String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA512");
            SecretKeySpec keySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
            mac.init(keySpec);
            byte[] result = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder builder = new StringBuilder(result.length * 2);
            for (byte b : result) {
                builder.append(String.format("%02X", b));
            }
            return builder.toString();
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to sign VNPAY payload", ex);
        }
    }

    private String scaleAmount(BigDecimal amount) {
        return amount.multiply(BigDecimal.valueOf(100)).setScale(0).toPlainString();
    }
}
