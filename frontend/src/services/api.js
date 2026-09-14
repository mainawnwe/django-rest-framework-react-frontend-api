import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api/",
});

let refreshRequest = null;

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

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

// search term နှင့် page number ကို parameter အဖြစ် ပါးလိုက်ခြင်း
export const getEmployees = (search = '', page = 1) =>
  API.get(`employees/?search=${search}&page=${page}`);


// ⭐ Employee create/update - FormData သုံး၍ File နှင့် Text fields များကို အတူ တင်ပို့ခြင်း ⭐
export const createEmployee = (data) => {
  const formData = new FormData();
  // Append all text fields
  Object.keys(data).forEach((key) => {
    if (key === 'profile_picture' || key === 'document') return; // files handled below
    if (data[key] !== undefined && data[key] !== null) {
      formData.append(key, data[key]);
    }
  });
  // Append file fields if present
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
export const getDepartments = () => API.get('departments/');
export const createDepartment = (data) => API.post('departments/', data);
export const downloadPayslip = (id) => API.get(`employees/${id}/generate_payslip/`, { responseType: 'blob' });

export const getAttendanceLogs = (employeeId = null) => 
  employeeId ? API.get(`attendance/?employee=${employeeId}`) : API.get('attendance/');
export const clockIn = (data) => API.post('attendance/clock_in/', data);
export const clockOut = (data) => API.post('attendance/clock_out/', data);
export const getLeaves = (search = '', page = 1, employeeId = null) =>
  employeeId ? API.get(`leaves/?employee=${employeeId}&search=${search}&page=${page}`) : API.get(`leaves/?search=${search}&page=${page}`);
export const createLeave = (data) => API.post('leaves/', data);
export const updateLeaveStatus = (id, data) => API.patch(`leaves/${id}/`, data);

export default API;