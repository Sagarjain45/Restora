import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import HomePage from '../pages/HomePage';
import LoginPage from '../pages/auth/LoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import RestaurantDashboardPage from '../pages/restaurant/RestaurantDashboardPage';
import NotFoundPage from '../pages/NotFoundPage';
import ProtectedRoute from '../components/common/ProtectedRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="auth/login" element={<LoginPage />} />

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

        {/* Catch-All 404 Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
