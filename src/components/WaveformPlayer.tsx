import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Film,
  Loader2,
  Pause,
  Play,
  Square,
} from 'lucide-react';
import type { AudioFormat, TtsSettings } from '../types/tts';
import { EMOTIONS } from '../data/voices';
import { buildDownloadFilename, formatDuration } from '../utils/audioUtils';

export interface ActiveAudioState {
  mp3Blob: Blob;
  wavBlob: Blob;
  durationSeconds: number;
  voiceName: string;
  engine: string;
  settings: TtsSettings;
}

interface WaveformPlayerProps {
  activeAudio: ActiveAudioState | null;
  isDirty: boolean;
  isGenerating: boolean;
  isExportingMp4: boolean;
  autoPlaySignal: number;
  onDownloadAudio: (format: AudioFormat) => void;
  onDownloadMp4: () => void;
}

export const WaveformPlayer: React.FC<WaveformPlayerProps> = ({
  activeAudio,
  isDirty,
  isGenerating,
  isExportingMp4,
  autoPlaySignal,
  onDownloadAudio,
  onDownloadMp4,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [previewFormat, setPreviewFormat] = useState<AudioFormat>('mp3');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  const canUseAudio = Boolean(activeAudio && !isDirty && !isGenerating);

  const activeBlob = useMemo(() => {
    if (!activeAudio) return null;
    return previewFormat === 'wav' ? activeAudio.wavBlob : activeAudio.mp3Blob;
  }, [activeAudio, previewFormat]);

  useEffect(() => {
    if (!activeBlob || isDirty) {
      setObjectUrl(null);
      setIsPlaying(false);
      setCurrentTime(0);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
      return;
    }

    const url = URL.createObjectURL(activeBlob);
    setObjectUrl(url);
    setCurrentTime(0);
    setIsPlaying(false);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [activeBlob, isDirty]);

  useEffect(() => {
    if (autoPlaySignal > 0 && objectUrl && audioRef.current && canUseAudio) {
      audioRef.current.currentTime = 0;
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  }, [autoPlaySignal, objectUrl, canUseAudio]);

  const handlePlay = async () => {
    if (!audioRef.current || !canUseAudio || !objectUrl) return;
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handlePause = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const handleStop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current || !canUseAudio) return;
    const nextTime = parseFloat(e.target.value);
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const effectiveDuration = duration || activeAudio?.durationSeconds || 0;
  const emotionLabel = activeAudio
    ? EMOTIONS.find((e) => e.id === activeAudio.settings.emotion)?.label ??
      activeAudio.settings.emotion
    : '';

  return (
    <div
      role="region"
      aria-label="Pemutar Sticky dan Tombol Download"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-6px_24px_rgba(15,23,42,0.08)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 dark:shadow-[0_-6px_24px_rgba(0,0,0,0.4)]"
    >
      <audio
        ref={audioRef}
        src={objectUrl ?? undefined}
        preload="auto"
        onLoadedMetadata={(e) => {
          const el = e.currentTarget;
          if (Number.isFinite(el.duration) && el.duration > 0) {
            setDuration(el.duration);
          }
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <div className="mx-auto max-w-5xl px-3 py-2 sm:px-5 sm:py-2.5">
        {/* Compact Verification / Status Info Row + Scrubber */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] leading-tight">
          {isGenerating ? (
            <div className="flex items-center gap-1.5 font-medium text-blue-600 dark:text-blue-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
              <span>Sedang membuat suara natural...</span>
            </div>
          ) : isDirty ? (
            <div className="flex items-center gap-1.5 font-medium text-amber-700 dark:text-amber-300 truncate">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                Klik <strong>Generate Suara</strong> agar preview &amp; download sesuai setelan terbaru.
              </span>
            </div>
          ) : activeAudio ? (
            <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 min-w-0 truncate">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold truncate">{activeAudio.voiceName}</span>
              <span aria-hidden="true">·</span>
              <span className="hidden sm:inline">{emotionLabel}</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {activeAudio.settings.rate.toFixed(1)}x
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono font-semibold tabular-nums">
                {activeAudio.durationSeconds.toFixed(1)} dtk
              </span>
              <span className="hidden md:inline font-mono text-slate-500 dark:text-slate-400 truncate">
                · {buildDownloadFilename(activeAudio.settings.voiceId, activeAudio.settings.rate, previewFormat)}
              </span>
            </div>
          ) : null}

          {/* Format Toggle + Timecode */}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {formatDuration(currentTime)} / {formatDuration(effectiveDuration)}
            </span>
            <div
              className="inline-flex rounded-md bg-slate-100 p-0.5 dark:bg-slate-800"
              role="group"
              aria-label="Format Preview"
            >
              {(['mp3', 'wav'] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => setPreviewFormat(fmt)}
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase cursor-pointer ${
                    previewFormat === fmt
                      ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Thin Seek Slider */}
        <input
          type="range"
          min={0}
          max={effectiveDuration > 0 ? effectiveDuration : 1}
          step={0.05}
          value={Math.min(currentTime, effectiveDuration || 1)}
          disabled={!canUseAudio}
          onChange={handleScrub}
          aria-label="Posisi putar audio"
          className="studio-slider mt-1.5 block h-1 w-full bg-slate-200 disabled:opacity-40 dark:bg-slate-800"
        />

        {/* Transport & Download Controls Row */}
        <div className="mt-2 flex items-center justify-between gap-2">
          {/* Play / Pause / Stop */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={isPlaying ? handlePause : handlePlay}
              disabled={!canUseAudio}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 dark:disabled:bg-slate-800 dark:disabled:text-slate-500 cursor-pointer whitespace-nowrap"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isPlaying ? (
                <>
                  <Pause className="h-4 w-4" />
                  <span>Jeda</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  <span>Putar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleStop}
              disabled={!canUseAudio || (!isPlaying && currentTime === 0)}
              aria-label="Stop"
              title="Stop"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              <Square className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Direct Download Buttons: MP3, WAV, MP4 */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onDownloadAudio('mp3')}
              disabled={!canUseAudio}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              <span>MP3</span>
            </button>

            <button
              type="button"
              onClick={() => onDownloadAudio('wav')}
              disabled={!canUseAudio}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 sm:px-3.5 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
            >
              <Download className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>WAV</span>
            </button>

            <button
              type="button"
              onClick={onDownloadMp4}
              disabled={!canUseAudio || isExportingMp4}
              title="Download Video MP4 untuk Galeri HP"
              className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-slate-900 px-2.5 sm:px-3.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-blue-600 dark:hover:bg-blue-700 cursor-pointer whitespace-nowrap"
            >
              {isExportingMp4 ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Film className="h-3.5 w-3.5" />
              )}
              <span>MP4</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
