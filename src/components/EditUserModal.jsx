import { useState } from 'react';
import client from '../api/client';

export default function EditUserModal({ user, onClose, onSuccess }) {
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [city, setCity] = useState(user.city || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = { name, email };
    if (user.role === 'CITY_HEAD') payload.city = city;
    if (password) payload.password = password; // Only update if typed

    try {
      await client.put(`/users/${user.id}`, payload);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', margin: '1rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
        <h2 style={{ marginTop: 0 }}>Edit User</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          {user.role === 'CITY_HEAD' && (
            <div className="form-group">
              <label>City</label>
              <input type="text" value={city} onChange={e => setCity(e.target.value)} required />
            </div>
          )}
          <div className="form-group">
            <label>New Password <small style={{ fontWeight: 'normal', color: 'var(--text-muted)' }}>(Leave blank to keep current)</small></label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          
          {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
