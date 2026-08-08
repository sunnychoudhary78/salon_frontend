import React from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import api from '@/api/axios';
import toast from 'react-hot-toast';

export default function SalonPayoutAccountsPage() {
  const handleApprove = async (row, refresh) => {
    try {
      await api.post(`/salon-payout-accounts/${row.id}/approve`);
      toast.success('Payout account approved');
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (row, refresh) => {
    if (!window.confirm('Reject this payout account? The salon owner will need to update their bank details.')) {
      return;
    }
    try {
      await api.post(`/salon-payout-accounts/${row.id}/reject`);
      toast.success('Payout account rejected');
      refresh();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to reject');
    }
  };

  return (
    <AdminQueryPage
      title="Salon Payout Accounts"
      endpoint="/salon-payout-accounts"
      statusFilter="verification_status"
      statusOptions={['PENDING', 'VERIFIED', 'REJECTED']}
      renderActions={(row, refresh) =>
        row.verification_status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => handleApprove(row, refresh)}>Approve</Button>
            <Button size="sm" variant="destructive" onClick={() => handleReject(row, refresh)}>Reject</Button>
          </div>
        ) : null
      }
    />
  );
}
