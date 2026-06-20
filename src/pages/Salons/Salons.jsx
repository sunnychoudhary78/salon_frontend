import React, { useState } from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/api/axios';
import toast from 'react-hot-toast';

const SALON_STATUSES = ['ACTIVE', 'SUSPENDED', 'CLOSED'];

function SalonStatusSelect({ row, onUpdated }) {
  const [pending, setPending] = useState(false);

  const handleChange = async (newStatus) => {
    if (newStatus === row.status || pending) return;

    if (newStatus !== 'ACTIVE') {
      const label = newStatus.toLowerCase();
      const confirmed = window.confirm(`Set "${row.salon_name}" to ${label}?`);
      if (!confirmed) return;
    }

    setPending(true);
    try {
      await api.patch(`/salons/${row.id}/status`, { status: newStatus });
      toast.success(`Salon status updated to ${newStatus}`);
      onUpdated();
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to update status');
    } finally {
      setPending(false);
    }
  };

  return (
    <Select value={row.status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger size="sm" className="w-[130px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SALON_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function SalonsPage() {
  return (
    <AdminQueryPage
      title="Approved Salons"
      endpoint="/salons"
      statusFilter="status"
      statusOptions={SALON_STATUSES}
      renderActions={(row, refresh) => (
        <div className="flex items-center gap-2">
          <SalonStatusSelect row={row} onUpdated={refresh} />
          {row.status === 'ACTIVE' && (
            <Button size="sm" variant={row.is_featured ? 'secondary' : 'outline'} onClick={async () => {
              try {
                await api.patch(`/salons/${row.id}/feature`, { is_featured: !row.is_featured });
                toast.success(row.is_featured ? 'Salon removed from featured' : 'Salon marked featured');
                refresh();
              } catch (e) { toast.error(e?.response?.data?.message || 'Failed'); }
            }}>{row.is_featured ? 'Unfeature' : 'Feature'}</Button>
          )}
        </div>
      )}
    />
  );
}
