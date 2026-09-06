import React, { useState, useEffect } from 'react';
import { getEmployees, createEmployee, deleteEmployee } from './services/api';
import './App.css';

function App() {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    role: '',
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createEmployee(formData);
      setFormData({ name: '', email: '', department: '', role: '' });
      fetchEmployees();
    } catch (error) {
      console.error("Error creating employee:", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial' }}>
      <h2>HR Management System (Django + React)</h2>

      {/* Add Employee Form */}
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
        <h3>Add New Employee</h3>
        <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required style={{ margin: '5px', padding: '8px' }} />
        <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required style={{ margin: '5px', padding: '8px' }} />
        <input type="text" name="department" placeholder="Department" value={formData.department} onChange={handleChange} required style={{ margin: '5px', padding: '8px' }} />
        <input type="text" name="role" placeholder="Role/Title" value={formData.role} onChange={handleChange} required style={{ margin: '5px', padding: '8px' }} />
        <button type="submit" style={{ margin: '5px', padding: '8px 15px', background: '#007BFF', color: '#white', border: 'none', cursor: 'pointer' }}>Add Employee</button>
      </form>

      {/* Employee List Table */}
      <h3>Employee Directory</h3>
      <table border="1" cellPadding="10" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#ddd' }}>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {employees.length > 0 ? (
            employees.map((emp) => (
              <tr key={emp.id}>
                <td>{emp.name}</td>
                <td>{emp.email}</td>
                <td>{emp.department}</td>
                <td>{emp.role}</td>
                <td>
                  <button onClick={() => handleDelete(emp.id)} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center' }}>No employees found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default App;