import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

const STANDARD_CITIES = ['Bangalore', 'Hyderabad', 'Delhi NCR', 'Mumbai', 'Pune'];
const MORNING_TIMES = ['10:00', '10:30', '11:00', '11:30'];
const EVENING_TIMES = ['14:00', '14:30', '15:00', '15:30', '16:00'];
const REINSPECTION_ELIGIBLE_TYPES = [
  'Inspection+Re-Inspection',
  'Inspection+Re-Inspection+Interior',
];

export default function CreateBookingPage() {
  const { id: currentUserId, role, email: userEmail } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const isCustomer = role === 'CUSTOMER';
  const today = new Date().toISOString().split('T')[0];

  // Form State
  const [leads, setLeads] = useState([]);
  const [leadSearch, setLeadSearch] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [bookingType, setBookingType] = useState('INSPECTION');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [slotTime, setSlotTime] = useState('');

  // Status State
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [availability, setAvailability] = useState(null);
  const [checkingAvail, setCheckingAvail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Derived Values
  const city = selectedLead?.city || '';
  const isNonStandard = city && !STANDARD_CITIES.includes(city);
  const canOfferReinspection = REINSPECTION_ELIGIBLE_TYPES.includes(selectedLead?.inspectionType);

  // 1. Load Leads or Current Customer Profile
  useEffect(() => {
    const fetchLeadData = async () => {
      setLoadingLeads(true);
      try {
        if (isCustomer) {
          const res = await client.get(`/leads/me?email=${encodeURIComponent(userEmail)}`);
          setSelectedLead(Array.isArray(res.data) ? res.data[0] : res.data);
        } else {
          const res = await client.get('/leads');
          setLeads(res.data || []);
        }
      } catch (err) {
        showToast('Failed to load lead data.', 'error');
      } finally {
        setLoadingLeads(false);
      }
    };
    fetchLeadData();
  }, [isCustomer, userEmail, showToast]);

  // 2. Filter Leads (Staff only)
  const filteredLeads = useMemo(() => {
    if (!leadSearch) return leads.slice(0, 15);
    const q = leadSearch.toLowerCase();
    return leads.filter(l =>
      l.customerName?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.email?.toLowerCase().includes(q)
    ).slice(0, 15);
  }, [leads, leadSearch]);

  // 3. Live Availability Calendar Check
  const [calendarData, setCalendarData] = useState([]);
  const [loadingCalendar, setLoadingCalendar] = useState(false);
  const [showAllDates, setShowAllDates] = useState(false);

  useEffect(() => {
    if (!city || !bookingType) {
      setCalendarData([]);
      return;
    }
    const fetchCal = async () => {
      setLoadingCalendar(true);
      try {
        if (isNonStandard) {
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
          const res = await client.get(`/bookings/availability-calendar?city=${encodeURIComponent(city)}&bookingType=${bookingType}&startDate=${start}&days=21`);
          setCalendarData(res.data || []);
        }
      } catch {
        setCalendarData([]);
      } finally {
        setLoadingCalendar(false);
      }
    };
    fetchCal();
  }, [city, bookingType, isNonStandard]);

  // Handle auto-resetting booking type if selected lead can't re-inspect
  useEffect(() => {
    if (selectedLead && bookingType === 'REINSPECTION' && !canOfferReinspection) {
      setBookingType('INSPECTION');
    }
  }, [selectedLead, canOfferReinspection, bookingType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLead || !date || !slot || !slotTime) return;
    
    setSubmitting(true);
    try {
      await client.post('/bookings', {
        leadId: selectedLead.id,
        bookingType,
        city,
        date,
        slot,
        slotTime,
        createdByUserId: currentUserId,
      });
      showToast('Booking created successfully ✅', 'success');
      navigate(-1);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create booking', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = selectedLead && date && slot && slotTime;

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
    <div className="app-container">
      <div className="dashboard-container" style={{ maxWidth: '1000px' }}>
        <header className="dashboard-header" style={{ marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ marginBottom: 0 }}>Book New Inspection</h1>
            <p style={{ color: 'var(--text-muted)' }}>Complete all fields below to schedule</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate(-1)} disabled={submitting}>
            Cancel
          </button>
        </header>

        <form onSubmit={handleSubmit} className="dashboard-grid" style={{ alignItems: 'flex-start' }}>
          
          {/* LEFT COLUMN: Customer Selection (Hidden for Customers) */}
          {!isCustomer && (
            <div className="card" style={{ padding: '1.5rem' }}>
              <h2 style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>1. Select Customer</h2>
              
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Search name, phone, or email..."
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                  style={{ marginBottom: '0.5rem' }}
                />
              </div>

              {loadingLeads ? (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.5rem' }}>
                  {filteredLeads.map(lead => (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      style={{
                        padding: '0.875rem 1rem',
                        border: `2px solid ${selectedLead?.id === lead.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        backgroundColor: selectedLead?.id === lead.id ? '#eef2ff' : 'white',
                        transition: 'all 0.1s',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{lead.customerName}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {lead.city} · {lead.phone}
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: '#047857', fontWeight: 500 }}>
                        {lead.paymentStatus} · {lead.inspectionType}
                      </div>
                    </div>
                  ))}
                  {filteredLeads.length === 0 && (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No customers found.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* RIGHT COLUMN: Booking Details */}
          <div className="card" style={{ padding: '1.5rem', opacity: (!selectedLead && !isCustomer) ? 0.5 : 1, pointerEvents: (!selectedLead && !isCustomer) ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
            <h2 style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>
              {isCustomer ? '1.' : '2.'} Booking Details
            </h2>

            {/* Display Selected Customer Info */}
            {selectedLead && (
              <div style={{ backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.25rem' }}>Selected Customer</div>
                <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>{selectedLead.customerName}</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{selectedLead.city} · {selectedLead.inspectionType}</div>
              </div>
            )}

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
                    fontWeight: slot === 'MORNING' ? 600 : 400
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
                    fontWeight: slot === 'EVENING' ? 600 : 400
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
                  {(slot === 'MORNING' ? MORNING_TIMES : EVENING_TIMES).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSlotTime(t)}
                      style={{
                        padding: '0.625rem 1rem', borderRadius: '0.5rem', cursor: 'pointer',
                        border: `2px solid ${slotTime === t ? 'var(--primary-color)' : 'var(--border-color)'}`,
                        backgroundColor: slotTime === t ? '#eef2ff' : 'white',
                        fontWeight: slotTime === t ? 600 : 400,
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
              {isCustomer && (selectedLead?.paymentStatus === 'Partially Paid' || isNonStandard) && (
                <div className="alert alert-warning" style={{ marginTop: '1rem', fontSize: '0.8125rem' }}>
                  ℹ️ Your booking will be reviewed and approved by our team before confirmation.
                </div>
              )}
            </div>

            {/* Submit */}
            <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
                disabled={!isFormValid || submitting}
              >
                {submitting ? 'Creating Booking...' : 'Confirm & Book Inspection'}
              </button>
            </div>

          </div>
        </form>
      </div>
    </div>
  );
}
