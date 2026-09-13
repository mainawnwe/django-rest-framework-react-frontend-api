import React from 'react';

export default function Dashboard({ employees, departments, leaves, attendanceLogs, isAdmin }) {
  return (
    <div>
      <h3 style={{ color: '#2c3e50', borderBottom: '2px solid #f1f2f6', paddingBottom: '10px', marginTop: 0 }}>
        {isAdmin ? 'စနစ်ခြုံငုံသုံးသပ်ချက် (Dashboard Summary)' : 'ကျွန်ုပ်၏ အချက်အလက်များ (My Summary)'}
      </h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'linear-gradient(135deg, #3498db, #2980b9)', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(52, 152, 219, 0.3)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', opacity: 0.9 }}>
            {isAdmin ? 'ဝန်ထမ်းစုစုပေါင်း' : 'ကျွန်ုပ်၏ ဝန်ထမ်းမှတ်တမ်း'}
          </h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{employees.length}</p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(46, 204, 113, 0.3)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', opacity: 0.9 }}>ယခု အလုပ်လုပ်နေသူများ</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
            {attendanceLogs.filter(log => !log.clock_out).length}
          </p>
        </div>
        <div style={{ background: 'linear-gradient(135deg, #e67e22, #d35400)', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(230, 126, 34, 0.3)' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', opacity: 0.9 }}>စောင့်ဆိုင်းဆဲ ခွင့်တင်မှုများ</h4>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>
            {leaves.filter(l => l.status === 'pending').length}
          </p>
        </div>
        {isAdmin && (
          <div style={{ background: 'linear-gradient(135deg, #9b59b6, #8e44ad)', color: 'white', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(155, 89, 182, 0.3)' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '15px', opacity: 0.9 }}>ဌာန (Departments) စုစုပေါင်း</h4>
            <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{departments.length}</p>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {isAdmin && (
          <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
            <h4 style={{ color: '#2c3e50', marginTop: 0 }}>🏢 တည်ရှိနေသော ဌာနများ</h4>
            {departments.length > 0 ? (
              <ul style={{ paddingLeft: '20px', color: '#34495e', margin: 0 }}>
                {departments.map(dept => (
                  <li key={dept.id} style={{ marginBottom: '8px' }}>
                    <strong>{dept.name}</strong> ({dept.code})
                  </li>
                ))}
              </ul>
            ) : <p style={{ color: '#7f8c8d', margin: 0 }}>ဌာန မရှိသေးပါ။</p>}
          </div>
        )}

        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '10px', border: '1px solid #e9ecef' }}>
          <h4 style={{ color: '#2c3e50', marginTop: 0 }}>📌 အမြန်လမ်းညွှန်</h4>
          <p style={{ color: '#7f8c8d', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>
            {isAdmin 
              ? 'Normal User များအနေဖြင့် Read-only ပုံစံဖြင့် ကြည့်ရှုနိုင်ပြီး၊ Admin များကသာ ဝန်ထမ်းအသစ်ထည့်ခြင်းနှင့် အချက်အလက်ပြင်ဆင်မှုများကို လုပ်ဆောင်နိုင်ပါသည်။'
              : 'သင်သည် မိမိ၏ ကိုယ်ပိုင်အချက်အလက်များ၊ အချိန်မှတ်တမ်းများနှင့် ခွင့်များကိုသာ ကြည့်ရှုနိုင်ပြီး၊ ခွင့်တင်ခြင်းနှင့် Clock In/Out လုပ်ခြင်းများကို လုပ်ဆောင်နိုင်ပါသည်။'}
          </p>
        </div>
      </div>
    </div>
  );
}