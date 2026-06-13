import React from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import api from '@/api/axios';
import toast from 'react-hot-toast';

export default function SalonsPage() {
  return (
    <AdminQueryPage
      title="Approved Salons"
      endpoint="/salons"
      statusFilter="status"
      statusOptions={['ACTIVE', 'SUSPENDED', 'CLOSED']}
      renderActions={(row, refresh) => (
        <div className="flex gap-2">
          {row.status === 'ACTIVE' && (
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                await api.patch(`/salons/${row.id}/suspend`);
                toast.success('Salon suspended');
                refresh();
              } catch (e) { toast.error(e?.response?.data?.message || 'Failed'); }
            }}>Suspend</Button>
          )}
          {row.status !== 'CLOSED' && (
            <Button size="sm" variant="destructive" onClick={async () => {
              try {
                await api.patch(`/salons/${row.id}/close`);
                toast.success('Salon closed');
                refresh();
              } catch (e) { toast.error(e?.response?.data?.message || 'Failed'); }
            }}>Close</Button>
          )}
        </div>
      )}
    />
  );
}
