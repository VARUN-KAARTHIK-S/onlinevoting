import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const Home = () => {
  return (
    <div style={{ maxWidth: '1000px', margin: '4rem auto', textAlign: 'center' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '1.5rem', color: '#1E293B' }}>Secure Online Voting System</h1>
        <p style={{ color: '#64748B', fontSize: '1.25rem', maxWidth: '700px', margin: '0 auto 3rem' }}>
          A unified, secure, and anonymous digital platform inspired by the Election Commission of India's democratic process. Ensuring transparency and integrity at every step.
        </p>
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <Link to="/register">
            <button className="primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Apply for Voter ID</button>
          </Link>
          <Link to="/login">
            <button style={{ background: 'white', color: '#0076CE', border: '2px solid #0076CE', padding: '1rem 2rem', fontSize: '1.1rem' }}>Voter Login</button>
          </Link>
        </div>
      </motion.div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', marginTop: '6rem' }}>
        <motion.div whileHover={{ scale: 1.05 }} className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🔒 Secure Auth</h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Blockchain-ready JWT authentication ensuring one voter, one identity.</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.05 }} className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>🕶️ Anonymous Ballot</h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>The secrecy of your vote is absolute. Your choice is never linked to your identity.</p>
        </motion.div>
        
        <motion.div whileHover={{ scale: 1.05 }} className="glass-card" style={{ padding: '2rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>📊 Dynamic Results</h3>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Real-time counting using the First-Past-The-Post (FPTP) system.</p>
        </motion.div>
      </div>
      
      <div style={{ marginTop: '8rem', textAlign: 'left' }}>
        <div className="glass-card" style={{ padding: '3rem', maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ marginBottom: '1.5rem' }}>EVM & VVPAT Influence</h2>
          <p style={{ lineHeight: '1.8', color: '#475569' }}>
            Our system incorporates digital versions of the **Electronic Voting Machine (EVM)** for a seamless UI, and **Voter Verifiable Paper Audit Trail (VVPAT)** for immediate feedback. Candidates are required to submit comprehensive **Affidavits**—just like in the Indian General Elections—detailing their education, assets, and criminal records to ensure informed voting.
          </p>
        </div>
      </div>
      
      <footer style={{ marginTop: '6rem', color: '#94A3B8', fontSize: '0.875rem' }}>
        &copy; 2026 Secure Online Voting System | Inspired by Indian Democracy
      </footer>
    </div>
  );
};

export default Home;
