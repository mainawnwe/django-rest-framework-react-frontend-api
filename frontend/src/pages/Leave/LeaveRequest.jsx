import React from 'react';
import { inputStyle, primaryBtnStyle, successBtnStyle, dangerBtnStyle, tableStyle, thStyle, tdStyle } from '../../components/common';

export default function LeaveRequest({
  employees, leaveData, handleLeaveChange, handleLeaveSubmit,
  leaves, handleLeaveAction, isAdmin, employeeId
}) {
  return (
    <div>
      <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px', marginTop: 0 }}>ခွင့်တင်ရန် (Leave Application)</h3>
      <form onSubmit={handleLeaveSubmit} style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #e9ecef' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          {/* Employee များအတွက် မိမိကိုယ်တိုင်သာ ရွေးချယ်နိုင်သည် */}
          {isAdmin ? (
            <select name="employee" value={leaveData.employee} onChange={handleLeaveChange} required style={inputStyle}>
              <option value="">ဝန်ထမ်းရွေးချယ်ပါ</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
            </select>
          ) : (
            <select name="employee" value={employeeId || ''} disabled style={inputStyle}>
              <option value={employeeId || ''}>
                {employees.find(e => e.id === employeeId)?.first_name || 'ကျွန်ုပ်'} {employees.find(e => e.id === employeeId)?.last_name || ''}
              </option>
            </select>
          )}

          <select name="leave_type" value={leaveData.leave_type} onChange={handleLeaveChange} required style={inputStyle}>
            <option value="casual">Casual Leave (ရှောင်တခင်ခွင့်)</option>
            <option value="medical">Medical Leave (ဆေးခွင့်)</option>
            <option value="annual">Annual Leave (နှစ်စဉ်ခွင့်)</option>
          </select>

          <div>
            <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '5px', fontWeight: '500' }}>စတင်မည့်ရက်:</label>
            <input type="date" name="start_date" value={leaveData.start_date} onChange={handleLeaveChange} required style={inputStyle} />
          </div>
          
          <div>
            <label style={{ fontSize: '13px', color: '#666', display: 'block', marginBottom: '5px', fontWeight: '500' }}>ပြီးဆုံးမည့်ရက်:</label>
            <input type="date" name="end_date" value={leaveData.end_date} onChange={handleLeaveChange} required style={inputStyle} />
          </div>

          <textarea name="reason" placeholder="ခွင့်ယူရသည့် အကြောင်းရင်း..." value={leaveData.reason} onChange={handleLeaveChange} required style={{ ...inputStyle, gridColumn: 'span 2', height: '80px' }}></textarea>
        </div>
        <button type="submit" style={{ ...primaryBtnStyle, marginTop: '20px' }}>ခွင့်တင်မည်</button>
      </form>

      <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px' }}>ခွင့်တောင်းခံထားမှု စာရင်းများ</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#2c3e50', color: 'white', textAlign: 'left' }}>
              <th style={thStyle}>ဝန်ထမ်းအမည်</th>
              <th style={thStyle}>ခွင့်အမျိုးအစား</th>
              <th style={thStyle}>စတင်ရက်</th>
              <th style={thStyle}>ပြီးဆုံးရက်</th>
              <th style={thStyle}>အကြောင်းရင်း</th>
              <th style={thStyle}>Status</th>
              {isAdmin && <th style={thStyle}>Action (Admin)</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.length > 0 ? leaves.map((leave, index) => (
              <tr key={leave.id} style={{ background: index % 2 === 0 ? '#fcfcfc' : '#ffffff' }}>
                <td style={tdStyle}>{leave.employee_name}</td>
                <td style={tdStyle}>{leave.leave_type.toUpperCase()}</td>
                <td style={tdStyle}>{leave.start_date}</td>
                <td style={tdStyle}>{leave.end_date}</td>
                <td style={tdStyle}>{leave.reason}</td>
                <td style={tdStyle}>
                  <span style={{ 
                    padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: 'white', 
                    background: leave.status === 'pending' ? '#f39c12' : leave.status === 'approved' ? '#27ae60' : '#c0392b' 
                  }}>
                    {leave.status.toUpperCase()}
                  </span>
                </td>
                {isAdmin && (
                  <td style={tdStyle}>
                    {leave.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleLeaveAction(leave.id, 'approved')} style={successBtnStyle}>Approve</button>
                        <button onClick={() => handleLeaveAction(leave.id, 'rejected')} style={dangerBtnStyle}>Reject</button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            )) : <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>ခွင့်တင်ထားမှု မရှိသေးပါ။</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}