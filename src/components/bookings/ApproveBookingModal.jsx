import React, { useState } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const NON_STANDARD_CITIES = ['Chennai', 'Others'];

export default function ApproveBookingModal({ booking, onClose, onSuccess }) {
  const { id: currentUserId } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const isNonStandard = NON_STANDARD_CITIES.includes(booking?.city);

  const handleApprove = async () => {
    setLoading(true);
    try {
      await client.put(`/bookings/${booking.id}/approve?salesUserId=${currentUserId}`);
      showToast('Booking approved ✅', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to approve booking', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2 style={{ marginBottom: 0 }}>Approve Booking</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="booking-summary-mini">
            <div><span className="field-label">Customer</span><strong>{booking.customerName || '—'}</strong></div>
            <div><span className="field-label">City</span>{booking.city}</div>
            <div><span className="field-label">Date</span>{booking.date}</div>
            <div><span className="field-label">Slot</span>{booking.slot} — {booking.slotTime}</div>
          </div>

          {isNonStandard && (
            <div className="alert alert-warning" style={{ marginTop: '1rem' }}>
              <strong>⚠️ Non-Standard City</strong>
              <p style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}>
                This customer is from <strong>{booking.city}</strong>. Before approving, please verify:
              </p>
              <ol style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', fontSize: '0.8125rem', lineHeight: 1.8 }}>
                <li>Which engineer will travel to this location?</li>
                <li>Will the engineer need to travel the day before?</li>
                <li>Is the engineer available on the previous day as well?</li>
              </ol>
            </div>
          )}

          <p style={{ marginTop: '1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Are you sure you want to approve this booking? It will be moved to <strong>Pending Engineer Assignment</strong>.
          </p>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-success" onClick={handleApprove} disabled={loading}>
            {loading ? 'Approving...' : 'Approve Booking ✅'}
          </button>
        </div>
      </div>
    </div>
  );
}
