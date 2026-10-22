import React from 'react';
import {
  Activity,
  Disc3,
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
}

export const LeftFloatingWidgets: React.FC<LeftWidgetsProps> = ({
  telemetry,
  palette,
  onToggleEngine,
  onSelectScreen,
}) => {
  const enginePct = telemetry.engineRunning ? 98 : 89;
  const engineCircumference = 2 * Math.PI * 16;
  const engineDashOffset = engineCircumference * (1 - enginePct / 100);

  const dspCircumference = 2 * Math.PI * 16;
  const dspDashOffset = dspCircumference * (1 - telemetry.dspLoadPercent / 100);

  return (
    <div
      className="flex flex-col gap-2 sm:gap-2.5 shrink-0 z-20"
      style={{
        transform: 'translateZ(18px) rotateY(8deg)',
      }}
    >
      {/* WIDGET A — AUDIO ENGINE */}
      <button
        type="button"
        onClick={onToggleEngine}
        title="Audio Engine Status — Click to toggle playback"
        className={`group relative w-[64px] sm:w-[76px] py-2 px-1.5 rounded-2xl r2-widget-glass flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
          telemetry.engineRunning ? 'r2-widget-glass-active' : ''
        }`}
      >
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center">
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
          <span className="absolute font-mono-tech text-[10px] sm:text-[11px] font-semibold text-white">
            {telemetry.engineRunning ? 'RUN' : `${enginePct}%`}
          </span>
        </div>
        <span className="mt-1 text-[8.5px] sm:text-[9.5px] font-medium tracking-tight text-cyan-100/90 leading-tight text-center whitespace-nowrap">
          Audio Engine
        </span>
      </button>

      {/* WIDGET B — OUTPUT STATUS */}
      <button
        type="button"
        onClick={() => onSelectScreen('effects')}
        title={`Output: ${telemetry.outputDeviceLabel} (${telemetry.sampleRate / 1000}kHz)`}
        className="group relative w-[64px] sm:w-[76px] py-2 px-1.5 rounded-2xl r2-widget-glass flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center">
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
              strokeDasharray={dspCircumference}
              strokeDashoffset={dspDashOffset}
              style={{
                filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.85))',
                transition: 'stroke-dashoffset 0.35s ease',
              }}
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <Headphones className="w-3.5 h-3.5 text-purple-200 mb-0.5" />
            <span className="font-mono-tech text-[8px] text-cyan-200/90 leading-none">
              {Math.round(telemetry.sampleRate / 1000)}k
            </span>
          </div>
        </div>
        <span className="mt-1 text-[8.5px] sm:text-[9.5px] font-medium tracking-tight text-cyan-100/90 leading-tight text-center whitespace-nowrap">
          Output Status
        </span>
      </button>

      {/* WIDGET C — SOUND LEVEL */}
      <button
        type="button"
        onClick={() => onSelectScreen('visualizer')}
        title="Real-Time Audio Signal Level — Click to open 3D Visualizer"
        className="group relative w-[64px] sm:w-[76px] py-2 px-1.5 rounded-2xl r2-widget-glass flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      >
        <div className="relative w-10 h-9 sm:w-11 sm:h-10 flex flex-col items-center justify-center gap-1">
          <div className="flex items-end justify-center gap-[2px] h-5 w-9">
            {telemetry.frequencyBars.slice(0, 7).map((bar, idx) => {
              const h = telemetry.engineRunning ? Math.max(18, bar) : 18;
              return (
                <span
                  key={idx}
                  className="w-[3px] rounded-full transition-all duration-75"
                  style={{
                    height: `${h}%`,
                    background:
                      idx % 2 === 0 ? palette.primary : '#a855f7',
                    boxShadow: telemetry.engineRunning
                      ? `0 0 6px ${palette.primary}`
                      : 'none',
                  }}
                />
              );
            })}
          </div>
          <span className="font-mono-tech text-[8.5px] text-cyan-200/95 leading-none">
            {telemetry.engineRunning ? `${telemetry.rmsDb.toFixed(0)}dB` : 'IDLE'}
          </span>
        </div>
        <span className="mt-0.5 text-[8.5px] sm:text-[9.5px] font-medium tracking-tight text-cyan-100/90 leading-tight text-center whitespace-nowrap">
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
}

export const RightFloatingWidgets: React.FC<RightWidgetsProps> = ({
  activeScreen,
  palette,
  onSelectScreen,
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

  return (
    <div
      className="flex flex-col gap-2 sm:gap-2.5 shrink-0 z-20"
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
            onClick={() =>
              onSelectScreen(isActive && item.id !== 'home' ? 'home' : item.id)
            }
            className={`group relative w-[64px] sm:w-[76px] py-2.5 px-1.5 rounded-2xl r2-widget-glass flex flex-col items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer ${
              isActive ? 'r2-widget-glass-active' : ''
            }`}
          >
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-colors"
              style={{
                color: isActive ? '#ffffff' : palette.primary,
                filter: `drop-shadow(0 0 8px ${
                  isActive ? '#ffffff' : palette.primary
                })`,
              }}
            >
              {item.icon}
            </div>
            <span className="mt-1 text-[8.5px] sm:text-[9.5px] font-medium tracking-tight text-cyan-100/95 leading-tight text-center whitespace-nowrap">
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
      value: telemetry.engineRunning ? telemetry.bassEnergy : 72,
      color: palette.primary,
      targetScreen: 'player' as ScreenId,
    },
    {
      label: 'Mid',
      value: telemetry.engineRunning ? telemetry.midEnergy : 58,
      color: '#a855f7',
      targetScreen: 'queue' as ScreenId,
    },
    {
      label: 'Treble',
      value: telemetry.engineRunning ? telemetry.trebleEnergy : 84,
      color: '#38bdf8',
      targetScreen: 'search' as ScreenId,
    },
  ];

  return (
    <div
      className="w-full max-w-[430px] sm:max-w-[520px] grid grid-cols-12 gap-2.5 sm:gap-3 mt-2.5 sm:mt-3 px-1 z-20"
      style={{
        transform: 'translateZ(14px)',
      }}
    >
      {/* Left Bottom Card — R2 ULTRA STATUS (matches AETHER STATUS in reference) */}
      <div
        onClick={() =>
          onSelectScreen(activeScreen === 'settings' ? 'home' : 'settings')
        }
        title="Click to open R2 ULTRA System Settings"
        className="col-span-7 rounded-2xl r2-widget-glass p-2.5 sm:p-3 flex flex-col justify-between cursor-pointer transition-transform duration-200 hover:scale-[1.01]"
      >
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-cyan-100/90">
            R2 ULTRA STATUS
          </span>
          <Activity className="w-3 h-3 text-cyan-300/80" />
        </div>

        <div className="grid grid-cols-3 gap-2 mt-2">
          {/* Bar 1: Optimal */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] sm:text-[10px] text-cyan-200/90 font-medium truncate">
              Optimal
            </span>
            <div className="h-2.5 rounded-full bg-slate-950/80 border border-cyan-400/35 p-0.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${telemetry.bufferHealthPercent}%`,
                  background: `linear-gradient(90deg, ${palette.primary}, #ffffff)`,
                  boxShadow: `0 0 8px ${palette.primary}`,
                }}
              />
            </div>
          </div>

          {/* Bar 2: DSP Load */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] sm:text-[10px] text-purple-200/90 font-medium truncate">
              DSP Load
            </span>
            <div className="h-2.5 rounded-full bg-slate-950/80 border border-purple-400/35 p-0.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${telemetry.dspLoadPercent}%`,
                  background: 'linear-gradient(90deg, #8b5cf6, #e879f9)',
                  boxShadow: '0 0 8px rgba(168, 85, 247, 0.8)',
                }}
              />
            </div>
          </div>

          {/* Bar 3: Headroom */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] sm:text-[10px] text-cyan-200/80 font-medium truncate">
              Headroom
            </span>
            <div className="h-2.5 rounded-full bg-slate-950/80 border border-cyan-400/35 p-0.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${telemetry.headroomPercent}%`,
                  background: 'linear-gradient(90deg, #38bdf8, #bae6fd)',
                  boxShadow: '0 0 8px #38bdf8',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right Bottom Card — ACOUSTIC OVERVIEW (matches DAILY OVERVIEW with 3 glowing rings in reference) */}
      <div className="col-span-5 rounded-2xl r2-widget-glass p-2.5 sm:p-3 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="font-display font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-cyan-100/90 truncate">
            ACOUSTIC RINGS
          </span>
          <Volume2 className="w-3 h-3 text-cyan-300/80 shrink-0" />
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
                onClick={() =>
                  onSelectScreen(isSelected ? 'home' : ring.targetScreen)
                }
                title={`${ring.label} Energy (${ring.value}%) — Click for ${ring.targetScreen}`}
                className={`aspect-square rounded-xl bg-slate-950/55 border flex flex-col items-center justify-center relative transition-transform hover:scale-105 cursor-pointer ${
                  isSelected
                    ? 'border-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'border-cyan-300/30'
                }`}
              >
                <svg className="w-7 h-7 sm:w-8 sm:h-8 -rotate-90" viewBox="0 0 28 28">
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
                <span className="text-[7.5px] text-cyan-100/75 uppercase tracking-tighter -mt-0.5">
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
