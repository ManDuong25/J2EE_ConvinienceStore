# 📘 JasperReports - Hướng Dẫn Chi Tiết

## 📖 Mục Lục
1. [JasperReports là gì?](#jasperreports-là-gì)
2. [Kiến trúc tổng quan](#kiến-trúc-tổng-quan)
3. [Các class và method quan trọng](#các-class-và-method-quan-trọng)
4. [Flow xử lý trong code](#flow-xử-lý-trong-code)
5. [2 Cách cung cấp dữ liệu](#2-cách-cung-cấp-dữ-liệu)
6. [Template JRXML](#template-jrxml)
7. [Ví dụ thực tế](#ví-dụ-thực-tế)

---

## 🎯 JasperReports là gì?

**JasperReports** là một thư viện Java mã nguồn mở để **tạo báo cáo động** (PDF, Excel, HTML, CSV...) từ dữ liệu.

### Đặc điểm:
- ✅ Thiết kế template với **Jaspersoft Studio** (GUI tool)
- ✅ Template lưu dưới dạng file `.jrxml` (XML)
- ✅ Compile template thành `.jasper` (binary)
- ✅ Fill data vào template
- ✅ Export ra nhiều format (PDF, Excel, HTML...)

---

## 🏗️ Kiến Trúc Tổng Quan

```
┌─────────────────────────────────────────────────────────┐
│                   JASPERREPORTS FLOW                     │
└─────────────────────────────────────────────────────────┘

1. DESIGN PHASE (Thiết kế)
   ┌──────────────┐
   │ Jaspersoft   │  → Thiết kế template bằng GUI
   │   Studio     │
   └──────┬───────┘
          ↓
   ┌──────────────┐
   │ invoice.jrxml│  → File XML chứa layout, fields, queries
   └──────────────┘

2. COMPILE PHASE (Biên dịch)
   ┌──────────────────────────────────┐
   │ JasperCompileManager             │
   │   .compileReport(jasperDesign)   │ → Biên dịch JRXML
   └──────────────┬───────────────────┘
                  ↓
   ┌──────────────────────────────────┐
   │ JasperReport (binary)            │ → Object đã compile
   └──────────────────────────────────┘

3. FILL PHASE (Điền dữ liệu)
   ┌──────────────────────────────────┐
   │ JasperFillManager                │
   │   .fillReport(report, params,    │ → Điền data vào template
   │                dataSource)        │
   └──────────────┬───────────────────┘
                  ↓
   ┌──────────────────────────────────┐
   │ JasperPrint                      │ → Object chứa report đã fill data
   └──────────────────────────────────┘

4. EXPORT PHASE (Xuất file)
   ┌──────────────────────────────────┐
   │ JasperExportManager              │
   │   .exportReportToPdf(print)      │ → Export ra PDF
   └──────────────┬───────────────────┘
                  ↓
   ┌──────────────────────────────────┐
   │ byte[] (PDF content)             │ → Dữ liệu PDF dạng byte array
   └──────────────────────────────────┘
```

---

## 🔧 Các Class và Method Quan Trọng

### 1. **`JasperDesign`** - Đại diện cho template đã load

```java
JasperDesign jasperDesign = JRXmlLoader.load(templateStream);
```

**Giải thích:**
- `JasperDesign` là object Java đại diện cho file `.jrxml`
- Chứa tất cả thông tin về layout, fields, bands, queries...
- **Chưa được compile**, chỉ là representation của XML

**Ví dụ nội dung:**
```xml
<jasperReport>
  <field name="productCode" class="java.lang.String"/>
  <field name="productName" class="java.lang.String"/>
  <field name="quantity" class="java.lang.Integer"/>
  ...
</jasperReport>
```

---

### 2. **`JRXmlLoader`** - Load file JRXML thành JasperDesign

```java
InputStream templateStream = resourceLoader
    .getResource("classpath:reports/invoice.jrxml")
    .getInputStream();

JasperDesign jasperDesign = JRXmlLoader.load(templateStream);
```

**Giải thích:**
- `JRXmlLoader.load()` đọc file `.jrxml` từ `InputStream`
- Parse XML thành object `JasperDesign`
- **Không compile**, chỉ load cấu trúc

**Tại sao dùng InputStream?**
- Linh hoạt: có thể load từ classpath, file system, URL...
- Spring ResourceLoader giúp load resource dễ dàng

---

### 3. **`JasperCompileManager`** - Compile template

```java
JasperReport report = JasperCompileManager.compileReport(jasperDesign);
```

**Giải thích:**
- **Compile** `JasperDesign` thành `JasperReport`
- `JasperReport` là dạng binary, optimized để fill data nhanh
- **Tương đương:** compile `.java` → `.class`

**Khi nào compile?**
- ✅ Runtime: compile mỗi lần (như code hiện tại)
- ✅ Build time: compile trước, lưu file `.jasper`, load khi cần (nhanh hơn)

```java
// Có thể save compiled report
JasperCompileManager.compileReportToFile(jasperDesign, "invoice.jasper");

// Load pre-compiled report (nhanh hơn)
JasperReport report = (JasperReport) JRLoader.loadObject(new File("invoice.jasper"));
```

---

### 4. **`JasperReport`** - Template đã compile

```java
JasperReport report = JasperCompileManager.compileReport(jasperDesign);
```

**Giải thích:**
- Object đã compile, sẵn sàng để fill data
- **Serializable** → có thể lưu vào file `.jasper`
- Chứa compiled logic để render report

**Lưu ý:** 
- `JasperReport` có thể reuse cho nhiều lần fill data
- Best practice: compile 1 lần, cache lại, dùng nhiều lần

---

### 5. **`JasperFillManager`** - Điền dữ liệu vào template

```java
JasperPrint print = JasperFillManager.fillReport(
    report,      // Template đã compile
    params,      // Map<String, Object> - parameters
    dataSource   // Nguồn dữ liệu
);
```

**Giải thích:**
- **Fill data** vào template đã compile
- Kết quả là `JasperPrint` - report đã có data, sẵn sàng export

**3 Tham số quan trọng:**

#### a) `report` - JasperReport đã compile
```java
JasperReport report = JasperCompileManager.compileReport(jasperDesign);
```

#### b) `params` - Map chứa các tham số
```java
Map<String, Object> params = new HashMap<>();
params.put("orderCode", "ORD-001");
params.put("orderDate", LocalDateTime.now());
params.put("customerName", "Nguyen Van A");
params.put("totalAmount", BigDecimal.valueOf(500000));
```

**Dùng trong template như thế nào?**
```xml
<!-- Trong JRXML -->
<parameter name="orderCode" class="java.lang.String"/>
<textField>
    <textFieldExpression><![CDATA[$P{orderCode}]]></textFieldExpression>
</textField>
```

**`$P{paramName}`** = lấy giá trị từ parameters map

#### c) `dataSource` - Nguồn dữ liệu

**Có 3 loại dataSource:**

##### 🔹 **Option 1: JRBeanCollectionDataSource** (Dùng cho Invoice)
```java
List<InvoiceItem> items = order.getItems().stream()
    .map(item -> new InvoiceItem(
        item.getProduct().getCode(),
        item.getProduct().getName(),
        item.getQuantity(),
        item.getUnitPrice(),
        item.getLineTotal()
    ))
    .toList();

JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(items);
```

**Giải thích:**
- Truyền vào **List of Java Objects**
- JasperReports sẽ iterate qua từng object
- Mỗi object tương ứng với 1 row trong report

**Dùng trong template:**
```xml
<!-- Khai báo fields tương ứng với properties của InvoiceItem -->
<field name="code" class="java.lang.String"/>
<field name="name" class="java.lang.String"/>
<field name="quantity" class="java.lang.Integer"/>

<!-- Trong detail band, hiển thị từng item -->
<textField>
    <textFieldExpression><![CDATA[$F{code}]]></textFieldExpression>
</textField>
<textField>
    <textFieldExpression><![CDATA[$F{name}]]></textFieldExpression>
</textField>
```

**`$F{fieldName}`** = lấy giá trị từ field (Java object property)

##### 🔹 **Option 2: JDBC Connection** (Dùng cho Products)
```java
Connection connection = dataSource.getConnection();
JasperPrint print = JasperFillManager.fillReport(report, params, connection);
```

**Giải thích:**
- Truyền vào **database connection**
- JasperReports tự execute SQL query trong template
- Không cần prepare data trong Java

**Template phải có SQL query:**
```xml
<queryString language="SQL">
    <![CDATA[
        SELECT p.code, p.name, c.name AS category_name, p.price, p.stock_qty, p.status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
    ]]>
</queryString>

<field name="code" class="java.lang.String"/>
<field name="name" class="java.lang.String"/>
<field name="category_name" class="java.lang.String"/>
```

**Ưu điểm:**
- ✅ JasperReports tự optimize query
- ✅ Hỗ trợ pagination với dữ liệu lớn
- ✅ Không cần load hết data vào memory

##### 🔹 **Option 3: JREmptyDataSource**
```java
JasperPrint print = JasperFillManager.fillReport(report, params, new JREmptyDataSource());
```

**Khi nào dùng?**
- Report chỉ hiển thị parameters, không có data iterate
- Ví dụ: Certificate, Cover page, Summary report

---

### 6. **`JasperPrint`** - Report đã fill data

```java
JasperPrint print = JasperFillManager.fillReport(report, params, dataSource);
```

**Giải thích:**
- Object chứa report **đã được fill data**
- Sẵn sàng để export ra PDF, Excel, HTML...
- Chứa tất cả pages, content đã render

**Có thể:**
- Export nhiều lần ra nhiều format khác nhau
- Xem preview trong Jaspersoft Studio

---

### 7. **`JasperExportManager`** - Export ra PDF

```java
byte[] pdfBytes = JasperExportManager.exportReportToPdf(print);
```

**Giải thích:**
- Export `JasperPrint` thành **PDF format**
- Return **byte[]** - dữ liệu PDF dạng binary

**Các method khác:**
```java
// Export to PDF file
JasperExportManager.exportReportToPdfFile(print, "output.pdf");

// Export to PDF stream
JasperExportManager.exportReportToPdfStream(print, outputStream);

// Export to HTML
JasperExportManager.exportReportToHtmlFile(print, "output.html");
```

**Tại sao return byte[]?**
- Linh hoạt: có thể save to file, send qua HTTP, send email...
- Trong web app: trả về cho client qua HTTP response

---

## 🔄 Flow Xử Lý Trong Code

### **Invoice Report Flow** (JRBeanCollectionDataSource)

```java
@Override
public byte[] generateInvoicePdf(Long orderId) {
    // BƯỚC 1: Lấy dữ liệu từ database
    Order order = orderService.getOrderEntity(orderId);
    
    // BƯỚC 2: Chuẩn bị data - Convert Order Items → InvoiceItem
    List<InvoiceItem> items = order.getItems().stream()
            .map(item -> new InvoiceItem(
                item.getProduct().getCode(),     // Field: code
                item.getProduct().getName(),     // Field: name
                item.getQuantity(),              // Field: quantity
                item.getUnitPrice(),             // Field: unitPrice
                item.getLineTotal()              // Field: lineTotal
            ))
            .toList();

    // BƯỚC 3: Chuẩn bị parameters - Thông tin header/footer
    Map<String, Object> params = new HashMap<>();
    params.put("orderCode", order.getCode());                    // $P{orderCode}
    params.put("orderDate", order.getOrderDate());               // $P{orderDate}
    params.put("customerName", order.getUser() != null           // $P{customerName}
        ? order.getUser().getName() 
        : "Khach vang lai");
    params.put("customerPhone", order.getUser() != null          // $P{customerPhone}
        ? order.getUser().getPhone() 
        : "");
    params.put("customerAddress", order.getUser() != null        // $P{customerAddress}
        ? order.getUser().getAddress() 
        : "");
    params.put("note", order.getNote());                         // $P{note}
    params.put("totalAmount", order.getTotalAmount());           // $P{totalAmount}
    params.put("itemCount", items.size());                       // $P{itemCount}

    // BƯỚC 4: Tạo DataSource từ List<InvoiceItem>
    JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(items);

    // BƯỚC 5: Load template từ classpath
    try (InputStream templateStream = loadTemplateStream()) {
        
        // BƯỚC 6: Parse XML → JasperDesign
        JasperDesign jasperDesign = JRXmlLoader.load(templateStream);
        
        // BƯỚC 7: Compile JasperDesign → JasperReport
        JasperReport report = JasperCompileManager.compileReport(jasperDesign);

        // BƯỚC 8: Fill data vào template
        JasperPrint print = JasperFillManager.fillReport(
            report,      // Template đã compile
            params,      // Parameters (orderCode, customerName...)
            dataSource   // Data source (List<InvoiceItem>)
        );
        
        // BƯỚC 9: Export to PDF
        return JasperExportManager.exportReportToPdf(print);
        
    } catch (Exception e) {
        e.printStackTrace();
        throw new IllegalStateException("Failed to generate invoice PDF", e);
    }
}
```

**Chi tiết từng bước:**

#### **Bước 1-2: Chuẩn bị dữ liệu**
```java
Order order = orderService.getOrderEntity(orderId);
List<InvoiceItem> items = order.getItems().stream()...
```
- Lấy Order từ database
- Convert `OrderItem` entity → `InvoiceItem` DTO
- **Tại sao convert?** Để control những field nào expose cho report

**InvoiceItem.java:**
```java
public class InvoiceItem {
    private String code;        // Mapping to $F{code}
    private String name;        // Mapping to $F{name}
    private Integer quantity;   // Mapping to $F{quantity}
    private BigDecimal unitPrice;   // Mapping to $F{unitPrice}
    private BigDecimal lineTotal;   // Mapping to $F{lineTotal}
    
    // Constructor, getters...
}
```

#### **Bước 3: Chuẩn bị parameters**
```java
Map<String, Object> params = new HashMap<>();
params.put("orderCode", "ORD-001");
```
- Parameters dùng cho **thông tin không lặp lại**: header, footer, title...
- Trong template: access bằng `$P{paramName}`

#### **Bước 4: Tạo DataSource**
```java
JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(items);
```
- Wrap `List<InvoiceItem>` thành DataSource
- JasperReports sẽ iterate qua từng item
- Mỗi item → 1 row trong detail band

#### **Bước 5-7: Load và compile template**
```java
InputStream templateStream = loadTemplateStream();
JasperDesign jasperDesign = JRXmlLoader.load(templateStream);
JasperReport report = JasperCompileManager.compileReport(jasperDesign);
```
- Load `.jrxml` từ classpath
- Parse XML thành Java object
- Compile để optimize performance

#### **Bước 8: Fill data**
```java
JasperPrint print = JasperFillManager.fillReport(report, params, dataSource);
```
- **Magic happens here!** 🎩
- JasperReports:
  1. Iterate qua từng InvoiceItem trong dataSource
  2. Với mỗi item, render detail band
  3. Replace `$F{fieldName}` bằng giá trị thật
  4. Replace `$P{paramName}` bằng giá trị từ params
  5. Tạo ra pages với content đầy đủ

#### **Bước 9: Export to PDF**
```java
return JasperExportManager.exportReportToPdf(print);
```
- Convert `JasperPrint` → PDF binary
- Return `byte[]`

---

### **Products Report Flow** (JDBC Connection)

```java
@Override
public byte[] generateAllProductsPdf() {
    // BƯỚC 1: Chuẩn bị parameters (rỗng vì không cần)
    Map<String, Object> params = new HashMap<>();

    // BƯỚC 2: Load template và get database connection
    try (InputStream templateStream = resourceLoader
            .getResource("classpath:reports/all-products.jrxml")
            .getInputStream();
         Connection connection = dataSource.getConnection()) {
        
        // BƯỚC 3: Parse XML → JasperDesign
        JasperDesign jasperDesign = JRXmlLoader.load(templateStream);
        
        // BƯỚC 4: Compile JasperDesign → JasperReport
        JasperReport report = JasperCompileManager.compileReport(jasperDesign);

        // BƯỚC 5: Fill report với JDBC Connection
        // JasperReports sẽ TỰ execute SQL query trong template
        JasperPrint print = JasperFillManager.fillReport(report, params, connection);
        
        // BƯỚC 6: Export to PDF
        return JasperExportManager.exportReportToPdf(print);
        
    } catch (Exception e) {
        e.printStackTrace();
        throw new IllegalStateException("Failed to generate all products PDF", e);
    }
}
```

**Khác biệt chính:**
```java
// Invoice: truyền DataSource (Java objects)
JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(items);
JasperFillManager.fillReport(report, params, dataSource);

// Products: truyền Connection (database connection)
Connection connection = dataSource.getConnection();
JasperFillManager.fillReport(report, params, connection);
```

**Template phải có SQL:**
```xml
<queryString language="SQL">
    <![CDATA[
        SELECT p.code, p.name, c.name AS category_name, 
               p.price, p.stock_qty, p.status
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ORDER BY p.created_at DESC
    ]]>
</queryString>
```

**Flow:**
1. JasperFillManager nhận Connection
2. Execute SQL query trong template
3. Fetch data từ database
4. Iterate qua ResultSet
5. Fill data vào template
6. Return JasperPrint

---

## 🎨 Template JRXML

### **Cấu trúc file `.jrxml`**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="..." name="invoice" pageWidth="595" pageHeight="842">
    
    <!-- 1. PARAMETERS: Giá trị đơn, không lặp -->
    <parameter name="orderCode" class="java.lang.String"/>
    <parameter name="orderDate" class="java.time.LocalDateTime"/>
    <parameter name="customerName" class="java.lang.String"/>
    <parameter name="totalAmount" class="java.math.BigDecimal"/>
    
    <!-- 2. FIELDS: Dữ liệu từ datasource, lặp qua từng row -->
    <field name="code" class="java.lang.String"/>
    <field name="name" class="java.lang.String"/>
    <field name="quantity" class="java.lang.Integer"/>
    <field name="unitPrice" class="java.math.BigDecimal"/>
    <field name="lineTotal" class="java.math.BigDecimal"/>
    
    <!-- 3. VARIABLES: Tính toán, aggregation -->
    <variable name="totalQuantity" class="java.lang.Integer" calculation="Sum">
        <variableExpression><![CDATA[$F{quantity}]]></variableExpression>
    </variable>
    
    <!-- 4. BANDS: Layout sections -->
    
    <!-- TITLE: In 1 lần ở đầu report -->
    <title>
        <band height="100">
            <staticText>
                <text><![CDATA[HOA DON BAN HANG]]></text>
            </staticText>
            <textField>
                <textFieldExpression><![CDATA[$P{orderCode}]]></textFieldExpression>
            </textField>
        </band>
    </title>
    
    <!-- PAGE HEADER: In ở đầu mỗi page -->
    <pageHeader>
        <band height="50">
            <textField>
                <textFieldExpression><![CDATA[$P{customerName}]]></textFieldExpression>
            </textField>
        </band>
    </pageHeader>
    
    <!-- COLUMN HEADER: Header của bảng -->
    <columnHeader>
        <band height="30">
            <staticText><text><![CDATA[Ma SP]]></text></staticText>
            <staticText><text><![CDATA[Ten SP]]></text></staticText>
            <staticText><text><![CDATA[So luong]]></text></staticText>
            <staticText><text><![CDATA[Don gia]]></text></staticText>
            <staticText><text><![CDATA[Thanh tien]]></text></staticText>
        </band>
    </columnHeader>
    
    <!-- DETAIL: Lặp lại cho từng item trong datasource -->
    <detail>
        <band height="20">
            <textField>
                <textFieldExpression><![CDATA[$F{code}]]></textFieldExpression>
            </textField>
            <textField>
                <textFieldExpression><![CDATA[$F{name}]]></textFieldExpression>
            </textField>
            <textField>
                <textFieldExpression><![CDATA[$F{quantity}]]></textFieldExpression>
            </textField>
            <textField pattern="#,##0">
                <textFieldExpression><![CDATA[$F{unitPrice}]]></textFieldExpression>
            </textField>
            <textField pattern="#,##0">
                <textFieldExpression><![CDATA[$F{lineTotal}]]></textFieldExpression>
            </textField>
        </band>
    </detail>
    
    <!-- COLUMN FOOTER: Footer của bảng -->
    <columnFooter>
        <band height="30">
            <textField>
                <textFieldExpression><![CDATA["Tong so luong: " + $V{totalQuantity}]]></textFieldExpression>
            </textField>
        </band>
    </columnFooter>
    
    <!-- PAGE FOOTER: Footer của mỗi page -->
    <pageFooter>
        <band height="20">
            <textField>
                <textFieldExpression><![CDATA["Trang " + $V{PAGE_NUMBER}]]></textFieldExpression>
            </textField>
        </band>
    </pageFooter>
    
    <!-- SUMMARY: In 1 lần ở cuối report -->
    <summary>
        <band height="50">
            <textField pattern="#,##0">
                <textFieldExpression><![CDATA["TONG THANH TOAN: " + $P{totalAmount}]]></textFieldExpression>
            </textField>
        </band>
    </summary>
    
</jasperReport>
```

### **Expression trong JRXML**

| Expression | Ý nghĩa | Ví dụ |
|------------|---------|-------|
| `$P{name}` | Parameter - giá trị từ params map | `$P{orderCode}` → "ORD-001" |
| `$F{name}` | Field - giá trị từ current row của datasource | `$F{quantity}` → 5 |
| `$V{name}` | Variable - biến tính toán | `$V{PAGE_NUMBER}` → 1 |
| `$V{PAGE_NUMBER}` | Built-in variable - số trang hiện tại | 1, 2, 3... |
| `$V{COLUMN_COUNT}` | Built-in variable - số row đã in | |
| `$V{REPORT_COUNT}` | Built-in variable - tổng số row | |

### **Pattern Formatting**

```xml
<!-- Format số: 1000000 → 1,000,000 -->
<textField pattern="#,##0">
    <textFieldExpression><![CDATA[$F{price}]]></textFieldExpression>
</textField>

<!-- Format số thập phân: 1000.5 → 1,000.50 -->
<textField pattern="#,##0.00">
    <textFieldExpression><![CDATA[$F{price}]]></textFieldExpression>
</textField>

<!-- Format date: 2025-10-23 → 23/10/2025 -->
<textField pattern="dd/MM/yyyy">
    <textFieldExpression><![CDATA[$P{orderDate}]]></textFieldExpression>
</textField>

<!-- Format datetime: → 23/10/2025 14:30:00 -->
<textField pattern="dd/MM/yyyy HH:mm:ss">
    <textFieldExpression><![CDATA[$P{orderDate}]]></textFieldExpression>
</textField>
```

---

## 📊 2 Cách Cung Cấp Dữ Liệu

### **So sánh chi tiết**

| Aspect | JRBeanCollectionDataSource | JDBC Connection |
|--------|----------------------------|-----------------|
| **Use Case** | Data phức tạp, cần xử lý logic trong Java | Query đơn giản, data lớn |
| **Data Preparation** | ✅ Trong Java (full control) | ❌ SQL trong template |
| **Performance** | ⚠️ Phải load hết vào memory | ✅ Stream từ DB, không tốn memory |
| **Flexibility** | ✅ Có thể transform, filter, calculate | ⚠️ Phụ thuộc SQL capabilities |
| **Testing** | ✅ Dễ test, dễ mock | ⚠️ Cần database để test |
| **Code Location** | ✅ Logic trong Java (maintainable) | ⚠️ Logic trong template (XML) |
| **Reusability** | ✅ Có thể dùng lại service/repository | ⚠️ SQL hardcode trong template |

### **Ví dụ 1: JRBeanCollectionDataSource** ✅ Recommended cho Invoice

**Java Code:**
```java
// Chuẩn bị data với full control
List<InvoiceItem> items = order.getItems().stream()
    .filter(item -> item.getQuantity() > 0)  // Filter
    .map(item -> {
        // Transform & calculate
        BigDecimal discount = calculateDiscount(item);
        BigDecimal finalPrice = item.getUnitPrice().subtract(discount);
        
        return new InvoiceItem(
            item.getProduct().getCode(),
            item.getProduct().getName(),
            item.getQuantity(),
            finalPrice,
            finalPrice.multiply(BigDecimal.valueOf(item.getQuantity()))
        );
    })
    .sorted(Comparator.comparing(InvoiceItem::getName))  // Sort
    .toList();

JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(items);
```

**Template (invoice.jrxml):**
```xml
<!-- Chỉ cần khai báo fields, không cần SQL -->
<field name="code" class="java.lang.String"/>
<field name="name" class="java.lang.String"/>
<field name="quantity" class="java.lang.Integer"/>
<field name="unitPrice" class="java.math.BigDecimal"/>
<field name="lineTotal" class="java.math.BigDecimal"/>

<!-- Dùng trong detail band -->
<detail>
    <band height="20">
        <textField>
            <textFieldExpression><![CDATA[$F{code}]]></textFieldExpression>
        </textField>
        <textField>
            <textFieldExpression><![CDATA[$F{name}]]></textFieldExpression>
        </textField>
    </band>
</detail>
```

**Ưu điểm:**
- ✅ Full control: filter, transform, calculate trong Java
- ✅ Reuse existing service layer
- ✅ Easy to test và mock
- ✅ Business logic trong Java (không hardcode trong XML)

**Nhược điểm:**
- ⚠️ Phải load hết data vào memory
- ⚠️ Tốn memory với dataset lớn

---

### **Ví dụ 2: JDBC Connection** ✅ Recommended cho Products

**Java Code:**
```java
// Chỉ cần provide connection, không prepare data
Map<String, Object> params = new HashMap<>();
Connection connection = dataSource.getConnection();

JasperPrint print = JasperFillManager.fillReport(report, params, connection);
```

**Template (all-products.jrxml):**
```xml
<!-- Phải có queryString -->
<queryString language="SQL">
    <![CDATA[
        SELECT 
            p.code,
            p.name,
            c.name AS category_name,
            p.price,
            p.stock_qty,
            p.status,
            p.created_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'ACTIVE'
        ORDER BY p.created_at DESC
    ]]>
</queryString>

<!-- Khai báo fields tương ứng với SQL result -->
<field name="code" class="java.lang.String"/>
<field name="name" class="java.lang.String"/>
<field name="category_name" class="java.lang.String"/>
<field name="price" class="java.math.BigDecimal"/>
<field name="stock_qty" class="java.lang.Integer"/>
<field name="status" class="java.lang.String"/>

<detail>
    <band height="20">
        <textField>
            <textFieldExpression><![CDATA[$F{code}]]></textFieldExpression>
        </textField>
        <textField>
            <textFieldExpression><![CDATA[$F{name}]]></textFieldExpression>
        </textField>
    </band>
</detail>
```

**Ưu điểm:**
- ✅ Efficient với dataset lớn (stream từ DB)
- ✅ JasperReports optimize query execution
- ✅ Hỗ trợ pagination tự động
- ✅ Không tốn memory (không load hết vào RAM)

**Nhược điểm:**
- ⚠️ SQL hardcode trong template (khó maintain)
- ⚠️ Khó test (cần real database)
- ⚠️ Không flexible (phụ thuộc SQL)

---

### **Khi nào dùng cái nào?**

#### ✅ **Dùng JRBeanCollectionDataSource khi:**
1. Cần business logic phức tạp (calculate discount, tax...)
2. Data từ nhiều nguồn (multiple services/APIs)
3. Cần transform/filter data
4. Dataset nhỏ-vừa (< 10,000 rows)
5. Muốn reuse existing service layer
6. **Ví dụ:** Invoice, Receipt, Complex reports

#### ✅ **Dùng JDBC Connection khi:**
1. Query đơn giản, chỉ SELECT từ database
2. Dataset lớn (> 10,000 rows)
3. Cần performance cao
4. Report chủ yếu là listing data
5. **Ví dụ:** Product list, Customer list, Transaction history

---

## 🛠️ Helper Methods

### **`loadTemplateStream()`**

```java
private InputStream loadTemplateStream() {
    try {
        Resource resource = resourceLoader.getResource("classpath:reports/invoice.jrxml");
        return resource.getInputStream();
    } catch (Exception ex) {
        throw new IllegalStateException("Cannot load invoice template", ex);
    }
}
```

**Giải thích:**
- `ResourceLoader` là Spring utility để load resources
- `classpath:` → load từ `src/main/resources/`
- `getInputStream()` → convert Resource thành InputStream

**Tại sao dùng ResourceLoader?**
- ✅ Work trong cả development và production (JAR file)
- ✅ Hỗ trợ nhiều protocol: `classpath:`, `file:`, `http:`
- ✅ Spring best practice

---

## 🎯 Ví Dụ Thực Tế

### **Tạo Invoice cho Order**

#### **1. Entity: Order**
```java
@Entity
public class Order {
    private Long id;
    private String code;
    private LocalDateTime orderDate;
    private User user;
    private String note;
    private BigDecimal totalAmount;
    private List<OrderItem> items;
}
```

#### **2. Entity: OrderItem**
```java
@Entity
public class OrderItem {
    private Long id;
    private Product product;
    private Integer quantity;
    private BigDecimal unitPrice;
    
    public BigDecimal getLineTotal() {
        return unitPrice.multiply(BigDecimal.valueOf(quantity));
    }
}
```

#### **3. DTO: InvoiceItem** (cho JasperReports)
```java
@Data
@AllArgsConstructor
@NoArgsConstructor
public class InvoiceItem {
    private String code;          // $F{code}
    private String name;          // $F{name}
    private Integer quantity;     // $F{quantity}
    private BigDecimal unitPrice; // $F{unitPrice}
    private BigDecimal lineTotal; // $F{lineTotal}
}
```

**Tại sao tạo DTO riêng?**
- ✅ Control những field nào expose cho report
- ✅ Flatten nested objects (product.code → code)
- ✅ Decouple entity và report structure

#### **4. Service: Generate PDF**
```java
public byte[] generateInvoicePdf(Long orderId) {
    // Get order
    Order order = orderService.getOrderEntity(orderId);
    
    // Transform OrderItem → InvoiceItem
    List<InvoiceItem> items = order.getItems().stream()
        .map(item -> new InvoiceItem(
            item.getProduct().getCode(),
            item.getProduct().getName(),
            item.getQuantity(),
            item.getUnitPrice(),
            item.getLineTotal()
        ))
        .toList();
    
    // Prepare parameters
    Map<String, Object> params = new HashMap<>();
    params.put("orderCode", order.getCode());
    params.put("orderDate", order.getOrderDate());
    params.put("customerName", order.getUser() != null 
        ? order.getUser().getName() 
        : "Khach vang lai");
    params.put("totalAmount", order.getTotalAmount());
    
    // Create datasource
    JRBeanCollectionDataSource dataSource = new JRBeanCollectionDataSource(items);
    
    // Generate PDF
    try (InputStream template = loadTemplateStream()) {
        JasperDesign design = JRXmlLoader.load(template);
        JasperReport report = JasperCompileManager.compileReport(design);
        JasperPrint print = JasperFillManager.fillReport(report, params, dataSource);
        return JasperExportManager.exportReportToPdf(print);
    } catch (Exception e) {
        throw new IllegalStateException("Cannot generate PDF", e);
    }
}
```

#### **5. Template: invoice.jrxml**

**Structure:**
```
┌────────────────────────────────────┐
│ TITLE BAND                         │
│ ┌────────────────────────────────┐ │
│ │ HOA DON BAN HANG               │ │
│ │ Ma don hang: ORD-001           │ │ ← $P{orderCode}
│ │ Ngay: 23/10/2025               │ │ ← $P{orderDate}
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│ PAGE HEADER                        │
│ ┌────────────────────────────────┐ │
│ │ Khach hang: Nguyen Van A       │ │ ← $P{customerName}
│ │ SDT: 0123456789                │ │
│ └────────────────────────────────┘ │
├────────────────────────────────────┤
│ COLUMN HEADER                      │
│ ┌────┬──────────┬────┬──────┬────┐│
│ │ Ma │ Ten SP   │ SL │ Gia  │ TT ││
│ └────┴──────────┴────┴──────┴────┘│
├────────────────────────────────────┤
│ DETAIL (repeat for each item)      │
│ ┌────┬──────────┬────┬──────┬────┐│
│ │P001│ Coca     │ 2  │10000 │20k ││ ← $F{code}, $F{name}...
│ │P002│ Pepsi    │ 1  │12000 │12k ││
│ └────┴──────────┴────┴──────┴────┘│
├────────────────────────────────────┤
│ SUMMARY                            │
│ ┌────────────────────────────────┐ │
│ │ TONG THANH TOAN: 500,000đ      │ │ ← $P{totalAmount}
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
```

---

## 🚀 Best Practices

### 1. **Cache Compiled Reports**
```java
@Service
public class ReportServiceImpl {
    private final Map<String, JasperReport> reportCache = new ConcurrentHashMap<>();
    
    private JasperReport getCompiledReport(String templateName) {
        return reportCache.computeIfAbsent(templateName, name -> {
            try (InputStream stream = loadTemplate(name)) {
                JasperDesign design = JRXmlLoader.load(stream);
                return JasperCompileManager.compileReport(design);
            } catch (Exception e) {
                throw new IllegalStateException("Cannot compile report", e);
            }
        });
    }
}
```

**Lợi ích:**
- ✅ Compile 1 lần, reuse nhiều lần
- ✅ Improve performance đáng kể
- ✅ Reduce CPU usage

### 2. **Pre-compile Reports** (Production)
```java
// Build time: compile .jrxml → .jasper
JasperCompileManager.compileReportToFile("invoice.jrxml", "invoice.jasper");

// Runtime: load .jasper directly (fast)
JasperReport report = (JasperReport) JRLoader.loadObject(
    new File("invoice.jasper")
);
```

**Lợi ích:**
- ✅ Startup nhanh hơn
- ✅ Không cần compile mỗi lần
- ✅ Reduce server load

### 3. **Use ResourceBundle for i18n**
```java
params.put("REPORT_RESOURCE_BUNDLE", ResourceBundle.getBundle("messages", locale));
```

```xml
<!-- In template -->
<textField>
    <textFieldExpression><![CDATA[$R{invoice.title}]]></textFieldExpression>
</textField>
```

### 4. **Handle Large Datasets**
```java
// Dùng JDBC Connection + Pagination trong SQL
<queryString>
    <![CDATA[
        SELECT * FROM products 
        LIMIT 1000 OFFSET $P{offset}
    ]]>
</queryString>
```

### 5. **Error Handling**
```java
try {
    return JasperExportManager.exportReportToPdf(print);
} catch (JRException e) {
    log.error("Cannot generate PDF for order {}", orderId, e);
    throw new ReportGenerationException("Cannot generate invoice", e);
}
```

---

## 🎓 Tóm Tắt

### **Core Classes:**
1. **JasperDesign** - Template chưa compile (XML representation)
2. **JasperReport** - Template đã compile (binary, optimized)
3. **JasperPrint** - Report đã fill data (ready to export)

### **Core Managers:**
1. **JRXmlLoader** - Load .jrxml → JasperDesign
2. **JasperCompileManager** - Compile JasperDesign → JasperReport
3. **JasperFillManager** - Fill data → JasperPrint
4. **JasperExportManager** - Export JasperPrint → PDF/Excel/HTML

### **Data Sources:**
1. **JRBeanCollectionDataSource** - Java objects (flexible, control)
2. **JDBC Connection** - Database connection (efficient, large data)
3. **JREmptyDataSource** - No data iteration (parameters only)

### **Flow:**
```
.jrxml → JasperDesign → JasperReport → JasperPrint → PDF (byte[])
 (XML)    (Object)      (Compiled)     (Filled)      (Binary)
```

### **Best Practices:**
- ✅ Cache compiled reports
- ✅ Pre-compile in production
- ✅ Use JRBeanCollectionDataSource for complex logic
- ✅ Use JDBC Connection for large datasets
- ✅ Handle errors properly
- ✅ Use ResourceBundle for i18n

---

## 📚 Resources

- [JasperReports Official Docs](https://community.jaspersoft.com/documentation)
- [Jaspersoft Studio](https://community.jaspersoft.com/project/jaspersoft-studio) - GUI Designer
- [JasperReports Tutorial](https://www.baeldung.com/spring-jasper)

---

**Happy Reporting! 🎉**
