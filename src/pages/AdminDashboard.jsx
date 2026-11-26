import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import EditUserModal from '../components/EditUserModal';
import LeadsTable from '../components/LeadsTable';
import ConflictWidget from '../components/bookings/ConflictWidget';
import CreateBookingModal from '../components/bookings/CreateBookingModal';
import AssignEngineerModal from '../components/bookings/AssignEngineerModal';
import RescheduleBookingModal from '../components/bookings/RescheduleBookingModal';
import DateFilterControl from '../components/DateFilterControl';
import { filterLeadsByDate, getDefaultDatePresetForStatus, getTodayYmd } from '../utils/leadDateFilter';

function AddUserModal({ isSuperAdmin, onClose, onSuccess }) {
  const [userType, setUserType] = useState('SALES');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [canValidate, setCanValidate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (userType === 'ADMIN') {
        await client.post('/users/admin', { name, email, password, canValidate: true });
      } else if (userType === 'CITY_HEAD') {
        await client.post('/users/cityhead', { name, email, password, city, canValidate });
      } else {
        await client.post('/users/sales', { name, email, password, canValidate });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create user.');
    } finally {
      setLoading(false);
    }
  };

  const userTypeOptions = [
    { value: 'SALES', title: 'Sales Person', desc: 'Leads & bookings', icon: '💼' },
    { value: 'CITY_HEAD', title: 'City Lead', desc: 'City ops & team', icon: '🏙️' },
    ...(isSuperAdmin ? [{ value: 'ADMIN', title: 'Admin', desc: 'All ops access', icon: '🛡️' }] : []),
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '500px',
          margin: 0,
          position: 'relative',
          borderRadius: '1rem',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Add New User</h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Choose a role and enter account details
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              fontSize: '1.1rem',
              cursor: 'pointer',
              color: '#475569',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              User Type
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${userTypeOptions.length}, 1fr)`, gap: '0.6rem' }}>
              {userTypeOptions.map((opt) => {
                const active = userType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setUserType(opt.value)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      gap: '0.2rem',
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.8rem',
                      borderRadius: '0.65rem',
                      border: `2px solid ${active ? 'var(--primary-color)' : '#e2e8f0'}`,
                      background: active ? '#eef2ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ fontSize: '1.2rem', lineHeight: 1 }}>{opt.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a', marginTop: '0.2rem' }}>{opt.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="add-user-name">Full Name</label>
            <input
              id="add-user-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={userType === 'CITY_HEAD' ? 'e.g. Rajesh Kumar' : 'e.g. Priya Sharma'}
            />
          </div>

          <div className="form-group">
            <label htmlFor="add-user-email">Email Address</label>
            <input
              id="add-user-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@propcheck.in"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label htmlFor="add-user-password">Password</label>
            <input
              id="add-user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {userType === 'CITY_HEAD' && (
            <div className="form-group">
              <label htmlFor="add-user-city">Assigned City</label>
              <input
                id="add-user-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
                placeholder="e.g. Hyderabad, Delhi NCR, Pune"
              />
            </div>
          )}

          {userType !== 'ADMIN' && (
            <label
              htmlFor="add-user-validate"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.75rem',
                borderRadius: '0.6rem',
                border: `1px solid ${canValidate ? '#86efac' : '#e2e8f0'}`,
                background: canValidate ? '#f0fdf4' : '#f8fafc',
                cursor: 'pointer',
                marginBottom: '1rem',
              }}
            >
              <input
                id="add-user-validate"
                type="checkbox"
                checked={canValidate}
                onChange={(e) => setCanValidate(e.target.checked)}
                style={{ width: 'auto', margin: 0 }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                  Assign Validation Power
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  Allows reviewing inspection reports & approving QC
                </div>
              </div>
            </label>
          )}

          {error && (
            <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : `Create ${userType === 'ADMIN' ? 'Admin' : userType === 'CITY_HEAD' ? 'City Lead' : 'Sales Person'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ROLE_STYLES = {
  SUPER_ADMIN: { bg: '#fae8ff', color: '#86198f', label: 'Super Admin' },
  ADMIN: { bg: '#ede9fe', color: '#5b21b6', label: 'Admin' },
  CITY_HEAD: { bg: '#dbeafe', color: '#1d4ed8', label: 'City Lead' },
  SALES: { bg: '#fef3c7', color: '#92400e', label: 'Sales' },
  VALIDATOR: { bg: '#dcfce7', color: '#166534', label: 'Validator' },
};

export default function AdminDashboard() {
  const { logout, name: adminName, role: currentRole } = useAuth();
  const isSuperAdmin = currentRole === 'SUPER_ADMIN';
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('operations');

  // Operations (City Lead + Sales + Validator all-access) state
  const [leads, setLeads] = useState([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState('ALL');
  const [customDate, setCustomDate] = useState(getTodayYmd());
  const [rangeStart, setRangeStart] = useState(getTodayYmd());
  const [rangeEnd, setRangeEnd] = useState(getTodayYmd());
  const [bookingLeadTarget, setBookingLeadTarget] = useState(null);
  const [assignEngineerTarget, setAssignEngineerTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');

  const salesUsers = useMemo(() => users.filter((u) => u.role === 'SALES'), [users]);

  const displayedLeads = useMemo(
    () =>
      filterLeadsByDate(leads, {
        bookingFilter,
        datePreset,
        customDate,
        rangeStart,
        rangeEnd,
      }),
    [leads, bookingFilter, datePreset, customDate, rangeStart, rangeEnd]
  );

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const params = new URLSearchParams();
      if (selectedCity) params.append('city', selectedCity);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('bookingFilter', bookingFilter);
      if (ownerFilter !== 'All') params.append('owner', ownerFilter);

      const response = await client.get(`/leads?${params.toString()}`);
      setLeads(response.data || []);
    } catch (err) {
      console.error('Failed to fetch leads', err);
    } finally {
      setLoadingLeads(false);
    }
  }, [selectedCity, debouncedSearch, bookingFilter, ownerFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage('');
    setSyncError('');
    try {
      const res = await client.post('/leads/sync');
      setSyncMessage(res.data?.message || 'Leads synced from Zoho.');
      fetchLeads();
    } catch (err) {
      setSyncError(err.response?.data?.error || 'Failed to sync Zoho leads.');
    } finally {
      setSyncing(false);
    }
  };

  const handleLeadAction = async (action, lead) => {
    const bookingId = lead.currentBookingId || lead.id;

    if (action === 'RESCHEDULE') {
      setRescheduleTarget({
        ...lead,
        id: bookingId,
        bookingType: lead.inspectionType || 'INSPECTION',
      });
      return;
    }

    if (action === 'ASSIGN_ENGINEER') {
      const slotTimeStr = lead.inspectionDateAndTime
        ? new Date(lead.inspectionDateAndTime).toLocaleTimeString('en-US', { hour12: false })
        : '';
      const assumedSlot = slotTimeStr && parseInt(slotTimeStr.split(':')[0], 10) >= 13 ? 'EVENING' : 'MORNING';
      setAssignEngineerTarget({
        ...lead,
        id: bookingId,
        leadId: lead.id,
        date: lead.inspectionDateAndTime ? lead.inspectionDateAndTime.split('T')[0] : new Date().toISOString().split('T')[0],
        slot: lead.slot || assumedSlot,
      });
      return;
    }

    try {
      if (action === 'CANCEL') {
        await client.put(`/bookings/for-lead/${lead.id}/cancel`);
      } else if (action === 'MARK_DONE') {
        await client.put(`/bookings/for-lead/${lead.id}/mark-done`);
      } else if (action === 'MARK_VALIDATION_DONE') {
        await client.put(`/bookings/for-lead/${lead.id}/mark-validation-done`);
      } else if (action === 'REPORT_SENT') {
        await client.put(`/bookings/for-lead/${lead.id}/report-sent`);
      }
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.message || 'Action failed.');
    }
  };

  const fetchUsers = useCallback(async () => {
    setTableLoading(true);
    try {
      const response = await client.get('/users');
      setUsers(response.data || []);
    } catch {
      // keep previous list on transient refresh failure
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await client.delete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user.');
    }
  };

  const handleToggleValidator = async (user) => {
    try {
      await client.put(`/users/${user.id}`, { canValidate: !user.canValidate });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update validation permission.');
    }
  };

  const stats = useMemo(() => ({
    total: users.length,
    sales: users.filter((u) => u.role === 'SALES').length,
    cityLeads: users.filter((u) => u.role === 'CITY_HEAD').length,
    validators: users.filter((u) => u.canValidate || u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' || u.role === 'VALIDATOR').length,
  }), [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter === 'VALIDATORS' && !(u.canValidate || u.role === 'SUPER_ADMIN' || u.role === 'ADMIN' || u.role === 'VALIDATOR')) return false;
      if (roleFilter === 'ADMINS' && !(u.role === 'ADMIN' || u.role === 'SUPER_ADMIN')) return false;
      if (roleFilter !== 'ALL' && roleFilter !== 'VALIDATORS' && roleFilter !== 'ADMINS' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.city || '').toLowerCase().includes(q)
      );
    });
  }, [users, search, roleFilter]);

  return (
    <div className="app-container">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 style={{ marginBottom: 0 }}>{isSuperAdmin ? 'Super Admin Portal' : 'Admin Portal'}</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Welcome back, {adminName || 'Admin'} · {isSuperAdmin ? 'Full system & admin management' : 'Manage team roles & operations'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => navigate('/validator')}>🔍 Validation Queue</button>
            <button className="btn btn-secondary" onClick={() => navigate('/schedule')}>🗓️ Schedule</button>
            <button className="btn btn-secondary" onClick={() => navigate('/profile')}>Profile</button>
            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              style={{ border: '1px solid var(--error-color)', color: 'var(--error-color)' }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Clean Tab Switcher: Operations (City Lead + All Rights) vs Team & Permissions */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setActiveTab('operations')}
            className={`btn ${activeTab === 'operations' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📋 Operations (All Cities)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('team')}
            className={`btn ${activeTab === 'team' ? 'btn-primary' : 'btn-secondary'}`}
          >
            👥 Team & Permissions ({users.length})
          </button>
        </div>

        {activeTab === 'operations' && (
          <>
            <ConflictWidget city={selectedCity} />

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2 style={{ marginBottom: 0 }}>Customers & Leads</h2>
                  <button
                    className="btn btn-secondary"
                    onClick={fetchLeads}
                    disabled={loadingLeads}
                    style={{ padding: '0.3rem 0.75rem', fontSize: '0.875rem' }}
                  >
                    {loadingLeads ? '...' : 'Refresh'}
                  </button>
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? 'Syncing...' : '🔄 Sync Zoho Leads'}
                </button>
              </div>

              {syncMessage && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', fontSize: '0.875rem' }}>
                  ✅ {syncMessage}
                </div>
              )}
              {syncError && (
                <div style={{ marginBottom: '1rem', padding: '0.75rem 1rem', borderRadius: '0.5rem', background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', fontSize: '0.875rem' }}>
                  {syncError}
                </div>
              )}

              {/* Filters Panel (same as City Lead, defaulting to All Cities) */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem',
                background: 'var(--background-color, #f9fafb)',
                padding: '1.25rem',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
              }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <input
                    type="text"
                    placeholder="Search by customer name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      border: '1px solid var(--border-color)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>City</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                  >
                    <option value="">All Cities</option>
                    <option value="Hyderabad">Hyderabad</option>
                    <option value="Bangalore">Bangalore</option>
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Chennai">Chennai</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Lead Owner</label>
                  <select
                    value={ownerFilter}
                    onChange={(e) => setOwnerFilter(e.target.value)}
                    style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                  >
                    <option value="All">All</option>
                    {salesUsers.map((u) => (
                      <option key={u.id} value={u.name}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Booking Status</label>
                  <select
                    value={bookingFilter}
                    onChange={(e) => {
                      const next = e.target.value;
                      setBookingFilter(next);
                      setDatePreset(getDefaultDatePresetForStatus(next));
                    }}
                    style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
                  >
                    <option value="ALL">All Leads</option>
                    <option value="UNBOOKED">Unbooked (Never booked)</option>
                    <option value="PENDING_ENGINEER">Date Allotted (Engineer Not Allotted)</option>
                    <option value="ENGINEER_ALLOTTED">Engineer Allotted</option>
                    <option value="INSPECTION_DONE">Inspection Done</option>
                    <option value="VALIDATION_DONE">Validation Done</option>
                    <option value="REPORT_SENT">Report Sent</option>
                    <option value="POSTPONED_CANCELLED">Postponed / Cancelled</option>
                  </select>
                </div>

                <DateFilterControl
                  bookingFilter={bookingFilter}
                  datePreset={datePreset}
                  setDatePreset={setDatePreset}
                  customDate={customDate}
                  setCustomDate={setCustomDate}
                  rangeStart={rangeStart}
                  setRangeStart={setRangeStart}
                  rangeEnd={rangeEnd}
                  setRangeEnd={setRangeEnd}
                />
              </div>

              <LeadsTable
                leads={displayedLeads}
                users={users}
                loading={loadingLeads}
                emptyMessage={`No leads found for ${selectedCity || 'All Cities'}.`}
                onBookClick={(lead) => setBookingLeadTarget(lead)}
                onAction={handleLeadAction}
                onRowClick={(id) => navigate('/leads/' + id)}
              />
            </div>
          </>
        )}

        {activeTab === 'team' && (
          <>

        {/* Summary KPI Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            { label: 'Total Users', value: stats.total, accent: '#4f46e5' },
            { label: 'Sales Team', value: stats.sales, accent: '#d97706' },
            { label: 'City Leads', value: stats.cityLeads, accent: '#2563eb' },
            { label: 'With Validation Power', value: stats.validators, accent: '#16a34a' },
          ].map((item) => (
            <div
              key={item.label}
              className="card"
              style={{
                margin: 0,
                padding: '1rem 1.25rem',
                borderLeft: `4px solid ${item.accent}`,
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.label}</div>
              <div style={{ fontSize: '1.65rem', fontWeight: 700, marginTop: '0.25rem', color: '#0f172a' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Users Directory */}
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
              marginBottom: '1.25rem',
            }}
          >
            <div>
              <h2 style={{ margin: 0 }}>Team Directory</h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Add users or toggle validation permissions directly
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button className="btn btn-secondary" onClick={fetchUsers} disabled={tableLoading}>
                {tableLoading ? 'Refreshing...' : '↻ Refresh'}
              </button>
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                + Add User
              </button>
            </div>
          </div>

          {/* Search & Role Filter Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              marginBottom: '1rem',
            }}
          >
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or city..."
              style={{ maxWidth: '300px', padding: '0.5rem 0.75rem' }}
            />
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              {[
                { key: 'ALL', label: 'All' },
                { key: 'SALES', label: 'Sales' },
                { key: 'CITY_HEAD', label: 'City Leads' },
                { key: 'VALIDATORS', label: 'Validators' },
                { key: 'ADMINS', label: 'Admins' },
              ].map((tab) => {
                const active = roleFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setRoleFilter(tab.key)}
                    className="btn"
                    style={{
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.8rem',
                      borderRadius: '9999px',
                      background: active ? 'var(--primary-color)' : '#f1f5f9',
                      color: active ? '#ffffff' : '#334155',
                      border: 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="table-container" style={{ overflowX: 'auto' }}>
            {filteredUsers.length === 0 && !tableLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No matching users found.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr>
                    <th style={{ padding: '0.6rem 0.75rem' }}>User</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Role</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>City</th>
                    <th style={{ padding: '0.6rem 0.75rem' }}>Validation</th>
                    <th style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const roleMeta = ROLE_STYLES[user.role] || { bg: '#f1f5f9', color: '#334155', label: user.role };
                    const initials = (user.name || '?')
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <tr key={user.id}>
                        <td style={{ padding: '0.6rem 0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                background: roleMeta.bg,
                                color: roleMeta.color,
                                fontWeight: 700,
                                fontSize: '0.72rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {initials}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 600, color: '#0f172a', lineHeight: 1.25 }}>{user.name}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                          <span
                            className="badge"
                            style={{ background: roleMeta.bg, color: roleMeta.color, fontWeight: 600 }}
                          >
                            {roleMeta.label}
                          </span>
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>{user.city || '—'}</td>
                        <td style={{ padding: '0.6rem 0.75rem', whiteSpace: 'nowrap' }}>
                          {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
                            <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>
                              Full Access
                            </span>
                          ) : (
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleToggleValidator(user)}
                              style={{
                                padding: '0.25rem 0.6rem',
                                fontSize: '0.75rem',
                                background: user.canValidate ? '#dcfce7' : '#f8fafc',
                                color: user.canValidate ? '#166534' : '#475569',
                                borderColor: user.canValidate ? '#86efac' : '#cbd5e1',
                              }}
                            >
                              {user.canValidate ? '✅ Validator' : '+ Grant'}
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          {user.role === 'SUPER_ADMIN' ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Protected</span>
                          ) : user.role === 'ADMIN' && !isSuperAdmin ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Super Admin Only</span>
                          ) : (
                            <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                              <button
                                className="btn btn-secondary"
                                onClick={() => setEditingUser(user)}
                                style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => handleDeleteUser(user.id)}
                                style={{
                                  padding: '0.25rem 0.55rem',
                                  fontSize: '0.75rem',
                                  background: 'var(--error-color)',
                                  borderColor: 'var(--error-color)',
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
          </>
        )}

        {bookingLeadTarget && (
          <CreateBookingModal
            lead={bookingLeadTarget}
            onClose={() => setBookingLeadTarget(null)}
            onSuccess={fetchLeads}
          />
        )}

        {assignEngineerTarget && (
          <AssignEngineerModal
            booking={assignEngineerTarget}
            onClose={() => setAssignEngineerTarget(null)}
            onSuccess={fetchLeads}
          />
        )}

        {rescheduleTarget && (
          <RescheduleBookingModal
            booking={rescheduleTarget}
            onClose={() => setRescheduleTarget(null)}
            onSuccess={fetchLeads}
          />
        )}

        {showAddModal && (
          <AddUserModal
            isSuperAdmin={isSuperAdmin}
            onClose={() => setShowAddModal(false)}
            onSuccess={fetchUsers}
          />
        )}

        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSuccess={fetchUsers}
          />
        )}
      </div>
    </div>
  );
}
