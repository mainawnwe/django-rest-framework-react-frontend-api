import React, { useState, useContext } from 'react';
import axios from 'axios';
import { loginUser } from '../services/api';
import { AuthContext } from '../context/AuthContext';

export default function Auth({ onLoginSuccess }) {
  const { login } = useContext(AuthContext);
  const [isSignup, setIsSignup] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      if (isSignup) {
        // Register API Call
        await axios.post('http://127.0.0.1:8000/api/register/', formData);
        setSuccessMsg('အကောင့်ဖွင့်ခြင်း အောင်မြင်ပါသည်။ ကျေးဇူးပြု၍ Login ဝင်ပါ။');
        setIsSignup(false); // Login form သို့ ပြန်ပြောင်းပေးမည်
        setFormData({ username: '', password: '', email: '', first_name: '', last_name: '' });
      } else {
        // Login API Call - response ထဲတွင် role နှင့် employee_id ပါဝင်သည်
        const response = await loginUser({ username: formData.username, password: formData.password });
        // AuthContext ၏ login function ကို ခေါ်ပြီး role/employee_id state ကို update လုပ်မည်
        login(response.data);
        onLoginSuccess();
      }
    } catch (err) {
      setError(isSignup ? 'အကောင့်ဖွင့်ရန် မအောင်မြင်ပါ။ (Username တူနေနိုင်သည်)' : 'username သို့မဟုတ် password မှားယွင်းနေပါသည်။');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f7f6' }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: '40px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '380px' }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>
          {isSignup ? '📝 အကောင့်အသစ်ဖွင့်ရန် (Signup)' : '🔐 HR System Login'}
        </h2>

        {error && <p style={{ color: '#c0392b', fontSize: '13px', textAlign: 'center', background: '#fadbd8', padding: '8px', borderRadius: '4px' }}>{error}</p>}
        {successMsg && <p style={{ color: '#27ae60', fontSize: '13px', textAlign: 'center', background: '#d4efdf', padding: '8px', borderRadius: '4px' }}>{successMsg}</p>}

        {isSignup && (
          <>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input type="text" name="first_name" placeholder="First Name" value={formData.first_name} onChange={handleChange} required style={inputStyle} />
              <input type="text" name="last_name" placeholder="Last Name" value={formData.last_name} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} required style={inputStyle} />
            </div>
          </>
        )}

        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#34495e', display: 'block', marginBottom: '5px' }}>Username</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required style={inputStyle} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#34495e', display: 'block', marginBottom: '5px' }}>Password</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required style={inputStyle} />
        </div>

        <button type="submit" style={{ width: '100%', padding: '12px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', marginBottom: '15px' }}>
          {isSignup ? 'Register' : 'Login'}
        </button>

        <p style={{ textAlign: 'center', fontSize: '13px', color: '#7f8c8d', margin: 0 }}>
          {isSignup ? 'အကောင့်ရှိပြီးသားလား? ' : 'အကောင့်မရှိသေးဘူးလား? '}
          <span 
            onClick={() => { setIsSignup(!isSignup); setError(''); setSuccessMsg(''); }} 
            style={{ color: '#2980b9', cursor: 'pointer', fontWeight: '600', textDecoration: 'underline' }}>
            {isSignup ? 'Login ဝင်ရန်' : 'အကောင့်အသစ်ဖွင့်ရန်'}
          </span>
        </p>
      </form>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dcdde1', boxSizing: 'border-box', fontSize: '14px', outline: 'none' };