import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { STATUS_CONFIG } from '../components/bookings/BookingStatusBadge';

// Basic formatter
const fmtCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

// CSS Donut Chart Component
const DonutChart = ({ data, size = 160 }) => {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return <div style={{ width: size, height: size, borderRadius: '50%', background: '#e5e7eb', margin: '0 auto' }} />;
  }

  let currentAngle = 0;
  const gradient = Object.entries(data).map(([status, count]) => {
    const color = STATUS_CONFIG[status]?.color || '#9ca3af'; // fallback color
    const percentage = (count / total) * 100;
    const str = `${color} ${currentAngle}% ${currentAngle + percentage}%`;
    currentAngle += percentage;
    return str;
  }).join(', ');

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `conic-gradient(${gradient})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto'
    }}>
      <div style={{ width: size * 0.65, height: size * 0.65, borderRadius: '50%', background: 'white' }} />
    </div>
  );
};

export default function AnalyticsDashboard() {
  const { role, city: userCity, id: currentUserId, name } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [summary, setSummary] = useState(null);
  const [cityBreakdown, setCityBreakdown] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [engineers, setEngineers] = useState([]);
  const [inspectionTypes, setInspectionTypes] = useState(null);
  const [bookingsRange, setBookingsRange] = useState({});
  
  // Filters
  const [engCityFilter, setEngCityFilter] = useState(role === 'CITY_HEAD' ? userCity : 'All');
  
  // Date Range Defaults (Current week Monday - Sunday)
  const getMonToSun = () => {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setHours(-24 * (day - 1));
    const mon = d.toISOString().split('T')[0];
    d.setHours(24 * 6);
    const sun = d.toISOString().split('T')[0];
    return { mon, sun };
  };
  const [dateFrom, setDateFrom] = useState(getMonToSun().mon);
  const [dateTo, setDateTo] = useState(getMonToSun().sun);

  // Side Panel state
  const [sidePanelDate, setSidePanelDate] = useState(null);
  const [sidePanelBookings, setSidePanelBookings] = useState(null);

  // Fetch side panel bookings when date is clicked
  useEffect(() => {
    if (!sidePanelDate) {
      setSidePanelBookings(null);
      return;
    }
    const fetchSidePanel = async () => {
      try {
        const cityQuery = (role === 'CITY_HEAD' && userCity) ? `&city=${encodeURIComponent(userCity)}` : '';
        const res = await client.get(`/admin/bookings-by-date?date=${sidePanelDate}${cityQuery}`);
        setSidePanelBookings(res.data);
      } catch (err) {
        setSidePanelBookings([]);
      }
    };
    fetchSidePanel();
  }, [sidePanelDate, role, userCity]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Build API query strings
      const cityQuery = (role === 'CITY_HEAD' && userCity) ? `?city=${encodeURIComponent(userCity)}` : '';
      const engQuery = engCityFilter !== 'All' ? `?city=${encodeURIComponent(engCityFilter)}` : '';
      const rangeQuery = `?from=${dateFrom}&to=${dateTo}${role === 'CITY_HEAD' && userCity ? `&city=${encodeURIComponent(userCity)}` : ''}`;

      const promises = [];

      // A. Summary (ADMIN, SALES, CITY_HEAD)
      promises.push(client.get(`/admin/summary${cityQuery}`).then(res => setSummary(res.data)));
      
      // E. Payment Summary (ADMIN, SALES)
      if (['ADMIN', 'SALES'].includes(role)) {
        promises.push(client.get(`/admin/payment-summary`).then(res => setPaymentSummary(res.data)));
      }

      // D, F, H. City Breakdown, Engineers, Date Range (ADMIN, CITY_HEAD)
      if (['ADMIN', 'CITY_HEAD'].includes(role)) {
        promises.push(client.get(`/admin/city-breakdown${cityQuery}`).then(res => setCityBreakdown(res.data)));
        promises.push(client.get(`/admin/engineer-utilisation${engQuery}`).then(res => setEngineers(res.data)));
        promises.push(client.get(`/admin/bookings-range${rangeQuery}`).then(res => setBookingsRange(res.data)));
      }

      // G. Inspection Types (ADMIN ONLY)
      if (role === 'ADMIN') {
        promises.push(client.get(`/admin/inspection-type-breakdown`).then(res => setInspectionTypes(res.data)));
      }

      await Promise.allSettled(promises);
    } catch (err) {
      setError('Failed to load some analytics data.');
    } finally {
      setLoading(false);
    }
  }, [role, userCity, engCityFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const MetricCard = ({ title, value, subtext, color = 'var(--text-main)' }) => (
    <div className="card" style={{ padding: '1.25rem', marginBottom: 0, borderTop: `4px solid ${color}` }}>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '0.5rem', fontWeight: 500 }}>{title}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: subtext ? '0.25rem' : 0 }}>
        {value}
      </div>
      {subtext && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{subtext}</div>}
    </div>
  );

  if (loading && !summary) {
    return <div className="app-container"><div className="center-container">Loading analytics...</div></div>;
  }

  return (
    <div className="app-container">
      <div className="dashboard-container" style={{ maxWidth: '1400px' }}>
        <header className="dashboard-header">
          <div>
            <h1 style={{ marginBottom: 0 }}>Analytics Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Data overview and metrics</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Back</button>
        </header>

        {error && <div className="alert alert-error">{error}</div>}

        {/* =======================================================
            SECTION A: Summary Cards (Top Row)
        ======================================================= */}
        {summary && (
          <div style={{ marginBottom: '2rem' }}>
            {summary.openConflicts > 0 && (
              <div className="alert alert-error" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span style={{ fontWeight: 600 }}>⚠️ {summary.openConflicts} booking(s) have conflicts requiring attention</span>
                <button className="btn" style={{ backgroundColor: '#991b1b', color: 'white', padding: '0.25rem 0.75rem', fontSize: '0.75rem' }} onClick={() => navigate('/bookings?status=CONFLICT')}>
                  View Conflicts
                </button>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <MetricCard title="Total Leads" value={summary.totalLeads || 0} color="#3b82f6" />
              <MetricCard title="Total Bookings" value={summary.totalBookings || 0} color="#8b5cf6" />
              <MetricCard title="Upcoming (Today+)" value={summary.upcomingBookings || 0} color="#10b981" />
              <MetricCard title="Open Conflicts ⚠️" value={summary.openConflicts || 0} color="#ef4444" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <MetricCard title="Pending Approval" value={summary.pendingApproval || 0} color="#f59e0b" />
              <MetricCard title="Pending Eng. Assg." value={summary.pendingEngineerAssignment || 0} color="#3b82f6" />
              <MetricCard title="Active Engineers" value={summary.totalActiveEngineers || 0} color="#6366f1" />
            </div>
          </div>
        )}

        <div className="dashboard-grid">
          {/* =======================================================
              SECTION B & C: Booking Status Chart & Type Bar
          ======================================================= */}
          {(role === 'ADMIN' || role === 'SALES') && summary && (
            <div className="card">
              <h2 style={{ fontSize: '1.125rem' }}>Booking Distribution</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginTop: '1.5rem', alignItems: 'center' }}>
                <div style={{ flex: '1 1 200px' }}>
                  <DonutChart data={summary.bookingsByStatus || {}} size={180} />
                </div>
                <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {Object.entries(summary.bookingsByStatus || {}).map(([k, v]) => {
                    const c = STATUS_CONFIG[k];
                    return (
                      <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: c?.color || '#9ca3af' }}></span>
                          {c?.label || k}
                        </span>
                        <span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9375rem', color: 'var(--text-muted)' }}>Booking Types</h3>
                <div style={{ display: 'flex', height: '24px', borderRadius: '0.25rem', overflow: 'hidden', marginTop: '0.75rem' }}>
                  {Object.entries(summary.bookingsByType || {}).map(([type, count]) => {
                    const pct = (count / summary.totalBookings) * 100;
                    const bg = type === 'INSPECTION' ? '#166534' : '#6b21a8';
                    return count > 0 ? (
                      <div key={type} style={{ width: `${pct}%`, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 600 }} title={`${type}: ${count}`}>
                        {pct > 15 ? count : ''}
                      </div>
                    ) : null;
                  })}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#166534' }} /> Inspection ({summary.bookingsByType?.INSPECTION || 0})</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><span style={{ width: '10px', height: '10px', backgroundColor: '#6b21a8' }} /> Re-Inspection ({summary.bookingsByType?.REINSPECTION || 0})</div>
                </div>
              </div>
            </div>
          )}

          {/* =======================================================
              SECTION E: Payment Summary
          ======================================================= */}
          {(role === 'ADMIN' || role === 'SALES') && paymentSummary && (
            <div className="card">
              <h2 style={{ fontSize: '1.125rem' }}>Financial Overview</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Revenue</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{fmtCurrency(paymentSummary.totalRevenue)}</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#ecfdf5', borderRadius: '0.5rem', border: '1px solid #a7f3d0' }}>
                  <div style={{ fontSize: '0.75rem', color: '#047857' }}>Amount Received</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#047857' }}>{fmtCurrency(paymentSummary.totalReceived)}</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '0.5rem', border: '1px solid #fecaca' }}>
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c' }}>Pending Amount</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#b91c1c' }}>{fmtCurrency(paymentSummary.totalPending)}</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: '#f5f3ff', borderRadius: '0.5rem', border: '1px solid #ddd6fe' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6d28d9' }}>Total Refunded</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#6d28d9' }}>{fmtCurrency(paymentSummary.totalRefunded)}</div>
                </div>
              </div>
              <h3 style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Payment Status Distribution</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8125rem' }}>
                {Object.entries(paymentSummary.byPaymentStatus || {}).map(([status, count]) => (
                  <div key={status} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: '#f9fafb', borderRadius: '0.25rem' }}>
                    <span>{status}</span>
                    <strong style={{ color: 'var(--text-main)' }}>{count}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* =======================================================
            SECTION D: City-wise Breakdown Table
        ======================================================= */}
        {(role === 'ADMIN' || role === 'CITY_HEAD') && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '2rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ marginBottom: 0, fontSize: '1.125rem' }}>City-wise Breakdown</h2>
            </div>
            <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>City</th>
                    <th>Engineers</th>
                    <th>Confirmed</th>
                    <th>Pending Assign</th>
                    <th>Pending Appr</th>
                    <th>Conflicts</th>
                    <th>Cancelled</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cityBreakdown.map(c => (
                    <tr key={c.city} style={{ backgroundColor: c.conflicts > 0 ? '#fef2f2' : 'transparent' }}>
                      <td style={{ fontWeight: 600 }}>{c.city}</td>
                      <td>{c.engineers}</td>
                      <td style={{ color: '#047857', fontWeight: c.confirmed > 0 ? 600 : 400 }}>{c.confirmed}</td>
                      <td style={{ color: '#1d4ed8' }}>{c.pendingAssignment}</td>
                      <td style={{ color: '#c2410c' }}>{c.pendingApproval}</td>
                      <td style={{ color: '#b91c1c', fontWeight: c.conflicts > 0 ? 700 : 400 }}>{c.conflicts}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{c.cancelled}</td>
                      <td style={{ fontWeight: 600 }}>{c.total}</td>
                    </tr>
                  ))}
                  {cityBreakdown.length === 0 && (
                    <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>No data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="dashboard-grid">
          {/* =======================================================
              SECTION F: Engineer Utilisation
          ======================================================= */}
          {(role === 'ADMIN' || role === 'CITY_HEAD') && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <h2 style={{ marginBottom: 0, fontSize: '1.125rem' }}>Engineer Utilisation</h2>
                {role === 'ADMIN' && (
                  <select value={engCityFilter} onChange={e => setEngCityFilter(e.target.value)} className="select-input" style={{ width: '140px', padding: '0.4rem 2rem 0.4rem 0.75rem' }}>
                    <option value="All">All Cities</option>
                    {cityBreakdown.map(c => <option key={c.city} value={c.city}>{c.city}</option>)}
                  </select>
                )}
              </div>
              <div className="table-container" style={{ border: 'none', borderRadius: 0, maxHeight: '400px', overflowY: 'auto' }}>
                <table>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                    <tr>
                      <th>Engineer</th>
                      <th>Title & City</th>
                      <th>Upcoming</th>
                    </tr>
                  </thead>
                  <tbody>
                    {engineers.map(e => (
                      <tr key={e.employeeNumber}>
                        <td style={{ fontWeight: 500 }}>{e.name}</td>
                        <td>
                          <div style={{ fontSize: '0.8125rem' }}>{e.jobTitle}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{e.city}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{e.upcomingConfirmedBookings}</td>
                      </tr>
                    ))}
                    {engineers.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center' }}>No engineers found</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =======================================================
              SECTION G: Inspection Type Breakdown
          ======================================================= */}
          {role === 'ADMIN' && inspectionTypes && (
            <div className="card">
              <h2 style={{ fontSize: '1.125rem' }}>Inspection Types</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
                {Object.entries(inspectionTypes).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                  const max = Math.max(...Object.values(inspectionTypes));
                  const pct = max > 0 ? (count / max) * 100 : 0;
                  return (
                    <div key={type}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                        <span>{type}</span>
                        <span style={{ fontWeight: 600 }}>{count}</span>
                      </div>
                      <div style={{ height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', backgroundColor: 'var(--primary-color)', borderRadius: '4px' }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* =======================================================
            SECTION H: Date Range Bookings (Weekly Grid)
        ======================================================= */}
        {(role === 'ADMIN' || role === 'CITY_HEAD') && (
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginTop: '2rem' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ marginBottom: 0, fontSize: '1.125rem' }}>Daily Booking Matrix</h2>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }} />
                <span>to</span>
                <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding: '0.4rem', borderRadius: '0.375rem', border: '1px solid var(--border-color)' }} />
              </div>
            </div>
            
            {/* Simple Matrix Rendering */}
            <div style={{ padding: '1.5rem', overflowX: 'auto' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '600px' }}>
                {Object.keys(bookingsRange).length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No bookings in this range</div>
                ) : (
                  Object.entries(bookingsRange).sort((a,b) => a[0].localeCompare(b[0])).map(([date, cityData]) => (
                    <div key={date} style={{ display: 'flex', border: '1px solid var(--border-color)', borderRadius: '0.5rem', overflow: 'hidden' }}>
                      <div style={{ backgroundColor: '#f9fafb', padding: '1rem', width: '120px', flexShrink: 0, borderRight: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                        {date}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', padding: '1rem', flex: 1 }}>
                        {Object.entries(cityData).map(([city, counts]) => {
                          const hasConflicts = counts.CONFLICT > 0;
                          const hasPending = counts.PENDING_ENGINEER_ASSIGNMENT > 0;
                          let bg = '#ecfdf5'; let col = '#047857'; let bdr = '#a7f3d0';
                          if (hasConflicts) { bg = '#fef2f2'; col = '#991b1b'; bdr = '#fecaca'; }
                          else if (hasPending) { bg = '#fffbeb'; col = '#92400e'; bdr = '#fcd34d'; }
                          
                          return (
                            <div key={city} onClick={() => setSidePanelDate(date)} style={{ cursor: 'pointer', backgroundColor: bg, border: `1px solid ${bdr}`, color: col, padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem' }}>
                              <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>{city}</div>
                              <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <span>Total: {Object.values(counts).reduce((a,b)=>a+b,0)}</span>
                                {hasConflicts && <strong>⚠️ {counts.CONFLICT}</strong>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Date Side Panel Modal */}
      {sidePanelDate && (
        <div className="modal-overlay" onClick={() => setSidePanelDate(null)} style={{ justifyContent: 'flex-end', padding: 0 }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '400px', maxWidth: '100%', height: '100vh', borderRadius: 0, maxHeight: '100vh', animation: 'slideIn 0.2s ease', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-header">
              <h2 style={{ marginBottom: 0 }}>Bookings for {sidePanelDate}</h2>
              <button className="modal-close" onClick={() => setSidePanelDate(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '1rem', overflowY: 'auto' }}>
              {!sidePanelBookings ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
              ) : sidePanelBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No bookings found on this date.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sidePanelBookings.map(b => (
                    <div key={b.id} style={{ border: '1px solid var(--border-color)', padding: '1rem', borderRadius: '0.5rem', backgroundColor: '#f9fafb' }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>{b.customerName || `Lead #${b.leadId}`}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                        {b.city} · {b.slot} ({b.slotTime})
                      </div>
                      <div style={{ fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
                        <strong>Engineer:</strong> {b.engineerName || b.engineerEmployeeNumber || 'Not Assigned'}
                      </div>
                      <div style={{ fontSize: '0.75rem' }}>
                        <strong>Status:</strong> {b.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
