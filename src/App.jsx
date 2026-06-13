import React, { useEffect, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RequirePermission from './components/common/RequirePermission';
import RequireAuth from './components/common/RequireAuth';
import AppLayout from './components/common/AppLayout';
import { useDispatch, useSelector } from 'react-redux';
import { restoreSession } from './store/auth/authSlice';

const LoginPage = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const SalonApplications = React.lazy(() => import('./pages/SalonApplications/SalonApplications'));
const Salons = React.lazy(() => import('./pages/Salons/Salons'));
const ServiceCategories = React.lazy(() => import('./pages/ServiceCategories/ServiceCategories'));
const Services = React.lazy(() => import('./pages/Services/Services'));
const Customers = React.lazy(() => import('./pages/Customers/Customers'));
const Bookings = React.lazy(() => import('./pages/Bookings/Bookings'));
const Reviews = React.lazy(() => import('./pages/Reviews/Reviews'));
const Coupons = React.lazy(() => import('./pages/Coupons/Coupons'));
const PromotionalBanners = React.lazy(() => import('./pages/PromotionalBanners/PromotionalBanners'));
const PlatformSettings = React.lazy(() => import('./pages/PlatformSettings/PlatformSettings'));
const AuditLogs = React.lazy(() => import('./pages/AuditLogs/AuditLogs'));
const Roles = React.lazy(() => import('./pages/RolesAndPermissions/Roles'));

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
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/salon-applications" element={<RequirePermission permission="salonApplication.read"><SalonApplications /></RequirePermission>} />
          <Route path="/salons" element={<RequirePermission permission="salon.read"><Salons /></RequirePermission>} />
          <Route path="/service-categories" element={<RequirePermission permission="serviceCategory.read"><ServiceCategories /></RequirePermission>} />
          <Route path="/services" element={<RequirePermission permission="service.read"><Services /></RequirePermission>} />
          <Route path="/customers" element={<RequirePermission permission="customer.read"><Customers /></RequirePermission>} />
          <Route path="/bookings" element={<RequirePermission permission="booking.read"><Bookings /></RequirePermission>} />
          <Route path="/reviews" element={<RequirePermission permission="review.read"><Reviews /></RequirePermission>} />
          <Route path="/coupons" element={<RequirePermission permission="coupon.read"><Coupons /></RequirePermission>} />
          <Route path="/promotional-banners" element={<RequirePermission permission="banner.read"><PromotionalBanners /></RequirePermission>} />
          <Route path="/platform-settings" element={<RequirePermission permission="platformSetting.read"><PlatformSettings /></RequirePermission>} />
          <Route path="/audit-logs" element={<RequirePermission permission="auditLog.read"><AuditLogs /></RequirePermission>} />
          <Route path="/roles" element={<RequirePermission permission="role.read"><Roles /></RequirePermission>} />
        </Route>
      </Routes>
    </Suspense>
  );
}
