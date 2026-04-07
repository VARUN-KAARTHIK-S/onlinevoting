import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const ElectionDetails = () => {
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [voted, setVoted] = useState(false);
  const { user, fetchProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  // Nominate & Edit state
  const [showNominate, setShowNominate] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editCandidateId, setEditCandidateId] = useState(null);
  const [resultsFilter, setResultsFilter] = useState('Candidate'); // 'Candidate', 'Party', 'Constituency'
  const [nominee, setNominee] = useState({ name: '', partyName: '', constituency: '', assets: '', liabilities: '', criminalRecords: '', education: '' });
  const [affidavitFile, setAffidavitFile] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [partySymbolFile, setPartySymbolFile] = useState(null);
  const [constituenciesList, setConstituenciesList] = useState([]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const elRes = await axios.get('/api/elections');
      const electionData = elRes.data.find(e => e._id === id);
      setElection(electionData);

      const canRes = await axios.get(`/api/elections/${id}/candidates`);
      setCandidates(canRes.data);

      const resRes = await axios.get(`/api/vote/results/${id}`);
      setResults(resRes.data);
      
      // Check if user already voted in this election
      if (user && user.votedElections && user.votedElections.includes(id)) {
        setVoted(true);
      }
      // Fetch official constituencies
      const consRes = await axios.get('/api/constituencies');
      setConstituenciesList(consRes.data);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (candidateId) => {
    try {
      const res = await axios.post('/api/vote', { candidateId, electionId: id });
      alert(res.data.message);
      setVoted(true);
      fetchProfile();
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Voting failed');
    }
  };

  const handleNominate = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    Object.keys(nominee).forEach(key => formData.append(key, nominee[key]));
    if (affidavitFile) formData.append('affidavitFile', affidavitFile);
    if (photoFile) formData.append('photoUrl', photoFile);
    if (partySymbolFile) formData.append('partySymbolFile', partySymbolFile);

    try {
      if (editMode && editCandidateId) {
        await axios.put(`/api/elections/candidates/${editCandidateId}`, formData);
        alert('Candidate updated successfully.');
      } else {
        await axios.post(`/api/elections/${id}/candidates`, formData);
        alert('Nomination submitted. Awaiting Admin Approval.');
      }
      setShowNominate(false);
      setEditMode(false);
      setEditCandidateId(null);
      setNominee({ name: '', partyName: '', constituency: '', assets: '', liabilities: '', criminalRecords: '', education: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (candidateId) => {
    if (window.confirm("Are you sure you want to delete this candidate?")) {
      try {
        await axios.delete(`/api/elections/candidates/${candidateId}`);
        fetchData();
        setSelectedCandidate(null);
      } catch (err) {
        alert('Failed to delete candidate.');
      }
    }
  };

  const handleApprove = async (candidateId) => {
    try {
      await axios.patch(`/api/elections/candidates/${candidateId}/approve`);
      fetchData();
    } catch (err) {
      alert('Approval failed');
    }
  };

  if (loading || !election) return <div>Loading Election Portal...</div>;

  const isActive = new Date() >= new Date(election.startTime) && new Date() <= new Date(election.endTime);
  const isFinished = new Date() > new Date(election.endTime);

  let aggregatedResults = results;
  if (resultsFilter !== 'Candidate') {
    const aggregateMap = {};
    results.forEach(r => {
      const key = resultsFilter === 'Party' ? r.partyName : r.constituency;
      if (!key) return;
      if (!aggregateMap[key]) aggregateMap[key] = 0;
      aggregateMap[key] += r.count;
    });

    aggregatedResults = Object.keys(aggregateMap).map(k => ({
      name: k,
      count: aggregateMap[k]
    })).sort((a,b) => b.count - a.count);
  }

  const chartData = {
    labels: aggregatedResults.map(r => r.name || r.candidateName),
    datasets: [{
      label: 'Total Secure Votes',
      data: aggregatedResults.map(r => r.count),
      backgroundColor: ['#0076CE', '#00B1EB', '#14B8A6', '#F59E0B', '#EF4444', '#64748B'],
      borderRadius: 8
    }]
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{election.title}</h1>
        <p style={{ color: '#64748B', fontSize: '1.1rem' }}>📍 {election.constituency} • {isActive ? '🔴 LIVE' : isFinished ? '🔒 SECURED' : '⏳ UPCOMING'}</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '3rem' }}>
        {/* Candidates Section */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Candidates</h2>
            {!isFinished && user?.role === 'admin' && (
              <button onClick={() => { 
                setEditMode(false); 
                setNominee({ name: '', partyName: '', constituency: '', assets: '', liabilities: '', criminalRecords: '', education: '' });
                setShowNominate(true); 
              }} style={{ background: 'transparent', border: '1px solid #0076CE', color: '#0076CE' }}>+ Add Candidate</button>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {candidates
              .filter(c => user.role === 'admin' || c.constituency === user.constituency)
              .filter(c => c.isApproved || user.role === 'admin')
              .map((candidate, idx) => (
              <motion.div 
                key={candidate._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card candidate-item"
                style={{ cursor: 'pointer', borderLeft: candidate.isApproved ? '4px solid #0076CE' : '4px solid #FBD38D', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}
                onClick={() => setSelectedCandidate(candidate)}
              >
                {candidate.photoUrl && (
                  <img src={`https://onlinevoting-gold.vercel.app/${candidate.photoUrl.replace('\\', '/')}`} alt={candidate.name} style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover' }} />
                )}
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{candidate.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.2rem 0' }}>
                    {candidate.partySymbolUrl && (
                      <img src={`https://onlinevoting-gold.vercel.app/${candidate.partySymbolUrl.replace('\\', '/')}`} alt={candidate.partyName} style={{ height: '18px', width: '18px', objectFit: 'contain' }} />
                    )}
                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.85rem' }}>{candidate.partyName}</p>
                  </div>
                  <span style={{ fontSize: '10px', color: '#0076CE', fontWeight: 'bold' }}>📍 {candidate.constituency}</span>
                  {!candidate.isApproved && <span style={{ fontSize: '10px', color: '#B7791F', fontWeight: 'bold', marginLeft: '0.5rem' }}>(Pending Approval)</span>}
                </div>
                {isActive && !voted && candidate.isApproved && user.role !== 'admin' && (
                  <button className="primary" onClick={(e) => { e.stopPropagation(); handleVote(candidate._id); }}>Vote</button>
                )}
                {user.role === 'admin' && !candidate.isApproved && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={(e) => { 
                      e.stopPropagation(); 
                      setEditMode(true);
                      setEditCandidateId(candidate._id);
                      setNominee({
                        name: candidate.name,
                        partyName: candidate.partyName,
                        constituency: candidate.constituency,
                        assets: candidate.affidavit.assets,
                        liabilities: candidate.affidavit.liabilities,
                        criminalRecords: candidate.affidavit.criminalRecords,
                        education: candidate.affidavit.education
                      });
                      setShowNominate(true);
                    }} style={{ background: '#F59E0B', color: 'white', fontSize: '12px', border: 'none', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer' }}>Edit</button>
                    
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(candidate._id); }} style={{ background: '#EF4444', color: 'white', fontSize: '12px', border: 'none', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer' }}>Delete</button>
                    
                    <button onClick={(e) => { e.stopPropagation(); handleApprove(candidate._id); }} style={{ background: '#10B981', color: 'white', fontSize: '12px', border: 'none', padding: '0.6rem', borderRadius: '8px', cursor: 'pointer' }}>Confirm</button>
                  </div>
                )}
              </motion.div>
            ))}
            {candidates.length === 0 && <p style={{ color: '#64748B' }}>No candidates nominated for this election yet.</p>}
          </div>
        </section>

        {/* Results & Info Section */}
        <section>
          <h2>Election Insights</h2>
          {user?.role === 'admin' ? (
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                {isFinished ? 'Final Election Results' : 'Official Observer Live Analytics'}
              </h3>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: '#F1F5F9', padding: '0.4rem', borderRadius: '12px' }}>
                 <button onClick={() => setResultsFilter('Candidate')} style={{ flex: 1, padding: '0.6rem', border: 'none', background: resultsFilter === 'Candidate' ? '#FFF' : 'transparent', borderRadius: '8px', fontWeight: 'bold', color: resultsFilter === 'Candidate' ? '#0F766E' : '#64748B', cursor: 'pointer', boxShadow: resultsFilter === 'Candidate' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>By Candidate</button>
                 <button onClick={() => setResultsFilter('Party')} style={{ flex: 1, padding: '0.6rem', border: 'none', background: resultsFilter === 'Party' ? '#FFF' : 'transparent', borderRadius: '8px', fontWeight: 'bold', color: resultsFilter === 'Party' ? '#0F766E' : '#64748B', cursor: 'pointer', boxShadow: resultsFilter === 'Party' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>By Party</button>
                 <button onClick={() => setResultsFilter('Constituency')} style={{ flex: 1, padding: '0.6rem', border: 'none', background: resultsFilter === 'Constituency' ? '#FFF' : 'transparent', borderRadius: '8px', fontWeight: 'bold', color: resultsFilter === 'Constituency' ? '#0F766E' : '#64748B', cursor: 'pointer', boxShadow: resultsFilter === 'Constituency' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none' }}>By Constituency</button>
              </div>

              <div style={{ height: '250px', marginBottom: '2rem' }}>
                <Bar data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {aggregatedResults.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: i === 0 ? '#F0F9FF' : 'transparent', border: i === 0 ? '1px solid #0076CE' : 'none', borderRadius: '8px' }}>
                    <span style={{ fontWeight: i === 0 ? '700' : '400' }}>
                      {r.name || r.candidateName} {resultsFilter === 'Candidate' && r.partyName ? `(${r.partyName})` : ''} {i === 0 && '🏆'}
                    </span>
                    <span style={{ fontWeight: '700', color: '#0076CE' }}>{r.count} Votes</span>
                  </div>
                ))}
              </div>
            </div>
          ) : voted && user?.role !== 'admin' ? (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
              <h3 style={{ color: '#0F766E' }}>Ballot Successfully Sealed</h3>
              <p style={{ color: '#64748B', lineHeight: '1.6' }}>You have securely cast your vote in this election. To maintain democratic integrity and prevent voter manipulation, all vote counts and tallies are strictly confidential until the election is officially concluded.</p>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🗳️</div>
              <h3>Cast Your Vote</h3>
              <p style={{ color: '#64748B', lineHeight: '1.6' }}>Select a candidate from the list to cast your anonymous ballot. Secrecy is guaranteed by our digital double-hashing algorithm inspired by Indian EVM systems.</p>
              {isActive ? (
                <p style={{ color: '#0076CE', fontWeight: 'bold', marginTop: '1rem' }}>The voting window is currently open.</p>
              ) : (
                <p style={{ color: '#E53E3E', fontWeight: 'bold', marginTop: '1rem' }}>The voting window is not active.</p>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Affidavit Viewer Modal */}
      <AnimatePresence>
        {selectedCandidate && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }} onClick={() => setSelectedCandidate(null)}>
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass-card" style={{ width: '600px', background: 'white' }} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <img src={`https://onlinevoting-gold.vercel.app/${selectedCandidate.photoUrl.replace('\\', '/')}`} alt={selectedCandidate.name} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h2 style={{ margin: 0 }}>Candidate Affidavit</h2>
                  <p style={{ color: '#64748B', margin: 0 }}>Review the credentials of **{selectedCandidate.name}**.</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="input-group"><label>Education</label><div>{selectedCandidate.affidavit.education}</div></div>
                <div className="input-group"><label>Criminal Records</label><div>{selectedCandidate.affidavit.criminalRecords}</div></div>
                <div className="input-group"><label>Total Assets</label><div style={{ color: 'green', fontWeight: 'bold' }}>₹{selectedCandidate.affidavit.assets.toLocaleString()}</div></div>
                <div className="input-group"><label>Total Liabilities</label><div style={{ color: 'red', fontWeight: 'bold' }}>₹{selectedCandidate.affidavit.liabilities.toLocaleString()}</div></div>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem' }}>
                <h4>Official Document</h4>
                <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '1rem' }}>The full legal affidavit submitted to the Election Commission.</p>
                <a href={`https://onlinevoting-gold.vercel.app/${selectedCandidate.affidavit.affidavitFileUrl}`} target="_blank" rel="noreferrer" style={{ color: '#0076CE', textDecoration: 'none', fontWeight: 'bold' }}>📄 View PDF Affidavit</a>
              </div>

              <button className="primary" onClick={() => setSelectedCandidate(null)} style={{ width: '100%' }}>Close Profile</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Nomination Modal */}
      {showNominate && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="glass-card" style={{ width: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2>{editMode ? 'Edit Candidate Profile' : 'Candidate Nomination'}</h2>
            <form onSubmit={handleNominate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group"><label>Candidate Name</label><input type="text" value={nominee.name} onChange={(e) => setNominee({...nominee, name: e.target.value})} required /></div>
                <div className="input-group"><label>Party Name</label><input type="text" value={nominee.partyName} onChange={(e) => setNominee({...nominee, partyName: e.target.value})} required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group"><label>Total Assets (in ₹)</label><input type="number" value={nominee.assets} onChange={(e) => setNominee({...nominee, assets: e.target.value})} required /></div>
                <div className="input-group"><label>Total Liabilities (in ₹)</label><input type="number" value={nominee.liabilities} onChange={(e) => setNominee({...nominee, liabilities: e.target.value})} required /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="input-group">
                  <label>Constituency Region (Location)</label>
                  <select value={nominee.constituency} onChange={(e) => setNominee({...nominee, constituency: e.target.value})} required>
                    <option value="">Select official Constituency...</option>
                    {constituenciesList.map(c => (
                      <option key={c._id} value={c.name}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                </div>
                <div className="input-group"><label>Education Background</label><input type="text" value={nominee.education} onChange={(e) => setNominee({...nominee, education: e.target.value})} required /></div>
              </div>
              <div className="input-group"><label>Criminal Records (Full Disclosure)</label><textarea rows="3" value={nominee.criminalRecords} onChange={(e) => setNominee({...nominee, criminalRecords: e.target.value})} required></textarea></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                <div className="input-group">
                  <label>Candidate Photo (Image)</label>
                  <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} required={!editMode} />
                </div>
                <div className="input-group"><label>Party Symbol (Optional)</label><input type="file" accept="image/*" onChange={(e) => setPartySymbolFile(e.target.files[0])} /></div>
              </div>
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label>Signed Affidavit (PDF)</label>
                <input type="file" accept="application/pdf" onChange={(e) => setAffidavitFile(e.target.files[0])} required={!editMode} />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="submit" className="primary" style={{ flex: 1 }}>{editMode ? 'Save Changes' : 'Submit Nomination'}</button>
                <button type="button" onClick={() => { setShowNominate(false); setEditMode(false); setEditCandidateId(null); }} style={{ flex: 1, background: '#F1F5F9', color: '#64748B' }}>Cancel</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ElectionDetails;
