import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const formatDate = (isoString) => {
  if (!isoString) return '-';
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
  if (amount === null || amount === undefined) return '-';
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
      padding: '0.25rem 0.75rem', 
      borderRadius: '9999px', 
      fontSize: '0.75rem', 
      fontWeight: 500, 
      backgroundColor: bgColor, 
      color: color, 
      whiteSpace: 'nowrap',
      display: 'inline-block'
    }}>
      {status || '-'}
    </span>
  );
};

// Define all columns in the order they should appear.
const COLUMNS = [
  { key: 'customerName', label: 'Customer Name', defaultVisible: true },
  { key: 'bookingStatus', label: 'Booking Status', defaultVisible: true },
  { key: 'paymentStatus', label: 'Payment Status', defaultVisible: true },
  { key: 'phone', label: 'Phone', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'city', label: 'City', defaultVisible: true },
  { key: 'projectName', label: 'Project Name', defaultVisible: true },
  { key: 'flatNo', label: 'Flat No.', defaultVisible: true },
  { key: 'bhkType', label: 'BHK Type', defaultVisible: true },
  { key: 'dealType', label: 'Deal Type', defaultVisible: true },
  { key: 'bookedBy', label: 'Booked By', defaultVisible: true },
  { key: 'inspectionType', label: 'Inspection Type', defaultVisible: true },
  { key: 'inspectionDateAndTime', label: 'Inspection Date', defaultVisible: true },
  { key: 'inspectionDoneBy', label: 'Inspection Done By', defaultVisible: true },
  { key: 'remarks', label: 'Remarks', defaultVisible: true },
  { key: 'validatorName', label: 'Validator Name', defaultVisible: true },
  { key: 'digitalTwinTagging', label: 'Digital Twin', defaultVisible: true },
];

export default function LeadsTable({ leads, users = [], loading, emptyMessage, onRowClick, onBookClick, onAction }) {
  const { role } = useAuth();
  // Initialize with default visible columns
  const [visibleColumns, setVisibleColumns] = useState(() => 
    COLUMNS.filter(c => c.defaultVisible).map(c => c.key)
  );
  
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Apply payment filter
  const filteredLeads = useMemo(() => {
    if (paymentFilter === 'All') return leads;
    return leads.filter(l => l.paymentStatus === paymentFilter);
  }, [leads, paymentFilter]);

  const toggleColumn = (key) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const renderCell = (lead, colKey) => {
    switch (colKey) {
      case 'paymentStatus': 
        return <PaymentBadge status={lead.paymentStatus} />;
      case 'bookingStatus': {
        const status = lead.currentBookingStatus || 'UNBOOKED';
        let bg = '#f3f4f6', color = '#374151', text = 'Unbooked';
        
        if (status === 'UNBOOKED') { bg = '#f3f4f6'; color = '#374151'; text = 'Unbooked'; }
        else if (status === 'PENDING_APPROVAL') { bg = '#ffedd5'; color = '#c2410c'; text = 'Pending Approval'; }
        else if (status === 'PENDING_ENGINEER_ASSIGNMENT') { bg = '#fef08a'; color = '#854d0e'; text = 'Pending Engineer'; }
        else if (status === 'CONFIRMED') { bg = '#dcfce7'; color = '#166534'; text = 'Confirmed'; }
        else if (status === 'CONFLICT') { bg = '#fee2e2'; color = '#991b1b'; text = 'Schedule Conflict'; }
        else if (status === 'INSPECTION_DONE') { bg = '#dbeafe'; color = '#1e40af'; text = 'Inspection Done'; }
        else if (status === 'VALIDATION_DONE') { bg = '#ccfbf1'; color = '#0f766e'; text = 'Validation Done'; }
        else if (status === 'REPORT_SENT') { bg = '#f3e8ff'; color = '#6b21a8'; text = 'Report Sent'; }
        else if (status === 'POSTPONED_CANCELLED' || status === 'CANCELLED') { bg = '#fee2e2'; color = '#991b1b'; text = 'Postponed / Cancelled'; }
        else { bg = '#e0e7ff'; color = '#3730a3'; text = status.replace(/_/g, ' '); }

        return (
          <span style={{ 
            padding: '0.25rem 0.75rem', 
            borderRadius: '9999px', 
            fontSize: '0.75rem', 
            fontWeight: 600, 
            backgroundColor: bg, 
            color: color, 
            whiteSpace: 'nowrap',
            display: 'inline-block'
          }}>
            {text}
          </span>
        );
      }
      case 'inspectionDateAndTime': {
        const dateStr = formatDate(lead[colKey]);
        if (lead.scheduledByUserId && users && users.length > 0) {
          const u = users.find(u => String(u.id) === String(lead.scheduledByUserId));
          if (u) {
            return (
              <div>
                <div>{dateStr}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Allotted By: {u.name}
                </div>
              </div>
            );
          }
        }
        return dateStr;
      }
      default:
        return lead[colKey] !== null && lead[colKey] !== undefined ? String(lead[colKey]) : '-';
    }
  };

  if (loading && leads.length === 0) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leads...</div>;
  }

  return (
    <div>
      {/* Controls: Filter and Column Selector */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: '1rem', 
        marginBottom: '1rem',
        background: 'var(--background-color, #f9fafb)',
        padding: '0.75rem 1.25rem',
        borderRadius: '0.5rem',
        border: '1px solid var(--border-color)'
      }}>
        
        {/* Payment Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)', marginRight: '0.5rem' }}>Payment Status:</span>
          {['All', 'Fully Paid', 'Partially Paid', 'Unpaid', 'Refunded'].map(status => (
            <button 
              key={status}
              onClick={() => setPaymentFilter(status)}
              className={paymentFilter === status ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Column Selector */}
        <div style={{ position: 'relative' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setShowColumnSelector(!showColumnSelector)}
            style={{ padding: '0.35rem 0.75rem', fontSize: '0.875rem' }}
          >
            Columns ⚙️
          </button>
          
          {showColumnSelector && (
            <div style={{
              position: 'absolute', right: 0, top: '100%', zIndex: 10,
              background: 'white', border: '1px solid var(--border-color)', borderRadius: '0.5rem',
              padding: '1rem', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              display: 'grid', gridTemplateColumns: 'repeat(2, minmax(160px, 1fr))',
              gap: '0.5rem', width: 'max-content', maxWidth: '90vw', marginTop: '0.5rem'
            }}>
              {COLUMNS.map(col => (
                <label key={col.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0, fontSize: '0.875rem', fontWeight: 400, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={visibleColumns.includes(col.key)} 
                    onChange={() => toggleColumn(col.key)}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table Area */}
      {filteredLeads.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          {paymentFilter !== 'All' 
            ? `No leads found with payment status "${paymentFilter}".` 
            : (emptyMessage || 'No leads found.')}
        </div>
      ) : (
        <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table>
            <thead>
              <tr>
                {onBookClick && (
                  <th style={{ width: '50px', textAlign: 'center', whiteSpace: 'nowrap' }}>Action</th>
                )}
                {COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                  <th key={col.key} style={{ whiteSpace: 'nowrap' }}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr 
                  key={lead.id} 
                  onClick={() => onRowClick && onRowClick(lead.id)} 
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {onBookClick && (
                    <td style={{ textAlign: 'center', overflow: 'visible' }}>
                      {(() => {
                        const status = lead.currentBookingStatus || 'UNBOOKED';
                        
                        if (status === 'REPORT_SENT') {
                          return (
                            <select disabled style={{ padding: '0.25rem', borderRadius: '0.25rem', border: '1px solid #d1d5db', background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed', appearance: 'none', textAlign: 'center' }} title="No Actions">
                              <option>🔒</option>
                            </select>
                          );
                        }

                        return (
                          <select
                            value=""
                            onChange={(e) => {
                              e.stopPropagation();
                              const action = e.target.value;
                              if (action) {
                                if (action === 'BOOK') {
                                  onBookClick(lead);
                                } else if (onAction) {
                                  onAction(action, lead);
                                }
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ 
                              padding: '0.25rem 0.5rem', 
                              borderRadius: '0.25rem', 
                              border: '1px solid var(--primary-color)', 
                              background: 'var(--primary-color)',
                              color: 'white',
                              cursor: 'pointer',
                              fontWeight: 500,
                              textAlign: 'center'
                            }}
                            title="Actions"
                          >
                            <option value="" disabled>⚙️ ▾</option>
                            {status === 'UNBOOKED' && <option value="BOOK">Book</option>}
                            {status === 'PENDING_ENGINEER_ASSIGNMENT' && (
                              <>
                                <option value="RESCHEDULE">Change Date</option>
                                {role !== 'SALES' && <option value="ASSIGN_ENGINEER">Allot Engineer</option>}
                                {role !== 'SALES' && <option value="CANCEL">Postpone / Cancel</option>}
                              </>
                            )}
                            {(status === 'CONFIRMED' || status === 'CONFLICT') && role !== 'SALES' && (
                              <>
                                <option value="MARK_DONE">Mark Inspection Done</option>
                                <option value="CANCEL">Postpone / Cancel</option>
                              </>
                            )}
                            {status === 'INSPECTION_DONE' && role !== 'SALES' && (
                              <>
                                <option value="MARK_VALIDATION_DONE">Mark Validation Done</option>
                                <option value="REPORT_SENT">Report Sent</option>
                              </>
                            )}
                            {status === 'VALIDATION_DONE' && role !== 'SALES' && (
                              <option value="REPORT_SENT">Report Sent</option>
                            )}
                          </select>
                        );
                      })()}
                    </td>
                  )}
                  {COLUMNS.filter(col => visibleColumns.includes(col.key)).map(col => (
                    <td 
                      key={col.key} 
                      style={{ 
                        whiteSpace: (col.key === 'remarks' || col.key === 'projectName') ? 'normal' : 'nowrap',
                        minWidth: col.key === 'remarks' ? '200px' : 'auto',
                        fontWeight: col.key === 'customerName' ? 500 : 400
                      }}
                    >
                      {renderCell(lead, col.key)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
