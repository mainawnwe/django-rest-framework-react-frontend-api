import React from 'react';
import { tableStyle, thStyle, tdStyle } from '../../components/common';

export default function ShiftLog({ attendanceLogs }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={tableStyle}>
        <thead>
          <tr style={{ background: '#2c3e50', color: 'white', textAlign: 'left' }}>
            <th style={thStyle}>ဝန်ထမ်းအမည်</th>
            <th style={thStyle}>Clock In အချိန်</th>
            <th style={thStyle}>Clock Out အချိန်</th>
            <th style={thStyle}>စုစုပေါင်း နာရီ</th>
          </tr>
        </thead>
        <tbody>
          {attendanceLogs.length > 0 ? attendanceLogs.map((log, index) => (
            <tr key={log.id} style={{ background: index % 2 === 0 ? '#fcfcfc' : '#ffffff' }}>
              <td style={tdStyle}>{log.employee_name}</td>
              <td style={tdStyle}>{new Date(log.clock_in).toLocaleString()}</td>
              <td style={tdStyle}>{log.clock_out ? new Date(log.clock_out).toLocaleString() : <span style={{ color: '#27ae60', fontWeight: 'bold' }}>⚡ အလုပ်လုပ်နေဆဲ...</span>}</td>
              <td style={tdStyle}>{log.hours_worked} hrs</td>
            </tr>
          )) : <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>မှတ်တမ်း မရှိသေးပါ။</td></tr>}
        </tbody>
      </table>
    </div>
  );
}