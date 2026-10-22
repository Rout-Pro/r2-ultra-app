import React, { useState } from 'react';
import { RotateCcw, Save, Sliders } from 'lucide-react';
import { ColorPalette, EQBand, EQPreset } from '../types/audio';
import { DEFAULT_EQ_PRESETS } from '../services/audioEngine';

interface EqualizerScreenProps {
  bands: EQBand[];
  activePresetId: string;
  customPresets: EQPreset[];
  palette: ColorPalette;
  onChangeBand: (index: number, gainDb: number) => void;
  onSelectPreset: (preset: EQPreset) => void;
  onSaveCustomPreset: (name: string) => void;
  onReset: () => void;
}

export const EqualizerScreen: React.FC<EqualizerScreenProps> = ({
  bands,
  activePresetId,
  customPresets,
  palette,
  onChangeBand,
  onSelectPreset,
  onSaveCustomPreset,
  onReset,
}) => {
  const [newPresetName, setNewPresetName] = useState('');
  const [showSaveInput, setShowSaveInput] = useState(false);

  const allPresets = [...DEFAULT_EQ_PRESETS, ...customPresets];

  // Build SVG cubic spline path across the 10 EQ bands
  const svgW = 360;
  const svgH = 92;
  const points = bands.map((b, i) => {
    const x = 18 + (i / (bands.length - 1)) * (svgW - 36);
    const y = svgH / 2 - (b.gain / 12) * (svgH / 2 - 12);
    return { x, y };
  });

  const buildSmoothPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const midX = (p0.x + p1.x) / 2;
      d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const curvePath = buildSmoothPath(points);
  const areaPath = `${curvePath} L ${points[points.length - 1].x} ${svgH} L ${points[0].x} ${svgH} Z`;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPresetName.trim()) return;
    onSaveCustomPreset(newPresetName.trim());
    setNewPresetName('');
    setShowSaveInput(false);
  };

  return (
    <div className="flex flex-col h-full gap-2.5">
      {/* Top Preset Selector & Actions */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {allPresets.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className={`px-2.5 py-1 rounded-xl text-[10px] font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'r2-card-cyan text-white font-semibold'
                    : 'r2-card-violet text-cyan-200/75 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setShowSaveInput(!showSaveInput)}
            title="Save Custom EQ Profile"
            className="p-1.5 rounded-xl r2-card-violet text-cyan-200 hover:text-white cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onReset}
            title="Reset EQ to Flat 0dB"
            className="p-1.5 rounded-xl r2-card-violet text-cyan-200 hover:text-white cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {showSaveInput && (
        <form onSubmit={handleSave} className="flex items-center gap-1.5">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Custom profile name..."
            className="flex-1 px-2.5 py-1 rounded-xl bg-slate-950/80 border border-cyan-400/50 text-xs text-white focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-xl r2-card-cyan text-xs font-semibold text-white cursor-pointer"
          >
            Save
          </button>
        </form>
      )}

      {/* Holographic Parametric Spline Curve Display */}
      <div className="relative rounded-2xl r2-card-cyan p-2 overflow-hidden">
        <div className="flex items-center justify-between px-1 mb-1">
          <span className="font-mono-tech text-[9.5px] text-cyan-200/90 flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-300" /> 10-BAND BIQUAD DSP RESPONSE
          </span>
          <span className="font-mono-tech text-[9.5px] text-purple-200/90">
            ±12.0 dB RANGE
          </span>
        </div>

        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-[78px] overflow-visible">
          <defs>
            <linearGradient id="eqAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={palette.primary} stopOpacity="0.45" />
              <stop offset="100%" stopColor={palette.secondary} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* 0 dB center reference line */}
          <line
            x1="12"
            y1={svgH / 2}
            x2={svgW - 12}
            y2={svgH / 2}
            stroke="rgba(125, 211, 252, 0.25)"
            strokeDasharray="3 3"
            strokeWidth="1"
          />

          {/* Shaded area under curve */}
          <path d={areaPath} fill="url(#eqAreaGrad)" />

          {/* Glowing spline curve */}
          <path
            d={curvePath}
            fill="none"
            stroke={palette.primary}
            strokeWidth="2.5"
            style={{ filter: `drop-shadow(0 0 6px ${palette.primary})` }}
          />

          {/* Node points */}
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#ffffff"
              stroke={palette.primary}
              strokeWidth="2"
            />
          ))}
        </svg>
      </div>

      {/* 10 Vertical Interactive Fader Channels */}
      <div className="flex-1 rounded-2xl r2-card-violet p-2.5 flex items-stretch justify-between gap-1">
        {bands.map((band, idx) => {
          const pct = ((band.gain + 12) / 24) * 100;
          return (
            <div
              key={band.frequency}
              className="flex flex-col items-center justify-between flex-1"
            >
              <span className="font-mono-tech text-[8.5px] text-cyan-200/90">
                {band.gain > 0 ? `+${band.gain.toFixed(0)}` : band.gain.toFixed(0)}
              </span>

              {/* Vertical track container */}
              <div className="relative flex-1 w-full flex items-center justify-center my-1.5 min-h-[105px]">
                <div className="relative w-2 h-full rounded-full bg-slate-950/90 border border-cyan-400/30 overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-75"
                    style={{
                      height: `${pct}%`,
                      background: `linear-gradient(0deg, ${palette.secondary}, ${palette.primary})`,
                      boxShadow: `0 0 8px ${palette.primary}`,
                    }}
                  />
                </div>

                {/* Vertical invisible/interactive range slider */}
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="0.5"
                  value={band.gain}
                  aria-label={`${band.label} Hz Gain`}
                  onChange={(e) => onChangeBand(idx, parseFloat(e.target.value))}
                  className="absolute w-[105px] h-6 -rotate-90 opacity-0 cursor-pointer z-10"
                />

                {/* Glowing thumb indicator */}
                <div
                  className="w-3.5 h-2 rounded-sm bg-white border border-cyan-300 pointer-events-none absolute transition-all duration-75"
                  style={{
                    bottom: `calc(${pct}% - 4px)`,
                    boxShadow: `0 0 8px ${palette.primary}`,
                  }}
                />
              </div>

              <span className="font-mono-tech text-[8.5px] font-semibold text-cyan-100/80">
                {band.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
