import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { selectMyPermissions } from '@/store/permissions/permissionsSlice';

const SMS_CONFIG_KEY = 'sms_config';

const DEFAULT_FORM = {
  enabled: false,
  sms_url: '',
  sms_username: '',
  sms_sendername: '',
  sms_smstype: 'TRANS',
  sms_apikey: '',
  sms_peid: '',
  sms_templateid: '',
  sms_message: 'Your OTP for CATCHY is -- Valid for 5 minutes. Do not share this code.',
};

const FIELD_LIMITS = {
  sms_url: 300,
  sms_username: 100,
  sms_sendername: 30,
  sms_smstype: 20,
  sms_apikey: 200,
  sms_peid: 50,
  sms_templateid: 50,
  sms_message: 500,
};

function normalizeSmsConfig(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_FORM };
  return {
    enabled: raw.enabled !== false,
    sms_url: raw.sms_url || '',
    sms_username: raw.sms_username || '',
    sms_sendername: raw.sms_sendername || '',
    sms_smstype: raw.sms_smstype || 'TRANS',
    sms_apikey: raw.sms_apikey || '',
    sms_peid: raw.sms_peid || '',
    sms_templateid: raw.sms_templateid || '',
    sms_message: raw.sms_message || DEFAULT_FORM.sms_message,
  };
}

function validateForm(form) {
  const errors = {};
  const required = ['sms_url', 'sms_username', 'sms_sendername', 'sms_smstype', 'sms_apikey', 'sms_message'];

  for (const field of required) {
    if (!String(form[field] || '').trim()) {
      errors[field] = 'Required';
    }
  }

  for (const [field, max] of Object.entries(FIELD_LIMITS)) {
    const value = String(form[field] || '');
    if (value.length > max) {
      errors[field] = `Max ${max} characters`;
    }
  }

  if (form.sms_message && !form.sms_message.includes('--')) {
    errors.sms_message = 'Message must include -- as the OTP placeholder';
  }

  return errors;
}

export default function SmsConfigTab() {
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
      const smsRow = rows.find((r) => r.setting_key === SMS_CONFIG_KEY);
      setForm(normalizeSmsConfig(smsRow?.setting_value));
    } catch {
      toast.error('Failed to load SMS configuration');
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
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/platform-settings/${SMS_CONFIG_KEY}`, {
        setting_value: {
          enabled: form.enabled,
          sms_url: form.sms_url.trim(),
          sms_username: form.sms_username.trim(),
          sms_sendername: form.sms_sendername.trim(),
          sms_smstype: form.sms_smstype.trim(),
          sms_apikey: form.sms_apikey.trim(),
          sms_peid: form.sms_peid.trim() || undefined,
          sms_templateid: form.sms_templateid.trim() || undefined,
          sms_message: form.sms_message.trim(),
        },
        description: 'SMS gateway configuration for customer OTP',
      });
      toast.success('SMS configuration saved');
      await loadConfig();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save SMS configuration');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading SMS configuration...</div>;
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-medium">SMS Configuration</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure the SMS gateway settings for sending customer OTP messages.
        </p>
      </div>

      <div className="bg-white border rounded-lg p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Checkbox
            id="sms-enabled"
            checked={form.enabled}
            onCheckedChange={(checked) => updateField('enabled', checked === true)}
            disabled={!canUpdate}
          />
          <Label htmlFor="sms-enabled" className="cursor-pointer">
            Enable SMS OTP delivery
          </Label>
        </div>

        <Field
          label="SMS API URL"
          required
          value={form.sms_url}
          error={errors.sms_url}
          maxLength={FIELD_LIMITS.sms_url}
          onChange={(v) => updateField('sms_url', v)}
          disabled={!canUpdate}
          placeholder="http://sms.messageindia.in/v2/sendSMS"
        />
        <Field
          label="Username"
          required
          value={form.sms_username}
          error={errors.sms_username}
          maxLength={FIELD_LIMITS.sms_username}
          onChange={(v) => updateField('sms_username', v)}
          disabled={!canUpdate}
        />
        <Field
          label="Sender Name"
          required
          value={form.sms_sendername}
          error={errors.sms_sendername}
          maxLength={FIELD_LIMITS.sms_sendername}
          onChange={(v) => updateField('sms_sendername', v)}
          disabled={!canUpdate}
          placeholder="IMRTPS"
        />
        <Field
          label="SMS Type"
          required
          value={form.sms_smstype}
          error={errors.sms_smstype}
          maxLength={FIELD_LIMITS.sms_smstype}
          onChange={(v) => updateField('sms_smstype', v)}
          disabled={!canUpdate}
          placeholder="TRANS"
        />
        <Field
          label="API Key"
          required
          type="password"
          value={form.sms_apikey}
          error={errors.sms_apikey}
          maxLength={FIELD_LIMITS.sms_apikey}
          onChange={(v) => updateField('sms_apikey', v)}
          disabled={!canUpdate}
        />
        <Field
          label="PEID"
          value={form.sms_peid}
          error={errors.sms_peid}
          maxLength={FIELD_LIMITS.sms_peid}
          onChange={(v) => updateField('sms_peid', v)}
          disabled={!canUpdate}
          hint="DLT Principal Entity ID (optional)"
        />
        <Field
          label="Template ID"
          value={form.sms_templateid}
          error={errors.sms_templateid}
          maxLength={FIELD_LIMITS.sms_templateid}
          onChange={(v) => updateField('sms_templateid', v)}
          disabled={!canUpdate}
          hint="DLT Template ID (recommended for India)"
        />

        <div className="space-y-2">
          <Label htmlFor="sms_message">
            Message Template <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="sms_message"
            value={form.sms_message}
            maxLength={FIELD_LIMITS.sms_message}
            rows={4}
            disabled={!canUpdate}
            onChange={(e) => updateField('sms_message', e.target.value)}
            placeholder="Your OTP for CATCHY is -- Valid for 5 minutes."
          />
          {errors.sms_message && (
            <p className="text-xs text-red-600">{errors.sms_message}</p>
          )}
          <p className="text-xs text-gray-500">
            Use <code className="bg-gray-100 px-1 rounded">--</code> in the message where the OTP should appear.
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={!canUpdate || saving}>
          {saving ? 'Saving...' : 'Save SMS Config'}
        </Button>
      </div>

      {!canUpdate && (
        <p className="text-xs text-amber-600">
          You have read-only access. Contact an administrator to update SMS settings.
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  type = 'text',
  maxLength,
  disabled,
  placeholder,
  hint,
}) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </Label>
      <Input
        type={type}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
