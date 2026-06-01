-- ============================================================
--  STEP 1: Run this in phpMyAdmin > SQL tab
--  or in XAMPP MySQL terminal
-- ============================================================

-- 1. Create the database (skip if you already have one)
CREATE DATABASE IF NOT EXISTS inventory_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 2. Use it
USE inventory_db;

-- 3. Create the products table
CREATE TABLE IF NOT EXISTS products (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_name  VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE DEFAULT NULL,
  category      VARCHAR(100) DEFAULT NULL,
  unit          VARCHAR(50)  NOT NULL DEFAULT 'Pcs',
  
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  
  stock_qty     INT          NOT NULL DEFAULT 0,
  min_stock     INT          NOT NULL DEFAULT 0,
  description   TEXT         DEFAULT NULL,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Done! Table is ready.
