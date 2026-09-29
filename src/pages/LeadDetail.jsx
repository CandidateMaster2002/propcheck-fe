import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

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

const StatusBadge = ({ status }) => {
  if (!status || status === 'N/A' || status === '—') return '—';
  const isPositive = status === 'Yes' || status === 'Approved';
  const bgColor = isPositive ? '#dcfce7' : '#f3f4f6';
  const color = isPositive ? '#166534' : '#374151';
  return (
    <span style={{ 
      padding: '0.25rem 0.75rem', 
      borderRadius: '9999px', 
      fontSize: '0.75rem', 
      fontWeight: 500, 
      backgroundColor: bgColor, 
      color: color, 
      whiteSpace: 'nowrap',
      display: 'inline-block'
    }}>
      {status}
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

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { showToast } = useToast();
  
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [remarkInput, setRemarkInput] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      try {
        const response = await client.get(`/leads/${id}`);
        setLead(response.data);
        setRemarkInput(response.data.remarks || '');
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load lead details');
      } finally {
        setLoading(false);
      }
    };
    fetchLead();
  }, [id]);

  const handleSaveRemark = async () => {
    setSavingRemark(true);
    try {
      const response = await client.patch(`/leads/${id}/remarks`, { remarks: remarkInput });
      setLead(response.data);
      showToast('Remark saved!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save remark', 'error');
    } finally {
      setSavingRemark(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="center-container" style={{ color: 'var(--text-muted)' }}>
          Loading lead details...
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="app-container">
        <div className="center-container" style={{ flexDirection: 'column' }}>
          <div className="alert alert-error">{error || 'Lead not found'}</div>
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginTop: '1rem' }}>Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="dashboard-container" style={{ maxWidth: '900px' }}>
        
        {/* 1. Header Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ marginBottom: '1.25rem', padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}>
              ← Back to Leads
            </button>
            <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>{lead.customerName || '—'}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>
              {lead.phone || '—'} &nbsp;|&nbsp; {lead.email || '—'} &nbsp;|&nbsp; {lead.city || '—'}
            </p>
          </div>
          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {lead.zohoLeadId && (
              <a 
                href={`https://crm.zoho.in/crm/tab/Leads/${lead.zohoLeadId}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary"
                title="Open Lead in Zoho CRM"
              >
                ↗ Zoho CRM
              </a>
            )}
            <a 
              href={`https://books.zoho.in/app#/contacts?filter_by=Status.All&search_criteria=${encodeURIComponent(JSON.stringify({ search_text: lead.email || lead.phone || lead.customerName }))}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-secondary"
              title="Search Customer & Payments in Zoho Books"
            >
              ↗ Zoho Books
            </a>
            <PaymentBadge status={lead.paymentStatus} />
          </div>
        </div>

        {/* 2. Inspection Details */}
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Inspection Details</h2>
          <div className="dashboard-grid" style={{ marginBottom: 0, gap: '1.5rem' }}>
            <Field label="Inspection Type" value={lead.inspectionType} />
            <Field label="Inspection Date" value={formatDate(lead.inspectionDateAndTime)} />
            <Field label="Deal Type" value={lead.dealType} />
            <Field label="Project Name" value={lead.projectName} />
            <Field label="Flat No" value={lead.flatNo} />
            <Field label="BHK Type" value={lead.bhkType} />
            <Field label="Booked By" value={lead.bookedBy} />
            <Field label="Inspection Done By" value={lead.inspectionDoneBy} />
            <Field label="Digital Twin" value={<StatusBadge status={lead.digitalTwinTagging} />} />
            <Field label="Validator Name" value={lead.validatorName} />
          </div>
          
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            {['CITY_HEAD', 'SALES', 'ADMIN'].includes(role) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Remarks / Notes</label>
                <textarea 
                  value={remarkInput}
                  onChange={(e) => setRemarkInput(e.target.value)}
                  placeholder="Add custom remarks or notes for this lead..."
                  style={{ 
                    padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', 
                    minHeight: '100px', fontFamily: 'inherit', resize: 'vertical'
                  }}
                />
                <button 
                  onClick={handleSaveRemark}
                  disabled={savingRemark}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', marginTop: '0.5rem' }}
                >
                  {savingRemark ? 'Saving...' : 'Save Remark'}
                </button>
              </div>
            ) : (
              <Field label="Remarks" value={lead.remarks} />
            )}
          </div>
        </div>

        {/* 3. Payment & Invoice Details */}
        <div className="card">
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Payment & Invoice Details</h2>
          <div className="dashboard-grid" style={{ marginBottom: 0, gap: '1.5rem' }}>
            <Field label="Payment Status" value={<PaymentBadge status={lead.paymentStatus} />} />
            <Field label="Estimate No" value={lead.estimateNo} />
            <Field label="Retainer No" value={lead.retainerNo} />
            {lead.retainerNo2 && <Field label="Retainer No 2" value={lead.retainerNo2} />}
            
            <Field label="Inspection Cost" value={formatCurrency(lead.inspectionCost)} />
            {lead.reInspectionCost > 0 && <Field label="Re-Inspection Cost" value={formatCurrency(lead.reInspectionCost)} />}
            <Field label="Total Revenue" value={formatCurrency(lead.totalRevenue)} />
            
            {lead.fullPaymentReceived !== 'Yes' && (
              <>
                <Field label="Amount Received" value={formatCurrency(lead.receivedAmount)} />
                <Field 
                  label="Pending Amount" 
                  value={formatCurrency(lead.pendingAmount)} 
                  highlightRed={lead.pendingAmount > 0} 
                />
              </>
            )}
          </div>
        </div>

        {/* Refund Details */}
        {lead.refund === 'Yes' && (
          <div className="card" style={{ borderColor: '#fecaca', backgroundColor: '#fef2f2' }}>
            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.25rem', color: '#991b1b' }}>Refund Details</h2>
            <div className="dashboard-grid" style={{ marginBottom: 0, gap: '1.5rem' }}>
              <Field label="Refund Amount" value={formatCurrency(lead.refundAmount)} />
              <Field label="Refund Date" value={formatDate(lead.refundDate)} />
              <Field label="Reason" value={lead.refundReason} />
              <Field label="Initiated For" value={lead.refundInitiatedFor} />
            </div>
          </div>
        )}


        {/* 4. System Info (Collapsible) */}
        <div className="card" style={{ padding: '1.5rem 2rem' }}>
          <details style={{ cursor: 'pointer' }}>
            <summary style={{ fontSize: '1.1rem', fontWeight: 600, outline: 'none', userSelect: 'none' }}>
              System Info
            </summary>
            <div className="dashboard-grid" style={{ marginTop: '1.5rem', marginBottom: 0, gap: '1.5rem', cursor: 'default' }}>
              <Field label="Zoho Lead ID" value={lead.zohoLeadId} />
              <Field label="Last Synced" value={formatDate(lead.syncedAt)} />
              <Field label="Last Modified" value={formatDate(lead.zohoModifiedTime)} />
            </div>
          </details>
        </div>

      </div>
    </div>
  );
}
