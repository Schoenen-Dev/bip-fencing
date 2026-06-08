-- =============================================================
--  BIP Fencing — Database Schema (updated)
--  Database: bipfencing
-- =============================================================

CREATE DATABASE IF NOT EXISTS bipfencing
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE bipfencing;

-- -------------------------------------------------------------
-- Table: employees
-- -------------------------------------------------------------
CREATE TABLE employees (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  employee_name    VARCHAR(150) NOT NULL,
  emp_id           VARCHAR(50) NOT NULL,
  department       VARCHAR(100) NOT NULL,
  phone_number     VARCHAR(15) NOT NULL,
  address          TEXT NOT NULL,
  salary_type      ENUM('monthly','weekly','daily') NOT NULL,
  date_of_joining  DATE            NOT NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_emp_id (emp_id)
);
-- -------------------------------------------------------------
-- Table: attendance
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
  id             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  employee_id    VARCHAR(50)    NOT NULL,
  employee_name  VARCHAR(150)   NOT NULL,
  date           DATE           NOT NULL,
  status         ENUM(
                   'Present','Absent','Half Day',
                   'Late','On Leave','Holiday','Work From Site'
                 ) NOT NULL DEFAULT 'Present',
  leave_type     VARCHAR(80)    DEFAULT NULL,
  check_in       TIME           DEFAULT NULL,
  check_out      TIME           DEFAULT NULL,
  work_hours     DECIMAL(5,2)   DEFAULT NULL,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_emp_date (employee_id, date),
  KEY idx_date   (date),
  KEY idx_status (status),
  KEY idx_emp_id (employee_id),

  CONSTRAINT fk_att_emp
    FOREIGN KEY (employee_id)
    REFERENCES employees (emp_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- Table: branch_amounts
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS branch_amounts (
  id            INT(11)        NOT NULL AUTO_INCREMENT,
  branch_name   VARCHAR(150)   NOT NULL,
  amount        DECIMAL(10,2)  NOT NULL,
  payment_date  DATE           NOT NULL,
  note          VARCHAR(255)   DEFAULT NULL,
  created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_branch_name  (branch_name),
  KEY idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- Updated salaries table WITH branch_id
-- ================================================================
 
CREATE TABLE IF NOT EXISTS salaries (
  id            INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  employeeName  VARCHAR(150)    NOT NULL,
  employeeId    VARCHAR(50)     NOT NULL,
  salary        DECIMAL(10,2)   NOT NULL DEFAULT 0,
  paid          DECIMAL(10,2)   NOT NULL DEFAULT 0,
  balance       DECIMAL(10,2)   NOT NULL DEFAULT 0,
  type          VARCHAR(50)     NOT NULL,
  salary_date   DATE            NOT NULL,
  branch_id     INT UNSIGNED    NOT NULL,
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
 
  PRIMARY KEY (id),
  KEY idx_emp_id    (employeeId),
  KEY idx_sal_date  (salary_date),
  KEY idx_branch_id (branch_id),
 
  CONSTRAINT fk_sal_emp
    FOREIGN KEY (employeeId)
    REFERENCES employees (emp_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
 
  CONSTRAINT fk_sal_branch
    FOREIGN KEY (branch_id)
    REFERENCES branches (id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
 
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Table: OT Table
-- -------------------------------------------------------------

DROP TABLE IF EXISTS ot_details;

CREATE TABLE ot_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_name VARCHAR(100) NOT NULL,
  emp_id VARCHAR(50) NOT NULL,
  salary_type VARCHAR(50) NOT NULL,
  start_time VARCHAR(20) NOT NULL,
  end_time VARCHAR(20) NOT NULL,
  total_ot_hours DECIMAL(10,2) NOT NULL,
  ot_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ── branches ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS branches (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100)  NOT NULL,
  code       VARCHAR(20)   NOT NULL,
  is_active  TINYINT(1)    NOT NULL DEFAULT 1,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO branches (id, name, code) VALUES
  (1, 'Branch A', 'BRA'),
  (2, 'Branch B', 'BRB'),
  (3, 'Branch C', 'BRC');

-- ── users ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  username   VARCHAR(60)   NOT NULL,
  password   VARCHAR(255)  NOT NULL,
  full_name  VARCHAR(120)  NOT NULL DEFAULT '',
  role       ENUM('admin','branch_user') NOT NULL DEFAULT 'branch_user',
  branch_id  INT UNSIGNED  DEFAULT NULL,
  is_active  TINYINT(1)    NOT NULL DEFAULT 1,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_username (username),
  KEY idx_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO users (username, password, full_name, role, branch_id) VALUES
  ('admin',    'Admin@123',    'Administrator', 'admin',       NULL),
  ('branch_a', 'BranchA@123', 'Branch A User', 'branch_user', 1),
  ('branch_b', 'BranchB@123', 'Branch B User', 'branch_user', 2),
  ('branch_c', 'BranchC@123', 'Branch C User', 'branch_user', 3);

-- ── sessions ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id          VARCHAR(64)   NOT NULL,
  user_id     INT UNSIGNED  NOT NULL,
  ip_address  VARCHAR(45)   DEFAULT NULL,
  user_agent  TEXT          DEFAULT NULL,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: products
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_name  VARCHAR(255) NOT NULL,
  sku           VARCHAR(100) UNIQUE DEFAULT NULL,
  category      VARCHAR(100) DEFAULT NULL,
  unit          VARCHAR(50) NOT NULL DEFAULT 'Pcs',
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock_qty     INT NOT NULL DEFAULT 0,
  min_stock     INT NOT NULL DEFAULT 0,
  description   TEXT DEFAULT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_product_name (product_name),
  KEY idx_category (category),
  KEY idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Add branch_id to existing tables ─────────────────────────
ALTER TABLE employees  ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED DEFAULT NULL;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED DEFAULT NULL;
ALTER TABLE salaries   ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED DEFAULT NULL;
ALTER TABLE ot_details ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED DEFAULT NULL;

-- ── BRANCH AMOUNTS ─────────────────────────

DROP TABLE IF EXISTS branch_amounts;

CREATE TABLE branch_amounts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    branch_id INT UNSIGNED NOT NULL,
    branch_name VARCHAR(255) NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    payment_date DATE NOT NULL,
    note TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE INDEX idx_branch_id ON branch_amounts(branch_id);

CREATE TABLE IF NOT EXISTS `purchase_bills` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `company_name` varchar(255) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `product_id` varchar(100) DEFAULT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `rate` decimal(12,2) NOT NULL,
  `invoice_no` varchar(100) NOT NULL,
  `total_amount` decimal(12,2) NOT NULL,
  `branch_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `fk_purchase_bills_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `product_stock` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` varchar(100) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `total_purchased` decimal(12,2) NOT NULL DEFAULT 0.00,
  `current_stock` decimal(12,2) NOT NULL DEFAULT 0.00,
  `rate` decimal(12,2) NOT NULL DEFAULT 0.00,
  `branch_id` int(10) unsigned NOT NULL,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_branch` (`product_id`, `branch_id`),
  KEY `branch_id` (`branch_id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS `stock_deductions` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` varchar(100) NOT NULL,
  `branch_id` int(10) unsigned NOT NULL,
  `deducted_qty` decimal(12,2) NOT NULL,
  `note` text,
  `deducted_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ─────────────────────────────────────────────
--  bipfencing  –  Complete invoices table
--  Run this ONCE on a fresh database
-- ─────────────────────────────────────────────

CREATE TABLE invoices (
    id            INT AUTO_INCREMENT PRIMARY KEY,

    -- Invoice Details
    invoice_no    VARCHAR(50),
    invoice_date  DATE,
    buyer_name    VARCHAR(100),
    buyer_address TEXT,
    buyer_phone   VARCHAR(20),
    buyer_gst     VARCHAR(30),

    -- Item Details
    description   TEXT,
    hsn           VARCHAR(20),
    qty           DECIMAL(10,2),
    rate          DECIMAL(10,2),
    amount        DECIMAL(12,2),

    -- Invoice Totals
    subtotal      DECIMAL(12,2),
    cgst          DECIMAL(12,2),
    sgst          DECIMAL(12,2),
    total_tax     DECIMAL(12,2),
    net_amount    DECIMAL(12,2),

    -- Branch
    branch_id     INT UNSIGNED NULL DEFAULT NULL,

    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_invoice_branch
        FOREIGN KEY (branch_id) REFERENCES branches(id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- Index for fast branch filtering
CREATE INDEX idx_invoice_branch ON invoices(branch_id);

-- quotation  --

-- Quotations header table
CREATE TABLE IF NOT EXISTS `quotations` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `quote_no` varchar(50) NOT NULL,
  `quote_date` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `client_name` varchar(255) NOT NULL,
  `client_phone` varchar(50) DEFAULT NULL,
  `client_email` varchar(100) DEFAULT NULL,
  `client_gst` varchar(50) DEFAULT NULL,
  `client_address` text DEFAULT NULL,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 18.00,
  `notes` text DEFAULT NULL,
  `branch_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `quote_no` (`quote_no`),
  KEY `branch_id` (`branch_id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Quotation items table
CREATE TABLE IF NOT EXISTS `quotation_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `quotation_id` int(10) unsigned NOT NULL,
  `description` text NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `rate` decimal(12,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add any missing columns to quotations
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS po_no VARCHAR(50) NULL AFTER quote_no;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS dispatched_through VARCHAR(255) NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS vehicle_no VARCHAR(50) NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS other_ref TEXT NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS ship_name VARCHAR(255) NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS ship_address TEXT NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS ship_gst VARCHAR(50) NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS ship_state VARCHAR(100) NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS ship_state_code VARCHAR(10) NULL;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS declaration TEXT NULL;

-- Add missing columns to quotation_items
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS hsn VARCHAR(20) NULL AFTER description;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS due_on DATE NULL;
ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'Nos' NULL;