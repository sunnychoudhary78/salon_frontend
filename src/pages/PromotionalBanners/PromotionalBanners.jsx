import React, { useState } from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/api/axios';
import toast from 'react-hot-toast';

export default function PromotionalBannersPage() {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({ title: '', image: '', redirect_type: 'NONE', redirect_value: '', sort_order: 0 });

  const handleCreate = async () => {
    try {
      await api.post('/promotional-banners', form);
      toast.success('Banner created');
      setOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="px-6 pt-6 flex justify-end">
        <Button onClick={() => setOpen(true)}>Add Banner</Button>
      </div>
      <AdminQueryPage key={refreshKey} title="Promotional Banners" endpoint="/promotional-banners" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Banner</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Image URL</Label><Input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} /></div>
            <div><Label>Redirect Type</Label><Input value={form.redirect_type} onChange={(e) => setForm({ ...form, redirect_type: e.target.value })} placeholder="NONE, SALON, EXTERNAL_URL" /></div>
            <div><Label>Redirect Value</Label><Input value={form.redirect_value} onChange={(e) => setForm({ ...form, redirect_value: e.target.value })} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })} /></div>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
