import React, { useState } from 'react';
import { loginUser } from '../../services/api';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginUser({ username, password });
      onLoginSuccess();
    } catch (err) {
      setError('username သို့မဟုတ် password မှားယွင်းနေပါသည်။');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f4f7f6' }}>
      <form onSubmit={handleLogin} style={{ background: 'white', padding: '40px', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', width: '350px' }}>
        <h2 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '20px' }}>🔐 HR System Login</h2>
        {error && <p style={{ color: '#c0392b', fontSize: '13px', textAlign: 'center' }}>{error}</p>}
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#34495e', display: 'block', marginBottom: '5px' }}>Username</label>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dcdde1', boxSizing: 'border-box' }} />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: '#34495e', display: 'block', marginBottom: '5px' }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #dcdde1', boxSizing: 'border-box' }} />
        </div>

        <button type="submit" style={{ width: '100%', padding: '12px', background: '#2980b9', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Login</button>
      </form>
    </div>
  );
}