CREATE TABLE IF NOT EXISTS categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    category_id BIGINT NOT NULL,
    price DECIMAL(18, 2) NOT NULL,
    stock_qty INT NOT NULL,
    status VARCHAR(30) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(150) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_address VARCHAR(255) NOT NULL,
    order_date DATETIME NOT NULL,
    status VARCHAR(30) NOT NULL,
    total_amount DECIMAL(18, 2) NOT NULL,
    note VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    unit_price DECIMAL(18, 2) NOT NULL,
    quantity INT NOT NULL,
    line_total DECIMAL(18, 2) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_item_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_order_item_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT ck_order_item_line_total CHECK (line_total = unit_price * quantity)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    provider VARCHAR(30) NOT NULL,
    txn_ref VARCHAR(64) NOT NULL UNIQUE,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(30) NOT NULL,
    bank_code VARCHAR(50),
    pay_date DATETIME NULL,
    raw_query TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_products_category ON products (category_id);
CREATE INDEX idx_products_status ON products (status);
CREATE INDEX idx_orders_status ON orders (status);
CREATE INDEX idx_orders_order_date ON orders (order_date);
CREATE INDEX idx_order_items_product ON order_items (product_id);

INSERT INTO categories (name)
SELECT * FROM (SELECT 'Beverages' AS name) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Beverages');

INSERT INTO categories (name)
SELECT * FROM (SELECT 'Snacks' AS name) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Snacks');

INSERT INTO categories (name)
SELECT * FROM (SELECT 'Dairy' AS name) AS tmp
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dairy');

INSERT INTO products (code, name, category_id, price, stock_qty, status)
SELECT 'P0001', 'Bottled Water 500ml', 1, 8000, 200, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'P0001');

INSERT INTO products (code, name, category_id, price, stock_qty, status)
SELECT 'P0002', 'Sparkling Water 500ml', 1, 12000, 150, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'P0002');

INSERT INTO products (code, name, category_id, price, stock_qty, status)
SELECT 'P1001', 'Potato Chips Original', 2, 18000, 120, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'P1001');

INSERT INTO products (code, name, category_id, price, stock_qty, status)
SELECT 'P1002', 'Chocolate Bar 55g', 2, 22000, 100, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'P1002');

INSERT INTO products (code, name, category_id, price, stock_qty, status)
SELECT 'P2001', 'Fresh Milk 1L', 3, 32000, 80, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE code = 'P2001');
