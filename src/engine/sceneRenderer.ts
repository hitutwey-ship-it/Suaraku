import { ANIMATION_STYLES } from '../data/studioPresets';
import type {
  AnimationStyleId,
  CameraMovement,
  CharacterPoseAction,
  CharacterRef,
  FacialExpression,
  ReferenceImage,
  SceneItem,
} from '../types/studio';

const imageElementCache = new Map<string, HTMLImageElement>();

export function preloadImageUrl(url: string): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null);
  const cached = imageElementCache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(cached);
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageElementCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function easeInOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

// Anticipation (0..0.18), Action (0.18..0.78), Follow-through (0.78..1.0)
function anticipationActionFollowThrough(p: number): {
  anticipation: number;
  action: number;
  followThrough: number;
} {
  const t = Math.max(0, Math.min(1, p));
  if (t < 0.18) {
    const k = t / 0.18;
    return { anticipation: Math.sin(k * Math.PI), action: 0, followThrough: 0 };
  }
  if (t < 0.78) {
    const k = (t - 0.18) / 0.6;
    return { anticipation: 0, action: easeInOutCubic(k), followThrough: 0 };
  }
  const k = (t - 0.78) / 0.22;
  return {
    anticipation: 0,
    action: 1,
    followThrough: Math.sin(k * Math.PI) * (1 - k * 0.5),
  };
}

function getCameraTransform(
  movement: CameraMovement,
  progress: number,
  width: number,
  height: number
): { scale: number; tx: number; ty: number; rot: number } {
  const p = easeInOutCubic(progress);
  switch (movement) {
    case 'Dolly in':
      return { scale: 1.0 + 0.18 * p, tx: 0, ty: -height * 0.02 * p, rot: 0 };
    case 'Dolly out':
      return { scale: 1.2 - 0.18 * p, tx: 0, ty: height * 0.015 * (1 - p), rot: 0 };
    case 'Pan left':
      return { scale: 1.12, tx: width * 0.06 * (0.5 - p), ty: 0, rot: 0 };
    case 'Pan right':
      return { scale: 1.12, tx: width * 0.06 * (p - 0.5), ty: 0, rot: 0 };
    case 'Tracking shot':
      return {
        scale: 1.1,
        tx: width * 0.05 * Math.sin(p * Math.PI - Math.PI / 2),
        ty: Math.sin(p * Math.PI * 4) * height * 0.004,
        rot: 0,
      };
    case 'Crane shot':
      return {
        scale: 1.16 - 0.14 * p,
        tx: 0,
        ty: height * 0.08 * (0.5 - p),
        rot: 0,
      };
    case 'Close-up':
      return { scale: 1.38 + 0.05 * p, tx: 0, ty: height * 0.04, rot: 0 };
    case 'Medium shot':
      return { scale: 1.12 + 0.03 * p, tx: 0, ty: height * 0.01, rot: 0 };
    case 'Wide shot':
      return { scale: 0.98 + 0.02 * p, tx: 0, ty: -height * 0.01, rot: 0 };
    case 'Orbit camera':
      return {
        scale: 1.14 + 0.04 * Math.sin(p * Math.PI),
        tx: Math.sin(p * Math.PI * 2) * width * 0.035,
        ty: Math.cos(p * Math.PI * 2) * height * 0.015,
        rot: Math.sin(p * Math.PI) * 0.018,
      };
    case 'Smooth cinematic transition':
    default:
      return { scale: 1.04 + 0.08 * p, tx: width * 0.015 * (p - 0.5), ty: 0, rot: 0 };
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function draw3DCinematicEnvironment(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: SceneItem,
  timeSec: number,
  referenceImages: ReferenceImage[]
) {
  const spec = scene.artSpec;

  // 1. Sky / Atmospheric Backdrop
  const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  skyGrad.addColorStop(0, spec.skyTopHex || '#0F172A');
  skyGrad.addColorStop(1, spec.skyBottomHex || '#334155');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(-w * 0.2, -h * 0.2, w * 1.4, h * 1.4);

  // Subtle Reference Image ambient texture blend if user uploaded environment reference
  if (referenceImages.length > 0) {
    const refImg = imageElementCache.get(referenceImages[0].imageDataUrl);
    if (refImg && refImg.complete && refImg.naturalWidth > 0) {
      ctx.save();
      ctx.globalAlpha = 0.24;
      const aspect = refImg.naturalWidth / refImg.naturalHeight;
      const drawH = h * 0.75;
      const drawW = drawH * aspect;
      ctx.drawImage(refImg, (w - drawW) / 2, 0, drawW, drawH);
      ctx.restore();
    }
  }

  // Sun / Moon Celestial Rim Source
  const orbX = w * 0.72;
  const orbY = h * 0.22;
  const orbGrad = ctx.createRadialGradient(orbX, orbY, w * 0.02, orbX, orbY, w * 0.42);
  orbGrad.addColorStop(0, spec.lightBeamHex || '#FDE047');
  orbGrad.addColorStop(0.25, `${spec.lightBeamHex || '#FDE047'}66`);
  orbGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = orbGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Far 3D Depth-of-Field Layer (soft mountains / skyline)
  ctx.save();
  if (spec.depthOfFieldStrength > 0.3 && typeof ctx.filter === 'string') {
    ctx.filter = `blur(${Math.round(spec.depthOfFieldStrength * 6)}px)`;
  }
  ctx.fillStyle = 'rgba(15, 23, 42, 0.52)';
  ctx.beginPath();
  ctx.moveTo(-w * 0.1, h * 0.68);
  const arch = spec.architectureType;
  if (arch === 'city' || arch === 'interior') {
    const buildings = 9;
    for (let i = 0; i < buildings; i++) {
      const bx = -w * 0.05 + (i * w * 1.1) / buildings;
      const bw = (w * 1.1) / buildings + 4;
      const bh = h * (0.16 + ((i * 37) % 19) * 0.01);
      ctx.rect(bx, h * 0.65 - bh, bw * 0.88, bh + h * 0.08);
    }
  } else {
    ctx.lineTo(w * 0.12, h * 0.46);
    ctx.lineTo(w * 0.36, h * 0.56);
    ctx.lineTo(w * 0.62, h * 0.42);
    ctx.lineTo(w * 0.88, h * 0.53);
    ctx.lineTo(w * 1.15, h * 0.47);
    ctx.lineTo(w * 1.15, h * 0.72);
    ctx.lineTo(-w * 0.1, h * 0.72);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Midground 3D Architectural Props (Trees / Pillars / Workshop Arches)
  ctx.save();
  const midColor = 'rgba(17, 24, 39, 0.72)';
  ctx.fillStyle = midColor;
  if (arch === 'forest' || arch === 'mountain') {
    for (let i = 0; i < 6; i++) {
      const side = i % 2 === 0 ? 0.08 + i * 0.05 : 0.92 - i * 0.05;
      const tx = w * side;
      const trunkW = w * 0.045;
      const topY = h * (0.28 + (i % 3) * 0.06);
      ctx.fillRect(tx - trunkW / 2, topY, trunkW, h * 0.68 - topY);
      ctx.beginPath();
      ctx.arc(tx, topY, w * 0.14, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (arch === 'workshop' || arch === 'village') {
    // 3D Stone Archway / Cottage silhouette
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.44, w * 0.28, Math.PI, 0);
    ctx.lineTo(w * 0.78, h * 0.68);
    ctx.lineTo(w * 0.66, h * 0.68);
    ctx.lineTo(w * 0.66, h * 0.46);
    ctx.arc(w * 0.5, h * 0.46, w * 0.16, 0, Math.PI, true);
    ctx.lineTo(w * 0.34, h * 0.68);
    ctx.lineTo(w * 0.22, h * 0.68);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // 4. 3D Perspective Ground Plane with Depth Shading
  const horizonY = h * 0.66;
  const groundGrad = ctx.createLinearGradient(0, horizonY, 0, h);
  groundGrad.addColorStop(0, spec.groundHex || '#1E293B');
  groundGrad.addColorStop(1, '#090D16');
  ctx.fillStyle = groundGrad;
  ctx.fillRect(-w * 0.2, horizonY, w * 1.4, h * 0.5);

  // Perspective vanishing lines for 3D depth feel
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = Math.max(1.5, w * 0.002);
  const vanishX = w * 0.5;
  for (let i = -5; i <= 5; i++) {
    ctx.beginPath();
    ctx.moveTo(vanishX + i * w * 0.04, horizonY);
    ctx.lineTo(vanishX + i * w * 0.32, h * 1.05);
    ctx.stroke();
  }
  for (let r = 1; r <= 5; r++) {
    const ry = horizonY + Math.pow(r / 5, 1.6) * (h - horizonY);
    ctx.beginPath();
    ctx.moveTo(-w * 0.1, ry);
    ctx.lineTo(w * 1.1, ry);
    ctx.stroke();
  }
  ctx.restore();

  // 5. Dramatic Volumetric Light Shafts
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const beamGrad = ctx.createLinearGradient(orbX, orbY, w * 0.35, h * 0.85);
  beamGrad.addColorStop(0, `${spec.lightBeamHex || '#FCD34D'}44`);
  beamGrad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = beamGrad;
  ctx.beginPath();
  ctx.moveTo(orbX - w * 0.06, orbY);
  ctx.lineTo(orbX + w * 0.08, orbY);
  ctx.lineTo(w * 0.55, h * 0.92);
  ctx.lineTo(w * 0.12, h * 0.92);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 6. Animated Weather / Atmosphere Particles
  const particleMode = spec.weatherParticle;
  if (particleMode !== 'none') {
    ctx.save();
    const count = particleMode === 'rain' ? 36 : 22;
    for (let i = 0; i < count; i++) {
      const seed = (i * 9301 + 49297) % 233280;
      const rx = (seed / 233280) * w;
      const baseY = ((i * 173) % 100) / 100;
      if (particleMode === 'rain') {
        const py = ((baseY + timeSec * 1.4) % 1.1) * h;
        ctx.strokeStyle = 'rgba(186, 230, 253, 0.35)';
        ctx.lineWidth = Math.max(1.2, w * 0.002);
        ctx.beginPath();
        ctx.moveTo(rx, py);
        ctx.lineTo(rx - w * 0.015, py + h * 0.035);
        ctx.stroke();
      } else {
        const driftX = rx + Math.sin(timeSec * 1.3 + i) * w * 0.03;
        const driftY = ((baseY - timeSec * 0.08 + 10) % 1.0) * h * 0.9;
        const pulse = 0.4 + 0.5 * Math.sin(timeSec * 3 + i * 1.7);
        ctx.fillStyle =
          particleMode === 'fireflies' || particleMode === 'sparkles'
            ? `rgba(253, 224, 71, ${pulse.toFixed(2)})`
            : particleMode === 'leaves'
              ? `rgba(74, 222, 128, ${(pulse * 0.65).toFixed(2)})`
              : `rgba(226, 232, 240, ${(pulse * 0.4).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(driftX, driftY, w * (particleMode === 'sparkles' ? 0.006 : 0.0045), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

function drawCartoonCharacter(
  ctx: CanvasRenderingContext2D,
  char: CharacterRef,
  cx: number,
  cy: number,
  unit: number,
  inkWidth: number,
  expression: FacialExpression,
  action: CharacterPoseAction,
  progress: number,
  timeSec: number,
  isSpeaking: boolean
) {
  const rig = char.visualRig;
  const scaleMod =
    rig.bodyScale === 'petite'
      ? 0.9
      : rig.bodyScale === 'tall'
        ? 1.08
        : rig.bodyScale === 'broad'
          ? 1.05
          : 1.0;

  const { anticipation, action: actP, followThrough } =
    anticipationActionFollowThrough(progress);

  // Living idle breathing + action kinematics
  const breath = Math.sin(timeSec * 2.6) * unit * 0.018;
  let bobY = breath;
  let leanAngle = 0;
  let walkCycle = 0;

  if (action === 'Berjalan' || action === 'Berlari') {
    const freq = action === 'Berlari' ? 11 : 6.5;
    walkCycle = Math.sin(timeSec * freq);
    bobY += Math.abs(walkCycle) * -unit * 0.045;
    leanAngle = action === 'Berlari' ? 0.12 : 0.05;
  } else if (action === 'Melompat') {
    bobY += -anticipation * unit * 0.05 + Math.sin(actP * Math.PI) * -unit * 0.22 + followThrough * unit * 0.04;
  } else if (action === 'Terkejut Mundur') {
    leanAngle = -0.1 * Math.sin(actP * Math.PI) - anticipation * 0.04;
  } else if (action === 'Berbicara Ekspresif' || action === 'Menunjuk' || action === 'Melambai') {
    leanAngle = Math.sin(timeSec * 3.2) * 0.03;
  }

  // Ground contact shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
  ctx.beginPath();
  ctx.ellipse(cx, cy + unit * 0.72, unit * 0.34 * scaleMod, unit * 0.06, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // If user selected Uploaded Cutout mode and uploaded a character image
  if (char.renderMode === 'uploaded-cutout' && char.imageDataUrl) {
    const img = imageElementCache.get(char.imageDataUrl);
    if (img && img.complete && img.naturalWidth > 0) {
      ctx.save();
      ctx.translate(cx, cy + bobY);
      ctx.rotate(leanAngle);
      const cardW = unit * 0.92 * scaleMod;
      const cardH = unit * 1.25 * scaleMod;
      const topY = -unit * 0.58;
      // Bold black ink outline frame around uploaded character reference
      drawRoundedRect(ctx, -cardW / 2 - inkWidth, topY - inkWidth, cardW + inkWidth * 2, cardH + inkWidth * 2, unit * 0.08);
      ctx.fillStyle = '#0B0D12';
      ctx.fill();

      ctx.save();
      drawRoundedRect(ctx, -cardW / 2, topY, cardW, cardH, unit * 0.065);
      ctx.clip();
      const aspect = img.naturalWidth / img.naturalHeight;
      let dw = cardW;
      let dh = cardW / aspect;
      if (dh < cardH) {
        dh = cardH;
        dw = cardH * aspect;
      }
      ctx.drawImage(img, -dw / 2, topY + (cardH - dh) / 2, dw, dh);
      ctx.restore();
      ctx.restore();
      return;
    }
  }

  // Full 2D Cartoon Rig with Bold Black Ink Outlines (#0B0D12)
  ctx.save();
  ctx.translate(cx, cy + bobY);
  ctx.scale(scaleMod, scaleMod);
  ctx.rotate(leanAngle);
  ctx.strokeStyle = '#0B0D12';
  ctx.lineWidth = inkWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  const bodyW = rig.bodyScale === 'broad' ? unit * 0.38 : unit * 0.31;
  const bodyH = unit * 0.44;
  const torsoTop = -unit * 0.02;

  // Optional Cape behind torso
  if (rig.accessory === 'cape') {
    const wave = Math.sin(timeSec * 3.5) * unit * 0.05;
    ctx.fillStyle = rig.accentHex;
    ctx.beginPath();
    ctx.moveTo(-bodyW * 0.45, torsoTop);
    ctx.quadraticCurveTo(-bodyW * 0.95 + wave, torsoTop + bodyH * 0.7, -bodyW * 0.75 + wave, torsoTop + bodyH * 1.35);
    ctx.lineTo(bodyW * 0.75 + wave, torsoTop + bodyH * 1.35);
    ctx.quadraticCurveTo(bodyW * 0.95 + wave, torsoTop + bodyH * 0.7, bodyW * 0.45, torsoTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Legs
  const legSpread = walkCycle * unit * 0.11;
  const drawLeg = (lx: number, swing: number) => {
    ctx.fillStyle = rig.outfitSecondaryHex;
    drawRoundedRect(ctx, lx - unit * 0.065, torsoTop + bodyH - unit * 0.02 + swing * 0.2, unit * 0.13, unit * 0.32, unit * 0.05);
    ctx.fill();
    ctx.stroke();
    // Shoe
    ctx.fillStyle = '#18181B';
    drawRoundedRect(ctx, lx - unit * 0.075, torsoTop + bodyH + unit * 0.26 + swing * 0.2, unit * 0.16, unit * 0.075, unit * 0.035);
    ctx.fill();
    ctx.stroke();
  };
  drawLeg(-bodyW * 0.26, legSpread);
  drawLeg(bodyW * 0.26, -legSpread);

  // Back Arm (Left side of screen)
  const leftArmAngle =
    action === 'Berjalan' || action === 'Berlari'
      ? -walkCycle * 0.45
      : action === 'Berpikir'
        ? -0.6
        : Math.sin(timeSec * 2.1) * 0.08;
  ctx.save();
  ctx.translate(-bodyW * 0.5, torsoTop + unit * 0.06);
  ctx.rotate(leftArmAngle);
  ctx.fillStyle = rig.outfitPrimaryHex;
  drawRoundedRect(ctx, -unit * 0.055, 0, unit * 0.11, unit * 0.32, unit * 0.05);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rig.skinHex;
  ctx.beginPath();
  ctx.arc(0, unit * 0.33, unit * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Torso / Jacket
  ctx.fillStyle = rig.outfitPrimaryHex;
  drawRoundedRect(ctx, -bodyW / 2, torsoTop, bodyW, bodyH, unit * 0.1);
  ctx.fill();
  ctx.stroke();

  // Jacket inner highlight / collar stripe
  ctx.fillStyle = rig.accentHex;
  drawRoundedRect(ctx, -unit * 0.04, torsoTop + unit * 0.04, unit * 0.08, bodyH - unit * 0.08, unit * 0.03);
  ctx.fill();

  // Scarf accessory
  if (rig.accessory === 'scarf') {
    ctx.fillStyle = rig.accentHex;
    drawRoundedRect(ctx, -bodyW * 0.45, torsoTop - unit * 0.03, bodyW * 0.9, unit * 0.1, unit * 0.05);
    ctx.fill();
    ctx.stroke();
    drawRoundedRect(ctx, unit * 0.05, torsoTop + unit * 0.03, unit * 0.09, unit * 0.2, unit * 0.04);
    ctx.fill();
    ctx.stroke();
  }

  // Front Arm (Right side of screen - dynamic expressive gestures!)
  let rightArmAngle = Math.sin(timeSec * 2.4 + 1) * 0.08;
  if (action === 'Menunjuk') {
    rightArmAngle = -1.25 - anticipation * 0.2 + followThrough * 0.1;
  } else if (action === 'Melambai') {
    rightArmAngle = -2.2 + Math.sin(timeSec * 8) * 0.32;
  } else if (action === 'Berbicara Ekspresif') {
    rightArmAngle = -0.65 + Math.sin(timeSec * 6.5) * 0.25;
  } else if (action === 'Berjalan' || action === 'Berlari') {
    rightArmAngle = walkCycle * 0.45;
  } else if (action === 'Melompat') {
    rightArmAngle = -2.1;
  }

  ctx.save();
  ctx.translate(bodyW * 0.5, torsoTop + unit * 0.06);
  ctx.rotate(rightArmAngle);
  ctx.fillStyle = rig.outfitPrimaryHex;
  drawRoundedRect(ctx, -unit * 0.055, 0, unit * 0.11, unit * 0.32, unit * 0.05);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = rig.skinHex;
  ctx.beginPath();
  ctx.arc(0, unit * 0.33, unit * 0.055, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Neck
  ctx.fillStyle = rig.skinHex;
  ctx.fillRect(-unit * 0.055, torsoTop - unit * 0.07, unit * 0.11, unit * 0.09);
  ctx.strokeRect(-unit * 0.055, torsoTop - unit * 0.07, unit * 0.11, unit * 0.09);

  // Head
  const headY = torsoTop - unit * 0.27;
  const headRx = rig.faceShape === 'round' ? unit * 0.24 : rig.faceShape === 'square' ? unit * 0.22 : unit * 0.21;
  const headRy = rig.faceShape === 'round' ? unit * 0.22 : unit * 0.24;

  // Back hair for long/bob/ponytail
  if (rig.hairStyle === 'long-wavy' || rig.hairStyle === 'bob') {
    ctx.fillStyle = rig.hairHex;
    drawRoundedRect(
      ctx,
      -headRx * 1.12,
      headY - headRy * 0.9,
      headRx * 2.24,
      rig.hairStyle === 'long-wavy' ? headRy * 2.3 : headRy * 1.6,
      unit * 0.12
    );
    ctx.fill();
    ctx.stroke();
  }

  // Ears
  ctx.fillStyle = rig.skinHex;
  ctx.beginPath();
  ctx.arc(-headRx, headY + unit * 0.02, unit * 0.045, 0, Math.PI * 2);
  ctx.arc(headRx, headY + unit * 0.02, unit * 0.045, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Face contour
  ctx.fillStyle = rig.skinHex;
  if (rig.faceShape === 'square') {
    drawRoundedRect(ctx, -headRx, headY - headRy, headRx * 2, headRy * 2, unit * 0.1);
  } else {
    ctx.beginPath();
    ctx.ellipse(0, headY, headRx, headRy, 0, 0, Math.PI * 2);
  }
  ctx.fill();
  ctx.stroke();

  // Eyes (with blinking)
  const blinkCycle = timeSec % 3.4;
  const isBlinking = blinkCycle > 3.22;
  const eyeY = headY - unit * 0.01;
  const eyeOffsetX = unit * 0.085;
  const eyeW = rig.eyeShape === 'wide' ? unit * 0.055 : unit * 0.048;
  const eyeH = isBlinking
    ? unit * 0.008
    : expression === 'Terkejut'
      ? unit * 0.072
      : rig.eyeShape === 'almond'
        ? unit * 0.045
        : unit * 0.06;

  [-eyeOffsetX, eyeOffsetX].forEach((ex) => {
    if (isBlinking) {
      ctx.beginPath();
      ctx.moveTo(ex - eyeW, eyeY);
      ctx.lineTo(ex + eyeW, eyeY);
      ctx.stroke();
    } else {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(ex, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Pupil
      ctx.fillStyle = '#0F172A';
      const pupilR = expression === 'Terkejut' ? eyeW * 0.45 : eyeW * 0.58;
      ctx.beginPath();
      ctx.arc(ex + unit * 0.008, eyeY, pupilR, 0, Math.PI * 2);
      ctx.fill();

      // Eye specular catchlight
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(ex + unit * 0.018, eyeY - eyeH * 0.25, pupilR * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // Glasses accessory
  if (rig.accessory === 'glasses') {
    ctx.save();
    ctx.strokeStyle = '#0B0D12';
    ctx.lineWidth = Math.max(2, inkWidth * 0.65);
    ctx.beginPath();
    ctx.arc(-eyeOffsetX, eyeY, eyeW * 1.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(eyeOffsetX, eyeY, eyeW * 1.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-eyeOffsetX + eyeW * 1.45, eyeY);
    ctx.lineTo(eyeOffsetX - eyeW * 1.45, eyeY);
    ctx.stroke();
    ctx.restore();
  }

  // Dynamic Eyebrows
  ctx.save();
  ctx.strokeStyle = rig.hairHex === '#18181B' ? '#0B0D12' : rig.hairHex;
  ctx.lineWidth = Math.max(2.5, inkWidth * 0.85);
  const browY = eyeY - unit * 0.085;
  const browTilt =
    expression === 'Marah' || expression === 'Bertekad'
      ? 0.28
      : expression === 'Sedih' || expression === 'Penasaran'
        ? -0.22
        : 0;
  const browLift = expression === 'Terkejut' || expression === 'Senang' ? -unit * 0.025 : 0;

  ctx.beginPath();
  ctx.moveTo(-eyeOffsetX - eyeW, browY + browLift - browTilt * unit * 0.04);
  ctx.lineTo(-eyeOffsetX + eyeW, browY + browLift + browTilt * unit * 0.04);
  ctx.moveTo(eyeOffsetX - eyeW, browY + browLift + browTilt * unit * 0.04);
  ctx.lineTo(eyeOffsetX + eyeW, browY + browLift - browTilt * unit * 0.04);
  ctx.stroke();
  ctx.restore();

  // Dynamic Mouth + Lip Sync
  const mouthY = headY + unit * 0.115;
  const speakOpen = isSpeaking ? (0.35 + 0.65 * Math.abs(Math.sin(timeSec * 14))) * unit * 0.045 : 0;
  ctx.fillStyle = '#7F1D1D';
  if (isSpeaking && speakOpen > unit * 0.012) {
    ctx.beginPath();
    ctx.ellipse(0, mouthY, unit * 0.055, speakOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (expression === 'Senang') {
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, mouthY - unit * 0.01, unit * 0.065, 0.1, Math.PI - 0.1);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (expression === 'Terkejut') {
    ctx.beginPath();
    ctx.ellipse(0, mouthY + unit * 0.01, unit * 0.038, unit * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (expression === 'Sedih' || expression === 'Marah') {
    ctx.beginPath();
    ctx.arc(0, mouthY + unit * 0.045, unit * 0.055, Math.PI + 0.25, -0.25);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-unit * 0.045, mouthY);
    ctx.quadraticCurveTo(0, mouthY + unit * 0.02, unit * 0.05, mouthY - unit * 0.005);
    ctx.stroke();
  }

  // Front Hair Crown
  if (rig.hairStyle !== 'bald') {
    ctx.fillStyle = rig.hairHex;
    ctx.beginPath();
    ctx.arc(0, headY - headRy * 0.35, headRx * 1.06, Math.PI * 0.95, Math.PI * 2.05);
    if (rig.hairStyle === 'short-spiky') {
      ctx.lineTo(headRx * 0.85, headY - headRy * 0.72);
      ctx.lineTo(headRx * 0.35, headY - headRy * 0.55);
      ctx.lineTo(0, headY - headRy * 0.85);
      ctx.lineTo(-headRx * 0.4, headY - headRy * 0.55);
      ctx.lineTo(-headRx * 0.85, headY - headRy * 0.75);
    } else {
      ctx.quadraticCurveTo(0, headY - headRy * 0.45, -headRx * 1.06, headY - headRy * 0.25);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Hat / Headphones
  if (rig.accessory === 'hat') {
    ctx.fillStyle = rig.accentHex;
    drawRoundedRect(ctx, -headRx * 1.25, headY - headRy * 0.82, headRx * 2.5, unit * 0.06, unit * 0.03);
    ctx.fill();
    ctx.stroke();
    drawRoundedRect(ctx, -headRx * 0.78, headY - headRy * 1.25, headRx * 1.56, headRy * 0.5, unit * 0.08);
    ctx.fill();
    ctx.stroke();
  } else if (rig.accessory === 'headphones') {
    ctx.strokeStyle = rig.accentHex;
    ctx.lineWidth = Math.max(4, inkWidth * 1.3);
    ctx.beginPath();
    ctx.arc(0, headY - unit * 0.02, headRx * 1.15, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
  }

  ctx.restore();
}

export interface RenderFrameOptions {
  showSubtitles: boolean;
  isSpeaking?: boolean;
  referenceImages?: ReferenceImage[];
}

export function renderSceneFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: SceneItem,
  characters: CharacterRef[],
  styleId: AnimationStyleId,
  timeSec: number,
  totalSec: number,
  options: RenderFrameOptions
): void {
  const style = ANIMATION_STYLES.find((s) => s.id === styleId) ?? ANIMATION_STYLES[0];
  const safeTotal = Math.max(0.5, totalSec);
  const progress = Math.max(0, Math.min(1, timeSec / safeTotal));
  const cam = getCameraTransform(scene.cameraMovement, progress, width, height);

  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // Apply Camera Transform
  ctx.translate(width / 2 + cam.tx, height / 2 + cam.ty);
  ctx.scale(cam.scale, cam.scale);
  ctx.rotate(cam.rot);
  ctx.translate(-width / 2, -height / 2);

  // If user manually uploaded a custom scene image, render it with cinematic camera & lighting
  if (scene.customImageUploaded && scene.imageDataUrl) {
    const customImg = imageElementCache.get(scene.imageDataUrl);
    if (customImg && customImg.complete && customImg.naturalWidth > 0) {
      const aspect = customImg.naturalWidth / customImg.naturalHeight;
      let dw = width;
      let dh = width / aspect;
      if (dh < height) {
        dh = height;
        dw = height * aspect;
      }
      ctx.drawImage(customImg, (width - dw) / 2, (height - dh) / 2, dw, dh);
    } else {
      draw3DCinematicEnvironment(ctx, width, height, scene, timeSec, options.referenceImages ?? []);
    }
  } else {
    // Render 3D Cinematic Environment
    draw3DCinematicEnvironment(ctx, width, height, scene, timeSec, options.referenceImages ?? []);

    // Render Assigned Characters (preserving Character ID consistency!)
    const sceneChars = characters.filter((c) => scene.characterIds.includes(c.id));
    const activeChars = sceneChars.length > 0 ? sceneChars : characters.slice(0, 1);
    const unit = width * 0.29 * (scene.artSpec.characterScale || 1);
    const inkWidth = Math.max(2, (width / 540) * style.inkWidth);
    const baseY = height * 0.64;

    if (activeChars.length === 1) {
      const cx = width * (0.5 + (scene.artSpec.characterXOffset || 0));
      drawCartoonCharacter(
        ctx,
        activeChars[0],
        cx,
        baseY,
        unit,
        inkWidth,
        scene.facialExpression,
        scene.characterAction,
        progress,
        timeSec,
        Boolean(options.isSpeaking)
      );
    } else if (activeChars.length >= 2) {
      const spacing = width * 0.24;
      const centerX = width * (0.5 + (scene.artSpec.characterXOffset || 0) * 0.5);
      activeChars.slice(0, 3).forEach((ch, idx) => {
        const offset = (idx - (Math.min(activeChars.length, 3) - 1) / 2) * spacing;
        drawCartoonCharacter(
          ctx,
          ch,
          centerX + offset,
          baseY + (idx % 2 === 1 ? height * 0.015 : 0),
          unit * 0.88,
          inkWidth,
          scene.facialExpression,
          idx === 0 ? scene.characterAction : 'Berdiri Bernapas',
          progress,
          timeSec + idx * 0.5,
          Boolean(options.isSpeaking && idx === 0)
        );
      });
    }
  }

  ctx.restore();

  // Cinematic Depth-of-Field Edge Vignette
  const vig = ctx.createRadialGradient(
    width / 2,
    height / 2,
    width * 0.3,
    width / 2,
    height / 2,
    height * 0.72
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(5, 8, 15, 0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, width, height);

  // Smooth fade in/out for cinematic transitions (first 0.35s & last 0.35s)
  if (timeSec < 0.35) {
    ctx.fillStyle = `rgba(5, 8, 15, ${(1 - timeSec / 0.35).toFixed(2)})`;
    ctx.fillRect(0, 0, width, height);
  } else if (safeTotal - timeSec < 0.35 && safeTotal > 1) {
    ctx.fillStyle = `rgba(5, 8, 15, ${(1 - (safeTotal - timeSec) / 0.35).toFixed(2)})`;
    ctx.fillRect(0, 0, width, height);
  }

  // STRICT SUBTITLE GOVERNANCE: NEVER draw subtitles unless explicitly enabled by user!
  if (options.showSubtitles && scene.dialogue.trim()) {
    ctx.save();
    const padX = width * 0.07;
    const boxW = width - padX * 2;
    const fontSize = Math.round(width * 0.036);
    ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
    const words = scene.dialogue.trim().split(/\s+/);
    const lines: string[] = [];
    let current = '';
    for (const w of words) {
      const test = current ? `${current} ${w}` : w;
      if (ctx.measureText(test).width > boxW - width * 0.08) {
        if (current) lines.push(current);
        current = w;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
    const visibleLines = lines.slice(0, 3);
    const lineHeight = fontSize * 1.35;
    const boxH = visibleLines.length * lineHeight + fontSize * 0.9;
    const boxY = height - boxH - height * 0.08;

    drawRoundedRect(ctx, padX, boxY, boxW, boxH, width * 0.025);
    ctx.fillStyle = 'rgba(8, 12, 20, 0.78)';
    ctx.fill();

    ctx.fillStyle = '#F8FAFC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    visibleLines.forEach((line, idx) => {
      ctx.fillText(
        line,
        width / 2,
        boxY + fontSize * 0.65 + idx * lineHeight + lineHeight * 0.3
      );
    });
    ctx.restore();
  }
}

export async function renderScenePosterDataUrl(
  scene: SceneItem,
  characters: CharacterRef[],
  styleId: AnimationStyleId,
  referenceImages: ReferenceImage[] = [],
  width = 540,
  height = 960
): Promise<string> {
  // Preload any character or reference images first
  await Promise.all([
    ...characters
      .filter((c) => c.imageDataUrl)
      .map((c) => preloadImageUrl(c.imageDataUrl!)),
    ...referenceImages.map((r) => preloadImageUrl(r.imageDataUrl)),
    ...(scene.customImageUploaded && scene.imageDataUrl
      ? [preloadImageUrl(scene.imageDataUrl)]
      : []),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Render hero mid-action frame (45% into scene)
  renderSceneFrameToCanvas(
    ctx,
    width,
    height,
    scene,
    characters,
    styleId,
    scene.durationSeconds * 0.45,
    scene.durationSeconds,
    {
      showSubtitles: false,
      isSpeaking: false,
      referenceImages,
    }
  );
  return canvas.toDataURL('image/jpeg', 0.9);
}

export async function captureSceneJpegFrames(
  scene: SceneItem,
  characters: CharacterRef[],
  styleId: AnimationStyleId,
  referenceImages: ReferenceImage[],
  showSubtitles: boolean,
  fps: number,
  width: number,
  height: number,
  onFrameProgress?: (frameIndex: number, totalFrames: number) => void
): Promise<Blob[]> {
  await Promise.all([
    ...characters
      .filter((c) => c.imageDataUrl)
      .map((c) => preloadImageUrl(c.imageDataUrl!)),
    ...referenceImages.map((r) => preloadImageUrl(r.imageDataUrl)),
    ...(scene.customImageUploaded && scene.imageDataUrl
      ? [preloadImageUrl(scene.imageDataUrl)]
      : []),
  ]);

  const effectiveDuration = Math.max(
    scene.durationSeconds,
    scene.voiceDurationSeconds ?? 0
  );
  const totalFrames = Math.max(15, Math.round(effectiveDuration * fps));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context tidak tersedia.');

  const blobs: Blob[] = [];
  const hasVoice = Boolean(scene.dialogue.trim() && scene.audioMode !== 'silent');
  const voiceDur = scene.voiceDurationSeconds ?? effectiveDuration * 0.85;

  for (let i = 0; i < totalFrames; i++) {
    const timeSec = i / fps;
    const isSpeaking = hasVoice && timeSec >= 0.25 && timeSec <= voiceDur + 0.25;
    renderSceneFrameToCanvas(
      ctx,
      width,
      height,
      scene,
      characters,
      styleId,
      timeSec,
      effectiveDuration,
      {
        showSubtitles,
        isSpeaking,
        referenceImages,
      }
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Gagal membuat frame JPEG'))),
        'image/jpeg',
        0.86
      );
    });
    blobs.push(blob);
    if (onFrameProgress && i % 5 === 0) {
      onFrameProgress(i + 1, totalFrames);
    }
  }
  return blobs;
}
