import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  let bgColor = '#e0e7ff', color = '#3730a3', label = status || 'Data Not Updated';
  if (status === 'Fully Paid') { bgColor = '#dcfce7'; color = '#166534'; label = 'Fully Paid'; }
  else if (status === 'Partially Paid') { bgColor = '#fef08a'; color = '#854d0e'; label = 'Partially Paid'; }
  else if (status === 'Unpaid' || status === 'Data Not Updated' || !status) { bgColor = '#fee2e2'; color = '#991b1b'; label = 'Data Not Updated'; }
  else if (status === 'Refunded') { bgColor = '#f3f4f6'; color = '#374151'; label = 'Refunded'; }
  
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
      {label}
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

function ActionMenu({ items, onSelect }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, openUp: false });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e) => {
      if (
        btnRef.current &&
        !btnRef.current.contains(e.target) &&
        menuRef.current &&
        !menuRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const handleScroll = () => setOpen(false);

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [open]);

  if (!items || items.length === 0) return null;

  const toggleMenu = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const estimatedHeight = items.length * 38 + 16;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < estimatedHeight && rect.top > estimatedHeight;
      const left = Math.min(rect.left, window.innerWidth - 230);
      setCoords({
        top: openUp ? rect.top - 6 : rect.bottom + 6,
        left: Math.max(8, left),
        openUp,
      });
    }
    setOpen((prev) => !prev);
  };

  return (
    <div style={{ display: 'inline-block', position: 'relative' }} onClick={(e) => e.stopPropagation()}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggleMenu}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          padding: '0.35rem 0.7rem',
          borderRadius: '0.45rem',
          border: '1px solid #c7d2fe',
          background: open ? '#4f46e5' : '#eef2ff',
          color: open ? '#ffffff' : '#4338ca',
          fontSize: '0.78rem',
          fontWeight: 600,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s ease',
        }}
      >
        <span>Actions</span>
        <span style={{ fontSize: '0.65rem', opacity: 0.85 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            transform: coords.openUp ? 'translateY(-100%)' : 'none',
            minWidth: '215px',
            backgroundColor: '#ffffff',
            borderRadius: '0.65rem',
            border: '1px solid #e2e8f0',
            boxShadow: '0 14px 32px rgba(15, 23, 42, 0.16), 0 2px 6px rgba(15, 23, 42, 0.06)',
            padding: '0.35rem',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            textAlign: 'left',
          }}
        >
          {items.map((item) => (
            <React.Fragment key={item.value}>
              {item.dividerBefore && (
                <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '0.25rem 0.3rem' }} />
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                  onSelect(item.value);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.55rem',
                  width: '100%',
                  padding: '0.5rem 0.7rem',
                  border: 'none',
                  borderRadius: '0.45rem',
                  background: 'transparent',
                  color: item.danger ? '#b91c1c' : '#0f172a',
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = item.danger ? '#fef2f2' : '#f1f5f9';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '0.9rem', width: '18px', textAlign: 'center' }}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LeadsTable({ leads, users = [], loading, emptyMessage, onRowClick, onBookClick, onAction }) {
  const { role, canValidate } = useAuth();
  const canDoValidation = Boolean(canValidate || role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'CITY_HEAD' || role === 'VALIDATOR');
  // Initialize with default visible columns
  const [visibleColumns, setVisibleColumns] = useState(() => 
    COLUMNS.filter(c => c.defaultVisible).map(c => c.key)
  );
  
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [showColumnSelector, setShowColumnSelector] = useState(false);

  // Apply payment filter
  const filteredLeads = useMemo(() => {
    if (paymentFilter === 'All') return leads;
    if (paymentFilter === 'Data Not Updated' || paymentFilter === 'Unpaid') {
      return leads.filter(l => l.paymentStatus === 'Unpaid' || l.paymentStatus === 'Data Not Updated' || !l.paymentStatus);
    }
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
        const status = lead.currentBookingStatus || 'NOT_SCHEDULED';
        let bg = '#f3f4f6', color = '#374151', text = 'Not Scheduled';
        
        if (status === 'UNBOOKED' || status === 'NOT_SCHEDULED') { bg = '#f3f4f6'; color = '#374151'; text = 'Not Scheduled'; }
        else if (status === 'PENDING_APPROVAL') { bg = '#ffedd5'; color = '#c2410c'; text = 'Pending Approval'; }
        else if (status === 'PENDING_ENGINEER_ASSIGNMENT') { bg = '#fef08a'; color = '#854d0e'; text = 'Pending Engineer'; }
        else if (status === 'CONFIRMED') { bg = '#dcfce7'; color = '#166534'; text = 'Confirmed'; }
        else if (status === 'CONFLICT') { bg = '#fee2e2'; color = '#991b1b'; text = 'Schedule Conflict'; }
        else if (status === 'INSPECTION_DONE') { bg = '#dbeafe'; color = '#1e40af'; text = 'Inspection Done'; }
        else if (status === 'VALIDATION_DONE') { bg = '#ccfbf1'; color = '#0f766e'; text = 'Validation Done'; }
        else if (status === 'REPORT_SENT') { bg = '#f3e8ff'; color = '#6b21a8'; text = 'Report Sent'; }
        else if (status === 'POSTPONED') { bg = '#fef3c7'; color = '#b45309'; text = 'Postponed'; }
        else if (status === 'CANCELLED' || status === 'POSTPONED_CANCELLED') { bg = '#fee2e2'; color = '#991b1b'; text = 'Cancelled'; }
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
          {['All', 'Fully Paid', 'Partially Paid', 'Data Not Updated', 'Refunded'].map(status => (
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
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const status = lead.currentBookingStatus || 'NOT_SCHEDULED';

                        if (lead.paymentStatus === 'Refunded') {
                          return (
                            <span
                              title="Booking not allowed: Lead is refunded"
                              style={{
                                display: 'inline-block',
                                padding: '0.28rem 0.6rem',
                                borderRadius: '999px',
                                border: '1px solid #e2e8f0',
                                background: '#f8fafc',
                                color: '#64748b',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              🚫 Refunded
                            </span>
                          );
                        }

                        if (status === 'CANCELLED' || status === 'POSTPONED_CANCELLED') {
                          return (
                            <span
                              title="Booking cancelled - Cannot book"
                              style={{
                                display: 'inline-block',
                                padding: '0.28rem 0.6rem',
                                borderRadius: '999px',
                                border: '1px solid #fecaca',
                                background: '#fef2f2',
                                color: '#b91c1c',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              ❌ Cancelled
                            </span>
                          );
                        }

                        const isUnbooked = !status || status === 'UNBOOKED' || status === 'NOT_SCHEDULED';
                        const items = [];

                        if (isUnbooked) {
                          items.push({ value: 'BOOK', icon: '📅', label: 'Book Inspection' });
                        }
                        if (status === 'POSTPONED') {
                          items.push({ value: 'RESCHEDULE', icon: '🗓️', label: 'Change Date' });
                        }
                        if (status === 'PENDING_APPROVAL') {
                          items.push({ value: 'RESCHEDULE', icon: '🗓️', label: 'Change Date' });
                          items.push({ value: 'CANCEL', icon: '❌', label: 'Cancel Booking', danger: true, dividerBefore: true });
                        }
                        if (status === 'PENDING_ENGINEER_ASSIGNMENT') {
                          items.push({ value: 'RESCHEDULE', icon: '🗓️', label: 'Change Date' });
                          if (role !== 'SALES') {
                            items.push({ value: 'ASSIGN_ENGINEER', icon: '👷', label: 'Allot Engineer' });
                            items.push({ value: 'CANCEL', icon: '❌', label: 'Postpone / Cancel', danger: true, dividerBefore: true });
                          }
                        }
                        if (status === 'CONFIRMED' || status === 'CONFLICT') {
                          items.push({ value: 'RESCHEDULE', icon: '🗓️', label: 'Change Date' });
                          if (role !== 'SALES') {
                            items.push({ value: 'MARK_DONE', icon: '✅', label: 'Mark Inspection Done' });
                            items.push({ value: 'CANCEL', icon: '❌', label: 'Postpone / Cancel', danger: true, dividerBefore: true });
                          }
                        }
                        if (status === 'INSPECTION_DONE') {
                          items.push({ value: 'VIEW_REPORT', icon: '🔍', label: 'Review Report & Snags' });
                          if (canDoValidation) {
                            items.push({ value: 'MARK_VALIDATION_DONE', icon: '✓', label: 'Mark Validation Done' });
                          }
                          if (role !== 'SALES') {
                            items.push({ value: 'REPORT_SENT', icon: '✉️', label: 'Send Report' });
                          }
                        }
                        if (status === 'VALIDATION_DONE') {
                          items.push({ value: 'VIEW_REPORT', icon: '🔍', label: 'View Report & Snags' });
                          if (role !== 'SALES') {
                            items.push({ value: 'REPORT_SENT', icon: '✉️', label: 'Send Report' });
                          }
                        }
                        if (status === 'REPORT_SENT') {
                          items.push({ value: 'VIEW_REPORT', icon: '🔍', label: 'View Report & Snags' });
                        }

                        return (
                          <ActionMenu
                            items={items}
                            onSelect={(action) => {
                              if (action === 'BOOK') onBookClick(lead);
                              else if (onAction) onAction(action, lead);
                            }}
                          />
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
