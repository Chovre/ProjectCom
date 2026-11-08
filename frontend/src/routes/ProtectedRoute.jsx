import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute
 *
 * Props:
 *  - allowedRoles : string[]  – e.g. ['ADMIN', 'ROLE_ADMIN']
 *  - children      : ReactNode (optional, falls back to <Outlet />)
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { isAuthenticated, user, loading } = useAuth();

  // ── Still hydrating auth state ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-navy-600" />
          <p className="text-gray-500 text-sm font-medium">Verifying session…</p>
        </div>
      </div>
    );
  }

  // ── Not authenticated ──
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // ── Role check (if allowedRoles provided) ──
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = user?.role || '';
    const hasRole = allowedRoles.some(
      (role) => role === userRole || `ROLE_${role}` === userRole || role === `ROLE_${userRole}`
    );

    if (!hasRole) {
      return <Navigate to="/access-denied" replace />;
    }
  }

  return children ? children : <Outlet />;
}
