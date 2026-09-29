import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRole, allowedRoles, children }) {
  const { role } = useAuth();
  
  const roles = allowedRoles || (allowedRole ? [allowedRole] : []);

  if (!role || !roles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
