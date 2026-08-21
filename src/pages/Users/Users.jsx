import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import AdminQueryPage from '@/components/common/AdminQueryPage';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { selectMyPermissions } from '@/store/permissions/permissionsSlice';

function targetForRow(row) {
  return row?.account_type_key === 'customer' ? 'SALON_OWNER' : 'CUSTOMER';
}

export default function UsersPage() {
  const permissions = useSelector(selectMyPermissions) || [];
  const canUpdate = permissions.includes('user.update');
  const [accountType, setAccountType] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [row, setRow] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const target = row ? targetForRow(row) : null;
  const convertingToOwner = target === 'SALON_OWNER';
  const needsBusinessName = convertingToOwner && !row?.has_owner_profile;

  const openSwitch = (userRow) => {
    setRow(userRow);
    setBusinessName(userRow.business_name || '');
    setGstNumber('');
  };

  const closeSwitch = () => {
    if (saving) return;
    setRow(null);
    setBusinessName('');
    setGstNumber('');
  };

  const handleConvert = async () => {
    if (!row || !target) return;
    if (needsBusinessName && !businessName.trim()) {
      toast.error('Business name is required');
      return;
    }

    setSaving(true);
    try {
      const payload = { target };
      if (convertingToOwner) {
        if (businessName.trim()) payload.business_name = businessName.trim();
        if (gstNumber.trim()) payload.gst_number = gstNumber.trim();
      }
      const res = await api.post(`/users/${row.id}/convert-account`, payload);
      toast.success(res.data?.message || 'Account converted');
      setRow(null);
      setBusinessName('');
      setGstNumber('');
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to switch role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="px-6 pt-6 flex items-center gap-2">
        <label className="text-sm text-gray-600" htmlFor="account-type-filter">
          Account type
        </label>
        <select
          id="account-type-filter"
          className="border rounded-md px-3 py-2 text-sm"
          value={accountType}
          onChange={(e) => setAccountType(e.target.value)}
        >
          <option value="">All types</option>
          <option value="customer">Customer</option>
          <option value="salon_owner">Salon owner</option>
        </select>
      </div>
      <AdminQueryPage
        key={`${refreshKey}-${accountType}`}
        title="Manage Users"
        endpoint="/users"
        statusFilter="status"
        statusOptions={['ACTIVE', 'BLOCKED']}
        extraFilters={accountType ? { account_type: accountType } : {}}
        renderActions={(userRow) =>
          canUpdate ? (
            <Button size="sm" variant="outline" onClick={() => openSwitch(userRow)}>
              Switch role
            </Button>
          ) : null
        }
      />
      <Dialog open={Boolean(row)} onOpenChange={(open) => { if (!open) closeSwitch(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {convertingToOwner ? 'Convert to salon owner' : 'Convert to customer'}
            </DialogTitle>
            <DialogDescription>
              {convertingToOwner
                ? 'This user will keep customer access and gain salon owner access. They can submit a salon application in the app after conversion.'
                : 'Owner access will be removed and their salons will be suspended. Bookings and payments are kept.'}
            </DialogDescription>
          </DialogHeader>
          {row && (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                {row.name || 'Unnamed'} · {row.phone || row.email || row.id}
              </p>
              {convertingToOwner && (
                <>
                  <div>
                    <Label htmlFor="business_name">
                      Business name{needsBusinessName ? ' *' : ''}
                    </Label>
                    <Input
                      id="business_name"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Catchy Cuts"
                    />
                  </div>
                  <div>
                    <Label htmlFor="gst_number">GST number (optional)</Label>
                    <Input
                      id="gst_number"
                      value={gstNumber}
                      onChange={(e) => setGstNumber(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeSwitch} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={saving}>
              {saving ? 'Saving…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
