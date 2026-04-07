import React, { useState, useContext } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Register = () => {
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', phoneNumber: '', 
    aadhaarNumber: '', dob: '', constituency: '', role: 'user' 
  });
  const [photo, setPhoto] = useState(null);
  const [constituencies, setConstituencies] = useState([]);
  const [error, setError] = useState('');
  const [registeredVoterId, setRegisteredVoterId] = useState('');
  const navigate = useNavigate();

  React.useEffect(() => {
    axios.get('/api/constituencies').then(res => setConstituencies(res.data)).catch(console.error);
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Citizenship-specific validation
    if (formData.role === 'user') {
      if (formData.aadhaarNumber.length !== 12) return setError('Aadhaar Number must be 12 digits.');
      if (!photo) return setError('ID Photo is required for Citizens.');
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (photo) data.append('photo', photo);

    try {
      const res = await axios.post('/api/auth/register', data);
      setRegisteredVoterId(res.data.voterId);
      setTimeout(() => navigate('/login'), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      style={{ maxWidth: '600px', margin: '4rem auto' }}
      className="glass-card"
    >
      <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ color: '#0076CE', margin: 0, fontSize: '1.8rem', fontWeight: 800 }}>ELECTION COMMISSION</h2>
        <p style={{ color: '#64748B', fontSize: '0.85rem', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Apply for Digital Voter ID</p>
      </div>
      
      {error && <div className="error-box" style={{ background: '#FFF5F5', color: '#C53030', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #FEB2B2' }}>{error}</div>}
      {registeredVoterId && (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ color: '#03543F', background: '#DEF7EC', padding: '2rem', borderRadius: '16px', marginBottom: '2rem', textAlign: 'center', border: '2px solid #84E1BC' }}>
          <h3 style={{ margin: 0 }}>Application Submitted!</h3>
          <p style={{ margin: '0.75rem 0 1.5rem', opacity: 0.8 }}>Your secure Digital EPIC ID has been provisioned:</p>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '4px', color: '#0076CE', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{registeredVoterId}</div>
          <p style={{ fontSize: '0.85rem', marginTop: '1.5rem', color: '#065F46' }}><strong>Status: Pending Official Verification.</strong><br/>You will be able to log in once the Election Commission approves your credentials. Redirecting to login...</p>
        </motion.div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div className="input-group">
            <label>Full Legal Name</label>
            <input type="text" name="name" placeholder="Varun Kaarthik S" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <label>Official Email</label>
            <input type="email" name="email" placeholder="varun.s@infosys.com" value={formData.email} onChange={handleChange} required />
          </div>
        </div>

        {formData.role === 'user' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
              <div className="input-group">
                <label>Phone Number</label>
                <input type="text" name="phoneNumber" placeholder="+91 XXXXXXXXXX" value={formData.phoneNumber} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Aadhaar (12-Digit UID)</label>
                <input type="text" name="aadhaarNumber" placeholder="XXXX XXXX XXXX" maxLength="12" value={formData.aadhaarNumber} onChange={handleChange} required />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
              <div className="input-group">
                <label>Date of Birth (18+)</label>
                <input type="date" name="dob" value={formData.dob} onChange={handleChange} required />
              </div>
              <div className="input-group">
                <label>Constituency</label>
                <select name="constituency" value={formData.constituency} onChange={handleChange} required>
                  <option value="">Select official Constituency...</option>
                  {constituencies.map(c => (
                    <option key={c._id} value={c.name}>{c.name} ({c.type} - {c.state})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="input-group" style={{ marginTop: '1rem' }}>
              <label>Voter Identity Photo (Pass Port size)</label>
              <input type="file" onChange={(e) => setPhoto(e.target.files[0])} required accept="image/*" style={{ padding: '0.8rem', background: '#F8FAFC' }} />
            </div>
          </motion.div>
        )}

        <div className="input-group" style={{ marginTop: '1rem' }}>
          <label>Secure Password</label>
          <input type="password" name="password" placeholder="••••••••" value={formData.password} onChange={handleChange} required />
        </div>

        <button type="submit" className="primary" style={{ width: '100%', padding: '1.1rem', marginTop: '1.5rem', fontSize: '1rem', letterSpacing: '0.5px' }}>
          {formData.role === 'user' ? 'Apply for Voter ID' : 'Create Official Account'}
        </button>
      </form>
      
      <p style={{ marginTop: '2rem', textAlign: 'center', fontSize: '0.875rem' }}>
        Already have a Voter ID? <Link to="/login" style={{ color: '#0076CE', textDecoration: 'none', fontWeight: 600 }}>Login here</Link>
      </p>
    </motion.div>
  );
};

export default Register;
