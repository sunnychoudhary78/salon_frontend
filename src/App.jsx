// src/App.jsx
import React, { useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from './components/common/RequirePermission';
import RequireAuth from './components/common/RequireAuth';
import AppLayout from './components/common/AppLayout';
import { useDispatch, useSelector } from 'react-redux';
import { restoreSession } from './store/auth/authSlice';
import EmployeesTableEnhanced from './pages/Employees/EmployeesTableEnhanced';
const CompanySettingsPage = React.lazy(() => import('./pages/CompanySettings/CompanySettings'));
const CompaniesPage = React.lazy(() => import('./pages/Companies/Companies'));
const CompanyDetailPage = React.lazy(() => import('./pages/Companies/CompanyDetail'));

// Lazy-loaded pages (route level code-splitting)
const LoginPage = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Employees = React.lazy(() => import('./pages/Employees/Employees'));
const EmployeeForm = React.lazy(() => import('./pages/Employees/EmployeeForm'));
const Departments = React.lazy(() => import('./pages/Departments/Departments'));
const Roles = React.lazy(() => import('./pages/RolesAndPermissions/Roles'));
const AdminsPage = React.lazy(() => import('./pages/Admins/Admins'));
const VariablesPage = React.lazy(() => import('./pages/Variables/Variables'));
const MyDetailsPage = React.lazy(() => import('./pages/MyDetails/MyDetails'));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
    </div>
  );
}

export default function App() {
  const dispatch = useDispatch();
  const { loading, initialized } = useSelector(state => state.auth);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  if (loading && !initialized) {
    return <Spinner />;
  }

  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        {/* public */}
        <Route path="/login" element={<LoginPage />} />

        {/* protected routes */}  
        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/my-details" element={<MyDetailsPage />} />

          <Route
            path="/employees"
            element={
              <RequirePermission permission="user.read">
                <EmployeesTableEnhanced />
              </RequirePermission>
            }
          />
          <Route
            path="/employees/add-employee"
            element={
              <RequirePermission permission="user.create">
                <EmployeeForm />
              </RequirePermission>
            }
          />
          <Route
            path="/employees/:userId/edit"
            element={
              <RequirePermission permission="user.update">
                <EmployeeForm />
              </RequirePermission>
            }
          />

          <Route
            path="/departments"
            element={
              <RequirePermission permission="department.read">
                <Departments />
              </RequirePermission>
            }
          />
          <Route
            path="/companies"
            element={
              <RequirePermission permission="company.read">
                <CompaniesPage />
              </RequirePermission>
            }
          />
          <Route
            path="/companies/:companyId"
            element={
              <RequirePermission permission="company.read">
                <CompanyDetailPage />
              </RequirePermission>
            }
          />
          <Route
            path="/admins"
            element={
              <RequirePermission permission="user.read">
                <AdminsPage />
              </RequirePermission>
            }
          />

          <Route
            path="/roles"
            element={
              <RequirePermission permission="role.read">
                <Roles />
              </RequirePermission>
            }
          />

          <Route
            path="/variables"
            element={
              <RequirePermission permission="variables.read">
                <VariablesPage />
              </RequirePermission>
            }
          />

          <Route
            path="/company-settings"
            element={
              <RequirePermission permission="companySettings.read">
                <CompanySettingsPage />
              </RequirePermission>
            }
          />



        </Route>
      </Routes>
    </Suspense>
  );
}
