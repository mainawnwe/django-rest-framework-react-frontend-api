import React from 'react';
import { inputStyle, successBtnStyle, dangerBtnStyle } from '../../components/common';

export default function ClockInCard({ employees, selectedEmployeeId, setSelectedEmployeeId, handleClockIn, handleClockOut, isAdmin, employeeId }) {
  return (
    <div>
      <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px', marginTop: 0 }}>အလုပ်တက်/ဆင်း မှတ်တမ်း (Clock In / Clock Out)</h3>
      <div style={{ background: '#ebf5fb', padding: '20px', borderRadius: '10px', marginBottom: '25px', display: 'flex', gap: '15px', alignItems: 'center', border: '1px solid #aed6f1', flexWrap: 'wrap' }}>
        {isAdmin ? (
          // Admin များက မည်သူ့အတွက်မဆို Clock In/Out လုပ်နိုင်သည်
          <select value={selectedEmployeeId} onChange={(e) => setSelectedEmployeeId(e.target.value)} style={{ ...inputStyle, width: '350px', flex: 1 }}>
            <option value="">ဝန်ထမ်း အမည် ရွေးချယ်ပါ...</option>
            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
          </select>
        ) : (
          // Employee များက မိမိကိုယ်တိုင်အတွက်သာ Clock In/Out လုပ်နိုင်သည်
          <div style={{ flex: 1, fontSize: '16px', fontWeight: '600', color: '#2c3e50' }}>
            {employees.find(e => e.id === employeeId)?.first_name || 'ကျွန်ုပ်'} {employees.find(e => e.id === employeeId)?.last_name || ''}
          </div>
        )}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleClockIn} style={successBtnStyle}>Clock In (အလုပ်ဝင်)</button>
          <button onClick={handleClockOut} style={dangerBtnStyle}>Clock Out (အလုပ်ဆင်း)</button>
        </div>
      </div>
    </div>
  );
}