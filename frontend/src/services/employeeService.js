import API from './api';

export const getEmployees = () => API.get('employees/');
export const createEmployee = (data) => API.post('employees/', data);
export const deleteEmployee = (id) => API.delete(`employees/${id}/`);

export const getDepartments = () => API.get('departments/');
export const createDepartment = (data) => API.post('departments/', data);

export const downloadPayslip = (id) => API.get(`employees/${id}/generate_payslip/`, {
  responseType: 'blob', // File Download လုပ်ရန်အတွက် blob Response Type သုံးရပါမည်
});