import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./components/AdminLayout";

// Auth
import Login from "./pages/Login";

// Main
import Dashboard from "./pages/Dashboard";

// Billing
import TaxInvoice from "./pages/TaxInvoice";
import PurchaseBill from "./pages/PurchaseBill";
import Quotation from "./pages/Quotation";

// Stock Management
import PurchaseInventory from "./pages/PurchaseInventory";
import Products from "./pages/Products";

// Staff Management
import AdminFeatures from "./pages/AdminFeatures";
import Employee_details from "./pages/Employee_details";
import Salary from "./pages/Salary";
import Attendance from "./pages/Attendance";
import OT from "./pages/OT";

// CRM
import Clients from "./pages/Clients";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />

        {/* Billing */}
        <Route path="tax-invoice" element={<TaxInvoice />} />
        <Route path="purchase-bill" element={<PurchaseBill />} />
        <Route path="quotation" element={<Quotation />} />

        {/* Stock Management */}
        <Route path="purchase-inventory" element={<PurchaseInventory />} />
        <Route path="products" element={<Products />} />

        {/* Staff Management */}
        <Route path="admin-features" element={<AdminFeatures />} />
        <Route path="employee-details" element={<Employee_details />} />
        <Route path="salary" element={<Salary />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="ot" element={<OT />} />

        {/* CRM */}
        <Route path="clients" element={<Clients />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
