import React, { useEffect, useRef } from 'react';

class Pixel {
  constructor(canvas, context, x, y, color, speed, delay, maxPx) {
    this.canvas = canvas;
    this.ctx = context;
    this.x = x;
    this.y = y;
    this.color = color;
    this.speed = (0.1 + Math.random() * 0.8) * speed;
    this.size = 0;

    const factor = maxPx / 2;
    this.sizeStep = Math.random() * 0.4 * factor;
    this.minSize = 0.2 * factor;
    this.maxSizeInteger = maxPx;
    this.maxSize = this.minSize + Math.random() * (maxPx - this.minSize);
    this.delay = delay;
    this.counter = 0;
    this.counterStep = Math.random() * 4 + 1.5;
    this.isIdle = false;
    this.isReverse = false;
    this.isShimmer = false;
    this.growStart = null;
    this.shrinkStart = null;
    this.shrinkFrom = 0;
  }

  draw() {
    const centerOffset = this.maxSizeInteger * 0.5 - this.size * 0.5;
    this.ctx.fillStyle = this.color;
    this.ctx.fillRect(
      this.x + centerOffset,
      this.y + centerOffset,
      this.size,
      this.size
    );
  }

  appear(now, durationMs, easeFn) {
    this.isIdle = false;
    this.shrinkStart = null;
    if (this.counter <= this.delay) {
      this.counter += this.counterStep;
      return;
    }
    if (!this.isShimmer) {
      if (this.growStart === null) this.growStart = now;
      const p = durationMs > 0 ? Math.min(1, (now - this.growStart) / durationMs) : 1;
      this.size = easeFn(p) * this.maxSize;
      if (p >= 1) this.isShimmer = true;
    }
    if (this.isShimmer) {
      this.shimmer();
    }
    this.draw();
  }

  disappear(now, durationMs, easeFn) {
    this.isShimmer = false;
    this.counter = 0;
    this.growStart = null;
    if (this.size <= 0) {
      this.isIdle = true;
      this.shrinkStart = null;
      return;
    }
    if (this.shrinkStart === null) {
      this.shrinkStart = now;
      this.shrinkFrom = this.size;
    }
    const p = durationMs > 0 ? Math.min(1, (now - this.shrinkStart) / durationMs) : 1;
    this.size = this.shrinkFrom * (1 - easeFn(p));
    if (p >= 1) this.size = 0;
    this.draw();
  }

  shimmer() {
    if (this.size >= this.maxSize) {
      this.isReverse = true;
    } else if (this.size <= this.minSize) {
      this.isReverse = false;
    }
    if (this.isReverse) {
      this.size = Math.max(0, this.size - this.speed);
    } else {
      this.size = Math.min(this.maxSize, this.size + this.speed);
    }
  }
}

function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const fx = (t) => ((ax * t + bx) * t + cx) * t;
  const dfx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const e = fx(t) - x;
      const d = dfx(t);
      if (Math.abs(e) < 1e-5 || d === 0) break;
      t -= e / d;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}

const defaultEase = cubicBezier(0, 0, 0.58, 1);

const DARK_COLORS = [
  'rgba(255, 255, 255, 0.35)',
  'rgba(255, 255, 255, 0.25)',
  'rgba(255, 255, 255, 0.18)',
  'rgba(255, 255, 255, 0.30)',
  'rgba(255, 255, 255, 0.12)',
];

const LIGHT_COLORS = [
  'rgba(0, 0, 0, 0.15)',
  'rgba(0, 0, 0, 0.10)',
  'rgba(0, 0, 0, 0.08)',
  'rgba(0, 0, 0, 0.12)',
];

/**
 * PixelBackground - Fullscreen ambient interactive pixel grid background
 */
export function PixelBackground({
  theme = 'dark',
  gap = 20,
  pixelSize = 2.5,
  speed = 50,
  opacity = 0.5,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pixelsRef = useRef([]);
  const animationRef = useRef(null);
  const timePreviousRef = useRef(0);

  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initPixels = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Handle high-DPI displays cleanly
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      const pxs = [];
      const step = Math.max(12, parseInt(gap.toString(), 10));
      let idx = 0;
      const effectiveSpeed = (speed / 100) * 0.05;

      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          const c = colors[idx % colors.length];
          idx++;
          const dx = x - width / 2;
          const dy = y - height / 2;
          const delay = Math.sqrt(dx * dx + dy * dy) * 0.5;
          pxs.push(new Pixel(canvas, ctx, x, y, c, effectiveSpeed, delay, pixelSize));
        }
      }
      pixelsRef.current = pxs;
    };

    initPixels();

    // Animation Loop
    const animate = (timeNow) => {
      animationRef.current = requestAnimationFrame(animate);

      const timePassed = timeNow - timePreviousRef.current;
      if (timePassed < 1000 / 45) return; // Cap at smooth 45-60 fps for background efficiency
      timePreviousRef.current = timeNow;

      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      for (let i = 0; i < pixelsRef.current.length; i++) {
        const pixel = pixelsRef.current[i];
        pixel.appear(timeNow, 1200, defaultEase);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // Interactive cursor wave
    const handlePointerMove = (e) => {
      const mx = e.clientX;
      const my = e.clientY;
      const radius = 120;
      const pxs = pixelsRef.current;

      for (let i = 0; i < pxs.length; i++) {
        const p = pxs[i];
        const distSq = (p.x - mx) ** 2 + (p.y - my) ** 2;
        if (distSq < radius * radius) {
          p.size = Math.min(p.maxSize * 1.6, p.size + 0.5);
          p.isShimmer = true;
        }
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('resize', initPixels, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', initPixels);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [theme, gap, pixelSize, speed]);

  return (
    <div
      ref={containerRef}
      className="pixel-background-container"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
        opacity,
        transition: 'opacity 0.4s ease',
      }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
}

/**
 * PixelCard - Interactive component wrapper with animated pixel border / canvas
 */
export default function PixelCard({
  children,
  colors = DARK_COLORS,
  gap = 8,
  pixelSize = 2,
  speed = 80,
  backgroundColor = 'rgba(18, 20, 30, 0.38)',
  borderColor = 'rgba(255, 255, 255, 0.12)',
  radius = 16,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const pixelsRef = useRef([]);
  const animationRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width;
    canvas.height = height;

    const pxs = [];
    const step = Math.max(4, parseInt(gap.toString(), 10));
    let idx = 0;
    const effectiveSpeed = (speed / 100) * 0.1;

    for (let x = 0; x < width; x += step) {
      for (let y = 0; y < height; y += step) {
        const c = colors[idx % colors.length];
        idx++;
        const dx = x - width / 2;
        const dy = y - height / 2;
        const delay = Math.sqrt(dx * dx + dy * dy);
        pxs.push(new Pixel(canvas, ctx, x, y, c, effectiveSpeed, delay, pixelSize));
      }
    }
    pixelsRef.current = pxs;

    // Draw initial static frame
    for (const pixel of pxs) {
      pixel.size = pixel.maxSize * 0.4;
      pixel.draw();
    }
  }, [gap, pixelSize, speed, colors]);

  const onMouseEnter = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (now) => {
      animationRef.current = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allShimmer = true;
      for (const p of pixelsRef.current) {
        p.appear(now, 800, defaultEase);
        if (!p.isShimmer) allShimmer = false;
      }
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  const onMouseLeave = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (now) => {
      animationRef.current = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let allIdle = true;
      for (const p of pixelsRef.current) {
        p.disappear(now, 600, defaultEase);
        if (!p.isIdle) allIdle = false;
      }
      if (allIdle && animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
    animationRef.current = requestAnimationFrame(animate);
  };

  return (
    <div
      ref={containerRef}
      className={`pixel-card ${className}`.trim()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: backgroundColor,
        border: `1px solid ${borderColor}`,
        borderRadius: radius,
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}