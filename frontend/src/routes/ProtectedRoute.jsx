import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute() {
  const token = useSelector((state) => state.auth.token);
  const location = useLocation();

  // If there's no JWT token, redirect to login page while preserving search/state location history
  return token ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
}
