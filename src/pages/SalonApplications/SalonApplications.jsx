import React from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import api from '@/api/axios';
import toast from 'react-hot-toast';

export default function SalonApplicationsPage() {
  const handleApprove = async (row, refresh) => {
    try {
      await api.post(`/salon-applications/${row.id}/approve`);
      toast.success('Application approved');
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (row, refresh) => {
    const reason = window.prompt('Rejection reason:');
    if (!reason) return;
    try {
      await api.post(`/salon-applications/${row.id}/reject`, { rejection_reason: reason });
      toast.success('Application rejected');
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to reject');
    }
  };

  return (
    <AdminQueryPage
      title="Salon Applications"
      endpoint="/salon-applications"
      statusFilter="application_status"
      statusOptions={['PENDING_APPROVAL', 'APPROVED', 'REJECTED']}
      renderActions={(row, refresh) =>
        row.application_status === 'PENDING_APPROVAL' ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleApprove(row, refresh)}>Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => handleReject(row, refresh)}>Reject</Button>
          </div>
        ) : null
      }
    />
  );
}
