import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Login = () => {
  const [role, setRole] = useState('user'); // admin or user
  const [email, setEmail] = useState('');
  const [voterId, setVoterId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: credentials, 2: OTP
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const { loginStep1, loginStep2, loginAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleStep1 = async (e) => {
    e.preventDefault();
    if (role === 'admin') {
      try {
        await loginAdmin(email, password);
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'Login failed');
      }
      return;
    }

    try {
      const res = await loginStep1(voterId, phoneNumber, password);
      setMessage(res.data.message);
      setStep(2);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  const handleStep2 = async (e) => {
    e.preventDefault();
    try {
      await loginStep2(voterId, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ maxWidth: '450px', margin: '4rem auto' }}
      className="glass-card fade-in"
    >
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#0076CE', margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>ELECTION COMMISSION</h2>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '1.5rem', padding: '0.25rem', background: '#F1F5F9', borderRadius: '12px' }}>
          <button 
            type="button"
            onClick={() => { setRole('user'); setStep(1); setError(''); setMessage(''); }}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: role === 'user' ? '#FFF' : 'transparent', color: role === 'user' ? '#0076CE' : '#64748B', fontWeight: 600, cursor: 'pointer', boxShadow: role === 'user' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
          >
            Citizen
          </button>
          <button 
            type="button"
            onClick={() => { setRole('admin'); setStep(1); setError(''); setMessage(''); }}
            style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', border: 'none', background: role === 'admin' ? '#FFF' : 'transparent', color: role === 'admin' ? '#0076CE' : '#64748B', fontWeight: 600, cursor: 'pointer', boxShadow: role === 'admin' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}
          >
            Official
          </button>
        </div>
      </div>
      <h2 style={{ marginBottom: '0.5rem' }}>{step === 1 ? (role === 'admin' ? 'Official Login' : 'Citizen Login') : 'Verify Identity'}</h2>
      <p style={{ color: '#64748B', marginBottom: '2rem', fontSize: '0.9rem' }}>
        {step === 1 
          ? (role === 'admin' ? 'Authorized Election Commission personnel only.' : 'Enter your Voter ID (EPIC) and registered phone number.')
          : 'A secure 6-digit OTP has been sent to your device.'}
      </p>
      
      {error && <div style={{ color: 'red', border: '1px solid red', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', background: '#FFF5F5' }}>{error}</div>}
      {message && <div style={{ color: '#0076CE', border: '1px solid #0076CE', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.875rem', background: '#F0F9FF' }}>{message}</div>}
      
      {step === 1 ? (
        <form onSubmit={handleStep1}>
          {role === 'admin' ? (
            <div className="input-group">
              <label>Official Email</label>
              <input type="email" placeholder="admin@eci.gov.in" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
          ) : (
            <>
              <div className="input-group">
                <label>Voter ID (EPIC)</label>
                <input type="text" placeholder="EPIC123456" value={voterId} onChange={(e) => setVoterId(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Registered Phone</label>
                <input type="text" placeholder="+91 9876543210" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
              </div>
            </>
          )}
          
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="primary" style={{ width: '100%', padding: '0.9rem' }}>
            {role === 'admin' ? 'Access Control Center' : 'Send Verification OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleStep2}>
          <div className="input-group">
            <label>6-Digit OTP</label>
            <input type="text" placeholder="######" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} required style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px' }} />
          </div>
          <button type="submit" className="primary" style={{ width: '100%', padding: '0.9rem' }}>Confirm & Vote</button>
          <button type="button" onClick={() => setStep(1)} style={{ width: '100%', marginTop: '1rem', background: 'transparent', color: '#64748B' }}>Back to login</button>
        </form>
      )}
      
      <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
        Don't have a Voter ID? <Link to="/register" style={{ color: '#0076CE', textDecoration: 'none', fontWeight: 600 }}>Apply Now</Link>
      </p>
    </motion.div>
  );
};

export default Login;
