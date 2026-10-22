import React from 'react';
import { ColorPalette } from '../types/audio';

interface R2EmblemProps {
  variant?: 'top-floating' | 'header-orb' | 'badge-mini';
  palette: ColorPalette;
  isPlaying?: boolean;
  bassEnergy?: number;
  onClick?: () => void;
}

export const R2Emblem: React.FC<R2EmblemProps> = ({
  variant = 'header-orb',
  palette,
  isPlaying = false,
  bassEnergy = 0,
  onClick,
}) => {
  const pulseScale = isPlaying ? 1 + (bassEnergy / 100) * 0.065 : 1;

  if (variant === 'top-floating') {
    return (
      <button
        type="button"
        onClick={onClick}
        title="R2 ULTRA Holographic Core"
        style={{
          transform: `translateZ(34px) scale(${pulseScale})`,
          boxShadow: `0 12px 32px rgba(0, 0, 0, 0.85), 0 0 26px ${palette.glowRgba}, inset 0 0 18px ${palette.glowRgba}`,
        }}
        className="group relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl r2-widget-glass border-[1.5px] border-cyan-300/80 flex items-center justify-center transition-transform duration-200 cursor-pointer focus:outline-none"
      >
        {/* Outer holographic corner flare */}
        <div
          className="absolute -inset-1 rounded-2xl opacity-75 blur-md pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 30%, ${palette.primary}, ${palette.secondary}, transparent 75%)`,
          }}
        />

        {/* Inner 3D Sphere Orb */}
        <div
          className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center overflow-hidden border border-cyan-200/75"
          style={{
            background: `radial-gradient(circle at 32% 28%, #ffffff 0%, ${palette.primary} 32%, #1e1b4b 72%, ${palette.secondary} 100%)`,
            boxShadow: `0 0 18px ${palette.primary}, inset 0 2px 6px rgba(255,255,255,0.85)`,
          }}
        >
          {/* Rotating holographic latitude/longitude rings */}
          <svg
            viewBox="0 0 64 64"
            className={`w-full h-full p-1 ${isPlaying ? 'animate-[spin_14s_linear_infinite]' : ''}`}
          >
            <defs>
              <linearGradient id="r2TopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="55%" stopColor={palette.primary} />
                <stop offset="100%" stopColor="#e879f9" />
              </linearGradient>
            </defs>
            <ellipse
              cx="32"
              cy="32"
              rx="26"
              ry="12"
              fill="none"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth="1.2"
              transform="rotate(-28 32 32)"
            />
            <ellipse
              cx="32"
              cy="32"
              rx="26"
              ry="12"
              fill="none"
              stroke="rgba(0, 240, 255, 0.55)"
              strokeWidth="1.2"
              transform="rotate(34 32 32)"
            />
            <circle
              cx="32"
              cy="32"
              r="27"
              fill="none"
              stroke="url(#r2TopGrad)"
              strokeWidth="1.5"
              strokeDasharray="10 5"
            />
          </svg>

          {/* Crisp 3D R2 Emblem Glyphs */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span
              className="font-orbitron font-extrabold text-[15px] sm:text-[16px] tracking-tighter text-white drop-shadow-[0_0_8px_rgba(0,240,255,0.95)]"
              style={{
                textShadow: `0 0 10px #ffffff, 0 0 18px ${palette.primary}`,
              }}
            >
              R2
            </span>
          </div>
        </div>

        {/* Bottom glowing bar reflection like reference image */}
        <div
          className="absolute -bottom-1 left-2 right-2 h-[3px] rounded-full"
          style={{
            background: `linear-gradient(90deg, transparent, #ffffff, ${palette.primary}, transparent)`,
            boxShadow: `0 0 12px ${palette.primary}`,
          }}
        />
      </button>
    );
  }

  if (variant === 'badge-mini') {
    return (
      <div
        className="relative w-7 h-7 rounded-full flex items-center justify-center shrink-0 border border-cyan-300/75"
        style={{
          background: `radial-gradient(circle at 30% 30%, #ffffff 0%, ${palette.primary} 38%, #1e1b4b 78%, ${palette.secondary} 100%)`,
          boxShadow: `0 0 12px ${palette.glowRgba}`,
        }}
      >
        <span className="font-orbitron font-bold text-[9px] tracking-tighter text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.9)]">
          R2
        </span>
      </div>
    );
  }

  // Default: 'header-orb' matching the left sphere inside the main panel header
  return (
    <div
      onClick={onClick}
      className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center shrink-0 border-[1.5px] border-cyan-300/80 cursor-pointer"
      style={{
        background: `radial-gradient(circle at 30% 28%, #ffffff 0%, ${palette.primary} 35%, #1e1b4b 75%, ${palette.secondary} 100%)`,
        boxShadow: `0 0 18px ${palette.glowRgba}, inset 0 1px 4px rgba(255,255,255,0.8)`,
      }}
    >
      <svg
        viewBox="0 0 48 48"
        className={`w-full h-full p-0.5 opacity-80 ${isPlaying ? 'animate-[spin_18s_linear_infinite]' : ''}`}
      >
        <ellipse
          cx="24"
          cy="24"
          rx="20"
          ry="9"
          fill="none"
          stroke="rgba(255,255,255,0.5)"
          strokeWidth="1.2"
          transform="rotate(-30 24 24)"
        />
        <ellipse
          cx="24"
          cy="24"
          rx="20"
          ry="9"
          fill="none"
          stroke="rgba(168,85,247,0.6)"
          strokeWidth="1.2"
          transform="rotate(30 24 24)"
        />
      </svg>
      <span
        className="absolute font-orbitron font-extrabold text-xs sm:text-[13px] tracking-tighter text-white"
        style={{
          textShadow: `0 0 8px #ffffff, 0 0 14px ${palette.primary}`,
        }}
      >
        R2
      </span>
    </div>
  );
};
