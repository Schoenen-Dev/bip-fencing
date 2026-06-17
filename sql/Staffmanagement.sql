

-------------------------------------------------------- Employee Management ------------------------------------------------------------

 DROP TABLE IF EXISTS `employees`;
CREATE TABLE `employees` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_name` varchar(255) NOT NULL,
  `emp_id` varchar(100) NOT NULL,
  `department` varchar(255) NOT NULL,
  `destination` varchar(255) DEFAULT NULL,      -- new optional field
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone_number` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `salary_type` enum('monthly','weekly','daily') NOT NULL,
  `date_of_joining` date NOT NULL,
  `branch_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `emp_id` (`emp_id`),
  KEY `branch_id` (`branch_id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE employees
ADD CONSTRAINT unique_empid UNIQUE(emp_id),
ADD CONSTRAINT unique_phone UNIQUE(phone_number);
ALTER TABLE employees MODIFY COLUMN phone_number VARCHAR(15) NOT NULL;


-------------------------------------------------------- Admin Features ------------------------------------------------------------------------------

DROP TABLE IF EXISTS `branch_amounts`;
CREATE TABLE `branch_amounts` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` int(10) unsigned NOT NULL,
  `branch_name` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_date` date NOT NULL,
  `note` text DEFAULT NULL,
  `received_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  CONSTRAINT `fk_branch_amounts_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


--------------------------------------------------------- Salary Management ------------------------------------------------------------------------------

DROP TABLE IF EXISTS `salaries`;
CREATE TABLE IF NOT EXISTS `salaries` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employeeName` varchar(255) NOT NULL,
  `employeeId` varchar(100) NOT NULL,
  `salary` decimal(12,2) NOT NULL,
  `paid` decimal(12,2) DEFAULT 0.00,
  `balance` decimal(12,2) GENERATED ALWAYS AS (salary - paid) STORED,
  `type` enum('Days','Weeks','Monthly') NOT NULL DEFAULT 'Days',
  `salary_date` date NOT NULL,
  `branch_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


----------------------------------------------------------- Attendance Management ------------------------------------------------------------------------------

DROP TABLE IF EXISTS `attendance`;
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(100) NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `status` enum('Present','Absent','Half Day','Late','On Leave','Holiday','Work From Site') NOT NULL DEFAULT 'Present',
  `leave_type` varchar(50) DEFAULT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `work_hours` decimal(5,2) DEFAULT NULL,
  `branch_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_date` (`employee_id`, `date`),
  KEY `branch_id` (`branch_id`),
  FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-------------------------------------------------------overtime Management ------------------------------------------------------------------------------

DROP TABLE IF EXISTS `ot_details`;

CREATE TABLE `ot_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `emp_name` varchar(100) NOT NULL,
  `emp_id` varchar(50) NOT NULL,
  `salary_type` varchar(50) DEFAULT NULL,
  `start_time` varchar(10) NOT NULL,
  `end_time` varchar(10) NOT NULL,
  `total_ot_hours` decimal(5,2) NOT NULL,
  `ot_salary` decimal(10,2) NOT NULL DEFAULT 0.00,
  `ot_date` date NOT NULL,
  `branch_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_employee_date` (`emp_id`, `ot_date`),
  KEY `branch_id` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
