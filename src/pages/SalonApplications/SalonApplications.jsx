import React, { useState } from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import api from '@/api/axios';
import toast from 'react-hot-toast';

export default function SalonApplicationsPage() {
  const [typeFilter, setTypeFilter] = useState('');

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
    <div className="space-y-3">
      <div className="px-6 pt-6 flex items-center gap-2">
        <label className="text-sm text-gray-600" htmlFor="application-type-filter">Request type</label>
        <select
          id="application-type-filter"
          className="border rounded-md px-3 py-2 text-sm"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="">All types</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="DEACTIVATE">DEACTIVATE</option>
          <option value="ACTIVATE">ACTIVATE</option>
        </select>
      </div>
      <AdminQueryPage
        key={typeFilter}
        title="Salon Applications"
        endpoint="/salon-applications"
        statusFilter="application_status"
        statusOptions={['PENDING_APPROVAL', 'APPROVED', 'REJECTED']}
        extraFilters={typeFilter ? { application_type: typeFilter } : {}}
        renderActions={(row, refresh) =>
          row.application_status === 'PENDING_APPROVAL' ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleApprove(row, refresh)}>Approve</Button>
              <Button size="sm" variant="destructive" onClick={() => handleReject(row, refresh)}>Reject</Button>
            </div>
          ) : null
        }
      />
    </div>
  );
}
