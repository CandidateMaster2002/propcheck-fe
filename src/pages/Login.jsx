import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const ROLE_ROUTES = {
  ADMIN: '/admin',
  SALES: '/sales',
  CITY_HEAD: '/cityhead',
  CUSTOMER: '/customer',
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login, role } = useAuth();

  // If already logged in, redirect to the correct dashboard immediately
  useEffect(() => {
    if (role && ROLE_ROUTES[role]) {
      navigate(ROLE_ROUTES[role], { replace: true });
    }
  }, [role, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await client.post('/auth/login', { email, password });
      const userData = response.data;
      
      login(userData);
      
      const route = ROLE_ROUTES[userData.role];
      if (route) {
        navigate(route);
      } else {
        setError('Unknown role assigned to user');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="app-container center-container">
      <div className="card login-card">
        <h1 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>PropCheck Portal</h1>
        
        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input 
              id="email"
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              id="password"
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        {/* Demo Accounts Section */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem', textAlign: 'center', fontWeight: 500 }}>
            Demo Accounts
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => fillDemo('admin@example.com', '123')}
              style={{ fontSize: '0.8125rem', padding: '0.5rem' }}
            >
              Admin
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => fillDemo('cityhead.hyd1@example.com', '123')}
              style={{ fontSize: '0.8125rem', padding: '0.5rem' }}
            >
              City Head (Hyderabad)
            </button>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => fillDemo('sales1@example.com', '123')}
              style={{ fontSize: '0.8125rem', padding: '0.5rem' }}
            >
              Sales
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
