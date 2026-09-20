import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

// --- Color Helpers & Constants ---
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  const r = ((bigint >> 16) & 255) / 255;
  const g = ((bigint >> 8) & 255) / 255;
  const b = (bigint & 255) / 255;
  return [r, g, b];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(c1, c2, t) {
  return [
    lerp(c1[0], c2[0], t),
    lerp(c1[1], c2[1], t),
    lerp(c1[2], c2[2], t)
  ];
}

const COLOR_ORANGE_HOT = hexToRgb('#FF4500');
const COLOR_ORANGE_MID = hexToRgb('#FF6B35');
const COLOR_ORANGE_LIGHT = hexToRgb('#FFA726');
const COLOR_BLUE_ELECTRIC = hexToRgb('#00BFFF');
const COLOR_BLUE_LIGHT = hexToRgb('#4FC3F7');
const COLOR_BLUE_DEEP = hexToRgb('#003082');
const COLOR_MAGENTA = hexToRgb('#FF4081');
const COLOR_PURPLE_PINK = hexToRgb('#E040FB');
const COLOR_WHITE = [1.0, 1.0, 1.0];
const COLOR_GOLD = hexToRgb('#FFD54F');
const COLOR_CYAN_ICE = hexToRgb('#80D8FF');

// Procedural soft radial glow circle texture (No external image needed)
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.2, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.45, 'rgba(255, 255, 255, 0.35)');
  grad.addColorStop(0.8, 'rgba(255, 255, 255, 0.08)');
  grad.addColorStop(1.0, 'rgba(255, 255, 255, 0.0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// --- Formations ---
function generateTorus(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const R = 2.45;
  const r = 0.52;

  const tiltX = 0.38;
  const tiltZ = -0.16;
  const cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
  const cosZ = Math.cos(tiltZ), sinZ = Math.sin(tiltZ);

  for (let i = 0; i < count; i++) {
    const u = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.02;
    const v = Math.random() * Math.PI * 2;
    const radialDist = r * (0.65 + 0.45 * (Math.random() + Math.random()));

    let x0 = (R + radialDist * Math.cos(v)) * Math.cos(u);
    let y0 = (R + radialDist * Math.cos(v)) * Math.sin(u);
    let z0 = radialDist * Math.sin(v);

    let y1 = y0 * cosX - z0 * sinX;
    let z1 = y0 * sinX + z0 * cosX;
    let x2 = x0 * cosZ - y1 * sinZ;
    let y2 = x0 * sinZ + y1 * cosZ;
    let z2 = z1;

    positions[i * 3] = x2;
    positions[i * 3 + 1] = y2 + 0.1;
    positions[i * 3 + 2] = z2;

    const ny = y0 / (R + r);
    let c;
    if (ny > 0.15) {
      const t = Math.min(1, ny * 1.2);
      c = lerpColor(COLOR_ORANGE_MID, COLOR_ORANGE_HOT, t);
    } else if (ny < -0.15) {
      const t = Math.min(1, -ny * 1.2);
      c = lerpColor(COLOR_BLUE_LIGHT, COLOR_BLUE_ELECTRIC, t);
    } else {
      const blend = (ny + 0.15) / 0.3;
      c = lerpColor(COLOR_BLUE_LIGHT, COLOR_ORANGE_MID, blend);
    }

    if (Math.random() < 0.12) {
      c = lerpColor(c, COLOR_WHITE, 0.4);
    }

    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }

  return { positions, colors };
}

function generateBlackHoleVortex(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const r = 0.15 + 2.7 * Math.pow(Math.random(), 1.6);
    const angle = r * 4.5 + (i % 3) * ((Math.PI * 2) / 3) + (Math.random() - 0.5) * 0.25;

    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);
    const y = -0.75 / (r + 0.3) + 0.55 + (Math.random() - 0.5) * 0.12;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    let c;
    if (r < 0.45) {
      c = lerpColor(COLOR_WHITE, COLOR_GOLD, r / 0.45);
    } else if (r < 1.4) {
      c = lerpColor(COLOR_BLUE_LIGHT, COLOR_BLUE_ELECTRIC, (r - 0.45) / 0.95);
    } else {
      c = lerpColor(COLOR_BLUE_DEEP, COLOR_PURPLE_PINK, (r - 1.4) / 1.3);
    }

    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }

  return { positions, colors };
}

function generateParticleColumn(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const u = i / count;
    const y = lerp(-3.2, 3.2, u) + (Math.random() - 0.5) * 0.15;
    const r = 0.12 + 0.55 * Math.pow(Math.random(), 2.2);
    const angle = y * 2.6 + Math.random() * Math.PI * 2;

    const x = r * Math.cos(angle);
    const z = r * Math.sin(angle);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const normY = (y + 3.2) / 6.4;
    let c = lerpColor(COLOR_BLUE_ELECTRIC, COLOR_MAGENTA, normY);
    if (Math.random() < 0.25) {
      c = lerpColor(c, COLOR_PURPLE_PINK, 0.5);
    }

    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }

  return { positions, colors };
}

function generateWaveTerrainBase(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const cols = 100;
  const rows = 80;
  const width = 7.4;
  const depth = 5.2;

  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);

    const xNorm = col / (cols - 1);
    const zNorm = row / (rows - 1);

    const x = (xNorm - 0.5) * width + (Math.random() - 0.5) * 0.02;
    const z = (zNorm - 0.5) * depth + (Math.random() - 0.5) * 0.02;
    const y = 0.0;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    let c;
    if (xNorm < 0.45) {
      const t = xNorm / 0.45;
      c = lerpColor(COLOR_BLUE_DEEP, COLOR_BLUE_ELECTRIC, t);
    } else if (xNorm > 0.55) {
      const t = (xNorm - 0.55) / 0.45;
      c = lerpColor(COLOR_ORANGE_MID, COLOR_ORANGE_LIGHT, t);
    } else {
      const t = (xNorm - 0.45) / 0.1;
      c = lerpColor(COLOR_BLUE_ELECTRIC, COLOR_ORANGE_MID, t);
    }

    colors[i * 3] = c[0];
    colors[i * 3 + 1] = c[1];
    colors[i * 3 + 2] = c[2];
  }

  return { positions, colors, cols, rows };
}

function generateSpiralGalaxy(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  const coreCount = 1200;
  const ringCount = 1000;
  const armsCount = count - coreCount - ringCount;

  let pIdx = 0;

  for (let i = 0; i < coreCount; i++) {
    const r = Math.pow(Math.random(), 2.0) * 0.62;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * 0.28 * (1.0 - r / 0.7);

    positions[pIdx * 3] = x;
    positions[pIdx * 3 + 1] = y;
    positions[pIdx * 3 + 2] = z;

    const t = r / 0.62;
    const c = lerpColor(COLOR_WHITE, COLOR_ORANGE_LIGHT, t);
    colors[pIdx * 3] = c[0];
    colors[pIdx * 3 + 1] = c[1];
    colors[pIdx * 3 + 2] = c[2];
    pIdx++;
  }

  const orbitalRadius = 1.72;
  for (let i = 0; i < ringCount; i++) {
    const theta = (i / ringCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.02;
    const r = orbitalRadius + (Math.random() - 0.5) * 0.12;
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * 0.06;

    positions[pIdx * 3] = x;
    positions[pIdx * 3 + 1] = y;
    positions[pIdx * 3 + 2] = z;

    const c = lerpColor(COLOR_BLUE_ELECTRIC, COLOR_BLUE_LIGHT, Math.random());
    colors[pIdx * 3] = c[0];
    colors[pIdx * 3 + 1] = c[1];
    colors[pIdx * 3 + 2] = c[2];
    pIdx++;
  }

  const armColors = [COLOR_BLUE_ELECTRIC, COLOR_MAGENTA, COLOR_CYAN_ICE];

  for (let i = 0; i < armsCount; i++) {
    const armIndex = i % 3;
    const armOffset = (armIndex * Math.PI * 2) / 3;
    const r = 0.65 + Math.pow(Math.random(), 0.9) * 2.85;
    const spiralAngle = 3.2 * Math.log(r / 0.65) + armOffset;
    const dispersion = (Math.random() - 0.5) * (0.28 + 0.12 * r);
    const theta = spiralAngle + dispersion;

    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const y = (Math.random() - 0.5) * 0.18 * Math.max(0.1, 1.0 - r / 3.8);

    positions[pIdx * 3] = x;
    positions[pIdx * 3 + 1] = y;
    positions[pIdx * 3 + 2] = z;

    let c = armColors[armIndex];
    if (Math.random() < 0.2) {
      c = lerpColor(c, COLOR_WHITE, 0.4);
    }

    colors[pIdx * 3] = c[0];
    colors[pIdx * 3 + 1] = c[1];
    colors[pIdx * 3 + 2] = c[2];
    pIdx++;
  }

  return { positions, colors };
}

function generateStarfield(count) {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const radius = 18.0 + Math.random() * 10.0;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2.0 * Math.random() - 1.0);

    const x = radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.sin(phi) * Math.sin(theta);
    const z = radius * Math.cos(phi);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    let c = COLOR_WHITE;
    const rand = Math.random();
    if (rand < 0.25) {
      c = COLOR_BLUE_LIGHT;
    } else if (rand < 0.45) {
      c = COLOR_GOLD;
    }

    colors[i * 3] = c[0] * (0.6 + 0.4 * Math.random());
    colors[i * 3 + 1] = c[1] * (0.6 + 0.4 * Math.random());
    colors[i * 3 + 2] = c[2] * (0.6 + 0.4 * Math.random());
  }

  return { positions, colors };
}

/**
 * CosmicBackground
 * GPU-Accelerated WebGL Cosmic Particle Engine with Thinking / Loading Morphing States
 */
export function CosmicBackground({
  isLoading = false,
  loadingStage = 0,
  hasResults = false,
  theme = 'dark'
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    isLoading,
    loadingStage,
    hasResults,
    theme,
    currentProgress: 0,
  });

  useEffect(() => {
    stateRef.current.isLoading = isLoading;
    stateRef.current.loadingStage = loadingStage;
    stateRef.current.hasResults = hasResults;
    stateRef.current.theme = theme;
  }, [isLoading, loadingStage, hasResults, theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const COUNT = 8000;
    const STAR_COUNT = 2000;

    const torusData = generateTorus(COUNT);
    const vortexData = generateBlackHoleVortex(COUNT);
    const columnData = generateParticleColumn(COUNT);
    const waveBaseData = generateWaveTerrainBase(COUNT);
    const galaxyData = generateSpiralGalaxy(COUNT);
    const starsData = generateStarfield(STAR_COUNT);
    const particleTexture = createParticleTexture();

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.035);

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
    } catch (err) {
      console.warn('WebGL is unavailable in this environment:', err);
      return;
    }
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const particleGroup = new THREE.Group();
    scene.add(particleGroup);

    const mainGeometry = new THREE.BufferGeometry();
    const currentPositions = new Float32Array(COUNT * 3);
    const currentColors = new Float32Array(COUNT * 3);

    currentPositions.set(torusData.positions);
    currentColors.set(torusData.colors);

    mainGeometry.setAttribute('position', new THREE.BufferAttribute(currentPositions, 3));
    mainGeometry.setAttribute('color', new THREE.BufferAttribute(currentColors, 3));

    // 1. Core Points
    const coreMaterial = new THREE.PointsMaterial({
      size: 0.026,
      vertexColors: true,
      transparent: true,
      opacity: 0.94,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: particleTexture
    });
    const corePoints = new THREE.Points(mainGeometry, coreMaterial);
    particleGroup.add(corePoints);

    // 2. Glow Points (Halo)
    const glowMaterial = new THREE.PointsMaterial({
      size: 0.078,
      vertexColors: true,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: particleTexture
    });
    const glowPoints = new THREE.Points(mainGeometry, glowMaterial);
    particleGroup.add(glowPoints);

    // 3. Background Starfield
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starsData.positions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starsData.colors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 0.022,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      map: particleTexture
    });
    const starPoints = new THREE.Points(starGeometry, starMaterial);
    scene.add(starPoints);

    // Mouse Tracking
    const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      mouse.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.targetY = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Scroll Tracking
    let scrollProgress = 0;
    const handleScroll = () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollProgress = Math.max(0, Math.min(2.0, (scrollY / maxScroll) * 2.0));
    };
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    };
    window.addEventListener('resize', handleResize);

    const tempPos = [0, 0, 0];
    const tempCol = [0, 0, 0];

    function evaluateParticle(i, p, time, outPos, outCol, energyBoost = 0) {
      const idx = i * 3;

      if (p <= 0.20) {
        outPos[0] = torusData.positions[idx];
        outPos[1] = torusData.positions[idx + 1];
        outPos[2] = torusData.positions[idx + 2];

        outCol[0] = torusData.colors[idx];
        outCol[1] = torusData.colors[idx + 1];
        outCol[2] = torusData.colors[idx + 2];
      } else if (p <= 0.50) {
        const t = (p - 0.20) / 0.30;
        const s = t * t * (3 - 2 * t);
        outPos[0] = torusData.positions[idx] + (vortexData.positions[idx] - torusData.positions[idx]) * s;
        outPos[1] = torusData.positions[idx + 1] + (vortexData.positions[idx + 1] - torusData.positions[idx + 1]) * s;
        outPos[2] = torusData.positions[idx + 2] + (vortexData.positions[idx + 2] - torusData.positions[idx + 2]) * s;

        outCol[0] = torusData.colors[idx] + (vortexData.colors[idx] - torusData.colors[idx]) * s;
        outCol[1] = torusData.colors[idx + 1] + (vortexData.colors[idx + 1] - torusData.colors[idx + 1]) * s;
        outCol[2] = torusData.colors[idx + 2] + (vortexData.colors[idx + 2] - torusData.colors[idx + 2]) * s;
      } else if (p <= 0.78) {
        const t = (p - 0.50) / 0.28;
        const s = t * t * (3 - 2 * t);
        outPos[0] = vortexData.positions[idx] + (columnData.positions[idx] - vortexData.positions[idx]) * s;
        outPos[1] = vortexData.positions[idx + 1] + (columnData.positions[idx + 1] - vortexData.positions[idx + 1]) * s;
        outPos[2] = vortexData.positions[idx + 2] + (columnData.positions[idx + 2] - vortexData.positions[idx + 2]) * s;

        outCol[0] = vortexData.colors[idx] + (columnData.colors[idx] - vortexData.colors[idx]) * s;
        outCol[1] = vortexData.colors[idx + 1] + (columnData.colors[idx + 1] - vortexData.colors[idx + 1]) * s;
        outCol[2] = vortexData.colors[idx + 2] + (columnData.colors[idx + 2] - vortexData.colors[idx + 2]) * s;
      } else if (p <= 0.95) {
        const t = (p - 0.78) / 0.17;
        const s = t * t * (3 - 2 * t);

        const wx = waveBaseData.positions[idx];
        const wz = waveBaseData.positions[idx + 2];
        const waveY = (
          0.34 * Math.sin(1.8 * wx + time * 1.5) * Math.cos(2.0 * wz + time * 1.2) +
          0.16 * Math.sin(2.4 * (wx - wz) + time * 1.9) +
          0.10 * Math.cos(3.0 * wx + time * 1.3)
        );

        outPos[0] = columnData.positions[idx] + (wx - columnData.positions[idx]) * s;
        outPos[1] = columnData.positions[idx + 1] + (waveY - columnData.positions[idx + 1]) * s;
        outPos[2] = columnData.positions[idx + 2] + (wz - columnData.positions[idx + 2]) * s;

        outCol[0] = columnData.colors[idx] + (waveBaseData.colors[idx] - columnData.colors[idx]) * s;
        outCol[1] = columnData.colors[idx + 1] + (waveBaseData.colors[idx + 1] - columnData.colors[idx + 1]) * s;
        outCol[2] = columnData.colors[idx + 2] + (waveBaseData.colors[idx + 2] - columnData.colors[idx + 2]) * s;
      } else if (p <= 1.25) {
        const wx = waveBaseData.positions[idx];
        const wz = waveBaseData.positions[idx + 2];
        const waveY = (
          0.34 * Math.sin(1.8 * wx + time * 1.5) * Math.cos(2.0 * wz + time * 1.2) +
          0.16 * Math.sin(2.4 * (wx - wz) + time * 1.9) +
          0.10 * Math.cos(3.0 * wx + time * 1.3)
        );

        outPos[0] = wx;
        outPos[1] = waveY;
        outPos[2] = wz;

        outCol[0] = waveBaseData.colors[idx];
        outCol[1] = waveBaseData.colors[idx + 1];
        outCol[2] = waveBaseData.colors[idx + 2];
      } else if (p <= 1.80) {
        const t = (p - 1.25) / 0.55;
        const s = t * t * (3 - 2 * t);

        const wx = waveBaseData.positions[idx];
        const wz = waveBaseData.positions[idx + 2];
        const waveY = (
          0.34 * Math.sin(1.8 * wx + time * 1.5) * Math.cos(2.0 * wz + time * 1.2) +
          0.16 * Math.sin(2.4 * (wx - wz) + time * 1.9) +
          0.10 * Math.cos(3.0 * wx + time * 1.3)
        ) * (1.0 - s);

        const gx = galaxyData.positions[idx];
        const gy = galaxyData.positions[idx + 1];
        const gz = galaxyData.positions[idx + 2];

        outPos[0] = wx + (gx - wx) * s;
        outPos[1] = waveY + (gy - waveY) * s;
        outPos[2] = wz + (gz - wz) * s;

        outCol[0] = waveBaseData.colors[idx] + (galaxyData.colors[idx] - waveBaseData.colors[idx]) * s;
        outCol[1] = waveBaseData.colors[idx + 1] + (galaxyData.colors[idx + 1] - waveBaseData.colors[idx + 1]) * s;
        outCol[2] = waveBaseData.colors[idx + 2] + (galaxyData.colors[idx + 2] - waveBaseData.colors[idx + 2]) * s;
      } else {
        outPos[0] = galaxyData.positions[idx];
        outPos[1] = galaxyData.positions[idx + 1];
        outPos[2] = galaxyData.positions[idx + 2];

        outCol[0] = galaxyData.colors[idx];
        outCol[1] = galaxyData.colors[idx + 1];
        outCol[2] = galaxyData.colors[idx + 2];
      }

      if (energyBoost > 0) {
        const pulse = 1.0 + Math.sin(time * 6.0 + i * 0.05) * 0.08 * energyBoost;
        outPos[0] *= pulse;
        outPos[1] *= pulse;
        outPos[2] *= pulse;

        if ((i + Math.floor(time * 20)) % 17 === 0) {
          outCol[0] = Math.min(1.0, outCol[0] + 0.3 * energyBoost);
          outCol[1] = Math.min(1.0, outCol[1] + 0.3 * energyBoost);
          outCol[2] = Math.min(1.0, outCol[2] + 0.3 * energyBoost);
        }
      }
    }

    const clock = new THREE.Clock();
    let animId = null;
    let currentRotationY = 0;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const { isLoading: activeLoading, loadingStage: currentStage, hasResults: isLoaded } = stateRef.current;

      let desiredProgress = 0;
      let spinSpeed = 0.12;
      let energyIntensity = 0;

      if (activeLoading) {
        const stageFactor = Math.min(4, Math.max(1, currentStage || 1)) / 4;
        desiredProgress = 0.45 + 0.25 * stageFactor;
        spinSpeed = 0.45 + 0.85 * stageFactor;
        energyIntensity = 0.6 + 0.6 * stageFactor;
      } else if (isLoaded) {
        desiredProgress = Math.max(1.0, scrollProgress > 0.1 ? scrollProgress : 1.08);
        spinSpeed = 0.08;
      } else {
        desiredProgress = Math.min(0.2, scrollProgress * 0.3);
        spinSpeed = 0.12;
      }

      stateRef.current.currentProgress += (desiredProgress - stateRef.current.currentProgress) * 0.06;
      const p = stateRef.current.currentProgress;

      mouse.x += (mouse.targetX - mouse.x) * 0.05;
      mouse.y += (mouse.targetY - mouse.y) * 0.05;
      camera.position.x = mouse.x * 0.35;
      camera.position.y = mouse.y * 0.25;
      camera.lookAt(0, 0, 0);

      currentRotationY += spinSpeed * 0.016;
      particleGroup.rotation.y = currentRotationY;

      let targetRotX = 0.25;
      let targetRotZ = -0.1;

      if (p > 0.8) {
        const waveFactor = Math.min(1.0, (p - 0.8) / 0.4);
        targetRotX = THREE.MathUtils.lerp(0.25, 0.78, waveFactor);
        targetRotZ = THREE.MathUtils.lerp(-0.1, 0.0, waveFactor);
      } else if (activeLoading) {
        targetRotX = 0.45;
        targetRotZ = -0.05;
      }

      particleGroup.rotation.x += (targetRotX - particleGroup.rotation.x) * 0.05;
      particleGroup.rotation.z += (targetRotZ - particleGroup.rotation.z) * 0.05;

      const posAttr = mainGeometry.attributes.position;
      const colAttr = mainGeometry.attributes.color;
      const posArr = posAttr.array;
      const colArr = colAttr.array;

      for (let i = 0; i < COUNT; i++) {
        evaluateParticle(i, p, elapsedTime, tempPos, tempCol, energyIntensity);
        const idx = i * 3;
        posArr[idx] = tempPos[0];
        posArr[idx + 1] = tempPos[1];
        posArr[idx + 2] = tempPos[2];

        colArr[idx] = tempCol[0];
        colArr[idx + 1] = tempCol[1];
        colArr[idx + 2] = tempCol[2];
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      starPoints.rotation.y = elapsedTime * 0.02;
      starPoints.rotation.x = Math.sin(elapsedTime * 0.015) * 0.05;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animId) cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);

      mainGeometry.dispose();
      starGeometry.dispose();
      coreMaterial.dispose();
      glowMaterial.dispose();
      starMaterial.dispose();
      particleTexture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: '#000000',
      }}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
