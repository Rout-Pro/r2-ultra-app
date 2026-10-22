import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppSettings,
  AudioEffectsState,
  EQBand,
  EQPreset,
  Playlist,
  RepeatMode,
  ScreenId,
  TelemetryData,
  Track,
  VisualizerMode,
} from './types/audio';
import {
  createInitialLibrary,
  extractPaletteFromCover,
  generateHolographicCover,
} from './services/soundSynthesizer';
import {
  audioEngine,
  DEFAULT_EQ_PRESETS,
  EQ_FREQUENCIES,
} from './services/audioEngine';
import {
  deleteImportedAudioTrack,
  getAllImportedAudioTracks,
  getStoredItem,
  saveImportedAudioTrack,
  setStoredItem,
} from './services/storageService';
import { HolographicBackground } from './components/HolographicBackground';
import {
  BottomStatusPanels,
  LeftFloatingWidgets,
  RightFloatingWidgets,
} from './components/FloatingWidgets';
import { MainGlassPanel } from './components/MainGlassPanel';

interface PersistedAppState {
  volume?: number;
  isShuffle?: boolean;
  repeatMode?: RepeatMode;
  eqBands?: EQBand[];
  activePresetId?: string;
  customPresets?: EQPreset[];
  effects?: AudioEffectsState;
  playlists?: Playlist[];
  settings?: Partial<AppSettings>;
  currentTrackId?: string;
  savedPosition?: number;
  queueIds?: string[];
  favoriteIds?: string[];
  lastPlayedMap?: Record<string, number>;
}

export default function App() {
  const [tracks, setTracks] = useState<Track[]>(() => createInitialLibrary());
  const [queueIds, setQueueIds] = useState<string[]>(() =>
    createInitialLibrary().map((t) => t.id)
  );
  const [currentTrackId, setCurrentTrackId] = useState<string>('r2-track-1');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(48);
  const [volume, setVolume] = useState<number>(0.85);
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const [activeScreen, setActiveScreen] = useState<ScreenId>('home');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('orb');
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [storageError, setStorageError] = useState<string | null>(null);

  const [eqBands, setEqBands] = useState<EQBand[]>(() =>
    EQ_FREQUENCIES.map((item, i) => ({
      frequency: item.freq,
      label: item.label,
      gain: DEFAULT_EQ_PRESETS[1].gains[i], // R2 Holographic Core preset default
    }))
  );
  const [activePresetId, setActivePresetId] = useState<string>('r2_holographic');
  const [customPresets, setCustomPresets] = useState<EQPreset[]>([]);

  const [effects, setEffects] = useState<AudioEffectsState>({
    bassBoost: 3.0,
    trebleExciter: 2.5,
    spatialAmbience: 25,
    stereoPan: 0,
    compressorEnabled: true,
    playbackSpeed: 1.0,
    sleepTimerMinutes: null,
    sleepTimerRemainingSec: null,
  });

  const [playlists, setPlaylists] = useState<Playlist[]>([
    {
      id: 'pl-core',
      name: 'R2 Holographic Masters',
      description: 'Core 48kHz spatial electronic suite',
      trackIds: ['r2-track-1', 'r2-track-2', 'r2-track-3', 'r2-track-4', 'r2-track-5'],
      createdAt: Date.now(),
    },
    {
      id: 'pl-night',
      name: 'Midnight Server Drift',
      description: 'Deep sub-bass & ultraviolet ambience',
      trackIds: ['r2-track-2', 'r2-track-4'],
      createdAt: Date.now() - 7200_000,
    },
  ]);

  const [settings, setSettings] = useState<AppSettings>({
    enable3DTilt: true,
    tiltIntensity: 55,
    enableColorFlow: true,
    reducedMotion: false,
    glassOpacity: 80,
    showReferenceOverlay: false,
  });

  const [telemetry, setTelemetry] = useState<TelemetryData>(() =>
    audioEngine.getTelemetry([])
  );

  // Subtle pointer parallax for the 3D stage
  const [stageParallax, setStageParallax] = useState({ x: 0, y: 0 });

  // 1. Hydration gate: Load IndexedDB imported Blobs and state on mount
  useEffect(() => {
    let isCancelled = false;

    async function hydrate() {
      const baseLibrary = createInitialLibrary();
      let restoredTracks: Track[] = [];

      try {
        const stored = await getAllImportedAudioTracks();
        restoredTracks = stored.map((item) => {
          const freshUrl = URL.createObjectURL(item.blob);
          return {
            id: item.id,
            title: item.title,
            artist: item.artist || 'Unknown Artist (Local)',
            album: item.album || 'Imported Audio',
            folder: item.folder || '/Local_Storage/Imports',
            duration: item.duration || 180,
            bpm: item.bpm || 120,
            bitrate: item.bitrate || 'Original Audio File',
            sampleRate: item.sampleRate || 'WebAudio / Local File',
            coverArt:
              item.coverArt ||
              generateHolographicCover(
                item.title,
                'Local Audio Import',
                item.palette?.primary || '#00f0ff',
                item.palette?.secondary || '#a855f7',
                3
              ),
            palette: item.palette || {
              primary: '#00f0ff',
              secondary: '#a855f7',
              accent: '#38bdf8',
              glowRgba: 'rgba(0, 240, 255, 0.48)',
              violetRgba: 'rgba(168, 85, 247, 0.38)',
            },
            isFavorite: item.isFavorite || false,
            isLocalFile: true,
            isGeneratedCover: true,
            fileName: item.fileName,
            fileUrl: freshUrl,
            blob: item.blob,
            lyrics: [
              `Streaming local audio file: ${item.fileName}`,
              'Routed through R2 ULTRA 10-band Biquad EQ & Dynamic Limiter.',
              'Real-time FFT audio spectrum analysis active.',
            ],
            addedAt: item.addedAt,
            lastPlayedAt: item.lastPlayedAt,
          };
        });
      } catch (err: any) {
        console.warn('IndexedDB track hydration notice:', err);
        if (!isCancelled) {
          setStorageError('Local database notice: Could not load stored audio tracks.');
        }
      }

      if (isCancelled) return;

      const combinedTracks = [...restoredTracks, ...baseLibrary];

      try {
        const savedState = await getStoredItem<PersistedAppState>('app_state');
        if (savedState && !isCancelled) {
          if (typeof savedState.volume === 'number') {
            setVolume(savedState.volume);
            audioEngine.setVolume(savedState.volume);
          }
          if (typeof savedState.isShuffle === 'boolean') {
            setIsShuffle(savedState.isShuffle);
          }
          if (savedState.repeatMode) {
            setRepeatMode(savedState.repeatMode);
          }
          if (savedState.eqBands && Array.isArray(savedState.eqBands)) {
            setEqBands(savedState.eqBands);
            audioEngine.setAllEQGains(savedState.eqBands.map((b) => b.gain));
          }
          if (savedState.activePresetId) {
            setActivePresetId(savedState.activePresetId);
          }
          if (savedState.customPresets) {
            setCustomPresets(savedState.customPresets);
          }
          if (savedState.effects) {
            setEffects(savedState.effects);
            audioEngine.applyEffects(savedState.effects);
          }
          if (savedState.playlists && Array.isArray(savedState.playlists)) {
            setPlaylists(savedState.playlists);
          }
          if (savedState.settings) {
            setSettings((prev) => ({ ...prev, ...savedState.settings }));
          }

          // Restore favorites (set true for included, false for unfavorited demo tracks)
          if (Array.isArray(savedState.favoriteIds)) {
            const favSet = new Set(savedState.favoriteIds);
            combinedTracks.forEach((t) => {
              t.isFavorite = favSet.has(t.id);
            });
          }

          // Restore recent lastPlayedAt timestamps for all tracks
          if (savedState.lastPlayedMap && typeof savedState.lastPlayedMap === 'object') {
            combinedTracks.forEach((t) => {
              if (savedState.lastPlayedMap && savedState.lastPlayedMap[t.id]) {
                t.lastPlayedAt = savedState.lastPlayedMap[t.id];
              }
            });
          }

          // Restore queue (preserves an intentionally empty queue)
          if (Array.isArray(savedState.queueIds)) {
            const valid = savedState.queueIds.filter((id) =>
              combinedTracks.some((t) => t.id === id)
            );
            setQueueIds(valid);
          }

          // Restore current track and position (RESUME PAUSED, NEVER AUTOPLAY)
          if (savedState.currentTrackId) {
            const track = combinedTracks.find((t) => t.id === savedState.currentTrackId);
            if (track) {
              setCurrentTrackId(track.id);
              setDuration(track.duration);
              const pos = savedState.savedPosition || 0;
              setCurrentTime(pos);
              // Pre-load track metadata without starting playback
              audioEngine.loadAndPlayTrack(track, false).then(() => {
                if (pos > 0) {
                  audioEngine.seek(pos);
                }
              });
            }
          }
        }
      } catch (err: any) {
        console.warn('IndexedDB app_state hydration notice:', err);
      }

      if (!isCancelled) {
        setTracks(combinedTracks);
        setIsHydrated(true);
      }
    }

    hydrate();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 2. Hydration gate: Save persistent state to IndexedDB only after hydration completes
  useEffect(() => {
    if (!isHydrated) return;

    const favoriteIds = tracks.filter((t) => t.isFavorite).map((t) => t.id);
    const lastPlayedMap: Record<string, number> = {};
    tracks.forEach((t) => {
      if (t.lastPlayedAt) {
        lastPlayedMap[t.id] = t.lastPlayedAt;
      }
    });

    const stateToSave: PersistedAppState = {
      volume,
      isShuffle,
      repeatMode,
      eqBands,
      activePresetId,
      customPresets,
      effects,
      playlists,
      settings,
      currentTrackId,
      savedPosition: currentTime,
      queueIds,
      favoriteIds,
      lastPlayedMap,
    };

    setStoredItem('app_state', stateToSave).catch((err: any) => {
      console.warn('Failed to save state to IndexedDB:', err);
      setStorageError(`Database save error: ${err?.message || 'Failed to write app state'}`);
    });
  }, [
    isHydrated,
    volume,
    isShuffle,
    repeatMode,
    eqBands,
    activePresetId,
    customPresets,
    effects,
    playlists,
    settings,
    currentTrackId,
    currentTime,
    queueIds,
    tracks,
  ]);

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrackId) || tracks[0],
    [tracks, currentTrackId]
  );

  // Ref for callbacks so audioEngine always sees fresh state
  const stateRef = useRef({
    tracks,
    queueIds,
    currentTrack,
    isShuffle,
    repeatMode,
    eqBands,
    effects,
  });
  useEffect(() => {
    stateRef.current = {
      tracks,
      queueIds,
      currentTrack,
      isShuffle,
      repeatMode,
      eqBands,
      effects,
    };
  }, [tracks, queueIds, currentTrack, isShuffle, repeatMode, eqBands, effects]);

  const handleSelectTrack = useCallback(async (track: Track, autoPlay = true) => {
    setCurrentTrackId(track.id);
    setDuration(track.duration);
    setCurrentTime(0);

    // Sample dominant cover colors for the Liquid Glass Color-Flow Engine
    const sampledPalette = await extractPaletteFromCover(
      track.coverArt,
      track.palette
    );

    setTracks((prev) =>
      prev.map((t) =>
        t.id === track.id
          ? { ...t, lastPlayedAt: Date.now(), palette: sampledPalette }
          : t
      )
    );

    await audioEngine.loadAndPlayTrack(track, autoPlay);
    audioEngine.setAllEQGains(stateRef.current.eqBands.map((b) => b.gain));
    audioEngine.applyEffects(stateRef.current.effects);
    setIsPlaying(autoPlay);
  }, []);

  const handleNext = useCallback(() => {
    const {
      queueIds: qIds,
      tracks: allTracks,
      currentTrack: curr,
      isShuffle: shuf,
      repeatMode: rep,
    } = stateRef.current;

    if (rep === 'one') {
      handleSelectTrack(curr, true);
      return;
    }

    const activeQueue = qIds.length > 0 ? qIds : allTracks.map((t) => t.id);
    const currentIndex = activeQueue.indexOf(curr.id);

    let nextIndex = 0;
    if (shuf && activeQueue.length > 1) {
      do {
        nextIndex = Math.floor(Math.random() * activeQueue.length);
      } while (nextIndex === currentIndex);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= activeQueue.length) {
        if (rep === 'off') {
          setIsPlaying(false);
          return;
        }
        nextIndex = 0;
      }
    }

    const nextId = activeQueue[nextIndex];
    const nextTrack = allTracks.find((t) => t.id === nextId) || allTracks[0];
    handleSelectTrack(nextTrack, true);
  }, [handleSelectTrack]);

  const handlePrev = useCallback(() => {
    if (audioEngine.getCurrentTime() > 3.5) {
      audioEngine.seek(0);
      setCurrentTime(0);
      return;
    }
    const { queueIds: qIds, tracks: allTracks, currentTrack: curr } = stateRef.current;
    const activeQueue = qIds.length > 0 ? qIds : allTracks.map((t) => t.id);
    const currentIndex = activeQueue.indexOf(curr.id);
    const prevIndex =
      currentIndex <= 0 ? activeQueue.length - 1 : currentIndex - 1;
    const prevTrack =
      allTracks.find((t) => t.id === activeQueue[prevIndex]) || allTracks[0];
    handleSelectTrack(prevTrack, true);
  }, [handleSelectTrack]);

  const handlePlayPause = useCallback(async () => {
    const playing = await audioEngine.togglePlayPause(stateRef.current.currentTrack);
    audioEngine.setAllEQGains(stateRef.current.eqBands.map((b) => b.gain));
    audioEngine.applyEffects(stateRef.current.effects);
    setIsPlaying(playing);
  }, []);

  // Separate play and pause handler for MediaSession to prevent auto-toggle desync
  const handleMediaPlay = useCallback(async () => {
    await audioEngine.play();
    audioEngine.setAllEQGains(stateRef.current.eqBands.map((b) => b.gain));
    audioEngine.applyEffects(stateRef.current.effects);
    setIsPlaying(true);
  }, []);

  const handleMediaPause = useCallback(() => {
    audioEngine.pause();
    setIsPlaying(false);
  }, []);

  // Wire audio engine callbacks & MediaSession controls
  useEffect(() => {
    audioEngine.setCallbacks(
      (time, dur) => {
        setCurrentTime(time);
        if (dur && dur > 0) setDuration(dur);
      },
      () => {
        handleNext();
      }
    );

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => handleMediaPlay());
      navigator.mediaSession.setActionHandler('pause', () => handleMediaPause());
      navigator.mediaSession.setActionHandler('previoustrack', () => handlePrev());
      navigator.mediaSession.setActionHandler('nexttrack', () => handleNext());
    }
  }, [handleNext, handlePrev, handleMediaPlay, handleMediaPause]);

  // Real-time telemetry & playback progress ticker
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        const t = audioEngine.getCurrentTime();
        setCurrentTime(t);
      }
      setTelemetry(
        audioEngine.getTelemetry(stateRef.current.eqBands)
      );
    }, 90);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Autonomous Sleep Timer countdown
  useEffect(() => {
    if (effects.sleepTimerRemainingSec === null) return;
    if (effects.sleepTimerRemainingSec <= 0) {
      if (isPlaying) {
        handleMediaPause();
      }
      setEffects((prev) => ({
        ...prev,
        sleepTimerMinutes: null,
        sleepTimerRemainingSec: null,
      }));
      return;
    }
    const timer = setTimeout(() => {
      setEffects((prev) => ({
        ...prev,
        sleepTimerRemainingSec:
          prev.sleepTimerRemainingSec !== null
            ? prev.sleepTimerRemainingSec - 1
            : null,
      }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [effects.sleepTimerRemainingSec, isPlaying, handleMediaPause]);

  // Local Audio File Import Handler with IndexedDB Blob persistence
  const handleImportFiles = useCallback(
    async (files: FileList) => {
      const imported: Track[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const objectUrl = URL.createObjectURL(file);
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

        // Probe duration using temporary Audio element
        const fileDuration = await new Promise<number>((resolve) => {
          const tempAudio = new Audio(objectUrl);
          tempAudio.addEventListener('loadedmetadata', () => {
            resolve(
              tempAudio.duration && isFinite(tempAudio.duration)
                ? tempAudio.duration
                : 180
            );
          });
          tempAudio.addEventListener('error', () => resolve(180));
        });

        const palette = {
          primary: i % 2 === 0 ? '#00f0ff' : '#38bdf8',
          secondary: i % 2 === 0 ? '#a855f7' : '#d946ef',
          accent: '#38bdf8',
          glowRgba: 'rgba(0, 240, 255, 0.48)',
          violetRgba: 'rgba(168, 85, 247, 0.38)',
        };

        const trackId = `local-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
        const coverArt = generateHolographicCover(
          cleanTitle,
          'Local Audio Import',
          palette.primary,
          palette.secondary,
          i + 3
        );

        const newTrack: Track = {
          id: trackId,
          title: cleanTitle,
          artist: 'Unknown Artist (Local)',
          album: 'Imported Audio',
          folder: '/Local_Storage/Imports',
          duration: fileDuration,
          bpm: 120,
          bitrate: 'Original Audio File',
          sampleRate: 'WebAudio / Local File',
          coverArt,
          palette,
          isFavorite: false,
          isLocalFile: true,
          isGeneratedCover: true,
          fileName: file.name,
          fileUrl: objectUrl,
          blob: file,
          lyrics: [
            `Streaming local audio file: ${file.name}`,
            'Routed through R2 ULTRA 10-band Biquad EQ & Dynamic Limiter.',
            'Real-time FFT audio spectrum analysis active.',
          ],
          addedAt: Date.now(),
        };

        // Persist blob to IndexedDB
        try {
          await saveImportedAudioTrack({
            id: trackId,
            title: cleanTitle,
            artist: 'Unknown Artist (Local)',
            album: 'Imported Audio',
            folder: '/Local_Storage/Imports',
            duration: fileDuration,
            bpm: 120,
            bitrate: 'Original Audio File',
            sampleRate: 'WebAudio / Local File',
            coverArt,
            palette,
            isFavorite: false,
            addedAt: Date.now(),
            blob: file,
            mimeType: file.type || 'audio/mpeg',
            fileName: file.name,
          });
        } catch (err: any) {
          console.error('Failed to store audio file in IndexedDB:', err);
          setStorageError(
            `Storage limit reached or IndexedDB unavailable. "${file.name}" is playable now, but will not persist across app reloads.`
          );
        }

        imported.push(newTrack);
      }

      if (imported.length > 0) {
        setTracks((prev) => [...imported, ...prev]);
        setQueueIds((prev) => [...imported.map((t) => t.id), ...prev]);
        handleSelectTrack(imported[0], true);
      }
    },
    [handleSelectTrack]
  );

  // Delete Track Handler (clean up IndexedDB and revoke Object URL)
  const handleDeleteTrack = useCallback(
    async (trackId: string) => {
      const trackToDelete = tracks.find((t) => t.id === trackId);
      if (trackToDelete?.fileUrl && trackToDelete.isLocalFile) {
        URL.revokeObjectURL(trackToDelete.fileUrl);
      }

      try {
        await deleteImportedAudioTrack(trackId);
      } catch (err: any) {
        console.warn('Failed to delete track from IndexedDB:', err);
        setStorageError(`Database notice: Could not remove track from storage (${err?.message || 'Transaction error'})`);
      }

      setTracks((prev) => prev.filter((t) => t.id !== trackId));
      setQueueIds((prev) => prev.filter((id) => id !== trackId));

      if (currentTrackId === trackId) {
        const remaining = tracks.filter((t) => t.id !== trackId);
        if (remaining.length > 0) {
          handleSelectTrack(remaining[0], false);
        }
      }
    },
    [tracks, currentTrackId, handleSelectTrack]
  );

  // EQ & Effects handlers
  const handleChangeEQBand = (index: number, gain: number) => {
    setEqBands((prev) => {
      const next = prev.map((b, i) => (i === index ? { ...b, gain } : b));
      audioEngine.setEQBandGain(index, gain);
      return next;
    });
    setActivePresetId('custom');
  };

  const handleSelectEQPreset = (preset: EQPreset) => {
    setActivePresetId(preset.id);
    setEqBands((prev) =>
      prev.map((b, i) => ({ ...b, gain: preset.gains[i] ?? 0 }))
    );
    audioEngine.setAllEQGains(preset.gains);
  };

  const handleSaveCustomPreset = (name: string) => {
    const newPreset: EQPreset = {
      id: `custom-${Date.now()}`,
      name,
      gains: eqBands.map((b) => b.gain),
    };
    setCustomPresets((prev) => [...prev, newPreset]);
    setActivePresetId(newPreset.id);
  };

  const handleResetEQ = () => {
    handleSelectEQPreset(DEFAULT_EQ_PRESETS[0]);
  };

  const handleUpdateEffects = (partial: Partial<AudioEffectsState>) => {
    setEffects((prev) => {
      const next = { ...prev, ...partial };
      audioEngine.applyEffects(next);
      return next;
    });
  };

  const handleResetEffects = () => {
    const reset: AudioEffectsState = {
      bassBoost: 0,
      trebleExciter: 0,
      spatialAmbience: 0,
      stereoPan: 0,
      compressorEnabled: true,
      playbackSpeed: 1.0,
      sleepTimerMinutes: null,
      sleepTimerRemainingSec: null,
    };
    setEffects(reset);
    audioEngine.applyEffects(reset);
  };

  // Compute 3D perspective stage transform matching reference image's angled holographic rig
  const tiltFactor = settings.enable3DTilt ? settings.tiltIntensity / 100 : 0;
  const rotX = 4.5 * tiltFactor + stageParallax.y;
  const rotY = -7.5 * tiltFactor + stageParallax.x;
  const rotZ = -0.8 * tiltFactor;

  return (
    <div
      onMouseMove={(e) => {
        if (!settings.enable3DTilt || settings.reducedMotion) return;
        const nx = (e.clientX / window.innerWidth - 0.5) * 3.5;
        const ny = (e.clientY / window.innerHeight - 0.5) * -3.5;
        setStageParallax({ x: nx, y: ny });
      }}
      className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden px-1 sm:px-3 py-2 sm:py-4 select-none"
    >
      {/* 1. Futuristic Ambient Digital City & Liquid Color-Flow Background */}
      <HolographicBackground
        palette={currentTrack.palette}
        isPlaying={isPlaying}
        bassEnergy={telemetry.bassEnergy}
        reducedMotion={settings.reducedMotion}
        enableColorFlow={settings.enableColorFlow}
      />

      {/* 2. Holographic Floating Stage (Main Panel + Floating Widgets + Bottom Status Panels) */}
      <main
        className="relative z-10 w-full max-w-[560px] flex flex-col items-center justify-center r2-stage-perspective my-auto pt-1 sm:pt-4"
        style={{
          transform:
            settings.enable3DTilt && typeof window !== 'undefined' && window.innerWidth >= 768
              ? `perspective(1350px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(
                  2
                )}deg) rotateZ(${rotZ.toFixed(2)}deg)`
              : 'none',
          transition: 'transform 0.25s ease-out',
        }}
      >
        {/* Mobile Top Row Widgets (screens < md) */}
        <div className="w-full block md:hidden mb-1.5 px-0.5">
          <LeftFloatingWidgets
            telemetry={telemetry}
            palette={currentTrack.palette}
            onToggleEngine={handlePlayPause}
            onSelectScreen={setActiveScreen}
            layout="mobile-row"
          />
        </div>

        {/* Center Container: Desktop Floating Sides + Responsive Main Glass Panel */}
        <div className="w-full flex items-center justify-center gap-1.5 sm:gap-2.5">
          {/* Left Floating Widgets (Desktop and Tablet md+) */}
          <div className="hidden md:block shrink-0">
            <LeftFloatingWidgets
              telemetry={telemetry}
              palette={currentTrack.palette}
              onToggleEngine={handlePlayPause}
              onSelectScreen={setActiveScreen}
              layout="desktop"
            />
          </div>

          {/* Full-width central holographic panel (360px-440px on mobile without horizontal clipping) */}
          <div className="w-full max-w-[430px] flex-1">
            <MainGlassPanel
              activeScreen={activeScreen}
              onSelectScreen={setActiveScreen}
              currentTrack={currentTrack}
              tracks={tracks}
              queueIds={queueIds}
              playlists={playlists}
              isPlaying={isPlaying}
              currentTime={currentTime}
              duration={duration}
              volume={volume}
              isShuffle={isShuffle}
              repeatMode={repeatMode}
              telemetry={telemetry}
              eqBands={eqBands}
              activePresetId={activePresetId}
              customPresets={customPresets}
              effects={effects}
              visualizerMode={visualizerMode}
              settings={settings}
              storageError={storageError}
              onDismissError={() => setStorageError(null)}
              onPlayPause={handlePlayPause}
              onPrev={handlePrev}
              onNext={handleNext}
              onSeek={(sec) => {
                audioEngine.seek(sec);
                setCurrentTime(sec);
              }}
              onChangeVolume={(val) => {
                setVolume(val);
                audioEngine.setVolume(val);
              }}
              onToggleShuffle={() => setIsShuffle((s) => !s)}
              onCycleRepeat={() =>
                setRepeatMode((r) =>
                  r === 'off' ? 'all' : r === 'all' ? 'one' : 'off'
                )
              }
              onToggleFavorite={(id) =>
                setTracks((prev) =>
                  prev.map((t) =>
                    t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
                  )
                )
              }
              onSelectTrack={(t) => handleSelectTrack(t, true)}
              onImportFiles={handleImportFiles}
              onDeleteTrack={handleDeleteTrack}
              onChangeEQBand={handleChangeEQBand}
              onSelectEQPreset={handleSelectEQPreset}
              onSaveCustomPreset={handleSaveCustomPreset}
              onResetEQ={handleResetEQ}
              onUpdateEffects={handleUpdateEffects}
              onResetEffects={handleResetEffects}
              onChangeVisualizerMode={setVisualizerMode}
              onMoveInQueue={(idx, dir) => {
                setQueueIds((prev) => {
                  const copy = [...prev];
                  const target = idx + dir;
                  if (target < 0 || target >= copy.length) return prev;
                  const temp = copy[idx];
                  copy[idx] = copy[target];
                  copy[target] = temp;
                  return copy;
                });
              }}
              onRemoveFromQueue={(idx) =>
                setQueueIds((prev) => prev.filter((_, i) => i !== idx))
              }
              onCreatePlaylist={(name) => {
                const newPl: Playlist = {
                  id: `pl-${Date.now()}`,
                  name,
                  description: 'Custom R2 ULTRA Queue Snapshot',
                  trackIds: [...queueIds],
                  createdAt: Date.now(),
                };
                setPlaylists((prev) => [newPl, ...prev]);
              }}
              onLoadPlaylist={(pl) => {
                setQueueIds(pl.trackIds);
                const first = tracks.find((t) => t.id === pl.trackIds[0]);
                if (first) handleSelectTrack(first, true);
              }}
              onUpdateSettings={(partial) =>
                setSettings((prev) => ({ ...prev, ...partial }))
              }
            />
          </div>

          {/* Right Floating Widgets (Desktop and Tablet md+) */}
          <div className="hidden md:block shrink-0">
            <RightFloatingWidgets
              activeScreen={activeScreen}
              palette={currentTrack.palette}
              onSelectScreen={setActiveScreen}
              layout="desktop"
            />
          </div>
        </div>

        {/* Mobile Bottom Row Widgets (screens < md) */}
        <div className="w-full block md:hidden mt-1.5 px-0.5">
          <RightFloatingWidgets
            activeScreen={activeScreen}
            palette={currentTrack.palette}
            onSelectScreen={setActiveScreen}
            layout="mobile-row"
          />
        </div>

        {/* Bottom Floating Status Panels (R2 ULTRA STATUS + ACOUSTIC RINGS) */}
        <BottomStatusPanels
          telemetry={telemetry}
          palette={currentTrack.palette}
          activeScreen={activeScreen}
          onSelectScreen={setActiveScreen}
        />
      </main>

      {/* Optional Reference Image Comparison Modal (Toggled in Settings) */}
      {settings.showReferenceOverlay && (
        <div className="fixed bottom-3 right-3 z-50 w-56 sm:w-64 rounded-2xl r2-main-glass p-2 border border-cyan-300/70">
          <div className="flex items-center justify-between text-[10px] font-mono-tech text-cyan-200 mb-1 px-1">
            <span>VISUAL TARGET REFERENCE</span>
            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, showReferenceOverlay: false }))
              }
              className="text-pink-300 hover:underline cursor-pointer"
            >
              CLOSE
            </button>
          </div>
          <img
            src="/assets/aistudio/1-image-304459be_ec3fe212.jpg"
            alt="Reference Design Target"
            className="w-full h-36 object-cover object-center rounded-xl border border-cyan-400/40"
          />
        </div>
      )}
    </div>
  );
}
