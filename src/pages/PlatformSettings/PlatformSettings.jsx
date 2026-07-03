import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import SmsConfigTab from './SmsConfigTab';
import PremiumBookingTab from './PremiumBookingTab';
import FinanceSettingsTab from './FinanceSettingsTab';
import OtherSettingsTab from './OtherSettingsTab';

const TABS = [
  { id: 'sms', label: 'SMS Config' },
  { id: 'premium', label: 'Premium Booking' },
  { id: 'finance', label: 'Finance Settings' },
  { id: 'other', label: 'Other Settings' },
];

export default function PlatformSettingsPage() {
  const [activeTab, setActiveTab] = useState('sms');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Platform Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage platform-wide configuration for the salon booking system.
        </p>
      </div>

      <div className="border-b flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sms' ? (
        <SmsConfigTab />
      ) : activeTab === 'premium' ? (
        <PremiumBookingTab />
      ) : activeTab === 'finance' ? (
        <FinanceSettingsTab />
      ) : (
        <OtherSettingsTab />
      )}
    </div>
  );
}
