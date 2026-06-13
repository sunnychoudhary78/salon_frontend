import React from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';

export default function BookingsPage() {
  return (
    <AdminQueryPage
      title="Bookings"
      endpoint="/bookings"
      statusFilter="booking_status"
      statusOptions={['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED']}
    />
  );
}
