import React from 'react';

export const STATUS_CONFIG = {
  PENDING_APPROVAL: { label: 'Pending Approval', bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' },
  PENDING_ENGINEER_ASSIGNMENT: { label: 'Pending Assignment', bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  CONFIRMED: { label: 'Confirmed', bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
  CONFLICT: { label: '⚠️ Conflict', bg: '#fef2f2', color: '#991b1b', border: '#fecaca' },
  CANCELLED: { label: 'Cancelled', bg: '#f3f4f6', color: '#374151', border: '#e5e7eb' },
};

export const SLOT_CONFIG = {
  MORNING: { label: '🌅 Morning', bg: '#fef9c3', color: '#854d0e' },
  EVENING: { label: '🌆 Evening', bg: '#e0e7ff', color: '#3730a3' },
};

export const TYPE_CONFIG = {
  INSPECTION: { label: 'Inspection', bg: '#f0fdf4', color: '#166534' },
  REINSPECTION: { label: 'Re-Inspection', bg: '#faf5ff', color: '#6b21a8' },
};

const Badge = ({ label, bg, color, border }) => (
  <span style={{
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: bg,
    color,
    border: `1px solid ${border || 'transparent'}`,
    whiteSpace: 'nowrap',
    display: 'inline-block',
  }}>
    {label}
  </span>
);

export const BookingStatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status];
  if (!config) return <span style={{ color: '#6b7280' }}>{status || '—'}</span>;
  return <Badge {...config} />;
};

export const SlotBadge = ({ slot }) => {
  const config = SLOT_CONFIG[slot];
  if (!config) return <span>{slot || '—'}</span>;
  return <Badge label={config.label} bg={config.bg} color={config.color} />;
};

export const BookingTypeBadge = ({ type }) => {
  const config = TYPE_CONFIG[type];
  if (!config) return <span>{type || '—'}</span>;
  return <Badge label={config.label} bg={config.bg} color={config.color} />;
};
