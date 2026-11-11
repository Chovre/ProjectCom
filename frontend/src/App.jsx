import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import axiosInstance from './api/axiosInstance';
import endpoints from './api/endpoints';

// Public Pages
import LandingPage from './pages/auth/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AccessDeniedPage from './pages/auth/AccessDeniedPage';
import NotFoundPage from './pages/auth/NotFoundPage';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import AccountsPage from './pages/customer/AccountsPage';
import AccountDetailPage from './pages/customer/AccountDetailPage';
import DepositPage from './pages/customer/DepositPage';
import WithdrawalPage from './pages/customer/WithdrawalPage';
import TransferPage from './pages/customer/TransferPage';
import TransactionsPage from './pages/customer/TransactionsPage';
import TransactionDetailPage from './pages/customer/TransactionDetailPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminDepositRequestsPage from './pages/admin/AdminDepositRequestsPage';
import UserManagement from './pages/admin/UserManagement';
import AdminAccountsPage from './pages/admin/AdminAccountsPage';
import ApplicationsPage from './pages/admin/ApplicationsPage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

// Auditor Pages
import AuditorDashboard from './pages/auditor/AuditorDashboard';
import AuditorTransactionsPage from './pages/auditor/AuditorTransactionsPage';
import AuditorLedgerPage from './pages/auditor/AuditorLedgerPage';
import AuditorAuditPage from './pages/auditor/AuditorAuditPage';
import ReconciliationPage from './pages/auditor/ReconciliationPage';

export default function App() {
  useEffect(() => {
    // Silently pre-warm backend connection on app load so login responds in seconds
    axiosInstance.get(endpoints.health.check).catch(() => {});
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Customer Routes (ACCOUNT_HOLDER) */}
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['ACCOUNT_HOLDER', 'ROLE_ACCOUNT_HOLDER']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="accounts" element={<AccountsPage />} />
            <Route path="accounts/:id" element={<AccountDetailPage />} />
            <Route path="deposit" element={<DepositPage />} />
            <Route path="withdraw" element={<WithdrawalPage />} />
            <Route path="transfer" element={<TransferPage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="transactions/:reference" element={<TransactionDetailPage />} />
          </Route>

          {/* Admin Routes (ADMIN) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'ROLE_ADMIN']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="deposits" element={<AdminDepositRequestsPage />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="accounts" element={<AdminAccountsPage />} />
            <Route path="applications" element={<ApplicationsPage />} />
            <Route path="transactions" element={<AdminTransactionsPage />} />
            <Route path="audit" element={<AdminAuditPage />} />
          </Route>

          {/* Auditor Routes (AUDITOR) */}
          <Route
            path="/auditor"
            element={
              <ProtectedRoute allowedRoles={['AUDITOR', 'ROLE_AUDITOR']}>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/auditor/dashboard" replace />} />
            <Route path="dashboard" element={<AuditorDashboard />} />
            <Route path="transactions" element={<AuditorTransactionsPage />} />
            <Route path="ledger" element={<AuditorLedgerPage />} />
            <Route path="audit" element={<AuditorAuditPage />} />
            <Route path="reconciliation" element={<ReconciliationPage />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

