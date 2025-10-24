package com.yourname.store.service.impl;

import com.yourname.store.entity.Order;
import com.yourname.store.report.InvoiceItem;
import com.yourname.store.service.OrderService;
import com.yourname.store.service.ReportService;
import java.io.InputStream;
import java.sql.Connection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import net.sf.jasperreports.engine.JasperCompileManager;
import net.sf.jasperreports.engine.JasperExportManager;
import net.sf.jasperreports.engine.JasperFillManager;
import net.sf.jasperreports.engine.JasperPrint;
import net.sf.jasperreports.engine.JasperReport;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import net.sf.jasperreports.engine.xml.JRXmlLoader;
import net.sf.jasperreports.engine.design.JasperDesign;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final OrderService orderService;
    private final ResourceLoader resourceLoader;
    private final DataSource dataSource; // Kết nối database cho products report

    @Override
    public byte[] generateInvoicePdf(Long orderId) {
        Order order = orderService.getOrderEntity(orderId);

        List<InvoiceItem> items = order.getItems().stream()
                .map(item -> new InvoiceItem(
                        item.getProduct().getCode(),
                        item.getProduct().getName(),
                        item.getQuantity(),
                        item.getUnitPrice(),
                        item.getLineTotal()))
                .toList();

        Map<String, Object> params = new HashMap<>();
        params.put("orderCode", order.getCode());
        params.put("orderDate", order.getOrderDate());
        params.put("customerName", order.getUser() != null ? order.getUser().getName() : "Khach vang lai");
        params.put("customerPhone", order.getUser() != null ? order.getUser().getPhone() : "");
        params.put("customerAddress", order.getUser() != null ? order.getUser().getAddress() : "");
        params.put("note", order.getNote());
        params.put("totalAmount", order.getTotalAmount());
        params.put("itemCount", items.size());
        // Logo không còn cần thiết trong thiết kế mới
        params.put("logo", null);

        JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(items);

        try (InputStream templateStream = loadTemplateStream()) {
            // Sử dụng JRXmlLoader để tải trực tiếp từ stream
            JasperDesign jasperDesign = JRXmlLoader.load(templateStream);
            JasperReport report = JasperCompileManager.compileReport(jasperDesign);

            JasperPrint print = JasperFillManager.fillReport(report, params, dataSource);
            return JasperExportManager.exportReportToPdf(print);
        } catch (Exception e) {
            e.printStackTrace(); // In lỗi để dễ debug
            throw new IllegalStateException("Failed to generate invoice PDF", e);
        }
    }

    @Override
    public byte[] generateAllProductsPdf() {
        // CÁCH 2: Sử dụng JDBC Connection - JasperReports tự query database
        Map<String, Object> params = new HashMap<>();

        try (InputStream templateStream = resourceLoader
                .getResource("classpath:reports/all-products.jrxml")
                .getInputStream();
                Connection connection = dataSource.getConnection()) {

            JasperDesign jasperDesign = JRXmlLoader.load(templateStream);
            JasperReport report = JasperCompileManager.compileReport(jasperDesign);

            // Truyền Connection - Jasper sẽ execute SQL query trong template
            JasperPrint print = JasperFillManager.fillReport(report, params, connection);
            return JasperExportManager.exportReportToPdf(print);
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalStateException("Failed to generate all products PDF", e);
        }
    }

    private InputStream loadTemplateStream() {
        try {
            Resource resource = resourceLoader.getResource("classpath:reports/invoice.jrxml");
            return resource.getInputStream();
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to load invoice template", ex);
        }
    }

    // Phương thức loadLogoStream đã được xóa vì không còn cần thiết
}
