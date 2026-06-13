import React, { useEffect, useState } from 'react';
import api from '@/api/axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SMS_CONFIG_KEY = 'sms_config';

export default function OtherSettingsTab() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await api.get('/platform-settings');
      const rows = (res.data.data || []).filter((s) => s.setting_key !== SMS_CONFIG_KEY);
      setSettings(rows);
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (key, value) => {
    try {
      await api.put(`/platform-settings/${key}`, { setting_value: { value } });
      toast.success('Setting saved');
    } catch (e) {
      toast.error(e?.response?.data?.message || 'Failed to save');
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h2 className="text-lg font-medium">Other Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Generic platform key/value settings (excluding SMS configuration).
        </p>
      </div>

      {settings.length === 0 ? (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <p className="text-gray-500 text-sm">No other settings configured yet.</p>
          <SettingForm
            onSave={async (key, value) => {
              await api.put(`/platform-settings/${key}`, {
                setting_value: { value },
                description: key,
              });
              await loadSettings();
            }}
          />
        </div>
      ) : (
        <>
          {settings.map((s) => (
            <div key={s.id} className="bg-white border rounded-lg p-4 space-y-2">
              <Label>{s.setting_key}</Label>
              <Input
                defaultValue={s.setting_value?.value || ''}
                onBlur={(e) => handleSave(s.setting_key, e.target.value)}
              />
              {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
            </div>
          ))}
          <div className="bg-white border rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-medium">Add setting</h3>
            <SettingForm
              onSave={async (key, value) => {
                await api.put(`/platform-settings/${key}`, {
                  setting_value: { value },
                  description: key,
                });
                await loadSettings();
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}

function SettingForm({ onSave }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');

  return (
    <div className="space-y-2">
      <Label>Setting Key</Label>
      <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="app_name" />
      <Label>Value</Label>
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
      <Button
        type="button"
        onClick={async () => {
          await onSave(key, value);
          setKey('');
          setValue('');
        }}
        disabled={!key}
      >
        Add Setting
      </Button>
    </div>
  );
}
