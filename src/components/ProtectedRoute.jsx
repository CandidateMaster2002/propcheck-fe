import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ allowedRole, allowedRoles, requireValidator = false, children }) {
  const { role, canValidate } = useAuth();
  
  const roles = allowedRoles || (allowedRole ? [allowedRole] : []);

  if (!role) {
    return <Navigate to="/login" replace />;
  }

  if (requireValidator) {
    const hasAccess = role === 'ADMIN' || role === 'VALIDATOR' || Boolean(canValidate);
    if (!hasAccess) return <Navigate to="/login" replace />;
    return children;
  }

  if (!roles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
