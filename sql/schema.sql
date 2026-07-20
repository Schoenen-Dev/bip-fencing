-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Jul 13, 2026 at 11:40 AM
-- Server version: 5.7.23-23
-- PHP Version: 8.1.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bipfencing`
--

CREATE DATABASE IF NOT EXISTS `bipfencing` DEFAULT CHARACTER SET utf8mb4;
USE `bipfencing`;

-- --------------------------------------------------------

--
-- Table structure for table `attendance`
--

CREATE TABLE `attendance` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_id` varchar(100) NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `status` enum('Present','Absent','Half Day','Late','On Leave','Holiday','Work From Site') NOT NULL DEFAULT 'Present',
  `leave_type` varchar(50) DEFAULT NULL,
  `check_in` time DEFAULT NULL,
  `check_out` time DEFAULT NULL,
  `work_hours` decimal(5,2) DEFAULT NULL,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `code` varchar(20) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `name`, `code`, `is_active`, `created_at`) VALUES
(1, 'Branch A', 'BRA', 1, '2026-06-10 10:36:06'),
(2, 'Branch B', 'BRB', 1, '2026-06-10 10:36:06'),
(3, 'Branch C', 'BRC', 1, '2026-06-10 10:36:06');

-- --------------------------------------------------------

--
-- Table structure for table `branch_amounts`
--

CREATE TABLE `branch_amounts` (
  `id` int(10) UNSIGNED NOT NULL,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `branch_name` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_date` date NOT NULL,
  `note` text,
  `received_by` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `gst` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `client_payments`
--

CREATE TABLE `client_payments` (
  `id` int(10) UNSIGNED NOT NULL,
  `client_id` int(10) UNSIGNED NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `note` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_date` date NOT NULL,
  `branch_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `employees`
--

CREATE TABLE `employees` (
  `id` int(10) UNSIGNED NOT NULL,
  `employee_name` varchar(255) NOT NULL,
  `emp_id` varchar(100) NOT NULL,
  `department` varchar(255) NOT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone_number` varchar(15) NOT NULL,
  `address` text,
  `salary_type` enum('monthly','weekly','daily') NOT NULL,
  `date_of_joining` date NOT NULL,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `invoices`
--

CREATE TABLE `invoices` (
  `id` int(10) UNSIGNED NOT NULL,
  `copy_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_mode` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gst_rate` decimal(5,2) NOT NULL DEFAULT '18.00',
  `invoice_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_date` date NOT NULL,
  `reference_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyers_order_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dated` date DEFAULT NULL,
  `dispatch_doc_no` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delivery_note_date` date DEFAULT NULL,
  `dispatched_through` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bill_of_lading` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `motor_vehicle_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `eway_required` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `eway_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consignee_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consignee_address` text COLLATE utf8mb4_unicode_ci,
  `consignee_state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `consignee_state_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `buyer_address` text COLLATE utf8mb4_unicode_ci,
  `buyer_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_gst` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buyer_state_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT '0.00',
  `cgst_rate` decimal(5,2) DEFAULT '0.00',
  `cgst_amount` decimal(12,2) DEFAULT '0.00',
  `sgst_rate` decimal(5,2) DEFAULT '0.00',
  `sgst_amount` decimal(12,2) DEFAULT '0.00',
  `total_tax` decimal(12,2) DEFAULT '0.00',
  `round_off` decimal(8,2) DEFAULT '0.00',
  `net_amount` decimal(12,2) DEFAULT '0.00',
  `open_balance` decimal(12,2) DEFAULT '0.00',
  `closing_balance` decimal(12,2) DEFAULT '0.00',
  `bank_holder_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_account_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_ifsc` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_branch` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `branch_id` int(10) UNSIGNED DEFAULT NULL,
  `client_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_counters`
--

CREATE TABLE `invoice_counters` (
  `branch_id` int(10) UNSIGNED NOT NULL,
  `last_number` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_global_counter`
--

CREATE TABLE `invoice_global_counter` (
  `id` int(10) UNSIGNED NOT NULL,
  `last_number` int(10) UNSIGNED NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `invoice_items`
--

CREATE TABLE `invoice_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `invoice_id` int(10) UNSIGNED NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `hsn` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qty` decimal(10,2) NOT NULL DEFAULT '0.00',
  `per` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'NOS',
  `rate_incl` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rate_excl` decimal(12,2) NOT NULL DEFAULT '0.00',
  `taxable_amt` decimal(12,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ot_details`
--

CREATE TABLE `ot_details` (
  `id` int(11) NOT NULL,
  `emp_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `emp_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `salary_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `start_time` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `end_time` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_ot_hours` decimal(5,2) NOT NULL,
  `ot_salary` decimal(10,2) NOT NULL DEFAULT '0.00',
  `ot_date` date NOT NULL,
  `branch_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `hsn` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `unit` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pcs',
  `product_date` date DEFAULT NULL,
  `factory_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `selling_price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `stock_qty` int(11) NOT NULL DEFAULT '0',
  `min_stock` int(11) NOT NULL DEFAULT '0',
  `description` text COLLATE utf8mb4_unicode_ci,
  `branch_id` int(10) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_bills`
--

CREATE TABLE `purchase_bills` (
  `id` int(10) UNSIGNED NOT NULL,
  `company_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invoice_no` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bill_date` date NOT NULL,
  `total_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_bill_items`
--

CREATE TABLE `purchase_bill_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `purchase_bill_id` int(10) UNSIGNED NOT NULL,
  `product_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(12,2) NOT NULL,
  `rate` decimal(12,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `purchase_stock`
--

CREATE TABLE `purchase_stock` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` varchar(100) NOT NULL,
  `product_name` varchar(255) NOT NULL,
  `total_purchased` decimal(12,2) NOT NULL DEFAULT '0.00',
  `current_stock` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rate` decimal(12,2) NOT NULL DEFAULT '0.00',
  `branch_id` int(10) UNSIGNED NOT NULL,
  `last_updated` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `quotations`
--

CREATE TABLE `quotations` (
  `id` int(10) UNSIGNED NOT NULL,
  `quote_no` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quote_date` date NOT NULL,
  `valid_until` date DEFAULT NULL,
  `po_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dispatched_through` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vehicle_no` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `other_ref` text COLLATE utf8mb4_unicode_ci,
  `client_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_gst` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_address` text COLLATE utf8mb4_unicode_ci,
  `client_state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `client_state_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ship_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ship_address` text COLLATE utf8mb4_unicode_ci,
  `ship_gst` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ship_state` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ship_state_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT '0.00',
  `tax_percent` decimal(5,2) NOT NULL DEFAULT '18.00',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `declaration` text COLLATE utf8mb4_unicode_ci,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `quotation_items`
--

CREATE TABLE `quotation_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `quotation_id` int(10) UNSIGNED NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `hsn` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `due_on` date DEFAULT NULL,
  `unit` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'Nos',
  `quantity` decimal(12,2) NOT NULL,
  `rate` decimal(12,2) NOT NULL,
  `amount` decimal(12,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salaries`
--

CREATE TABLE `salaries` (
  `id` int(10) UNSIGNED NOT NULL,
  `employeeName` varchar(255) NOT NULL,
  `employeeId` varchar(100) NOT NULL,
  `salary` decimal(12,2) NOT NULL,
  `paid` decimal(12,2) DEFAULT '0.00',
  `balance` decimal(12,2) GENERATED ALWAYS AS ((`salary` - `paid`)) STORED,
  `type` enum('Days','Weeks','Monthly') NOT NULL DEFAULT 'Days',
  `salary_date` date NOT NULL,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(64) NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `stock_damage_log`
--

CREATE TABLE `stock_damage_log` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `branch_id` int(10) UNSIGNED DEFAULT NULL,
  `damage_date` date NOT NULL,
  `qty` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `stock_deductions`
--

CREATE TABLE `stock_deductions` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` varchar(100) NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `branch_id` int(10) UNSIGNED NOT NULL,
  `deducted_qty` decimal(12,2) NOT NULL,
  `note` text,
  `deducted_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `username` varchar(60) NOT NULL,
  `password` varchar(255) NOT NULL,
  `full_name` varchar(120) NOT NULL DEFAULT '',
  `role` enum('admin','branch_user') NOT NULL DEFAULT 'branch_user',
  `branch_id` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `full_name`, `role`, `branch_id`, `is_active`, `created_at`) VALUES
(1, 'admin', 'Admin@123', 'Administrator', 'admin', NULL, 1, '2026-06-10 10:36:06'),
(2, 'branch_a', 'BranchA@123', 'Branch A User', 'branch_user', 1, 1, '2026-06-10 10:36:06'),
(3, 'branch_b', 'BranchB@123', 'Branch B User', 'branch_user', 2, 1, '2026-06-10 10:36:06'),
(4, 'branch_c', 'BranchC@123', 'Branch C User', 'branch_user', 3, 1, '2026-06-10 10:36:06');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance`
--
ALTER TABLE `attendance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_date` (`employee_id`,`date`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_code` (`code`);

--
-- Indexes for table `branch_amounts`
--
ALTER TABLE `branch_amounts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_client_phone_branch` (`phone`,`branch_id`),
  ADD KEY `idx_client_branch` (`branch_id`);

--
-- Indexes for table `client_payments`
--
ALTER TABLE `client_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cp_client` (`client_id`),
  ADD KEY `idx_cp_branch` (`branch_id`);

--
-- Indexes for table `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `emp_id` (`emp_id`),
  ADD UNIQUE KEY `unique_empid` (`emp_id`),
  ADD UNIQUE KEY `unique_phone` (`phone_number`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_invoice_no` (`invoice_no`),
  ADD KEY `idx_invoice_branch` (`branch_id`),
  ADD KEY `idx_invoice_client` (`client_id`);

--
-- Indexes for table `invoice_counters`
--
ALTER TABLE `invoice_counters`
  ADD PRIMARY KEY (`branch_id`);

--
-- Indexes for table `invoice_global_counter`
--
ALTER TABLE `invoice_global_counter`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ii_invoice` (`invoice_id`);

--
-- Indexes for table `ot_details`
--
ALTER TABLE `ot_details`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_employee_date` (`emp_id`,`ot_date`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `hsn` (`hsn`),
  ADD KEY `idx_product_name` (`product_name`),
  ADD KEY `idx_hsn` (`hsn`);

--
-- Indexes for table `purchase_bills`
--
ALTER TABLE `purchase_bills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pb_branch` (`branch_id`),
  ADD KEY `idx_pb_company` (`company_name`),
  ADD KEY `idx_pb_invoice` (`invoice_no`),
  ADD KEY `idx_pb_date` (`bill_date`);

--
-- Indexes for table `purchase_bill_items`
--
ALTER TABLE `purchase_bill_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pbi_bill` (`purchase_bill_id`),
  ADD KEY `idx_pbi_product` (`product_id`),
  ADD KEY `idx_pbi_branch` (`branch_id`);

--
-- Indexes for table `purchase_stock`
--
ALTER TABLE `purchase_stock`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_branch` (`product_id`,`branch_id`),
  ADD KEY `idx_ps_branch` (`branch_id`);

--
-- Indexes for table `quotations`
--
ALTER TABLE `quotations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_quote_branch` (`quote_no`,`branch_id`),
  ADD KEY `idx_q_branch` (`branch_id`);

--
-- Indexes for table `quotation_items`
--
ALTER TABLE `quotation_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_qi_quotation` (`quotation_id`);

--
-- Indexes for table `salaries`
--
ALTER TABLE `salaries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user` (`user_id`);

--
-- Indexes for table `stock_damage_log`
--
ALTER TABLE `stock_damage_log`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_product_date` (`product_id`,`damage_date`),
  ADD KEY `idx_sdl_branch` (`branch_id`),
  ADD KEY `idx_sdl_date` (`damage_date`);

--
-- Indexes for table `stock_deductions`
--
ALTER TABLE `stock_deductions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sd_branch` (`branch_id`),
  ADD KEY `idx_sd_product` (`product_id`),
  ADD KEY `idx_sd_date` (`deducted_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_username` (`username`),
  ADD KEY `idx_branch` (`branch_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance`
--
ALTER TABLE `attendance`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `branch_amounts`
--
ALTER TABLE `branch_amounts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `client_payments`
--
ALTER TABLE `client_payments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `employees`
--
ALTER TABLE `employees`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `invoices`
--
ALTER TABLE `invoices`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `invoice_items`
--
ALTER TABLE `invoice_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `ot_details`
--
ALTER TABLE `ot_details`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `purchase_bills`
--
ALTER TABLE `purchase_bills`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `purchase_bill_items`
--
ALTER TABLE `purchase_bill_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `purchase_stock`
--
ALTER TABLE `purchase_stock`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `quotations`
--
ALTER TABLE `quotations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `quotation_items`
--
ALTER TABLE `quotation_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `salaries`
--
ALTER TABLE `salaries`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `stock_damage_log`
--
ALTER TABLE `stock_damage_log`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `stock_deductions`
--
ALTER TABLE `stock_deductions`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance`
--
ALTER TABLE `attendance`
  ADD CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `branch_amounts`
--
ALTER TABLE `branch_amounts`
  ADD CONSTRAINT `fk_branch_amounts_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `client_payments`
--
ALTER TABLE `client_payments`
  ADD CONSTRAINT `fk_cp_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoice_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_invoice_client` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `invoice_counters`
--
ALTER TABLE `invoice_counters`
  ADD CONSTRAINT `fk_invoice_counters_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `invoice_items`
--
ALTER TABLE `invoice_items`
  ADD CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_bills`
--
ALTER TABLE `purchase_bills`
  ADD CONSTRAINT `fk_purchase_bills_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_bill_items`
--
ALTER TABLE `purchase_bill_items`
  ADD CONSTRAINT `fk_pbi_bill` FOREIGN KEY (`purchase_bill_id`) REFERENCES `purchase_bills` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pbi_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `purchase_stock`
--
ALTER TABLE `purchase_stock`
  ADD CONSTRAINT `fk_product_stock_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quotations`
--
ALTER TABLE `quotations`
  ADD CONSTRAINT `fk_quotations_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `quotation_items`
--
ALTER TABLE `quotation_items`
  ADD CONSTRAINT `fk_quotation_items_quotation` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `salaries`
--
ALTER TABLE `salaries`
  ADD CONSTRAINT `salaries_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `stock_deductions`
--
ALTER TABLE `stock_deductions`
  ADD CONSTRAINT `fk_stock_deductions_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- =============================================================
-- schema_updates.sql
-- Run this ONCE on the existing `bipfencing` database.
-- Adds GST + payment tracking columns to purchase_bills
-- and a new purchase_bill_payments table.
-- =============================================================

USE `bipfencing`;

-- -------------------------------------------------------------
-- 1. New columns on purchase_bills
-- -------------------------------------------------------------
ALTER TABLE `purchase_bills`
  ADD COLUMN `subtotal`        DECIMAL(12,2) NOT NULL DEFAULT '0.00' AFTER `bill_date`,
  ADD COLUMN `gst_enabled`     TINYINT(1)    NOT NULL DEFAULT '0'    AFTER `subtotal`,
  ADD COLUMN `gst_rate`        DECIMAL(5,2)  NOT NULL DEFAULT '0.00' AFTER `gst_enabled`,
  ADD COLUMN `gst_amount`      DECIMAL(12,2) NOT NULL DEFAULT '0.00' AFTER `gst_rate`,
  ADD COLUMN `opening_balance` DECIMAL(12,2) NOT NULL DEFAULT '0.00' AFTER `total_amount`,
  ADD COLUMN `paid_amount`     DECIMAL(12,2) NOT NULL DEFAULT '0.00' AFTER `opening_balance`,
  ADD COLUMN `closing_balance` DECIMAL(12,2) NOT NULL DEFAULT '0.00' AFTER `paid_amount`;

-- Backfill existing rows: subtotal = total_amount (no GST previously),
-- closing_balance = total_amount (nothing paid yet).
UPDATE `purchase_bills`
   SET `subtotal` = `total_amount`,
       `closing_balance` = `total_amount`
 WHERE `subtotal` = 0;

-- -------------------------------------------------------------
-- 2. New table: purchase_bill_payments
--    Every payment (advance at bill time, or later part payments)
--    is logged here. paid_amount on the bill = SUM of these.
-- -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `purchase_bill_payments` (
  `id`               INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `purchase_bill_id` INT(10) UNSIGNED NOT NULL,
  `amount`           DECIMAL(12,2)    NOT NULL,
  `payment_date`     DATE             NOT NULL,
  `note`             VARCHAR(255)     DEFAULT NULL,
  `branch_id`        INT(10) UNSIGNED NOT NULL,
  `created_at`       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pbp_bill`   (`purchase_bill_id`),
  KEY `idx_pbp_branch` (`branch_id`),
  CONSTRAINT `fk_pbp_bill`   FOREIGN KEY (`purchase_bill_id`) REFERENCES `purchase_bills` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pbp_branch` FOREIGN KEY (`branch_id`)        REFERENCES `branches` (`id`)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================
-- schema_updates_inventory.sql
-- Run this ONCE on the existing `bipfencing` database.
-- Adds low-stock alert level to purchase_stock and fixes
-- any negative stock values.
-- =============================================================

USE `bipfencing`;

-- -------------------------------------------------------------
-- 1. Low stock alert level on purchase_stock (0 = no alert set)
-- -------------------------------------------------------------
ALTER TABLE `purchase_stock`
  ADD COLUMN `min_stock` DECIMAL(12,2) NOT NULL DEFAULT '0.00' AFTER `rate`;

-- -------------------------------------------------------------
-- 2. Fix any existing negative values (stock can never be below 0)
-- -------------------------------------------------------------
UPDATE `purchase_stock` SET `current_stock` = 0 WHERE `current_stock` < 0;
UPDATE `purchase_stock` SET `total_purchased` = 0 WHERE `total_purchased` < 0;
