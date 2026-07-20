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
const MSG91_PROVIDER = 'msg91';

const DEFAULT_FORM = {
  provider: MSG91_PROVIDER,
  enabled: false,
  auth_key: '',
  sender_id: '',
  template_id: '',
  message_template: 'Your OTP for CATCHY is --. Valid for 5 minutes. Do not share this code.',
};

const FIELD_LIMITS = {
  auth_key: 200,
  sender_id: 30,
  template_id: 50,
  message_template: 500,
};

function normalizeSmsConfig(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_FORM };

  if (raw.provider === MSG91_PROVIDER) {
    return {
      provider: MSG91_PROVIDER,
      enabled: raw.enabled !== false,
      auth_key: raw.auth_key || '',
      sender_id: raw.sender_id || '',
      template_id: raw.template_id || '',
      message_template: raw.message_template || DEFAULT_FORM.message_template,
    };
  }

  return {
    provider: MSG91_PROVIDER,
    enabled: raw.enabled !== false,
    auth_key: raw.auth_key || raw.sms_apikey || '',
    sender_id: raw.sender_id || raw.sms_sendername || '',
    template_id: raw.template_id || raw.sms_templateid || '',
    message_template: raw.message_template || raw.sms_message || DEFAULT_FORM.message_template,
  };
}

function validateForm(form) {
  const errors = {};
  const required = ['auth_key', 'sender_id', 'template_id', 'message_template'];

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

  if (form.message_template && !form.message_template.includes('--')) {
    errors.message_template = 'Message must include -- as the OTP placeholder';
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
          provider: MSG91_PROVIDER,
          enabled: form.enabled,
          auth_key: form.auth_key.trim(),
          sender_id: form.sender_id.trim(),
          template_id: form.template_id.trim(),
          message_template: form.message_template.trim(),
        },
        description: 'SMS gateway configuration for customer OTP (MSG91)',
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
          Configure MSG91 for sending customer OTP messages.
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
          label="Provider"
          value="MSG91"
          disabled
          hint="SMS delivery provider"
        />
        <Field
          label="Auth Key"
          required
          type="password"
          value={form.auth_key}
          error={errors.auth_key}
          maxLength={FIELD_LIMITS.auth_key}
          onChange={(v) => updateField('auth_key', v)}
          disabled={!canUpdate}
          hint="MSG91 authentication key (authkey header)"
        />
        <Field
          label="Sender ID"
          required
          value={form.sender_id}
          error={errors.sender_id}
          maxLength={FIELD_LIMITS.sender_id}
          onChange={(v) => updateField('sender_id', v)}
          disabled={!canUpdate}
          placeholder="CATCHY"
          hint="Must match the sender ID registered in your MSG91 OTP template"
        />
        <Field
          label="Template ID"
          required
          value={form.template_id}
          error={errors.template_id}
          maxLength={FIELD_LIMITS.template_id}
          onChange={(v) => updateField('template_id', v)}
          disabled={!canUpdate}
          hint="MSG91 OTP template ID from your MSG91 panel"
        />

        <div className="space-y-2">
          <Label htmlFor="message_template">
            Message Template <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="message_template"
            value={form.message_template}
            maxLength={FIELD_LIMITS.message_template}
            rows={4}
            disabled={!canUpdate}
            onChange={(e) => updateField('message_template', e.target.value)}
            placeholder="Your OTP for CATCHY is --. Valid for 5 minutes."
          />
          {errors.message_template && (
            <p className="text-xs text-red-600">{errors.message_template}</p>
          )}
          <p className="text-xs text-gray-500">
            Use <code className="bg-gray-100 px-1 rounded">--</code> where the OTP should appear.
            This must match your MSG91 OTP template (use <code className="bg-gray-100 px-1 rounded">##OTP##</code> in the MSG91 panel).
            Used for reference and validation only — the SMS text is sent from your MSG91 template.
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
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={!onChange}
      />
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
