import React, { useEffect, useRef, useState } from 'react';
import { Eye, Sparkles, Sliders, Maximize2 } from 'lucide-react';
import { ColorPalette, VisualizerMode } from '../types/audio';
import { audioEngine } from '../services/audioEngine';

interface VisualizerStudioProps {
  palette: ColorPalette;
  isPlaying: boolean;
  mode: VisualizerMode;
  onChangeMode: (mode: VisualizerMode) => void;
  compact?: boolean;
  reducedMotion?: boolean;
}

export const VisualizerStudio: React.FC<VisualizerStudioProps> = ({
  palette,
  isPlaying,
  mode,
  onChangeMode,
  compact = false,
  reducedMotion = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [sensitivity, setSensitivity] = useState<number>(1.25);
  const [cameraTilt, setCameraTilt] = useState<number>(35);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let rotation = 0;

    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const targetW = Math.max(compact ? 60 : 200, Math.floor(rect.width || (compact ? 240 : 320)));
      const targetH = Math.max(compact ? 20 : 100, Math.floor(rect.height || (compact ? 24 : 180)));
      if (canvas.width !== targetW || canvas.height !== targetH) {
        canvas.width = targetW;
        canvas.height = targetH;
      }

      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;

      const { fft, waveform } = audioEngine.getAnalyserData();

      // Translucent motion-trail clear
      ctx.fillStyle = 'rgba(4, 10, 25, 0.38)';
      ctx.fillRect(0, 0, w, h);

      if (!reducedMotion) {
        rotation += isPlaying ? 0.018 : 0.004;
      }

      // Compute average bass & mid from FFT
      let bass = 0;
      for (let i = 1; i < 12; i++) bass += fft[i] || 0;
      bass = (bass / (11 * 255)) * sensitivity;

      if (mode === 'orb') {
        // 3D Holographic Sphere & Radial Spectrum Spikes
        const baseRadius = Math.max(4, Math.min(w, h) * (compact ? 0.32 : 0.24) * (1 + bass * 0.25));

        // Ambient core glow
        const glow = ctx.createRadialGradient(
          cx,
          cy,
          Math.min(2, baseRadius * 0.2),
          cx,
          cy,
          Math.max(baseRadius * 1.8, 8)
        );
        glow.addColorStop(0, palette.primary + '66');
        glow.addColorStop(0.5, palette.secondary + '33');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(baseRadius * 1.8, 8), 0, Math.PI * 2);
        ctx.fill();

        // Radial FFT frequency crown
        const numSpikes = compact ? 32 : 64;
        for (let i = 0; i < numSpikes; i++) {
          const angle = (i / numSpikes) * Math.PI * 2 + rotation;
          const bin = Math.floor((i / numSpikes) * 90) + 1;
          const val = ((fft[bin] || 12) / 255) * sensitivity;
          const r1 = baseRadius * 1.04;
          const r2 = r1 + val * (Math.min(w, h) * 0.22);

          ctx.strokeStyle = i % 2 === 0 ? palette.primary : '#c084fc';
          ctx.lineWidth = compact ? 1.5 : 2.2;
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * r1, cy + Math.sin(angle) * r1);
          ctx.lineTo(cx + Math.cos(angle) * r2, cy + Math.sin(angle) * r2);
          ctx.stroke();
        }

        // 3D Wireframe Latitude/Longitude Rings
        ctx.save();
        ctx.translate(cx, cy);
        for (let ring = 0; ring < 3; ring++) {
          ctx.save();
          ctx.rotate(rotation * (ring % 2 === 0 ? 1 : -1.2) + ring * 1.05);
          ctx.strokeStyle = ring === 0 ? '#ffffffaa' : palette.primary + 'aa';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          const rX = Math.max(2, baseRadius);
          const rY = Math.max(1, baseRadius * (0.32 + (cameraTilt / 100) * 0.4));
          ctx.ellipse(0, 0, rX, rY, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      } else if (mode === 'city_matrix') {
        // 3D Perspective Cyber Horizon Grid & Rising Frequency Towers
        const horizonY = h * 0.38;
        ctx.strokeStyle = palette.primary + '35';
        ctx.lineWidth = 1;

        for (let z = 1; z <= 10; z++) {
          const y = horizonY + Math.pow(z / 10, 1.65) * (h - horizonY);
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }

        const numCols = 24;
        const barW = (w * 0.84) / numCols;
        const startX = w * 0.08;

        for (let c = 0; c < numCols; c++) {
          const bin = Math.floor((c / numCols) * 80) + 1;
          const mag = ((fft[bin] || 15) / 255) * sensitivity;
          const barH = Math.max(8, mag * (h * 0.62));
          const x = startX + c * barW;
          const y = h - barH - 10;

          const grad = ctx.createLinearGradient(x, y, x, h - 10);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.25, palette.primary);
          grad.addColorStop(1, palette.secondary + '33');

          ctx.fillStyle = grad;
          ctx.fillRect(x + 2, y, barW - 4, barH);
        }
      } else if (mode === 'liquid_aurora') {
        // Multi-layered Liquid Glass Waveform Ribbons
        for (let layer = 0; layer < 3; layer++) {
          ctx.beginPath();
          const color =
            layer === 0 ? palette.primary : layer === 1 ? '#a855f7' : '#ffffff';
          ctx.strokeStyle = color;
          ctx.lineWidth = layer === 2 ? 1.5 : 2.8;

          for (let i = 0; i < waveform.length; i++) {
            const x = (i / (waveform.length - 1)) * w;
            const norm = ((waveform[i] - 128) / 128) * sensitivity;
            const waveOffset =
              Math.sin(i * 0.06 + rotation * (layer + 1)) * (12 + bass * 26);
            const y = cy + norm * (h * 0.34) + waveOffset * (layer - 1) * 0.6;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      } else {
        // 'quantum_bars' — Mirrored Symmetric Holographic Analyzer
        const count = 32;
        const step = (w * 0.9) / count;
        const offsetX = w * 0.05;

        for (let i = 0; i < count; i++) {
          const bin = Math.floor((i / count) * 96) + 1;
          const val = ((fft[bin] || 10) / 255) * sensitivity;
          const halfH = Math.max(4, val * (h * 0.4));
          const x = offsetX + i * step;

          ctx.fillStyle = i % 2 === 0 ? palette.primary : '#c084fc';
          ctx.fillRect(x + 1.5, cy - halfH, step - 3, halfH * 2);

          // Top & bottom glowing caps
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 1.5, cy - halfH - 3, step - 3, 2);
          ctx.fillRect(x + 1.5, cy + halfH + 1, step - 3, 2);
        }
      }

      if (!reducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [palette, isPlaying, mode, sensitivity, cameraTilt, compact, reducedMotion]);

  if (compact) {
    return (
      <div className="relative w-full h-full overflow-hidden rounded-xl">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    );
  }

  const modes: Array<{ id: VisualizerMode; label: string }> = [
    { id: 'orb', label: 'Hologram Sphere' },
    { id: 'city_matrix', label: 'Cyber Horizon' },
    { id: 'liquid_aurora', label: 'Liquid Ribbon' },
    { id: 'quantum_bars', label: 'Quantum Matrix' },
  ];

  return (
    <div className="flex flex-col h-full gap-2.5">
      {/* Mode selector bar */}
      <div className="grid grid-cols-4 gap-1.5">
        {modes.map((m) => {
          const active = mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChangeMode(m.id)}
              className={`py-1.5 px-2 rounded-xl text-[10px] font-medium transition-all cursor-pointer truncate ${
                active
                  ? 'r2-card-cyan text-white font-semibold'
                  : 'r2-card-violet text-cyan-200/75 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Interactive 3D Canvas Viewport */}
      <div className="relative flex-1 min-h-[210px] rounded-2xl overflow-hidden border border-cyan-400/50 bg-slate-950/70 shadow-[inset_0_0_24px_rgba(0,240,255,0.18)]">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* HUD Corner Overlays */}
        <div className="absolute top-2.5 left-3 flex items-center gap-1.5 pointer-events-none">
          <Eye className="w-3.5 h-3.5 text-cyan-300" />
          <span className="font-mono-tech text-[10px] text-cyan-200/90 uppercase">
            FFT 512 // 60FPS REALTIME
          </span>
        </div>
        <div className="absolute top-2.5 right-3 pointer-events-none">
          <span className="font-mono-tech text-[10px] text-purple-300/90">
            {isPlaying ? 'SIGNAL LOCKED' : 'STANDBY WAVE'}
          </span>
        </div>
      </div>

      {/* Visualizer Instrument Controls */}
      <div className="grid grid-cols-2 gap-2.5 r2-card-violet rounded-2xl p-2.5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-cyan-100/90">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-300" /> Gain Sensitivity
            </span>
            <span className="font-mono-tech text-cyan-300">
              {Math.round(sensitivity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.2"
            step="0.05"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="r2-slider w-full"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] text-cyan-100/90">
            <span className="flex items-center gap-1">
              <Sliders className="w-3 h-3 text-purple-300" /> 3D Orbit Pitch
            </span>
            <span className="font-mono-tech text-purple-300">{cameraTilt}°</span>
          </div>
          <input
            type="range"
            min="10"
            max="85"
            step="1"
            value={cameraTilt}
            onChange={(e) => setCameraTilt(parseInt(e.target.value, 10))}
            className="r2-slider w-full"
          />
        </div>
      </div>
    </div>
  );
};
