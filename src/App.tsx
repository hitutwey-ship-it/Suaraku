import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowUp,
  ChevronDown,
  FileText,
  Loader2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { HistoryPanel } from './components/HistoryPanel';
import { OfflineIndicator } from './components/PWAInstallButton';
import { StudioHeader, type StudioTab } from './components/StudioHeader';
import { VoiceSelector } from './components/VoiceSelector';
import { type ActiveAudioState, WaveformPlayer } from './components/WaveformPlayer';
import {
  DEFAULT_SCRIPT,
  EMOTIONS,
  LANGUAGES,
  PAUSE_MODES,
  getVoiceById,
} from './data/voices';
import type {
  AudioFormat,
  HistoryItem,
  LanguageCode,
  TtsSettings,
} from './types/tts';
import {
  base64ToBlob,
  buildDownloadFilename,
  renderMp4CoverBlob,
  triggerBlobDownload,
} from './utils/audioUtils';

const HISTORY_STORAGE_KEY = 'suaraalami_history_v1';
const THEME_STORAGE_KEY = 'suaraalami_theme_v1';
const MAX_HISTORY_ITEMS = 15;

type AccordionKey = 'suara' | 'emosi' | 'prosody' | 'riwayat';

function loadSavedHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

interface AccordionItemProps {
  title: string;
  summary: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const AccordionItem: React.FC<AccordionItemProps> = ({
  title,
  summary,
  isOpen,
  onToggle,
  children,
}) => (
  <section className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
    >
      <div className="min-w-0 flex-1">
        <h2 className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
          {summary}
        </p>
      </div>
      <ChevronDown
        className={`h-4 w-4 shrink-0 text-slate-500 transition-transform duration-200 dark:text-slate-400 ${
          isOpen ? 'rotate-180' : ''
        }`}
        aria-hidden="true"
      />
    </button>
    {isOpen && (
      <div className="border-t border-slate-100 p-3 dark:border-slate-800">
        {children}
      </div>
    )}
  </section>
);

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage failures
    }
  }, [isDark]);

  const [settings, setSettings] = useState<TtsSettings>({
    text: DEFAULT_SCRIPT.id,
    voiceId: 'laras',
    language: 'id',
    emotion: 'normal',
    rate: 1.0,
    pitch: 0,
    volume: 100,
    pause: 'natural',
  });

  const [activeTab, setActiveTab] = useState<StudioTab>('buat');
  const [openAccordion, setOpenAccordion] = useState<AccordionKey | null>('suara');
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [activeAudio, setActiveAudio] = useState<ActiveAudioState | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingMp4, setIsExportingMp4] = useState(false);
  const [isParsingFile, setIsParsingFile] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [autoPlaySignal, setAutoPlaySignal] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>(() => loadSavedHistory());
  const [busyHistoryId, setBusyHistoryId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // Ignore storage quota issues
    }
  }, [history]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 180);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectTab = (tab: StudioTab) => {
    setActiveTab(tab);
    if (tab === 'setting') {
      setOpenAccordion('suara');
    } else if (tab === 'riwayat') {
      setOpenAccordion('riwayat');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleAccordion = (key: AccordionKey) => {
    setOpenAccordion((prev) => (prev === key ? null : key));
  };

  // Any parameter change immediately invalidates active audio so Download & Preview
  // are locked until the user re-generates audio with the new settings.
  const updateSettings = (patch: Partial<TtsSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    setActiveAudio(null);
    setErrorMsg(null);
  };

  const handleLanguageChange = (newLang: LanguageCode) => {
    const isUsingDefaultSample = Object.values(DEFAULT_SCRIPT).some(
      (sample) => sample.trim() === settings.text.trim()
    );
    updateSettings({
      language: newLang,
      ...(isUsingDefaultSample ? { text: DEFAULT_SCRIPT[newLang] } : {}),
    });
  };

  const charCount = settings.text.length;
  const wordCount = useMemo(() => {
    const trimmed = settings.text.trim();
    return trimmed ? trimmed.split(/\s+/).length : 0;
  }, [settings.text]);

  const currentVoice = getVoiceById(settings.voiceId);
  const currentEmotion =
    EMOTIONS.find((e) => e.id === settings.emotion) ?? EMOTIONS[0];
  const currentPause =
    PAUSE_MODES.find((p) => p.id === settings.pause) ?? PAUSE_MODES[1];
  const isDirty = activeAudio === null;

  const requestTtsGeneration = async (
    targetSettings: TtsSettings
  ): Promise<ActiveAudioState> => {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetSettings),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Gagal menghasilkan suara.');
    }

    const mp3Blob = base64ToBlob(data.mp3Base64, 'audio/mpeg');
    const wavBlob = base64ToBlob(data.wavBase64, 'audio/wav');

    return {
      mp3Blob,
      wavBlob,
      durationSeconds: Number(data.durationSeconds) || 0,
      voiceName: data.voiceName || getVoiceById(targetSettings.voiceId).name,
      engine: data.engine || 'gemini-neural-tts',
      settings: data.appliedSettings || targetSettings,
    };
  };

  const addHistoryEntry = (generated: ActiveAudioState) => {
    const entry: HistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: new Date().toISOString(),
      settings: { ...generated.settings },
      voiceName: generated.voiceName,
      durationSeconds: generated.durationSeconds,
      engine: generated.engine,
    };
    setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY_ITEMS));
  };

  const handleGenerate = async () => {
    if (!settings.text.trim()) {
      setErrorMsg('Silakan ketik atau unggah teks terlebih dahulu.');
      return;
    }

    setErrorMsg(null);
    setIsGenerating(true);
    setActiveAudio(null);

    try {
      const result = await requestTtsGeneration(settings);
      setActiveAudio(result);
      addHistoryEntry(result);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Terjadi gangguan saat memproses suara. Silakan coba lagi.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadAudio = (format: AudioFormat) => {
    if (!activeAudio || isDirty) return;
    const blob = format === 'wav' ? activeAudio.wavBlob : activeAudio.mp3Blob;
    const filename = buildDownloadFilename(
      activeAudio.settings.voiceId,
      activeAudio.settings.rate,
      format
    );
    triggerBlobDownload(blob, filename);
  };

  const exportAudioToMp4 = async (audioState: ActiveAudioState) => {
    const voiceProfile = getVoiceById(audioState.settings.voiceId);
    const emotionLabel =
      EMOTIONS.find((e) => e.id === audioState.settings.emotion)?.label ??
      audioState.settings.emotion;

    const coverBlob = await renderMp4CoverBlob({
      voiceName: audioState.voiceName,
      category: voiceProfile.category,
      emotionLabel,
      rate: audioState.settings.rate,
      durationSeconds: audioState.durationSeconds,
      snippet: audioState.settings.text,
    });

    const filename = buildDownloadFilename(
      audioState.settings.voiceId,
      audioState.settings.rate,
      'mp4'
    );

    const formData = new FormData();
    formData.append('audio', audioState.wavBlob, 'audio.wav');
    formData.append('cover', coverBlob, 'cover.jpg');
    formData.append('filename', filename);

    const response = await fetch('/api/tts/export-mp4', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Gagal membuat video MP4.');
    }

    const mp4Blob = await response.blob();
    triggerBlobDownload(mp4Blob, filename);
  };

  const handleDownloadMp4 = async () => {
    if (!activeAudio || isDirty) return;
    setErrorMsg(null);
    setIsExportingMp4(true);
    try {
      await exportAudioToMp4(activeAudio);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengekspor video MP4.'
      );
    } finally {
      setIsExportingMp4(false);
    }
  };

  const handleReplayHistory = async (item: HistoryItem) => {
    setErrorMsg(null);
    setBusyHistoryId(item.id);
    setSettings({ ...item.settings });
    setActiveAudio(null);

    try {
      const fresh = await requestTtsGeneration(item.settings);
      setActiveAudio(fresh);
      setAutoPlaySignal((n) => n + 1);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal memutar ulang riwayat.'
      );
    } finally {
      setBusyHistoryId(null);
    }
  };

  const handleRedownloadHistoryAudio = async (
    item: HistoryItem,
    format: AudioFormat
  ) => {
    setErrorMsg(null);
    setBusyHistoryId(item.id);
    try {
      const fresh = await requestTtsGeneration(item.settings);
      const blob = format === 'wav' ? fresh.wavBlob : fresh.mp3Blob;
      const filename = buildDownloadFilename(
        fresh.settings.voiceId,
        fresh.settings.rate,
        format
      );
      triggerBlobDownload(blob, filename);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengunduh ulang file.'
      );
    } finally {
      setBusyHistoryId(null);
    }
  };

  const handleRedownloadHistoryMp4 = async (item: HistoryItem) => {
    setErrorMsg(null);
    setBusyHistoryId(item.id);
    try {
      const fresh = await requestTtsGeneration(item.settings);
      await exportAudioToMp4(fresh);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengunduh ulang Video MP4.'
      );
    } finally {
      setBusyHistoryId(null);
    }
  };

  const handleLoadHistoryToEditor = (item: HistoryItem) => {
    updateSettings({ ...item.settings });
    handleSelectTab('buat');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setErrorMsg(null);
    setIsParsingFile(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'txt') {
        const txt = await file.text();
        if (!txt.trim()) throw new Error('File teks kosong.');
        updateSettings({ text: txt.slice(0, 5000) });
        setUploadedFileName(file.name);
      } else if (ext === 'pdf') {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/parse-document', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal membaca file PDF.');
        updateSettings({ text: String(data.text || '').slice(0, 5000) });
        setUploadedFileName(file.name);
      } else {
        throw new Error('Format tidak didukung. Pilih file .txt atau .pdf.');
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal memproses file dokumen.'
      );
    } finally {
      setIsParsingFile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <StudioHeader
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        historyCount={history.length}
      />

      <main className="mx-auto max-w-5xl space-y-3 px-3 pt-3 pb-32 sm:px-5 sm:pt-4">
        {/* Global Error Banner */}
        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
            <span className="flex-1">{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="font-semibold underline hover:no-underline cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}

        {/* TAB 1: BUAT SUARA */}
        {activeTab === 'buat' && (
          <section
            aria-label="Editor Naskah Suara"
            className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Compact Toolbar: Language + Upload/Clear */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
              <div
                className="inline-flex items-center gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-slate-800"
                role="group"
                aria-label="Pilihan Bahasa"
              >
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    onClick={() => handleLanguageChange(lang.id)}
                    className={`rounded-md px-2.5 py-1 text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                      settings.language === lang.id
                        ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    {lang.id === 'id'
                      ? 'Indonesia'
                      : lang.id === 'en'
                        ? 'English'
                        : 'Sunda'}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.pdf,text/plain,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isParsingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                >
                  {isParsingFile ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3" />
                  )}
                  <span>.txt / .pdf</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ text: DEFAULT_SCRIPT[settings.language] });
                    setUploadedFileName(null);
                  }}
                  title="Muat teks contoh"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span className="hidden sm:inline">Contoh</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updateSettings({ text: '' });
                    setUploadedFileName(null);
                  }}
                  title="Kosongkan teks"
                  aria-label="Kosongkan teks"
                  className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 cursor-pointer"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>

            {uploadedFileName && (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-blue-400">
                <FileText className="h-3 w-3 shrink-0" />
                <span className="truncate">Dokumen: {uploadedFileName}</span>
              </div>
            )}

            {/* Compact Textarea */}
            <div className="mt-2.5">
              <label htmlFor="tts-script-input" className="sr-only">
                Naskah Teks untuk Voiceover
              </label>
              <textarea
                id="tts-script-input"
                value={settings.text}
                maxLength={5000}
                onChange={(e) => updateSettings({ text: e.target.value })}
                placeholder="Ketik atau tempel naskah voiceover di sini... Gunakan tanda koma, titik, tanya (?), dan seru (!) agar intonasi terdengar natural."
                className="min-h-[160px] sm:min-h-[210px] w-full resize-y rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-sm sm:text-base leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
              />
            </div>

            {/* Word & Char Count + Quick Active Preset Bar */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <button
                type="button"
                onClick={() => handleSelectTab('setting')}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-left font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 cursor-pointer truncate max-w-full"
              >
                <SlidersHorizontal className="h-3 w-3 shrink-0 text-blue-600 dark:text-blue-400" />
                <span className="truncate">
                  {currentVoice.name} · {currentEmotion.label} ·{' '}
                  <span className="font-mono tabular-nums">
                    {settings.rate.toFixed(1)}x
                  </span>{' '}
                  · Nada{' '}
                  <span className="font-mono tabular-nums">
                    {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch}
                  </span>
                </span>
                <span className="text-blue-600 dark:text-blue-400 font-semibold shrink-0">
                  Ubah
                </span>
              </button>

              <div className="font-mono tabular-nums ml-auto">
                {wordCount} kata · {charCount}/5.000
              </div>
            </div>

            {/* Primary Generate CTA */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !settings.text.trim()}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menghasilkan Suara Natural...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Suara</span>
                </>
              )}
            </button>
          </section>
        )}

        {/* TAB 2: SUARA & SETTING (Collapsible Accordions) */}
        {activeTab === 'setting' && (
          <div className="space-y-2.5">
            {/* Accordion 1: Karakter Suara */}
            <AccordionItem
              title="1. Karakter Suara"
              summary={`${currentVoice.name} · ${currentVoice.category}`}
              isOpen={openAccordion === 'suara'}
              onToggle={() => toggleAccordion('suara')}
            >
              <VoiceSelector
                selectedVoiceId={settings.voiceId}
                language={settings.language}
                onSelectVoice={(voiceId) => updateSettings({ voiceId })}
              />
            </AccordionItem>

            {/* Accordion 2: Emosi / Gaya Bicara */}
            <AccordionItem
              title="2. Emosi & Gaya Bicara"
              summary={`${currentEmotion.label} — ${currentEmotion.description}`}
              isOpen={openAccordion === 'emosi'}
              onToggle={() => toggleAccordion('emosi')}
            >
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {EMOTIONS.map((emo) => {
                  const active = settings.emotion === emo.id;
                  return (
                    <button
                      key={emo.id}
                      type="button"
                      onClick={() => updateSettings({ emotion: emo.id })}
                      className={`rounded-lg border px-2.5 py-2 text-left transition-colors cursor-pointer ${
                        active
                          ? 'border-blue-600 bg-blue-600 text-white'
                          : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-300 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-semibold">{emo.label}</div>
                      <div
                        className={`text-[10px] truncate ${
                          active
                            ? 'text-blue-100'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {emo.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </AccordionItem>

            {/* Accordion 3: Kontrol Prosody (Compact Short Sliders) */}
            <AccordionItem
              title="3. Kontrol Prosody (Kecepatan, Nada, Volume & Jeda)"
              summary={`Kecepatan ${settings.rate.toFixed(1)}x · Nada ${
                settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch
              } · Vol ${settings.volume}% · Jeda ${currentPause.label}`}
              isOpen={openAccordion === 'prosody'}
              onToggle={() => toggleAccordion('prosody')}
            >
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {/* Speed */}
                <div className="max-w-sm">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="slider-rate"
                      className="font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Kecepatan
                    </label>
                    <span className="font-mono font-semibold text-blue-600 tabular-nums dark:text-blue-400">
                      {settings.rate.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    id="slider-rate"
                    type="range"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={settings.rate}
                    onChange={(e) =>
                      updateSettings({ rate: parseFloat(e.target.value) })
                    }
                    className="studio-slider mt-1.5 w-full bg-slate-200 dark:bg-slate-800"
                  />
                  <div className="mt-1 flex items-center justify-between gap-1">
                    {[0.5, 0.8, 1.0, 1.2, 1.5, 2.0].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => updateSettings({ rate: preset })}
                        className={`rounded px-1.5 py-0.5 font-mono text-[10px] tabular-nums cursor-pointer ${
                          Math.abs(settings.rate - preset) < 0.05
                            ? 'bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400'
                        }`}
                      >
                        {preset.toFixed(1)}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pitch */}
                <div className="max-w-sm">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="slider-pitch"
                      className="font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Nada / Pitch
                    </label>
                    <span className="font-mono font-semibold text-slate-800 tabular-nums dark:text-slate-200">
                      {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch}
                    </span>
                  </div>
                  <input
                    id="slider-pitch"
                    type="range"
                    min={-5}
                    max={5}
                    step={1}
                    value={settings.pitch}
                    onChange={(e) =>
                      updateSettings({ pitch: parseInt(e.target.value, 10) })
                    }
                    className="studio-slider mt-1.5 w-full bg-slate-200 dark:bg-slate-800"
                  />
                  <div className="mt-1 flex justify-between text-[10px] text-slate-400">
                    <span>Berat (-5)</span>
                    <span>Netral (0)</span>
                    <span>Tinggi (+5)</span>
                  </div>
                </div>

                {/* Volume */}
                <div className="max-w-sm">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="slider-volume"
                      className="font-semibold text-slate-700 dark:text-slate-300"
                    >
                      Volume Output
                    </label>
                    <span className="font-mono font-semibold text-slate-800 tabular-nums dark:text-slate-200">
                      {settings.volume}%
                    </span>
                  </div>
                  <input
                    id="slider-volume"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={settings.volume}
                    onChange={(e) =>
                      updateSettings({ volume: parseInt(e.target.value, 10) })
                    }
                    className="studio-slider mt-1.5 w-full bg-slate-200 dark:bg-slate-800"
                  />
                </div>

                {/* Pause */}
                <div className="max-w-sm">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Jeda Kalimat
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {currentPause.description}
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                    {PAUSE_MODES.map((pm) => (
                      <button
                        key={pm.id}
                        type="button"
                        onClick={() => updateSettings({ pause: pm.id })}
                        className={`rounded-md py-1 text-xs font-semibold transition-colors cursor-pointer ${
                          settings.pause === pm.id
                            ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-700 dark:text-white'
                            : 'text-slate-600 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        {pm.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </AccordionItem>

            {/* Quick Generate Button inside Settings tab so user doesn't need to switch back */}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || !settings.text.trim()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Menghasilkan Suara Natural...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Suara dengan Setelan Ini</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* TAB 3: RIWAYAT (Collapsible Accordion) */}
        {activeTab === 'riwayat' && (
          <AccordionItem
            title="Riwayat Konversi Terakhir"
            summary={
              history.length > 0
                ? `${history.length} rekaman tersimpan (generate ulang otomatis sesuai setelan)`
                : 'Belum ada riwayat konversi'
            }
            isOpen={openAccordion === 'riwayat'}
            onToggle={() => toggleAccordion('riwayat')}
          >
            <HistoryPanel
              items={history}
              busyItemId={busyHistoryId}
              onReplayItem={handleReplayHistory}
              onRedownloadAudio={handleRedownloadHistoryAudio}
              onRedownloadMp4={handleRedownloadHistoryMp4}
              onLoadToEditor={handleLoadHistoryToEditor}
              onDeleteItem={(id) =>
                setHistory((prev) => prev.filter((item) => item.id !== id))
              }
              onClearAll={() => setHistory([])}
            />
          </AccordionItem>
        )}
      </main>

      {/* Back to Top Button (visible when scrolled down) */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Kembali ke Atas"
          className="fixed right-3 bottom-28 z-40 inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white/95 px-3 py-2 text-xs font-semibold text-slate-800 shadow-lg backdrop-blur-xs transition-transform hover:scale-105 dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100 cursor-pointer"
        >
          <ArrowUp className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>Kembali ke Atas</span>
        </button>
      )}

      {/* Always-Visible Sticky Bottom Player & Download Bar */}
      <WaveformPlayer
        activeAudio={activeAudio}
        isDirty={isDirty}
        isGenerating={isGenerating}
        isExportingMp4={isExportingMp4}
        autoPlaySignal={autoPlaySignal}
        onDownloadAudio={handleDownloadAudio}
        onDownloadMp4={handleDownloadMp4}
      />

      <OfflineIndicator />
    </div>
  );
}
