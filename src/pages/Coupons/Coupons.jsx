import React, { useState } from 'react';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/api/axios';
import toast from 'react-hot-toast';

export default function CouponsPage() {
  const [open, setOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [form, setForm] = useState({
    code: '', discount_type: 'PERCENT', discount_value: '', valid_from: '', valid_to: '', usage_limit: '',
  });

  const handleCreate = async () => {
    try {
      await api.post('/coupons', {
        ...form,
        discount_value: parseFloat(form.discount_value),
        usage_limit: form.usage_limit ? parseInt(form.usage_limit, 10) : null,
      });
      toast.success('Coupon created');
      setOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed');
    }
  };

  return (
    <div>
      <div className="px-6 pt-6 flex justify-end">
        <Button onClick={() => setOpen(true)}>Add Coupon</Button>
      </div>
      <AdminQueryPage key={refreshKey} title="Coupons" endpoint="/coupons" />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Coupon</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></div>
            <div>
              <Label>Type</Label>
              <Select value={form.discount_type} onValueChange={(v) => setForm({ ...form, discount_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENT">Percent</SelectItem>
                  <SelectItem value="FLAT">Flat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Value</Label><Input type="number" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} /></div>
            <div><Label>Valid From</Label><Input type="datetime-local" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })} /></div>
            <div><Label>Valid To</Label><Input type="datetime-local" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })} /></div>
            <div><Label>Usage Limit</Label><Input type="number" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} /></div>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
