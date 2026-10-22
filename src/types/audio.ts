export type ScreenId =
  | 'home'
  | 'player'
  | 'library'
  | 'search'
  | 'queue'
  | 'equalizer'
  | 'effects'
  | 'visualizer'
  | 'settings';

export type VisualizerMode =
  | 'orb'
  | 'city_matrix'
  | 'liquid_aurora'
  | 'quantum_bars';

export type RepeatMode = 'off' | 'all' | 'one';

export interface ColorPalette {
  primary: string;      // e.g. '#00f0ff'
  secondary: string;    // e.g. '#8b5cf6'
  accent: string;       // e.g. '#38bdf8'
  glowRgba: string;     // e.g. 'rgba(0, 240, 255, 0.45)'
  violetRgba: string;   // e.g. 'rgba(139, 92, 246, 0.35)'
}

export interface SynthRecipe {
  bpm: number;
  rootNote: number; // MIDI note
  scale: number[];  // semitone offsets
  arpPattern: number[];
  bassPattern: number[];
  padChord: number[];
  style: 'cyber_pulse' | 'liquid_drift' | 'quantum_horizon' | 'midnight_neural' | 'ion_storm' | 'sub_orbital';
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  folder: string;
  duration: number; // in seconds
  bpm: number;
  bitrate?: string;
  sampleRate?: string;
  coverArt: string; // DataURL or SVG/Canvas generated cover
  palette: ColorPalette;
  isFavorite: boolean;
  isLocalFile?: boolean;
  isGeneratedCover?: boolean;
  fileName?: string;
  blob?: Blob;
  fileUrl?: string;
  synthRecipe?: SynthRecipe;
  lyrics?: string[];
  addedAt: number;
  lastPlayedAt?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  trackIds: string[];
  createdAt: number;
}

export interface EQBand {
  frequency: number;
  label: string;
  gain: number; // -12 to +12 dB
}

export interface EQPreset {
  id: string;
  name: string;
  gains: number[]; // 10 bands
}

export interface AudioEffectsState {
  bassBoost: number;      // 0 to 12 dB at 60Hz
  trebleExciter: number;  // 0 to 12 dB at 10kHz
  spatialAmbience: number;// 0 to 100 % wet mix
  stereoPan: number;      // -1 (L) to +1 (R)
  compressorEnabled: boolean;
  playbackSpeed: number;  // 0.5 to 2.0
  sleepTimerMinutes: number | null; // null = off
  sleepTimerRemainingSec: number | null;
}

export interface TelemetryData {
  engineRunning: boolean;
  contextState: 'suspended' | 'running' | 'closed';
  sampleRate: number;
  outputDeviceLabel: string;
  outputChannels: number;
  rmsDb: number;          // Real measured -60 to 0 dB
  peakDb: number;         // Real measured peak -60 to 0 dB
  signalPercent: number;  // Measured 0 to 100% from RMS
  bassEnergy: number;     // Real low FFT bin energy 0 to 100
  midEnergy: number;      // Real mid FFT bin energy 0 to 100
  trebleEnergy: number;   // Real high FFT bin energy 0 to 100
  activeBandsCount: number;// Count of non-zero EQ bands
  frequencyBars: number[]; // 16 measured FFT spectrum bars
}

export interface AppSettings {
  enable3DTilt: boolean;
  tiltIntensity: number; // 0 to 100
  enableColorFlow: boolean;
  reducedMotion: boolean;
  glassOpacity: number; // 50 to 95
  showReferenceOverlay: boolean;
}
