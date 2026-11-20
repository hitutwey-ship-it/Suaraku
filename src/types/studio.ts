export type AnimationStyleId =
  | '2d-ink-3d-cinema'
  | '2d-anime-3d-parallax'
  | '2d-noir-comic-3d'
  | '2d-storybook-3d';

export type DurationPresetId = '30s' | '1m' | '3m' | '5m' | '10m' | 'custom';

export type DialogueLanguageId = 'id' | 'su' | 'en' | 'jv' | 'other';

export type AudioDeliveryMode =
  | 'voiceover'
  | 'dialogue'
  | 'multi-character'
  | 'silent';

export type CameraMovement =
  | 'Dolly in'
  | 'Dolly out'
  | 'Pan left'
  | 'Pan right'
  | 'Tracking shot'
  | 'Crane shot'
  | 'Close-up'
  | 'Medium shot'
  | 'Wide shot'
  | 'Orbit camera'
  | 'Smooth cinematic transition';

export type FacialExpression =
  | 'Netral'
  | 'Senang'
  | 'Terkejut'
  | 'Serius'
  | 'Sedih'
  | 'Marah'
  | 'Penasaran'
  | 'Bertekad';

export type CharacterPoseAction =
  | 'Berdiri Bernapas'
  | 'Berjalan'
  | 'Berlari'
  | 'Berbicara Ekspresif'
  | 'Menunjuk'
  | 'Melambai'
  | 'Melompat'
  | 'Terkejut Mundur'
  | 'Berpikir';

export type MusicMoodId =
  | 'cinematic-adventure'
  | 'warm-emotional'
  | 'mystery-tension'
  | 'upbeat-playful'
  | 'nusantara-ambient'
  | 'none';

export type SfxCategoryId =
  | 'wind-forest'
  | 'footsteps-stone'
  | 'whoosh-transition'
  | 'city-rain'
  | 'sparkle-magic'
  | 'dramatic-boom'
  | 'none';

export interface CharacterVisualRig {
  faceShape: 'oval' | 'round' | 'square' | 'heart';
  eyeShape: 'wide' | 'almond' | 'sharp' | 'cheerful';
  hairStyle: 'short-spiky' | 'long-wavy' | 'bob' | 'ponytail' | 'curly' | 'bald';
  accessory: 'none' | 'glasses' | 'hat' | 'scarf' | 'cape' | 'backpack' | 'headphones';
  bodyScale: 'petite' | 'medium' | 'tall' | 'broad';
  skinHex: string;
  hairHex: string;
  outfitPrimaryHex: string;
  outfitSecondaryHex: string;
  accentHex: string;
}

export interface CharacterRef {
  id: string; // e.g. CHR-01
  name: string;
  role: 'main' | 'supporting';
  imageDataUrl?: string;
  renderMode: 'cartoon-rig' | 'uploaded-cutout';
  voiceId: string;
  // 8 locked consistency fields
  faceShape: string;
  bodyColor: string;
  clothing: string;
  bodySize: string;
  eyeShape: string;
  animationStyle: string;
  accessories: string;
  distinctiveTraits: string;
  visualRig: CharacterVisualRig;
}

export interface ReferenceImage {
  id: string;
  name: string;
  category: 'environment' | 'style' | 'prop';
  imageDataUrl: string;
  notes: string;
}

export interface SceneArtSpec {
  skyTopHex: string;
  skyBottomHex: string;
  groundHex: string;
  architectureType: 'forest' | 'city' | 'village' | 'workshop' | 'mountain' | 'interior';
  timeOfDay: 'golden-hour' | 'night-moon' | 'daylight' | 'dusk-dramatic' | 'misty-dawn';
  lightBeamHex: string;
  weatherParticle: 'none' | 'fireflies' | 'rain' | 'leaves' | 'dust' | 'sparkles';
  depthOfFieldStrength: number; // 0..1
  characterScale: number; // 0.6..1.6
  characterXOffset: number; // -0.35..0.35
}

export interface DialogueLine {
  characterId: string; // 'NARATOR' or 'CHR-01'
  speakerName: string;
  voiceId: string;
  line: string;
}

export interface SceneItem {
  id: string;
  sceneNumber: number;
  title: string;
  durationSeconds: number;
  approved: boolean;
  lockedNotice?: boolean;
  // Visual storyboard data
  imageDataUrl: string;
  customImageUploaded?: boolean;
  visualDescription: string;
  characterIds: string[];
  characterPosition: string;
  facialExpression: FacialExpression;
  characterAction: CharacterPoseAction;
  cameraMovement: CameraMovement;
  location: string;
  lighting: string;
  // Audio & Dialogue
  dialogue: string;
  dialogueLines: DialogueLine[];
  audioMode: AudioDeliveryMode;
  soundFx: string;
  sfxCategory: SfxCategoryId;
  backgroundMusic: string;
  musicMood: MusicMoodId;
  // Separate Prompts
  imagePrompt: string;
  videoPrompt: string;
  // 2D-in-3D Engine spec
  artSpec: SceneArtSpec;
  // Synthesized Audio Track (exact duration preserved)
  voiceAudioBase64?: string;
  voiceAudioMime?: string;
  voiceDurationSeconds?: number;
  // Per-scene rendered video preview state
  videoBakedAt?: string;
}

export interface AudioMixSettings {
  voiceOverVolume: number; // 0-100 (default 100)
  dialogueVolume: number; // 0-100 (default 100)
  musicVolume: number; // 0-100 (default 50 per spec)
  sfxVolume: number; // 0-100 (default 50 per spec)
  showSubtitles: boolean; // MUST default to false per spec
}

export interface Project {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  storyIdea: string;
  storyScript: string;
  animationStyle: AnimationStyleId;
  durationPreset: DurationPresetId;
  customDurationSeconds: number;
  language: DialogueLanguageId;
  customLanguageName: string;
  audioDeliveryMode: AudioDeliveryMode;
  narratorVoiceId: string;
  referenceImages: ReferenceImage[];
  characters: CharacterRef[];
  scenes: SceneItem[];
  audioMix: AudioMixSettings;
  finalVideoUrl?: string;
  finalVideoRenderedAt?: string;
  finalVideoDurationSeconds?: number;
}

export type StudioNavSection =
  | 'dashboard'
  | 'characters'
  | 'storyboard'
  | 'timeline'
  | 'render';

export interface RenderProgressState {
  status: 'idle' | 'preparing-audio' | 'rendering-scenes' | 'stitching-mp4' | 'completed' | 'error';
  percent: number;
  currentStepLabel: string;
  currentSceneIndex: number;
  totalScenes: number;
  errorMessage?: string;
}
