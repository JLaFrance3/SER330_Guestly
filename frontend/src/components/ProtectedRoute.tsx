import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  requiredRole?: User['role'];
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { token, user } = useAuth();

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'host' ? '/host/dashboard' : '/guest/book'} replace />;
  }

  return <>{children}</>;
}
