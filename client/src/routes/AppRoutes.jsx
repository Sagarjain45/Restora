import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterRestaurantPage from '../pages/auth/RegisterRestaurantPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import RestaurantDashboardPage from '../pages/restaurant/RestaurantDashboardPage';
import TableManagementPage from '../pages/restaurant/TableManagementPage';
import MenuManagementPage from '../pages/restaurant/MenuManagementPage';
import OrderManagementPage from '../pages/restaurant/OrderManagementPage';
import BillingManagementPage from '../pages/restaurant/BillingManagementPage';
import QueueManagementPage from '../pages/restaurant/QueueManagementPage';
import ReservationManagementPage from '../pages/restaurant/ReservationManagementPage';
import CustomerManagementPage from '../pages/restaurant/CustomerManagementPage';
import StaffManagementPage from '../pages/restaurant/StaffManagementPage';
import OrderHistoryPage from '../pages/restaurant/OrderHistoryPage';
import ReportsPage from '../pages/restaurant/ReportsPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="auth/login" element={<LoginPage />} />
        <Route path="auth/register" element={<RegisterRestaurantPage />} />
        <Route path="register" element={<RegisterRestaurantPage />} />

        {/* Platform Admin Portal (Role-Guarded) */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Restaurant Operations Portal (Role-Guarded) */}
        <Route
          path="restaurant/dashboard"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_STAFF']}>
              <RestaurantDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="restaurant/tables"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_STAFF']}>
              <TableManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="restaurant/menu"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_STAFF']}>
              <MenuManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="restaurant/orders"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_STAFF']}>
              <OrderManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="restaurant/billing"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_STAFF']}>
              <BillingManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="restaurant/queue"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_STAFF']}>
              <QueueManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="restaurant/reservations"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_STAFF']}>
              <ReservationManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="restaurant/customers"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_STAFF']}>
              <CustomerManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="restaurant/staff"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER']}>
              <StaffManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="restaurant/order-history"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_STAFF']}>
              <OrderHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="restaurant/reports"
          element={
            <ProtectedRoute allowedRoles={['RESTAURANT_OWNER', 'RESTAURANT_STAFF']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Catch-All 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
