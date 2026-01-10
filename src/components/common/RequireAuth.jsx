import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../store/auth/authSlice';

/**
 * Protects routes that require authentication.
 * Redirects to login if not authenticated, preserving the intended destination.
 */
export default function RequireAuth({ children }) {
  const { user, loading, initialized } = useSelector(state => state.auth);
  const location = useLocation();

  // If we're loading or not initialized yet, don't redirect
  if (loading || !initialized) {
    return null; // or a loading spinner if you prefer
  }

  // Only redirect to login if we're sure there's no user after initialization
  if (!user && initialized) {
    // Redirect to login but remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}