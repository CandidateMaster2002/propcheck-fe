import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { BookingStatusBadge, SlotBadge, BookingTypeBadge } from './BookingStatusBadge';

const STANDARD_CITIES = ['Bangalore', 'Hyderabad', 'Delhi NCR', 'Mumbai', 'Pune'];
const MORNING_TIMES = ['10:00', '10:30', '11:00', '11:30'];
const EVENING_TIMES = ['14:00', '14:30', '15:00', '15:30', '16:00'];

export default function RescheduleBookingModal({ booking, onClose, onSuccess }) {
  const { id: currentUserId } = useAuth();
  const { showToast } = useToast();

  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [slotTime, setSlotTime] = useState('');
  
  const [calendarData, setCalendarData] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isNonStandard = booking?.city && !STANDARD_CITIES.includes(booking.city);

  useEffect(() => {
    if (!booking?.bookingType) return;
    
    const fetchCal = async () => {
      setLoadingCalendar(true);
      try {
        if (isNonStandard && booking.city) {
          const mock = [];
          for (let i = 0; i < 21; i++) {
            const d = new Date(); d.setDate(d.getDate() + i);
            mock.push({
              date: d.toISOString().split('T')[0],
              morningAvailable: true, eveningAvailable: true, anyAvailable: true
            });
          }
          setCalendarData(mock);
        } else {
          const start = new Date().toISOString().split('T')[0];
          const c = booking.city ? encodeURIComponent(booking.city) : '';
          const res = await client.get(`/bookings/availability-calendar?city=${c}&bookingType=${booking.bookingType}&startDate=${start}&days=21`);
          
          if (Array.isArray(res.data)) {
            setCalendarData(res.data);
          } else {
            setCalendarData([]);
          }
        }
      } catch (err) {
        console.error('Failed to fetch calendar:', err);
        setCalendarData([]);
      } finally {
        setLoadingCalendar(false);
      }
    };
    fetchCal();
  }, [booking?.city, booking?.bookingType, isNonStandard]);

  const handleSubmit = async () => {
    if (!date || !slot || !slotTime) return;
    setSubmitting(true);
    try {
      await client.put(`/bookings/${booking.id}/reschedule`, {
        date,
        slot,
        slotTime,
        requestedByUserId: currentUserId,
      });
      showToast('Booking rescheduled ✅', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Something went wrong';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  const isFormValid = date && slot && slotTime;

  const formatDateButton = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
    
    const isToday = d.toDateString() === today.toDateString();
    const isTomorrow = d.toDateString() === tomorrow.toDateString();
    const formatted = d.toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });

    if (isToday) return `Today (${formatted})`;
    if (isTomorrow) return `Tomorrow (${formatted})`;
    return formatted;
  };

  const visibleDates = showAllDates ? calendarData : calendarData.slice(0, 6);
  const selectedDayData = calendarData.find(d => d.date === date);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h2 style={{ marginBottom: 0 }}>Reschedule Booking</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Current Booking Info */}
          <div className="booking-summary-mini" style={{ marginBottom: '1.5rem', backgroundColor: '#f9fafb', border: '1px solid var(--border-color)' }}>
            <div><span className="field-label">Customer</span><strong>{booking.customerName || '—'}</strong></div>
            <div><span className="field-label">City</span>{booking.city}</div>
            <div><span className="field-label">Type</span><BookingTypeBadge type={booking.bookingType} /></div>
            <div>
              <span className="field-label">Current Appointment</span>
              {booking.date} · {booking.slotTime}
            </div>
          </div>

          <div className="alert alert-warning" style={{ marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
            ⚠️ Rescheduling will remove the assigned engineer (if any). The City Head will need to assign a new engineer after rescheduling.
          </div>

          {/* New Date */}
          <div className="form-group">
            <label>New Date</label>
            {loadingCalendar ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Loading dates...</div>
            ) : calendarData.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--error-color)', marginTop: '0.5rem' }}>
                Unable to load calendar. Please close and try again.
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {visibleDates.map(day => {
                  const isSelected = date === day.date;
                  const isDisabled = !day.anyAvailable;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => { setDate(day.date); setSlot(''); setSlotTime(''); }}
                      style={{
                        padding: '0.625rem 1rem', borderRadius: '0.5rem', cursor: isDisabled ? 'not-allowed' : 'pointer',
                        border: `2px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        backgroundColor: isDisabled ? '#f3f4f6' : isSelected ? '#eef2ff' : 'white',
                        color: isDisabled ? '#9ca3af' : 'var(--text-main)',
                        fontWeight: isSelected ? 600 : 400,
                        transition: 'all 0.15s'
                      }}
                    >
                      {formatDateButton(day.date)}
                    </button>
                  );
                })}
                {!showAllDates && calendarData.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllDates(true)}
                    style={{
                      padding: '0.625rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                      border: '2px dashed var(--border-color)', backgroundColor: 'transparent',
                      color: 'var(--text-muted)', fontWeight: 500
                    }}
                  >
                    Show more dates...
                  </button>
                )}
              </div>
            )}
          </div>

          {/* New Slot */}
          <div className="form-group" style={{ marginTop: '1.5rem', opacity: date ? 1 : 0.5, pointerEvents: date ? 'auto' : 'none' }}>
            <label>New Slot</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                disabled={!selectedDayData?.morningAvailable}
                onClick={() => { setSlot('MORNING'); setSlotTime(''); }}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '0.75rem', cursor: !selectedDayData?.morningAvailable ? 'not-allowed' : 'pointer',
                  border: `2px solid ${slot === 'MORNING' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  backgroundColor: !selectedDayData?.morningAvailable ? '#f3f4f6' : slot === 'MORNING' ? '#eef2ff' : 'white',
                  color: !selectedDayData?.morningAvailable ? '#9ca3af' : 'var(--text-main)',
                  fontWeight: slot === 'MORNING' ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                🌅 Morning
              </button>
              <button
                type="button"
                disabled={!selectedDayData?.eveningAvailable}
                onClick={() => { setSlot('EVENING'); setSlotTime(''); }}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '0.75rem', cursor: !selectedDayData?.eveningAvailable ? 'not-allowed' : 'pointer',
                  border: `2px solid ${slot === 'EVENING' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  backgroundColor: !selectedDayData?.eveningAvailable ? '#f3f4f6' : slot === 'EVENING' ? '#eef2ff' : 'white',
                  color: !selectedDayData?.eveningAvailable ? '#9ca3af' : 'var(--text-main)',
                  fontWeight: slot === 'EVENING' ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                🌆 Evening
              </button>
            </div>
          </div>

          {/* New Time */}
          {slot && (
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>New Time</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {(slot === 'MORNING' ? MORNING_TIMES : EVENING_TIMES).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSlotTime(t)}
                    style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      border: `2px solid ${slotTime === t ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      backgroundColor: slotTime === t ? '#eef2ff' : 'white',
                      fontWeight: slotTime === t ? 600 : 400,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting || !isFormValid}>
            {submitting ? 'Rescheduling…' : 'Confirm Reschedule'}
          </button>
        </div>
      </div>
    </div>
  );
}
