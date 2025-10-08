package com.yourname.store.service;

public interface ReportService {

    byte[] generateInvoicePdf(Long orderId);
}
