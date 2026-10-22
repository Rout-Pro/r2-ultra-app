import React from 'react';
import {
  Activity,
  Headphones,
  Library,
  Sliders,
  Sparkles,
  Volume2,
  Waves,
} from 'lucide-react';
import { ColorPalette, ScreenId, TelemetryData } from '../types/audio';

interface LeftWidgetsProps {
  telemetry: TelemetryData;
  palette: ColorPalette;
  onToggleEngine: () => void;
  onSelectScreen: (screen: ScreenId) => void;
  layout?: 'desktop' | 'mobile-row';
}

export const LeftFloatingWidgets: React.FC<LeftWidgetsProps> = ({
  telemetry,
  palette,
  onToggleEngine,
  onSelectScreen,
  layout = 'desktop',
}) => {
  const signalPct = telemetry.engineRunning ? telemetry.signalPercent : 0;
  const engineCircumference = 2 * Math.PI * 16;
  const engineDashOffset = engineCircumference * (1 - (telemetry.engineRunning ? 1 : 0));

  const signalCircumference = 2 * Math.PI * 16;
  const signalDashOffset = signalCircumference * (1 - signalPct / 100);

  if (layout === 'mobile-row') {
    return (
      <div className="w-full grid grid-cols-3 gap-2 px-1 py-1 z-20">
        {/* WIDGET A — AUDIO ENGINE */}
        <button
          type="button"
          onClick={onToggleEngine}
          title="Audio Engine Status — Click to toggle playback"
          className={`group min-h-[48px] py-1.5 px-2 rounded-xl r2-widget-glass flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer ${
            telemetry.engineRunning ? 'r2-widget-glass-active' : ''
          }`}
        >
          <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke="rgba(56, 189, 248, 0.2)"
                strokeWidth="3.5"
              />
              <circle
                cx="20"
                cy="20"
                r="16"
                fill="none"
                stroke={palette.primary}
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeDasharray={engineCircumference}
                strokeDashoffset={engineDashOffset}
                style={{
                  filter: `drop-shadow(0 0 4px ${palette.primary})`,
                  transition: 'stroke-dashoffset 0.3s ease',
                }}
              />
            </svg>
            <span className="absolute font-mono-tech text-[8px] font-bold text-white">
              {telemetry.engineRunning ? 'RUN' : 'OFF'}
            </span>
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[9px] font-semibold text-cyan-100 truncate">Engine</span>
            <span className="font-mono-tech text-[8px] text-cyan-300/80 truncate">
              {telemetry.engineRunning ? 'Active' : 'Standby'}
            </span>
          </div>
        </button>

        {/* WIDGET B — OUTPUT STATUS */}
        <button
          type="button"
          onClick={() => onSelectScreen('effects')}
          title={`Output: ${telemetry.outputDeviceLabel} (${telemetry.sampleRate ? (telemetry.sampleRate / 1000).toFixed(1) + 'kHz' : 'Standby'})`}
          className="group min-h-[48px] py-1.5 px-2 rounded-xl r2-widget-glass flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <div className="relative w-7 h-7 rounded-lg bg-purple-950/40 border border-purple-400/30 flex items-center justify-center shrink-0">
            <Headphones className="w-3.5 h-3.5 text-purple-300" />
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[9px] font-semibold text-purple-100 truncate">Output</span>
            <span className="font-mono-tech text-[8px] text-purple-300/90 truncate">
              {telemetry.sampleRate ? `${Math.round(telemetry.sampleRate / 1000)}k` : 'System'}
            </span>
          </div>
        </button>

        {/* WIDGET C — SOUND LEVEL */}
        <button
          type="button"
          onClick={() => onSelectScreen('visualizer')}
          title="Live Signal Level — Click to open 3D Visualizer"
          className="group min-h-[48px] py-1.5 px-2 rounded-xl r2-widget-glass flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <div className="flex items-end justify-center gap-[2px] h-5 w-6 shrink-0">
            {telemetry.frequencyBars.slice(0, 5).map((bar, idx) => {
              const h = telemetry.engineRunning ? Math.max(15, bar) : 15;
              return (
                <span
                  key={idx}
                  className="w-[2.5px] rounded-full transition-all duration-75"
                  style={{
                    height: `${h}%`,
                    background: idx % 2 === 0 ? palette.primary : '#a855f7',
                  }}
                />
              );
            })}
          </div>
          <div className="flex flex-col text-left min-w-0">
            <span className="text-[9px] font-semibold text-cyan-100 truncate">Level</span>
            <span className="font-mono-tech text-[8px] text-cyan-300/90 truncate">
              {telemetry.engineRunning ? `${telemetry.rmsDb.toFixed(0)}dB` : 'Silent'}
            </span>
          </div>
        </button>
      </div>
    );
  }

  // Desktop 3D tilted side layout
  return (
    <div
      className="hidden md:flex flex-col gap-2.5 shrink-0 z-20"
      style={{
        transform: 'translateZ(18px) rotateY(8deg)',
      }}
    >
      {/* WIDGET A — AUDIO ENGINE */}
      <button
        type="button"
        onClick={onToggleEngine}
        title="Audio Engine Status — Click to toggle playback"
        className={`group relative w-[72px] lg:w-[80px] min-h-[76px] py-2.5 px-1.5 rounded-2xl r2-widget-glass flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
          telemetry.engineRunning ? 'r2-widget-glass-active' : ''
        }`}
      >
        <div className="relative w-11 h-11 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="rgba(56, 189, 248, 0.2)"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke={palette.primary}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={engineCircumference}
              strokeDashoffset={engineDashOffset}
              style={{
                filter: `drop-shadow(0 0 5px ${palette.primary})`,
                transition: 'stroke-dashoffset 0.4s ease',
              }}
            />
          </svg>
          <span className="absolute font-mono-tech text-[10px] font-semibold text-white">
            {telemetry.engineRunning ? 'RUN' : 'OFF'}
          </span>
        </div>
        <span className="mt-1 text-[9.5px] font-medium tracking-tight text-cyan-100/90 leading-tight text-center whitespace-nowrap">
          Audio Engine
        </span>
      </button>

      {/* WIDGET B — OUTPUT STATUS */}
      <button
        type="button"
        onClick={() => onSelectScreen('effects')}
        title={`Output: ${telemetry.outputDeviceLabel} (${telemetry.sampleRate ? (telemetry.sampleRate / 1000).toFixed(1) + 'kHz' : 'Standby'})`}
        className="group relative w-[72px] lg:w-[80px] min-h-[76px] py-2.5 px-1.5 rounded-2xl r2-widget-glass flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <div className="relative w-11 h-11 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 40 40">
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="rgba(168, 85, 247, 0.22)"
              strokeWidth="3"
            />
            <circle
              cx="20"
              cy="20"
              r="16"
              fill="none"
              stroke="#a855f7"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={signalCircumference}
              strokeDashoffset={signalDashOffset}
              style={{
                filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.85))',
                transition: 'stroke-dashoffset 0.35s ease',
              }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <Headphones className="w-3.5 h-3.5 text-purple-200 mb-0.5" />
            <span className="font-mono-tech text-[8px] text-cyan-200/90 leading-none">
              {telemetry.sampleRate ? `${Math.round(telemetry.sampleRate / 1000)}k` : 'Out'}
            </span>
          </div>
        </div>
        <span className="mt-1 text-[9.5px] font-medium tracking-tight text-cyan-100/90 leading-tight text-center whitespace-nowrap">
          Output
        </span>
      </button>

      {/* WIDGET C — SOUND LEVEL */}
      <button
        type="button"
        onClick={() => onSelectScreen('visualizer')}
        title="Real-Time Measured RMS Level — Click to open 3D Visualizer"
        className="group relative w-[72px] lg:w-[80px] min-h-[76px] py-2.5 px-1.5 rounded-2xl r2-widget-glass flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <div className="relative w-11 h-10 flex flex-col items-center justify-center gap-1">
          <div className="flex items-end justify-center gap-[2px] h-5 w-10">
            {telemetry.frequencyBars.slice(0, 7).map((bar, idx) => {
              const h = telemetry.engineRunning ? Math.max(18, bar) : 18;
              return (
                <span
                  key={idx}
                  className="w-[3px] rounded-full transition-all duration-75"
                  style={{
                    height: `${h}%`,
                    background: idx % 2 === 0 ? palette.primary : '#a855f7',
                    boxShadow: telemetry.engineRunning
                      ? `0 0 6px ${palette.primary}`
                      : 'none',
                  }}
                />
              );
            })}
          </div>
          <span className="font-mono-tech text-[8.5px] text-cyan-200/95 leading-none">
            {telemetry.engineRunning ? `${telemetry.rmsDb.toFixed(0)}dB` : 'Silent'}
          </span>
        </div>
        <span className="mt-0.5 text-[9.5px] font-medium tracking-tight text-cyan-100/90 leading-tight text-center whitespace-nowrap">
          Sound Level
        </span>
      </button>
    </div>
  );
};

interface RightWidgetsProps {
  activeScreen: ScreenId;
  palette: ColorPalette;
  onSelectScreen: (screen: ScreenId) => void;
  layout?: 'desktop' | 'mobile-row';
}

export const RightFloatingWidgets: React.FC<RightWidgetsProps> = ({
  activeScreen,
  palette,
  onSelectScreen,
  layout = 'desktop',
}) => {
  const items: Array<{
    id: ScreenId;
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: 'equalizer',
      label: 'Equalizer',
      icon: <Sliders className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'visualizer',
      label: 'Visualizer',
      icon: <Waves className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'library',
      label: 'Library',
      icon: <Library className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
    {
      id: 'effects',
      label: 'Sound FX',
      icon: <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />,
    },
  ];

  if (layout === 'mobile-row') {
    return (
      <div className="w-full grid grid-cols-4 gap-1.5 px-1 py-1 z-20">
        {items.map((item) => {
          const isActive = activeScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectScreen(isActive && item.id !== 'home' ? 'home' : item.id)}
              className={`group min-h-[46px] py-1.5 px-1 rounded-xl r2-widget-glass flex flex-col items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer ${
                isActive ? 'r2-widget-glass-active' : ''
              }`}
            >
              <div
                className="w-5 h-5 flex items-center justify-center transition-colors"
                style={{
                  color: isActive ? '#ffffff' : palette.primary,
                  filter: `drop-shadow(0 0 6px ${isActive ? '#ffffff' : palette.primary})`,
                }}
              >
                {item.icon}
              </div>
              <span className="mt-0.5 text-[8.5px] font-medium tracking-tight text-cyan-100/90 leading-tight text-center truncate w-full">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  // Desktop 3D tilted side layout
  return (
    <div
      className="hidden md:flex flex-col gap-2.5 shrink-0 z-20"
      style={{
        transform: 'translateZ(18px) rotateY(-8deg)',
      }}
    >
      {items.map((item) => {
        const isActive = activeScreen === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectScreen(isActive && item.id !== 'home' ? 'home' : item.id)}
            className={`group relative w-[72px] lg:w-[80px] min-h-[76px] py-2.5 px-1.5 rounded-2xl r2-widget-glass flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
              isActive ? 'r2-widget-glass-active' : ''
            }`}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{
                color: isActive ? '#ffffff' : palette.primary,
                filter: `drop-shadow(0 0 8px ${isActive ? '#ffffff' : palette.primary})`,
              }}
            >
              {item.icon}
            </div>
            <span className="mt-1 text-[9.5px] font-medium tracking-tight text-cyan-100/95 leading-tight text-center whitespace-nowrap">
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

interface BottomStatusPanelsProps {
  telemetry: TelemetryData;
  palette: ColorPalette;
  activeScreen: ScreenId;
  onSelectScreen: (screen: ScreenId) => void;
}

export const BottomStatusPanels: React.FC<BottomStatusPanelsProps> = ({
  telemetry,
  palette,
  activeScreen,
  onSelectScreen,
}) => {
  const rings = [
    {
      label: 'Bass',
      value: telemetry.engineRunning ? telemetry.bassEnergy : 0,
      color: palette.primary,
      targetScreen: 'player' as ScreenId,
    },
    {
      label: 'Mid',
      value: telemetry.engineRunning ? telemetry.midEnergy : 0,
      color: '#a855f7',
      targetScreen: 'queue' as ScreenId,
    },
    {
      label: 'Treble',
      value: telemetry.engineRunning ? telemetry.trebleEnergy : 0,
      color: '#38bdf8',
      targetScreen: 'search' as ScreenId,
    },
  ];

  return (
    <div
      className="w-full max-w-[560px] grid grid-cols-1 sm:grid-cols-12 gap-2 mt-2 px-1 z-20"
      style={{
        transform: 'translateZ(14px)',
      }}
    >
      {/* Left Bottom Card — R2 ULTRA MEASURED TELEMETRY (Replaces fake buffer/load metrics) */}
      <div
        onClick={() => onSelectScreen(activeScreen === 'settings' ? 'home' : 'settings')}
        title="Web Audio Telemetry — Click to open R2 ULTRA Settings"
        className="sm:col-span-7 rounded-2xl r2-widget-glass p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
      >
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-cyan-100/90">
            R2 AUDIO TELEMETRY
          </span>
          <Activity className="w-3.5 h-3.5 text-cyan-300/80" />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2">
          {/* Metric 1: Real measured Sample Rate */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] sm:text-[10px] text-cyan-200/90 font-medium truncate">
              Sample Rate
            </span>
            <div className="font-mono-tech text-[10px] sm:text-xs text-white font-semibold truncate">
              {telemetry.sampleRate ? `${(telemetry.sampleRate / 1000).toFixed(1)}k` : 'Standby'}
            </div>
            <div className="h-1.5 rounded-full bg-slate-950/80 border border-cyan-400/35 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: telemetry.sampleRate ? '100%' : '0%',
                  background: palette.primary,
                }}
              />
            </div>
          </div>

          {/* Metric 2: Real measured Peak Level */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] sm:text-[10px] text-purple-200/90 font-medium truncate">
              Peak Level
            </span>
            <div className="font-mono-tech text-[10px] sm:text-xs text-white font-semibold truncate">
              {telemetry.engineRunning ? `${telemetry.peakDb.toFixed(1)}dB` : 'Silent'}
            </div>
            <div className="h-1.5 rounded-full bg-slate-950/80 border border-purple-400/35 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${telemetry.engineRunning ? Math.min(100, Math.max(0, (telemetry.peakDb + 54) * 1.85)) : 0}%`,
                  background: 'linear-gradient(90deg, #8b5cf6, #e879f9)',
                }}
              />
            </div>
          </div>

          {/* Metric 3: Real measured RMS Signal */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] sm:text-[10px] text-cyan-200/80 font-medium truncate">
              RMS Power
            </span>
            <div className="font-mono-tech text-[10px] sm:text-xs text-white font-semibold truncate">
              {telemetry.engineRunning ? `${telemetry.rmsDb.toFixed(1)}dB` : 'Muted'}
            </div>
            <div className="h-1.5 rounded-full bg-slate-950/80 border border-cyan-400/35 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${telemetry.signalPercent}%`,
                  background: 'linear-gradient(90deg, #38bdf8, #bae6fd)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Bottom Card — ACOUSTIC RINGS (Computed from live FFT frequency bands) */}
      <div className="sm:col-span-5 rounded-2xl r2-widget-glass p-2.5 sm:p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-cyan-100/90 truncate">
            ACOUSTIC SPECTRUM
          </span>
          <Volume2 className="w-3.5 h-3.5 text-cyan-300/80 shrink-0" />
        </div>

        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          {rings.map((ring) => {
            const circ = 2 * Math.PI * 11;
            const offset = circ * (1 - ring.value / 100);
            const isSelected = activeScreen === ring.targetScreen;
            return (
              <button
                key={ring.label}
                type="button"
                onClick={() => onSelectScreen(isSelected ? 'home' : ring.targetScreen)}
                title={`${ring.label} Energy (${ring.value}%) — Click for ${ring.targetScreen}`}
                className={`min-h-[44px] py-1 rounded-xl bg-slate-950/55 border flex flex-col items-center justify-center relative transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
                  isSelected
                    ? 'border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'border-cyan-300/30'
                }`}
              >
                <svg className="w-7 h-7 -rotate-90" viewBox="0 0 28 28">
                  <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.2)"
                    strokeWidth="2.4"
                  />
                  <circle
                    cx="14"
                    cy="14"
                    r="11"
                    fill="none"
                    stroke={ring.color}
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{
                      filter: `drop-shadow(0 0 4px ${ring.color})`,
                      transition: 'stroke-dashoffset 0.15s ease',
                    }}
                  />
                </svg>
                <span className="text-[8px] text-cyan-100/80 uppercase font-mono-tech -mt-0.5">
                  {ring.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
