import React, { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export const ProtectedRoute = () => {
  const { token } = useContext(AuthContext);
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};

export const AdminRoute = () => {
  const { token, role } = useContext(AuthContext);
  return token && role === 'admin' ? <Outlet /> : <Navigate to="/" replace />;
};

export const EmployeeRoute = () => {
  const { token, role } = useContext(AuthContext);
  return token && role === 'employee' ? <Outlet /> : <Navigate to="/" replace />;
};