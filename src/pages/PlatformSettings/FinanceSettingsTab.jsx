import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { selectMyPermissions } from '@/store/permissions/permissionsSlice';

export default function FinanceSettingsTab() {
  const myPermissions = useSelector(selectMyPermissions) || [];
  const canUpdate = myPermissions.includes('financeSetting.update');

  const [form, setForm] = useState({
    service_commission_percent: 10,
    premium_fee_platform_percent: 70,
    premium_fee_salon_percent: 30,
    current_version: 1,
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [settingsRes, historyRes] = await Promise.all([
        api.get('/finance-settings'),
        api.get('/finance-settings/history?limit=10'),
      ]);
      setForm(settingsRes.data.data || form);
      setHistory(historyRes.data.rows || []);
    } catch {
      toast.error('Failed to load finance settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    const platform = Number(form.premium_fee_platform_percent);
    const salon = Number(form.premium_fee_salon_percent);
    if (Math.round((platform + salon) * 100) / 100 !== 100) {
      toast.error('Premium platform + salon share must equal 100%');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/finance-settings', {
        service_commission_percent: Number(form.service_commission_percent),
        premium_fee_platform_percent: platform,
        premium_fee_salon_percent: salon,
      });
      setForm(res.data.data);
      toast.success('Finance settings updated');
      load();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading finance settings...</p>;

  return (
    <div className="space-y-8 max-w-xl">
      <form onSubmit={handleSave} className="space-y-4 border rounded-lg p-6 bg-white">
        <p className="text-sm text-gray-500">Current version: v{form.current_version}</p>

        <div>
          <Label>Service Commission %</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.service_commission_percent}
            disabled={!canUpdate}
            onChange={(e) => setForm((p) => ({ ...p, service_commission_percent: e.target.value }))}
          />
        </div>

        <div>
          <Label>Premium Fee Platform Share %</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.premium_fee_platform_percent}
            disabled={!canUpdate}
            onChange={(e) => setForm((p) => ({ ...p, premium_fee_platform_percent: e.target.value }))}
          />
        </div>

        <div>
          <Label>Premium Fee Salon Share %</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={form.premium_fee_salon_percent}
            disabled={!canUpdate}
            onChange={(e) => setForm((p) => ({ ...p, premium_fee_salon_percent: e.target.value }))}
          />
        </div>

        {canUpdate && (
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save Finance Settings'}
          </Button>
        )}
      </form>

      <div className="border rounded-lg p-6 bg-white">
        <h3 className="font-semibold mb-4">Settings History</h3>
        <div className="space-y-3 text-sm">
          {history.map((row) => (
            <div key={row.id} className="border-b pb-2">
              <p className="font-medium">Version {row.version}</p>
              <p className="text-gray-500">
                Service {row.service_commission_percent}% · Premium split {row.premium_fee_platform_percent}/{row.premium_fee_salon_percent}
              </p>
            </div>
          ))}
          {history.length === 0 && <p className="text-gray-500">No history yet.</p>}
        </div>
      </div>
    </div>
  );
}
