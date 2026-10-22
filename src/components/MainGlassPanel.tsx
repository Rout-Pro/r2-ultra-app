import React, { useRef, useState } from 'react';
import {
  Disc3,
  Eye,
  Heart,
  Home,
  Library,
  ListMusic,
  Maximize2,
  MoreHorizontal,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Search,
  Settings,
  Shuffle,
  SkipBack,
  SkipForward,
  Sliders,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  Waves,
} from 'lucide-react';
import {
  AppSettings,
  AudioEffectsState,
  ColorPalette,
  EQBand,
  EQPreset,
  Playlist,
  RepeatMode,
  ScreenId,
  TelemetryData,
  Track,
  VisualizerMode,
} from '../types/audio';
import { R2Emblem } from './R2Emblem';
import { VisualizerStudio } from './VisualizerStudio';
import { EqualizerScreen } from './EqualizerScreen';
import { EffectsLabScreen } from './EffectsLabScreen';
import {
  MusicLibraryScreen,
  QueueAndPlaylistScreen,
  SearchScreen,
} from './LibraryAndQueueScreens';

interface MainGlassPanelProps {
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
  currentTrack: Track;
  tracks: Track[];
  queueIds: string[];
  playlists: Playlist[];
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  telemetry: TelemetryData;
  eqBands: EQBand[];
  activePresetId: string;
  customPresets: EQPreset[];
  effects: AudioEffectsState;
  visualizerMode: VisualizerMode;
  settings: AppSettings;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (sec: number) => void;
  onChangeVolume: (vol: number) => void;
  onToggleShuffle: () => void;
  onCycleRepeat: () => void;
  onToggleFavorite: (trackId: string) => void;
  onSelectTrack: (track: Track) => void;
  onImportFiles: (files: FileList) => void;
  onChangeEQBand: (index: number, gain: number) => void;
  onSelectEQPreset: (preset: EQPreset) => void;
  onSaveCustomPreset: (name: string) => void;
  onResetEQ: () => void;
  onUpdateEffects: (partial: Partial<AudioEffectsState>) => void;
  onResetEffects: () => void;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
  onMoveInQueue: (index: number, dir: -1 | 1) => void;
  onRemoveFromQueue: (index: number) => void;
  onCreatePlaylist: (name: string) => void;
  onLoadPlaylist: (pl: Playlist) => void;
  onUpdateSettings: (partial: Partial<AppSettings>) => void;
}

export const MainGlassPanel: React.FC<MainGlassPanelProps> = ({
  activeScreen,
  onSelectScreen,
  currentTrack,
  tracks,
  queueIds,
  playlists,
  isPlaying,
  currentTime,
  duration,
  volume,
  isShuffle,
  repeatMode,
  telemetry,
  eqBands,
  activePresetId,
  customPresets,
  effects,
  visualizerMode,
  settings,
  onPlayPause,
  onPrev,
  onNext,
  onSeek,
  onChangeVolume,
  onToggleShuffle,
  onCycleRepeat,
  onToggleFavorite,
  onSelectTrack,
  onImportFiles,
  onChangeEQBand,
  onSelectEQPreset,
  onSaveCustomPreset,
  onResetEQ,
  onUpdateEffects,
  onResetEffects,
  onChangeVisualizerMode,
  onMoveInQueue,
  onRemoveFromQueue,
  onCreatePlaylist,
  onLoadPlaylist,
  onUpdateSettings,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [artTilt, setArtTilt] = useState({ x: 0, y: 0 });
  const quickUploadRef = useRef<HTMLInputElement | null>(null);

  const palette: ColorPalette = settings.enableColorFlow
    ? currentTrack.palette
    : {
        primary: '#00f0ff',
        secondary: '#8b5cf6',
        accent: '#38bdf8',
        glowRgba: 'rgba(0, 240, 255, 0.45)',
        violetRgba: 'rgba(139, 92, 246, 0.35)',
      };

  const formatTime = (sec: number) => {
    const safe = Math.max(0, Math.floor(sec || 0));
    const m = Math.floor(safe / 60);
    const s = safe % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const remainingTime = Math.max(0, (duration || currentTrack.duration) - currentTime);
  const progressPct =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const activeLyricIndex = currentTrack.lyrics
    ? Math.floor((progressPct / 100) * currentTrack.lyrics.length) %
      currentTrack.lyrics.length
    : 0;

  const navScreens: Array<{ id: ScreenId; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Music Center', icon: <Home className="w-3.5 h-3.5" /> },
    { id: 'player', label: 'Full Poster', icon: <Maximize2 className="w-3.5 h-3.5" /> },
    { id: 'library', label: 'Library', icon: <Library className="w-3.5 h-3.5" /> },
    { id: 'search', label: 'Search', icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'queue', label: 'Queue', icon: <ListMusic className="w-3.5 h-3.5" /> },
    { id: 'equalizer', label: 'Equalizer', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'effects', label: 'FX Lab', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'visualizer', label: 'Visualizer', icon: <Waves className="w-3.5 h-3.5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  const handleArtPointerMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (settings.reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const ny = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setArtTilt({ x: ny, y: nx });
  };

  return (
    <div
      className="relative flex-1 min-w-0 max-w-[360px] sm:max-w-[410px] rounded-[26px] r2-main-glass p-1.5 transition-all duration-300 z-10"
      style={{
        boxShadow: `0 26px 65px -10px rgba(0,0,0,0.9), 0 0 32px -4px ${palette.glowRgba}, 0 0 60px -15px ${palette.violetRgba}, inset 0 1px 2px rgba(255,255,255,0.42)`,
      }}
    >
      {/* Top-Center Floating 3D R2 ULTRA Emblem straddling top border (exact reference match) */}
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-30">
        <R2Emblem
          variant="top-floating"
          palette={palette}
          isPlaying={isPlaying}
          bassEnergy={telemetry.bassEnergy}
          onClick={() => onSelectScreen(activeScreen === 'home' ? 'visualizer' : 'home')}
        />
      </div>

      {/* Corner luminous refraction highlights matching reference bottom-right & top-left glow */}
      <div
        className="absolute -bottom-1.5 -right-1.5 w-24 h-24 rounded-br-[28px] pointer-events-none blur-md opacity-80"
        style={{
          background: `radial-gradient(circle at 100% 100%, #ffffff, ${palette.primary}, transparent 70%)`,
        }}
      />

      {/* Inner double-rimmed glass frame */}
      <div className="relative w-full h-full rounded-[21px] r2-main-glass-inner-rim px-3 sm:px-4 pt-5 pb-3 flex flex-col justify-between gap-2.5 overflow-hidden">
        {/* PANEL HEADER: R2 Orb + R2 ULTRA | Audio Companion + Menu */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-cyan-300/25">
          <div className="flex items-center gap-2.5 min-w-0">
            <R2Emblem
              variant="header-orb"
              palette={palette}
              isPlaying={isPlaying}
              onClick={() => onSelectScreen('home')}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-orbitron font-bold text-sm sm:text-base tracking-wider text-white whitespace-nowrap">
                  R2 ULTRA
                </span>
                <span className="text-cyan-300/60 font-light">|</span>
                <span className="font-display font-medium text-xs sm:text-sm text-cyan-100/90 truncate">
                  {activeScreen === 'home'
                    ? 'Audio Companion'
                    : navScreens.find((s) => s.id === activeScreen)?.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[9.5px] text-cyan-200/75 font-mono-tech">
                <span>{telemetry.engineRunning ? 'ENGINE ACTIVE' : 'STANDBY'}</span>
                <span>·</span>
                <span>{currentTrack.sampleRate}</span>
              </div>
            </div>
          </div>

          {/* Right Compact Options Menu Trigger */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              title="R2 ULTRA Navigation & Options"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-cyan-100 hover:bg-cyan-400/15 transition-colors cursor-pointer"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-9 w-48 rounded-2xl r2-main-glass p-2 z-50 flex flex-col gap-1 border border-cyan-300/60">
                <div className="px-2 py-1 text-[9.5px] font-mono-tech text-cyan-300 uppercase border-b border-cyan-400/20">
                  R2 System Modules
                </div>
                <div className="grid grid-cols-1 gap-0.5 max-h-60 overflow-y-auto">
                  {navScreens.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectScreen(item.id);
                        setMenuOpen(false);
                      }}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        activeScreen === item.id
                          ? 'r2-card-cyan text-white font-semibold'
                          : 'text-cyan-100/85 hover:bg-white/10'
                      }`}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MAIN SCREEN CONTENT BODY */}
        <div className="flex-1 min-h-[305px] sm:min-h-[330px] flex flex-col justify-between gap-2">
          {activeScreen === 'home' && (
            <div className="flex flex-col justify-between h-full gap-2">
              {/* 1. HOLOGRAPHIC ALBUM POSTER & TRACK CARD (Left-aligned style with avatar/orb like reference) */}
              <div className="flex items-start gap-2">
                <div
                  onClick={() => onSelectScreen('player')}
                  className="w-7 h-7 rounded-full r2-card-violet flex items-center justify-center shrink-0 mt-1 cursor-pointer"
                  title="Expand Holographic Poster"
                >
                  <Disc3
                    className={`w-4 h-4 text-cyan-300 ${
                      isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
                    }`}
                  />
                </div>

                <div
                  onMouseMove={handleArtPointerMove}
                  onMouseLeave={() => setArtTilt({ x: 0, y: 0 })}
                  className="flex-1 rounded-2xl r2-card-violet p-2.5 transition-transform duration-200"
                  style={{
                    transform: `perspective(600px) rotateX(${artTilt.x}deg) rotateY(${artTilt.y}deg)`,
                  }}
                >
                  <div className="flex items-center justify-between text-[9px] font-mono-tech text-cyan-200/75 mb-1.5">
                    <span>NOW STREAMING // {currentTrack.bpm} BPM</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(currentTrack.id)}
                        title="Toggle Favorite"
                        className="hover:scale-110 transition-transform cursor-pointer"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${
                            currentTrack.isFavorite
                              ? 'text-pink-400 fill-pink-400'
                              : 'text-cyan-200/70'
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectScreen('player')}
                        title="Full-Screen Holographic Poster"
                        className="hover:text-white cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-cyan-300" />
                      </button>
                    </div>
                  </div>

                  {/* Floating Holographic Artwork Poster + Track Details */}
                  <div className="flex items-center gap-3">
                    <div
                      onClick={() => onSelectScreen('player')}
                      className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-cyan-300/70 cursor-pointer group"
                      style={{
                        boxShadow: `0 0 22px ${palette.glowRgba}`,
                      }}
                    >
                      <img
                        src={currentTrack.coverArt}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-purple-500/25 pointer-events-none" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h2 className="font-display font-bold text-sm sm:text-base text-white leading-tight truncate">
                        {currentTrack.title}
                      </h2>
                      <p className="text-xs text-cyan-200/90 truncate mt-0.5">
                        {currentTrack.artist}
                      </p>
                      <p className="text-[10px] text-purple-200/75 truncate mt-0.5">
                        {currentTrack.album}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectScreen('queue')}
                          className="text-[9.5px] font-mono-tech text-cyan-300 hover:underline cursor-pointer"
                        >
                          Queue ({queueIds.length})
                        </button>
                        <span className="text-cyan-500/50">·</span>
                        <button
                          type="button"
                          onClick={() => onSelectScreen('equalizer')}
                          className="text-[9.5px] font-mono-tech text-purple-300 hover:underline cursor-pointer"
                        >
                          EQ Active
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. GLOWING CYAN ACOUSTIC TELEMETRY CARD (Right-aligned with R2 badge like AETHER response bubble in reference) */}
              <div className="flex items-center justify-end gap-2 pl-3">
                <div
                  onClick={() => onSelectScreen('visualizer')}
                  className="flex-1 rounded-2xl r2-card-cyan p-2.5 cursor-pointer transition-transform hover:scale-[1.01]"
                >
                  <div className="flex items-center justify-between text-[9px] font-mono-tech text-cyan-200/90 mb-1">
                    <span>DSP HARMONIC STREAM</span>
                    <span>R2 ULTRA ({formatTime(currentTime)})</span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-white/95 leading-snug">
                    {currentTrack.lyrics
                      ? currentTrack.lyrics[activeLyricIndex]
                      : 'Optimization is 98% complete. Holographic spatial stage locked.'}
                  </p>
                  {/* Mini Live Spectrum Strip */}
                  <div className="mt-2 h-6 w-full rounded-lg overflow-hidden bg-slate-950/50 border border-cyan-300/25">
                    <VisualizerStudio
                      palette={palette}
                      isPlaying={isPlaying}
                      mode={visualizerMode}
                      onChangeMode={onChangeVisualizerMode}
                      compact={true}
                      reducedMotion={settings.reducedMotion}
                    />
                  </div>
                </div>

                <R2Emblem variant="badge-mini" palette={palette} isPlaying={isPlaying} />
              </div>

              {/* 3. TIMELINE SCRUBBER & TRACK PROGRESS CARD (Left-aligned violet bubble + Right-aligned cyan bubble rhythm) */}
              <div className="flex items-center justify-end gap-2 pl-1">
                <div className="flex-1 rounded-2xl r2-card-cyan px-3 py-2">
                  <div className="flex items-center justify-between text-[9.5px] font-mono-tech text-cyan-100 mb-1">
                    <span>{formatTime(currentTime)}</span>
                    <span className="text-cyan-300 uppercase tracking-wider text-[8.5px]">
                      {isPlaying ? 'LOCKED 48KHZ STREAM' : 'PAUSED'}
                    </span>
                    <span>-{formatTime(remainingTime)}</span>
                  </div>

                  {/* Interactive Range Scrubber */}
                  <input
                    type="range"
                    min="0"
                    max={duration || currentTrack.duration || 48}
                    step="0.1"
                    value={currentTime}
                    onChange={(e) => onSeek(parseFloat(e.target.value))}
                    aria-label="Seek audio position"
                    className="r2-slider w-full"
                  />
                </div>
                <R2Emblem variant="badge-mini" palette={palette} isPlaying={isPlaying} />
              </div>
            </div>
          )}

          {/* B. FULL-SCREEN HOLOGRAPHIC PLAYER VIEW */}
          {activeScreen === 'player' && (
            <div className="flex flex-col items-center justify-between h-full gap-2 py-1">
              <div
                onMouseMove={handleArtPointerMove}
                onMouseLeave={() => setArtTilt({ x: 0, y: 0 })}
                className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-3xl overflow-hidden border-2 border-cyan-300/80 transition-transform duration-200"
                style={{
                  transform: `perspective(700px) rotateX(${artTilt.x}deg) rotateY(${artTilt.y}deg)`,
                  boxShadow: `0 16px 40px rgba(0,0,0,0.85), 0 0 35px ${palette.glowRgba}`,
                }}
              >
                <img
                  src={currentTrack.coverArt}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-cyan-400/15" />
                <div className="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between text-[9.5px] font-mono-tech text-cyan-200">
                  <span>{currentTrack.bitrate}</span>
                  <span>{currentTrack.bpm} BPM</span>
                </div>
              </div>

              <div className="text-center max-w-full px-2">
                <h2 className="font-display font-bold text-base sm:text-lg text-white truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-xs text-cyan-200/90 truncate">
                  {currentTrack.artist} · {currentTrack.album}
                </p>
              </div>

              <div className="w-full rounded-2xl r2-card-cyan px-3 py-2">
                <div className="flex justify-between text-[10px] font-mono-tech text-cyan-100 mb-1">
                  <span>{formatTime(currentTime)}</span>
                  <span>-{formatTime(remainingTime)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={duration || currentTrack.duration || 48}
                  step="0.1"
                  value={currentTime}
                  onChange={(e) => onSeek(parseFloat(e.target.value))}
                  className="r2-slider w-full"
                />
              </div>
            </div>
          )}

          {/* C. MUSIC LIBRARY SCREEN */}
          {activeScreen === 'library' && (
            <MusicLibraryScreen
              tracks={tracks}
              currentTrackId={currentTrack.id}
              isPlaying={isPlaying}
              palette={palette}
              onSelectTrack={onSelectTrack}
              onToggleFavorite={onToggleFavorite}
              onImportFiles={onImportFiles}
            />
          )}

          {/* D. SEARCH SCREEN */}
          {activeScreen === 'search' && (
            <SearchScreen
              tracks={tracks}
              currentTrackId={currentTrack.id}
              onSelectTrack={onSelectTrack}
            />
          )}

          {/* E. QUEUE & PLAYLIST SCREEN */}
          {activeScreen === 'queue' && (
            <QueueAndPlaylistScreen
              queueIds={queueIds}
              tracks={tracks}
              currentTrackId={currentTrack.id}
              playlists={playlists}
              onSelectTrack={onSelectTrack}
              onMoveInQueue={onMoveInQueue}
              onRemoveFromQueue={onRemoveFromQueue}
              onCreatePlaylist={onCreatePlaylist}
              onLoadPlaylist={onLoadPlaylist}
            />
          )}

          {/* F. EQUALIZER SCREEN */}
          {activeScreen === 'equalizer' && (
            <EqualizerScreen
              bands={eqBands}
              activePresetId={activePresetId}
              customPresets={customPresets}
              palette={palette}
              onChangeBand={onChangeEQBand}
              onSelectPreset={onSelectEQPreset}
              onSaveCustomPreset={onSaveCustomPreset}
              onReset={onResetEQ}
            />
          )}

          {/* G. AUDIO EFFECTS LAB SCREEN */}
          {activeScreen === 'effects' && (
            <EffectsLabScreen
              effects={effects}
              palette={palette}
              onUpdateEffects={onUpdateEffects}
              onResetEffects={onResetEffects}
            />
          )}

          {/* H. 3D VISUALIZER STUDIO SCREEN */}
          {activeScreen === 'visualizer' && (
            <VisualizerStudio
              palette={palette}
              isPlaying={isPlaying}
              mode={visualizerMode}
              onChangeMode={onChangeVisualizerMode}
              reducedMotion={settings.reducedMotion}
            />
          )}

          {/* I. SETTINGS SCREEN */}
          {activeScreen === 'settings' && (
            <div className="flex flex-col h-full gap-2.5 overflow-y-auto pr-0.5">
              <div className="rounded-2xl r2-card-cyan p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    3D Holographic Stage Perspective
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.enable3DTilt}
                    onChange={(e) =>
                      onUpdateSettings({ enable3DTilt: e.target.checked })
                    }
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-cyan-200/80">
                  <span>Perspective Tilt Angle</span>
                  <span className="font-mono-tech">{settings.tiltIntensity}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={settings.tiltIntensity}
                  onChange={(e) =>
                    onUpdateSettings({
                      tiltIntensity: parseInt(e.target.value, 10),
                    })
                  }
                  className="r2-slider w-full"
                />
              </div>

              <div className="rounded-2xl r2-card-violet p-3 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Liquid Glass Color-Flow Engine
                    </div>
                    <div className="text-[10px] text-cyan-200/75">
                      Sample dominant artwork colors dynamically
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableColorFlow}
                    onChange={(e) =>
                      onUpdateSettings({ enableColorFlow: e.target.checked })
                    }
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Reduced Motion Mode
                    </div>
                    <div className="text-[10px] text-cyan-200/75">
                      Minimize particle and orbital animations
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.reducedMotion}
                    onChange={(e) =>
                      onUpdateSettings({ reducedMotion: e.target.checked })
                    }
                    className="accent-cyan-400 w-4 h-4 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">
                      Reference Target Inspector
                    </div>
                    <div className="text-[10px] text-cyan-200/75">
                      Compare side-by-side with reference design
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        showReferenceOverlay: !settings.showReferenceOverlay,
                      })
                    }
                    className="px-2.5 py-1 rounded-xl r2-card-cyan text-[10px] font-semibold text-white flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    {settings.showReferenceOverlay ? 'Hide' : 'Compare'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM COMMAND CAPSULE BAR (Matches "Type message..." glowing capsule in reference image) */}
        <div className="relative r2-command-capsule rounded-2xl px-2.5 py-2 flex items-center justify-between gap-1">
          {/* Quick Local Audio Import Hidden Input */}
          <input
            ref={quickUploadRef}
            type="file"
            accept="audio/*"
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onImportFiles(e.target.files);
                e.target.value = '';
              }
            }}
          />

          {/* Left: Shuffle & Previous */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onToggleShuffle}
              title={`Shuffle: ${isShuffle ? 'On' : 'Off'}`}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                isShuffle
                  ? 'text-cyan-300 bg-cyan-400/15'
                  : 'text-cyan-200/60 hover:text-white'
              }`}
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={onPrev}
              title="Previous Track"
              className="p-1.5 rounded-xl text-cyan-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <SkipBack className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Center: Luminous Play/Pause Holographic Core Button */}
          <button
            type="button"
            onClick={onPlayPause}
            title={isPlaying ? 'Pause' : 'Play'}
            style={{
              boxShadow: `0 0 20px ${palette.glowRgba}, inset 0 1px 2px rgba(255,255,255,0.6)`,
              background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
            }}
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-slate-950 font-bold hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 text-white fill-white" />
            ) : (
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            )}
          </button>

          {/* Right: Next, Repeat, Volume, Quick Upload */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onNext}
              title="Next Track"
              className="p-1.5 rounded-xl text-cyan-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <SkipForward className="w-4 h-4 fill-current" />
            </button>

            <button
              type="button"
              onClick={onCycleRepeat}
              title={`Repeat: ${repeatMode.toUpperCase()}`}
              className={`p-1.5 rounded-xl transition-colors cursor-pointer ${
                repeatMode !== 'off'
                  ? 'text-cyan-300 bg-cyan-400/15'
                  : 'text-cyan-200/60 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-3.5 h-3.5" />
              ) : (
                <Repeat className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setVolumeOpen(!volumeOpen)}
              title="Master Volume"
              className="p-1.5 rounded-xl text-cyan-200/80 hover:text-white transition-colors cursor-pointer"
            >
              {volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-pink-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            <button
              type="button"
              onClick={() => quickUploadRef.current?.click()}
              title="Import Local Audio Files"
              className="p-1.5 rounded-xl text-cyan-300 hover:bg-cyan-400/15 transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Floating Volume Bar Popover */}
          {volumeOpen && (
            <div className="absolute -top-11 right-2 w-40 rounded-xl r2-main-glass px-3 py-2 flex items-center gap-2 z-40">
              <Volume2 className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={volume}
                onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
                className="r2-slider w-full"
              />
              <span className="font-mono-tech text-[9.5px] text-cyan-200">
                {Math.round(volume * 100)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
