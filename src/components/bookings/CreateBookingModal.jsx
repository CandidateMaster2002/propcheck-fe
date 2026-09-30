import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const STANDARD_CITIES = ['Bangalore', 'Hyderabad', 'Delhi NCR', 'Mumbai', 'Pune'];
const REINSPECTION_ELIGIBLE_TYPES = [
  'Inspection+Re-Inspection',
  'Inspection+Re-Inspection+Interior',
];

export default function CreateBookingModal({ lead, onClose, onSuccess }) {
  const { id: currentUserId, role } = useAuth();
  const { showToast } = useToast();

  const isCustomer = role === 'CUSTOMER';
  
  // Form State
  const [bookingType, setBookingType] = useState('INSPECTION');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [slotTime, setSlotTime] = useState('');

  // Status State
  const [calendarData, setCalendarData] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Derived Values
  const city = lead?.city || '';
  const isNonStandard = city && !STANDARD_CITIES.includes(city);
  const canOfferReinspection = REINSPECTION_ELIGIBLE_TYPES.includes(lead?.inspectionType);

  // Auto-reset booking type if reinspection isn't allowed
  useEffect(() => {
    if (bookingType === 'REINSPECTION' && !canOfferReinspection) {
      setBookingType('INSPECTION');
    }
  }, [canOfferReinspection, bookingType]);

  // Live Availability Calendar Check
  useEffect(() => {
    if (!bookingType) return;
    
    const fetchCal = async () => {
      setLoadingCalendar(true);
      try {
        if (isNonStandard && city) {
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
          const c = city ? encodeURIComponent(city) : '';
          const res = await client.get(`/bookings/availability-calendar?city=${c}&bookingType=${bookingType}&startDate=${start}&days=21`);
          
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
  }, [city, bookingType, isNonStandard]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lead || !date || !slot || !slotTime) return;
    
    setSubmitting(true);
    try {
      await client.post('/bookings', {
        leadId: lead.id,
        bookingType,
        city,
        date,
        slot,
        slotTime,
        createdByUserId: currentUserId,
      });
      showToast('Booking created successfully ✅', 'success');
      onSuccess?.();
      onClose();
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Something went wrong';
      showToast(errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = lead && date && slot && slotTime;

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
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 style={{ marginBottom: 0 }}>Book New Inspection</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body" style={{ paddingBottom: '2rem' }}>
          {/* Display Selected Customer Info */}
          <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Customer</div>
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{lead.customerName}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{lead.city} · {lead.inspectionType}</div>
          </div>

          {/* Type */}
          <div className="form-group">
            <label>Booking Type</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => { setBookingType('INSPECTION'); setDate(''); setSlot(''); setSlotTime(''); }}
                style={{
                  flex: 1, padding: '0.875rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                  border: `2px solid ${bookingType === 'INSPECTION' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  backgroundColor: bookingType === 'INSPECTION' ? '#eef2ff' : 'white',
                  transition: 'all 0.15s'
                }}
              >
                🔍 Inspection
              </button>
              {canOfferReinspection && (
                <button
                  type="button"
                  onClick={() => { setBookingType('REINSPECTION'); setDate(''); setSlot(''); setSlotTime(''); }}
                  style={{
                    flex: 1, padding: '0.875rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer',
                    border: `2px solid ${bookingType === 'REINSPECTION' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    backgroundColor: bookingType === 'REINSPECTION' ? '#eef2ff' : 'white',
                    transition: 'all 0.15s'
                  }}
                >
                  🔄 Re-Inspection
                </button>
              )}
            </div>
          </div>

          {/* Date Selection */}
          <div className="form-group" style={{ marginTop: '1.5rem' }}>
            <label>Select Date</label>
            {loadingCalendar ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Loading dates...</div>
            ) : calendarData.length === 0 ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--error-color)', marginTop: '0.5rem' }}>
                Unable to load calendar. Please check city and try again.
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

          {/* Slot */}
          <div className="form-group" style={{ marginTop: '1.5rem', opacity: date ? 1 : 0.5, pointerEvents: date ? 'auto' : 'none' }}>
            <label>Select Slot</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                disabled={!selectedDayData?.morningAvailable}
                onClick={() => { setSlot('MORNING'); setSlotTime(''); }}
                style={{
                  flex: 1, padding: '0.875rem', borderRadius: '0.5rem', cursor: !selectedDayData?.morningAvailable ? 'not-allowed' : 'pointer',
                  border: `2px solid ${slot === 'MORNING' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  backgroundColor: !selectedDayData?.morningAvailable ? '#f3f4f6' : slot === 'MORNING' ? '#eef2ff' : 'white',
                  color: !selectedDayData?.morningAvailable ? '#9ca3af' : 'var(--text-main)',
                  fontWeight: slot === 'MORNING' ? 600 : 400,
                  transition: 'all 0.15s'
                }}
              >
                🌅 Morning <span style={{ fontWeight: 400, color: 'inherit', fontSize: '0.75rem', display: 'block' }}>10:00 - 11:30</span>
              </button>
              <button
                type="button"
                disabled={!selectedDayData?.eveningAvailable}
                onClick={() => { setSlot('EVENING'); setSlotTime(''); }}
                style={{
                  flex: 1, padding: '0.875rem', borderRadius: '0.5rem', cursor: !selectedDayData?.eveningAvailable ? 'not-allowed' : 'pointer',
                  border: `2px solid ${slot === 'EVENING' ? 'var(--primary-color)' : 'var(--border-color)'}`,
                  backgroundColor: !selectedDayData?.eveningAvailable ? '#f3f4f6' : slot === 'EVENING' ? '#eef2ff' : 'white',
                  color: !selectedDayData?.eveningAvailable ? '#9ca3af' : 'var(--text-main)',
                  fontWeight: slot === 'EVENING' ? 600 : 400,
                  transition: 'all 0.15s'
                }}
              >
                🌆 Evening <span style={{ fontWeight: 400, color: 'inherit', fontSize: '0.75rem', display: 'block' }}>14:00 - 16:00</span>
              </button>
            </div>
          </div>

          {/* Time */}
          {slot && (
            <div className="form-group" style={{ marginTop: '1.5rem' }}>
              <label>Select Time</label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {(slot === 'MORNING' ? ['10:00', '10:30', '11:00', '11:30'] : ['14:00', '14:30', '15:00', '15:30', '16:00']).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSlotTime(t)}
                    style={{
                      padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                      border: `2px solid ${slotTime === t ? 'var(--primary-color)' : 'var(--border-color)'}`,
                      backgroundColor: slotTime === t ? '#eef2ff' : 'white',
                      fontWeight: slotTime === t ? 600 : 400,
                      transition: 'all 0.15s'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Availability Checks & Alerts */}
          <div style={{ marginTop: '1.5rem' }}>
            {isCustomer && (lead?.paymentStatus === 'Partially Paid' || isNonStandard) && (
              <div className="alert alert-warning" style={{ marginTop: '1rem', fontSize: '0.8125rem' }}>
                ℹ️ Your booking will be reviewed and approved by our team before confirmation.
              </div>
            )}
          </div>

          <div style={{ marginTop: '2rem' }}>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
              disabled={!isFormValid || submitting}
            >
              {submitting ? 'Creating Booking...' : 'Confirm & Book Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
