import React from 'react';
import {
  Clock,
  Gauge,
  Radio,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { AudioEffectsState, ColorPalette } from '../types/audio';

interface EffectsLabScreenProps {
  effects: AudioEffectsState;
  palette: ColorPalette;
  onUpdateEffects: (partial: Partial<AudioEffectsState>) => void;
  onResetEffects: () => void;
}

export const EffectsLabScreen: React.FC<EffectsLabScreenProps> = ({
  effects,
  palette,
  onUpdateEffects,
  onResetEffects,
}) => {
  const sleepOptions: Array<{ label: string; mins: number | null }> = [
    { label: 'Off', mins: null },
    { label: '5m', mins: 5 },
    { label: '15m', mins: 15 },
    { label: '30m', mins: 30 },
    { label: '60m', mins: 60 },
  ];

  const speedPresets = [0.75, 1.0, 1.25, 1.5];

  const formatRemaining = (sec: number | null) => {
    if (sec === null || sec <= 0) return 'Inactive';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full gap-2.5 overflow-y-auto pr-0.5">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span className="font-display font-bold text-xs tracking-wider uppercase text-white">
            R2 DSP ACOUSTIC PROCESSOR
          </span>
        </div>
        <button
          type="button"
          onClick={onResetEffects}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl r2-card-violet text-[10px] text-cyan-200 hover:text-white cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Reset DSP
        </button>
      </div>

      {/* Primary 3 Holographic Rotary/Arc Cards: Sub-Bass, Treble Air, 3D Spatial */}
      <div className="grid grid-cols-3 gap-2">
        {/* Sub-Bass Boost */}
        <div className="rounded-2xl r2-card-cyan p-2.5 flex flex-col items-center text-center">
          <span className="text-[10px] font-semibold text-cyan-100">Sub-Bass</span>
          <span className="font-mono-tech text-sm font-bold text-white my-1">
            +{effects.bassBoost.toFixed(1)} dB
          </span>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={effects.bassBoost}
            onChange={(e) =>
              onUpdateEffects({ bassBoost: parseFloat(e.target.value) })
            }
            className="r2-slider w-full mt-1"
          />
          <span className="text-[8.5px] text-cyan-200/75 mt-1">65Hz Lowshelf</span>
        </div>

        {/* Treble Air Exciter */}
        <div className="rounded-2xl r2-card-violet p-2.5 flex flex-col items-center text-center">
          <span className="text-[10px] font-semibold text-purple-100">Treble Air</span>
          <span className="font-mono-tech text-sm font-bold text-white my-1">
            +{effects.trebleExciter.toFixed(1)} dB
          </span>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={effects.trebleExciter}
            onChange={(e) =>
              onUpdateEffects({ trebleExciter: parseFloat(e.target.value) })
            }
            className="r2-slider w-full mt-1"
          />
          <span className="text-[8.5px] text-purple-200/75 mt-1">9.5kHz Harmonics</span>
        </div>

        {/* 3D Spatial Ambience */}
        <div className="rounded-2xl r2-card-cyan p-2.5 flex flex-col items-center text-center">
          <span className="text-[10px] font-semibold text-cyan-100">3D Spatial</span>
          <span className="font-mono-tech text-sm font-bold text-white my-1">
            {effects.spatialAmbience}%
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={effects.spatialAmbience}
            onChange={(e) =>
              onUpdateEffects({ spatialAmbience: parseInt(e.target.value, 10) })
            }
            className="r2-slider w-full mt-1"
          />
          <span className="text-[8.5px] text-cyan-200/75 mt-1">Stereo Haas Matrix</span>
        </div>
      </div>

      {/* Stereo Field Pan & Master Dynamics Limiter */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-7 rounded-2xl r2-card-violet p-2.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-cyan-100 font-medium flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-300" /> Stereo Balance
            </span>
            <span className="font-mono-tech text-cyan-300">
              {effects.stereoPan === 0
                ? 'CENTER'
                : effects.stereoPan < 0
                ? `L ${Math.round(Math.abs(effects.stereoPan) * 100)}%`
                : `R ${Math.round(effects.stereoPan * 100)}%`}
            </span>
          </div>
          <input
            type="range"
            min="-1"
            max="1"
            step="0.05"
            value={effects.stereoPan}
            onChange={(e) =>
              onUpdateEffects({ stereoPan: parseFloat(e.target.value) })
            }
            className="r2-slider w-full my-1.5"
          />
          <div className="flex justify-between text-[8.5px] text-cyan-200/60 font-mono-tech">
            <span>LEFT</span>
            <button
              type="button"
              onClick={() => onUpdateEffects({ stereoPan: 0 })}
              className="text-cyan-300 hover:underline cursor-pointer"
            >
              RESET
            </button>
            <span>RIGHT</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onUpdateEffects({ compressorEnabled: !effects.compressorEnabled })
          }
          className={`col-span-5 rounded-2xl p-2.5 flex flex-col items-start justify-between text-left transition-all cursor-pointer ${
            effects.compressorEnabled ? 'r2-card-cyan' : 'r2-card-violet opacity-80'
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <ShieldCheck
              className="w-4 h-4"
              style={{ color: effects.compressorEnabled ? palette.primary : '#94a3b8' }}
            />
            <span className="font-mono-tech text-[9px] px-1.5 py-0.5 rounded bg-slate-950/70 text-cyan-200">
              {effects.compressorEnabled ? 'ACTIVE' : 'BYPASS'}
            </span>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white leading-tight">
              Dynamics Guard
            </div>
            <div className="text-[9px] text-cyan-200/75">
              Zero-clipping compressor
            </div>
          </div>
        </button>
      </div>

      {/* Playback Speed Pitch/Time Engine */}
      <div className="rounded-2xl r2-card-violet p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-cyan-100 flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-cyan-300" /> Playback Velocity
          </span>
          <span className="font-mono-tech text-xs font-bold text-cyan-300">
            {effects.playbackSpeed.toFixed(2)}x
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {speedPresets.map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => onUpdateEffects({ playbackSpeed: spd })}
              className={`py-1 rounded-xl font-mono-tech text-[10px] transition-all cursor-pointer ${
                Math.abs(effects.playbackSpeed - spd) < 0.02
                  ? 'r2-card-cyan text-white font-bold'
                  : 'bg-slate-950/60 border border-cyan-500/25 text-cyan-200/80 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>

      {/* Sleep Timer */}
      <div className="rounded-2xl r2-card-cyan p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-cyan-100 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-cyan-300" /> Autonomous Sleep Timer
          </span>
          <span className="font-mono-tech text-[10px] text-white">
            {formatRemaining(effects.sleepTimerRemainingSec)}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {sleepOptions.map((opt) => {
            const active = effects.sleepTimerMinutes === opt.mins;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() =>
                  onUpdateEffects({
                    sleepTimerMinutes: opt.mins,
                    sleepTimerRemainingSec: opt.mins ? opt.mins * 60 : null,
                  })
                }
                className={`py-1 rounded-xl font-mono-tech text-[10px] transition-all cursor-pointer ${
                  active
                    ? 'bg-cyan-400/30 border border-cyan-300 text-white font-bold shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'bg-slate-950/60 border border-cyan-500/20 text-cyan-200/75 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
