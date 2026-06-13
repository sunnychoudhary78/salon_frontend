import React from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import api from '@/api/axios';
import toast from 'react-hot-toast';

export default function CustomersPage() {
  return (
    <AdminQueryPage
      title="Customers"
      endpoint="/customers"
      statusFilter="status"
      statusOptions={['ACTIVE', 'BLOCKED']}
      renderActions={(row, refresh) =>
        row.status === 'ACTIVE' ? (
          <Button size="sm" variant="destructive" onClick={async () => {
            try {
              await api.patch(`/customers/${row.id}/block`);
              toast.success('Customer blocked');
              refresh();
            } catch (e) { toast.error(e?.response?.data?.message || 'Failed'); }
          }}>Block</Button>
        ) : null
      }
    />
  );
}
