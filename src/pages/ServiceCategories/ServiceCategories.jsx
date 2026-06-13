import React, { useState } from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/api/axios';
import toast from 'react-hot-toast';

export default function ServiceCategoriesPage() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', sort_order: 0 });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = async () => {
    try {
      await api.post('/service-categories', form);
      toast.success('Category created');
      setOpen(false);
      setForm({ name: '', description: '', sort_order: 0 });
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to create');
    }
  };

  return (
    <div>
      <div className="px-6 pt-6 flex justify-end">
        <Button onClick={() => setOpen(true)}>Add Category</Button>
      </div>
      <AdminQueryPage key={refreshKey} title="Service Categories" endpoint="/service-categories" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Service Category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value, 10) || 0 })} /></div>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
