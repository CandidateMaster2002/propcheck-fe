import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import CreateBookingModal from '../components/bookings/CreateBookingModal';
import AssignEngineerModal from '../components/bookings/AssignEngineerModal';
import RescheduleBookingModal from '../components/bookings/RescheduleBookingModal';

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
  let bgColor = '#e0e7ff', color = '#3730a3', label = status || 'Data Not Updated';
  if (status === 'Fully Paid') { bgColor = '#dcfce7'; color = '#166534'; label = 'Fully Paid'; }
  else if (status === 'Partially Paid') { bgColor = '#fef08a'; color = '#854d0e'; label = 'Partially Paid'; }
  else if (status === 'Unpaid' || status === 'Data Not Updated' || !status) { bgColor = '#fee2e2'; color = '#991b1b'; label = 'Data Not Updated'; }
  else if (status === 'Refunded') { bgColor = '#f3f4f6'; color = '#374151'; label = 'Refunded'; }
  
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
      {label}
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
  const [sendingReport, setSendingReport] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bookingLeadTarget, setBookingLeadTarget] = useState(null);
  const [assignEngineerTarget, setAssignEngineerTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);

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

  useEffect(() => {
    fetchLead();
  }, [id]);

  const handleAction = async (action) => {
    if (!lead) return;
    const bookingId = lead.currentBookingId || lead.id;

    if (action === 'BOOK') {
      setBookingLeadTarget(lead);
      return;
    }

    if (action === 'RESCHEDULE') {
      setRescheduleTarget({
        ...lead,
        id: bookingId,
        bookingType: lead.inspectionType || 'INSPECTION',
      });
      return;
    }

    if (action === 'ASSIGN_ENGINEER') {
      const slotTimeStr = lead.inspectionDateAndTime
        ? new Date(lead.inspectionDateAndTime).toLocaleTimeString('en-US', { hour12: false })
        : '';
      const assumedSlot = slotTimeStr && parseInt(slotTimeStr.split(':')[0], 10) >= 13 ? 'EVENING' : 'MORNING';
      setAssignEngineerTarget({
        ...lead,
        id: bookingId,
        leadId: lead.id,
        date: lead.inspectionDateAndTime ? lead.inspectionDateAndTime.split('T')[0] : new Date().toISOString().split('T')[0],
        slot: lead.slot || assumedSlot,
      });
      return;
    }

    setActionLoading(true);
    try {
      if (action === 'CANCEL') {
        if (!window.confirm('Are you sure you want to cancel this booking?')) return;
        await client.put(`/bookings/for-lead/${lead.id}/cancel`);
        showToast('Booking cancelled.', 'success');
      } else if (action === 'MARK_DONE') {
        await client.put(`/bookings/for-lead/${lead.id}/mark-done`);
        showToast('Inspection marked as done!', 'success');
      } else if (action === 'MARK_VALIDATION_DONE') {
        await client.put(`/bookings/for-lead/${lead.id}/mark-validation-done`);
        showToast('Validation marked as done!', 'success');
      } else if (action === 'REPORT_SENT') {
        await handleSendReport();
        return;
      }
      await fetchLead();
    } catch (err) {
      showToast(err.response?.data?.error || err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (!window.confirm(`Send official inspection report to ${lead.customerName || 'customer'} via email and unlock on their portal?`)) return;
    setSendingReport(true);
    try {
      try {
        await client.put(`/bookings/for-lead/${id}/report-sent`);
      } catch {
        await client.put(`/bookings/${lead.currentBookingId || id}/report-sent`);
      }
      setLead(prev => ({ ...prev, currentBookingStatus: 'REPORT_SENT' }));
      showToast('Report successfully sent to customer email & portal unlocked! ✅', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to dispatch report', 'error');
    } finally {
      setSendingReport(false);
    }
  };

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
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem', fontWeight: 500 }}>
              Lead Owner: {lead.leadOwner || 'Unassigned'}
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

        {/* 1.5 Booking Status & Quick Actions (matches outside table actions) */}
        {(() => {
          const bookingStatus = lead.currentBookingStatus || 'NOT_SCHEDULED';
          const isUnbooked = !lead.currentBookingStatus || bookingStatus === 'UNBOOKED' || bookingStatus === 'NOT_SCHEDULED';
          const isLocked = bookingStatus === 'REPORT_SENT' || bookingStatus === 'CANCELLED' || bookingStatus === 'POSTPONED_CANCELLED' || lead.paymentStatus === 'Refunded';
          return (
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Booking Status:</span>
                <StatusBadge status={bookingStatus} />
              </div>

              {!isLocked && (
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {isUnbooked && (
                    <button type="button" className="btn btn-primary" disabled={actionLoading} onClick={() => handleAction('BOOK')}>
                      📅 Book Inspection
                    </button>
                  )}
                  {(bookingStatus === 'POSTPONED' || bookingStatus === 'PENDING_APPROVAL' || bookingStatus === 'PENDING_ENGINEER_ASSIGNMENT' || bookingStatus === 'CONFIRMED' || bookingStatus === 'CONFLICT') && (
                    <button type="button" className="btn btn-secondary" disabled={actionLoading} onClick={() => handleAction('RESCHEDULE')}>
                      🗓️ Change Date
                    </button>
                  )}
                  {bookingStatus === 'PENDING_ENGINEER_ASSIGNMENT' && role !== 'SALES' && (
                    <button type="button" className="btn btn-primary" disabled={actionLoading} onClick={() => handleAction('ASSIGN_ENGINEER')}>
                      👷 Allot Engineer
                    </button>
                  )}
                  {(bookingStatus === 'CONFIRMED' || bookingStatus === 'CONFLICT') && role !== 'SALES' && (
                    <button type="button" className="btn btn-primary" disabled={actionLoading} onClick={() => handleAction('MARK_DONE')} style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
                      ✅ Mark Inspection Done
                    </button>
                  )}
                  {bookingStatus === 'INSPECTION_DONE' && role !== 'SALES' && (
                    <button type="button" className="btn btn-primary" disabled={actionLoading} onClick={() => handleAction('MARK_VALIDATION_DONE')} style={{ backgroundColor: '#059669', borderColor: '#059669' }}>
                      ✓ Mark Validation Done
                    </button>
                  )}
                  {(bookingStatus === 'INSPECTION_DONE' || bookingStatus === 'VALIDATION_DONE') && role !== 'SALES' && (
                    <button type="button" className="btn btn-primary" disabled={actionLoading || sendingReport} onClick={() => handleAction('REPORT_SENT')}>
                      ✉️ Send Report
                    </button>
                  )}
                  {(bookingStatus === 'PENDING_APPROVAL' || ((bookingStatus === 'PENDING_ENGINEER_ASSIGNMENT' || bookingStatus === 'CONFIRMED' || bookingStatus === 'CONFLICT') && role !== 'SALES')) && (
                    <button type="button" className="btn btn-secondary" disabled={actionLoading} onClick={() => handleAction('CANCEL')} style={{ border: '1px solid #fecaca', color: '#b91c1c' }}>
                      ❌ Cancel
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })()}

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
            {['CITY_HEAD', 'SALES', 'ADMIN', 'SUPER_ADMIN'].includes(role) ? (
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

        {/* 2.5 Inspection Report & Validation Section */}
        {['INSPECTION_DONE', 'VALIDATION_DONE', 'REPORT_SENT'].includes(lead.currentBookingStatus) && (
          <div className="card" style={{ borderLeft: '4px solid #10b981', backgroundColor: '#f0fdf4' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#065f46' }}>
                  Inspection Report & Quality Audit
                </h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#047857' }}>
                  Status: <strong>{lead.currentBookingStatus === 'REPORT_SENT' ? 'Report Sent (Customer Notified)' : lead.currentBookingStatus === 'VALIDATION_DONE' ? 'Validation Done (Ready to Send)' : 'Inspection Done (Pending QC Validation)'}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate(`/reports/${lead.currentBookingId || lead.id}`, { state: { booking: lead } })}
                  style={{ backgroundColor: '#059669', borderColor: '#059669' }}
                >
                  📋 View Inspection Report & Snags
                </button>
                {lead.currentBookingStatus === 'VALIDATION_DONE' && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={sendingReport}
                    onClick={handleSendReport}
                    style={{ backgroundColor: '#2563eb', borderColor: '#2563eb' }}
                  >
                    {sendingReport ? 'Sending…' : '✉️ Send Report to Customer'}
                  </button>
                )}
                {lead.currentBookingStatus === 'REPORT_SENT' && (
                  <span style={{ padding: '0.5rem 1rem', borderRadius: '0.375rem', backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600, fontSize: '0.875rem' }}>
                    🔒 Report Sent to Customer
                  </span>
                )}
              </div>
            </div>
            <div className="dashboard-grid" style={{ marginBottom: 0, gap: '1rem' }}>
              <Field label="Inspector" value={lead.inspectionDoneBy || 'Lead Field Inspector'} />
              <Field label="Validator" value={lead.validatorName || 'Quality Validator'} />
              <Field label="Validation Notes" value={lead.validatorRemarks || 'Quality checks verified'} />
            </div>
          </div>
        )}

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

      {bookingLeadTarget && (
        <CreateBookingModal
          lead={bookingLeadTarget}
          onClose={() => setBookingLeadTarget(null)}
          onSuccess={fetchLead}
        />
      )}

      {assignEngineerTarget && (
        <AssignEngineerModal
          booking={assignEngineerTarget}
          onClose={() => setAssignEngineerTarget(null)}
          onSuccess={fetchLead}
        />
      )}

      {rescheduleTarget && (
        <RescheduleBookingModal
          booking={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={fetchLead}
        />
      )}
    </div>
  );
}
