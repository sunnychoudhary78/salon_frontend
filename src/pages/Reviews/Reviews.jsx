import React from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import api from '@/api/axios';
import toast from 'react-hot-toast';

export default function ReviewsPage() {
  return (
    <AdminQueryPage
      title="Reviews & Ratings"
      endpoint="/reviews"
      statusFilter="status"
      statusOptions={['PUBLISHED', 'HIDDEN']}
      renderActions={(row, refresh) => (
        <div className="flex gap-2">
          {row.status === 'HIDDEN' && (
            <Button size="sm" onClick={async () => {
              try { await api.patch(`/reviews/${row.id}/publish`); toast.success('Published'); refresh(); }
              catch (e) { toast.error(e?.response?.data?.message || 'Failed'); }
            }}>Publish</Button>
          )}
          {row.status === 'PUBLISHED' && (
            <Button size="sm" variant="destructive" onClick={async () => {
              try { await api.patch(`/reviews/${row.id}/hide`); toast.success('Hidden'); refresh(); }
              catch (e) { toast.error(e?.response?.data?.message || 'Failed'); }
            }}>Hide</Button>
          )}
        </div>
      )}
    />
  );
}
