import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const formatDate = (isoString) => {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date)) return isoString;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const formatCurrency = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '—';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const PaymentBadge = ({ status }) => {
  let bgColor = '#e0e7ff', color = '#3730a3';
  if (status === 'Fully Paid') { bgColor = '#dcfce7'; color = '#166534'; }
  else if (status === 'Partially Paid') { bgColor = '#fef08a'; color = '#854d0e'; }
  else if (status === 'Unpaid') { bgColor = '#fee2e2'; color = '#991b1b'; }
  else if (status === 'Refunded') { bgColor = '#f3f4f6'; color = '#374151'; }
  
  return (
    <span style={{ 
      padding: '0.35rem 1rem', 
      borderRadius: '9999px', 
      fontSize: '0.875rem', 
      fontWeight: 600, 
      backgroundColor: bgColor, 
      color: color, 
      whiteSpace: 'nowrap',
      display: 'inline-block'
    }}>
      {status || '—'}
    </span>
  );
};

const Field = ({ label, value, highlightRed }) => (
  <div style={{ display: 'flex', flexDirection: 'column' }}>
    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{label}</span>
    <span style={{ fontWeight: 500, color: highlightRed ? 'var(--error-color)' : 'inherit', wordBreak: 'break-word' }}>
      {value === null || value === undefined || value === '' ? '—' : value}
    </span>
  </div>
);

export default function CustomerDashboard() {
  const { logout, name, email } = useAuth();
  const navigate = useNavigate();
  
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyData = async () => {
      if (!email) {
        setError('No email found in session.');
        setLoading(false);
        return;
      }
      try {
        const response = await client.get(`/leads/me?email=${encodeURIComponent(email)}`);
        // If API returns an array, pick the first one, otherwise assume object
        const data = response.data;
        setLead(Array.isArray(data) ? data[0] : data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load your dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchMyData();
  }, [email]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="center-container" style={{ color: 'var(--text-muted)' }}>
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="app-container">
        <div className="dashboard-container">
          <header className="dashboard-header">
            <div>
              <h1 style={{ marginBottom: 0 }}>Welcome, {name || 'Customer'}</h1>
            </div>
            <button className="btn btn-secondary" onClick={handleLogout}>Log Out</button>
          </header>
          <div className="alert alert-error">{error || 'No records found for your account.'}</div>
        </div>
      </div>
    );
  }

  const isReportReady = lead.reportStatus === 'Yes' || lead.reportStatus === 'Completed' || lead.reportUrl;

  return (
    <div className="app-container">
      <div className="dashboard-container" style={{ maxWidth: '900px' }}>
        <header className="dashboard-header" style={{ alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>Welcome, {name || 'Customer'}</h1>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>Here is the status of your property inspection.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/my-bookings')}>📅 My Bookings</button>
              <button className="btn btn-secondary" onClick={() => navigate('/profile')}>Profile</button>
            </div>
            <PaymentBadge status={lead.paymentStatus} />
          </div>
        </header>

        {/* Property Details */}
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Property Details</h2>
          <div className="dashboard-grid" style={{ marginBottom: 0, gap: '1.5rem' }}>
            <Field label="Project Name" value={lead.projectName} />
            <Field label="BHK Type" value={lead.bhkType} />
            <Field label="Flat No" value={lead.flatNo} />
            <Field label="City" value={lead.city} />
          </div>
        </div>

        {/* Inspection Details */}
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Inspection Details</h2>
          <div className="dashboard-grid" style={{ marginBottom: 0, gap: '1.5rem' }}>
            <Field label="Inspection Date & Time" value={formatDate(lead.inspectionDateAndTime)} />
            <Field label="Inspector Name" value={lead.inspectionDoneBy} />
            <Field label="Report Status" value={lead.reportStatus} />
          </div>
          
          {/* Download Report Button */}
          {isReportReady && (
            <div style={{ marginTop: '2rem' }}>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  if (lead.reportUrl) {
                    window.open(lead.reportUrl, '_blank');
                  } else {
                    alert('Report download link is not currently available from the system.');
                  }
                }}
              >
                Download Inspection Report
              </button>
            </div>
          )}
        </div>

        {/* Payment Details */}
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Payment Details</h2>
          <div className="dashboard-grid" style={{ marginBottom: 0, gap: '1.5rem' }}>
            <Field label="Estimate No" value={lead.estimateNo} />
            <Field label="Amount Paid" value={formatCurrency(lead.receivedAmount)} />
            <Field 
              label="Pending Amount" 
              value={formatCurrency(lead.pendingAmount)} 
              highlightRed={lead.pendingAmount > 0} 
            />
            <Field label="Payment Status" value={lead.paymentStatus} />
          </div>
        </div>

      </div>
    </div>
  );
}
