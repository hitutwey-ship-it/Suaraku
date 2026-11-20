export const STUDIO_COVER_IMAGE_URL =
  '/src/assets/images/cover_studio_voiceover_1794924292909.jpg';

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binaryStr = atob(base64);
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function buildDownloadFilename(
  voiceId: string,
  rate: number,
  ext: 'mp3' | 'wav' | 'mp4'
): string {
  const cleanVoice = voiceId.toLowerCase().replace(/[^a-z0-9]/g, '');
  const rateStr = `${rate.toFixed(1)}x`;
  return `suaraalami-${cleanVoice}-${rateStr}.${ext}`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00.0';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
}

export async function extractWaveformPeaks(blob: Blob, barCount = 56): Promise<number[]> {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return Array(barCount).fill(0.4);
    const ctx = new AudioCtx();
    try {
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const step = Math.max(1, Math.floor(channelData.length / barCount));
      const peaks: number[] = [];
      let maxPeak = 0.01;

      for (let i = 0; i < barCount; i++) {
        let sum = 0;
        const start = i * step;
        const end = Math.min(channelData.length, start + step);
        for (let j = start; j < end; j++) {
          const v = Math.abs(channelData[j]);
          if (v > sum) sum = v;
        }
        if (sum > maxPeak) maxPeak = sum;
        peaks.push(sum);
      }
      return peaks.map((p) => Math.max(0.12, Math.min(1, p / maxPeak)));
    } finally {
      await ctx.close();
    }
  } catch {
    return Array.from({ length: barCount }, (_, i) =>
      0.25 + 0.55 * Math.abs(Math.sin(i * 0.45))
    );
  }
}

export async function renderMp4CoverBlob(options: {
  voiceName: string;
  category: string;
  emotionLabel: string;
  rate: number;
  durationSeconds: number;
  snippet: string;
}): Promise<Blob> {
  const width = 1280;
  const height = 720;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D tidak tersedia');

  // Background fallback gradient
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0B1120');
  grad.addColorStop(1, '#1E293B');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Load studio cover photograph
  await new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const imgAspect = img.width / img.height;
      const canvasAspect = width / height;
      let drawW = width;
      let drawH = height;
      let offsetX = 0;
      let offsetY = 0;
      if (imgAspect > canvasAspect) {
        drawW = height * imgAspect;
        offsetX = -(drawW - width) / 2;
      } else {
        drawH = width / imgAspect;
        offsetY = -(drawH - height) / 2;
      }
      ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = STUDIO_COVER_IMAGE_URL;
  });

  // Measured contrast scrim
  const scrim = ctx.createLinearGradient(0, 0, 0, height);
  scrim.addColorStop(0, 'rgba(11, 17, 32, 0.35)');
  scrim.addColorStop(0.55, 'rgba(11, 17, 32, 0.72)');
  scrim.addColorStop(1, 'rgba(11, 17, 32, 0.94)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, 0, width, height);

  // Top brand label
  ctx.fillStyle = '#93C5FD';
  ctx.font = '600 22px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText('SUARAALAMI STUDIO', 72, 82);

  // Waveform accent bar
  ctx.fillStyle = '#3B82F6';
  const barHeights = [22, 42, 64, 38, 56, 74, 46, 28, 52, 34];
  barHeights.forEach((bh, idx) => {
    ctx.beginPath();
    ctx.roundRect(72 + idx * 14, 430 - bh / 2, 7, bh, 4);
    ctx.fill();
  });

  // Voice & metadata headline
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '700 48px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.fillText(`${options.voiceName} — ${options.category}`, 72, 515);

  ctx.fillStyle = '#CBD5E1';
  ctx.font = '500 26px "DM Sans", system-ui, sans-serif';
  ctx.fillText(
    `Gaya ${options.emotionLabel}  ·  Kecepatan ${options.rate.toFixed(1)}x  ·  Durasi ${formatDuration(options.durationSeconds)}`,
    72,
    562
  );

  // Script excerpt (single clipped line)
  const cleanSnippet = options.snippet.replace(/\s+/g, ' ').trim();
  const clipped =
    cleanSnippet.length > 78 ? `${cleanSnippet.slice(0, 78).trim()}...` : cleanSnippet;
  ctx.fillStyle = '#94A3B8';
  ctx.font = '400 22px "DM Sans", system-ui, sans-serif';
  ctx.fillText(`"${clipped}"`, 72, 622);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Gagal merender cover video'));
      },
      'image/jpeg',
      0.92
    );
  });
}
