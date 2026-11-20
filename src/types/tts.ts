export type LanguageCode = 'id' | 'en' | 'su';

export type EmotionId =
  | 'normal'
  | 'ceria'
  | 'serius'
  | 'santai'
  | 'storytelling'
  | 'berita'
  | 'motivasi';

export type PauseMode = 'singkat' | 'natural' | 'dramatis';

export type AudioFormat = 'mp3' | 'wav';

export interface VoiceProfile {
  id: string;
  name: string;
  category: string;
  gender: 'Pria' | 'Wanita' | 'Anak';
  ageGroup: string;
  tagline: string;
  sampleLine: Record<LanguageCode, string>;
  geminiVoice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr';
  elevenLabsVoiceId: string;
  googleVoiceByLang: Record<LanguageCode, string>;
  stylePrompt: string;
  basePitchHint: string;
  accentColor: string;
}

export interface TtsSettings {
  text: string;
  voiceId: string;
  language: LanguageCode;
  emotion: EmotionId;
  rate: number; // 0.5 to 2.0
  pitch: number; // -5 to +5
  volume: number; // 0 to 100
  pause: PauseMode;
}

export interface GeneratedAudioResult {
  mp3Base64: string;
  wavBase64: string;
  durationSeconds: number;
  engine: 'elevenlabs' | 'google-cloud-tts' | 'gemini-neural-tts';
  appliedSettings: TtsSettings;
  voiceName: string;
}

export interface HistoryItem {
  id: string;
  createdAt: string;
  settings: TtsSettings;
  voiceName: string;
  durationSeconds: number;
  engine: string;
}
