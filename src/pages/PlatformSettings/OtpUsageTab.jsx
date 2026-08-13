import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { selectMyPermissions } from '@/store/permissions/permissionsSlice';

const EMPTY_WINDOWS = {
  today: { sent: 0, failed: 0, unique_phones: 0, cost_rupees: 0 },
  '7d': { sent: 0, failed: 0, unique_phones: 0, cost_rupees: 0 },
  '30d': { sent: 0, failed: 0, unique_phones: 0, cost_rupees: 0 },
};

function formatInr(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function formatWhen(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}

export default function OtpUsageTab() {
  const myPermissions = useSelector(selectMyPermissions) || [];
  const canUpdate = myPermissions.includes('platformSetting.update');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [windows, setWindows] = useState(EMPTY_WINDOWS);
  const [config, setConfig] = useState({
    daily_cap_per_phone: 5,
    sms_cost_paise: 18,
  });
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [tableLoading, setTableLoading] = useState(false);

  const loadInsights = useCallback(async () => {
    const res = await api.get('/otp-usage/insights');
    const data = res.data.data || {};
    setWindows(data.windows || EMPTY_WINDOWS);
    if (data.config) setConfig(data.config);
  }, []);

  const loadConsumers = useCallback(async (page = 1, phoneSearch = '') => {
    setTableLoading(true);
    try {
      const res = await api.post('/otp-usage/consumers/query', {
        page,
        limit: 20,
        search: phoneSearch || undefined,
      });
      setRows(res.data.rows || []);
      setMeta(res.data.meta || { page, limit: 20, total: 0, totalPages: 0 });
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to load OTP consumers');
    } finally {
      setTableLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadInsights(), loadConsumers(1, '')]);
      } catch {
        if (!cancelled) toast.error('Failed to load OTP usage');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadInsights, loadConsumers]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    const cap = parseInt(config.daily_cap_per_phone, 10);
    const paise = parseInt(config.sms_cost_paise, 10);
    if (!Number.isFinite(cap) || cap < 1) {
      toast.error('Daily cap must be at least 1');
      return;
    }
    if (!Number.isFinite(paise) || paise < 0) {
      toast.error('SMS charge must be 0 paise or more');
      return;
    }

    setSaving(true);
    try {
      const res = await api.put('/otp-usage/config', {
        daily_cap_per_phone: cap,
        sms_cost_paise: paise,
      });
      setConfig(res.data.data);
      toast.success('OTP usage settings saved');
      await loadInsights();
      await loadConsumers(meta.page, search);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (row) => {
    if (!canUpdate) return;
    try {
      if (row.is_blocked) {
        await api.delete(`/otp-usage/blocks/${row.phone}`);
        toast.success(`OTP unblocked for ${row.phone}`);
      } else {
        await api.post('/otp-usage/blocks', { phone: row.phone });
        toast.success(`OTP blocked for ${row.phone}`);
      }
      await loadConsumers(meta.page, search);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update block');
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading OTP usage...</div>;
  }

  const today = windows.today || EMPTY_WINDOWS.today;
  const last7 = windows['7d'] || EMPTY_WINDOWS['7d'];
  const last30 = windows['30d'] || EMPTY_WINDOWS['30d'];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium">OTP Usage</h2>
        <p className="text-sm text-gray-500 mt-1">
          Track MSG91 OTP SMS spend. History starts from when logging was enabled.
          Blocked numbers and the daily cap are rejected before SMS is sent.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard label="Sent today" value={today.sent} />
        <StatCard label="Sent 7 days" value={last7.sent} />
        <StatCard label="Sent 30 days" value={last30.sent} />
        <StatCard label="Failures today" value={today.failed} />
        <StatCard label="Unique phones today" value={today.unique_phones} />
        <StatCard label="Cost today" value={formatInr(today.cost_rupees)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <StatCard label="Cost last 7 days" value={formatInr(last7.cost_rupees)} />
        <StatCard label="Cost last 30 days" value={formatInr(last30.cost_rupees)} />
      </div>

      <form onSubmit={handleSaveConfig} className="bg-white border rounded-lg p-6 space-y-4 max-w-xl">
        <h3 className="text-sm font-medium">Billing and limits</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="sms-cost-paise">SMS charge (paise)</Label>
            <Input
              id="sms-cost-paise"
              type="number"
              min={0}
              step={1}
              value={config.sms_cost_paise}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, sms_cost_paise: e.target.value }))
              }
              disabled={!canUpdate}
            />
            <p className="text-xs text-gray-500">
              Currently {config.sms_cost_paise}p = {formatInr((Number(config.sms_cost_paise) || 0) / 100)} per SMS.
            </p>
          </div>
          <div className="space-y-1">
            <Label htmlFor="daily-cap">Daily cap per phone</Label>
            <Input
              id="daily-cap"
              type="number"
              min={1}
              step={1}
              value={config.daily_cap_per_phone}
              onChange={(e) =>
                setConfig((prev) => ({ ...prev, daily_cap_per_phone: e.target.value }))
              }
              disabled={!canUpdate}
            />
            <p className="text-xs text-gray-500">Successful sends per number per IST day.</p>
          </div>
        </div>
        {canUpdate && (
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </Button>
        )}
      </form>

      <div className="bg-white border rounded-lg p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium">Consumers</h3>
          <div className="flex gap-2">
            <Input
              placeholder="Search phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadConsumers(1, search)}
              className="w-48"
            />
            <Button type="button" variant="outline" onClick={() => loadConsumers(1, search)}>
              Search
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Phone</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Today</TableHead>
              <TableHead>7d</TableHead>
              <TableHead>30d</TableHead>
              <TableHead>30d cost</TableHead>
              <TableHead>Last sent</TableHead>
              <TableHead>Status</TableHead>
              {canUpdate && <TableHead />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableLoading ? (
              <TableRow>
                <TableCell colSpan={canUpdate ? 9 : 8} className="text-gray-500">
                  Loading...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canUpdate ? 9 : 8} className="text-gray-500">
                  No OTP sends logged yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.phone}>
                  <TableCell className="font-medium">{row.phone}</TableCell>
                  <TableCell>{row.user_name || '—'}</TableCell>
                  <TableCell>{row.sent_today}</TableCell>
                  <TableCell>{row.sent_7d}</TableCell>
                  <TableCell>{row.sent_30d}</TableCell>
                  <TableCell>{formatInr(row.cost_30d_rupees)}</TableCell>
                  <TableCell>{formatWhen(row.last_sent)}</TableCell>
                  <TableCell>{row.is_blocked ? 'Blocked' : 'Active'}</TableCell>
                  {canUpdate && (
                    <TableCell>
                      <Button
                        size="sm"
                        variant={row.is_blocked ? 'outline' : 'destructive'}
                        onClick={() => toggleBlock(row)}
                      >
                        {row.is_blocked ? 'Unblock OTP' : 'Block OTP'}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {meta.totalPages > 1 && (
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>
              Page {meta.page} of {meta.totalPages} ({meta.total} phones)
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={meta.page <= 1}
                onClick={() => loadConsumers(meta.page - 1, search)}
              >
                Previous
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={meta.page >= meta.totalPages}
                onClick={() => loadConsumers(meta.page + 1, search)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
