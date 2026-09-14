import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000/api/',
});

let refreshRequest = null;

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const refreshToken = localStorage.getItem('refresh_token');

    if (
      error.response?.status !== 401 ||
      !refreshToken ||
      originalRequest?._retry ||
      originalRequest?.url?.endsWith('token/') ||
      originalRequest?.url?.endsWith('token/refresh/')
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      refreshRequest ||= API.post('token/refresh/', { refresh: refreshToken });
      const response = await refreshRequest;
      const accessToken = response.data?.access;

      if (!accessToken) {
        throw new Error('Token refresh response did not include an access token.');
      }

      localStorage.setItem('access_token', accessToken);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return API(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return Promise.reject(refreshError);
    } finally {
      refreshRequest = null;
    }
  },
);

// ── Auth ────────────────────────────────────────────────────
export const loginUser = async (credentials) => {
  const response = await API.post('token/', credentials);
  const { access, refresh, is_staff, role, employee_id } = response.data || {};

  if (access) {
    localStorage.setItem('access_token', access);
  }
  if (refresh) {
    localStorage.setItem('refresh_token', refresh);
  }
  if (is_staff !== undefined) {
    localStorage.setItem('is_staff', is_staff);
    localStorage.setItem('role', role || (is_staff ? 'admin' : 'employee'));
  }
  if (employee_id !== undefined) {
    localStorage.setItem('employee_id', employee_id || '');
  }

  return response;
};

// ── Employees ───────────────────────────────────────────────
export const getEmployees = (search = '', page = 1) =>
  API.get(`employees/?search=${search}&page=${page}`);

export const createEmployee = (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (key === 'profile_picture' || key === 'document') return;
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  if (data.profile_picture instanceof File) {
    formData.append('profile_picture', data.profile_picture);
  }
  if (data.document instanceof File) {
    formData.append('document', data.document);
  }
  return API.post('employees/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const updateEmployee = (id, data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (key === 'profile_picture' || key === 'document') return;
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  if (data.profile_picture instanceof File) {
    formData.append('profile_picture', data.profile_picture);
  }
  if (data.document instanceof File) {
    formData.append('document', data.document);
  }
  return API.patch(`employees/${id}/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const deleteEmployee = (id) => API.delete(`employees/${id}/`);

export const downloadPayslip = (id) =>
  API.get(`employees/${id}/generate_payslip/`, { responseType: 'blob' });

export const terminateEmployee = (id, reason = '') =>
  API.post(`employees/${id}/terminate/`, { reason });

// ── Departments ─────────────────────────────────────────────
export const getDepartments = () => API.get('departments/');
export const createDepartment = (data) => API.post('departments/', data);

// ── Attendance ──────────────────────────────────────────────
export const getAttendanceLogs = (employeeId = null) =>
  employeeId
    ? API.get(`attendance/?employee=${employeeId}`)
    : API.get('attendance/');

export const clockIn = (data) => API.post('attendance/clock_in/', data);
export const clockOut = (data) => API.post('attendance/clock_out/', data);

// ── Leaves ──────────────────────────────────────────────────
export const getLeaves = (search = '', page = 1, employeeId = null) =>
  employeeId
    ? API.get(`leaves/?employee=${employeeId}&search=${search}&page=${page}`)
    : API.get(`leaves/?search=${search}&page=${page}`);

export const createLeave = (data) => API.post('leaves/', data);
export const updateLeaveStatus = (id, data) => API.patch(`leaves/${id}/`, data);

// ── Leave Balances ──────────────────────────────────────────
export const getLeaveBalances = (params = {}) =>
  API.get('leave-balances/', { params });

export const createLeaveBalance = (data) =>
  API.post('leave-balances/', data);

export const updateLeaveBalance = (id, data) =>
  API.patch(`leave-balances/${id}/`, data);

export const deleteLeaveBalance = (id) =>
  API.delete(`leave-balances/${id}/`);

export const adjustLeaveBalance = (id, adjustmentDays, reason) =>
  API.post(`leave-balances/${id}/adjust/`, {
    adjustment_days: adjustmentDays,
    reason: reason,
  });

export const initializeLeaveBalances = (employeeId, year) =>
  API.post('leave-balances/initialize_for_employee/', {
    employee_id: employeeId,
    year: year,
  });

// ── Holidays ────────────────────────────────────────────────
export const getHolidays = (params = {}) =>
  API.get('holidays/', { params });

export const getUpcomingHolidays = (region = 'HK', days = 60) =>
  API.get('holidays/upcoming/', { params: { region, days } });

export const createHoliday = (data) => API.post('holidays/', data);

export const deleteHoliday = (id) => API.delete(`holidays/${id}/`);

export default API;