import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isStaff, setIsStaff] = useState(localStorage.getItem('is_staff') === 'true');
  const [token, setToken] = useState(localStorage.getItem('access_token'));
  const [role, setRole] = useState(localStorage.getItem('role') || 'employee');
  const [employeeId, setEmployeeId] = useState(localStorage.getItem('employee_id') || null);

  const login = (data) => {
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('is_staff', data.is_staff);
    localStorage.setItem('role', data.role || (data.is_staff ? 'admin' : 'employee'));
    localStorage.setItem('employee_id', data.employee_id || '');
    setToken(data.access);
    setIsStaff(data.is_staff);
    setRole(data.role || (data.is_staff ? 'admin' : 'employee'));
    setEmployeeId(data.employee_id || null);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setIsStaff(false);
    setRole('employee');
    setEmployeeId(null);
  };

  return (
    <AuthContext.Provider value={{ token, isStaff, role, employeeId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};