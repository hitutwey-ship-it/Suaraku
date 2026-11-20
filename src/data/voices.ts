import type { EmotionId, LanguageCode, PauseMode, VoiceProfile } from '../types/tts';

export const VOICES: VoiceProfile[] = [
  {
    id: 'laras',
    name: 'Laras',
    category: 'Wanita Dewasa',
    gender: 'Wanita',
    ageGroup: 'Dewasa',
    tagline: 'Hangat, empatik, dan jernih untuk narasi brand & edukasi.',
    geminiVoice: 'Kore',
    elevenLabsVoiceId: 'EXAVITQu4vr4xnSDxMaL',
    googleVoiceByLang: {
      id: 'id-ID-Wavenet-A',
      en: 'en-US-Neural2-F',
      su: 'id-ID-Wavenet-A',
    },
    stylePrompt:
      'Warm, empathetic, natural adult woman voice with gentle human breathing, clear articulation, smooth conversational melody, never monotone or robotic.',
    basePitchHint: 'natural warm alto',
    accentColor: '#2563EB',
    sampleLine: {
      id: 'Halo, saya Laras. Setiap cerita berhak disampaikan dengan suara yang hangat dan menyentuh hati.',
      en: 'Hello, I am Laras. Every story deserves to be told with a warm and heartfelt human voice.',
      su: 'Wilujeng sumping, abdi Laras. Unggal carita pantes ditepikeun ku sora nu haneut tur merenah.',
    },
  },
  {
    id: 'dimas',
    name: 'Dimas',
    category: 'Pria Dewasa',
    gender: 'Pria',
    ageGroup: 'Dewasa',
    tagline: 'Berwibawa, dalam, dan tenang untuk dokumenter & profil perusahaan.',
    geminiVoice: 'Charon',
    elevenLabsVoiceId: 'VR6AewLTigWG4xSOukaG',
    googleVoiceByLang: {
      id: 'id-ID-Wavenet-B',
      en: 'en-US-Neural2-D',
      su: 'id-ID-Wavenet-B',
    },
    stylePrompt:
      'Deep, calm, authoritative adult man voice with natural chest resonance, poised breathing, crisp diction, and reassuring human warmth.',
    basePitchHint: 'grounded baritone',
    accentColor: '#0F766E',
    sampleLine: {
      id: 'Selamat datang. Mari kita bangun kepercayaan audiens melalui narasi yang tenang dan berwibawa.',
      en: 'Welcome. Let us build audience trust through calm, grounded, and authoritative narration.',
      su: 'Wilujeng sumping. Hayu urang wangun kapercayaan pamiarsa ku sora nu tenang tur berwibawa.',
    },
  },
  {
    id: 'naya',
    name: 'Naya',
    category: 'Wanita Muda',
    gender: 'Wanita',
    ageGroup: 'Remaja / Muda',
    tagline: 'Segar, lincah, dan ekspresif untuk konten media sosial & Reels.',
    geminiVoice: 'Zephyr',
    elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM',
    googleVoiceByLang: {
      id: 'id-ID-Wavenet-D',
      en: 'en-US-Neural2-C',
      su: 'id-ID-Wavenet-D',
    },
    stylePrompt:
      'Fresh, bright, expressive young woman voice with lively natural inflection, subtle smile in her tone, and authentic everyday phrasing.',
    basePitchHint: 'bright youthful soprano',
    accentColor: '#7C3AED',
    sampleLine: {
      id: 'Hai teman-teman! Hari ini aku mau berbagi tips seru biar video kalian makin enak ditonton!',
      en: 'Hey everyone! Today I want to share fun tips to make your videos way more engaging!',
      su: 'Halo rerencangan! Dinten ieu abdi bade ngabagi tips seru sangkan video aranjeun langkung narik!',
    },
  },
  {
    id: 'bima',
    name: 'Bima',
    category: 'Pria Muda',
    gender: 'Pria',
    ageGroup: 'Muda',
    tagline: 'Enerjik, modern, dan santai untuk ulasan produk & YouTube.',
    geminiVoice: 'Puck',
    elevenLabsVoiceId: 'TxGEqnHWrfWFTfGW9XjX',
    googleVoiceByLang: {
      id: 'id-ID-Wavenet-C',
      en: 'en-US-Neural2-J',
      su: 'id-ID-Wavenet-C',
    },
    stylePrompt:
      'Energetic, modern, relatable young man voice with crisp articulation, engaging rhythm, and natural conversational cadence.',
    basePitchHint: 'clear modern tenor',
    accentColor: '#D97706',
    sampleLine: {
      id: 'Gimana kabarnya? Di video kali ini kita bakal bahas fitur terbaru yang bikin kerjaan makin cepat!',
      en: 'How is it going? In this video we are diving into the newest features that speed up your workflow!',
      su: 'Kumaha damang? Dina video ayeuna urang bakal ngabahas fitur anyar nu matak gancang pagawean!',
    },
  },
  {
    id: 'ratna',
    name: 'Ratna',
    category: 'Storytelling Wanita',
    gender: 'Wanita',
    ageGroup: 'Narator',
    tagline: 'Puitis, sinematik, dan intim untuk buku audio & dongeng.',
    geminiVoice: 'Kore',
    elevenLabsVoiceId: 'MF3mGyEYCl7XYWbV9V6O',
    googleVoiceByLang: {
      id: 'id-ID-Wavenet-A',
      en: 'en-US-Neural2-H',
      su: 'id-ID-Wavenet-A',
    },
    stylePrompt:
      'Intimate cinematic audiobook narrator woman voice, rich emotional nuance, unhurried breath control, expressive rises and falls matching punctuation.',
    basePitchHint: 'velvet storytelling alto',
    accentColor: '#BE185D',
    sampleLine: {
      id: 'Di balik kabut pagi yang perlahan turun, tersimpan sebuah kisah tentang keberanian dan harapan.',
      en: 'Behind the morning mist slowly drifting down lies a quiet story of courage and hope.',
      su: 'Di balik halimun isuk nu lalaunan turun, aya hiji carita ngeunaan kawani jeung harepan.',
    },
  },
  {
    id: 'prabu',
    name: 'Prabu',
    category: 'Storytelling Pria',
    gender: 'Pria',
    ageGroup: 'Narator',
    tagline: 'Epik, dramatis, dan memikat untuk trailer serta kisah sejarah.',
    geminiVoice: 'Fenrir',
    elevenLabsVoiceId: 'onwK4e9ZLuTAKqWW03F9',
    googleVoiceByLang: {
      id: 'id-ID-Wavenet-B',
      en: 'en-US-Neural2-A',
      su: 'id-ID-Wavenet-B',
    },
    stylePrompt:
      'Seasoned male film and audiobook narrator, rich textured timbre, dramatic emotional weight, deliberate natural pauses between clauses.',
    basePitchHint: 'deep epic narrator',
    accentColor: '#4338CA',
    sampleLine: {
      id: 'Seribu tahun berlalu, namun gema langkah para penjelajah itu masih terasa hingga hari ini.',
      en: 'A thousand years have passed, yet the echo of those explorers can still be felt today.',
      su: 'Sarebu taun geus kalangkung, tapi gema lengkah para panglalana masih karasa nepi ka ayeuna.',
    },
  },
  {
    id: 'kiki',
    name: 'Kiki',
    category: 'Suara Anak',
    gender: 'Anak',
    ageGroup: 'Anak-anak',
    tagline: 'Polos, ceria, dan antusias untuk animasi & cerita anak.',
    geminiVoice: 'Zephyr',
    elevenLabsVoiceId: 'jBpfuIE2acCO8z3wKNLl',
    googleVoiceByLang: {
      id: 'id-ID-Wavenet-D',
      en: 'en-US-Neural2-F',
      su: 'id-ID-Wavenet-D',
    },
    stylePrompt:
      'Cheerful, curious 9-year-old child voice, light bright youthful timbre, playful upward inflection, natural innocent enthusiasm without sounding shrill.',
    basePitchHint: 'playful childlike bright tone',
    accentColor: '#059669',
    sampleLine: {
      id: 'Wah, lihat deh! Pelanginya muncul setelah hujan reda, warnanya indah sekali!',
      en: 'Whoa, look at that! The rainbow came out right after the rain stopped, it looks amazing!',
      su: 'Wah, tingali geura! Katumbiri bijil sanggeus hujan raat, warnana endah pisan!',
    },
  },
  {
    id: 'sinta',
    name: 'Sinta',
    category: 'Presenter Berita',
    gender: 'Wanita',
    ageGroup: 'Profesional',
    tagline: 'Tegas, objektif, dan terstruktur untuk buletin berita & presentasi.',
    geminiVoice: 'Kore',
    elevenLabsVoiceId: 'XB0fDUnXU5powFXDhCwa',
    googleVoiceByLang: {
      id: 'id-ID-Wavenet-A',
      en: 'en-US-Neural2-E',
      su: 'id-ID-Wavenet-A',
    },
    stylePrompt:
      'Crisp, poised broadcast news anchor woman voice, authoritative clarity, balanced journalistic intonation, natural phrase grouping.',
    basePitchHint: 'crisp broadcast mezzo',
    accentColor: '#0284C7',
    sampleLine: {
      id: 'Pemirsa, perkembangan teknologi kecerdasan suara kini membantu kreator memproduksi konten lebih efisien.',
      en: 'Good evening. Advances in neural voice technology are now helping creators produce content more efficiently.',
      su: 'Pamiarsa, kamekaran teknologi sora ayeuna ngabantos para kreator ngadamel karya langkung gancang.',
    },
  },
];

export const LANGUAGES: { id: LanguageCode; label: string; nativeHint: string }[] = [
  { id: 'id', label: 'Bahasa Indonesia', nativeHint: 'Pelafalan natural standar Indonesia' },
  { id: 'en', label: 'English', nativeHint: 'Natural conversational American/International' },
  { id: 'su', label: 'Bahasa Sunda', nativeHint: 'Lentong jeung palafalan Basa Sunda merenah' },
];

export const EMOTIONS: { id: EmotionId; label: string; description: string; styleDirective: string }[] = [
  {
    id: 'normal',
    label: 'Normal',
    description: 'Seimbang dan natural',
    styleDirective: 'Natural everyday speaking tone, balanced warmth, authentic human rhythm and clear intonation.',
  },
  {
    id: 'ceria',
    label: 'Ceria',
    description: 'Hangat & bersemangat',
    styleDirective: 'Cheerful, upbeat, smiling tone with lively upward pitch contours on key words and bright energy.',
  },
  {
    id: 'serius',
    label: 'Serius',
    description: 'Tegas & mendalam',
    styleDirective: 'Serious, focused, earnest delivery with deliberate pacing, firmer consonants, and grounded downward cadences.',
  },
  {
    id: 'santai',
    label: 'Santai',
    description: 'Kasual seperti ngobrol',
    styleDirective: 'Relaxed, casual, friendly conversational delivery as if chatting naturally with a close friend.',
  },
  {
    id: 'storytelling',
    label: 'Storytelling',
    description: 'Ekspresif & memikat',
    styleDirective: 'Expressive cinematic storytelling delivery with vivid emotional inflection, gentle suspense, and natural breathing.',
  },
  {
    id: 'berita',
    label: 'Berita',
    description: 'Profesional & lugas',
    styleDirective: 'Crisp, authoritative broadcast news anchor delivery with clean articulation and steady journalistic cadence.',
  },
  {
    id: 'motivasi',
    label: 'Motivasi',
    description: 'Menggugah & penuh daya',
    styleDirective: 'Inspiring, passionate motivational speaker delivery with rising conviction, purposeful pauses, and uplifting warmth.',
  },
];

export const PAUSE_MODES: { id: PauseMode; label: string; gapMs: number; description: string }[] = [
  { id: 'singkat', label: 'Singkat', gapMs: 160, description: 'Jeda cepat & padat' },
  { id: 'natural', label: 'Natural', gapMs: 420, description: 'Jeda napas alami' },
  { id: 'dramatis', label: 'Dramatis', gapMs: 920, description: 'Jeda panjang penuh penekanan' },
];

export const DEFAULT_SCRIPT: Record<LanguageCode, string> = {
  id: 'Selamat pagi, teman-teman! Pernahkah kalian mendengar rekaman suara yang terdengar kaku seperti robot? Nah, bersama SuaraAlami, setiap kalimat kini memiliki intonasi naik-turun yang hidup, jeda napas yang pas, dan emosi yang tulus—sehingga video kalian terasa jauh lebih dekat dengan penonton!',
  en: 'Good morning, everyone! Have you ever listened to a voiceover that sounded stiff and robotic? With SuaraAlami, every sentence carries natural rising and falling intonation, human breathing pauses, and genuine emotion—making your videos feel truly alive!',
  su: 'Wilujeng enjing, sadayana! Naha aranjeun kantos ngadangu rekaman sora nu karasa kaku siga robot? Tah, sasarengan SuaraAlami, unggal kalimah ayeuna gaduh lentong nu hirup, jeda napas nu merenah, sarta rasa nu tulus pikeun video aranjeun!',
};

export function getVoiceById(voiceId: string): VoiceProfile {
  return VOICES.find((v) => v.id === voiceId) ?? VOICES[0];
}
