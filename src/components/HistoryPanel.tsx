import React from 'react';
import {
  Clock,
  Download,
  Film,
  Loader2,
  Play,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import type { AudioFormat, HistoryItem } from '../types/tts';
import { EMOTIONS, LANGUAGES } from '../data/voices';

interface HistoryPanelProps {
  items: HistoryItem[];
  busyItemId: string | null;
  onReplayItem: (item: HistoryItem) => void;
  onRedownloadAudio: (item: HistoryItem, format: AudioFormat) => void;
  onRedownloadMp4: (item: HistoryItem) => void;
  onLoadToEditor: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  items,
  busyItemId,
  onReplayItem,
  onRedownloadAudio,
  onRedownloadMp4,
  onLoadToEditor,
  onDeleteItem,
  onClearAll,
}) => {
  if (items.length === 0) {
    return (
      <div className="py-6 text-center">
        <Clock className="mx-auto h-6 w-6 text-slate-300 dark:text-slate-600" aria-hidden="true" />
        <p className="mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
          Belum ada riwayat konversi
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          Hasil suara yang Anda generate akan tercatat otomatis di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 pb-1">
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Setiap item di-generate ulang sesuai setelan aslinya saat diputar/diunduh.
        </span>
        <button
          type="button"
          onClick={onClearAll}
          className="rounded-md border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
        >
          Hapus Semua
        </button>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => {
          const isBusy = busyItemId === item.id;
          const langLabel =
            LANGUAGES.find((l) => l.id === item.settings.language)?.label ??
            item.settings.language;
          const emotionLabel =
            EMOTIONS.find((e) => e.id === item.settings.emotion)?.label ??
            item.settings.emotion;

          return (
            <div
              key={item.id}
              className="flex flex-col gap-2 py-2.5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100">
                  &ldquo;{item.settings.text}&rdquo;
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {item.voiceName}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{langLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{emotionLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {item.settings.rate.toFixed(1)}x
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Nada {item.settings.pitch > 0 ? `+${item.settings.pitch}` : item.settings.pitch}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {item.durationSeconds.toFixed(1)} dtk
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  disabled={!!busyItemId}
                  onClick={() => onReplayItem(item)}
                  className="inline-flex h-8 items-center gap-1 rounded-md bg-blue-600 px-2.5 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {isBusy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  <span>Putar</span>
                </button>

                <button
                  type="button"
                  disabled={!!busyItemId}
                  onClick={() => onRedownloadAudio(item, 'mp3')}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                >
                  <Download className="h-3 w-3" />
                  <span>MP3</span>
                </button>

                <button
                  type="button"
                  disabled={!!busyItemId}
                  onClick={() => onRedownloadAudio(item, 'wav')}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                >
                  <Download className="h-3 w-3" />
                  <span>WAV</span>
                </button>

                <button
                  type="button"
                  disabled={!!busyItemId}
                  onClick={() => onRedownloadMp4(item)}
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                >
                  <Film className="h-3 w-3" />
                  <span>MP4</span>
                </button>

                <button
                  type="button"
                  disabled={!!busyItemId}
                  onClick={() => onLoadToEditor(item)}
                  title="Muat ke editor"
                  className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>

                <button
                  type="button"
                  disabled={!!busyItemId}
                  onClick={() => onDeleteItem(item.id)}
                  aria-label="Hapus riwayat"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
