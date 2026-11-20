import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2, Play, Square } from 'lucide-react';
import { VOICES } from '../data/voices';
import type { LanguageCode, VoiceProfile } from '../types/tts';
import { base64ToBlob } from '../utils/audioUtils';

interface VoiceSelectorProps {
  selectedVoiceId: string;
  language: LanguageCode;
  onSelectVoice: (voiceId: string) => void;
}

type VoiceFilter = 'all' | 'Wanita' | 'Pria' | 'Narator';

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoiceId,
  language,
  onSelectVoice,
}) => {
  const [filter, setFilter] = useState<VoiceFilter>('all');
  const [samplingVoiceId, setSamplingVoiceId] = useState<string | null>(null);
  const [playingSampleId, setPlayingSampleId] = useState<string | null>(null);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const sampleAudioRef = useRef<HTMLAudioElement | null>(null);
  const sampleUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (sampleAudioRef.current) {
        sampleAudioRef.current.pause();
      }
      if (sampleUrlRef.current) {
        URL.revokeObjectURL(sampleUrlRef.current);
      }
    };
  }, []);

  const filteredVoices = VOICES.filter((v) => {
    if (filter === 'all') return true;
    if (filter === 'Narator') return v.ageGroup === 'Narator' || v.gender === 'Anak';
    return v.gender === filter;
  });

  const handlePlaySample = async (e: React.MouseEvent, voice: VoiceProfile) => {
    e.stopPropagation();
    setSampleError(null);

    if (playingSampleId === voice.id && sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      sampleAudioRef.current.currentTime = 0;
      setPlayingSampleId(null);
      return;
    }

    if (sampleAudioRef.current) {
      sampleAudioRef.current.pause();
      setPlayingSampleId(null);
    }

    setSamplingVoiceId(voice.id);
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.sampleLine[language],
          voiceId: voice.id,
          language,
          emotion: 'normal',
          rate: 1.0,
          pitch: 0,
          volume: 100,
          pause: 'natural',
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Gagal memutar sampel suara.');
      }

      if (sampleUrlRef.current) {
        URL.revokeObjectURL(sampleUrlRef.current);
      }

      const blob = base64ToBlob(data.mp3Base64, 'audio/mpeg');
      const url = URL.createObjectURL(blob);
      sampleUrlRef.current = url;

      const audio = new Audio(url);
      sampleAudioRef.current = audio;
      audio.onended = () => setPlayingSampleId(null);
      audio.onerror = () => setPlayingSampleId(null);

      await audio.play();
      setPlayingSampleId(voice.id);
    } catch (err) {
      setSampleError(err instanceof Error ? err.message : 'Gagal memutar sampel.');
    } finally {
      setSamplingVoiceId(null);
    }
  };

  return (
    <div className="space-y-2.5">
      {/* Compact Filter Tabs */}
      <div
        className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800"
        role="tablist"
        aria-label="Filter kategori suara"
      >
        {(
          [
            { id: 'all', label: 'Semua' },
            { id: 'Wanita', label: 'Wanita' },
            { id: 'Pria', label: 'Pria' },
            { id: 'Narator', label: 'Narator & Anak' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={filter === tab.id}
            onClick={() => setFilter(tab.id)}
            className={`flex-1 rounded-md px-2 py-1 text-[11px] sm:text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              filter === tab.id
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sampleError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {sampleError}
        </div>
      )}

      {/* Compact 2-Column Voice Grid (4 columns on wide desktop) */}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          const isLoadingSample = samplingVoiceId === voice.id;
          const isPlayingThis = playingSampleId === voice.id;

          return (
            <div
              key={voice.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectVoice(voice.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectVoice(voice.id);
                }
              }}
              aria-pressed={isSelected}
              className={`flex flex-col justify-between rounded-lg border p-2.5 text-left transition-colors cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      style={{ backgroundColor: voice.accentColor }}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-bold text-white"
                    >
                      {voice.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                        {voice.name}
                      </h3>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {voice.category}
                      </p>
                    </div>
                  </div>
                  {isSelected && (
                    <span
                      className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white"
                      aria-label="Dipilih"
                    >
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  )}
                </div>

                <p className="mt-1.5 line-clamp-2 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
                  {voice.tagline}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={(e) => handlePlaySample(e, voice)}
                  disabled={isLoadingSample}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                >
                  {isLoadingSample ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Muat...</span>
                    </>
                  ) : isPlayingThis ? (
                    <>
                      <Square className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span>Sampel</span>
                    </>
                  )}
                </button>

                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {isSelected ? 'Aktif' : 'Pilih'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
