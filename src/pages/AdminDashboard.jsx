import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import EditUserModal from '../components/EditUserModal';

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
    { value: 'CITY_HEAD', title: 'City Lead', desc: 'City ops & inspectors', icon: '🏙️' },
    ...(isSuperAdmin ? [{ value: 'ADMIN', title: 'Admin', desc: 'All ops except Admin CRUD', icon: '🛡️' }] : []),
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
          maxWidth: '460px',
          margin: 0,
          position: 'relative',
          borderRadius: '1rem',
          boxShadow: '0 20px 45px rgba(15, 23, 42, 0.2)',
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
                      textAlign: 'left',
                      padding: '0.75rem',
                      borderRadius: '0.65rem',
                      border: `2px solid ${active ? 'var(--primary-color)' : '#e2e8f0'}`,
                      background: active ? '#eef2ff' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{opt.icon}</div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a' }}>{opt.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{opt.desc}</div>
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

        {/* Admin All-Access Workspaces */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
            marginBottom: '1.5rem',
          }}
        >
          {[
            {
              title: 'Sales & Leads',
              desc: 'Sync Zoho leads, book & approve inspections',
              icon: '💼',
              path: '/sales',
              bg: '#fef3c7',
              color: '#92400e',
            },
            {
              title: 'City Lead Ops',
              desc: 'Assign engineers, resolve conflicts & reschedule',
              icon: '🏙️',
              path: '/cityhead',
              bg: '#dbeafe',
              color: '#1d4ed8',
            },
            {
              title: 'Validation & Reports',
              desc: 'Review completed inspections & approve QC',
              icon: '🔍',
              path: '/validator',
              bg: '#dcfce7',
              color: '#166534',
            },
            {
              title: 'Master Schedule',
              desc: 'Calendar slots, bookings & dispatch reports',
              icon: '🗓️',
              path: '/schedule',
              bg: '#ede9fe',
              color: '#5b21b6',
            },
          ].map((ws) => (
            <button
              key={ws.path}
              type="button"
              onClick={() => navigate(ws.path)}
              className="card"
              style={{
                margin: 0,
                padding: '1.1rem 1.25rem',
                textAlign: 'left',
                cursor: 'pointer',
                border: '1px solid #e2e8f0',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '0.6rem',
                    background: ws.bg,
                    color: ws.color,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.15rem',
                  }}
                >
                  {ws.icon}
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600 }}>Open →</span>
              </div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>{ws.title}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{ws.desc}</div>
            </button>
          ))}
        </div>

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

          <div className="table-container">
            {filteredUsers.length === 0 && !tableLoading ? (
              <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No matching users found.
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>City</th>
                    <th>Validation Power</th>
                    <th>Actions</th>
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
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: roleMeta.bg,
                                color: roleMeta.color,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              {initials}
                            </div>
                            <span style={{ fontWeight: 600 }}>{user.name}</span>
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                        <td>
                          <span
                            className="badge"
                            style={{ background: roleMeta.bg, color: roleMeta.color, fontWeight: 600 }}
                          >
                            {roleMeta.label}
                          </span>
                        </td>
                        <td>{user.city || '—'}</td>
                        <td>
                          {user.role === 'ADMIN' || user.role === 'SUPER_ADMIN' ? (
                            <span className="badge" style={{ background: '#dcfce7', color: '#166534' }}>
                              Full Access
                            </span>
                          ) : (
                            <button
                              className="btn btn-secondary"
                              onClick={() => handleToggleValidator(user)}
                              style={{
                                padding: '0.25rem 0.65rem',
                                fontSize: '0.75rem',
                                background: user.canValidate ? '#dcfce7' : '#f8fafc',
                                color: user.canValidate ? '#166534' : '#475569',
                                borderColor: user.canValidate ? '#86efac' : '#cbd5e1',
                              }}
                            >
                              {user.canValidate ? '✅ Validator' : '+ Grant Validation'}
                            </button>
                          )}
                        </td>
                        <td>
                          {user.role === 'SUPER_ADMIN' ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Protected</span>
                          ) : user.role === 'ADMIN' && !isSuperAdmin ? (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Super Admin Only</span>
                          ) : (
                            <>
                              <button
                                className="btn btn-secondary"
                                onClick={() => setEditingUser(user)}
                                style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem', marginRight: '0.4rem' }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-primary"
                                onClick={() => handleDeleteUser(user.id)}
                                style={{
                                  padding: '0.25rem 0.6rem',
                                  fontSize: '0.75rem',
                                  background: 'var(--error-color)',
                                  borderColor: 'var(--error-color)',
                                }}
                              >
                                Delete
                              </button>
                            </>
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
