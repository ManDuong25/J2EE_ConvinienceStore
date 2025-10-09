package com.yourname.store.report;

import java.math.BigDecimal;

public class InvoiceItem {
        private String productCode;
        private String productName;
        private Integer quantity;
        private BigDecimal unitPrice;
        private BigDecimal lineTotal;

        public InvoiceItem(String productCode, String productName, Integer quantity,
                        BigDecimal unitPrice, BigDecimal lineTotal) {
                this.productCode = productCode;
                this.productName = productName;
                this.quantity = quantity;
                this.unitPrice = unitPrice;
                this.lineTotal = lineTotal;
        }

        public String getProductCode() {
                return productCode;
        }

        public String getProductName() {
                return productName;
        }

        public Integer getQuantity() {
                return quantity;
        }

        public BigDecimal getUnitPrice() {
                return unitPrice;
        }

        public BigDecimal getLineTotal() {
                return lineTotal;
        }
}
