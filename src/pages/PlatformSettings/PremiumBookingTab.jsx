import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { selectMyPermissions } from '@/store/permissions/permissionsSlice';

const PREMIUM_CONFIG_KEY = 'premium_booking_config';

const DEFAULT_FORM = {
  enabled: true,
  fee: 199,
  currency: 'INR',
  payment_window_minutes: 15,
};

function normalizePremiumConfig(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_FORM };
  const windowMinutes = Number(raw.payment_window_minutes);
  return {
    enabled: raw.enabled !== false,
    fee: Number(raw.fee) || 199,
    currency: raw.currency || 'INR',
    payment_window_minutes: Number.isFinite(windowMinutes) && windowMinutes >= 1
      ? Math.min(120, Math.round(windowMinutes))
      : 15,
  };
}

export default function PremiumBookingTab() {
  const myPermissions = useSelector(selectMyPermissions) || [];
  const canUpdate = myPermissions.includes('platformSetting.update');

  const [form, setForm] = useState(DEFAULT_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/platform-settings');
      const rows = res.data.data || [];
      const row = rows.find((r) => r.setting_key === PREMIUM_CONFIG_KEY);
      setForm(normalizePremiumConfig(row?.setting_value));
    } catch {
      toast.error('Failed to load premium booking configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const nextErrors = {};
    if (!form.fee || Number(form.fee) <= 0) nextErrors.fee = 'Fee must be greater than 0';
    if (!String(form.currency || '').trim()) nextErrors.currency = 'Required';
    const windowMinutes = Number(form.payment_window_minutes);
    if (!Number.isFinite(windowMinutes) || windowMinutes < 1 || windowMinutes > 120) {
      nextErrors.payment_window_minutes = 'Must be between 1 and 120 minutes';
    }
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/platform-settings/${PREMIUM_CONFIG_KEY}`, {
        setting_value: {
          enabled: form.enabled,
          fee: Number(form.fee),
          currency: String(form.currency).trim().toUpperCase(),
          payment_window_minutes: Number(form.payment_window_minutes),
        },
        description: 'Default premium urgent booking fee and payment window',
      });
      toast.success('Premium booking configuration saved');
      await loadConfig();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading premium booking settings...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-medium">Premium / Urgent Booking</h2>
        <p className="text-sm text-gray-500 mt-1">
          Control whether urgent bookings are enabled platform-wide, set the default fee,
          and how long customers have to pay after a salon accepts. Salon owners can set
          their own fee per salon in the mobile app; salons without a custom fee use this
          default.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Checkbox
            id="premium-enabled"
            checked={form.enabled}
            onCheckedChange={(checked) => updateField('enabled', checked === true)}
            disabled={!canUpdate}
          />
          <Label htmlFor="premium-enabled" className="cursor-pointer">
            Enable premium urgent bookings
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="premium_fee">
            Default urgent booking fee <span className="text-red-500">*</span>
          </Label>
          <Input
            id="premium_fee"
            type="number"
            min="1"
            step="1"
            value={form.fee}
            disabled={!canUpdate}
            onChange={(e) => updateField('fee', e.target.value)}
          />
          {errors.fee && <p className="text-xs text-red-600">{errors.fee}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="premium_currency">
            Currency <span className="text-red-500">*</span>
          </Label>
          <Input
            id="premium_currency"
            value={form.currency}
            maxLength={10}
            disabled={!canUpdate}
            onChange={(e) => updateField('currency', e.target.value)}
            placeholder="INR"
          />
          {errors.currency && <p className="text-xs text-red-600">{errors.currency}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="payment_window_minutes">
            Payment window after accept <span className="text-red-500">*</span>
          </Label>
          <Input
            id="payment_window_minutes"
            type="number"
            min="1"
            max="120"
            step="1"
            value={form.payment_window_minutes}
            disabled={!canUpdate}
            onChange={(e) => updateField('payment_window_minutes', e.target.value)}
          />
          {errors.payment_window_minutes && (
            <p className="text-xs text-red-600">{errors.payment_window_minutes}</p>
          )}
          <p className="text-xs text-gray-500">
            Minutes the customer has to pay the premium fee after the salon accepts.
            If unpaid, the urgent booking is cancelled and the slot is freed. 1–120.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canUpdate || saving}>
          {saving ? 'Saving...' : 'Save Premium Config'}
        </Button>
      </div>

      {!canUpdate && (
        <p className="text-xs text-amber-600">
          You have read-only access. Contact an administrator to update settings.
        </p>
      )}
    </form>
  );
}
