import React, { useContext } from 'react';
import { AuthContext } from '../context/authContext';
import Dashboard from '../pages/Dashboard/Dashboard';
import EmployeeFormModal from '../pages/Employees/EmployeeFormModal';
import EmployeeList from '../pages/Employees/EmployeeList';
import Payroll from '../pages/Payroll/Payroll';
import ClockInCard from '../pages/Attendance/ClockInCard';
import ShiftLog from '../pages/Attendance/ShiftLog';
import LeaveRequest from '../pages/Leave/LeaveRequest';

export default function AppRoutes({ activeTab, ...props }) {
  const { role, employeeId } = useContext(AuthContext);
  const isAdmin = role === 'admin';

  // Employee များအတွက် Admin-only tabs များကို URL manipulation ဖြင့် ဝင်ရောက်မရအောင် ကာကွယ်ခြင်း
  if (!isAdmin && ['employees', 'payroll'].includes(activeTab)) {
    return <Dashboard {...props} isAdmin={isAdmin} employeeId={employeeId} />;
  }

  switch (activeTab) {
    case 'dashboard':
      return <Dashboard {...props} isAdmin={isAdmin} employeeId={employeeId} />;
    case 'employees':
      return (
        <>
          <EmployeeFormModal {...props} isAdmin={isAdmin} />
          <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px' }}>ဝန်ထမ်းစာရင်း (Global Directory)</h3>
          <EmployeeList employees={props.employees} onDeleteEmployee={props.handleDeleteEmployee} isAdmin={isAdmin} />
        </>
      );
    case 'payroll':
      return <Payroll {...props} isAdmin={isAdmin} />;
    case 'attendance':
      return (
        <>
          <ClockInCard {...props} isAdmin={isAdmin} employeeId={employeeId} />
          <ShiftLog attendanceLogs={props.attendanceLogs} />
        </>
      );
    case 'leaves':
      return <LeaveRequest {...props} isAdmin={isAdmin} employeeId={employeeId} />;
    default:
      return <Dashboard {...props} isAdmin={isAdmin} employeeId={employeeId} />;
  }
}