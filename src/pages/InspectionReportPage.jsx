import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import InspectionReportView from '../components/reports/InspectionReportView';

export default function InspectionReportPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { role, canValidate } = useAuth();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(!location.state?.booking);
  const [b2cProperty, setB2cProperty] = useState(null);
  const [b2cLoading, setB2cLoading] = useState(true);
  const [b2cError, setB2cError] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isValidator = Boolean(
    canValidate || role === 'VALIDATOR' || role === 'ADMIN' || role === 'SUPER_ADMIN'
  );

  const loadBooking = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const endpoint = role === 'CUSTOMER' ? '/bookings/my' : '/bookings';
      const res = await client.get(endpoint);
      const list = Array.isArray(res.data) ? res.data : (res.data?.bookings || []);
      const found = list.find(
        (b) => String(b.id) === String(bookingId) || String(b.leadId) === String(bookingId)
      );
      if (found) {
        setBooking(found);
      } else {
        setError('Inspection report not found for this booking.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load inspection report.');
    } finally {
      setLoading(false);
    }
  }, [bookingId, role]);

  useEffect(() => {
    if (!booking) {
      loadBooking();
    }
  }, [booking, loadBooking]);

  useEffect(() => {
    let active = true;
    const fetchB2cReport = async () => {
      setB2cLoading(true);
      setB2cError('');
      try {
        const isLeadShape = Boolean(booking?.currentBookingId && !booking?.leadId);
        const endpoint = isLeadShape
          ? `/bookings/for-lead/${booking.id}/b2c-report`
          : `/bookings/${bookingId}/b2c-report`;
        const res = await client.get(endpoint);
        if (!active) return;
        if (res.data?.status && res.data?.data) {
          setB2cProperty(res.data.data);
        } else {
          setB2cError(res.data?.message || 'No B2C inspection data found for this booking.');
        }
      } catch (err) {
        if (!active) return;
        setB2cError(err.response?.data?.message || 'Unable to sync B2C inspection data.');
      } finally {
        if (active) setB2cLoading(false);
      }
    };

    fetchB2cReport();
    return () => {
      active = false;
    };
  }, [bookingId, booking?.id, booking?.leadId, booking?.currentBookingId]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else if (isValidator) {
      navigate('/validator');
    } else if (role === 'CUSTOMER') {
      navigate('/my-bookings');
    } else {
      navigate('/');
    }
  };

  const handleValidate = async (targetBookingId, remarks) => {
    try {
      const isLeadShape = Boolean(booking?.currentBookingId && !booking?.leadId);
      const leadId = isLeadShape ? booking.id : booking?.leadId;
      const actualBookingId = isLeadShape ? booking.currentBookingId : (targetBookingId || booking?.id);

      if (leadId) {
        await client.put(`/bookings/for-lead/${leadId}/mark-validation-done`, { remarks });
      } else {
        await client.post(`/bookings/${actualBookingId}/approve`, { remarks });
      }

      setBooking((prev) =>
        prev
          ? {
              ...prev,
              status: 'VALIDATION_DONE',
              currentBookingStatus: 'VALIDATION_DONE',
            }
          : prev
      );
      setSuccessMsg('Inspection report validated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Validation failed.');
      throw err;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '1.5rem' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={handleBack}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            ← Back
          </button>

          <div style={{ fontSize: '0.8125rem', color: '#64748b', fontWeight: 500 }}>
            Report Reference #{bookingId}
          </div>
        </div>

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#047857',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        {loading && !b2cProperty ? (
          <div
            className="card"
            style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#64748b',
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
            }}
          >
            Loading inspection report...
          </div>
        ) : (booking || b2cProperty) ? (
          <InspectionReportView
            booking={booking}
            b2cProperty={b2cProperty}
            b2cLoading={b2cLoading}
            b2cError={b2cError}
            isValidator={isValidator}
            onValidate={handleValidate}
          />
        ) : null}
      </div>
    </div>
  );
}
