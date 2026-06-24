import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

function AuthSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );
}

/**
 * Protects routes that require authentication.
 * Redirects to login if not authenticated, preserving the intended destination.
 */
export default function RequireAuth({ children }) {
  const { user, initialized } = useSelector(state => state.auth);
  const location = useLocation();

  if (!initialized) {
    return <AuthSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
