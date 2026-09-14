import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import Auth from './components/Auth';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';
import { AuthContext } from './context/authContext';
import {
  getEmployees, createEmployee, deleteEmployee,
  getDepartments, createDepartment,
  getLeaves, createLeave, updateLeaveStatus,
  getAttendanceLogs, clockIn, clockOut,
  downloadPayslip,
  getLeaveBalances,
  adjustLeaveBalance,
  initializeLeaveBalances,
  getUpcomingHolidays
} from './services/api';

export default function App() {
  const { role, employeeId } = useContext(AuthContext);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('access_token'));
  const [activeTab, setActiveTab] = useState('dashboard');

  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);

  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone_number: '',
    department: '', employment_type: 'full_time', salary: '',
    hire_date: new Date().toISOString().split('T')[0],
  });
  const [isCreatingDept, setIsCreatingDept] = useState(false);
  const [newDeptData, setNewDeptData] = useState({ name: '', code: '' });

  const [leaveData, setLeaveData] = useState({
    employee: '', leave_type: 'casual', start_date: '', end_date: '', reason: ''
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const isAdmin = role === 'admin';

  // ── Logout — fetchData က ဒါကို ခေါ်နိုင်အောင် အပေါ်မှာ ထား ──
  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  }, []);

  // ── fetchData — isAdmin / employeeId ပြောင်းရင် identity အသစ် ──
  const fetchData = useCallback(async () => {
    try {
      const empRes = await getEmployees();
      const deptRes = await getDepartments();
      const leaveRes = await getLeaves('', 1, isAdmin ? null : employeeId);
      const attRes = await getAttendanceLogs(isAdmin ? null : employeeId);
      const balRes = await getLeaveBalances({ employee: isAdmin ? null : employeeId });
      const holidayRes = await getUpcomingHolidays();

      setEmployees(Array.isArray(empRes.data) ? empRes.data : (empRes.data.results || []));
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data.results || []));
      setLeaves(Array.isArray(leaveRes.data) ? leaveRes.data : (leaveRes.data.results || []));
      setAttendanceLogs(Array.isArray(attRes.data) ? attRes.data : (attRes.data.results || []));
      setLeaveBalances(Array.isArray(balRes.data) ? balRes.data : (balRes.data.results || []));
      setUpcomingHolidays(Array.isArray(holidayRes.data) ? holidayRes.data : (holidayRes.data.results || []));

    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response && error.response.status === 401) {
        handleLogout();
      }
      throw error;
    }
  }, [isAdmin, employeeId, handleLogout]);

  // ── Session restore — mount ပေါ်မှာ တစ်ခါပဲ run ──
  // didInitRef က fetchData identity ပြောင်းလည်း effect ပြန် run မဖြစ်အောင် တားတယ်။
  // (login ပြီးရင် handleLoginSuccess က ကိုယ်တိုင် fetchData ခေါ်တယ်။)
  const didInitRef = useRef(false);
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        await fetchData();
      } catch {
        if (cancelled) return;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
      }
    })();

    return () => { cancelled = true; };
  }, [fetchData]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    fetchData();
  };

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    // ⭐ File input fields - store the File object instead of the value ⭐
    if (type === 'file') {
      setFormData({ ...formData, [name]: files[0] || null });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleNewDeptChange = (e) =>
    setNewDeptData({ ...newDeptData, [e.target.name]: e.target.value });

  const handleSaveDepartment = async () => {
    if (!newDeptData.name || !newDeptData.code) {
      return alert("Please provide both Department Name and Code.");
    }
    try {
      const response = await createDepartment(newDeptData);
      setDepartments((prev) => [...prev, response.data]);
      setFormData({ ...formData, department: response.data.id });
      setNewDeptData({ name: '', code: '' });
      setIsCreatingDept(false);
      alert("Department အသစ် ထည့်သွင်းပြီးပါပြီ။");
    } catch (error) {
      console.error("Error creating department:", error);
      alert("Department အသစ်ထည့်ရန် မအောင်မြင်ပါ။ (Admin သို့မဟုတ် ခွင့်ပြုချက်လိုပါသည်)");
    }
  };

  const handleEmployeeSubmit = async (e) => {
    e.preventDefault();
    if (!isAdmin) return alert("Admin များသာ ဝန်ထမ်းအသစ် ထည့်သွင်းနိုင်ပါသည်။");
    try {
      await createEmployee(formData);
      setFormData({
        first_name: '', last_name: '', email: '', phone_number: '', department: '',
        employment_type: 'full_time', salary: '',
        hire_date: new Date().toISOString().split('T')[0],
        profile_picture: null, document: null,
      });
      // Reset file inputs visually
      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input) => (input.value = ''));
      fetchData();
      alert("ဝန်ထမ်းအသစ် မှတ်ပုံတင်ခြင်း အောင်မြင်ပါသည်။");
    } catch (error) {
      console.error("Error onboarding employee:", error);
      alert("Error onboarding employee. Admin privilege required.");
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!isAdmin) return alert("Admin များသာ ဝန်ထမ်းဖျက်နိုင်ပါသည်။");
    if (window.confirm("ဤဝန်ထမ်းကို ဖျက်ရန် သေချာပါသလား?")) {
      try {
        await deleteEmployee(id);
        fetchData();
      } catch (error) {
        console.error("Error deleting employee:", error);
        alert("Action failed. Admin privilege required.");
      }
    }
  };

  const handleDownloadPayslip = async (id, name) => {
    try {
      const response = await downloadPayslip(id);

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Payslip_${name}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading payslip:", error);
      alert("Payslip ဒေါင်းလုဒ်ဆွဲရာတွင် အမှားအယွင်းရှိနေပါသည်။ (Backend ကို reportlab တပ်ဆင်ထားမထား စစ်ဆေးပါ)");
    }
  };

  const handleLeaveChange = (e) =>
    setLeaveData({ ...leaveData, [e.target.name]: e.target.value });

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      // Employee များက မိမိအတွက်သာ ခွင့်တင်နိုင်သည်
      const leavePayload = isAdmin
        ? leaveData
        : { ...leaveData, employee: employeeId || leaveData.employee };
      await createLeave(leavePayload);
      setLeaveData({ employee: '', leave_type: 'casual', start_date: '', end_date: '', reason: '' });
      fetchData();
      alert("ခွင့်တင်ခြင်း အောင်မြင်ပါသည်။");
    } catch (error) {
      console.error("Error submitting leave:", error);
      alert("ခွင့်တင်ရန် မအောင်မြင်ပါ။");
    }
  };

  const handleLeaveAction = async (id, status) => {
    if (!isAdmin) return alert("Admin များသာ ခွင့်ပြု/ပယ်နိုင်ပါသည်။");
    try {
      await updateLeaveStatus(id, { status: status });
      fetchData();
    } catch (error) {
      console.error("Error updating leave status:", error);
      alert("Action failed. Admin privilege required.");
    }
  };

  const handleClockIn = async () => {
    if (!selectedEmployeeId) return alert("ဝန်ထမ်းကို အရင်ရွေးချယ်ပါ။");
    try {
      await clockIn(selectedEmployeeId);
      fetchData();
      alert("Clock In အောင်မြင်ပါသည်။");
    } catch (error) {
      console.error("Error during Clock In:", error);
      alert(error.response?.data?.error || "Error during Clock In");
    }
  };

  const handleClockOut = async () => {
    if (!selectedEmployeeId) return alert("ဝန်ထမ်းကို အရင်ရွေးချယ်ပါ။");
    try {
      await clockOut(selectedEmployeeId);
      fetchData();
      alert("Clock Out အောင်မြင်ပါသည်။");
    } catch (error) {
      console.error("Error during Clock Out:", error);
      alert(error.response?.data?.error || "Error during Clock Out");
    }
  };

  const handleAdjustBalance = async (balanceId, adjustmentDays, reason) => {
    if (!isAdmin) return alert("Admin များသာ balance ပြင်နိုင်ပါသည်။");
    try {
      await adjustLeaveBalance(balanceId, adjustmentDays, reason);
      fetchData();
      alert("Balance ပြင်ပြီးပါပြီ။");
    } catch (error) {
      console.error("Error adjusting balance:", error);
      alert("Balance ပြင်ရန် မအောင်မြင်ပါ။");
    }
  };

  const handleInitializeBalances = async (employeeIdToInit) => {
    if (!isAdmin) return alert("Admin များသာ balance ဖန်တီးနိုင်ပါသည်။");
    try {
      const year = new Date().getFullYear();
      await initializeLeaveBalances(employeeIdToInit, year);
      fetchData();
      alert(`${year} အတွက် balance ဖန်တီးပြီးပါပြီ။`);
    } catch (error) {
      console.error("Error initializing balances:", error);
      alert("Balance ဖန်တီးရန် မအောင်မြင်ပါ။");
    }
  };

  if (!isAuthenticated) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  const pageProps = {
    employees,
    departments,
    leaves,
    attendanceLogs,
    leaveBalances,
    handleAdjustBalance,
    handleInitializeBalances,
    upcomingHolidays,
    
    formData,
    handleChange,
    handleEmployeeSubmit,
    isCreatingDept,
    setIsCreatingDept,
    newDeptData,
    handleNewDeptChange,
    handleSaveDepartment,
    handleDeleteEmployee,
    handleDownloadPayslip,
    leaveData,
    handleLeaveChange,
    handleLeaveSubmit,
    handleLeaveAction,
    selectedEmployeeId,
    setSelectedEmployeeId,
    handleClockIn,
    handleClockOut,
    isAdmin,
    employeeId,
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout}>
      <AppRoutes activeTab={activeTab} {...pageProps} />
    </Layout>
  );
}