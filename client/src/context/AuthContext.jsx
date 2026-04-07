import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

axios.defaults.baseURL = 'https://onlinevoting-9vq1fvb1j-varun-kaarthik-s-projects.vercel.app/';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('/api/auth/profile');
      setUser(res.data);
    } catch (err) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const loginStep1 = async (voterId, phoneNumber, password) => {
    return await axios.post('/api/auth/login-step1', { voterId, phoneNumber, password });
  };

  const loginStep2 = async (voterId, otp) => {
    const res = await axios.post('/api/auth/login-step2', { voterId, otp });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.voter);
  };

  const loginAdmin = async (email, password) => {
    const res = await axios.post('/api/auth/login-admin', { email, password });
    localStorage.setItem('token', res.data.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
    setUser(res.data.voter);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginStep1, loginStep2, loginAdmin, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
