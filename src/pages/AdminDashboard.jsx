import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

function CreateSalesForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await client.post('/users/sales', { name, email, password });
      setName('');
      setEmail('');
      setPassword('');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create sales person.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Sales Person</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="sales-name">Name</label>
          <input
            id="sales-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="John Doe"
          />
        </div>
        <div className="form-group">
          <label htmlFor="sales-email">Email</label>
          <input
            id="sales-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="john@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="sales-password">Password</label>
          <input
            id="sales-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Sales Person'}
        </button>
      </form>
    </div>
  );
}

function CreateCityHeadForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await client.post('/users/cityhead', { name, email, password, city });
      setName('');
      setEmail('');
      setPassword('');
      setCity('');
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create city head.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create City Head</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="ch-name">Name</label>
          <input
            id="ch-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Smith"
          />
        </div>
        <div className="form-group">
          <label htmlFor="ch-email">Email</label>
          <input
            id="ch-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="jane@example.com"
          />
        </div>
        <div className="form-group">
          <label htmlFor="ch-password">Password</label>
          <input
            id="ch-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>
        <div className="form-group">
          <label htmlFor="ch-city">City</label>
          <input
            id="ch-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            placeholder="New York"
          />
        </div>
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create City Head'}
        </button>
      </form>
    </div>
  );
}

function UsersTable({ users, onRefresh, loading, onEdit, onDelete }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: 0 }}>All Users</h2>
        <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="table-container">
        {users.length === 0 && !loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No users found.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>City</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>{user.name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{user.email}</td>
                  <td>
                    <span className="badge">
                      {user.role}
                    </span>
                  </td>
                  <td>{user.city ?? '-'}</td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => onEdit(user)}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', marginRight: '0.5rem' }}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={() => onDelete(user.id)}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', background: 'var(--error-color)', borderColor: 'var(--error-color)' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

import EditUserModal from '../components/EditUserModal';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = useCallback(async () => {
    setTableLoading(true);
    try {
      const response = await client.get('/users');
      setUsers(response.data);
    } catch {
      // silently fail on refresh; could add a table-level error if desired
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

  return (
    <div className="app-container">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 style={{ marginBottom: 0 }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>Manage users and roles</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/schedule')}>🗓️ Schedule</button>
            <button className="btn btn-secondary" onClick={() => navigate('/analytics')}>📊 Analytics</button>
            <button className="btn btn-secondary" onClick={() => navigate('/profile')}>Profile</button>
            <button className="btn btn-secondary" onClick={handleLogout} style={{ border: '1px solid var(--error-color)', color: 'var(--error-color)' }}>Logout</button>
          </div>
        </header>

        <div className="dashboard-grid">
          <CreateSalesForm onSuccess={fetchUsers} />
          <CreateCityHeadForm onSuccess={fetchUsers} />
        </div>

        <UsersTable 
          users={users} 
          onRefresh={fetchUsers} 
          loading={tableLoading} 
          onEdit={(u) => setEditingUser(u)}
          onDelete={handleDeleteUser}
        />
        
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
