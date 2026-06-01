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
CREATE TABLE IF NOT EXISTS employees (
  id               INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  employee_name    VARCHAR(150)    NOT NULL,
  emp_id           VARCHAR(50)     NOT NULL,
  department       VARCHAR(100)    NOT NULL,
  salary_type      ENUM('monthly','weekly','daily') NOT NULL,
  date_of_joining  DATE            NOT NULL,
  created_at       TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_emp_id (emp_id)
) ENGINE=InnoDB;

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

-- -------------------------------------------------------------
-- Table: salaries
-- Populated by Salary.jsx → salary_api.php?action=save
-- Read     by Salary.jsx → salary_api.php?action=records
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
  created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_emp_id   (employeeId),
  KEY idx_sal_date (salary_date),

  CONSTRAINT fk_sal_emp
    FOREIGN KEY (employeeId)
    REFERENCES employees (emp_id)
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