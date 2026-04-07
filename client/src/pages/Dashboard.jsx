import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 
  'Telangana', 'Tripura', 'Uttarakhand', 'Uttar Pradesh', 'West Bengal'
];

const UTS = [
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const Dashboard = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConsModal, setShowConsModal] = useState(false);
  const [showVotersModal, setShowVotersModal] = useState(false);
  const [voters, setVoters] = useState([]);
  const [filterCons, setFilterCons] = useState('');
  const [formData, setFormData] = useState({ 
    title: '', constituency: '', startTime: '', endTime: '', 
    states: [], unionTerritories: [] 
  });
  const [consData, setConsData] = useState({ name: '', type: 'State', state: '' });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchElections();
  }, []);

  const fetchElections = async () => {
    try {
      const res = await axios.get('/api/elections');
      setElections(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (listName, item) => {
    const current = formData[listName];
    if (current.includes(item)) {
      setFormData({ ...formData, [listName]: current.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, [listName]: [...current, item] });
    }
  };

  const handleCreateElection = async (e) => {
    e.preventDefault();
    if (formData.states.length === 0 && formData.unionTerritories.length === 0) {
      return alert('Please select at least one State or UT for this election.');
    }
    try {
      await axios.post('/api/elections', formData);
      setShowModal(false);
      setFormData({ title: '', constituency: '', startTime: '', endTime: '', states: [], unionTerritories: [] });
      fetchElections();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create election');
    }
  };

  const handleCreateCons = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/constituencies', consData);
      setShowConsModal(false);
      setConsData({ name: '', type: 'State', state: '' });
      alert('Constituency Master Data added successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add constituency');
    }
  };

  const fetchVoters = async () => {
    try {
      const res = await axios.get('/api/auth/voters');
      setVoters(res.data);
      setShowVotersModal(true);
    } catch (err) {
      alert('Failed to load voters database. ' + (err.response?.data?.message || ''));
    }
  };

  const handleApproveVoter = async (voterId) => {
    try {
      await axios.patch(`/api/auth/voters/${voterId}/approve`);
      fetchVoters(); // Refresh
    } catch(err) {
      alert('Failed to approve voter');
    }
  };

  const handleRejectVoter = async (voterId) => {
    if(window.confirm('Are you sure you want to completely reject/delete this voter application?')) {
      try {
        await axios.delete(`/api/auth/voters/${voterId}/reject`);
        fetchVoters(); // Refresh
      } catch(err) {
        alert('Failed to reject voter');
      }
    }
  };

  const getStatus = (start, end) => {
    const now = new Date();
    const st = new Date(start);
    const en = new Date(end);
    if (now < st) return 'Upcoming';
    if (now > en) return 'Finished';
    return 'Active';
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ marginBottom: '0.5rem' }}>Election Commission Control Center</h2>
          <p style={{ color: '#64748B' }}>Managing democratic processes across {STATES.length} States and {UTS.length} UTs.</p>
        </div>
        {user?.role === 'admin' && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className="primary" onClick={fetchVoters} style={{ background: '#4F46E5', position: 'relative' }}>
              👁️ View Voters Database
              {voters.filter(v => !v.isApproved).length > 0 && (
                <span style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#EF4444', color: 'white', borderRadius: '50%', padding: '0.2rem 0.5rem', fontSize: '10px', border: '2px solid white', fontWeight: 'bold' }}>
                  {voters.filter(v => !v.isApproved).length} NEW
                </span>
              )}
            </button>
            <button className="primary" onClick={() => setShowConsModal(true)} style={{ background: '#0F766E' }}>+ Manage Constituencies</button>
            <button className="primary" onClick={() => setShowModal(true)}>+ Launch New Election</button>
          </div>
        )}
      </div>

      {loading ? (
        <p>Loading elections...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          {elections.map((election, idx) => {
            const status = getStatus(election.startTime, election.endTime);
            return (
              <motion.div 
                key={election._id} 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card election-card"
                style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}
              >
                <div style={{ 
                  fontSize: '11px', 
                  background: status === 'Active' ? '#DEF7EC' : status === 'Upcoming' ? '#E1EFFE' : '#F3F4F6', 
                  color: status === 'Active' ? '#03543F' : status === 'Upcoming' ? '#1E429F' : '#374151', 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  width: 'fit-content',
                  marginBottom: '1rem',
                  fontWeight: 'bold'
                }}>
                  ● {status}
                </div>
                <h3 style={{ marginBottom: '0.5rem' }}>{election.title}</h3>
                <div style={{ fontSize: '0.85rem', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                  <span>📍 {election.constituency}</span>
                  {election.states?.length > 0 && <span>• {election.states.length} States</span>}
                  {election.unionTerritories?.length > 0 && <span>• {election.unionTerritories.length} UTs</span>}
                </div>
                
                <div style={{ marginTop: 'auto' }}>
                  <div style={{ fontSize: '12px', color: '#94A3B8', marginBottom: '1rem' }}>Voting ends: {new Date(election.endTime).toLocaleString()}</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link to={`/elections/${election._id}`} style={{ flex: 1, textDecoration: 'none' }}>
                      <button style={{ 
                        width: '100%', 
                        background: '#0076CE', 
                        color: 'white',
                        border: 'none',
                        padding: '0.9rem',
                        fontWeight: 600,
                        borderRadius: '8px'
                      }}>
                        View Election
                      </button>
                    </Link>
                    {(status === 'Finished' || user?.role === 'admin') && (
                      <Link to={`/elections/${election._id}`} style={{ flex: 1, textDecoration: 'none' }}>
                        <button style={{ 
                          width: '100%', 
                          background: '#F1F5F9', 
                          color: '#0F172A',
                          border: '1px solid #CBD5E1',
                          padding: '0.9rem',
                          fontWeight: 600,
                          borderRadius: '8px'
                        }}>
                          View Results
                        </button>
                      </Link>
                    )}
                    {status === 'Finished' && user?.role === 'admin' && (
                      <button onClick={async () => {
                        if(window.confirm('Delete this election entirely from the system records?')) {
                          try {
                            await axios.delete(`/api/elections/${election._id}`);
                            fetchElections();
                          } catch(err) {
                            alert('Delete failed');
                          }
                        }
                      }} style={{ 
                        flex: 1, 
                        background: '#FFF5F5', 
                        color: '#C53030',
                        border: '1px solid #FEB2B2',
                        padding: '0.9rem',
                        fontWeight: 600,
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}>
                        Close / Archive
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Admin Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ width: '800px', maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '2rem', borderBottom: '1px solid #E2E8F0' }}>
              <h2 style={{ margin: 0 }}>Launch New Election Process</h2>
            </div>
            
            <form onSubmit={handleCreateElection} style={{ overflowY: 'auto', padding: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="input-group">
                  <label>Election Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required placeholder="e.g., LOK SABHA 2026" />
                </div>
                <div className="input-group">
                  <label>Consolidated Constituency</label>
                  <input type="text" value={formData.constituency} onChange={(e) => setFormData({...formData, constituency: e.target.value})} required placeholder="e.g., Multiple Regions" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                <div className="input-group">
                  <label>Select Participating States (Total: {formData.states.length})</label>
                  <div style={{ height: '150px', overflowY: 'auto', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px' }}>
                    {STATES.map(s => (
                      <div key={s} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={formData.states.includes(s)} onChange={() => handleToggle('states', s)} id={`st-${s}`} />
                        <label htmlFor={`st-${s}`}>{s}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="input-group">
                  <label>Select Participating UTs (Total: {formData.unionTerritories.length})</label>
                  <div style={{ height: '150px', overflowY: 'auto', border: '1px solid #E2E8F0', padding: '1rem', borderRadius: '8px' }}>
                    {UTS.map(u => (
                      <div key={u} style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={formData.unionTerritories.includes(u)} onChange={() => handleToggle('unionTerritories', u)} id={`ut-${u}`} />
                        <label htmlFor={`ut-${u}`}>{u}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
                <div className="input-group">
                  <label>Polling Start Time</label>
                  <input type="datetime-local" value={formData.startTime} onChange={(e) => setFormData({...formData, startTime: e.target.value})} required />
                </div>
                <div className="input-group">
                  <label>Polling End Time</label>
                  <input type="datetime-local" value={formData.endTime} onChange={(e) => setFormData({...formData, endTime: e.target.value})} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '2.5rem' }}>
                <button type="submit" className="primary" style={{ flex: 2, padding: '1.1rem' }}>Launch Democratic Process</button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, background: '#F1F5F9', color: '#64748B' }}>Discard</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Admin Constituency Modal */}
      {showConsModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ width: '500px', background: 'white' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Create Regional Database</h2>
            <form onSubmit={handleCreateCons}>
              <div className="input-group">
                <label>Constituency Region Name</label>
                <input type="text" value={consData.name} onChange={(e) => setConsData({...consData, name: e.target.value})} required placeholder="e.g., Chennai South" />
              </div>
              <div className="input-group">
                <label>Electoral Level</label>
                <select value={consData.type} onChange={(e) => setConsData({...consData, type: e.target.value})} required>
                  <option value="National">National (Lok Sabha)</option>
                  <option value="State">State (Legislative Assembly)</option>
                  <option value="Local">Local (Panchayat / Ward)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Located In</label>
                <select value={consData.state} onChange={(e) => setConsData({...consData, state: e.target.value})} required>
                  <option value="">Select State / UT...</option>
                  <optgroup label="States">
                    {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </optgroup>
                  <optgroup label="Union Territories">
                    {UTS.map(u => <option key={u} value={u}>{u}</option>)}
                  </optgroup>
                </select>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="primary" style={{ flex: 1 }}>Register Boundary</button>
                <button type="button" onClick={() => setShowConsModal(false)} style={{ flex: 1, background: '#F1F5F9', color: '#64748B' }}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Admin Voters Database Modal */}
      {showVotersModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(8px)' }}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card" style={{ width: '900px', height: '85vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', borderBottom: '1px solid #E2E8F0', background: 'white', borderRadius: '16px 16px 0 0' }}>
              <h2 style={{ margin: 0 }}>Registered Voters Database</h2>
              <button onClick={() => setShowVotersModal(false)} style={{ background: 'transparent', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748B' }}>✕</button>
            </div>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #E2E8F0', background: 'white' }}>
              <select value={filterCons} onChange={(e) => setFilterCons(e.target.value)} style={{ padding: '0.8rem', width: '300px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                <option value="">All Regions & Constituencies</option>
                {[...new Set(voters.map(v => v.constituency))].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <thead style={{ background: '#F1F5F9', textAlign: 'left' }}>
                  <tr>
                    <th style={{ padding: '1rem', borderBottom: '2px solid #E2E8F0' }}>EPIC ID</th>
                    <th style={{ padding: '1rem', borderBottom: '2px solid #E2E8F0' }}>Full Name</th>
                    <th style={{ padding: '1rem', borderBottom: '2px solid #E2E8F0' }}>Constituency</th>
                    <th style={{ padding: '1rem', borderBottom: '2px solid #E2E8F0' }}>Contact</th>
                    <th style={{ padding: '1rem', borderBottom: '2px solid #E2E8F0' }}>Image</th>
                    <th style={{ padding: '1rem', borderBottom: '2px solid #E2E8F0', textAlign: 'center' }}>Official Status</th>
                  </tr>
                </thead>
                <tbody>
                  {voters.filter(v => filterCons === '' || v.constituency === filterCons).map(v => (
                    <tr key={v._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                      <td style={{ padding: '1rem', fontWeight: 'bold', color: '#0F766E' }}>{v.voterId}</td>
                      <td style={{ padding: '1rem' }}>{v.name}</td>
                      <td style={{ padding: '1rem' }}>{v.constituency}</td>
                      <td style={{ padding: '1rem', fontSize: '0.9rem', color: '#64748B' }}>{v.phoneNumber}<br/>{v.email}</td>
                      <td style={{ padding: '1rem' }}>
                        {v.photoUrl && <img src={`https://onlinevoting-gold.vercel.app/${v.photoUrl.replace('\\', '/')}`} alt={v.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        {v.isApproved ? (
                          <span style={{ background: '#DEF7EC', color: '#03543F', padding: '0.3rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>✓ Verified Citizen</span>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button onClick={() => handleApproveVoter(v._id)} style={{ background: '#10B981', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Verify</button>
                            <button onClick={() => handleRejectVoter(v._id)} style={{ background: '#EF4444', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {voters.filter(v => filterCons === '' || v.constituency === filterCons).length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#64748B' }}>No citizens found matching this criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
