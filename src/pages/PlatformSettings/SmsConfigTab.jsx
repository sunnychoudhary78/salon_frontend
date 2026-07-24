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
const DEFAULT_OTP_VAR_NAME = 'OTP';

const DEFAULT_FORM = {
  provider: MSG91_PROVIDER,
  enabled: false,
  auth_key: '',
  sender_id: '',
  flow_id: '',
  otp_var_name: DEFAULT_OTP_VAR_NAME,
  message_template: 'Your OTP for CATCHY is --. Valid for 5 minutes. Do not share this code.',
};

const FIELD_LIMITS = {
  auth_key: 200,
  sender_id: 30,
  flow_id: 50,
  otp_var_name: 40,
  message_template: 500,
};

function normalizeSmsConfig(raw) {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_FORM };

  const flowId = raw.flow_id || raw.template_id || raw.sms_templateid || '';

  if (raw.provider === MSG91_PROVIDER) {
    return {
      provider: MSG91_PROVIDER,
      enabled: raw.enabled !== false,
      auth_key: raw.auth_key || '',
      sender_id: raw.sender_id || '',
      flow_id: flowId,
      otp_var_name: raw.otp_var_name || DEFAULT_OTP_VAR_NAME,
      message_template: raw.message_template || DEFAULT_FORM.message_template,
    };
  }

  return {
    provider: MSG91_PROVIDER,
    enabled: raw.enabled !== false,
    auth_key: raw.auth_key || raw.sms_apikey || '',
    sender_id: raw.sender_id || raw.sms_sendername || '',
    flow_id: flowId,
    otp_var_name: raw.otp_var_name || DEFAULT_OTP_VAR_NAME,
    message_template: raw.message_template || raw.sms_message || DEFAULT_FORM.message_template,
  };
}

function validateForm(form) {
  const errors = {};
  const required = ['auth_key', 'sender_id', 'flow_id', 'otp_var_name', 'message_template'];

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
      const flowId = form.flow_id.trim();
      await api.put(`/platform-settings/${SMS_CONFIG_KEY}`, {
        setting_value: {
          provider: MSG91_PROVIDER,
          enabled: form.enabled,
          auth_key: form.auth_key.trim(),
          sender_id: form.sender_id.trim(),
          flow_id: flowId,
          // Legacy alias so older readers still resolve the Flow ID
          template_id: flowId,
          otp_var_name: form.otp_var_name.trim() || DEFAULT_OTP_VAR_NAME,
          message_template: form.message_template.trim(),
        },
        description:
          'SMS gateway configuration for customer OTP via MSG91 Flow/OneAPI (DLT SMS templates)',
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
          Configure MSG91 Flow/OneAPI for customer OTP SMS (same templates as Test DLT).
          Use the MSG91 SMS Template / Flow ID — not the DLT TE ID.
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
          value="MSG91 (Flow / OneAPI)"
          disabled
          hint="Sends via POST /api/v5/flow — matches DLT SMS templates"
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
          hint="Sent as sender in the Flow API. Must match the DLT-approved header mapped on your MSG91 SMS template."
        />
        <Field
          label="Flow / SMS Template ID"
          required
          value={form.flow_id}
          error={errors.flow_id}
          maxLength={FIELD_LIMITS.flow_id}
          onChange={(v) => updateField('flow_id', v)}
          disabled={!canUpdate}
          hint="Copy from MSG91 SMS → Templates (the ID used by Test DLT). Do not paste the DLT TE ID or an OTP-section template ID."
        />
        <Field
          label="OTP Variable Name"
          required
          value={form.otp_var_name}
          error={errors.otp_var_name}
          maxLength={FIELD_LIMITS.otp_var_name}
          onChange={(v) => updateField('otp_var_name', v)}
          disabled={!canUpdate}
          placeholder="OTP"
          hint="Must match the variable in your MSG91 flow (e.g. OTP for ##OTP##, or VAR1 for ##VAR1##)."
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
            Reference/preview only — the SMS text is sent from your MSG91 Flow template (DLT-approved content).
            In MSG91 use <code className="bg-gray-100 px-1 rounded">##OTP##</code> (or your configured variable) matching the OTP Variable Name above.
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
