import React from 'react';
import { useSelector } from 'react-redux';
import { selectMyPermissions } from '../../store/permissions/permissionsSlice';
import { selectIsAuthenticated } from '../../store/auth/authSlice';

/**
 * Wrapper component that only renders children if user has required permission
 * @param {Object} props
 * @param {string} props.permission - Required permission name (e.g., 'user.create')
 * @param {React.ReactNode} props.children - Components to render if permitted
 * @param {React.ReactNode} props.fallback - Optional component to render if not permitted
 */
export default function RequirePermission({ permission, children, fallback = null }) {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const permissions = useSelector(selectMyPermissions);

  if (!isAuthenticated) {
    return null;
  }

  if (!permission || permissions.includes(permission)) {
    return children;
  }

  return fallback;
}