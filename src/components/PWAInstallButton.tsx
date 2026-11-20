import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleClick = async () => {
    if (isInstallable) {
      await install();
      return;
    }
    setShowGuideModal(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 whitespace-nowrap shrink-0 cursor-pointer"
        title="Tambahkan SuaraAlami ke Layar Utama"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        <span>Install Aplikasi</span>
      </button>

      {showGuideModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-guide-title"
        >
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                  <Smartphone className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3
                  id="pwa-guide-title"
                  className="text-base font-semibold text-slate-900 dark:text-white"
                >
                  Tambahkan ke Layar Utama
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 cursor-pointer"
                aria-label="Tutup panduan"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isIOS ? (
              <ol className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                <li>1. Ketuk tombol <strong>Bagikan (Share)</strong> di bar bawah Safari.</li>
                <li>2. Gulir ke bawah lalu pilih <strong>Tambahkan ke Layar Utama</strong>.</li>
                <li>3. Ketuk <strong>Tambah</strong> untuk membuka SuaraAlami seperti aplikasi penuh.</li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                <li>1. Buka menu browser (ikon titik tiga di pojok kanan atas Chrome/Edge).</li>
                <li>2. Pilih <strong>Install Aplikasi</strong> atau <strong>Tambahkan ke Layar Utama</strong>.</li>
                <li>3. Aplikasi akan terpasang dan dapat dijalankan penuh di HP maupun laptop.</li>
              </ol>
            )}

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-28 left-3 z-50 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 shadow-md dark:border-amber-700/60 dark:bg-amber-950 dark:text-amber-100"
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>Mode Offline — Koneksi internet dibutuhkan untuk generate suara baru.</span>
    </div>
  );
};
