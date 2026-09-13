import React from 'react';
import { tableStyle, thStyle, tdStyle, badgeStyle, successBtnStyle } from '../../components/common';

export default function Payroll({ employees, handleDownloadPayslip, isAdmin }) {
  // Admin များသာ Payroll ကို ကြည့်ရှုနိုင်သည်
  if (!isAdmin) return null;

  return (
    <div>
      <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px', marginTop: 0 }}>💰 ဝန်ထမ်းများ၏ လစာတွက်ချက်မှု (Payroll Summary)</h3>
      <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '20px' }}>
        နှစ်စဉ်လစာကို အခြေခံ၍ လစဉ်လစာ (Monthly Salary) တွက်ချက်ထားသော စာရင်းများနှင့် Payslip စာရွက်များ ဖြစ်ပါသည်။
      </p>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr style={{ background: '#2c3e50', color: 'white', textAlign: 'left' }}>
              <th style={thStyle}>ဝန်ထမ်းအမည်</th>
              <th style={thStyle}>ဌာန</th>
              <th style={thStyle}>အလုပ်အမျိုးအစား</th>
              <th style={thStyle}>နှစ်စဉ်လစာ (Annual)</th>
              <th style={thStyle}>လစဉ်လစာ (Monthly)</th>
              <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? employees.map((emp, index) => {
              const annualSalary = Number(emp.salary) || 0;
              const monthlySalary = (annualSalary / 12).toFixed(2);
              return (
                <tr key={emp.id} style={{ background: index % 2 === 0 ? '#fcfcfc' : '#ffffff' }}>
                  <td style={tdStyle}>{emp.first_name} {emp.last_name}</td>
                  <td style={tdStyle}>{emp.department_name || 'N/A'}</td>
                  <td style={tdStyle}><span style={badgeStyle}>{emp.employment_type}</span></td>
                  <td style={tdStyle}>${annualSalary.toLocaleString()}</td>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#27ae60' }}>${Number(monthlySalary).toLocaleString()}</td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <button onClick={() => handleDownloadPayslip(emp.id, emp.first_name)} style={successBtnStyle}>
                      📄 Payslip PDF
                    </button>
                  </td>
                </tr>
              );
            }) : <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>ဝန်ထမ်းစာရင်း မရှိသေးပါ။</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}