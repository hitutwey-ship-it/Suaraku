import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';
import { extractText } from 'unpdf';
import { EMOTIONS, PAUSE_MODES, getVoiceById } from './src/data/voices.ts';
import type { EmotionId, LanguageCode, PauseMode, TtsSettings } from './src/types/tts.ts';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);

const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

const app = express();
app.use(express.json({ limit: '25mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

// In-memory LRU cache for RAW unprocessed neural base audio (1.0x speed, 0 pitch, 100% vol).
// Keyed strictly by (text, voiceId, language, emotion, pause) so changing voice/text/emotion/language/pause
// ALWAYS calls the Neural TTS API fresh, while adjusting speed/pitch/volume produces exact mathematical ratios.
interface RawCacheEntry {
  wavBuffer: Buffer;
  engine: 'elevenlabs' | 'google-cloud-tts' | 'gemini-neural-tts';
}
const MAX_RAW_CACHE = 25;
const rawAudioCache = new Map<string, RawCacheEntry>();

function setRawCache(key: string, value: RawCacheEntry) {
  if (rawAudioCache.has(key)) {
    rawAudioCache.delete(key);
  }
  rawAudioCache.set(key, value);
  if (rawAudioCache.size > MAX_RAW_CACHE) {
    const oldestKey = rawAudioCache.keys().next().value;
    if (oldestKey) rawAudioCache.delete(oldestKey);
  }
}

function getWavDurationSeconds(wavBuffer: Buffer): number {
  if (wavBuffer.length < 44) return 0;
  // Find 'fmt ' and 'data' chunks robustly
  let offset = 12;
  let byteRate = 48000;
  let dataSize = wavBuffer.length - 44;

  while (offset + 8 <= wavBuffer.length) {
    const chunkId = wavBuffer.toString('ascii', offset, offset + 4);
    const chunkSize = wavBuffer.readUInt32LE(offset + 4);
    if (chunkId === 'fmt ' && offset + 20 <= wavBuffer.length) {
      byteRate = wavBuffer.readUInt32LE(offset + 16) || 48000;
    } else if (chunkId === 'data') {
      dataSize = chunkSize;
      break;
    }
    offset += 8 + chunkSize + (chunkSize % 2);
  }
  return Number((dataSize / byteRate).toFixed(3));
}

function splitTextIntoNaturalChunks(text: string, pause: PauseMode): { text: string; gapAfterMs: number }[] {
  const cleaned = text.replace(/\r\n/g, '\n').trim();
  const pauseConfig = PAUSE_MODES.find((p) => p.id === pause) ?? PAUSE_MODES[1];
  const baseGap = pauseConfig.gapMs;

  // Keep scripts up to 1,600 characters in a single TTS request to preserve
  // continuous human intonation and minimize API requests per minute (RPM).
  if (cleaned.length <= 1600) {
    return [{ text: cleaned, gapAfterMs: 0 }];
  }

  const paragraphs = cleaned
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const chunks: { text: string; gapAfterMs: number }[] = [];
  let currentGroup = '';

  for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
    const para = paragraphs[pIdx];
    const isLastPara = pIdx === paragraphs.length - 1;

    if (currentGroup && currentGroup.length + para.length + 2 > 1400) {
      chunks.push({ text: currentGroup, gapAfterMs: Math.round(baseGap * 1.45) });
      currentGroup = para;
    } else {
      currentGroup = currentGroup ? `${currentGroup}\n\n${para}` : para;
    }

    if (isLastPara && currentGroup) {
      chunks.push({ text: currentGroup, gapAfterMs: 0 });
    }
  }

  return chunks;
}

function buildLanguageInstruction(language: LanguageCode): string {
  switch (language) {
    case 'id':
      return 'Language: Standard natural Indonesian (Bahasa Indonesia). Pronounce every Indonesian word accurately with natural native cadence, warm rising intonation on question marks, expressive lift on exclamation marks, and brief natural breathing pauses at commas and periods.';
    case 'en':
      return 'Language: Natural conversational English. Speak with authentic human melody, expressive inflection for questions and exclamations, clear phrasing, and natural breathing pauses.';
    case 'su':
      return 'Language: Authentic Sundanese (Basa Sunda). Pronounce Sundanese vowels clearly ("eu", "é", "e"), use natural West Javanese Priangan melody (lentong Sunda), warm respectful pacing, and human breathing pauses.';
  }
}

function buildPauseInstruction(pause: PauseMode): string {
  switch (pause) {
    case 'singkat':
      return 'Pacing: Keep pauses between clauses and sentences crisp and brief while remaining clear and human.';
    case 'natural':
      return 'Pacing: Speak with natural human breath pauses at commas and sentences, unhurried and rhythmic.';
    case 'dramatis':
      return 'Pacing: Deliver with expressive, dramatic pauses at commas and sentence endings for cinematic weight.';
  }
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildSsml(text: string, pause: PauseMode): string {
  const pauseConfig = PAUSE_MODES.find((p) => p.id === pause) ?? PAUSE_MODES[1];
  const commaMs = Math.max(120, Math.round(pauseConfig.gapMs * 0.55));
  const sentenceMs = pauseConfig.gapMs;
  const paraMs = Math.round(pauseConfig.gapMs * 1.5);

  const paragraphs = text
    .replace(/\r\n/g, '\n')
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const body = paragraphs
    .map((para) => {
      const escaped = escapeXml(para)
        .replace(/,\s+/g, `, <break time="${commaMs}ms"/>`)
        .replace(/([.!?])\s+/g, `$1 <break time="${sentenceMs}ms"/>`);
      return `<p>${escaped}</p>`;
    })
    .join(`<break time="${paraMs}ms"/>`);

  return `<speak>${body}</speak>`;
}

async function createSilenceWav(durationMs: number, sampleRate = 24000): Promise<Buffer> {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'suara-sil-'));
  const outPath = path.join(tmpDir, 'silence.wav');
  try {
    const secs = Math.max(0.05, durationMs / 1000).toFixed(3);
    await execFileAsync('ffmpeg', [
      '-y',
      '-f',
      'lavfi',
      '-i',
      `anullsrc=r=${sampleRate}:cl=mono`,
      '-t',
      secs,
      '-acodec',
      'pcm_s16le',
      outPath,
    ]);
    return await fs.readFile(outPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function concatAudioBuffersToWav(segments: Buffer[]): Promise<Buffer> {
  if (segments.length === 1) {
    // Normalize single segment to uniform 24kHz mono WAV for consistent DSP
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'suara-norm-'));
    const inPath = path.join(tmpDir, 'in.audio');
    const outPath = path.join(tmpDir, 'out.wav');
    try {
      await fs.writeFile(inPath, segments[0]);
      await execFileAsync('ffmpeg', ['-y', '-i', inPath, '-ar', '24000', '-ac', '1', '-acodec', 'pcm_s16le', outPath]);
      return await fs.readFile(outPath);
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'suara-cat-'));
  try {
    const listLines: string[] = [];
    for (let i = 0; i < segments.length; i++) {
      const segIn = path.join(tmpDir, `seg_${i}.audio`);
      const segWav = path.join(tmpDir, `seg_${i}.wav`);
      await fs.writeFile(segIn, segments[i]);
      await execFileAsync('ffmpeg', ['-y', '-i', segIn, '-ar', '24000', '-ac', '1', '-acodec', 'pcm_s16le', segWav]);
      listLines.push(`file '${segWav.replace(/'/g, "'\\''")}'`);
    }
    const listFile = path.join(tmpDir, 'list.txt');
    const outPath = path.join(tmpDir, 'merged.wav');
    await fs.writeFile(listFile, listLines.join('\n'), 'utf-8');
    await execFileAsync('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c', 'copy', outPath]);
    return await fs.readFile(outPath);
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

async function synthesizeWithElevenLabs(settings: TtsSettings): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured');
  const voice = getVoiceById(settings.voiceId);
  const pauseConfig = PAUSE_MODES.find((p) => p.id === settings.pause) ?? PAUSE_MODES[1];
  const breakSec = (pauseConfig.gapMs / 1000).toFixed(2);
  const preparedText = settings.text
    .replace(/\n+/g, ` <break time="${breakSec}s" /> `)
    .trim();

  const stabilityMap: Record<EmotionId, number> = {
    normal: 0.55,
    ceria: 0.42,
    serius: 0.72,
    santai: 0.48,
    storytelling: 0.45,
    berita: 0.78,
    motivasi: 0.38,
  };
  const styleMap: Record<EmotionId, number> = {
    normal: 0.25,
    ceria: 0.65,
    serius: 0.35,
    santai: 0.4,
    storytelling: 0.7,
    berita: 0.2,
    motivasi: 0.8,
  };

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice.elevenLabsVoiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text: preparedText,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: stabilityMap[settings.emotion] ?? 0.5,
        similarity_boost: 0.8,
        style: styleMap[settings.emotion] ?? 0.4,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`ElevenLabs error ${response.status}: ${errText}`);
  }
  const mp3Buf = Buffer.from(await response.arrayBuffer());
  return concatAudioBuffersToWav([mp3Buf]);
}

async function synthesizeWithGoogleCloudTts(settings: TtsSettings): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_CLOUD_TTS_API_KEY not configured');
  const voice = getVoiceById(settings.voiceId);
  const voiceName = voice.googleVoiceByLang[settings.language] || 'id-ID-Wavenet-A';
  const languageCode = voiceName.split('-').slice(0, 2).join('-');
  const ssml = buildSsml(settings.text, settings.pause);

  const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { ssml },
      voice: { languageCode, name: voiceName },
      audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: 24000 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google Cloud TTS error ${response.status}: ${errText}`);
  }
  const data = (await response.json()) as { audioContent?: string };
  if (!data.audioContent) throw new Error('Google Cloud TTS returned empty audio');
  return Buffer.from(data.audioContent, 'base64');
}

class QuotaExceededError extends Error {
  retrySeconds: number;
  constructor(message: string, retrySeconds = 45) {
    super(message);
    this.name = 'QuotaExceededError';
    this.retrySeconds = retrySeconds;
  }
}

function parseQuotaInfo(err: unknown): { isQuota: boolean; retrySeconds: number } {
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const isQuota =
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.toLowerCase().includes('quota');
  const retryMatch =
    msg.match(/retry in\s+([\d.]+)s/i) ||
    msg.match(/"retryDelay"\s*:\s*"(\d+)s"/i);
  const retrySeconds = retryMatch ? Math.max(5, Math.ceil(Number(retryMatch[1]))) : 45;
  return { isQuota, retrySeconds };
}

async function callGeminiTtsModel(
  model: 'gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts',
  text: string,
  styleDescription: string,
  voiceName: string
): Promise<Buffer> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi di server.');
  }
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          {
            text,
            speechMetadata: {
              style: styleDescription,
            },
          },
        ],
      },
    ],
    config: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName,
          },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error('Model tidak mengembalikan data audio.');
  }
  return Buffer.from(base64Audio, 'base64');
}

async function synthesizeWithGeminiNeuralTts(settings: TtsSettings): Promise<Buffer> {
  if (!ai) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi di server.');
  }
  const voice = getVoiceById(settings.voiceId);
  const emotion = EMOTIONS.find((e) => e.id === settings.emotion) ?? EMOTIONS[0];

  const styleDescription = [
    voice.stylePrompt,
    `Vocal timbre: ${voice.basePitchHint}.`,
    emotion.styleDirective,
    buildLanguageInstruction(settings.language),
    buildPauseInstruction(settings.pause),
  ].join(' ');

  const chunks = splitTextIntoNaturalChunks(settings.text, settings.pause);
  const segments: Buffer[] = [];
  const modelsToTry: ('gemini-3.8-flash-lite-tts' | 'gemini-3.8-flash-tts')[] = [
    'gemini-3.8-flash-lite-tts',
    'gemini-3.8-flash-tts',
  ];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    let lastError: unknown = null;
    let wavBuf: Buffer | null = null;

    for (const model of modelsToTry) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          wavBuf = await callGeminiTtsModel(
            model,
            chunk.text,
            styleDescription,
            voice.geminiVoice
          );
          break;
        } catch (err) {
          lastError = err;
          const { isQuota } = parseQuotaInfo(err);
          // Do not burn quota retrying 429 on the same model; fall back immediately.
          if (isQuota) {
            break;
          }
          if (attempt === 0) {
            await new Promise((r) => setTimeout(r, 400));
          }
        }
      }
      if (wavBuf) break;
    }

    if (!wavBuf) {
      const { isQuota, retrySeconds } = parseQuotaInfo(lastError);
      if (isQuota) {
        throw new QuotaExceededError(
          `Batas permintaan API sementara tercapai. Silakan tunggu sekitar ${retrySeconds} detik lalu klik Generate Suara lagi.`,
          retrySeconds
        );
      }
      throw lastError instanceof Error
        ? lastError
        : new Error('Gagal menghasilkan suara Gemini TTS');
    }

    segments.push(wavBuf);
    if (chunk.gapAfterMs > 0 && i < chunks.length - 1) {
      const silence = await createSilenceWav(chunk.gapAfterMs, 24000);
      segments.push(silence);
    }
  }

  return concatAudioBuffersToWav(segments);
}

async function applyStudioDspAndEncode(
  rawWav: Buffer,
  rate: number,
  pitch: number,
  volume: number
): Promise<{ wavBuffer: Buffer; mp3Buffer: Buffer; durationSeconds: number }> {
  const clampedRate = Math.min(2.0, Math.max(0.5, Number(rate) || 1.0));
  const clampedPitch = Math.min(5, Math.max(-5, Number(pitch) || 0));
  const clampedVol = Math.min(100, Math.max(0, Number(volume) ?? 100));

  // Map -5..+5 slider to -2.5..+2.5 semitones for natural human voice shifting
  const semitones = clampedPitch * 0.5;
  const pitchRatio = Math.pow(2, semitones / 12);
  const volumeGain = clampedVol / 100;

  // Build filter chain:
  // 1. highpass=f=70 removes sub-sonic rumble
  // 2. acompressor smooths dynamics naturally without altering duration
  // 3. rubberband performs artifact-free independent tempo & pitch scaling
  // 4. volume scales exact output amplitude (0% -> true silence, 100% -> full level)
  const filters = [
    'highpass=f=70',
    'acompressor=threshold=-18dB:ratio=2.2:attack=15:release=120',
    `rubberband=tempo=${clampedRate.toFixed(4)}:pitch=${pitchRatio.toFixed(5)}`,
    `volume=${volumeGain.toFixed(3)}`,
  ].join(',');

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'suara-dsp-'));
  const inPath = path.join(tmpDir, 'raw.wav');
  const outWavPath = path.join(tmpDir, 'processed.wav');
  const outMp3Path = path.join(tmpDir, 'processed.mp3');

  try {
    await fs.writeFile(inPath, rawWav);

    // Single ffmpeg pass producing the exact processed WAV master
    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      inPath,
      '-af',
      filters,
      '-ar',
      '24000',
      '-ac',
      '1',
      '-acodec',
      'pcm_s16le',
      outWavPath,
    ]);

    // Encode MP3 directly from the exact processed WAV master so WAV and MP3 match sample-for-sample
    await execFileAsync('ffmpeg', [
      '-y',
      '-i',
      outWavPath,
      '-codec:a',
      'libmp3lame',
      '-b:a',
      '192k',
      outMp3Path,
    ]);

    const [wavBuffer, mp3Buffer] = await Promise.all([
      fs.readFile(outWavPath),
      fs.readFile(outMp3Path),
    ]);

    const durationSeconds = getWavDurationSeconds(wavBuffer);
    return { wavBuffer, mp3Buffer, durationSeconds };
  } finally {
    await fs.rm(tmpDir, { recursive: true, force: true });
  }
}

app.post('/api/parse-document', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'File tidak ditemukan.' });
      return;
    }
    const ext = path.extname(req.file.originalname).toLowerCase();
    let extracted = '';

    if (ext === '.txt') {
      extracted = req.file.buffer.toString('utf-8');
    } else if (ext === '.pdf') {
      const result = await extractText(new Uint8Array(req.file.buffer), { mergePages: true });
      extracted = Array.isArray(result.text) ? result.text.join('\n\n') : String(result.text ?? '');
    } else {
      res.status(400).json({ error: 'Format file tidak didukung. Gunakan .txt atau .pdf.' });
      return;
    }

    const cleaned = extracted
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleaned) {
      res.status(422).json({ error: 'File tidak berisi teks yang dapat dibaca.' });
      return;
    }

    res.json({
      text: cleaned,
      fileName: req.file.originalname,
    });
  } catch (err) {
    console.error('Document parse error:', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Gagal membaca isi dokumen.',
    });
  }
});

app.post('/api/tts/generate', async (req, res) => {
  try {
    const body = req.body as Partial<TtsSettings>;
    const text = (body.text ?? '').trim();
    if (!text) {
      res.status(400).json({ error: 'Teks tidak boleh kosong.' });
      return;
    }
    if (text.length > 5000) {
      res.status(400).json({ error: 'Maksimal panjang teks adalah 5.000 karakter per proses.' });
      return;
    }

    const voice = getVoiceById(body.voiceId || 'laras');
    const settings: TtsSettings = {
      text,
      voiceId: voice.id,
      language: (['id', 'en', 'su'].includes(body.language || '') ? body.language : 'id') as LanguageCode,
      emotion: (EMOTIONS.some((e) => e.id === body.emotion) ? body.emotion : 'normal') as EmotionId,
      rate: Math.min(2.0, Math.max(0.5, Number(body.rate) || 1.0)),
      pitch: Math.min(5, Math.max(-5, Number(body.pitch) || 0)),
      volume: Math.min(100, Math.max(0, body.volume !== undefined ? Number(body.volume) : 100)),
      pause: (PAUSE_MODES.some((p) => p.id === body.pause) ? body.pause : 'natural') as PauseMode,
    };

    // Base cache key excludes rate, pitch, volume so DSP tweaks are exact & instantaneous,
    // while ANY change to text, voiceId, language, emotion, or pause triggers fresh Neural synthesis.
    const rawKey = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          text: settings.text,
          voiceId: settings.voiceId,
          language: settings.language,
          emotion: settings.emotion,
          pause: settings.pause,
        })
      )
      .digest('hex');

    let rawEntry = rawAudioCache.get(rawKey);

    if (!rawEntry) {
      let rawWav: Buffer | null = null;
      let engine: RawCacheEntry['engine'] = 'gemini-neural-tts';

      // Tier 1: ElevenLabs (if ELEVENLABS_API_KEY is configured)
      if (process.env.ELEVENLABS_API_KEY) {
        try {
          rawWav = await synthesizeWithElevenLabs(settings);
          engine = 'elevenlabs';
        } catch (err) {
          console.warn('ElevenLabs failed, falling back:', err);
        }
      }

      // Tier 2: Gemini 3.8 Neural TTS (built-in via GEMINI_API_KEY)
      if (!rawWav && process.env.GEMINI_API_KEY) {
        try {
          rawWav = await synthesizeWithGeminiNeuralTts(settings);
          engine = 'gemini-neural-tts';
        } catch (err) {
          console.warn('Gemini Neural TTS error:', err);
          if (!process.env.GOOGLE_CLOUD_TTS_API_KEY) {
            throw err;
          }
        }
      }

      // Tier 3: Google Cloud TTS fallback (if GOOGLE_CLOUD_TTS_API_KEY is configured)
      if (!rawWav && process.env.GOOGLE_CLOUD_TTS_API_KEY) {
        rawWav = await synthesizeWithGoogleCloudTts(settings);
        engine = 'google-cloud-tts';
      }

      if (!rawWav) {
        throw new Error('Tidak ada layanan Neural TTS yang tersedia. Pastikan API key sudah terpasang.');
      }

      rawEntry = { wavBuffer: rawWav, engine };
      setRawCache(rawKey, rawEntry);
    }

    const { wavBuffer, mp3Buffer, durationSeconds } = await applyStudioDspAndEncode(
      rawEntry.wavBuffer,
      settings.rate,
      settings.pitch,
      settings.volume
    );

    res.json({
      wavBase64: wavBuffer.toString('base64'),
      mp3Base64: mp3Buffer.toString('base64'),
      durationSeconds,
      engine: rawEntry.engine,
      appliedSettings: settings,
      voiceName: voice.name,
    });
  } catch (err) {
    console.error('TTS generate error:', err);
    if (err instanceof QuotaExceededError) {
      res.status(429).json({
        error: err.message,
        retryAfterSeconds: err.retrySeconds,
      });
      return;
    }
    const { isQuota, retrySeconds } = parseQuotaInfo(err);
    if (isQuota) {
      res.status(429).json({
        error: `Batas permintaan API sementara tercapai. Silakan tunggu sekitar ${retrySeconds} detik lalu klik Generate Suara lagi.`,
        retryAfterSeconds: retrySeconds,
      });
      return;
    }
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses suara.';
    res.status(500).json({ error: message });
  }
});

app.post(
  '/api/tts/export-mp4',
  upload.fields([
    { name: 'audio', maxCount: 1 },
    { name: 'cover', maxCount: 1 },
  ]),
  async (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const audioFile = files?.audio?.[0];
    if (!audioFile) {
      res.status(400).json({ error: 'Audio tidak ditemukan untuk ekspor MP4.' });
      return;
    }

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'suara-mp4-'));
    const audioPath = path.join(tmpDir, 'input_audio');
    const coverPath = path.join(tmpDir, 'cover.png');
    const outPath = path.join(tmpDir, 'output.mp4');

    try {
      await fs.writeFile(audioPath, audioFile.buffer);

      const coverFile = files?.cover?.[0];
      if (coverFile) {
        await fs.writeFile(coverPath, coverFile.buffer);
      } else {
        // Fallback to generated studio cover image on disk
        const fallbackCover = path.join(
          __dirname,
          'src',
          'assets',
          'images',
          'cover_studio_voiceover_1794924292909.jpg'
        );
        await fs.copyFile(fallbackCover, coverPath);
      }

      await execFileAsync('ffmpeg', [
        '-y',
        '-loop',
        '1',
        '-framerate',
        '2',
        '-i',
        coverPath,
        '-i',
        audioPath,
        '-c:v',
        'libx264',
        '-tune',
        'stillimage',
        '-preset',
        'veryfast',
        '-crf',
        '21',
        '-vf',
        'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,format=yuv420p',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
        '-shortest',
        '-movflags',
        '+faststart',
        outPath,
      ]);

      const mp4Buffer = await fs.readFile(outPath);
      const rawFilename = typeof req.body?.filename === 'string' ? req.body.filename : 'suaraalami-video.mp4';
      const safeFilename = rawFilename.replace(/[^a-zA-Z0-9._-]/g, '_');

      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
      res.send(mp4Buffer);
    } catch (err) {
      console.error('MP4 export error:', err);
      res.status(500).json({
        error: err instanceof Error ? err.message : 'Gagal membuat video MP4.',
      });
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }
);

async function startServer() {
  const httpServer = http.createServer(app);

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: { server: httpServer },
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`SuaraAlami server running at http://localhost:${PORT}`);
  });
}

startServer();
