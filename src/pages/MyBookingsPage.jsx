import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import client from '../api/client';
import { BookingStatusBadge, SlotBadge, BookingTypeBadge } from '../components/bookings/BookingStatusBadge';
import RescheduleBookingModal from '../components/bookings/RescheduleBookingModal';
import CreateBookingModal from '../components/bookings/CreateBookingModal';

const FRIENDLY_STATUS = {
  PENDING_APPROVAL: { label: 'Under Review', desc: 'Our team will confirm shortly.', color: '#c2410c', bg: '#fff7ed' },
  PENDING_ENGINEER_ASSIGNMENT: { label: 'Booking Confirmed!', desc: 'An engineer will be assigned to your inspection soon.', color: '#1d4ed8', bg: '#eff6ff' },
  CONFIRMED: { label: '✅ Confirmed', desc: null, color: '#047857', bg: '#ecfdf5' },
  CONFLICT: { label: '⚠️ Action Required', desc: 'There is an issue with your booking. Our team will contact you shortly.', color: '#991b1b', bg: '#fef2f2' },
  CANCELLED: { label: 'Cancelled', desc: null, color: '#374151', bg: '#f3f4f6' },
};

export default function MyBookingsPage() {
  const { id: currentUserId, email, name } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myLead, setMyLead] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [bookingLeadTarget, setBookingLeadTarget] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get(`/bookings/my?userId=${currentUserId}`);
      setBookings(res.data || []);
    } catch {
      showToast('Failed to load bookings', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentUserId, showToast]);

  useEffect(() => {
    fetchBookings();
    // Also fetch lead for pre-filling create modal
    if (email) {
      client.get(`/leads/me?email=${encodeURIComponent(email)}`)
        .then(r => setMyLead(Array.isArray(r.data) ? r.data[0] : r.data))
        .catch(() => {});
    }
  }, [fetchBookings, email]);

  const hasActiveBooking = bookings.some(b => !['CANCELLED'].includes(b.status));

  return (
    <div className="app-container">
      <div className="dashboard-container" style={{ maxWidth: '800px' }}>
        <header className="dashboard-header">
          <div>
            <h1 style={{ marginBottom: 0 }}>My Bookings</h1>
            <p style={{ color: 'var(--text-muted)' }}>Track your inspection appointments</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/customer')}>← Dashboard</button>
            {!hasActiveBooking && myLead && (
              <button className="btn btn-primary" onClick={() => setBookingLeadTarget(myLead)}>
                + Book Inspection
              </button>
            )}
          </div>
        </header>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Loading your bookings…
          </div>
        ) : bookings.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
            <h2 style={{ marginBottom: '0.5rem' }}>No bookings yet</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              You haven't booked an inspection yet.
            </p>
            {myLead && (
              <button className="btn btn-primary" onClick={() => setBookingLeadTarget(myLead)}>
                Book Your First Inspection
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {bookings.map(b => {
              const fs = FRIENDLY_STATUS[b.status] || {};
              return (
                <div key={b.id} className="card" style={{ marginBottom: 0, borderLeft: `4px solid ${fs.color || '#6b7280'}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.125rem', color: fs.color }}>
                        {fs.label || b.status}
                      </div>
                      {fs.desc && (
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          {fs.desc}
                          {b.status === 'CONFIRMED' && b.engineerName && (
                            <strong style={{ color: 'var(--text-main)' }}> {b.engineerName} will inspect your property.</strong>
                          )}
                        </div>
                      )}
                    </div>
                    <BookingTypeBadge type={b.bookingType} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', fontSize: '0.875rem' }}>
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Date</div>
                      <div style={{ fontWeight: 600 }}>{b.date}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Slot</div>
                      <SlotBadge slot={b.slot} />
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Time</div>
                      <div style={{ fontWeight: 600 }}>{b.slotTime}</div>
                    </div>
                    <div>
                      <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>City</div>
                      <div style={{ fontWeight: 600 }}>{b.city}</div>
                    </div>
                    {b.status === 'CONFIRMED' && b.engineerName && (
                      <div>
                        <div style={{ color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Inspector</div>
                        <div style={{ fontWeight: 600 }}>{b.engineerName}</div>
                      </div>
                    )}
                  </div>
                  
                  {b.status !== 'CANCELLED' && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', gap: '0.75rem' }}>
                      <button 
                        className="btn btn-secondary" 
                        style={{ fontSize: '0.8125rem', padding: '0.4rem 1rem' }}
                        onClick={() => setRescheduleTarget(b)}
                      >
                        Reschedule Booking
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rescheduleTarget && (
        <RescheduleBookingModal
          booking={rescheduleTarget}
          onClose={() => setRescheduleTarget(null)}
          onSuccess={fetchBookings}
        />
      )}
      {bookingLeadTarget && (
        <CreateBookingModal 
          lead={bookingLeadTarget} 
          onClose={() => setBookingLeadTarget(null)}
          onSuccess={fetchBookings}
        />
      )}
    </div>
  );
}
