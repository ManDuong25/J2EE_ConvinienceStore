-- Allow NULL values in user_id column of orders table
ALTER TABLE orders MODIFY user_id BIGINT NULL;