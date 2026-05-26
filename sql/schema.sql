-- =============================================================
--  BIP Fencing — Database Schema
--  Database: bipfencing
--  Place this file in XAMPP and run via phpMyAdmin or CLI
-- =============================================================

CREATE DATABASE IF NOT EXISTS bipfencing
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE bipfencing;

-- -------------------------------------------------------------
-- Table: employees
-- Populated by Employee_details.jsx → add_employee.php
-- Read by Attendance.jsx → employees.php
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
-- Populated by Attendance.jsx → attendance.php (POST/PUT)
-- Read by Attendance.jsx → attendance.php (GET)
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
-- Populated by admin feature → admin_feature_add_branch_amount.php
-- Read by admin feature    → admin_feature_get_branch_amounts.php
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