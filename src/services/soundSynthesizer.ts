import { ColorPalette, SynthRecipe, Track } from '../types/audio';

/**
 * Generates high-resolution holographic album cover artwork via HTML5 Canvas
 * so every track has crisp, futuristic artwork with zero external broken links.
 */
export function generateHolographicCover(
  title: string,
  artist: string,
  primaryHex: string,
  secondaryHex: string,
  variant: number
): string {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Deep obsidian-navy base gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 512, 512);
  bgGrad.addColorStop(0, '#020714');
  bgGrad.addColorStop(0.5, '#07142e');
  bgGrad.addColorStop(1, '#04091a');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 512, 512);

  // Ambient glowing nebula aura
  const rad1 = ctx.createRadialGradient(180, 170, 20, 256, 256, 260);
  rad1.addColorStop(0, primaryHex + '88');
  rad1.addColorStop(0.55, secondaryHex + '44');
  rad1.addColorStop(1, 'transparent');
  ctx.fillStyle = rad1;
  ctx.fillRect(0, 0, 512, 512);

  // Perspective grid horizon at bottom
  ctx.strokeStyle = primaryHex + '33';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 12; i++) {
    const y = 320 + Math.pow(i / 12, 1.7) * 192;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }
  for (let i = -8; i <= 8; i++) {
    ctx.beginPath();
    ctx.moveTo(256 + i * 16, 320);
    ctx.lineTo(256 + i * 85, 512);
    ctx.stroke();
  }

  // Central geometric holographic sculpture based on variant
  ctx.save();
  ctx.translate(256, 225);

  // Outer glowing rings
  for (let r = 0; r < 3; r++) {
    ctx.beginPath();
    ctx.arc(0, 0, 95 + r * 24, 0, Math.PI * 2);
    ctx.strokeStyle = r % 2 === 0 ? primaryHex + '66' : secondaryHex + '66';
    ctx.lineWidth = r === 1 ? 2.5 : 1.2;
    ctx.setLineDash(r === 1 ? [18, 10, 6, 10] : []);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Core holographic shape
  const coreGrad = ctx.createLinearGradient(-80, -80, 80, 80);
  coreGrad.addColorStop(0, primaryHex);
  coreGrad.addColorStop(1, secondaryHex);

  ctx.shadowColor = primaryHex;
  ctx.shadowBlur = 28;
  ctx.strokeStyle = coreGrad;
  ctx.lineWidth = 3;

  const sides = 3 + (variant % 5);
  for (let layer = 0; layer < 3; layer++) {
    const radius = 78 - layer * 18;
    const rot = (layer * Math.PI) / (sides * 1.5) + variant * 0.4;
    ctx.beginPath();
    for (let s = 0; s <= sides; s++) {
      const angle = rot + (s * Math.PI * 2) / sides;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      if (s === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Glowing core orb
  const orbGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 38);
  orbGrad.addColorStop(0, '#ffffff');
  orbGrad.addColorStop(0.4, primaryHex);
  orbGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = orbGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Subtle circuit nodes & particles
  for (let p = 0; p < 28; p++) {
    const px = ((p * 97 + variant * 53) % 460) + 26;
    const py = ((p * 67 + variant * 31) % 440) + 26;
    const pr = (p % 3) + 1;
    ctx.fillStyle = p % 2 === 0 ? primaryHex + '99' : secondaryHex + '99';
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top R2 ULTRA hologram micro-stamp
  ctx.fillStyle = 'rgba(226, 241, 255, 0.55)';
  ctx.font = '600 13px Orbitron, sans-serif';
  try {
    if ('letterSpacing' in ctx) {
      (ctx as unknown as { letterSpacing: string }).letterSpacing = '3px';
    }
  } catch {
    // Ignore unsupported canvas property
  }
  ctx.fillText('R2 ULTRA // HOLOGRAPHIC AUDIO', 28, 38);

  // Bottom track title watermark
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px Rajdhani, sans-serif';
  ctx.fillText(title.toUpperCase(), 28, 456);
  ctx.fillStyle = primaryHex;
  ctx.font = '500 16px Plus Jakarta Sans, sans-serif';
  ctx.fillText(artist, 28, 480);

  return canvas.toDataURL('image/png');
}

/**
 * Samples dominant colors from an image URL or DataURL for the Liquid Glass Color-Flow Engine.
 */
export async function extractPaletteFromCover(
  imageUrl: string,
  fallback: ColorPalette
): Promise<ColorPalette> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(fallback);
          return;
        }
        ctx.drawImage(img, 0, 0, 32, 32);
        const data = ctx.getImageData(0, 0, 32, 32).data;
        let rSum = 0,
          gSum = 0,
          bSum = 0,
          count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const brightness = (r + g + b) / 3;
          // Sample vibrant mid-to-bright pixels
          if (brightness > 35 && brightness < 245) {
            rSum += r;
            gSum += g;
            bSum += b;
            count++;
          }
        }

        if (count === 0) {
          resolve(fallback);
          return;
        }

        // Boost cyan/blue/violet futuristic luminance while preserving track character
        const rAvg = Math.min(255, Math.round((rSum / count) * 1.15));
        const gAvg = Math.min(255, Math.round((gSum / count) * 1.25 + 30));
        const bAvg = Math.min(255, Math.round((bSum / count) * 1.35 + 50));

        const primaryHex = `#${rAvg.toString(16).padStart(2, '0')}${gAvg
          .toString(16)
          .padStart(2, '0')}${bAvg.toString(16).padStart(2, '0')}`;

        resolve({
          primary: primaryHex,
          secondary: fallback.secondary,
          accent: fallback.accent,
          glowRgba: `rgba(${rAvg}, ${gAvg}, ${bAvg}, 0.45)`,
          violetRgba: fallback.violetRgba,
        });
      } catch {
        resolve(fallback);
      }
    };
    img.onerror = () => resolve(fallback);
    img.src = imageUrl;
  });
}

/**
 * Synthesizes a rich, full-spectrum stereo AudioBuffer for a given SynthRecipe
 * so every built-in track plays real musical audio through the Web Audio DSP chain.
 */
export function renderSynthTrackBuffer(
  ctx: BaseAudioContext,
  recipe: SynthRecipe,
  durationSeconds = 48
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const beatDur = 60 / recipe.bpm;
  const sixteenthDur = beatDur / 4;

  const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

  // Precompute chord frequencies
  const padFreqs = recipe.padChord.map((semi) => midiToFreq(recipe.rootNote + 12 + semi));

  let kickPhase = 0;
  let bassPhase = 0;
  let arpPhase = 0;
  let subPhase = 0;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const beatIndex = Math.floor(t / beatDur);
    const beatPos = (t % beatDur) / beatDur; // 0..1 within beat
    const stepIndex = Math.floor(t / sixteenthDur);
    const stepPos = (t % sixteenthDur) / sixteenthDur; // 0..1 within 16th note

    // 1. Deep Futuristic Kick on every beat (with 4-bar variation)
    const kickEnv = Math.exp(-beatPos * 9.5);
    const kickFreq = 46 + 130 * Math.exp(-beatPos * 28);
    kickPhase += (2 * Math.PI * kickFreq) / sampleRate;
    const kick = Math.sin(kickPhase) * kickEnv * 0.42;

    // 2. Crisp Hi-Hat & Snare/Clap on offbeats for high-frequency EQ bands (4kHz - 16kHz)
    const isSnareBeat = beatIndex % 2 === 1;
    const snareEnv = isSnareBeat ? Math.exp(-beatPos * 14) : 0;
    const whiteNoise = Math.random() * 2 - 1;
    const snare = whiteNoise * snareEnv * 0.16;

    const hatEnv = Math.exp(-stepPos * (stepIndex % 2 === 1 ? 18 : 34));
    const hat = whiteNoise * hatEnv * (stepIndex % 2 === 1 ? 0.09 : 0.04);

    // 3. Reese / Cyber Bassline (32Hz - 250Hz)
    const bassSemi = recipe.bassPattern[beatIndex % recipe.bassPattern.length];
    const bassFreq = midiToFreq(recipe.rootNote - 12 + bassSemi);
    bassPhase += (2 * Math.PI * bassFreq) / sampleRate;
    subPhase += (2 * Math.PI * (bassFreq * 0.5)) / sampleRate;
    const bassEnv = 0.35 + 0.65 * Math.exp(-beatPos * 3.2);
    const sawBass =
      (2 * ((bassPhase / (2 * Math.PI)) - Math.floor(0.5 + bassPhase / (2 * Math.PI)))) *
      0.18 *
      bassEnv;
    const subBass = Math.sin(subPhase) * 0.24 * bassEnv;

    // 4. Holographic Pluck Arpeggio (500Hz - 4kHz)
    const arpSemi = recipe.arpPattern[stepIndex % recipe.arpPattern.length];
    const arpOctave = ( stepIndex % 8 >= 4 ) ? 12 : 0;
    const arpFreq = midiToFreq(recipe.rootNote + 12 + arpSemi + arpOctave);
    arpPhase += (2 * Math.PI * arpFreq) / sampleRate;
    const arpEnv = Math.exp(-stepPos * 6.5);
    const arpSig =
      (Math.sin(arpPhase) + 0.4 * Math.sin(arpPhase * 2) + 0.15 * Math.cos(arpPhase * 3)) *
      arpEnv *
      0.14;

    // 5. Liquid Lush Stereo Pad (250Hz - 2kHz)
    let padL = 0;
    let padR = 0;
    const slowMod = 0.75 + 0.25 * Math.sin(t * 0.8);
    for (let c = 0; c < padFreqs.length; c++) {
      const f = padFreqs[c];
      const detuneL = f * (1 - 0.003 * (c + 1));
      const detuneR = f * (1 + 0.003 * (c + 1));
      padL += Math.sin(2 * Math.PI * detuneL * t) * 0.045 * slowMod;
      padR += Math.sin(2 * Math.PI * detuneR * t) * 0.045 * slowMod;
    }

    // Stereo panning for arpeggio
    const arpPan = 0.5 + 0.38 * Math.sin(t * 2.2);
    const sampleL = kick + subBass + sawBass + snare + hat * 0.8 + arpSig * arpPan + padL;
    const sampleR = kick + subBass + sawBass + snare + hat * 1.1 + arpSig * (1 - arpPan) + padR;

    // Soft saturation limiter
    left[i] = Math.tanh(sampleL * 1.15);
    right[i] = Math.tanh(sampleR * 1.15);
  }

  return buffer;
}

export function createInitialLibrary(): Track[] {
  const definitions: Array<{
    id: string;
    title: string;
    artist: string;
    album: string;
    folder: string;
    duration: number;
    bpm: number;
    palette: ColorPalette;
    recipe: SynthRecipe;
    lyrics: string[];
  }> = [
    {
      id: 'r2-track-1',
      title: 'Quantum Horizon (R2 Core)',
      artist: 'R2 ULTRA // Neural Synth',
      album: 'Holographic Architecture Vol. I',
      folder: '/R2_ULTRA/Core_Masters',
      duration: 48,
      bpm: 124,
      palette: {
        primary: '#00f0ff',
        secondary: '#8b5cf6',
        accent: '#38bdf8',
        glowRgba: 'rgba(0, 240, 255, 0.48)',
        violetRgba: 'rgba(139, 92, 246, 0.38)',
      },
      recipe: {
        bpm: 124,
        rootNote: 48, // C3
        scale: [0, 2, 3, 7, 8, 10],
        arpPattern: [0, 3, 7, 10, 12, 10, 7, 3],
        bassPattern: [0, 0, -4, -2],
        padChord: [0, 3, 7, 10],
        style: 'quantum_horizon',
      },
      lyrics: [
        'Initializing R2 ULTRA holographic acoustic core...',
        'Optimization at 98.4% — neural harmonic pathways locked.',
        'Sub-bass vectors aligned across liquid glass waveguides.',
        'Drifting through midnight server towers in pure stereo.',
      ],
    },
    {
      id: 'r2-track-2',
      title: 'Liquid Glass Protocol',
      artist: 'KAIROS & R2 DSP',
      album: 'Holographic Architecture Vol. I',
      folder: '/R2_ULTRA/Core_Masters',
      duration: 48,
      bpm: 118,
      palette: {
        primary: '#38bdf8',
        secondary: '#a855f7',
        accent: '#00f0ff',
        glowRgba: 'rgba(56, 189, 248, 0.48)',
        violetRgba: 'rgba(168, 85, 247, 0.42)',
      },
      recipe: {
        bpm: 118,
        rootNote: 50, // D3
        scale: [0, 2, 3, 5, 7, 10],
        arpPattern: [0, 7, 10, 3, 12, 7, 5, 3],
        bassPattern: [0, -2, -5, -4],
        padChord: [0, 3, 7, 14],
        style: 'liquid_drift',
      },
      lyrics: [
        'Refracting cyan photons through smoked sapphire glass.',
        'Every frequency band sculpted in zero-latency space.',
        'From deep 32Hz sub-harmonics to crystalline 16kHz air.',
        'R2 ULTRA telemetry optimal — immersion level maximum.',
      ],
    },
    {
      id: 'r2-track-3',
      title: 'Cybernetic Nocturne 2099',
      artist: 'VEXEL // Tokyo Sector 9',
      album: 'Midnight Server World',
      folder: '/R2_ULTRA/Cyberpunk_Vault',
      duration: 48,
      bpm: 128,
      palette: {
        primary: '#06b6d4',
        secondary: '#d946ef',
        accent: '#22d3ee',
        glowRgba: 'rgba(6, 182, 212, 0.48)',
        violetRgba: 'rgba(217, 70, 239, 0.36)',
      },
      recipe: {
        bpm: 128,
        rootNote: 45, // A2
        scale: [0, 2, 3, 7, 8, 12],
        arpPattern: [0, 3, 8, 7, 12, 8, 7, 3],
        bassPattern: [0, 3, -4, -2],
        padChord: [0, 3, 7, 12],
        style: 'cyber_pulse',
      },
      lyrics: [
        'Neon rain cascades down the obsidian data spire.',
        'Signal-to-noise ratio approaching theoretical perfection.',
        'Pulse-width modulation dancing across the night sky.',
        'Connected to the city matrix at 48,000 samples per second.',
      ],
    },
    {
      id: 'r2-track-4',
      title: 'Ultraviolet Telemetry',
      artist: 'SYNTHIA-9',
      album: 'Deep Space Acoustics',
      folder: '/R2_ULTRA/Ambient_Spatial',
      duration: 48,
      bpm: 110,
      palette: {
        primary: '#60a5fa',
        secondary: '#7c3aed',
        accent: '#38bdf8',
        glowRgba: 'rgba(96, 165, 250, 0.46)',
        violetRgba: 'rgba(124, 58, 237, 0.44)',
      },
      recipe: {
        bpm: 110,
        rootNote: 53, // F3
        scale: [0, 2, 4, 7, 9, 11],
        arpPattern: [0, 4, 7, 11, 14, 11, 7, 4],
        bassPattern: [0, -3, -5, -7],
        padChord: [0, 4, 7, 11],
        style: 'midnight_neural',
      },
      lyrics: [
        'Orbital array receiving deep-field harmonic transmissions.',
        'Spatial convolver expanding the acoustic horizon.',
        'Listen to the violet edge reflections resonate in 3D.',
        'Calm, weightless precision inside the R2 chamber.',
      ],
    },
    {
      id: 'r2-track-5',
      title: 'Ionosphere Overdrive',
      artist: 'R2 ULTRA // HyperCore',
      album: 'Midnight Server World',
      folder: '/R2_ULTRA/Cyberpunk_Vault',
      duration: 48,
      bpm: 134,
      palette: {
        primary: '#00f0ff',
        secondary: '#6366f1',
        accent: '#38bdf8',
        glowRgba: 'rgba(0, 240, 255, 0.52)',
        violetRgba: 'rgba(99, 102, 241, 0.4)',
      },
      recipe: {
        bpm: 134,
        rootNote: 47, // B2
        scale: [0, 2, 3, 5, 7, 10],
        arpPattern: [0, 12, 3, 10, 7, 12, 5, 3],
        bassPattern: [0, 0, 3, 5],
        padChord: [0, 3, 7, 10],
        style: 'ion_storm',
      },
      lyrics: [
        'High-velocity transients locked to the master clock.',
        'Ten-band parametric filters sculpted for maximum punch.',
        'Feel the kinetic pressure wave across the glass plane.',
        'Full output stage active — zero clipping detected.',
      ],
    },
  ];

  return definitions.map((def, idx) => ({
    id: def.id,
    title: def.title,
    artist: def.artist,
    album: def.album,
    folder: def.folder,
    duration: def.duration,
    bpm: def.bpm,
    bitrate: '1411 kbps',
    sampleRate: '48.0 kHz / 24-bit',
    coverArt: generateHolographicCover(
      def.title,
      def.artist,
      def.palette.primary,
      def.palette.secondary,
      idx + 1
    ),
    palette: def.palette,
    isFavorite: idx < 2,
    synthRecipe: def.recipe,
    lyrics: def.lyrics,
    addedAt: Date.now() - idx * 3600_000,
    lastPlayedAt: idx === 0 ? Date.now() : undefined,
  }));
}
