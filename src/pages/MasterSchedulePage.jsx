import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import client from '../api/client';
import { BookingStatusBadge, BookingTypeBadge, SlotBadge } from '../components/bookings/BookingStatusBadge';

const CITIES = ['All', 'Bangalore', 'Hyderabad', 'Delhi NCR', 'Mumbai', 'Pune', 'Chennai', 'Others'];

const getDatesBetween = (start, end) => {
  const dates = [];
  let current = new Date(start);
  const endD = new Date(end);
  while (current <= endD) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

// --- Quick Modal for Booking Details ---
const BookingDetailModal = ({ bookingId, onClose }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get(`/bookings/${bookingId}`)
      .then(res => setBooking(res.data))
      .catch(() => {}) // Handle silently, could be mock data issue
      .finally(() => setLoading(false));
  }, [bookingId]);

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 style={{ marginBottom: 0 }}>Booking #{bookingId}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
          ) : !booking ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Could not load booking details.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <BookingStatusBadge status={booking.status} />
                <BookingTypeBadge type={booking.bookingType} />
              </div>
              <div className="booking-summary-mini" style={{ gridTemplateColumns: '1fr', gap: '1rem', backgroundColor: '#f9fafb', border: '1px solid var(--border-color)' }}>
                <div><span className="field-label">Customer</span><div style={{ fontWeight: 600, fontSize: '1rem' }}>{booking.customerName || `Lead #${booking.leadId}`}</div></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><span className="field-label">Date</span>{booking.date}</div>
                  <div><span className="field-label">Slot</span><SlotBadge slot={booking.slot} /> ({booking.slotTime})</div>
                  <div><span className="field-label">City</span>{booking.city}</div>
                  <div><span className="field-label">Engineer</span>{booking.engineerName || booking.engineerEmployeeNumber || 'Not Assigned'}</div>
                </div>
              </div>
              {booking.conflictReason && (
                <div className="alert alert-error">
                  <strong>Conflict Reason:</strong> {booking.conflictReason}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function MasterSchedulePage() {
  const { role, city: userCity } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const getDefaultDates = () => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    return {
      start: today.toISOString().split('T')[0],
      end: nextWeek.toISOString().split('T')[0],
    };
  };

  const [startDate, setStartDate] = useState(getDefaultDates().start);
  const [endDate, setEndDate] = useState(getDefaultDates().end);
  const [cityFilter, setCityFilter] = useState(role === 'CITY_HEAD' ? (userCity || 'All') : 'All');
  const [engineerFilter, setEngineerFilter] = useState('');

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState(null);

  const fetchSchedule = useCallback(async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const cityQuery = cityFilter !== 'All' ? `&city=${encodeURIComponent(cityFilter)}` : '';
      const res = await client.get(`/schedule/matrix?startDate=${startDate}&endDate=${endDate}${cityQuery}`);
      setSchedules(res.data || []);
      
      // If the current engineer filter is not in the new list, clear it
      if (engineerFilter && !(res.data || []).some(e => e.employeeNumber === engineerFilter)) {
        setEngineerFilter('');
      }
    } catch (err) {
      showToast('Failed to load master schedule.', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, cityFilter, showToast, engineerFilter]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Derived data
  const dateColumns = useMemo(() => getDatesBetween(startDate, endDate), [startDate, endDate]);
  
  const uniqueEngineers = useMemo(() => {
    return schedules.map(s => ({ empNo: s.employeeNumber, name: s.name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [schedules]);

  const displayedSchedules = useMemo(() => {
    let filtered = schedules;
    if (engineerFilter) {
      filtered = filtered.filter(s => s.employeeNumber === engineerFilter);
    }
    return filtered;
  }, [schedules, engineerFilter]);

  const renderCell = (slotInfo) => {
    if (!slotInfo) {
      return <td style={{ backgroundColor: '#f9fafb', border: '1px solid var(--border-color)', minWidth: '120px' }}></td>;
    }
    
    const { status, label, bookingId } = slotInfo;
    let bg = '#ffffff'; let color = 'var(--text-main)'; let cursor = 'default'; let border = '1px solid var(--border-color)';
    
    if (status === 'AVAILABLE') { bg = '#ffffff'; color = '#9ca3af'; border = '1px solid var(--border-color)'; }
    else if (status === 'LEAVE') { bg = '#fef08a'; color = '#854d0e'; border = '1px solid #fde047'; }
    else if (status === 'CONFIRMED') { bg = '#d1fae5'; color = '#065f46'; border = '1px solid #a7f3d0'; cursor = 'pointer'; }
    else if (status === 'CONFLICT') { bg = '#fee2e2'; color = '#991b1b'; border = '1px solid #fecaca'; cursor = 'pointer'; }

    return (
      <td 
        onClick={() => bookingId ? setSelectedBookingId(bookingId) : null}
        style={{ 
          backgroundColor: bg, color, cursor, padding: '0.5rem', textAlign: 'center', 
          fontSize: '0.75rem', border, minWidth: '120px', transition: 'filter 0.15s' 
        }}
        onMouseOver={e => bookingId && (e.currentTarget.style.filter = 'brightness(0.95)')}
        onMouseOut={e => bookingId && (e.currentTarget.style.filter = 'none')}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
          {status === 'AVAILABLE' && <span>Free</span>}
          {status === 'CONFLICT' && <span>⚠️ Conflict</span>}
          {label && <div style={{ fontWeight: status === 'AVAILABLE' ? 400 : 600, lineHeight: 1.2 }}>{label}</div>}
        </div>
      </td>
    );
  };

  return (
    <div className="app-container">
      <div className="dashboard-container" style={{ maxWidth: '98%', padding: '1.5rem' }}>
        {/* Header */}
        <header className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ marginBottom: 0 }}>Engineer Master Schedule</h1>
            <p style={{ color: 'var(--text-muted)' }}>Matrix view of engineer availability and bookings</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
        </header>

        {/* Filters Panel */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '1rem', 
          marginBottom: '1.5rem', 
          background: 'var(--background-color, #f9fafb)', 
          padding: '1.25rem', 
          borderRadius: '0.5rem', 
          border: '1px solid var(--border-color)',
          alignItems: 'end'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Start Date</label>
            <input 
              type="date" 
              value={startDate} 
              onChange={e => setStartDate(e.target.value)} 
              style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>End Date</label>
            <input 
              type="date" 
              value={endDate} 
              onChange={e => setEndDate(e.target.value)} 
              style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }} 
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>City</label>
            <select 
              value={cityFilter} 
              onChange={e => setCityFilter(e.target.value)} 
              disabled={role === 'CITY_HEAD'}
              style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }}
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Engineer</label>
            <select 
              value={engineerFilter} 
              onChange={e => setEngineerFilter(e.target.value)}
              style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', width: '100%', boxSizing: 'border-box' }}
            >
              <option value="">All Engineers</option>
              {uniqueEngineers.map(e => <option key={e.empNo} value={e.empNo}>{e.name}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" onClick={fetchSchedule} disabled={loading} style={{ height: '42px', width: '100%' }}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Matrix Grid */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto', maxHeight: '70vh' }}>
            {displayedSchedules.length === 0 && !loading ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No schedule data found for the selected filters.
              </div>
            ) : (
              <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  {/* Date Header Row */}
                  <tr>
                    <th rowSpan={2} style={{ width: '220px', minWidth: '220px', backgroundColor: '#f9fafb', borderRight: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', zIndex: 11, left: 0, position: 'sticky', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                      ENGINEER DETAILS
                    </th>
                    {dateColumns.map(date => (
                      <th key={date} colSpan={2} style={{ textAlign: 'center', borderBottom: '1px solid var(--border-color)', borderRight: '2px solid var(--border-color)', padding: '0.75rem 0.5rem', backgroundColor: '#f9fafb', fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' }).toUpperCase()}
                      </th>
                    ))}
                  </tr>
                  {/* Slots Header Row */}
                  <tr>
                    {dateColumns.map(date => (
                      <React.Fragment key={`slots-${date}`}>
                        <th style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, padding: '0.5rem', borderRight: '1px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', backgroundColor: '#fdfdfd', color: 'var(--text-muted)' }}>
                          MOR
                        </th>
                        <th style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, padding: '0.5rem', borderRight: '2px solid var(--border-color)', borderBottom: '2px solid var(--border-color)', backgroundColor: '#fdfdfd', color: 'var(--text-muted)' }}>
                          EVE
                        </th>
                      </React.Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayedSchedules.map((eng) => (
                    <tr key={eng.employeeNumber} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {/* Frozen Engineer Column */}
                      <td style={{ padding: '1rem', backgroundColor: 'white', borderRight: '2px solid var(--border-color)', position: 'sticky', left: 0, zIndex: 5, boxShadow: '2px 0 5px rgba(0,0,0,0.02)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>{eng.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{eng.jobTitle}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{eng.city}</div>
                      </td>
                      
                      {/* Schedule Cells */}
                      {dateColumns.map(date => {
                        const daySchedule = eng.schedule?.[date];
                        return (
                          <React.Fragment key={`${eng.employeeNumber}-${date}`}>
                            {renderCell(daySchedule?.MORNING)}
                            {renderCell(daySchedule?.EVENING)}
                          </React.Fragment>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {selectedBookingId && (
        <BookingDetailModal 
          bookingId={selectedBookingId} 
          onClose={() => setSelectedBookingId(null)} 
        />
      )}
    </div>
  );
}
