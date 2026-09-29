import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../api/client';

export default function ConflictWidget({ city }) {
  const navigate = useNavigate();
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const url = city ? `/bookings/conflicts?city=${city}` : '/bookings/conflicts';
        const res = await client.get(url);
        setConflicts(res.data || []);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [city]);

  if (loading || conflicts.length === 0) return null;

  return (
    <div style={{
      backgroundColor: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '0.75rem',
      padding: '1.25rem 1.5rem',
      marginBottom: '2rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h3 style={{ color: '#991b1b', marginBottom: '0.25rem', fontSize: '1rem' }}>
            ⚠️ Action Required — Booking Conflicts
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#b91c1c', marginBottom: '0.75rem' }}>
            {conflicts.length} booking(s) have conflicts. Engineers went on leave after assignment.
          </p>
        </div>
        <button
          className="btn"
          style={{ backgroundColor: '#991b1b', color: 'white', flexShrink: 0 }}
          onClick={() => navigate('/bookings?status=CONFLICT')}
        >
          View Conflicts →
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {conflicts.slice(0, 5).map(b => (
          <div key={b.id} style={{
            backgroundColor: 'white',
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            border: '1px solid #fecaca',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
            fontSize: '0.8125rem',
          }}>
            <div>
              <strong>{b.customerName || `Lead #${b.leadId}`}</strong>
              <span style={{ color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
                {b.date} · {b.slot} · {b.slotTime}
              </span>
              {b.conflictReason && (
                <span style={{ color: '#991b1b', marginLeft: '0.5rem' }}>— {b.conflictReason}</span>
              )}
            </div>
            <button
              className="btn"
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.75rem', backgroundColor: '#fee2e2', color: '#991b1b' }}
              onClick={() => navigate('/bookings?status=CONFLICT')}
            >
              Assign Engineer
            </button>
          </div>
        ))}
        {conflicts.length > 5 && (
          <p style={{ fontSize: '0.8125rem', color: '#991b1b', textAlign: 'center' }}>
            +{conflicts.length - 5} more conflicts
          </p>
        )}
      </div>
    </div>
  );
}
