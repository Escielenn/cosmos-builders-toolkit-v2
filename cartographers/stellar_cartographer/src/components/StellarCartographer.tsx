// Stellar Cartographer - Main Component
// StellarForge.tools
// Interactive galaxy mapping tool for SF worldbuilders

'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Star,
  ScreenStar,
  BackgroundStar,
  Empire,
  TradeRoute,
  Wormhole,
  GalaxyConfig,
  ViewConfig,
  DisplayConfig,
  CameraState,
  SpectralClass,
  Position,
  ProjectedPoint,
} from './types';
import { SeededRandom } from './utils/seededRandom';
import { STAR_TYPES, assignStarType, isHotStar } from './utils/starTypes';
import { generateName, generateDesignation } from './utils/nameGenerator';
import { hexToRgba, shiftHue } from './utils/colorUtils';
import {
  GALAXY_RADIUS,
  DEFAULT_CONFIG,
  DEFAULT_VIEW,
  DEFAULT_DISPLAY,
  DEFAULT_CAMERA,
  DEFAULT_EMPIRES,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_IN_FACTOR,
  ZOOM_OUT_FACTOR,
  CAMERA_SMOOTHING,
  LABEL_ZOOM_THRESHOLD,
  MAX_LABELS,
  LABEL_COLLISION_DISTANCE,
  BACKGROUND_STAR_COUNT,
  PARALLAX_FACTOR,
  ROUTE_COLORS,
  WORMHOLE_COLORS,
  AUTO_ROUTE_COUNT,
  AUTO_ROUTE_MAX_HOPS,
  AUTO_ROUTE_MIN_HOPS,
  AUTO_ROUTE_MAX_REACH,
  AUTO_WORMHOLE_COUNT,
  AUTO_WORMHOLE_MIN_DISTANCE,
  WORMHOLE_STABLE_CHANCE,
  PERSPECTIVE_DISTANCE,
  Z_OFFSET,
  DEPTH_SCALE_FACTOR,
  STAR_SIZE_ZOOM_EXPONENT,
  STAR_SIZE_MULTIPLIER,
  MIN_STAR_SIZE,
  DEPTH_FADE_DISTANCE,
  MIN_DEPTH_FADE,
  CLICK_DETECTION_RADIUS,
  AUTO_ROTATE_SPEED,
} from './constants';

// Styles following SIMULATOR_AESTHETIC.md
import styles from './StellarCartographer.module.css';

const StellarCartographer: React.FC = () => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const camStartRef = useRef({ x: 0, y: 0 });

  // State
  const [galaxyName, setGalaxyName] = useState('Unnamed Galaxy');
  const [config, setConfig] = useState<GalaxyConfig>(DEFAULT_CONFIG);
  const [view, setView] = useState<ViewConfig>(DEFAULT_VIEW);
  const [display, setDisplay] = useState<DisplayConfig>(DEFAULT_DISPLAY);
  const [camera, setCamera] = useState<CameraState>(DEFAULT_CAMERA);
  const [targetCamera, setTargetCamera] = useState<CameraState>(DEFAULT_CAMERA);
  const [stars, setStars] = useState<Star[]>([]);
  const [backgroundStars, setBackgroundStars] = useState<BackgroundStar[]>([]);
  const [empires, setEmpires] = useState<Empire[]>(DEFAULT_EMPIRES);
  const [tradeRoutes, setTradeRoutes] = useState<TradeRoute[]>([]);
  const [wormholes, setWormholes] = useState<Wormhole[]>([]);
  const [selectedStar, setSelectedStar] = useState<Star | null>(null);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [routeDrawing, setRouteDrawing] = useState({ active: false, stars: [] as Star[] });
  const [wormholeDrawing, setWormholeDrawing] = useState({ active: false, firstStar: null as Star | null });
  const [nextRouteId, setNextRouteId] = useState(1);
  const [nextWormholeId, setNextWormholeId] = useState(1);
  const [statusText, setStatusText] = useState('Mapping');

  // ═══════════════════════════════════════════════════════════════════════════
  // 3D PROJECTION
  // ═══════════════════════════════════════════════════════════════════════════
  const project3D = useCallback((x: number, y: number, z: number): ProjectedPoint => {
    const rotRad = view.rotation * Math.PI / 180;
    const tiltRad = view.tilt * Math.PI / 180;

    // Rotate around Z axis (yaw)
    let rx = x * Math.cos(rotRad) - y * Math.sin(rotRad);
    let ry = x * Math.sin(rotRad) + y * Math.cos(rotRad);
    let rz = z;

    // Tilt around X axis (pitch)
    const ty = ry * Math.cos(tiltRad) - rz * Math.sin(tiltRad);
    const tz = ry * Math.sin(tiltRad) + rz * Math.cos(tiltRad);

    // Perspective
    const zOffset = tz + Z_OFFSET;
    const scale = PERSPECTIVE_DISTANCE / (PERSPECTIVE_DISTANCE + zOffset * DEPTH_SCALE_FACTOR);

    return { x: rx * scale, y: ty * scale, z: tz, scale: Math.max(0.1, scale) };
  }, [view.rotation, view.tilt]);

  const worldToScreen = useCallback((wx: number, wy: number, wz: number = 0): ProjectedPoint & { screenX: number; screenY: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, z: 0, scale: 1, screenX: 0, screenY: 0 };

    const projected = project3D(wx, wy, wz);
    return {
      ...projected,
      screenX: (projected.x - camera.x) * camera.zoom + canvas.width / 2,
      screenY: (projected.y - camera.y) * camera.zoom + canvas.height / 2
    };
  }, [project3D, camera]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GALAXY GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  const findOwningEmpire = useCallback((x: number, y: number): Empire | null => {
    let closest: Empire | null = null;
    let minDist = Infinity;
    
    for (const empire of empires) {
      const dist = Math.sqrt((x - empire.centerX) ** 2 + (y - empire.centerY) ** 2);
      if (dist < empire.radius && dist < minDist) {
        minDist = dist;
        closest = empire;
      }
    }
    return closest;
  }, [empires]);

  const generateStarPosition = useCallback((rng: SeededRandom): Position => {
    switch (config.type) {
      case 'elliptical': return generateElliptical(rng);
      case 'irregular': return generateIrregular(rng);
      case 'barred': return generateBarredSpiral(rng);
      default: return generateSpiral(rng);
    }
  }, [config.type, config.armCount, config.armSpread]);

  const generateSpiral = (rng: SeededRandom): Position => {
    // Core stars (15%)
    if (rng.next() < 0.15) {
      const r = Math.abs(rng.gaussian()) * GALAXY_RADIUS * 0.12;
      const angle = rng.next() * Math.PI * 2;
      return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, z: rng.gaussian() * 8 };
    }

    // Arm stars
    const armIndex = rng.int(0, config.armCount - 1);
    const armOffset = (armIndex / config.armCount) * Math.PI * 2;
    const t = rng.next();
    const distFromCenter = GALAXY_RADIUS * 0.08 + Math.pow(t, 0.7) * GALAXY_RADIUS * 0.92;

    // Logarithmic spiral
    const spiralTightness = 0.4;
    const spiralAngle = armOffset + Math.log(distFromCenter / 20 + 1) * spiralTightness * Math.PI * 2;

    // Organic scatter
    const scatter = rng.gaussian() * (15 + distFromCenter * config.armSpread);
    const angleScatter = rng.gaussian() * config.armSpread * 0.5;
    const finalAngle = spiralAngle + angleScatter;

    return {
      x: Math.cos(finalAngle) * distFromCenter + scatter * 0.5,
      y: Math.sin(finalAngle) * distFromCenter + scatter * 0.5,
      z: rng.gaussian() * (5 + distFromCenter * 0.02)
    };
  };

  const generateBarredSpiral = (rng: SeededRandom): Position => {
    // Bar region (20%)
    if (rng.next() < 0.2) {
      const barLength = GALAXY_RADIUS * 0.3;
      const barWidth = 25;
      const side = rng.next() < 0.5 ? 1 : -1;
      const alongBar = rng.range(-barLength, barLength);
      const acrossBar = rng.gaussian() * barWidth;
      const barAngle = 0.2;
      return {
        x: alongBar * Math.cos(barAngle) * side - acrossBar * Math.sin(barAngle),
        y: alongBar * Math.sin(barAngle) * side + acrossBar * Math.cos(barAngle),
        z: rng.gaussian() * 6
      };
    }

    // Arms from bar ends
    const armIndex = rng.int(0, config.armCount - 1);
    const armOffset = (armIndex / config.armCount) * Math.PI * 2;
    const t = rng.next();
    const distFromCenter = GALAXY_RADIUS * 0.25 + Math.pow(t, 0.7) * GALAXY_RADIUS * 0.75;
    const spiralTightness = 0.35;
    const spiralAngle = armOffset + Math.log(distFromCenter / 30 + 1) * spiralTightness * Math.PI * 2;
    const scatter = rng.gaussian() * (12 + distFromCenter * config.armSpread);
    const angleScatter = rng.gaussian() * config.armSpread * 0.4;
    const finalAngle = spiralAngle + angleScatter;

    return {
      x: Math.cos(finalAngle) * distFromCenter + scatter * 0.5,
      y: Math.sin(finalAngle) * distFromCenter + scatter * 0.5,
      z: rng.gaussian() * (5 + distFromCenter * 0.02)
    };
  };

  const generateElliptical = (rng: SeededRandom): Position => {
    const r = Math.abs(rng.gaussian()) * GALAXY_RADIUS * 0.6;
    const angle = rng.next() * Math.PI * 2;
    const flatness = 0.65;
    return {
      x: Math.cos(angle) * r,
      y: Math.sin(angle) * r * flatness,
      z: rng.gaussian() * GALAXY_RADIUS * 0.3
    };
  };

  const generateIrregular = (rng: SeededRandom): Position => {
    const clusterCount = 5;
    const cluster = rng.int(0, clusterCount - 1);
    const clusterRng = new SeededRandom(config.seed + cluster * 100);
    const clusterX = clusterRng.range(-GALAXY_RADIUS * 0.5, GALAXY_RADIUS * 0.5);
    const clusterY = clusterRng.range(-GALAXY_RADIUS * 0.5, GALAXY_RADIUS * 0.5);
    const clusterZ = clusterRng.range(-50, 50);
    const spread = clusterRng.range(60, 150);

    return {
      x: clusterX + rng.gaussian() * spread,
      y: clusterY + rng.gaussian() * spread,
      z: clusterZ + rng.gaussian() * 20
    };
  };

  const generateGalaxy = useCallback(() => {
    const rng = new SeededRandom(config.seed);
    const newStars: Star[] = [];

    for (let i = 0; i < config.starCount; i++) {
      const pos = generateStarPosition(rng);
      const type = assignStarType(rng.next());
      const typeData = STAR_TYPES[type];
      const empire = findOwningEmpire(pos.x, pos.y);

      const nameRng = new SeededRandom(config.seed * 1000 + i);
      const name = empire 
        ? generateName(empire.namingStyle, nameRng)
        : generateDesignation(config.seed, i);

      const luminosity = rng.range(typeData.luminosity[0], typeData.luminosity[1]);
      const brightness = rng.range(0.6, 1.0);
      const sizeVariation = rng.range(0.8, 1.2);
      const colorShift = rng.range(-15, 15);
      const hasHabitable = rng.next() < typeData.habitable;

      let priority = 0;
      if (hasHabitable) priority += 100;
      if (type === 'O') priority += 60;
      else if (type === 'B') priority += 45;
      else if (type === 'A') priority += 30;
      priority += rng.range(0, 15);

      newStars.push({
        id: i,
        x: pos.x,
        y: pos.y,
        z: pos.z,
        type,
        baseColor: typeData.color,
        color: shiftHue(typeData.color, colorShift),
        size: typeData.size * sizeVariation,
        brightness,
        luminosity,
        name,
        empire,
        hasHabitable,
        labelPriority: priority
      });
    }

    newStars.sort((a, b) => b.labelPriority - a.labelPriority);

    // Generate background stars
    const newBackgroundStars: BackgroundStar[] = [];
    for (let i = 0; i < BACKGROUND_STAR_COUNT; i++) {
      newBackgroundStars.push({
        x: rng.range(-2500, 2500),
        y: rng.range(-2500, 2500),
        size: rng.range(0.4, 1.2),
        brightness: rng.range(0.03, 0.2)
      });
    }

    setStars(newStars);
    setBackgroundStars(newBackgroundStars);
    setSelectedStar(null);
    setStatusText('Mapped');
  }, [config, findOwningEmpire, generateStarPosition]);

  // Generate galaxy on mount and config change
  useEffect(() => {
    generateGalaxy();
  }, [config.seed, config.starCount, config.type, config.armCount, config.armSpread]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TRADE ROUTE & WORMHOLE GENERATION
  // ═══════════════════════════════════════════════════════════════════════════
  const autoGenerateRoutes = useCallback(() => {
    const rng = new SeededRandom(Date.now());
    const notableStars = stars.filter(s => s.hasHabitable || ['O', 'B', 'A'].includes(s.type));
    if (notableStars.length < 2) return;

    const newRoutes: TradeRoute[] = [...tradeRoutes];
    let routeId = nextRouteId;

    for (let i = 0; i < AUTO_ROUTE_COUNT; i++) {
      const sortedByDist = [...notableStars].sort((a, b) => {
        const distA = Math.sqrt(a.x * a.x + a.y * a.y);
        const distB = Math.sqrt(b.x * b.x + b.y * b.y);
        return distB - distA;
      });

      const startPool = sortedByDist.slice(0, Math.floor(sortedByDist.length / 3));
      const start = rng.pick(startPool);
      const routeStars: Star[] = [start];
      let current = start;

      const maxHops = rng.int(AUTO_ROUTE_MIN_HOPS, AUTO_ROUTE_MAX_HOPS);

      for (let hop = 0; hop < maxHops; hop++) {
        const candidates = notableStars
          .filter(s => !routeStars.includes(s))
          .map(s => ({
            star: s,
            dist: Math.sqrt((s.x - current.x) ** 2 + (s.y - current.y) ** 2)
          }))
          .filter(c => c.dist < AUTO_ROUTE_MAX_REACH && c.dist > 50)
          .sort((a, b) => a.dist - b.dist);

        if (candidates.length === 0) break;

        const pickPool = candidates.slice(0, Math.max(3, Math.floor(candidates.length / 3)));
        const pick = rng.pick(pickPool);
        routeStars.push(pick.star);
        current = pick.star;
      }

      if (routeStars.length >= 3) {
        newRoutes.push({
          id: routeId++,
          name: `Trade Lane ${newRoutes.length + 1}`,
          color: ROUTE_COLORS[newRoutes.length % ROUTE_COLORS.length],
          stars: routeStars
        });
      }
    }

    setTradeRoutes(newRoutes);
    setNextRouteId(routeId);
  }, [stars, tradeRoutes, nextRouteId]);

  const autoGenerateWormholes = useCallback(() => {
    const rng = new SeededRandom(Date.now() + 500);
    const notable = stars.filter(s => s.hasHabitable || ['O', 'B'].includes(s.type));
    if (notable.length < 2) return;

    const newWormholes: Wormhole[] = [...wormholes];
    let wormholeId = nextWormholeId;

    for (let i = 0; i < AUTO_WORMHOLE_COUNT; i++) {
      let attempts = 0;
      let starA: Star | null = null;
      let starB: Star | null = null;

      while (attempts < 30) {
        const a = rng.pick(notable);
        const b = rng.pick(notable);
        if (a.id === b.id) { attempts++; continue; }

        const dist = Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
        if (dist > AUTO_WORMHOLE_MIN_DISTANCE) {
          const exists = newWormholes.some(w =>
            (w.starA.id === a.id && w.starB.id === b.id) ||
            (w.starA.id === b.id && w.starB.id === a.id)
          );
          if (!exists) { starA = a; starB = b; break; }
        }
        attempts++;
      }

      if (starA && starB) {
        newWormholes.push({
          id: wormholeId++,
          name: `Wormhole ${newWormholes.length + 1}`,
          starA,
          starB,
          color: WORMHOLE_COLORS[newWormholes.length % WORMHOLE_COLORS.length],
          stable: rng.next() < WORMHOLE_STABLE_CHANCE
        });
      }
    }

    setWormholes(newWormholes);
    setNextWormholeId(wormholeId);
  }, [stars, wormholes, nextWormholeId]);

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDERING
  // ═══════════════════════════════════════════════════════════════════════════
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const zoom = camera.zoom;

    // Deep space background
    ctx.fillStyle = '#050508';
    ctx.fillRect(0, 0, w, h);

    // Background stars (parallax)
    for (const star of backgroundStars) {
      const sx = (star.x - camera.x * PARALLAX_FACTOR) * 0.4 + w / 2;
      const sy = (star.y - camera.y * PARALLAX_FACTOR) * 0.4 + h / 2;
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Empire territories
    if (display.showTerritories) {
      const opacity = display.territoryOpacity / 100;
      
      for (const empire of empires) {
        const center = worldToScreen(empire.centerX, empire.centerY, 0);
        const radius = empire.radius * zoom * center.scale;

        if (display.territoryBorderStyle === 'soft') {
          // Outer glow
          const outerGlow = ctx.createRadialGradient(center.screenX, center.screenY, radius * 0.3, center.screenX, center.screenY, radius * 1.4);
          outerGlow.addColorStop(0, hexToRgba(empire.color, 0));
          outerGlow.addColorStop(0.5, hexToRgba(empire.color, 0.06 * opacity));
          outerGlow.addColorStop(0.8, hexToRgba(empire.color, 0.03 * opacity));
          outerGlow.addColorStop(1, hexToRgba(empire.color, 0));
          ctx.fillStyle = outerGlow;
          ctx.beginPath();
          ctx.arc(center.screenX, center.screenY, radius * 1.4, 0, Math.PI * 2);
          ctx.fill();

          // Main gradient
          const gradient = ctx.createRadialGradient(center.screenX, center.screenY, 0, center.screenX, center.screenY, radius);
          gradient.addColorStop(0, hexToRgba(empire.color, 0.18 * opacity));
          gradient.addColorStop(0.4, hexToRgba(empire.color, 0.12 * opacity));
          gradient.addColorStop(0.7, hexToRgba(empire.color, 0.06 * opacity));
          gradient.addColorStop(1, hexToRgba(empire.color, 0));
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(center.screenX, center.screenY, radius, 0, Math.PI * 2);
          ctx.fill();

          // Dashed border
          ctx.strokeStyle = hexToRgba(empire.color, 0.12 * opacity);
          ctx.lineWidth = 1;
          ctx.setLineDash([8, 8]);
          ctx.beginPath();
          ctx.arc(center.screenX, center.screenY, radius * 0.95, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

        } else if (display.territoryBorderStyle === 'sharp') {
          ctx.fillStyle = hexToRgba(empire.color, 0.12 * opacity);
          ctx.beginPath();
          ctx.arc(center.screenX, center.screenY, radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = hexToRgba(empire.color, 0.6 * opacity);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(center.screenX, center.screenY, radius, 0, Math.PI * 2);
          ctx.stroke();

          const innerGlow = ctx.createRadialGradient(center.screenX, center.screenY, radius * 0.7, center.screenX, center.screenY, radius);
          innerGlow.addColorStop(0, hexToRgba(empire.color, 0));
          innerGlow.addColorStop(1, hexToRgba(empire.color, 0.15 * opacity));
          ctx.fillStyle = innerGlow;
          ctx.beginPath();
          ctx.arc(center.screenX, center.screenY, radius, 0, Math.PI * 2);
          ctx.fill();

        } else {
          const gradient = ctx.createRadialGradient(center.screenX, center.screenY, 0, center.screenX, center.screenY, radius);
          gradient.addColorStop(0, hexToRgba(empire.color, 0.15 * opacity));
          gradient.addColorStop(0.6, hexToRgba(empire.color, 0.08 * opacity));
          gradient.addColorStop(1, hexToRgba(empire.color, 0.02 * opacity));
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(center.screenX, center.screenY, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Trade routes
    if (display.showRoutes) {
      for (const route of tradeRoutes) {
        if (route.stars.length < 2) continue;

        // Glow
        ctx.strokeStyle = hexToRgba(route.color, 0.25);
        ctx.lineWidth = zoom < 1 ? 3 : 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.beginPath();
        route.stars.forEach((star, i) => {
          const s = worldToScreen(star.x, star.y, star.z);
          i === 0 ? ctx.moveTo(s.screenX, s.screenY) : ctx.lineTo(s.screenX, s.screenY);
        });
        ctx.stroke();

        // Main line
        ctx.strokeStyle = hexToRgba(route.color, 0.7);
        ctx.lineWidth = zoom < 1 ? 1.5 : 2.5;
        ctx.setLineDash(zoom < 1 ? [] : [10, 6]);
        ctx.beginPath();
        route.stars.forEach((star, i) => {
          const s = worldToScreen(star.x, star.y, star.z);
          i === 0 ? ctx.moveTo(s.screenX, s.screenY) : ctx.lineTo(s.screenX, s.screenY);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Waypoints
        if (zoom > 0.8) {
          route.stars.forEach((star) => {
            const s = worldToScreen(star.x, star.y, star.z);
            const markerSize = zoom < 1.5 ? 3 : 4;
            ctx.strokeStyle = route.color;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(s.screenX, s.screenY, markerSize + 2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = route.color;
            ctx.beginPath();
            ctx.arc(s.screenX, s.screenY, markerSize, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      }

      // Current route drawing
      if (routeDrawing.active && routeDrawing.stars.length > 0) {
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        routeDrawing.stars.forEach((star, i) => {
          const s = worldToScreen(star.x, star.y, star.z);
          i === 0 ? ctx.moveTo(s.screenX, s.screenY) : ctx.lineTo(s.screenX, s.screenY);
        });
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Wormholes
      const time = Date.now() / 1000;
      for (const wh of wormholes) {
        const sA = worldToScreen(wh.starA.x, wh.starA.y, wh.starA.z);
        const sB = worldToScreen(wh.starB.x, wh.starB.y, wh.starB.z);

        const midX = (sA.screenX + sB.screenX) / 2;
        const midY = (sA.screenY + sB.screenY) / 2;
        const dist = Math.sqrt((sB.screenX - sA.screenX) ** 2 + (sB.screenY - sA.screenY) ** 2);
        const dx = sB.screenX - sA.screenX;
        const dy = sB.screenY - sA.screenY;
        const perpX = -dy / dist * (dist * 0.15);
        const perpY = dx / dist * (dist * 0.15);
        const ctrlX = midX + perpX;
        const ctrlY = midY + perpY;

        // Connection line
        ctx.strokeStyle = hexToRgba(wh.color, wh.stable ? 0.4 : 0.3);
        ctx.lineWidth = zoom < 1 ? 2 : 3;
        ctx.setLineDash(wh.stable ? [2, 8] : [1, 4]);
        ctx.beginPath();
        ctx.moveTo(sA.screenX, sA.screenY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, sB.screenX, sB.screenY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glow
        ctx.strokeStyle = hexToRgba(wh.color, 0.15);
        ctx.lineWidth = zoom < 1 ? 6 : 10;
        ctx.beginPath();
        ctx.moveTo(sA.screenX, sA.screenY);
        ctx.quadraticCurveTo(ctrlX, ctrlY, sB.screenX, sB.screenY);
        ctx.stroke();

        // Portal endpoints
        [sA, sB].forEach((s, idx) => {
          const portalSize = zoom < 1 ? 8 : 12;
          const pulsePhase = time * (wh.stable ? 1.5 : 4) + idx * Math.PI;
          const pulse = wh.stable ? 1 + Math.sin(pulsePhase) * 0.15 : 1 + Math.sin(pulsePhase) * 0.3;

          // Outer glow
          const outerGlow = ctx.createRadialGradient(s.screenX, s.screenY, portalSize * 0.5, s.screenX, s.screenY, portalSize * 2.5 * pulse);
          outerGlow.addColorStop(0, hexToRgba(wh.color, 0.3));
          outerGlow.addColorStop(0.5, hexToRgba(wh.color, 0.1));
          outerGlow.addColorStop(1, hexToRgba(wh.color, 0));
          ctx.fillStyle = outerGlow;
          ctx.beginPath();
          ctx.arc(s.screenX, s.screenY, portalSize * 2.5 * pulse, 0, Math.PI * 2);
          ctx.fill();

          // Concentric rings
          for (let ring = 3; ring >= 1; ring--) {
            const ringRadius = portalSize * (ring / 3) * pulse;
            const ringAlpha = 0.15 + (3 - ring) * 0.15;
            ctx.strokeStyle = hexToRgba(wh.color, ringAlpha);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(s.screenX, s.screenY, ringRadius, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Unstable: spinning spirals / Stable: crosshair
          if (!wh.stable) {
            const spiralArms = 3;
            for (let arm = 0; arm < spiralArms; arm++) {
              const armAngle = (arm / spiralArms) * Math.PI * 2 + time * 2;
              ctx.strokeStyle = hexToRgba(wh.color, 0.5);
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              for (let t = 0; t <= 1; t += 0.1) {
                const r = portalSize * t * pulse;
                const a = armAngle + t * Math.PI * 0.8;
                const px = s.screenX + Math.cos(a) * r;
                const py = s.screenY + Math.sin(a) * r;
                t === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
              }
              ctx.stroke();
            }
          } else {
            ctx.strokeStyle = hexToRgba(wh.color, 0.6);
            ctx.lineWidth = 1.5;
            const crossSize = portalSize * 0.6;
            ctx.beginPath();
            ctx.moveTo(s.screenX - crossSize, s.screenY);
            ctx.lineTo(s.screenX + crossSize, s.screenY);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s.screenX, s.screenY - crossSize);
            ctx.lineTo(s.screenX, s.screenY + crossSize);
            ctx.stroke();
          }

          // Center core
          const coreGrad = ctx.createRadialGradient(s.screenX, s.screenY, 0, s.screenX, s.screenY, portalSize * 0.4);
          coreGrad.addColorStop(0, hexToRgba('#FFFFFF', 0.9));
          coreGrad.addColorStop(0.3, hexToRgba(wh.color, 0.7));
          coreGrad.addColorStop(1, hexToRgba(wh.color, 0));
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(s.screenX, s.screenY, portalSize * 0.4, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      // Wormhole drawing preview
      if (wormholeDrawing.active && wormholeDrawing.firstStar) {
        const s = worldToScreen(wormholeDrawing.firstStar.x, wormholeDrawing.firstStar.y, wormholeDrawing.firstStar.z);
        const portalSize = 12;
        const pulse = 1 + Math.sin(time * 3) * 0.2;

        const outerGlow = ctx.createRadialGradient(s.screenX, s.screenY, portalSize * 0.5, s.screenX, s.screenY, portalSize * 3 * pulse);
        outerGlow.addColorStop(0, hexToRgba('#9B59B6', 0.4));
        outerGlow.addColorStop(0.5, hexToRgba('#9B59B6', 0.15));
        outerGlow.addColorStop(1, hexToRgba('#9B59B6', 0));
        ctx.fillStyle = outerGlow;
        ctx.beginPath();
        ctx.arc(s.screenX, s.screenY, portalSize * 3 * pulse, 0, Math.PI * 2);
        ctx.fill();

        for (let ring = 3; ring >= 1; ring--) {
          const ringRadius = portalSize * (ring / 3) * pulse;
          ctx.strokeStyle = hexToRgba('#9B59B6', 0.3 + (3 - ring) * 0.2);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(s.screenX, s.screenY, ringRadius, time * 2, time * 2 + Math.PI * 1.5);
          ctx.stroke();
        }

        ctx.fillStyle = '#9B59B6';
        ctx.beginPath();
        ctx.arc(s.screenX, s.screenY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Stars - sorted by depth
    const sortedStars: ScreenStar[] = stars.map(star => {
      const projected = worldToScreen(star.x, star.y, star.z);
      return { ...star, screenX: projected.screenX, screenY: projected.screenY, screenZ: projected.z, scale: projected.scale };
    }).sort((a, b) => a.screenZ - b.screenZ);

    for (const star of sortedStars) {
      if (star.screenX < -30 || star.screenX > w + 30 || star.screenY < -30 || star.screenY > h + 30) continue;

      const baseSize = star.size * star.scale;
      const zoomFactor = Math.pow(zoom, STAR_SIZE_ZOOM_EXPONENT);
      const size = Math.max(MIN_STAR_SIZE, baseSize * zoomFactor * STAR_SIZE_MULTIPLIER);
      const depthFade = Math.max(MIN_DEPTH_FADE, Math.min(1, 1 - star.screenZ / DEPTH_FADE_DISTANCE));
      const totalBrightness = star.brightness * star.luminosity * depthFade;

      // Hot star glow
      if (isHotStar(star.type) && zoom > 0.4 && star.luminosity > 0.7) {
        const glowSize = size * (3 + star.luminosity * 3);
        const glowIntensity = 0.15 * star.luminosity * depthFade;
        const glow = ctx.createRadialGradient(star.screenX, star.screenY, size * 0.3, star.screenX, star.screenY, glowSize);
        glow.addColorStop(0, hexToRgba(star.color, glowIntensity));
        glow.addColorStop(0.5, hexToRgba(star.color, glowIntensity * 0.3));
        glow.addColorStop(1, hexToRgba(star.color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(star.screenX, star.screenY, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Secondary glow for very luminous
      if (star.luminosity > 0.8 && zoom > 0.6) {
        const softGlow = ctx.createRadialGradient(star.screenX, star.screenY, 0, star.screenX, star.screenY, size * 2.5);
        softGlow.addColorStop(0, hexToRgba(star.color, 0.2 * star.luminosity * depthFade));
        softGlow.addColorStop(1, hexToRgba(star.color, 0));
        ctx.fillStyle = softGlow;
        ctx.beginPath();
        ctx.arc(star.screenX, star.screenY, size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Star body
      ctx.fillStyle = hexToRgba(star.color, totalBrightness);
      ctx.beginPath();
      ctx.arc(star.screenX, star.screenY, size, 0, Math.PI * 2);
      ctx.fill();

      // Bright core
      if (star.luminosity > 0.6 && size > 1) {
        ctx.fillStyle = hexToRgba('#FFFFFF', totalBrightness * 0.4 * star.luminosity);
        ctx.beginPath();
        ctx.arc(star.screenX, star.screenY, size * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Habitable indicator
      if (star.hasHabitable && zoom > 1.2 && display.showHabitableIndicators) {
        ctx.strokeStyle = hexToRgba('#2ECC71', 0.5 * depthFade);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(star.screenX, star.screenY, size + 3, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Selection indicator
      if (selectedStar && star.id === selectedStar.id) {
        ctx.strokeStyle = '#00D4FF';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(star.screenX, star.screenY, size + 5, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Route node indicator
      if (routeDrawing.stars.find(s => s.id === star.id)) {
        ctx.strokeStyle = '#FFA500';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(star.screenX, star.screenY, size + 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Labels (only at high zoom)
    if (zoom >= LABEL_ZOOM_THRESHOLD) {
      const labeledStars: ScreenStar[] = [];
      const maxLabels = Math.min(MAX_LABELS, Math.floor(zoom * 8));

      // Selected star first
      if (selectedStar) {
        const star = sortedStars.find(s => s.id === selectedStar.id);
        if (star) {
          drawLabel(ctx, star, true);
          labeledStars.push(star);
        }
      }

      // Notable stars
      for (const star of sortedStars) {
        if (labeledStars.length >= maxLabels) break;
        if (labeledStars.find(s => s.id === star.id)) continue;
        if (!star.hasHabitable && !['O', 'B'].includes(star.type)) continue;
        if (star.screenX < 50 || star.screenX > w - 50 || star.screenY < 50 || star.screenY > h - 50) continue;

        let collides = false;
        for (const labeled of labeledStars) {
          const dx = star.screenX - labeled.screenX;
          const dy = star.screenY - labeled.screenY;
          if (Math.sqrt(dx * dx + dy * dy) < LABEL_COLLISION_DISTANCE) {
            collides = true;
            break;
          }
        }

        if (!collides) {
          drawLabel(ctx, star, false);
          labeledStars.push(star);
        }
      }
    }
  }, [
    camera, display, empires, stars, backgroundStars, tradeRoutes, wormholes,
    routeDrawing, wormholeDrawing, selectedStar, worldToScreen
  ]);

  const drawLabel = (ctx: CanvasRenderingContext2D, star: ScreenStar, isSelected: boolean) => {
    const fontSize = isSelected ? 10 : 8;
    ctx.font = `500 ${fontSize}px "Space Grotesk", sans-serif`;
    ctx.textAlign = 'center';

    // Shadow
    ctx.fillStyle = 'rgba(5, 5, 8, 0.85)';
    ctx.fillText(star.name, star.screenX + 1, star.screenY + star.size + 12 + 1);

    // Text
    ctx.fillStyle = isSelected ? '#FFFFFF' : (star.empire ? star.empire.color : 'rgba(255,255,255,0.5)');
    ctx.fillText(star.name, star.screenX, star.screenY + star.size + 12);
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      // Smooth camera
      setCamera(prev => ({
        x: prev.x + (targetCamera.x - prev.x) * CAMERA_SMOOTHING,
        y: prev.y + (targetCamera.y - prev.y) * CAMERA_SMOOTHING,
        zoom: prev.zoom + (targetCamera.zoom - prev.zoom) * CAMERA_SMOOTHING
      }));

      // Auto-rotate
      if (view.autoRotate) {
        setView(prev => ({
          ...prev,
          rotation: prev.rotation + AUTO_ROTATE_SPEED > 360 ? prev.rotation + AUTO_ROTATE_SPEED - 720 : prev.rotation + AUTO_ROTATE_SPEED
        }));
      }

      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [render, targetCamera, view.autoRotate]);

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    camStartRef.current = { x: targetCamera.x, y: targetCamera.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = (e.clientX - dragStartRef.current.x) / camera.zoom;
      const dy = (e.clientY - dragStartRef.current.y) / camera.zoom;
      setTargetCamera(prev => ({ ...prev, x: camStartRef.current.x - dx, y: camStartRef.current.y - dy }));
    }

    // Find hovered star
    let found: Star | null = null;
    let minDist = CLICK_DETECTION_RADIUS;

    for (const star of stars) {
      const screen = worldToScreen(star.x, star.y, star.z);
      const dx = e.clientX - screen.screenX;
      const dy = e.clientY - screen.screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        found = star;
      }
    }
    setHoveredStar(found);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    let clicked: Star | null = null;
    let minDist = CLICK_DETECTION_RADIUS;

    for (const star of stars) {
      const screen = worldToScreen(star.x, star.y, star.z);
      const dx = e.clientX - screen.screenX;
      const dy = e.clientY - screen.screenY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDist) {
        minDist = dist;
        clicked = star;
      }
    }

    if (routeDrawing.active && clicked) {
      if (!routeDrawing.stars.find(s => s.id === clicked!.id)) {
        setRouteDrawing(prev => ({ ...prev, stars: [...prev.stars, clicked!] }));
      }
      return;
    }

    if (wormholeDrawing.active && clicked) {
      if (!wormholeDrawing.firstStar) {
        setWormholeDrawing({ active: true, firstStar: clicked });
      } else if (clicked.id !== wormholeDrawing.firstStar.id) {
        setWormholes(prev => [...prev, {
          id: nextWormholeId,
          name: `Wormhole ${prev.length + 1}`,
          starA: wormholeDrawing.firstStar!,
          starB: clicked!,
          color: WORMHOLE_COLORS[prev.length % WORMHOLE_COLORS.length],
          stable: Math.random() < WORMHOLE_STABLE_CHANCE
        }]);
        setNextWormholeId(prev => prev + 1);
        setWormholeDrawing({ active: false, firstStar: null });
        setStatusText('Mapped');
      }
      return;
    }

    setSelectedStar(clicked);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;
    setTargetCamera(prev => ({
      ...prev,
      zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * factor))
    }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (routeDrawing.active) finishRouteDrawing();
        if (wormholeDrawing.active) {
          setWormholeDrawing({ active: false, firstStar: null });
          setStatusText('Mapped');
        }
      }
      if ((e.key === 'z' || e.key === 'Z' || e.key === 'Backspace') && routeDrawing.active) {
        e.preventDefault();
        setRouteDrawing(prev => ({ ...prev, stars: prev.stars.slice(0, -1) }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [routeDrawing.active, wormholeDrawing.active]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  const startRouteDrawing = () => {
    setRouteDrawing({ active: true, stars: [] });
    setStatusText('Drawing Route');
  };

  const finishRouteDrawing = () => {
    if (routeDrawing.stars.length >= 2) {
      setTradeRoutes(prev => [...prev, {
        id: nextRouteId,
        name: `Trade Lane ${prev.length + 1}`,
        color: ROUTE_COLORS[prev.length % ROUTE_COLORS.length],
        stars: [...routeDrawing.stars]
      }]);
      setNextRouteId(prev => prev + 1);
    }
    setRouteDrawing({ active: false, stars: [] });
    setStatusText('Mapped');
  };

  const startWormholeDrawing = () => {
    setWormholeDrawing({ active: true, firstStar: null });
    setStatusText('Placing Wormhole');
  };

  const panToEmpire = (empire: Empire) => {
    setTargetCamera({ x: empire.centerX, y: empire.centerY, zoom: 1.8 });
  };

  const renameStar = (newName: string) => {
    if (!selectedStar || !newName.trim()) return;
    setStars(prev => prev.map(s => s.id === selectedStar.id ? { ...s, name: newName.trim() } : s));
    setSelectedStar(prev => prev ? { ...prev, name: newName.trim() } : null);
  };

  // Component render will follow in the CSS module and JSX...
  // This is the core logic - UI components follow StellarForge patterns

  return (
    <div className={styles.container}>
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${routeDrawing.active || wormholeDrawing.active ? styles.crosshair : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />

      {/* UI Panels will be implemented following SIMULATOR_AESTHETIC.md */}
      {/* Title Panel, Control Panel, Data Panel, Zoom Panel, Tooltip, Mode Indicators */}
      
      {/* Placeholder for UI - implement with proper styling */}
      <div className={styles.titlePanel}>
        <div className={styles.toolTitle}>STELLAR CARTOGRAPHER</div>
        <div className={styles.toolSubtitle}>STELLARFORGE.TOOLS</div>
        <div className={styles.galaxyNameDisplay}>{galaxyName}</div>
        <div className={styles.badge}>{statusText}</div>
      </div>

      {/* Additional UI panels... */}
    </div>
  );
};

export default StellarCartographer;
