import React, { useState } from 'react';
import { cn } from '@/lib/utils';

import SmsConfigTab from './SmsConfigTab';
import PremiumBookingTab from './PremiumBookingTab';
import FinanceSettingsTab from './FinanceSettingsTab';
import OtherSettingsTab from './OtherSettingsTab';

const TABS = [
  {
    id: 'sms',
    label: 'SMS Config',
    description: 'OTP & messaging',
  },
  {
    id: 'premium',
    label: 'Premium Booking',
    description: 'Booking controls',
  },
  {
    id: 'finance',
    label: 'Finance Settings',
    description: 'Payments & fees',
  },
  {
    id: 'other',
    label: 'Other Settings',
    description: 'General configuration',
  },
];

export default function PlatformSettingsPage() {
  const [activeTab, setActiveTab] = useState('sms');

  const activeTabData =
    TABS.find((tab) => tab.id === activeTab) || TABS[0];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'premium':
        return <PremiumBookingTab />;

      case 'finance':
        return <FinanceSettingsTab />;

      case 'other':
        return <OtherSettingsTab />;

      case 'sms':
      default:
        return <SmsConfigTab />;
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8fc] px-4 py-4 sm:px-5 lg:px-6">
      <div className="mx-auto max-w-[1500px] space-y-4">

        {/* =========================================================
            PAGE HEADER
            ========================================================= */}
        <section
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            px-5 py-4
            shadow-[0_4px_18px_rgba(15,23,42,0.035)]
            sm:px-6
          "
        >
          <div
            className="
              flex
              flex-col
              gap-3
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="
                    flex h-9 w-9 shrink-0
                    items-center justify-center
                    rounded-lg
                    bg-violet-50
                    text-violet-600
                  "
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-[18px] w-[18px]"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-1.9 1.9-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20h-2.68v-.09a1.7 1.7 0 0 0-1.03-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-1.9-1.9.06-.06A1.7 1.7 0 0 0 7.8 15a1.7 1.7 0 0 0-1.56-1.03H6v-2.68h.24A1.7 1.7 0 0 0 7.8 10.3a1.7 1.7 0 0 0-.34-1.88L7.4 8.36l1.9-1.9.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 12.27 5.3V5h2.68v.3a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 1.9 1.9-.06.06a1.7 1.7 0 0 0-.34 1.88 1.7 1.7 0 0 0 1.56 1.03h.24v2.68h-.24A1.7 1.7 0 0 0 19.4 15Z"
                    />
                  </svg>
                </div>

                <h1
                  className="
                    text-[23px]
                    font-bold
                    tracking-[-0.035em]
                    text-slate-950
                    sm:text-[25px]
                  "
                >
                  Platform Settings
                </h1>
              </div>

              <p
                className="
                  mt-1.5
                  pl-0
                  text-[12px]
                  leading-5
                  text-slate-500
                  sm:pl-[45px]
                "
              >
                Manage platform-wide configuration for the salon booking
                system.
              </p>
            </div>

            {/* Current section indicator */}
            <div
              className="
                hidden
                items-center
                gap-2
                rounded-xl
                border border-slate-200
                bg-slate-50
                px-3 py-2
                lg:flex
              "
            >
              <span className="h-2 w-2 rounded-full bg-violet-500" />

              <div>
                <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-slate-400">
                  Current section
                </p>

                <p className="mt-0.5 text-[11px] font-semibold text-slate-700">
                  {activeTabData.label}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            SETTINGS TABS
            ========================================================= */}
        <section
          className="
            rounded-2xl
            border border-slate-200
            bg-white
            p-2
            shadow-[0_4px_18px_rgba(15,23,42,0.035)]
          "
        >
          <div
            className="
              grid
              grid-cols-1
              gap-1
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={isActive}
                  className={cn(
                    `
                      group
                      relative
                      flex
                      min-h-[54px]
                      items-center
                      gap-3
                      rounded-xl
                      px-3.5
                      py-2.5
                      text-left
                      transition-all
                      duration-200
                    `,
                    isActive
                      ? `
                        bg-violet-50
                        text-violet-700
                        shadow-sm
                        ring-1 ring-violet-100
                      `
                      : `
                        text-slate-500
                        hover:bg-slate-50
                        hover:text-slate-800
                      `
                  )}
                >
                  <span
                    className={cn(
                      `
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        text-[12px]
                        font-bold
                      `,
                      isActive
                        ? 'bg-violet-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                    )}
                  >
                    {tab.id === 'sms' && '01'}
                    {tab.id === 'premium' && '02'}
                    {tab.id === 'finance' && '03'}
                    {tab.id === 'other' && '04'}
                  </span>

                  <span className="min-w-0">
                    <span
                      className={cn(
                        `
                          block
                          text-[12px]
                          font-semibold
                          leading-4
                        `,
                        isActive
                          ? 'text-violet-700'
                          : 'text-slate-700'
                      )}
                    >
                      {tab.label}
                    </span>

                    <span
                      className={cn(
                        `
                          mt-0.5
                          block
                          text-[10px]
                          leading-4
                        `,
                        isActive
                          ? 'text-violet-500'
                          : 'text-slate-400'
                      )}
                    >
                      {tab.description}
                    </span>
                  </span>

                  {isActive && (
                    <span
                      className="
                        absolute
                        right-3
                        h-1.5
                        w-1.5
                        rounded-full
                        bg-violet-500
                      "
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* =========================================================
            ACTIVE SETTINGS CONTENT
            ========================================================= */}
        <section
          key={activeTab}
          className="
            min-w-0
            animate-[settingsFadeIn_180ms_ease-out]
          "
        >
          {renderActiveTab()}
        </section>
      </div>

      {/* Small page-only animation. No dependency required. */}
      <style>{`
        @keyframes settingsFadeIn {
          from {
            opacity: 0;
            transform: translateY(3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}