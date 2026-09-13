import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function Layout({ activeTab, onTabChange, onLogout, children }) {
  const { role } = useContext(AuthContext);
  const isAdmin = role === 'admin';

  // Admin အတွက် အားလုံးပါပြီး၊ Employee အတွက် Self-Service tabs များသာ ပြမည်
  const tabs = isAdmin
    ? [
        { id: 'dashboard', label: '📊 Dashboard' },
        { id: 'employees', label: '👥 ဝန်ထမ်းမှတ်တမ်း' },
        { id: 'payroll', label: '💰 လစာတွက်ချက်မှု (Payroll)' },
        { id: 'attendance', label: '⏰ အလုပ်တက်/ဆင်း မှတ်တမ်း' },
        { id: 'leaves', label: '📅 ခွင့်စီမံခန့်ခွဲမှု' }
      ]
    : [
        { id: 'dashboard', label: '📊 Dashboard' },
        { id: 'attendance', label: '⏰ ကျွန်ုပ်၏ အချိန်မှတ်တမ်း' },
        { id: 'leaves', label: '📅 ကျွန်ုပ်၏ ခွင့်များ' }
      ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      {/* Header & Logout Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h2 style={{ color: '#2c3e50', margin: '0 0 5px 0', fontSize: '28px' }}>🏢 HR Management System</h2>
          <p style={{ color: '#7f8c8d', margin: 0 }}>
            {isAdmin ? 'ဝန်ထမ်းများ၊ အချိန်စာရင်း၊ ခွင့်များနှင့် လစာများကို စီမံခန့်ခွဲပါ' : 'ဝန်ထမ်း Self-Service Portal'}
          </p>
        </div>
        <button onClick={onLogout} style={{ padding: '8px 16px', background: '#c0392b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
          Logout 🚪
        </button>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button 
            key={tab.id}
            onClick={() => onTabChange(tab.id)} 
            style={{ 
              padding: '12px 20px', cursor: 'pointer', fontWeight: '600',
              background: activeTab === tab.id ? '#2980b9' : '#ffffff', 
              color: activeTab === tab.id ? '#ffffff' : '#34495e', 
              border: activeTab === tab.id ? 'none' : '1px solid #dcdde1', 
              borderRadius: '8px', boxShadow: activeTab === tab.id ? '0 4px 6px rgba(41, 128, 185, 0.2)' : 'none',
              transition: 'all 0.3s ease'
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Card Container */}
      <div style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
        {children}
      </div>
    </div>
  );
}