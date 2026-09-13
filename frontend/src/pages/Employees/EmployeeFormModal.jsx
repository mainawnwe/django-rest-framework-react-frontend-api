import React from 'react';
import { inputStyle, primaryBtnStyle, secondaryBtnStyle, successBtnStyle, dangerBtnStyle } from '../../components/common';

export default function EmployeeFormModal({
  formData, handleChange, handleSubmit,
  departments, isCreatingDept, setIsCreatingDept,
  newDeptData, handleNewDeptChange, handleSaveDepartment,
  isAdmin
}) {
  // Admin များသာ ဝန်ထမ်းအသစ် ထည့်သွင်းနိုင်သည်
  if (!isAdmin) return null;

  return (
    <div>
      <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px', marginTop: 0 }}>ဝန်ထမ်းအသစ် မှတ်ပုံတင်ရန် (Admin Only)</h3>
      <form onSubmit={handleSubmit} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #e9ecef' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <input type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required style={inputStyle} />
          <input type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required style={inputStyle} />
          <input type="email" name="email" placeholder="Corporate Email" value={formData.email} onChange={handleChange} required style={inputStyle} />
          <input type="text" name="phone_number" placeholder="Phone Number" value={formData.phone_number} onChange={handleChange} style={inputStyle} />
          
          <div style={{ gridColumn: 'span 2', display: 'flex', gap: '10px', alignItems: 'center' }}>
            {!isCreatingDept ? (
              <>
                <select name="department" value={formData.department} onChange={handleChange} required style={{ ...inputStyle, flex: 1 }}>
                  <option value="">Select Existing Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name} ({dept.code})</option>
                  ))}
                </select>
                <button type="button" onClick={() => setIsCreatingDept(true)} style={secondaryBtnStyle}>+ Add New Dept</button>
              </>
            ) : (
              <div style={{ display: 'flex', gap: '8px', flex: 1, background: '#e9ecef', padding: '10px', borderRadius: '8px' }}>
                <input type="text" name="name" placeholder="Dept Name" value={newDeptData.name} onChange={handleNewDeptChange} style={{ ...inputStyle, flex: 1 }} />
                <input type="text" name="code" placeholder="Code (e.g. IT01)" value={newDeptData.code} onChange={handleNewDeptChange} style={{ ...inputStyle, width: '120px' }} />
                <button type="button" onClick={handleSaveDepartment} style={successBtnStyle}>Save</button>
                <button type="button" onClick={() => setIsCreatingDept(false)} style={dangerBtnStyle}>Cancel</button>
              </div>
            )}
          </div>

          <select name="employment_type" value={formData.employment_type} onChange={handleChange} style={inputStyle}>
            <option value="full_time">Full Time</option>
            <option value="part_time">Part Time</option>
            <option value="contract">Contract</option>
            <option value="INT">Intern</option>
          </select>

          <input type="number" name="salary" placeholder="Annual Salary ($)" value={formData.salary} onChange={handleChange} required style={inputStyle} />
          
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '5px', fontWeight: '500' }}>Hire Date:</label>
            <input type="date" name="hire_date" value={formData.hire_date} onChange={handleChange} required style={inputStyle} />
          </div>
        </div>
        <button type="submit" style={{ ...primaryBtnStyle, marginTop: '20px' }}>Register Employee</button>
      </form>
    </div>
  );
}