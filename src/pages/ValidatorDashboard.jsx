import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

// Status colour map for bookings shown in validator queue
const STATUS_COLORS = {
  COMPLETED:  { background: '#d1fae5', color: '#065f46' },
  APPROVED:   { background: '#dbeafe', color: '#1e40af' },
  REJECTED:   { background: '#fee2e2', color: '#991b1b' },
  DEFAULT:    { background: '#f3f4f6', color: '#374151' },
};

function StatusBadge({ status }) {
  const style = STATUS_COLORS[status] || STATUS_COLORS.DEFAULT;
  return (
    <span style={{
      ...style,
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 12,
      fontWeight: 600,
      display: 'inline-block',
    }}>
      {status}
    </span>
  );
}

export default function ValidatorDashboard() {
  const { logout, name } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // bookingId being actioned
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filter: show all completed bookings pending validator review
  const [filterStatus, setFilterStatus] = useState('COMPLETED');

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterStatus && filterStatus !== 'ALL') {
        params.status = filterStatus;
      }
      const res = await client.get('/bookings', { params });
      setBookings(res.data || []);
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

  const handleApprove = async (bookingId) => {
    if (!window.confirm('Approve this inspection report? It will be released to the customer.')) return;
    setActionLoading(bookingId);
    setError('');
    try {
      await client.post(`/bookings/${bookingId}/approve`);
      setSuccessMsg(`Booking #${bookingId} approved successfully.`);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to approve booking #${bookingId}.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (bookingId) => {
    const remarks = window.prompt('Enter rejection remarks (required):');
    if (!remarks || !remarks.trim()) {
      alert('Rejection remarks are required.');
      return;
    }
    setActionLoading(bookingId);
    setError('');
    try {
      await client.post(`/bookings/${bookingId}/reject`, null, {
        params: { remarks: remarks.trim() },
      });
      setSuccessMsg(`Booking #${bookingId} rejected with remarks.`);
      fetchBookings();
    } catch (err) {
      setError(err.response?.data?.error || `Failed to reject booking #${bookingId}.`);
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
        <span style={{ fontWeight: 700, fontSize: 18 }}>PropCheck · Validator</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14 }}>👤 {name}</span>
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

      <div style={{ maxWidth: 1100, margin: '32px auto', padding: '0 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Inspection Report Review</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>
          Review completed inspections and approve or reject them before releasing to customers.
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
            display: 'flex', justifyContent: 'space-between',
          }}>
            <span>{successMsg}</span>
            <button onClick={() => setSuccessMsg('')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>✕</button>
          </div>
        )}

        {/* ── Filter Bar ── */}
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
          padding: '16px 20px', marginBottom: 20,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <label style={{ fontWeight: 600, fontSize: 14, color: '#374151' }}>Filter by Status:</label>
          {['COMPLETED', 'APPROVED', 'REJECTED', 'ALL'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: '1.5px solid',
                borderColor: filterStatus === s ? '#1d4ed8' : '#d1d5db',
                background: filterStatus === s ? '#1d4ed8' : '#fff',
                color: filterStatus === s ? '#fff' : '#374151',
                fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}
            >
              {s}
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
            {loading ? 'Loading…' : '⟳ Refresh'}
          </button>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>Loading bookings…</div>
        ) : bookings.length === 0 ? (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
            padding: '48px 0', textAlign: 'center', color: '#6b7280',
          }}>
            No bookings found with status <strong>{filterStatus}</strong>.
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                  {['Booking ID', 'Lead / Property', 'Date', 'Time', 'Engineer', 'Type', 'Status', 'Actions'].map(h => (
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
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: '#1d4ed8' }}>#{bk.id}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 600 }}>{bk.leadName || bk.leadId}</div>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>{bk.propertyAddress || '—'}</div>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{bk.date || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{bk.time || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{bk.engineerName || '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13 }}>{bk.type || '—'}</td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge status={bk.status} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      {bk.status === 'COMPLETED' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleApprove(bk.id)}
                            disabled={actionLoading === bk.id}
                            style={{
                              padding: '5px 12px', borderRadius: 6, border: 'none',
                              background: '#10b981', color: '#fff',
                              fontWeight: 600, fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            {actionLoading === bk.id ? '…' : '✓ Approve'}
                          </button>
                          <button
                            onClick={() => handleReject(bk.id)}
                            disabled={actionLoading === bk.id}
                            style={{
                              padding: '5px 12px', borderRadius: 6, border: 'none',
                              background: '#ef4444', color: '#fff',
                              fontWeight: 600, fontSize: 12, cursor: 'pointer',
                            }}
                          >
                            {actionLoading === bk.id ? '…' : '✕ Reject'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: 12 }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
