import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import client from '../api/client';
import ApproveBookingModal from '../components/bookings/ApproveBookingModal';
import AssignEngineerModal from '../components/bookings/AssignEngineerModal';
import RescheduleBookingModal from '../components/bookings/RescheduleBookingModal';

const CITIES = ['All', 'Bangalore', 'Hyderabad', 'Delhi NCR', 'Mumbai', 'Pune', 'Chennai', 'Others'];
const STATUSES = [
  { value: 'All', label: 'All Statuses' },
  { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
  { value: 'PENDING_ENGINEER_ASSIGNMENT', label: 'Pending Assignment' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'CONFLICT', label: 'Conflict' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

export default function BookingsPage() {
  const { role, city: userCity, id: currentUserId } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState([]);

  const [cityFilter, setCityFilter] = useState(
    role === 'CITY_HEAD' ? (userCity || 'All') : 'All'
  );
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [approveTarget, setApproveTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (cityFilter !== 'All') params.set('city', cityFilter);
      if (statusFilter !== 'All') params.set('status', statusFilter);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      const res = await client.get(`/bookings?${params.toString()}`);
      setBookings(res.data || []);
    } catch {
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [cityFilter, statusFilter, dateFrom, dateTo, showToast]);

  const fetchConflicts = useCallback(async () => {
    try {
      const url = userCity && role === 'CITY_HEAD'
        ? `/bookings/conflicts?city=${userCity}`
        : '/bookings/conflicts';
      const res = await client.get(url);
      setConflicts(res.data || []);
    } catch { /* silent */ }
  }, [userCity, role]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);
  useEffect(() => { fetchConflicts(); }, [fetchConflicts]);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingId(id);
    try {
      await client.put(`/bookings/${id}/cancel`);
      showToast('Booking cancelled', 'info');
      fetchBookings();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to cancel booking', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  const canCancel = (b) => b.status !== 'CONFIRMED' && b.status !== 'CANCELLED';

  return (
    <div className="app-container">
      <div className="dashboard-container">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 style={{ marginBottom: 0 }}>Bookings</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage inspection bookings</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
          </div>
        </header>

        {/* Conflict Banner */}
        {conflicts.length > 0 && (
          <div style={{
            backgroundColor: '#fef2f2', border: '1px solid #fecaca',
            borderRadius: '0.75rem', padding: '1rem 1.5rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap',
          }}>
            <span style={{ color: '#991b1b', fontWeight: 600 }}>
              ⚠️ {conflicts.length} booking(s) have conflicts. Engineers went on leave after assignment.
            </span>
            <button
              className="btn"
              style={{ backgroundColor: '#991b1b', color: 'white', padding: '0.4rem 0.875rem', fontSize: '0.8125rem' }}
              onClick={() => setStatusFilter('CONFLICT')}
            >
              Filter by Conflict
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
              <label style={{ fontSize: '0.8125rem' }}>City</label>
              <select
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
                disabled={role === 'CITY_HEAD'}
                className="select-input"
              >
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: '1 1 180px' }}>
              <label style={{ fontSize: '0.8125rem' }}>Status</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="select-input">
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
              <label style={{ fontSize: '0.8125rem' }}>From Date</label>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: '1 1 140px' }}>
              <label style={{ fontSize: '0.8125rem' }}>To Date</label>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
            </div>
            <button className="btn btn-secondary" onClick={() => { setCityFilter(role === 'CITY_HEAD' ? (userCity || 'All') : 'All'); setStatusFilter('All'); setDateFrom(''); setDateTo(''); }}>
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ marginBottom: 0, fontSize: '1rem' }}>
              {loading ? 'Loading…' : `${bookings.length} booking(s)`}
            </h2>
            <button className="btn btn-secondary" onClick={fetchBookings} disabled={loading} style={{ padding: '0.4rem 0.875rem', fontSize: '0.8125rem' }}>
              Refresh
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {bookings.length === 0 && !loading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No bookings found matching the current filters.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>City</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Slot</th>
                    <th>Time</th>
                    <th>Engineer</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 500, whiteSpace: 'nowrap' }}>{b.customerName || `Lead #${b.leadId}`}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>{b.city}</td>
                      <td><BookingTypeBadge type={b.bookingType} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{b.date}</td>
                      <td><SlotBadge slot={b.slot} /></td>
                      <td style={{ whiteSpace: 'nowrap' }}>{b.slotTime}</td>
                      <td style={{ whiteSpace: 'nowrap', color: b.engineerEmployeeNumber ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {b.engineerName || (b.engineerEmployeeNumber ? b.engineerEmployeeNumber : 'Not Assigned')}
                      </td>
                      <td><BookingStatusBadge status={b.status} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'nowrap' }}>
                          {role === 'SALES' && b.status === 'PENDING_APPROVAL' && (
                            <button
                              className="btn"
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#ecfdf5', color: '#047857' }}
                              onClick={() => setApproveTarget(b)}
                            >
                              Approve
                            </button>
                          )}
                          {role === 'CITY_HEAD' && (b.status === 'PENDING_ENGINEER_ASSIGNMENT' || b.status === 'CONFLICT') && (
                            <button
                              className="btn"
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#eff6ff', color: '#1d4ed8' }}
                              onClick={() => setAssignTarget(b)}
                            >
                              Assign
                            </button>
                          )}
                          {canCancel(b) && (
                            <button
                              className="btn"
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#fef2f2', color: '#991b1b' }}
                              onClick={() => handleCancel(b.id)}
                              disabled={cancellingId === b.id}
                            >
                              {cancellingId === b.id ? '…' : 'Cancel'}
                            </button>
                          )}
                          {b.status !== 'CANCELLED' && (
                            <button
                              className="btn"
                              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#fffbeb', color: '#92400e' }}
                              onClick={() => setRescheduleTarget(b)}
                            >
                              Reschedule
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {approveTarget && (
        <ApproveBookingModal
          booking={approveTarget}
          onClose={() => setApproveTarget(null)}
          onSuccess={fetchBookings}
        />
      )}
      {assignTarget && (
        <AssignEngineerModal
          booking={assignTarget}
          onClose={() => setAssignTarget(null)}
          onSuccess={() => { fetchBookings(); fetchConflicts(); }}
        />
      )}
      {rescheduleTarget && (
        <RescheduleBookingModal
          booking={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={() => { fetchBookings(); fetchConflicts(); }}
        />
      )}
    </div>
  );
}
