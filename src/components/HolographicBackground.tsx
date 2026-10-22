import React, { useEffect, useRef } from 'react';
import { ColorPalette } from '../types/audio';

interface HolographicBackgroundProps {
  palette: ColorPalette;
  isPlaying: boolean;
  bassEnergy: number;
  reducedMotion: boolean;
  enableColorFlow: boolean;
}

export const HolographicBackground: React.FC<HolographicBackgroundProps> = ({
  palette,
  isPlaying,
  bassEnergy,
  reducedMotion,
  enableColorFlow,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = Math.max(320, window.innerWidth || 360));
    let height = (canvas.height = Math.max(480, window.innerHeight || 640));

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = Math.max(320, window.innerWidth || 360);
      height = canvas.height = Math.max(480, window.innerHeight || 640);
    };
    window.addEventListener('resize', handleResize);

    // Pre-generate city skyline towers at bottom (matching reference image)
    const towers = Array.from({ length: 28 }, (_, i) => ({
      xRatio: i / 27,
      wRatio: 0.025 + ((i * 17) % 10) * 0.004,
      hRatio: 0.14 + ((i * 31) % 12) * 0.022,
      windowRows: 6 + (i % 8),
      litSeed: i * 13,
    }));

    // Pre-generate circuit constellation nodes on left and right
    const nodes = Array.from({ length: 34 }, (_, i) => ({
      x: ((i * 79) % 100) / 100,
      y: ((i * 43) % 85) / 100,
      vx: (((i % 5) - 2) * 0.00008),
      vy: (((i % 3) - 1) * 0.00006),
      size: 1.3 + (i % 3) * 0.8,
      isViolet: i % 5 === 0,
    }));

    let phase = 0;

    const render = () => {
      if (document.hidden) {
        animId = requestAnimationFrame(render);
        return;
      }

      if (!reducedMotion) {
        phase += isPlaying ? 0.014 : 0.004;
      }

      // 1. Deep Midnight Navy & Obsidian Base
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#01040b');
      bgGrad.addColorStop(0.45, '#040b1d');
      bgGrad.addColorStop(0.85, '#06122c');
      bgGrad.addColorStop(1, '#020714');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Liquid Glass Color-Flow Ambient Aurora
      const activePrimary = enableColorFlow ? palette.primary : '#00f0ff';
      const activeSecondary = enableColorFlow ? palette.secondary : '#8b5cf6';
      const energyBoost = isPlaying ? (bassEnergy / 100) * 0.18 : 0;

      const maxDim = Math.max(width, height);
      const centerGlow = ctx.createRadialGradient(
        width * (0.5 + Math.sin(phase * 0.7) * 0.04),
        height * 0.45,
        10,
        width * 0.5,
        height * 0.48,
        Math.max(25, maxDim * 0.58)
      );
      centerGlow.addColorStop(0, activePrimary + '26');
      centerGlow.addColorStop(0.45, activeSecondary + '18');
      centerGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      // Left-side subtle violet/magenta bokeh orb (matching reference bottom-left)
      const leftBokeh = ctx.createRadialGradient(
        width * 0.12,
        height * 0.62,
        3,
        width * 0.12,
        height * 0.62,
        Math.max(10, width * 0.25)
      );
      leftBokeh.addColorStop(0, 'rgba(217, 70, 239, 0.22)');
      leftBokeh.addColorStop(0.5, 'rgba(56, 189, 248, 0.12)');
      leftBokeh.addColorStop(1, 'transparent');
      ctx.fillStyle = leftBokeh;
      ctx.fillRect(0, 0, width, height);

      // 3. Top Server Matrix / Telemetry Bars (matching top-left & top-right of reference)
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      for (let col = 0; col < 6; col++) {
        const colX = width * (col < 3 ? 0.08 + col * 0.06 : 0.68 + (col - 3) * 0.07);
        for (let row = 0; row < 10; row++) {
          const barW = 14 + ((col + row) % 3) * 8;
          const barY = height * 0.08 + row * 7;
          const alpha = 0.06 + 0.08 * Math.sin(phase * 2 + col + row);
          ctx.fillStyle = `rgba(56, 189, 248, ${ Math.max(0.03, alpha) })`;
          ctx.fillRect(colX, barY, barW, 3);
        }
      }

      // 4. Left-side dotted orbital circle (matching left edge of reference image)
      ctx.save();
      ctx.translate(width * 0.08, height * 0.56);
      ctx.rotate(phase * 0.25);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.24)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 8]);
      ctx.beginPath();
      ctx.arc(0, 0, Math.min(width, height) * 0.11, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // 5. Futuristic Digital Cityscape Silhouette & Server Lights at Bottom
      for (const tower of towers) {
        const tx = tower.xRatio * width;
        const tw = tower.wRatio * width;
        const th = (tower.hRatio + energyBoost * 0.08) * height;
        const ty = height - th;

        // Dark architectural silhouette
        const tGrad = ctx.createLinearGradient(tx, ty, tx, height);
        tGrad.addColorStop(0, 'rgba(7, 22, 48, 0.75)');
        tGrad.addColorStop(1, 'rgba(2, 6, 16, 0.95)');
        ctx.fillStyle = tGrad;
        ctx.fillRect(tx, ty, tw, th);

        // Glowing cyan/blue vertical edge line
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 1;
        ctx.strokeRect(tx, ty, tw, th);

        // Luminous horizontal window slits
        const stepY = th / (tower.windowRows + 2);
        for (let r = 1; r <= tower.windowRows; r++) {
          if ((r + tower.litSeed) % 2 === 0) {
            const wy = ty + r * stepY;
            ctx.fillStyle =
              (r + tower.litSeed) % 5 === 0
                ? 'rgba(0, 240, 255, 0.45)'
                : 'rgba(56, 189, 248, 0.22)';
            ctx.fillRect(tx + 3, wy, Math.max(4, tw - 6), 2);
          }
        }
      }

      // 6. Circuit Constellation Lines & Luminous Particles
      ctx.lineWidth = 0.8;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (!reducedMotion) {
          n.x = (n.x + n.vx + 1) % 1;
          n.y = (n.y + n.vy + 1) % 1;
        }
        const nx = n.x * width;
        const ny = n.y * height;

        // Connect nearby nodes like the neural network lines in the reference
        for (let j = i + 1; j < nodes.length; j++) {
          const m = nodes[j];
          const mx = m.x * width;
          const my = m.y * height;
          const dist = Math.hypot(nx - mx, ny - my);
          if (dist < 135) {
            const lineAlpha = (1 - dist / 135) * 0.22;
            ctx.strokeStyle = `rgba(56, 189, 248, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(nx, ny);
            ctx.lineTo(mx, my);
            ctx.stroke();
          }
        }

        // Draw glowing node dot
        ctx.fillStyle = n.isViolet
          ? 'rgba(192, 132, 252, 0.75)'
          : 'rgba(125, 211, 252, 0.85)';
        ctx.beginPath();
        ctx.arc(nx, ny, n.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reducedMotion) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [palette, isPlaying, bassEnergy, reducedMotion, enableColorFlow]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      aria-hidden="true"
    />
  );
};
