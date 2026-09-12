import React, { useState, useEffect } from 'react';
import { getEmployees, createEmployee, deleteEmployee, getDepartments, createDepartment } from './services/api';

function App() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // Form state with backend-compatible employment_type default
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    department: '',
    employment_type: 'full_time',
    salary: '',
    hire_date: new Date().toISOString().split('T')[0],
  });

  // State for creating a new department on-the-fly
  const [isCreatingDept, setIsCreatingDept] = useState(false);
  const [newDeptData, setNewDeptData] = useState({ name: '', code: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const empRes = await getEmployees();
      const deptRes = await getDepartments();
      setEmployees(empRes.data);
      setDepartments(deptRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNewDeptChange = (e) => {
    setNewDeptData({ ...newDeptData, [e.target.name]: e.target.value });
  };

  // Save new department dynamically
  const handleSaveDepartment = async () => {
    if (!newDeptData.name || !newDeptData.code) {
      alert("Please provide both Department Name and Code.");
      return;
    }
    try {
      const response = await createDepartment(newDeptData);
      const deptRes = await getDepartments();
      setDepartments(deptRes.data);
      
      setFormData({ ...formData, department: response.data.id });
      setNewDeptData({ name: '', code: '' });
      setIsCreatingDept(false);
    } catch (error) {
      console.error("Error creating department:", error);
      alert("Failed to create department. Make sure the code/name is unique.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEmployee(formData);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        phone_number: '',
        department: '',
        employment_type: 'full_time',
        salary: '',
        hire_date: new Date().toISOString().split('T')[0],
      });
      fetchData();
    } catch (error) {
      console.error("Error creating employee:", error);
      alert("Error onboarding employee. Check fields.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);
      fetchData();
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h2>Enterprise HR Management System</h2>

      {/* Registration Form */}
      <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #dee2e6' }}>
        <h3>Onboard New Employee</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required style={{ padding: '8px' }} />
          <input type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required style={{ padding: '8px' }} />
          <input type="email" name="email" placeholder="Corporate Email" value={formData.email} onChange={handleChange} required style={{ padding: '8px' }} />
          <input type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} style={{ padding: '8px' }} />
          
          {/* Department Selection / Creation Container */}
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', alignItems: 'center' }}>
            {!isCreatingDept ? (
              <>
                <select name="department" value={formData.department} onChange={handleChange} required style={{ padding: '8px', flex: 1 }}>
                  <option value="">Select Existing Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                  ))}
                </select>
                <button 
                  type="button" 
                  onClick={() => setIsCreatingDept(true)} 
                  style={{ padding: '8px 12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                  + Add New Dept
                </button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '5px', flex: 1, background: '#e9ecef', padding: '10px', borderRadius: '4px' }}>
                <input 
                  type="text" 
                  name="name" 
                  placeholder="Dept Name (e.g. Engineering)" 
                  value={newDeptData.name} 
                  onChange={handleNewDeptChange} 
                  style={{ padding: '6px', flex: 1 }} 
                />
                <input 
                  type="text" 
                  name="code" 
                  placeholder="Code (e.g. ENG)" 
                  value={newDeptData.code} 
                  onChange={handleNewDeptChange} 
                  style={{ padding: '6px', width: '100px' }} 
                />
                <button type="button" onClick={handleSaveDepartment} style={{ background: '#28a745', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '3px' }}>Save</button>
                <button type="button" onClick={() => setIsCreatingDept(false)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '6px 12px', cursor: 'pointer', borderRadius: '3px' }}>Cancel</button>
              </div>
            )}
          </div>

          {/* Corrected Employment Type Options Matching Django Model TextChoices */}
          <select name="employment_type" value={formData.employment_type} onChange={handleChange} style={{ padding: '8px' }}>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="INT">Intern</option>
          </select>

          <input type="number" name="salary" placeholder="Annual Salary ($)" value={formData.salary} onChange={handleChange} required style={{ padding: '8px' }} />
          
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '3px' }}>Hire Date:</label>
            <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} required style={{ padding: '8px', width: '100%' }} />
          </div>
        </div>

        <button type="submit" style={{ marginTop: '15px', padding: '10px 20px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Register Employee</button>
      </form>

      {/* Employee Directory Table */}
      <h3>Global Directory</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
        <thead>
          <tr style={{ background: '#343a40', color: 'white' }}>
            <th>Full Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Type</th>
            <th>Salary</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.length > 0 ? (
            employees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.first_name} {emp.last_name}</td>
                <td>{emp.email}</td>
                <td>{emp.department_name || 'N/A'}</td>
                <td>{emp.employment_type}</td>
                <td>${Number(emp.salary).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleDelete(emp.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}>Terminate</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" style={{ textAlign: 'center' }}>No corporate records found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;