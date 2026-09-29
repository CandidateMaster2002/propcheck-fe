import React, { useState, useEffect } from 'react';
import client from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function AssignEngineerModal({ booking, onClose, onSuccess }) {
  const { id: currentUserId } = useAuth();
  const { showToast } = useToast();

  const [engineers, setEngineers] = useState([]);
  const [selectedEngineer, setSelectedEngineer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [fetchError, setFetchError] = useState('');

  useEffect(() => {
    const fetchEngineers = async () => {
      if (!booking) return;
      setLoading(true);
      setFetchError('');
      try {
        const leadIdToUse = booking.leadId || booking.id;
        const res = await client.get(`/bookings/for-lead/${leadIdToUse}/available-engineers`);
        setEngineers(res.data);
      } catch (err) {
        setFetchError('Failed to load available engineers.');
      } finally {
        setLoading(false);
      }
    };
    fetchEngineers();
  }, [booking]);

  const handleAssign = async () => {
    if (!selectedEngineer) return;
    setAssigning(true);
    try {
      await client.put(`/bookings/${booking.id}/assign-engineer`, {
        engineerEmployeeNumber: selectedEngineer.employeeNumber,
        cityHeadUserId: currentUserId,
      });
      showToast('Engineer assigned ✅', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to assign engineer', 'error');
    } finally {
      setAssigning(false);
    }
  };

  if (!booking) return null;

  const isConflict = booking.status === 'CONFLICT';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <h2 style={{ marginBottom: 0 }}>Assign Engineer</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Booking summary */}
          <div className="booking-summary-mini">
            <div><span className="field-label">Customer</span><strong>{booking.customerName || '—'}</strong></div>
            <div><span className="field-label">City</span>{booking.city}</div>
            <div><span className="field-label">Date</span>{booking.date}</div>
            <div><span className="field-label">Slot</span>{booking.slot} — {booking.slotTime}</div>
          </div>

          {isConflict && (
            <div className="alert alert-error" style={{ marginTop: '1rem', fontSize: '0.8125rem' }}>
              ⚠️ The previously assigned engineer has a leave on this date. Please assign a different engineer or contact the customer to reschedule.
              {booking.conflictReason && (
                <div style={{ marginTop: '0.25rem' }}><strong>Reason:</strong> {booking.conflictReason}</div>
              )}
            </div>
          )}

          <h3 style={{ marginTop: '1.25rem', marginBottom: '0.75rem', fontSize: '0.9375rem' }}>Available Engineers</h3>

          {loading ? (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Loading engineers...</p>
          ) : fetchError ? (
            <div className="alert alert-error">{fetchError}</div>
          ) : engineers.length === 0 ? (
            <div className="alert alert-warning">
              No engineers available for this slot.
              {isConflict && ' Please contact the customer to reschedule.'}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
              {engineers.map(eng => (
                <div
                  key={eng.employeeNumber}
                  onClick={() => setSelectedEngineer(eng)}
                  style={{
                    padding: '0.875rem 1rem',
                    border: `2px solid ${selectedEngineer?.employeeNumber === eng.employeeNumber ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    backgroundColor: selectedEngineer?.employeeNumber === eng.employeeNumber ? '#eef2ff' : 'white',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontWeight: 600 }}>{eng.name}</div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    {eng.jobTitle} · {eng.mappedCity || eng.kekaCity}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose} disabled={assigning}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={handleAssign}
            disabled={!selectedEngineer || assigning || loading}
          >
            {assigning ? 'Assigning...' : 'Confirm Assignment'}
          </button>
        </div>
      </div>
    </div>
  );
}
