import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

export default function Profile() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();
  
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      await client.put('/auth/change-password', {
        email,
        oldPassword,
        newPassword
      });
      setSuccessMsg('Password changed successfully!');
      setOldPassword('');
      setNewPassword('');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Incorrect current password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <div className="dashboard-container" style={{ maxWidth: '600px' }}>
        <header className="dashboard-header" style={{ alignItems: 'center' }}>
          <h1 style={{ marginBottom: 0 }}>Profile Settings</h1>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
        </header>

        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Change Password</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email || ''}
                disabled
                style={{ backgroundColor: '#f9fafb', cursor: 'not-allowed', color: 'var(--text-muted)' }}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="oldPassword">Current Password</label>
              <input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            {successMsg && (
              <div className="alert alert-success" role="alert" style={{ marginBottom: '1rem' }}>
                {successMsg}
              </div>
            )}
            
            {errorMsg && (
              <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
                {errorMsg}
              </div>
            )}

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
        
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1rem', color: '#991b1b' }}>Log Out</h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sign out of your account on this device</p>
          </div>
          <button 
            className="btn" 
            style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca', fontWeight: 600 }}
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
