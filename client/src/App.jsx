import React, { useContext } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ElectionDetails from './pages/ElectionDetails';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1.25rem 2.5rem',
      background: 'white',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <h3 style={{ margin: 0, color: '#0076CE' }}>SecureVote India</h3>
        {user && user.role === 'admin' && (
          <span style={{ 
            fontSize: '10px', 
            background: '#0076CE', 
            color: 'white', 
            padding: '2px 8px', 
            borderRadius: '12px',
            textTransform: 'uppercase',
            fontWeight: 'bold'
          }}>Admin Portal</span>
        )}
      </div>
      
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link to="/" style={{ textDecoration: 'none', color: '#64748B', fontWeight: 600 }}>Home</Link>
        {user ? (
          <>
            <Link to="/dashboard" style={{ textDecoration: 'none', color: '#64748B', fontWeight: 600 }}>Elections</Link>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: '#0076CE' }}>Hello, {user.name}</span>
              <button onClick={handleLogout} style={{ border: '1px solid #0076CE', color: '#0076CE', background: 'transparent', padding: '0.4rem 1rem' }}>Logout</button>
            </div>
          </>
        ) : (
          <>
            <Link to="/login" style={{ textDecoration: 'none', color: '#64748B', fontWeight: 600 }}>Login</Link>
            <Link to="/register" style={{ textDecoration: 'none', color: '#0076CE' }}>
              <button className="primary" style={{ padding: '0.5rem 1.25rem' }}>Get Voter ID</button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
    <div style={{ border: '4px solid #f3f3f3', borderTop: '4px solid #0076CE', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }}></div>
    <span style={{ marginTop: '1rem', color: '#64748B' }}>Authenticating Citizen...</span>
  </div>;
  
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <main style={{ padding: '2.5rem' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/elections/:id" element={
              <ProtectedRoute>
                <ElectionDetails />
              </ProtectedRoute>
            } />
          </Routes>
        </main>
        
        <style>{`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        `}</style>
      </div>
    </AuthProvider>
  );
}

export default App;
