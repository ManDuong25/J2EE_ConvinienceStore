# Convenience Store Backend

Spring Boot 3.3 application for a convenience store: product catalog, ordering, VNPAY payments, PDF invoices, and business statistics. The project is production ready with optional Flyway migrations, Docker support, Swagger docs, and automated tests (unit + Testcontainers).

## Stack
- Java 17, Spring Boot 3.3
- Spring Web, Validation, Data JPA (Hibernate)
- MySQL (5.5+ runtime) with Hibernate schema generation, Flyway optional
- JasperReports for PDF invoices
- Swagger/OpenAPI via springdoc
- MapStruct + Lombok
- VNPAY payment integration (HMAC SHA512)
- Testing: JUnit 5, Mockito, Testcontainers

## Quick Start (non-Docker)
1. Install **MySQL 5.5 or newer** (MySQL 8+ recommended). Ensure the user/password in `.env` matches your server. The default assumes `root` with no password on localhost.
2. Copy `.env.example` → `.env` and adjust values if needed:
   ```
   DATABASE_URL=jdbc:mysql://localhost:3306/convenience_store?createDatabaseIfNotExist=true&useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Ho_Chi_Minh
   DATABASE_USERNAME=root
   DATABASE_PASSWORD=
   ```
3. Run the application:
   ```bash
   ./mvnw spring-boot:run
   ```
   Hibernate will auto-create tables (`ddl-auto=update`) and `data.sql` seeds sample catalog entries. Flyway is disabled by default; enable it when using a modern MySQL version by setting `FLYWAY_ENABLED=true`.

## Optional: Docker Compose
If you prefer containers (requires Docker):
```bash
docker compose up --build
```
This uses MySQL 8 with an app container. Update `.env` accordingly. Leave this step out if you're running locally without Docker.

## Running Tests
```bash
./mvnw test
```
`OrderFlowIntegrationTest` spins up a MySQL Testcontainer (skip if Docker unavailable). Unit tests mock dependencies as usual.

## API Overview
- Swagger UI: `http://localhost:8080/swagger-ui/index.html`
- OpenAPI JSON: `http://localhost:8080/api-docs`

### Sample Requests
```bash
# List products
curl "http://localhost:8080/api/products?q=milk&page=0&size=10"

# Create order
curl -X POST "http://localhost:8080/api/orders" \
  -H "Content-Type: application/json" \
  -d '{
        "customerName": "Nguyen Van A",
        "customerPhone": "0900000000",
        "customerAddress": "HCM",
        "note": "ban tai quay",
        "items": [
          {"productId": 1, "quantity": 2},
          {"productId": 3, "quantity": 1}
        ]
      }'

# Pay with VNPAY
curl -X POST "http://localhost:8080/api/orders/{orderId}/payments/vnpay"

# Download invoice PDF
curl -o invoice.pdf "http://localhost:8080/api/reports/invoices/{orderId}.pdf"

# Revenue stats
curl "http://localhost:8080/api/stats/revenue?granularity=month&from=2025-01-01&to=2025-12-31"

# Top products
curl "http://localhost:8080/api/stats/top-products?from=2025-01-01&to=2025-03-31&limit=5"
```

## VNPAY Sandbox Notes
1. Request sandbox credentials from VNPAY (TMN code + secret).
2. Update `.env` or environment variables.
3. Ensure the VNPAY portal whitelists `returnUrl` and `ipnUrl`.
4. For local IPN testing use `ngrok` or similar.
5. The integration signs parameters alphabetically using HMAC SHA512; incoming IPN/return requests are revalidated.

## Database Initialization Strategy
- **Default**: `spring.jpa.hibernate.ddl-auto=update` + `data.sql` seeders (compatible with legacy MySQL like XAMPP 5.5).
- **Flyway**: Set `FLYWAY_ENABLED=true` and optionally `JPA_DDL_AUTO=none` for environments with MySQL/MariaDB ≥ 5.7. Migrations live in `src/main/resources/db/migration` and seed data is handled by the scripts.

## Project Structure (key files)
```
├─ pom.xml
├─ README.md
├─ src
│  ├─ main
│  │  ├─ java/com/yourname/store
│  │  │  ├─ config / controller / dto / entity / exception / mapper / payment / report / repository / service / util
│  │  │  └─ ConvenienceStoreApplication.java
│  │  └─ resources
│  │     ├─ application.yml
│  │     ├─ data.sql
│  │     ├─ db/migration/V1__init.sql
│  │     ├─ reports/invoice.jrxml
│  │     └─ static/logo.png
│  └─ test
│     └─ java/com/yourname/store
│        ├─ OrderFlowIntegrationTest.java
│        └─ service/StatisticsServiceImplTest.java
└─ postman/convenience-store.postman_collection.json
```

## Next Steps
- Configure real VNPAY credentials.
- Add authentication/authorization if needed.
- Upgrade MySQL to 8.x when possible and re-enable Flyway migrations.
