INSERT INTO categories (name, created_at, updated_at)
SELECT 'Beverages', NOW(), NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Beverages');

INSERT INTO categories (name, created_at, updated_at)
SELECT 'Snacks', NOW(), NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Snacks');

INSERT INTO categories (name, created_at, updated_at)
SELECT 'Dairy', NOW(), NULL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Dairy');

INSERT INTO products (code, name, category_id, price, stock_qty, status, created_at, updated_at)
SELECT 'P0001', 'Bottled Water 500ml', c.id, 8000, 200, 'ACTIVE', NOW(), NULL
FROM categories c
WHERE c.name = 'Beverages'
  AND NOT EXISTS (SELECT 1 FROM products WHERE code = 'P0001');

INSERT INTO products (code, name, category_id, price, stock_qty, status, created_at, updated_at)
SELECT 'P0002', 'Sparkling Water 500ml', c.id, 12000, 150, 'ACTIVE', NOW(), NULL
FROM categories c
WHERE c.name = 'Beverages'
  AND NOT EXISTS (SELECT 1 FROM products WHERE code = 'P0002');

INSERT INTO products (code, name, category_id, price, stock_qty, status, created_at, updated_at)
SELECT 'P1001', 'Potato Chips Original', c.id, 18000, 120, 'ACTIVE', NOW(), NULL
FROM categories c
WHERE c.name = 'Snacks'
  AND NOT EXISTS (SELECT 1 FROM products WHERE code = 'P1001');

INSERT INTO products (code, name, category_id, price, stock_qty, status, created_at, updated_at)
SELECT 'P1002', 'Chocolate Bar 55g', c.id, 22000, 100, 'ACTIVE', NOW(), NULL
FROM categories c
WHERE c.name = 'Snacks'
  AND NOT EXISTS (SELECT 1 FROM products WHERE code = 'P1002');

INSERT INTO products (code, name, category_id, price, stock_qty, status, created_at, updated_at)
SELECT 'P2001', 'Fresh Milk 1L', c.id, 32000, 80, 'ACTIVE', NOW(), NULL
FROM categories c
WHERE c.name = 'Dairy'
  AND NOT EXISTS (SELECT 1 FROM products WHERE code = 'P2001');
