import React from 'react';

export default function DateFilterControl({
  bookingFilter,
  datePreset,
  setDatePreset,
  customDate,
  setCustomDate,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
}) {
  const isUnbooked = bookingFilter === 'UNBOOKED';
  const labelText = isUnbooked ? 'Lead Added Date' : 'Inspection Date';

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
        <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
          {labelText}
        </label>
        <select
          value={datePreset}
          onChange={(e) => setDatePreset(e.target.value)}
          style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
        >
          <option value="ALL">All Dates</option>
          <option value="TODAY">Today</option>
          {isUnbooked ? (
            <option value="YESTERDAY">Yesterday</option>
          ) : (
            <option value="TOMORROW">Tomorrow</option>
          )}
          <option value="CUSTOM">Custom Date</option>
          <option value="RANGE">Date Range</option>
        </select>
      </div>

      {datePreset === 'CUSTOM' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
            Select Date
          </label>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            style={{ padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
          />
        </div>
      )}

      {datePreset === 'RANGE' && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              From Date
            </label>
            <input
              type="date"
              value={rangeStart}
              onChange={(e) => setRangeStart(e.target.value)}
              style={{ padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>
              To Date
            </label>
            <input
              type="date"
              value={rangeEnd}
              onChange={(e) => setRangeEnd(e.target.value)}
              style={{ padding: '0.55rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
            />
          </div>
        </>
      )}
    </>
  );
}
