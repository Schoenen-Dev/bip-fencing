-- =============================================================
--  BIP Fencing — Database Schema
--  Database: bipfencing
-- =============================================================

CREATE DATABASE IF NOT EXISTS bipfencing
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE bipfencing;

-- -------------------------------------------------------------
-- Table: branches  (MUST be first — referenced by many tables)
-- -------------------------------------------------------------
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

-- -------------------------------------------------------------
-- Table: users
-- -------------------------------------------------------------
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

-- -------------------------------------------------------------
-- Table: sessions
-- -------------------------------------------------------------
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
-- Table: employees
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  employee_name    VARCHAR(150)    NOT NULL,
  emp_id           VARCHAR(50)     NOT NULL,
  department       VARCHAR(100)    NOT NULL,
  salary_type      ENUM('monthly','weekly','daily') NOT NULL,
  date_of_joining  DATE            NOT NULL,
  phone_number     VARCHAR(20)     DEFAULT NULL,
  address          TEXT            DEFAULT NULL,
  branch_id        INT UNSIGNED    DEFAULT NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_emp_id (emp_id),
  KEY idx_branch_id (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
  branch_id      INT UNSIGNED   DEFAULT NULL,
  created_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_emp_date (employee_id, date),
  KEY idx_date   (date),
  KEY idx_status (status),
  KEY idx_emp_id (employee_id),
  KEY idx_branch_id (branch_id),

  CONSTRAINT fk_att_emp
    FOREIGN KEY (employee_id)
    REFERENCES employees (emp_id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Table: salaries
-- -------------------------------------------------------------
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
-- Table: ot_details
-- -------------------------------------------------------------
DROP TABLE IF EXISTS ot_details;

CREATE TABLE ot_details (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  emp_name        VARCHAR(100)  NOT NULL,
  emp_id          VARCHAR(50)   NOT NULL,
  salary_type     VARCHAR(50)   NOT NULL,
  start_time      VARCHAR(20)   NOT NULL,
  end_time        VARCHAR(20)   NOT NULL,
  total_ot_hours  DECIMAL(10,2) NOT NULL,
  ot_date         DATE          NOT NULL,
  branch_id       INT UNSIGNED  DEFAULT NULL,
  created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Table: products
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  product_name  VARCHAR(255)  NOT NULL,
  sku           VARCHAR(100)  UNIQUE DEFAULT NULL,
  category      VARCHAR(100)  DEFAULT NULL,
  unit          VARCHAR(50)   NOT NULL DEFAULT 'Pcs',
  selling_price DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  stock_qty     INT           NOT NULL DEFAULT 0,
  min_stock     INT           NOT NULL DEFAULT 0,
  description   TEXT          DEFAULT NULL,
  branch_id     INT UNSIGNED  DEFAULT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_product_name (product_name),
  KEY idx_category (category),
  KEY idx_sku (sku)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Table: branch_amounts
-- -------------------------------------------------------------
DROP TABLE IF EXISTS branch_amounts;

CREATE TABLE branch_amounts (
  id           INT UNSIGNED   AUTO_INCREMENT PRIMARY KEY,
  branch_id    INT UNSIGNED   NOT NULL,
  branch_name  VARCHAR(255)   NOT NULL,
  amount       DECIMAL(12,2)  NOT NULL,
  payment_date DATE           NOT NULL,
  note         TEXT           DEFAULT NULL,
  created_at   TIMESTAMP      DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_branch_amounts_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_branch_amounts_branch ON branch_amounts(branch_id);

-- -------------------------------------------------------------
-- Table: purchase_bills
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS purchase_bills (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  company_name  VARCHAR(255)  NOT NULL,
  product_name  VARCHAR(255)  NOT NULL,
  product_id    VARCHAR(100)  DEFAULT NULL,
  quantity      DECIMAL(12,2) NOT NULL,
  rate          DECIMAL(12,2) NOT NULL,
  invoice_no    VARCHAR(100)  NOT NULL,
  total_amount  DECIMAL(12,2) NOT NULL,
  branch_id     INT UNSIGNED  NOT NULL,
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pb_branch (branch_id),
  CONSTRAINT fk_purchase_bills_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: product_stock
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_stock (
  id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  product_id       VARCHAR(100)  NOT NULL,
  product_name     VARCHAR(255)  NOT NULL,
  total_purchased  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  current_stock    DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  rate             DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  branch_id        INT UNSIGNED  NOT NULL,
  last_updated     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY product_branch (product_id, branch_id),
  KEY idx_ps_branch (branch_id),
  CONSTRAINT fk_product_stock_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: stock_deductions
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_deductions (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  product_id   VARCHAR(100)  NOT NULL,
  branch_id    INT UNSIGNED  NOT NULL,
  deducted_qty DECIMAL(12,2) NOT NULL,
  note         TEXT,
  deducted_at  DATETIME      NOT NULL,
  PRIMARY KEY (id),
  KEY idx_sd_branch (branch_id),
  CONSTRAINT fk_stock_deductions_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -------------------------------------------------------------
-- Table: quotations
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotations (
  id                INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  quote_no          VARCHAR(50)   NOT NULL,
  quote_date        DATE          NOT NULL,
  valid_until       DATE          DEFAULT NULL,
  po_no             VARCHAR(50)   DEFAULT NULL,
  dispatched_through VARCHAR(255) DEFAULT NULL,
  vehicle_no        VARCHAR(50)   DEFAULT NULL,
  other_ref         TEXT          DEFAULT NULL,
  client_name       VARCHAR(255)  NOT NULL,
  client_phone      VARCHAR(50)   DEFAULT NULL,
  client_email      VARCHAR(100)  DEFAULT NULL,
  client_gst        VARCHAR(50)   DEFAULT NULL,
  client_address    TEXT          DEFAULT NULL,
  ship_name         VARCHAR(255)  DEFAULT NULL,
  ship_address      TEXT          DEFAULT NULL,
  ship_gst          VARCHAR(50)   DEFAULT NULL,
  ship_state        VARCHAR(100)  DEFAULT NULL,
  ship_state_code   VARCHAR(10)   DEFAULT NULL,
  discount_percent  DECIMAL(5,2)  DEFAULT 0.00,
  tax_percent       DECIMAL(5,2)  DEFAULT 18.00,
  notes             TEXT          DEFAULT NULL,
  declaration       TEXT          DEFAULT NULL,
  branch_id         INT UNSIGNED  NOT NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_quote_no (quote_no),
  KEY idx_q_branch (branch_id),
  CONSTRAINT fk_quotations_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------------
-- Table: quotation_items
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quotation_items (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  quotation_id  INT UNSIGNED  NOT NULL,
  description   TEXT          NOT NULL,
  hsn           VARCHAR(20)   DEFAULT NULL,
  due_on        DATE          DEFAULT NULL,
  unit          VARCHAR(20)   DEFAULT 'Nos',
  quantity      DECIMAL(12,2) NOT NULL,
  rate          DECIMAL(12,2) NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_qi_quotation (quotation_id),
  CONSTRAINT fk_quotation_items_quotation
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE employees ADD COLUMN branch_id INT UNSIGNED DEFAULT NULL;
ALTER TABLE attendance ADD COLUMN branch_id INT UNSIGNED DEFAULT NULL;