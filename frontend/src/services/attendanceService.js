import API from './api';

export const getAttendanceLogs = () => API.get('attendance/');
export const clockIn = (employee_id) => API.post('attendance/clock_in/', { employee_id });
export const clockOut = (employee_id) => API.post('attendance/clock_out/', { employee_id });

export const getLeaves = () => API.get('leaves/');
export const createLeave = (data) => API.post('leaves/', data);