import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type StudioTab = 'buat' | 'setting' | 'riwayat';

interface StudioHeaderProps {
  isDark: boolean;
  onToggleTheme: () => void;
  activeTab: StudioTab;
  onSelectTab: (tab: StudioTab) => void;
  historyCount: number;
}

export const StudioHeader: React.FC<StudioHeaderProps> = ({
  isDark,
  onToggleTheme,
  activeTab,
  onSelectTab,
  historyCount,
}) => {
  const tabs: { id: StudioTab; label: string }[] = [
    { id: 'buat', label: 'Buat Suara' },
    { id: 'setting', label: 'Suara & Setting' },
    {
      id: 'riwayat',
      label: historyCount > 0 ? `Riwayat (${historyCount})` : 'Riwayat',
    },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95">
      {/* Compact Brand & Actions Row */}
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-3 py-2 sm:px-5">
        <button
          type="button"
          onClick={() => onSelectTab('buat')}
          className="flex items-center gap-2 text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-white">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="3" y="9" width="2.5" height="6" rx="1.25" />
              <rect x="7.5" y="5" width="2.5" height="14" rx="1.25" />
              <rect x="12" y="2.5" width="2.5" height="19" rx="1.25" />
              <rect x="16.5" y="6.5" width="2.5" height="11" rx="1.25" />
              <rect x="21" y="9.5" width="2" height="5" rx="1" />
            </svg>
          </span>
          <span>SuaraAlami</span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            aria-label={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            title={isDark ? 'Mode Terang' : 'Mode Gelap'}
          >
            {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
          <PWAInstallButton />
        </div>
      </div>

      {/* Sticky 3-Tab Navigation Bar */}
      <nav
        aria-label="Navigasi Utama Studio"
        className="mx-auto grid max-w-5xl grid-cols-3 border-t border-slate-100 px-3 sm:px-5 dark:border-slate-800/80"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative py-2.5 text-center text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap truncate cursor-pointer ${
                active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400"
                />
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
