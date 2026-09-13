import React, { useState, useEffect, useContext } from 'react';
import Auth from './components/Auth';
import Layout from './components/layout/Layout';
import AppRoutes from './routes/AppRoutes';
import { AuthContext } from './context/AuthContext';
import { 
  getEmployees, createEmployee, deleteEmployee, 
  getDepartments, createDepartment, 
  getLeaves, createLeave, updateLeaveStatus,
  getAttendanceLogs, clockIn, clockOut,
  downloadPayslip
} from './services/api';

export default function App() {
  const { role, employeeId } = useContext(AuthContext);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

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

  // Page Load လုပ်ချိန်မှာ Token ရှိမရှိ စစ်ဆေးခြင်း
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchData()
        .then(() => setIsAuthenticated(true))
        .catch(() => {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          setIsAuthenticated(false);
        });
    }
  }, []);

  const fetchData = async () => {
    try {
      // Admin များက အားလုံးကို မြင်နိုင်ပြီး၊ Employee များက မိမိဆိုင်ရာ အချက်အလက်များသာ မြင်နိုင်သည်
      const empRes = await getEmployees();
      const deptRes = await getDepartments();
      const leaveRes = await getLeaves('', 1, isAdmin ? null : employeeId);
      const attRes = await getAttendanceLogs(isAdmin ? null : employeeId);

      setEmployees(Array.isArray(empRes.data) ? empRes.data : (empRes.data.results || []));
      setDepartments(Array.isArray(deptRes.data) ? deptRes.data : (deptRes.data.results || []));
      setLeaves(Array.isArray(leaveRes.data) ? leaveRes.data : (leaveRes.data.results || []));
      setAttendanceLogs(Array.isArray(attRes.data) ? attRes.data : (attRes.data.results || []));
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response && error.response.status === 401) {
        handleLogout();
      }
      throw error;
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  const handleNewDeptChange = (e) => setNewDeptData({ ...newDeptData, [e.target.name]: e.target.value });

  const handleSaveDepartment = async () => {
    if (!newDeptData.name || !newDeptData.code) return alert("Please provide both Department Name and Code.");
    try {
      const response = await createDepartment(newDeptData);
      setDepartments((prev) => [...prev, response.data]);
      setFormData({ ...formData, department: response.data.id });
      setNewDeptData({ name: '', code: '' });
      setIsCreatingDept(false);
      alert("Department အသစ် ထည့်သွင်းပြီးပါပြီ။");
    } catch (error) {
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
        employment_type: 'full_time', salary: '', hire_date: new Date().toISOString().split('T')[0],
      });
      fetchData();
      alert("ဝန်ထမ်းအသစ် မှတ်ပုံတင်ခြင်း အောင်မြင်ပါသည်။");
    } catch (error) {
      alert("Error onboarding employee. Admin privilege required.");
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!isAdmin) return alert("Admin များသာ ဝန်ထမ်းဖျက်နိုင်ပါသည်။");
    if(window.confirm("ဤဝန်ထမ်းကို ဖျက်ရန် သေချာပါသလား?")) {
      try {
        await deleteEmployee(id);
        fetchData();
      } catch (error) {
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
      alert("Payslip ဒေါင်းလုဒ်ဆွဲရာတွင် အမှားအယွင်းရှိနေပါသည်။ (Backend ကို reportlab တပ်ဆင်ထားမထား စစ်ဆေးပါ)");
    }
  };

  const handleLeaveChange = (e) => setLeaveData({ ...leaveData, [e.target.name]: e.target.value });

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    try {
      // Employee များက မိမိအတွက်သာ ခွင့်တင်နိုင်သည်
      const leavePayload = isAdmin ? leaveData : { ...leaveData, employee: employeeId || leaveData.employee };
      await createLeave(leavePayload);
      setLeaveData({ employee: '', leave_type: 'casual', start_date: '', end_date: '', reason: '' });
      fetchData();
      alert("ခွင့်တင်ခြင်း အောင်မြင်ပါသည်။");
    } catch (error) {
      alert("ခွင့်တင်ရန် မအောင်မြင်ပါ။");
    }
  };

  const handleLeaveAction = async (id, status) => {
    if (!isAdmin) return alert("Admin များသာ ခွင့်ပြု/ပယ်နိုင်ပါသည်။");
    try {
      await updateLeaveStatus(id, { status: status });
      fetchData();
    } catch (error) {
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
      alert(error.response?.data?.error || "Error during Clock Out");
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