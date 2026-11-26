import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import InspectionReportView from '../components/reports/InspectionReportView';

// Status colour map for bookings shown in validator queue
const STATUS_COLORS = {
  INSPECTION_DONE: { background: '#fef3c7', color: '#b45309', label: 'Inspection Done (Pending QC)' },
  COMPLETED:       { background: '#fef3c7', color: '#b45309', label: 'Inspection Done' },
  VALIDATION_DONE: { background: '#dcfce7', color: '#166534', label: 'Validation Done' },
  APPROVED:        { background: '#dcfce7', color: '#166534', label: 'Approved' },
  REPORT_SENT:     { background: '#f3e8ff', color: '#6b21a8', label: 'Report Sent' },
  REJECTED:        { background: '#fee2e2', color: '#991b1b', label: 'Rework Required' },
  DEFAULT:         { background: '#f3f4f6', color: '#374151', label: 'Pending' },
};

function StatusBadge({ status }) {
  const meta = STATUS_COLORS[status] || STATUS_COLORS.DEFAULT;
  return (
    <span style={{
      backgroundColor: meta.background,
      color: meta.color,
      padding: '4px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      display: 'inline-block',
      whiteSpace: 'nowrap'
    }}>
      {meta.label || status}
    </span>
  );
}

export default function ValidatorDashboard() {
  const { logout, name, role } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected booking for interactive inspection report modal
  const [selectedReportBooking, setSelectedReportBooking] = useState(null);

  // Filter: show inspections that are done and pending validator review by default
  const [filterStatus, setFilterStatus] = useState('INSPECTION_DONE');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterStatus && filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      const res = await client.get('/bookings', { params });
      let data = res.data || [];
      // If filtering for INSPECTION_DONE, also catch COMPLETED if backend uses that synonym
      if (filterStatus === 'INSPECTION_DONE') {
        data = data.filter(b => b.status === 'INSPECTION_DONE' || b.status === 'COMPLETED');
      }
      setBookings(data);
    } catch (err) {
      setError('Failed to load bookings. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Handle validator approval verdict
  const handleValidate = async (bookingId, remarks) => {
    setActionLoading(bookingId);
    setError('');
    try {
      const booking = bookings.find(b => String(b.id) === String(bookingId)) || selectedReportBooking;
      const leadId = booking?.leadId || bookingId;

      try {
        await client.put(`/bookings/for-lead/${leadId}/mark-validation-done`, { remarks });
      } catch (e) {
        // Fallback endpoint if backend routes by bookingId
        await client.post(`/bookings/${bookingId}/approve`, { remarks });
      }

      setSuccessMsg(`Booking #${bookingId} marked as Validation Done successfully. Ready for report dispatch.`);
      setSelectedReportBooking(null);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || `Failed to validate booking #${bookingId}.`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', padding: '0 0 40px 0' }}>
      {/* ── Top Nav ── */}
      <nav style={{
        background: '#1d4ed8', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', height: 56,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>PropCheck · Quality Validator Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {role && role !== 'VALIDATOR' && (
            <button
              onClick={() => navigate(role === 'ADMIN' ? '/admin' : role === 'CITY_HEAD' ? '/cityhead' : '/sales')}
              style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                color: '#fff', borderRadius: 6, padding: '6px 14px',
                cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >
              ← Back to Dashboard
            </button>
          )}
          <span style={{ fontSize: 14 }}>👤 {name || 'Validator'}</span>
          <button
            onClick={logout}
            style={{
              background: 'rgba(255,255,255,0.15)', border: 'none',
              color: '#fff', borderRadius: 6, padding: '6px 14px',
              cursor: 'pointer', fontSize: 13,
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1140, margin: '32px auto', padding: '0 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Inspection Quality Review Queue</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Inspect completed property reports, review snag evidence, and mark validation before report dispatch.
        </p>

        {/* ── Alerts ── */}
        {error && (
          <div style={{
            background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 8,
            padding: '12px 16px', marginBottom: 16, color: '#991b1b',
          }}>
            {error}
          </div>
        )}
        {successMsg && (
          <div style={{
            background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8,
            padding: '12px 16px', marginBottom: 16, color: '#065f46',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        }}>
          <label style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>Filter Status:</label>
          {[
            { value: 'INSPECTION_DONE', label: 'Pending Review (Inspection Done)' },
            { value: 'VALIDATION_DONE', label: 'Validation Done' },
            { value: 'REPORT_SENT', label: 'Report Sent to Customer' },
            { value: 'ALL', label: 'All Inspections' },
          ].map(s => (
            <button
              key={s.value}
              onClick={() => setFilterStatus(s.value)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
                borderColor: filterStatus === s.value ? '#1d4ed8' : '#d1d5db',
                background: filterStatus === s.value ? '#1d4ed8' : '#fff',
                color: filterStatus === s.value ? '#fff' : '#374151',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={fetchBookings}
            disabled={loading}
            style={{
              marginLeft: 'auto', padding: '6px 16px', borderRadius: 6,
              background: '#f3f4f6', border: '1px solid #d1d5db',
              cursor: 'pointer', fontWeight: 600, fontSize: 13,
            }}
          >
            {loading ? 'Loading…' : '⟳ Refresh Queue'}
          </button>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>Loading queue…</div>
        ) : bookings.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            padding: '48px 0', textAlign: 'center', color: '#6b7280',
          }}>
            No inspections found with status <strong>{filterStatus}</strong>.
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Booking / Lead', 'Customer & Property', 'City', 'Inspection Date', 'Engineer', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '12px 14px', textAlign: 'left',
                      fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bookings.map((bk, idx) => (
                  <tr
                    key={bk.id}
                    style={{ borderBottom: '1px solid #e5e7eb', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}
                  >
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1d4ed8' }}>
                      #{bk.id}
                      <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>Lead #{bk.leadId}</div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{bk.customerName || bk.ownerName || `Lead #${bk.leadId}`}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{bk.flatNo || bk.propertyAddress || bk.inspectionType || 'Property Inspection'}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{bk.city || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{bk.date || '—'} ({bk.slotTime || bk.slot || '—'})</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#0f172a', fontWeight: 500 }}>
                      👷 {bk.engineerName || 'Assigned Engineer'}
                    </td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge status={bk.status} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => setSelectedReportBooking(bk)}
                          style={{
                            padding: '6px 14px', borderRadius: 6, border: '1px solid #2563eb',
                            background: '#eff6ff', color: '#1d4ed8',
                            fontWeight: 600, fontSize: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4
                          }}
                        >
                          🔍 Review Report & Snags
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Interactive Inspection Report Modal ── */}
      {selectedReportBooking && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.75)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1.5rem',
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{ width: '100%', maxWidth: '1100px', maxHeight: '92vh', overflowY: 'auto', borderRadius: '0.75rem' }}>
            <InspectionReportView
              booking={selectedReportBooking}
              isValidator={true}
              onClose={() => setSelectedReportBooking(null)}
              onValidate={handleValidate}
            />
          </div>
        </div>
      )}

    </div>
  );
}
