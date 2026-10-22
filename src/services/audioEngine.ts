import {
  AudioEffectsState,
  EQBand,
  EQPreset,
  TelemetryData,
  Track,
} from '../types/audio';
import { renderSynthTrackBuffer } from './soundSynthesizer';

export const EQ_FREQUENCIES: Array<{ freq: number; label: string }> = [
  { freq: 32, label: '32' },
  { freq: 64, label: '64' },
  { freq: 125, label: '125' },
  { freq: 250, label: '250' },
  { freq: 500, label: '500' },
  { freq: 1000, label: '1K' },
  { freq: 2000, label: '2K' },
  { freq: 4000, label: '4K' },
  { freq: 8000, label: '8K' },
  { freq: 16000, label: '16K' },
];

export const DEFAULT_EQ_PRESETS: EQPreset[] = [
  {
    id: 'flat',
    name: 'Flat Reference',
    gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  {
    id: 'r2_holographic',
    name: 'R2 Holographic Core',
    gains: [4.5, 3.8, 1.5, -1.0, -0.5, 1.5, 3.2, 4.5, 5.0, 4.0],
  },
  {
    id: 'cyber_bass',
    name: 'Cyber Sub-Bass',
    gains: [7.5, 6.5, 4.0, 1.0, -1.5, -1.0, 1.5, 2.5, 3.0, 2.0],
  },
  {
    id: 'liquid_vocal',
    name: 'Liquid Vocal Clarity',
    gains: [-1.5, -1.0, 0.5, 2.5, 4.2, 4.8, 3.5, 2.0, 1.5, 1.0],
  },
  {
    id: 'midnight_air',
    name: 'Midnight Crystalline',
    gains: [3.0, 2.5, 0.0, -2.0, -1.5, 1.0, 3.8, 5.5, 6.5, 6.0],
  },
];

class R2AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private bassBoostFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private stereoPanner: StereoPannerNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private delayLeft: DelayNode | null = null;
  private delayRight: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private masterGain: GainNode | null = null;

  // Playback sources
  private bufferSource: AudioBufferSourceNode | null = null;
  private htmlAudio: HTMLAudioElement | null = null;
  private mediaElementSource: MediaElementAudioSourceNode | null = null;
  private synthBufferCache: Map<string, AudioBuffer> = new Map();

  // Playback tracking
  private currentTrack: Track | null = null;
  private isPlaying = false;
  private startTime = 0;
  private pauseOffset = 0;
  private volume = 0.85;
  private playbackSpeed = 1.0;
  private outputDeviceLabel = 'System Stereo Output';

  private fftData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(256));
  private timeData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(256));

  private onTimeUpdateCallback?: (currentTime: number, duration: number) => void;
  private onTrackEndCallback?: () => void;

  public initContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();

      // Create 10-band EQ chain
      this.eqFilters = EQ_FREQUENCIES.map((item, idx) => {
        const filter = this.ctx!.createBiquadFilter();
        if (idx === 0) filter.type = 'lowshelf';
        else if (idx === EQ_FREQUENCIES.length - 1) filter.type = 'highshelf';
        else filter.type = 'peaking';
        filter.frequency.value = item.freq;
        filter.Q.value = 1.4;
        filter.gain.value = 0;
        return filter;
      });

    // Dedicated Bass & Treble DSP filters
    this.bassBoostFilter = this.ctx.createBiquadFilter();
    this.bassBoostFilter.type = 'lowshelf';
    this.bassBoostFilter.frequency.value = 65;
    this.bassBoostFilter.gain.value = 2.5;

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 9500;
    this.trebleFilter.gain.value = 2.0;

    // Spatial 3D Haass/Stereo Ambience network
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 0.85;
    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0.22;

    this.delayLeft = this.ctx.createDelay(1.0);
    this.delayLeft.delayTime.value = 0.024;
    this.delayRight = this.ctx.createDelay(1.0);
    this.delayRight.delayTime.value = 0.037;
    this.feedbackGain = this.ctx.createGain();
    this.feedbackGain.gain.value = 0.28;

    this.stereoPanner = this.ctx.createStereoPanner();
    this.stereoPanner.pan.value = 0;

    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -16;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 3.5;
    this.compressor.attack.value = 0.005;
    this.compressor.release.value = 0.18;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;

    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.analyser.smoothingTimeConstant = 0.8;
    this.fftData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
    this.timeData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));

    // Connect chain: EQ[0..9] -> bassBoost -> treble -> dry/wet spatial -> stereoPanner -> compressor -> masterGain -> analyser -> destination
    for (let i = 0; i < this.eqFilters.length - 1; i++) {
      this.eqFilters[i].connect(this.eqFilters[i + 1]);
    }
    const lastEq = this.eqFilters[this.eqFilters.length - 1];
    lastEq.connect(this.bassBoostFilter);
    this.bassBoostFilter.connect(this.trebleFilter);

    // Dry path
    this.trebleFilter.connect(this.dryGain);
    this.dryGain.connect(this.stereoPanner);

    // Wet Spatial path
    this.trebleFilter.connect(this.delayLeft);
    this.delayLeft.connect(this.delayRight);
    this.delayRight.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayLeft);
    this.delayRight.connect(this.wetGain);
    this.wetGain.connect(this.stereoPanner);

    this.stereoPanner.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);

    // HTML5 Audio element for local files
    this.htmlAudio = new Audio();
    this.htmlAudio.crossOrigin = 'anonymous';
    this.htmlAudio.addEventListener('timeupdate', () => {
      if (this.currentTrack?.isLocalFile && this.htmlAudio && this.onTimeUpdateCallback) {
        this.onTimeUpdateCallback(
          this.htmlAudio.currentTime,
          this.htmlAudio.duration || this.currentTrack.duration
        );
      }
    });
    this.htmlAudio.addEventListener('ended', () => {
      if (this.currentTrack?.isLocalFile && this.onTrackEndCallback) {
        this.isPlaying = false;
        this.onTrackEndCallback();
      }
    });

    this.mediaElementSource = this.ctx.createMediaElementSource(this.htmlAudio);
    this.mediaElementSource.connect(this.eqFilters[0]);

    this.detectOutputDevice();
    return this.ctx;
    } catch (err) {
      console.warn('AudioContext initialization deferred:', err);
      this.ctx = null;
      return null;
    }
  }

  private async detectOutputDevice() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const outputs = devices.filter((d) => d.kind === 'audiooutput');
        if (outputs.length > 0 && outputs[0].label) {
          this.outputDeviceLabel = outputs[0].label;
        } else {
          this.outputDeviceLabel = 'Stereo WebAudio 24-Bit';
        }
      }
    } catch {
      this.outputDeviceLabel = 'Stereo WebAudio 24-Bit';
    }
  }

  public setCallbacks(
    onTimeUpdate: (currentTime: number, duration: number) => void,
    onTrackEnd: () => void
  ) {
    this.onTimeUpdateCallback = onTimeUpdate;
    this.onTrackEndCallback = onTrackEnd;
  }

  public async loadAndPlayTrack(track: Track, autoPlay = true): Promise<void> {
    if (!autoPlay && !this.ctx) {
      this.currentTrack = track;
      this.pauseOffset = 0;
      this.isPlaying = false;
      this.updateMediaSession(track);
      return;
    }

    const ctx = this.initContext();
    if (!ctx) {
      this.currentTrack = track;
      this.isPlaying = false;
      return;
    }

    if (ctx.state === 'suspended' && autoPlay) {
      try {
        await ctx.resume();
      } catch {
        // Autoplay policy prevented resume
      }
    }

    this.stopCurrentSource();
    this.currentTrack = track;
    this.pauseOffset = 0;

    if (track.isLocalFile && track.fileUrl && this.htmlAudio) {
      this.htmlAudio.src = track.fileUrl;
      this.htmlAudio.playbackRate = this.playbackSpeed;
      this.htmlAudio.currentTime = 0;
      if (autoPlay) {
        await this.htmlAudio.play();
        this.isPlaying = true;
      } else {
        this.isPlaying = false;
      }
    } else if (track.synthRecipe) {
      let buffer = this.synthBufferCache.get(track.id);
      if (!buffer) {
        buffer = renderSynthTrackBuffer(ctx, track.synthRecipe, track.duration);
        this.synthBufferCache.set(track.id, buffer);
      }
      if (autoPlay) {
        this.startBufferSource(buffer, 0);
        this.isPlaying = true;
      } else {
        this.isPlaying = false;
      }
    }

    this.updateMediaSession(track);
  }

  private startBufferSource(buffer: AudioBuffer, offsetSeconds: number) {
    if (!this.ctx) return;
    this.stopBufferSourceOnly();

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = this.playbackSpeed;
    source.connect(this.eqFilters[0]);

    const safeOffset = Math.max(0, Math.min(offsetSeconds, buffer.duration - 0.1));
    this.startTime = this.ctx.currentTime - safeOffset / this.playbackSpeed;
    this.pauseOffset = safeOffset;

    source.onended = () => {
      if (this.bufferSource === source && this.isPlaying) {
        const elapsed = this.getCurrentTime();
        if (this.currentTrack && elapsed >= this.currentTrack.duration - 0.4) {
          this.isPlaying = false;
          this.pauseOffset = 0;
          if (this.onTrackEndCallback) {
            this.onTrackEndCallback();
          }
        }
      }
    };

    source.start(0, safeOffset);
    this.bufferSource = source;
  }

  private stopBufferSourceOnly() {
    if (this.bufferSource) {
      try {
        this.bufferSource.onended = null;
        this.bufferSource.stop();
        this.bufferSource.disconnect();
      } catch {
        // Ignore already stopped source
      }
      this.bufferSource = null;
    }
  }

  private stopCurrentSource() {
    this.stopBufferSourceOnly();
    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
    this.isPlaying = false;
  }

  public async togglePlayPause(track: Track): Promise<boolean> {
    const ctx = this.initContext();
    if (!ctx) return false;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Autoplay policy prevented resume
      }
    }

    if (!this.currentTrack || this.currentTrack.id !== track.id) {
      await this.loadAndPlayTrack(track, true);
      return true;
    }

    if (this.isPlaying) {
      // Pause
      if (track.isLocalFile && this.htmlAudio) {
        this.htmlAudio.pause();
      } else {
        this.pauseOffset = this.getCurrentTime();
        this.stopBufferSourceOnly();
      }
      this.isPlaying = false;
      return false;
    } else {
      // Resume
      if (track.isLocalFile && this.htmlAudio) {
        await this.htmlAudio.play();
      } else if (track.synthRecipe) {
        let buffer = this.synthBufferCache.get(track.id);
        if (!buffer) {
          buffer = renderSynthTrackBuffer(ctx, track.synthRecipe, track.duration);
          this.synthBufferCache.set(track.id, buffer);
        }
        this.startBufferSource(buffer, this.pauseOffset);
      }
      this.isPlaying = true;
      return true;
    }
  }

  public seek(seconds: number) {
    if (!this.currentTrack) return;
    const clamped = Math.max(0, Math.min(seconds, this.currentTrack.duration));
    this.pauseOffset = clamped;

    if (this.currentTrack.isLocalFile && this.htmlAudio) {
      this.htmlAudio.currentTime = clamped;
    } else if (this.currentTrack.synthRecipe && this.ctx) {
      if (this.isPlaying) {
        const buffer = this.synthBufferCache.get(this.currentTrack.id);
        if (buffer) {
          this.startBufferSource(buffer, clamped);
        }
      }
    }
  }

  public getCurrentTime(): number {
    if (!this.currentTrack) return 0;
    if (this.currentTrack.isLocalFile && this.htmlAudio) {
      return this.htmlAudio.currentTime;
    }
    if (!this.isPlaying || !this.ctx) {
      return this.pauseOffset;
    }
    const elapsed = (this.ctx.currentTime - this.startTime) * this.playbackSpeed;
    return Math.min(elapsed, this.currentTrack.duration);
  }

  public setVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.02);
    }
  }

  public setEQBandGain(index: number, gainDb: number) {
    if (this.ctx && this.eqFilters[index]) {
      const clamped = Math.max(-12, Math.min(12, gainDb));
      this.eqFilters[index].gain.setTargetAtTime(clamped, this.ctx.currentTime, 0.03);
    }
  }

  public setAllEQGains(gains: number[]) {
    if (!this.ctx) return;
    gains.forEach((g, idx) => this.setEQBandGain(idx, g));
  }

  public applyEffects(fx: AudioEffectsState) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    if (this.bassBoostFilter) {
      this.bassBoostFilter.gain.setTargetAtTime(fx.bassBoost, now, 0.04);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(fx.trebleExciter, now, 0.04);
    }
    if (this.wetGain && this.dryGain) {
      const wet = (fx.spatialAmbience / 100) * 0.65;
      const dry = 1 - wet * 0.35;
      this.wetGain.gain.setTargetAtTime(wet, now, 0.04);
      this.dryGain.gain.setTargetAtTime(dry, now, 0.04);
    }
    if (this.stereoPanner) {
      this.stereoPanner.pan.setTargetAtTime(fx.stereoPan, now, 0.03);
    }
    if (this.compressor) {
      this.compressor.threshold.setTargetAtTime(fx.compressorEnabled ? -18 : 0, now, 0.05);
      this.compressor.ratio.setTargetAtTime(fx.compressorEnabled ? 4 : 1, now, 0.05);
    }

    if (Math.abs(this.playbackSpeed - fx.playbackSpeed) > 0.01) {
      const currentPos = this.getCurrentTime();
      this.playbackSpeed = fx.playbackSpeed;
      if (this.currentTrack?.isLocalFile && this.htmlAudio) {
        this.htmlAudio.playbackRate = this.playbackSpeed;
      } else if (this.bufferSource && this.ctx) {
        this.bufferSource.playbackRate.setValueAtTime(this.playbackSpeed, now);
        this.startTime = this.ctx.currentTime - currentPos / this.playbackSpeed;
      }
    }
  }

  public getAnalyserData(): { fft: Uint8Array; waveform: Uint8Array } {
    if (!this.analyser) {
      return { fft: this.fftData, waveform: this.timeData };
    }
    this.analyser.getByteFrequencyData(this.fftData);
    this.analyser.getByteTimeDomainData(this.timeData);
    return { fft: this.fftData, waveform: this.timeData };
  }

  public getTelemetry(eqBands: EQBand[], fx: AudioEffectsState): TelemetryData {
    const { fft, waveform } = this.getAnalyserData();

    // Compute RMS dB from time-domain waveform
    let sumSquares = 0;
    for (let i = 0; i < waveform.length; i++) {
      const norm = (waveform[i] - 128) / 128;
      sumSquares += norm * norm;
    }
    const rms = Math.sqrt(sumSquares / waveform.length);
    const rmsDb = rms > 0.0001 ? Math.max(-60, Math.min(0, 20 * Math.log10(rms))) : -60;
    const signalPercent = this.isPlaying
      ? Math.min(100, Math.max(8, Math.round(((rmsDb + 52) / 52) * 100)))
      : 0;

    // Compute Bass / Mid / Treble energy rings from real FFT bins
    let bassSum = 0;
    for (let i = 1; i <= 10; i++) bassSum += fft[i] || 0;
    const bassEnergy = Math.min(100, Math.round((bassSum / (10 * 255)) * 115));

    let midSum = 0;
    for (let i = 11; i <= 60; i++) midSum += fft[i] || 0;
    const midEnergy = Math.min(100, Math.round((midSum / (50 * 255)) * 125));

    let trebleSum = 0;
    for (let i = 61; i <= 140; i++) trebleSum += fft[i] || 0;
    const trebleEnergy = Math.min(100, Math.round((trebleSum / (80 * 255)) * 145));

    // 16 compact spectrum bars for widgets & mini-visualizers
    const frequencyBars: number[] = [];
    for (let b = 0; b < 16; b++) {
      const startBin = Math.floor(Math.pow(b / 16, 1.6) * 120) + 1;
      const val = fft[startBin] || 0;
      frequencyBars.push(Math.round((val / 255) * 100));
    }

    // Calculate realistic DSP activity load based on active filters & signal
    const activeEqCount = eqBands.filter((b) => Math.abs(b.gain) > 0.2).length;
    const dspBase = this.isPlaying ? 34 : 12;
    const dspLoadPercent = Math.min(
      98,
      Math.round(
        dspBase +
          activeEqCount * 2.2 +
          (fx.spatialAmbience > 0 ? 11 : 0) +
          (fx.compressorEnabled ? 6 : 0) +
          signalPercent * 0.18
      )
    );

    const headroomPercent = Math.max(12, Math.min(99, 100 - Math.round(signalPercent * 0.72)));

    return {
      engineRunning: this.isPlaying,
      contextState: this.ctx ? (this.ctx.state as 'suspended' | 'running' | 'closed') : 'suspended',
      sampleRate: this.ctx ? this.ctx.sampleRate : 48000,
      outputDeviceLabel: this.outputDeviceLabel,
      outputChannels: this.ctx ? this.ctx.destination.maxChannelCount || 2 : 2,
      rmsDb: Math.round(rmsDb * 10) / 10,
      signalPercent,
      bassEnergy,
      midEnergy,
      trebleEnergy,
      dspLoadPercent,
      bufferHealthPercent: this.isPlaying ? 98 : 89,
      headroomPercent,
      frequencyBars,
    };
  }

  private updateMediaSession(track: Track) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album,
        artwork: track.coverArt
          ? [{ src: track.coverArt, sizes: '512x512', type: 'image/png' }]
          : [],
      });
    }
  }
}

export const audioEngine = new R2AudioEngine();
