import type {
  AnimationStyleId,
  AudioDeliveryMode,
  CameraMovement,
  CharacterPoseAction,
  DialogueLanguageId,
  DurationPresetId,
  FacialExpression,
  MusicMoodId,
  Project,
  SfxCategoryId,
} from '../types/studio';

export const ANIMATION_STYLES: {
  id: AnimationStyleId;
  label: string;
  description: string;
  inkWidth: number;
  contrastBoost: number;
}[] = [
  {
    id: '2d-ink-3d-cinema',
    label: 'Kartun 2D Outline Tinta + Lingkungan 3D Sinematik',
    description: 'Garis tinta hitam tegas, tekstur 3D atmosferik, depth of field & lighting dramatis.',
    inkWidth: 4.5,
    contrastBoost: 1.0,
  },
  {
    id: '2d-anime-3d-parallax',
    label: 'Animasi 2D Ekspresif + Latar 3D Parallax',
    description: 'Siluet bersih, cel-shading tajam, pencahayaan rim-light sinematik.',
    inkWidth: 3.5,
    contrastBoost: 1.08,
  },
  {
    id: '2d-noir-comic-3d',
    label: 'Komik Tinta Kontras Tinggi + Ruang 3D Dramatis',
    description: 'Outline tebal ekspresif, bayangan dramatis, sorot cahaya volumetrik.',
    inkWidth: 5.5,
    contrastBoost: 1.15,
  },
  {
    id: '2d-storybook-3d',
    label: 'Ilustrasi 2D Hangat + Kedalaman 3D Depth-of-Field',
    description: 'Palet lembut, partikel cahaya hangat, transisi kamera halus.',
    inkWidth: 4.0,
    contrastBoost: 0.96,
  },
];

export const DURATION_PRESETS: {
  id: DurationPresetId;
  label: string;
  seconds: number;
  recommendedScenes: number;
}[] = [
  { id: '30s', label: '30 detik', seconds: 30, recommendedScenes: 4 },
  { id: '1m', label: '1 menit', seconds: 60, recommendedScenes: 6 },
  { id: '3m', label: '3 menit', seconds: 180, recommendedScenes: 12 },
  { id: '5m', label: '5 menit', seconds: 300, recommendedScenes: 18 },
  { id: '10m', label: '10 menit', seconds: 600, recommendedScenes: 28 },
  { id: 'custom', label: 'Custom', seconds: 45, recommendedScenes: 5 },
];

export const DIALOGUE_LANGUAGES: {
  id: DialogueLanguageId;
  label: string;
  hint: string;
}[] = [
  { id: 'id', label: 'Bahasa Indonesia', hint: 'Dialog & narasi natural Indonesia' },
  { id: 'su', label: 'Bahasa Sunda', hint: 'Lentong jeung kecap Basa Sunda merenah' },
  { id: 'en', label: 'Bahasa Inggris', hint: 'Natural cinematic English dialogue' },
  { id: 'jv', label: 'Bahasa Jawa', hint: 'Unggah-ungguh lan basa Jawa natural' },
  { id: 'other', label: 'Bahasa Lainnya', hint: 'Tentukan bahasa sesuai kebutuhan proyek' },
];

export const AUDIO_DELIVERY_MODES: {
  id: AudioDeliveryMode;
  label: string;
  description: string;
}[] = [
  {
    id: 'voiceover',
    label: 'Voice Over Narator',
    description: 'Satu suara narator sinematik memandu cerita.',
  },
  {
    id: 'dialogue',
    label: 'Dialog Antar Karakter',
    description: 'Percakapan langsung antar karakter dengan suara berbeda.',
  },
  {
    id: 'multi-character',
    label: 'Narator + Suara Karakter Berbeda',
    description: 'Kombinasi narasi pembuka dan suara unik tiap Character ID.',
  },
  {
    id: 'silent',
    label: 'Tanpa Suara (Visual + Musik/SFX)',
    description: 'Tanpa dialog atau narasi, fokus visual, musik latar & efek suara.',
  },
];

export const CAMERA_MOVEMENTS: CameraMovement[] = [
  'Dolly in',
  'Dolly out',
  'Pan left',
  'Pan right',
  'Tracking shot',
  'Crane shot',
  'Close-up',
  'Medium shot',
  'Wide shot',
  'Orbit camera',
  'Smooth cinematic transition',
];

export const FACIAL_EXPRESSIONS: FacialExpression[] = [
  'Netral',
  'Senang',
  'Terkejut',
  'Serius',
  'Sedih',
  'Marah',
  'Penasaran',
  'Bertekad',
];

export const CHARACTER_ACTIONS: CharacterPoseAction[] = [
  'Berdiri Bernapas',
  'Berjalan',
  'Berlari',
  'Berbicara Ekspresif',
  'Menunjuk',
  'Melambai',
  'Melompat',
  'Terkejut Mundur',
  'Berpikir',
];

export const MUSIC_MOODS: { id: MusicMoodId; label: string }[] = [
  { id: 'cinematic-adventure', label: 'Sinematik Petualangan' },
  { id: 'warm-emotional', label: 'Hangat & Emosional' },
  { id: 'mystery-tension', label: 'Misteri & Tegang' },
  { id: 'upbeat-playful', label: 'Ceria & Dinamis' },
  { id: 'nusantara-ambient', label: 'Atmosfer Nusantara' },
  { id: 'none', label: 'Tanpa Musik' },
];

export const SFX_CATEGORIES: { id: SfxCategoryId; label: string }[] = [
  { id: 'wind-forest', label: 'Angin & Alam Hutan' },
  { id: 'footsteps-stone', label: 'Langkah Kaki & Gerakan' },
  { id: 'whoosh-transition', label: 'Desingan Sinematik (Whoosh)' },
  { id: 'city-rain', label: 'Hujan & Atmosfer Kota' },
  { id: 'sparkle-magic', label: 'Kilau Cahaya / Ajaib' },
  { id: 'dramatic-boom', label: 'Dentuman Dramatis' },
  { id: 'none', label: 'Tanpa Efek Suara' },
];

export function formatTimecode(totalSeconds: number): string {
  const safe = Math.max(0, Math.round(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function createStarterProject(): Project {
  const now = new Date().toISOString();
  return {
    id: `proj-${Date.now()}`,
    title: 'Lentera di Lembah Kabut',
    createdAt: now,
    updatedAt: now,
    storyIdea:
      'Seorang penjelajah muda bernama Arka bersama sahabatnya Nara menemukan lentera kuno di lembah berkabut yang mampu membangkitkan hutan yang tertidur.',
    storyScript:
      'SCENE 01: Kabut pagi menyelimuti Lembah Merapi. Arka melangkah pelan membawa peta tua dan ransel kanvas.\nSCENE 02: Nara menunjuk ke arah gerbang batu tua yang memancarkan cahaya keemasan di balik pepohonan 3D yang menjulang.\nSCENE 03: Arka mendekati lentera kuno di atas altar lumut. Cahaya hangat menyinari wajahnya saat ia menyentuhnya.\nSCENE 04: Lentera menyala terang, menerbangkan kunang-kunang cahaya ke langit senja sementara Arka dan Nara tersenyum lega.',
    animationStyle: '2d-ink-3d-cinema',
    durationPreset: '30s',
    customDurationSeconds: 30,
    language: 'id',
    customLanguageName: '',
    audioDeliveryMode: 'multi-character',
    narratorVoiceId: 'prabu',
    referenceImages: [],
    characters: [
      {
        id: 'CHR-01',
        name: 'Arka',
        role: 'main',
        renderMode: 'cartoon-rig',
        voiceId: 'bima',
        faceShape: 'Oval tegas dengan dagu seimbang',
        bodyColor: 'Sawo matang hangat (#D99B72)',
        clothing: 'Jaket petualang hijau zaitun, kaus krem, celana kargo gelap',
        bodySize: 'Tinggi ramping atletis (172 cm)',
        eyeShape: 'Mata lebar ekspresif cokelat tua',
        animationStyle: 'Kartun 2D outline tinta hitam tebal dengan cel-shading lembut',
        accessories: 'Ransel kanvas cokelat & syal jingga di leher',
        distinctiveTraits: 'Rambut hitam berantakan sedikit ikal, ekspresi penuh rasa ingin tahu',
        visualRig: {
          faceShape: 'oval',
          eyeShape: 'wide',
          hairStyle: 'short-spiky',
          accessory: 'scarf',
          bodyScale: 'medium',
          skinHex: '#D99B72',
          hairHex: '#18181B',
          outfitPrimaryHex: '#3F6212',
          outfitSecondaryHex: '#1E293B',
          accentHex: '#EA580C',
        },
      },
      {
        id: 'CHR-02',
        name: 'Nara',
        role: 'supporting',
        renderMode: 'cartoon-rig',
        voiceId: 'naya',
        faceShape: 'Bulat lembut ceria',
        bodyColor: 'Kuning langsat cerah (#ECC09E)',
        clothing: 'Mantel hujan biru baja dan tas selempang kecil',
        bodySize: 'Sedang lincah (162 cm)',
        eyeShape: 'Mata almond cerah dengan alis dinamis',
        animationStyle: 'Kartun 2D outline tinta hitam tegas konsisten',
        accessories: 'Kacamata bulat tipis & jepit rambut emas',
        distinctiveTraits: 'Rambut bob cokelat tua, gerakan tangan ekspresif saat berbicara',
        visualRig: {
          faceShape: 'round',
          eyeShape: 'cheerful',
          hairStyle: 'bob',
          accessory: 'glasses',
          bodyScale: 'petite',
          skinHex: '#ECC09E',
          hairHex: '#3F2318',
          outfitPrimaryHex: '#1D4ED8',
          outfitSecondaryHex: '#334155',
          accentHex: '#F59E0B',
        },
      },
    ],
    scenes: [
      {
        id: 'scn-01',
        sceneNumber: 1,
        title: 'Langkah Pertama di Lembah Kabut',
        durationSeconds: 7,
        approved: false,
        imageDataUrl: '',
        visualDescription:
          'Arka berjalan menyusuri jalan setapak lembah 3D berkabut dengan pepohonan pinus tinggi dan sorotan cahaya pagi.',
        characterIds: ['CHR-01'],
        characterPosition: 'Tengah-kiri frame, menghadap ke kanan jalur setapak',
        facialExpression: 'Penasaran',
        characterAction: 'Berjalan',
        cameraMovement: 'Dolly in',
        location: 'Lembah pinus berkabut dengan kedalaman 3D dan batu berlumut',
        lighting: 'Golden hour menembus kabut tipis dengan rim light hangat di outline karakter',
        dialogue:
          'Kabut pagi menyelimuti Lembah Merapi. Arka melangkah maju, mencari lentera yang telah lama hilang.',
        dialogueLines: [
          {
            characterId: 'NARATOR',
            speakerName: 'Narator (Prabu)',
            voiceId: 'prabu',
            line: 'Kabut pagi menyelimuti Lembah Merapi. Arka melangkah maju, mencari lentera yang telah lama hilang.',
          },
        ],
        audioMode: 'voiceover',
        soundFx: 'Angin hutan lembut dan langkah kaki di atas tanah lembap',
        sfxCategory: 'wind-forest',
        backgroundMusic: 'Alunan string atmosferik bernuansa petualangan misterius',
        musicMood: 'cinematic-adventure',
        imagePrompt:
          '2D cartoon character Arka (CHR-01, bold black ink outline, olive explorer jacket, orange scarf) walking in a 3D cinematic misty pine valley, dramatic golden hour volumetric light rays, shallow depth of field, vertical 9:16.',
        videoPrompt:
          'Smooth dolly in camera tracking Arka (CHR-01) walking forward with anticipation and follow-through motion, mist drifting across 3D foreground, subtle blinking and curious gaze, 30fps.',
        artSpec: {
          skyTopHex: '#1E293B',
          skyBottomHex: '#F59E0B',
          groundHex: '#1E3A2F',
          architectureType: 'forest',
          timeOfDay: 'misty-dawn',
          lightBeamHex: '#FCD34D',
          weatherParticle: 'leaves',
          depthOfFieldStrength: 0.65,
          characterScale: 1.0,
          characterXOffset: -0.05,
        },
      },
      {
        id: 'scn-02',
        sceneNumber: 2,
        title: 'Gerbang Batu Bercahaya',
        durationSeconds: 8,
        approved: false,
        imageDataUrl: '',
        visualDescription:
          'Nara menoleh cepat dan menunjuk ke gerbang batu kuno di kejauhan yang memancarkan sinar keemasan.',
        characterIds: ['CHR-02', 'CHR-01'],
        characterPosition: 'Nara di kanan depan, Arka di kiri agak ke belakang',
        facialExpression: 'Terkejut',
        characterAction: 'Menunjuk',
        cameraMovement: 'Pan right',
        location: 'Gerbang batu kuno di tengah hutan 3D dengan kedalaman kabut',
        lighting: 'Kontras sinar biru lembap dan pendar emas dari gerbang batu',
        dialogue: 'Arka, lihat di sana! Cahaya itu berasal dari gerbang batu tua!',
        dialogueLines: [
          {
            characterId: 'CHR-02',
            speakerName: 'Nara',
            voiceId: 'naya',
            line: 'Arka, lihat di sana! Cahaya itu berasal dari gerbang batu tua!',
          },
        ],
        audioMode: 'dialogue',
        soundFx: 'Desingan angin sinematik dan suara dedaunan berdesir',
        sfxCategory: 'whoosh-transition',
        backgroundMusic: 'Musik naik perlahan penuh rasa ingin tahu',
        musicMood: 'mystery-tension',
        imagePrompt:
          '2D cartoon characters Nara (CHR-02, blue coat, round glasses, bold black ink outline) pointing toward an ancient glowing stone archway while Arka (CHR-01) looks amazed, 3D cinematic forest depth, vertical 9:16.',
        videoPrompt:
          'Smooth pan right revealing glowing archway, Nara points decisively with anticipation and follow-through, Arka reacts with widened eyes, drifting fireflies, 30fps.',
        artSpec: {
          skyTopHex: '#0F172A',
          skyBottomHex: '#3B82F6',
          groundHex: '#1F2937',
          architectureType: 'mountain',
          timeOfDay: 'dusk-dramatic',
          lightBeamHex: '#FBBF24',
          weatherParticle: 'fireflies',
          depthOfFieldStrength: 0.72,
          characterScale: 0.98,
          characterXOffset: 0.08,
        },
      },
      {
        id: 'scn-03',
        sceneNumber: 3,
        title: 'Cahaya Lentera Kuno',
        durationSeconds: 8,
        approved: false,
        imageDataUrl: '',
        visualDescription:
          'Close-up sinematik Arka berhadapan dengan lentera keemasan yang berdenyut hangat di atas altar batu 3D.',
        characterIds: ['CHR-01'],
        characterPosition: 'Close-up tengah frame, cahaya lentera menerangi wajah',
        facialExpression: 'Bertekad',
        characterAction: 'Berbicara Ekspresif',
        cameraMovement: 'Close-up',
        location: 'Altar batu berlumut di pusat reruntuhan hutan 3D',
        lighting: 'Pencahayaan dramatis keemasan dari bawah ke atas (key light) + latar bokeh gelap',
        dialogue: 'Akhirnya kita menemukannya. Saatnya membangunkan kembali lembah ini.',
        dialogueLines: [
          {
            characterId: 'CHR-01',
            speakerName: 'Arka',
            voiceId: 'bima',
            line: 'Akhirnya kita menemukannya. Saatnya membangunkan kembali lembah ini.',
          },
        ],
        audioMode: 'dialogue',
        soundFx: 'Kilau cahaya magis dan dengungan hangat lentera',
        sfxCategory: 'sparkle-magic',
        backgroundMusic: 'Melodi piano hangat dan string emosional',
        musicMood: 'warm-emotional',
        imagePrompt:
          'Close-up 2D cartoon Arka (CHR-01, bold black ink outline, orange scarf) looking determined illuminated by an ancient golden lantern on a 3D mossy stone altar, dramatic bokeh depth of field, vertical 9:16.',
        videoPrompt:
          'Slow close-up push in on Arka face, warm golden light flickering across ink outlines, expressive mouth speaking dialogue, floating dust motes, 30fps.',
        artSpec: {
          skyTopHex: '#111827',
          skyBottomHex: '#92400E',
          groundHex: '#27272A',
          architectureType: 'workshop',
          timeOfDay: 'night-moon',
          lightBeamHex: '#FDE047',
          weatherParticle: 'sparkles',
          depthOfFieldStrength: 0.85,
          characterScale: 1.25,
          characterXOffset: 0,
        },
      },
      {
        id: 'scn-04',
        sceneNumber: 4,
        title: 'Lembah Kembali Bersinar',
        durationSeconds: 7,
        approved: false,
        imageDataUrl: '',
        visualDescription:
          'Kamera Crane shot bergerak naik memperlihatkan Arka dan Nara berdiri berdampingan di puncak bukit saat ribuan kunang-kunang menerangi lembah.',
        characterIds: ['CHR-01', 'CHR-02'],
        characterPosition: 'Arka dan Nara berdiri berdampingan di tengah bukit 3D',
        facialExpression: 'Senang',
        characterAction: 'Melambai',
        cameraMovement: 'Crane shot',
        location: 'Puncak bukit memandang lembah 3D yang bercahaya di bawah langit senja',
        lighting: 'Langit senja ungu keemasan dengan ribuan partikel cahaya hangat',
        dialogue:
          'Cahaya lentera pun menyebar ke seluruh penjuru lembah, membawa harapan baru bagi semua.',
        dialogueLines: [
          {
            characterId: 'NARATOR',
            speakerName: 'Narator (Prabu)',
            voiceId: 'prabu',
            line: 'Cahaya lentera pun menyebar ke seluruh penjuru lembah, membawa harapan baru bagi semua.',
          },
        ],
        audioMode: 'voiceover',
        soundFx: 'Kilau cahaya lembut dan hembusan angin senja yang tenang',
        sfxCategory: 'sparkle-magic',
        backgroundMusic: 'Klimaks orkestra hangat dan megah',
        musicMood: 'warm-emotional',
        imagePrompt:
          'Crane wide shot of 2D cartoon characters Arka (CHR-01) and Nara (CHR-02) with bold black ink outlines standing on a 3D hilltop overlooking a glowing enchanted valley at dusk, golden fireflies, vertical 9:16.',
        videoPrompt:
          'Sweeping crane shot rising smoothly over Arka and Nara waving cheerfully, glowing particles rising into dusk sky, cinematic smooth transition out, 30fps.',
        artSpec: {
          skyTopHex: '#1E1B4B',
          skyBottomHex: '#F97316',
          groundHex: '#14532D',
          architectureType: 'village',
          timeOfDay: 'golden-hour',
          lightBeamHex: '#FDBA74',
          weatherParticle: 'fireflies',
          depthOfFieldStrength: 0.55,
          characterScale: 0.92,
          characterXOffset: 0,
        },
      },
    ],
    audioMix: {
      voiceOverVolume: 100,
      dialogueVolume: 100,
      musicVolume: 50,
      sfxVolume: 50,
      showSubtitles: false,
    },
  };
}
