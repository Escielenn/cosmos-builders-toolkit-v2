// Stellar Cartographer - Main Component
// StellarForge.tools
// Interactive galaxy mapping tool for SF worldbuilders

'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import PublishToWorldDialog from '@/components/simulators/PublishToWorldDialog';
import { useWorldLayoutContext } from '@/contexts/WorldLayoutContext';
import type { SimulatorPayload } from '@/hooks/use-simulation-save';
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
  NamingStyle,
  Position,
  ProjectedPoint,
  BlackHole,
  NucleusActivity,
} from './types';
import { SeededRandom } from './utils/seededRandom';
import { STAR_TYPES, assignStarType, isHotStar } from './utils/starTypes';
import { generateName, generateDesignation } from './utils/nameGenerator';
import { hexToRgba, shiftHue } from './utils/colorUtils';
import { exportPNG, exportSVG, exportJSON, exportMarkdown } from './hooks/useExport';
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
  MIN_STARS,
  MAX_STARS,
  SMBH_ACTIVITY_CONFIG,
  DEFAULT_SMBH_MASS,
} from './constants';

// Styles following SIMULATOR_AESTHETIC.md
import styles from './StellarCartographer.module.css';

const MINIMAP_SIZE = 120;

const StellarCartographer: React.FC = () => {
  // Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const minimapRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const camStartRef = useRef({ x: 0, y: 0 });
  const dragButtonRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const viewStartRef = useRef({ rotation: 0, tilt: 0 });
  const spatialGridRef = useRef<Map<string, ScreenStar[]>>(new Map());
  const inertiaRef = useRef({ vx: 0, vy: 0, active: false });
  const lastDragPosRef = useRef({ x: 0, y: 0, time: 0 });
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const bgDirtyRef = useRef(true);

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
  const [nextEmpireId, setNextEmpireId] = useState(5);
  const [statusText, setStatusText] = useState('Mapping');
  const [renameInput, setRenameInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [blackHole, setBlackHole] = useState<BlackHole | null>(null);

  // ── Publish to World ──────────────────────────────────────────────
  const layoutContext = useWorldLayoutContext();
  const [searchParams] = useSearchParams();
  const worldId = layoutContext?.worldId ?? searchParams.get("worldId") ?? undefined;
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);

  /** Build a SimulatorPayload from current Cartographer state. */
  const buildPublishPayload = useCallback((): SimulatorPayload => {
    // When a star is selected, publish it as a star_system
    if (selectedStar) {
      return {
        outputType: 'star_system',
        name: selectedStar.name,
        parameters: {
          spectralClass: selectedStar.type,
          hasHabitable: selectedStar.hasHabitable,
          position: { x: selectedStar.x, y: selectedStar.y, z: selectedStar.z },
          sovereignty: selectedStar.empire?.name ?? null,
          galaxyName,
          galaxySeed: config.seed,
        },
        results: {
          temperature: STAR_TYPES[selectedStar.type].temp,
          mass: STAR_TYPES[selectedStar.type].mass,
          luminosity: selectedStar.luminosity,
          brightness: selectedStar.brightness,
        },
      };
    }

    // Otherwise publish the entire galaxy
    return {
      outputType: 'galaxy',
      name: galaxyName,
      parameters: {
        galaxyType: config.type,
        starCount: config.starCount,
        armCount: config.armCount,
        armSpread: config.armSpread,
        seed: config.seed,
        empireCount: empires.length,
      },
      results: {
        totalStars: stars.length,
        habitableStars: stars.filter(s => s.hasHabitable).length,
        empires: empires.map(e => ({ name: e.name, color: e.color, namingStyle: e.namingStyle })),
        tradeRoutes: tradeRoutes.map(r => ({ name: r.name, hopCount: r.stars.length })),
        wormholes: wormholes.map(w => ({ name: w.name, stable: w.stable, starA: w.starA.name, starB: w.starB.name })),
        blackHole: blackHole ? { name: blackHole.name, mass: blackHole.mass, activity: blackHole.activity } : null,
      },
    };
  }, [selectedStar, galaxyName, config, empires, stars, tradeRoutes, wormholes, blackHole]);

  // Sync rename input when selected star changes
  useEffect(() => {
    setRenameInput(selectedStar?.name || '');
  }, [selectedStar?.id]);

  // Canvas-relative coordinates for hit-testing
  const getCanvasCoords = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // Spatial grid cell size for fast hover/click detection
  const GRID_CELL_SIZE = 50;

  const findStarNearScreen = useCallback((screenX: number, screenY: number): Star | null => {
    const grid = spatialGridRef.current;
    const cellX = Math.floor(screenX / GRID_CELL_SIZE);
    const cellY = Math.floor(screenY / GRID_CELL_SIZE);

    let found: Star | null = null;
    let minDist = CLICK_DETECTION_RADIUS;

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${cellX + dx},${cellY + dy}`;
        const cell = grid.get(key);
        if (!cell) continue;
        for (const star of cell) {
          const ddx = screenX - star.screenX;
          const ddy = screenY - star.screenY;
          const dist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dist < minDist) {
            minDist = dist;
            found = star;
          }
        }
      }
    }
    return found;
  }, []);

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

  const generateGalaxySync = useCallback(() => {
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
    bgDirtyRef.current = true;
    setSelectedStar(null);
    setStatusText('Mapped');
  }, [config, findOwningEmpire, generateStarPosition]);

  const generateGalaxy = useCallback(() => {
    setIsGenerating(true);
    // Yield to browser so loading overlay renders before heavy computation
    setTimeout(() => {
      generateGalaxySync();
      setBlackHole({
        name: 'Galactic Core',
        x: 0,
        y: 0,
        mass: DEFAULT_SMBH_MASS,
        activity: 'quiescent',
        accretionColor: SMBH_ACTIVITY_CONFIG.quiescent.color,
      });
      setIsGenerating(false);
    }, 16);
  }, [generateGalaxySync]);

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

    // Background stars, cached to offscreen canvas, composited with parallax offset
    if (bgDirtyRef.current || !bgCanvasRef.current || bgCanvasRef.current.width !== w * 2 || bgCanvasRef.current.height !== h * 2) {
      const bgCanvas = document.createElement('canvas');
      bgCanvas.width = w * 2;
      bgCanvas.height = h * 2;
      const bgCtx = bgCanvas.getContext('2d');
      if (bgCtx) {
        for (const star of backgroundStars) {
          const sx = star.x * 0.4 + bgCanvas.width / 2;
          const sy = star.y * 0.4 + bgCanvas.height / 2;
          bgCtx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
          bgCtx.beginPath();
          bgCtx.arc(sx, sy, star.size, 0, Math.PI * 2);
          bgCtx.fill();
        }
      }
      bgCanvasRef.current = bgCanvas;
      bgDirtyRef.current = false;
    }
    // Blit cached background with parallax offset
    if (bgCanvasRef.current) {
      const offsetX = -camera.x * PARALLAX_FACTOR * 0.4 - (bgCanvasRef.current.width - w) / 2;
      const offsetY = -camera.y * PARALLAX_FACTOR * 0.4 - (bgCanvasRef.current.height - h) / 2;
      ctx.drawImage(bgCanvasRef.current, offsetX, offsetY);
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

    // Supermassive Black Hole
    if (blackHole) {
      const bhScreen = worldToScreen(blackHole.x, blackHole.y, 0);
      const actCfg = SMBH_ACTIVITY_CONFIG[blackHole.activity];
      const visualRadius = (2 + Math.log10(Math.max(1, blackHole.mass)) * 4) * zoom * bhScreen.scale;
      const glowRadius = visualRadius * actCfg.glowMultiplier;
      const sx = bhScreen.screenX;
      const sy = bhScreen.screenY;

      // Accretion disk glow
      const outerGlow = ctx.createRadialGradient(sx, sy, visualRadius * 1.5, sx, sy, glowRadius);
      outerGlow.addColorStop(0, hexToRgba(actCfg.color, actCfg.arcOpacity * 0.6));
      outerGlow.addColorStop(0.4, hexToRgba(actCfg.color, actCfg.arcOpacity * 0.25));
      outerGlow.addColorStop(1, hexToRgba(actCfg.color, 0));
      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(sx, sy, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Accretion disk arcs (animated)
      const time = Date.now() / 1000;
      for (let i = actCfg.diskArcs; i >= 1; i--) {
        const arcRadius = visualRadius * 2.5 * (i / actCfg.diskArcs) + visualRadius;
        const speed = 0.3 + (actCfg.diskArcs - i) * 0.15;
        const arcLen = Math.PI * (0.8 + i * 0.3);
        ctx.strokeStyle = hexToRgba(actCfg.color, actCfg.arcOpacity + i * 0.05);
        ctx.lineWidth = Math.max(1, 2 * bhScreen.scale * zoom * 0.3);
        ctx.beginPath();
        ctx.arc(sx, sy, arcRadius, time * speed, time * speed + arcLen);
        ctx.stroke();
      }

      // Photon ring (thin bright ring at event horizon edge)
      const ringGlow = ctx.createRadialGradient(sx, sy, visualRadius * 0.8, sx, sy, visualRadius * 1.6);
      ringGlow.addColorStop(0, hexToRgba(actCfg.color, 0.5));
      ringGlow.addColorStop(0.5, hexToRgba(actCfg.color, 0.8));
      ringGlow.addColorStop(1, hexToRgba(actCfg.color, 0));
      ctx.strokeStyle = ringGlow;
      ctx.lineWidth = Math.max(1, 1.5 * bhScreen.scale * zoom * 0.3);
      ctx.beginPath();
      ctx.arc(sx, sy, visualRadius * 1.2, 0, Math.PI * 2);
      ctx.stroke();

      // Event horizon (pure black)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(sx, sy, visualRadius, 0, Math.PI * 2);
      ctx.fill();

      // Label
      if (zoom >= 0.8) {
        ctx.font = '500 9px "Jura", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(5, 5, 8, 0.85)';
        ctx.fillText(blackHole.name, sx + 1, sy - visualRadius - 6 + 1);
        ctx.fillStyle = actCfg.color;
        ctx.fillText(blackHole.name, sx, sy - visualRadius - 6);
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

    // Build spatial grid for O(1) hover/click detection
    const grid = new Map<string, ScreenStar[]>();
    for (const star of sortedStars) {
      if (star.screenX < -30 || star.screenX > w + 30 || star.screenY < -30 || star.screenY > h + 30) continue;
      const cellX = Math.floor(star.screenX / GRID_CELL_SIZE);
      const cellY = Math.floor(star.screenY / GRID_CELL_SIZE);
      const key = `${cellX},${cellY}`;
      let cell = grid.get(key);
      if (!cell) { cell = []; grid.set(key, cell); }
      cell.push(star);
    }
    spatialGridRef.current = grid;

    // LOD levels: 0=minimal (dots only), 1=basic (body+core), 2=full (all glows)
    const starCount = sortedStars.length;
    const lod = zoom < 0.5 && starCount > 5000 ? 0 : zoom < 1.0 && starCount > 10000 ? 1 : 2;

    for (const star of sortedStars) {
      if (star.screenX < -30 || star.screenX > w + 30 || star.screenY < -30 || star.screenY > h + 30) continue;

      const baseSize = star.size * star.scale;
      const zoomFactor = Math.pow(zoom, STAR_SIZE_ZOOM_EXPONENT);
      const size = Math.max(MIN_STAR_SIZE, baseSize * zoomFactor * STAR_SIZE_MULTIPLIER);
      const depthFade = Math.max(MIN_DEPTH_FADE, Math.min(1, 1 - star.screenZ / DEPTH_FADE_DISTANCE));
      const totalBrightness = star.brightness * star.luminosity * depthFade;

      if (lod === 0) {
        // Minimal: single pixel dot, no glow/gradient
        ctx.fillStyle = hexToRgba(star.color, totalBrightness * 0.8);
        ctx.fillRect(star.screenX - size * 0.5, star.screenY - size * 0.5, Math.max(1, size), Math.max(1, size));
        continue;
      }

      // Hot star glow (LOD 2 only)
      if (lod >= 2 && isHotStar(star.type) && zoom > 0.4 && star.luminosity > 0.7) {
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

      // Secondary glow for very luminous (LOD 2 only)
      if (lod >= 2 && star.luminosity > 0.8 && zoom > 0.6) {
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
        ctx.strokeStyle = '#15C17B';
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
    routeDrawing, wormholeDrawing, selectedStar, worldToScreen, blackHole
  ]);

  const drawLabel = (ctx: CanvasRenderingContext2D, star: ScreenStar, isSelected: boolean) => {
    const fontSize = isSelected ? 10 : 8;
    ctx.font = `500 ${fontSize}px "Jura", sans-serif`;
    ctx.textAlign = 'center';

    // Shadow
    ctx.fillStyle = 'rgba(5, 5, 8, 0.85)';
    ctx.fillText(star.name, star.screenX + 1, star.screenY + star.size + 12 + 1);

    // Text
    ctx.fillStyle = isSelected ? '#FFFFFF' : (star.empire ? star.empire.color : 'rgba(255,255,255,0.5)');
    ctx.fillText(star.name, star.screenX, star.screenY + star.size + 12);
  };

  const minimapScale = useMemo(() => MINIMAP_SIZE / (GALAXY_RADIUS * 2.2), []);

  const renderMinimap = useCallback(() => {
    const el = minimapRef.current;
    if (!el) return;
    const mctx = el.getContext('2d');
    if (!mctx) return;
    const s = minimapScale;
    const cx = MINIMAP_SIZE / 2;
    const cy = MINIMAP_SIZE / 2;

    mctx.fillStyle = 'rgba(5, 5, 8, 0.85)';
    mctx.fillRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);

    // Empire territories (subtle)
    for (const empire of empires) {
      mctx.fillStyle = hexToRgba(empire.color, 0.08);
      mctx.beginPath();
      mctx.arc(cx + empire.centerX * s, cy + empire.centerY * s, empire.radius * s, 0, Math.PI * 2);
      mctx.fill();
    }

    // SMBH dot
    if (blackHole) {
      const bhX = cx + blackHole.x * s;
      const bhY = cy + blackHole.y * s;
      const actCfg = SMBH_ACTIVITY_CONFIG[blackHole.activity];
      mctx.fillStyle = hexToRgba(actCfg.color, 0.3);
      mctx.beginPath();
      mctx.arc(bhX, bhY, 4, 0, Math.PI * 2);
      mctx.fill();
      mctx.fillStyle = '#000000';
      mctx.beginPath();
      mctx.arc(bhX, bhY, 1.5, 0, Math.PI * 2);
      mctx.fill();
    }

    // Stars (sampled for performance)
    const step = Math.max(1, Math.floor(stars.length / 800));
    for (let i = 0; i < stars.length; i += step) {
      const star = stars[i];
      mctx.fillStyle = hexToRgba(star.color, 0.5);
      mctx.fillRect(cx + star.x * s, cy + star.y * s, 1, 1);
    }

    // Viewport rectangle
    const mainCanvas = canvasRef.current;
    if (mainCanvas) {
      const vpW = (mainCanvas.width / camera.zoom) * s;
      const vpH = (mainCanvas.height / camera.zoom) * s;
      const vpX = cx + camera.x * s - vpW / 2;
      const vpY = cy + camera.y * s - vpH / 2;
      mctx.strokeStyle = 'rgba(21, 193, 123, 0.5)';
      mctx.lineWidth = 1;
      mctx.strokeRect(vpX, vpY, vpW, vpH);
    }

    // Border
    mctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    mctx.lineWidth = 1;
    mctx.strokeRect(0, 0, MINIMAP_SIZE, MINIMAP_SIZE);
  }, [empires, stars, camera, minimapScale, blackHole]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ANIMATION LOOP
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }
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

      // Orbit inertia, apply decaying velocity after drag release
      if (inertiaRef.current.active) {
        const { vx, vy } = inertiaRef.current;
        const speed = Math.sqrt(vx * vx + vy * vy);
        if (speed < 0.001) {
          inertiaRef.current.active = false;
        } else {
          const sensitivity = 0.3;
          const dt = 16; // ~60fps frame time
          setView(prev => ({
            ...prev,
            rotation: prev.rotation + vx * dt * sensitivity,
            tilt: Math.max(-85, Math.min(85, prev.tilt - vy * dt * sensitivity)),
          }));
          // Friction deceleration
          inertiaRef.current.vx *= 0.95;
          inertiaRef.current.vy *= 0.95;
        }
      }

      render();
      renderMinimap();
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [render, renderMinimap, targetCamera, view.autoRotate]);

  // ═══════════════════════════════════════════════════════════════════════════
  // INPUT HANDLERS
  // ═══════════════════════════════════════════════════════════════════════════
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragButtonRef.current = e.button;
    dragStartRef.current = { x: e.clientX, y: e.clientY };

    // Stop any active inertia
    inertiaRef.current = { vx: 0, vy: 0, active: false };
    lastDragPosRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };

    if (e.button !== 0 || e.shiftKey) {
      // Right-click, middle-click, or shift+click = pan
      camStartRef.current = { x: targetCamera.x, y: targetCamera.y };
    } else {
      // Left-click = orbit (rotate + tilt)
      viewStartRef.current = { rotation: view.rotation, tilt: view.tilt };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      if (!hasDraggedRef.current && Math.sqrt(dx * dx + dy * dy) > 4) {
        hasDraggedRef.current = true;
      }

      if (hasDraggedRef.current) {
        // Track velocity for inertia
        const now = performance.now();
        const dt = now - lastDragPosRef.current.time;
        if (dt > 0) {
          const mdx = e.clientX - lastDragPosRef.current.x;
          const mdy = e.clientY - lastDragPosRef.current.y;
          // Exponential moving average for smooth velocity
          inertiaRef.current.vx = inertiaRef.current.vx * 0.5 + (mdx / dt) * 0.5;
          inertiaRef.current.vy = inertiaRef.current.vy * 0.5 + (mdy / dt) * 0.5;
        }
        lastDragPosRef.current = { x: e.clientX, y: e.clientY, time: now };

        if (dragButtonRef.current !== 0 || e.shiftKey) {
          // Pan
          const panDx = dx / camera.zoom;
          const panDy = dy / camera.zoom;
          setTargetCamera(prev => ({ ...prev, x: camStartRef.current.x - panDx, y: camStartRef.current.y - panDy }));
        } else {
          // Orbit (rotate + tilt)
          setView(prev => ({
            ...prev,
            rotation: viewStartRef.current.rotation + dx * 0.3,
            tilt: Math.max(-85, Math.min(85, viewStartRef.current.tilt - dy * 0.3)),
            autoRotate: false
          }));
        }
      }
      return;
    }

    // Hover detection via spatial grid (O(1) instead of O(n))
    const coords = getCanvasCoords(e);
    setHoveredStar(findStarNearScreen(coords.x, coords.y));
  };

  const handleMouseUp = () => {
    // Start inertia if orbit drag had velocity
    if (hasDraggedRef.current && dragButtonRef.current === 0) {
      const speed = Math.sqrt(inertiaRef.current.vx ** 2 + inertiaRef.current.vy ** 2);
      if (speed > 0.05) {
        inertiaRef.current.active = true;
      }
    }
    isDraggingRef.current = false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) return; // Suppress click after drag

    const coords = getCanvasCoords(e);
    const clicked = findStarNearScreen(coords.x, coords.y);

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

  const handleDoubleClick = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    const clicked = findStarNearScreen(coords.x, coords.y);
    if (clicked) {
      // Zoom into the star
      setSelectedStar(clicked);
      setTargetCamera({ x: clicked.x, y: clicked.y, zoom: Math.max(camera.zoom, 4) });
    } else {
      // Double-click on empty space: zoom in at that point
      const canvas = canvasRef.current;
      if (!canvas) return;
      const worldX = (coords.x - canvas.width / 2) / camera.zoom + camera.x;
      const worldY = (coords.y - canvas.height / 2) / camera.zoom + camera.y;
      setTargetCamera(prev => ({ x: worldX, y: worldY, zoom: Math.min(MAX_ZOOM, prev.zoom * 2) }));
    }
  };

  // Native wheel listener with passive:false for preventDefault
  // Zoom towards cursor position for natural feel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? ZOOM_OUT_FACTOR : ZOOM_IN_FACTOR;
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setTargetCamera(prev => {
        const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * factor));
        // Convert mouse position to world coords, then adjust camera so that point stays under cursor
        const worldX = (mouseX - canvas.width / 2) / prev.zoom + prev.x;
        const worldY = (mouseY - canvas.height / 2) / prev.zoom + prev.y;
        const newX = worldX - (mouseX - canvas.width / 2) / newZoom;
        const newY = worldY - (mouseY - canvas.height / 2) / newZoom;
        return { x: newX, y: newY, zoom: newZoom };
      });
    };

    // Touch support: pinch-to-zoom + two-finger orbit
    let lastTouches: { x: number; y: number }[] = [];
    let lastTouchDist = 0;
    let lastTouchAngle = 0;
    let touchMode: 'none' | 'pan' | 'orbit-zoom' = 'none';

    const getTouchCenter = (touches: TouchList) => ({
      x: (touches[0].clientX + (touches[1]?.clientX ?? touches[0].clientX)) / (touches.length > 1 ? 2 : 1),
      y: (touches[0].clientY + (touches[1]?.clientY ?? touches[0].clientY)) / (touches.length > 1 ? 2 : 1),
    });

    const getTouchDist = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        touchMode = 'pan';
        lastTouches = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }];
      } else if (e.touches.length >= 2) {
        touchMode = 'orbit-zoom';
        lastTouchDist = getTouchDist(e.touches);
        const center = getTouchCenter(e.touches);
        lastTouches = [center];
        lastTouchAngle = Math.atan2(
          e.touches[1].clientY - e.touches[0].clientY,
          e.touches[1].clientX - e.touches[0].clientX
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchMode === 'pan' && e.touches.length === 1) {
        const dx = (e.touches[0].clientX - lastTouches[0].x);
        const dy = (e.touches[0].clientY - lastTouches[0].y);
        setTargetCamera(prev => ({
          ...prev,
          x: prev.x - dx / prev.zoom,
          y: prev.y - dy / prev.zoom,
        }));
        lastTouches = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }];
      } else if (touchMode === 'orbit-zoom' && e.touches.length >= 2) {
        const newDist = getTouchDist(e.touches);
        const center = getTouchCenter(e.touches);
        const dx = center.x - lastTouches[0].x;
        const dy = center.y - lastTouches[0].y;

        // Pinch zoom
        if (lastTouchDist > 0 && newDist > 0) {
          const scale = newDist / lastTouchDist;
          setTargetCamera(prev => ({
            ...prev,
            zoom: Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, prev.zoom * scale)),
          }));
        }

        // Two-finger drag = orbit
        setView(prev => ({
          ...prev,
          rotation: prev.rotation + dx * 0.3,
          tilt: Math.max(-85, Math.min(85, prev.tilt - dy * 0.3)),
          autoRotate: false,
        }));

        lastTouchDist = newDist;
        lastTouches = [center];
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        touchMode = 'none';
      } else if (e.touches.length === 1) {
        touchMode = 'pan';
        lastTouches = [{ x: e.touches[0].clientX, y: e.touches[0].clientY }];
      }
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd);
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip keyboard shortcuts when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'Escape') {
        if (searchOpen) { setSearchOpen(false); return; }
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

      // Don't handle navigation shortcuts when in an input
      if (isInput) return;

      const ORBIT_STEP = 5;
      const PAN_STEP = 30;
      const ZOOM_STEP = 1.15;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) {
            setTargetCamera(prev => ({ ...prev, x: prev.x - PAN_STEP / prev.zoom }));
          } else {
            setView(prev => ({ ...prev, rotation: prev.rotation - ORBIT_STEP, autoRotate: false }));
          }
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (e.shiftKey) {
            setTargetCamera(prev => ({ ...prev, x: prev.x + PAN_STEP / prev.zoom }));
          } else {
            setView(prev => ({ ...prev, rotation: prev.rotation + ORBIT_STEP, autoRotate: false }));
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (e.shiftKey) {
            setTargetCamera(prev => ({ ...prev, y: prev.y - PAN_STEP / prev.zoom }));
          } else {
            setView(prev => ({ ...prev, tilt: Math.min(85, prev.tilt + ORBIT_STEP), autoRotate: false }));
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (e.shiftKey) {
            setTargetCamera(prev => ({ ...prev, y: prev.y + PAN_STEP / prev.zoom }));
          } else {
            setView(prev => ({ ...prev, tilt: Math.max(-85, prev.tilt - ORBIT_STEP), autoRotate: false }));
          }
          break;
        case '=':
        case '+':
          e.preventDefault();
          setTargetCamera(prev => ({ ...prev, zoom: Math.min(MAX_ZOOM, prev.zoom * ZOOM_STEP) }));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setTargetCamera(prev => ({ ...prev, zoom: Math.max(MIN_ZOOM, prev.zoom / ZOOM_STEP) }));
          break;
        case 'Home':
          e.preventDefault();
          setView(DEFAULT_VIEW);
          setTargetCamera(DEFAULT_CAMERA);
          break;
        case 'r':
        case 'R':
          if (!e.ctrlKey && !e.metaKey) {
            setView(prev => ({ ...prev, autoRotate: !prev.autoRotate }));
          }
          break;
        case 'f':
        case 'F':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault();
            setSearchOpen(prev => !prev);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [routeDrawing.active, wormholeDrawing.active, searchOpen]);

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

  const EMPIRE_COLORS = ['#FFD43B', '#FF6B6B', '#9B59B6', '#1ABC9C', '#F39C12', '#3498DB', '#E67E22', '#00CEC9'];
  const NAMING_STYLES: NamingStyle[] = ['terran', 'harsh', 'flowing', 'poetic'];

  const addEmpire = () => {
    const id = nextEmpireId;
    setNextEmpireId(prev => prev + 1);
    const color = EMPIRE_COLORS[(id - 1) % EMPIRE_COLORS.length];
    const style = NAMING_STYLES[id % NAMING_STYLES.length];
    setEmpires(prev => [...prev, {
      id,
      name: `New Empire ${id}`,
      color,
      namingStyle: style,
      centerX: (Math.random() - 0.5) * GALAXY_RADIUS,
      centerY: (Math.random() - 0.5) * GALAXY_RADIUS,
      radius: 200
    }]);
  };

  const deleteRoute = (id: number) => {
    setTradeRoutes(prev => prev.filter(r => r.id !== id));
  };

  const deleteWormhole = (id: number) => {
    setWormholes(prev => prev.filter(w => w.id !== id));
  };

  const randomizeSeed = () => {
    setConfig(prev => ({ ...prev, seed: Math.floor(Math.random() * 9999) + 1 }));
  };

  // Computed stats
  const namedSystems = useMemo(() => stars.filter(s => s.empire !== null).length, [stars]);
  const habitableCount = useMemo(() => stars.filter(s => s.hasHabitable).length, [stars]);
  const empireStarCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const empire of empires) counts[empire.id] = 0;
    for (const star of stars) {
      if (star.empire) counts[star.empire.id] = (counts[star.empire.id] || 0) + 1;
    }
    return counts;
  }, [stars, empires]);

  // Star search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const query = searchQuery.toLowerCase();
    return stars
      .filter(s => s.name.toLowerCase().includes(query))
      .slice(0, 20);
  }, [stars, searchQuery]);

  const focusStar = useCallback((star: Star) => {
    setSelectedStar(star);
    setTargetCamera({ x: star.x, y: star.y, zoom: Math.max(camera.zoom, 3) });
    setSearchOpen(false);
    setSearchQuery('');
  }, [camera.zoom]);

  // Badge style class based on status
  const badgeClass = routeDrawing.active ? styles.warning
    : wormholeDrawing.active ? styles.danger
    : statusText === 'Mapped' ? styles.active
    : '';

  return (
    <div ref={containerRef} className={styles.container}>
      <canvas
        ref={canvasRef}
        className={`${styles.canvas} ${routeDrawing.active || wormholeDrawing.active ? styles.crosshair : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* ═══════════════════ TITLE PANEL ═══════════════════ */}
      <div className={styles.titlePanel}>
        <div className={styles.toolTitle}>STELLAR CARTOGRAPHER</div>
        <div className={styles.toolSubtitle}>STELLARFORGE.TOOLS</div>
        <div className={styles.galaxyNameDisplay}>{galaxyName}</div>
        <div className={`${styles.badge} ${badgeClass}`}>{statusText}</div>
        <div className={styles.navLinks}>
          <Link to="/">← Tools</Link>
        </div>
      </div>

      {/* ═══════════════════ CONTROL PANEL ═══════════════════ */}
      <div className={styles.controlPanel}>

        {/* Galaxy Identity */}
        <div className={styles.sectionHeader}>Galaxy Identity</div>
        <div className={styles.controlRow}>
          <div className={styles.controlLabel}><span>Galaxy Name</span></div>
          <input
            type="text"
            className={styles.input}
            placeholder="Enter galaxy name..."
            value={galaxyName}
            onChange={e => setGalaxyName(e.target.value)}
          />
        </div>

        {/* Galaxy Structure */}
        <div className={styles.sectionHeader}>Galaxy Structure</div>
        <div className={styles.controlRow}>
          <div className={styles.controlLabel}><span>Type</span></div>
          <select
            className={styles.select}
            value={config.type}
            onChange={e => setConfig(prev => ({ ...prev, type: e.target.value as GalaxyConfig['type'] }))}
          >
            <option value="spiral">Spiral Galaxy</option>
            <option value="barred">Barred Spiral</option>
            <option value="elliptical">Elliptical Galaxy</option>
            <option value="irregular">Irregular Galaxy</option>
          </select>
        </div>
        <div className={styles.controlRow}>
          <div className={styles.controlLabel}>
            <span>Stars</span>
            <span className={styles.valueDisplay}>{config.starCount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={MIN_STARS}
            max={MAX_STARS}
            step={500}
            value={config.starCount}
            onChange={e => setConfig(prev => ({ ...prev, starCount: Number(e.target.value) }))}
          />
        </div>
        <div className={styles.controlRow}>
          <div className={styles.controlLabel}>
            <span>Arms</span>
            <span className={styles.valueDisplay}>{config.armCount}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={2}
            max={6}
            step={1}
            value={config.armCount}
            onChange={e => setConfig(prev => ({ ...prev, armCount: Number(e.target.value) }))}
          />
        </div>
        <div className={styles.controlRow}>
          <div className={styles.controlLabel}>
            <span>Arm Spread</span>
            <span className={styles.valueDisplay}>{config.armSpread.toFixed(2)}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0.1}
            max={0.8}
            step={0.05}
            value={config.armSpread}
            onChange={e => setConfig(prev => ({ ...prev, armSpread: Number(e.target.value) }))}
          />
        </div>
        <div className={styles.controlRow}>
          <div className={styles.controlLabel}>
            <span>Seed</span>
            <span className={styles.valueDisplay}>{config.seed}</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={1}
            max={9999}
            step={1}
            value={config.seed}
            onChange={e => setConfig(prev => ({ ...prev, seed: Number(e.target.value) }))}
          />
        </div>
        <div className={styles.btnRow} style={{ marginTop: 6 }}>
          <button className={`${styles.btn} ${styles.primary}`} onClick={generateGalaxy}>Generate</button>
          <button className={styles.btn} onClick={randomizeSeed}>Random</button>
        </div>

        {/* View Controls */}
        <div className={styles.sectionHeader}>View Controls</div>
        <div className={styles.controlRow}>
          <div className={styles.controlLabel}>
            <span>Rotation</span>
            <span className={styles.valueDisplay}>{Math.round(view.rotation)}°</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={-360}
            max={360}
            step={1}
            value={view.rotation}
            onChange={e => setView(prev => ({ ...prev, rotation: Number(e.target.value) }))}
          />
        </div>
        <div className={styles.controlRow}>
          <div className={styles.controlLabel}>
            <span>Tilt (3D)</span>
            <span className={styles.valueDisplay}>{Math.round(view.tilt)}°</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={-85}
            max={85}
            step={1}
            value={view.tilt}
            onChange={e => setView(prev => ({ ...prev, tilt: Number(e.target.value) }))}
          />
        </div>
        <div className={styles.btnRow}>
          <button
            className={`${styles.btn} ${view.autoRotate ? styles.active : ''}`}
            onClick={() => setView(prev => ({ ...prev, autoRotate: !prev.autoRotate }))}
          >
            Auto Rotate
          </button>
          <button
            className={styles.btn}
            onClick={() => {
              setView(DEFAULT_VIEW);
              setTargetCamera(DEFAULT_CAMERA);
            }}
          >
            Reset View
          </button>
        </div>
        <div className={styles.btnRow} style={{ marginTop: 4 }}>
          <button className={styles.btn} onClick={() => setSearchOpen(true)}>
            Find Star (F)
          </button>
        </div>

        {/* Empires */}
        <div className={styles.sectionHeader}>Empires</div>
        <div className={styles.empireList}>
          {empires.map(empire => (
            <div
              key={empire.id}
              className={styles.empireItem}
              onClick={() => panToEmpire(empire)}
            >
              <span className={styles.empireDot} style={{ background: empire.color }} />
              <span className={styles.empireName}>{empire.name}</span>
              <span className={styles.empireCount}>{(empireStarCounts[empire.id] || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className={styles.btnRow} style={{ marginTop: 8 }}>
          <button className={styles.btn} onClick={addEmpire}>+ Add Empire</button>
        </div>

        {/* Trade Routes */}
        <div className={styles.sectionHeader}>Trade Routes</div>
        {tradeRoutes.map(route => (
          <div key={route.id} className={styles.listItem}>
            <div className={styles.listItemInfo}>
              <span className={styles.listItemDot} style={{ background: route.color }} />
              <span className={styles.listItemName}>{route.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className={styles.listItemMeta}>{route.stars.length} hops</span>
              <span className={styles.listItemDelete} onClick={() => deleteRoute(route.id)}>×</span>
            </div>
          </div>
        ))}
        {tradeRoutes.length === 0 && <div className={styles.emptyState}>No trade routes</div>}
        <div className={styles.btnRow} style={{ marginTop: 8 }}>
          <button
            className={`${styles.btn} ${routeDrawing.active ? styles.active : ''}`}
            onClick={routeDrawing.active ? finishRouteDrawing : startRouteDrawing}
          >
            {routeDrawing.active ? 'Finish' : '+ Draw'}
          </button>
          <button className={styles.btn} onClick={autoGenerateRoutes}>Auto</button>
          <button className={styles.btn} onClick={() => setTradeRoutes([])}>Clear</button>
        </div>

        {/* Wormholes */}
        <div className={styles.sectionHeader}>Wormholes</div>
        {wormholes.map(wh => (
          <div key={wh.id} className={styles.listItem}>
            <div className={styles.listItemInfo}>
              <span className={styles.listItemDot} style={{ background: wh.color }} />
              <span className={styles.listItemName}>{wh.name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className={styles.listItemMeta}>{wh.stable ? 'Stable' : 'Unstable'}</span>
              <span className={styles.listItemDelete} onClick={() => deleteWormhole(wh.id)}>×</span>
            </div>
          </div>
        ))}
        {wormholes.length === 0 && <div className={styles.emptyState}>No wormholes</div>}
        <div className={styles.btnRow} style={{ marginTop: 8 }}>
          <button
            className={`${styles.btn} ${wormholeDrawing.active ? styles.active : ''}`}
            onClick={() => {
              if (wormholeDrawing.active) {
                setWormholeDrawing({ active: false, firstStar: null });
                setStatusText('Mapped');
              } else {
                startWormholeDrawing();
              }
            }}
          >
            {wormholeDrawing.active ? 'Cancel' : '+ Draw'}
          </button>
          <button className={styles.btn} onClick={autoGenerateWormholes}>Auto</button>
          <button className={styles.btn} onClick={() => setWormholes([])}>Clear</button>
        </div>

        {/* Galactic Nucleus */}
        <div className={styles.sectionHeader}>Galactic Nucleus</div>
        {blackHole ? (
          <>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}><span>Name</span></div>
              <input
                type="text"
                className={styles.textInput}
                value={blackHole.name}
                onChange={e => setBlackHole(prev => prev ? { ...prev, name: e.target.value } : prev)}
              />
            </div>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}>
                <span>Mass</span>
                <span className={styles.valueDisplay}>
                  {blackHole.mass >= 1000
                    ? `${(blackHole.mass / 1000).toFixed(1)}B M☉`
                    : `${blackHole.mass}M M☉`}
                </span>
              </div>
              <input
                type="range"
                className={styles.slider}
                min={0}
                max={100}
                step={1}
                value={Math.log10(Math.max(1, blackHole.mass)) * 25}
                onChange={e => {
                  const mass = Math.round(Math.pow(10, Number(e.target.value) / 25));
                  setBlackHole(prev => prev ? { ...prev, mass } : prev);
                }}
              />
            </div>
            <div className={styles.controlRow}>
              <div className={styles.controlLabel}><span>Activity</span></div>
              <select
                className={styles.select}
                value={blackHole.activity}
                onChange={e => {
                  const activity = e.target.value as NucleusActivity;
                  const cfg = SMBH_ACTIVITY_CONFIG[activity];
                  setBlackHole(prev => prev ? { ...prev, activity, accretionColor: cfg.color } : prev);
                }}
              >
                <option value="quiescent">Quiescent</option>
                <option value="active">Active Galactic Nucleus</option>
                <option value="quasar">Quasar</option>
              </select>
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>No central black hole</div>
        )}
        <div className={styles.btnRow} style={{ marginTop: 8 }}>
          {!blackHole && (
            <button className={styles.btn} onClick={() => setBlackHole({
              name: 'Galactic Core',
              x: 0,
              y: 0,
              mass: DEFAULT_SMBH_MASS,
              activity: 'quiescent',
              accretionColor: SMBH_ACTIVITY_CONFIG.quiescent.color,
            })}>Place at Center</button>
          )}
          {blackHole && (
            <button className={styles.btn} onClick={() => setBlackHole(null)}>Remove</button>
          )}
        </div>

        {/* Display */}
        <div className={styles.sectionHeader}>Display</div>
        <div className={styles.controlRow}>
          <div className={styles.controlLabel}>
            <span>Territory Opacity</span>
            <span className={styles.valueDisplay}>{display.territoryOpacity}%</span>
          </div>
          <input
            type="range"
            className={styles.slider}
            min={0}
            max={100}
            step={5}
            value={display.territoryOpacity}
            onChange={e => setDisplay(prev => ({ ...prev, territoryOpacity: Number(e.target.value) }))}
          />
        </div>
        <div className={styles.controlRow}>
          <div className={styles.controlLabel}><span>Territory Borders</span></div>
          <select
            className={styles.select}
            value={display.territoryBorderStyle}
            onChange={e => setDisplay(prev => ({ ...prev, territoryBorderStyle: e.target.value as DisplayConfig['territoryBorderStyle'] }))}
          >
            <option value="soft">Soft / Fuzzy</option>
            <option value="sharp">Sharp / Defined</option>
            <option value="none">No Borders</option>
          </select>
        </div>
        <div className={styles.btnRow}>
          <button
            className={`${styles.btn} ${display.showTerritories ? styles.active : ''}`}
            onClick={() => setDisplay(prev => ({ ...prev, showTerritories: !prev.showTerritories }))}
          >
            Territories
          </button>
          <button
            className={`${styles.btn} ${display.showRoutes ? styles.active : ''}`}
            onClick={() => setDisplay(prev => ({ ...prev, showRoutes: !prev.showRoutes }))}
          >
            Routes
          </button>
        </div>
        <div className={styles.btnRow} style={{ marginTop: 4 }}>
          <button
            className={`${styles.btn} ${display.showHabitableIndicators ? styles.active : ''}`}
            onClick={() => setDisplay(prev => ({ ...prev, showHabitableIndicators: !prev.showHabitableIndicators }))}
          >
            Habitable Rings
          </button>
        </div>

        {/* Export */}
        <div className={styles.sectionHeader}>Export</div>
        <div className={styles.btnRow}>
          <button className={styles.btn} onClick={() => {
            const canvas = canvasRef.current;
            if (canvas) exportPNG(canvas, galaxyName, () => render());
          }}>PNG</button>
          <button className={styles.btn} onClick={() => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            exportSVG({
              width: canvas.width,
              height: canvas.height,
              galaxyName,
              stars,
              backgroundStars,
              empires,
              tradeRoutes,
              wormholes,
              blackHole,
              camera,
              display,
              worldToScreen
            });
          }}>SVG</button>
        </div>
        <div className={styles.btnRow} style={{ marginTop: 4 }}>
          <button className={styles.btn} onClick={() => exportJSON(galaxyName, config, empires, tradeRoutes, wormholes, stars, blackHole)}>JSON</button>
          <button className={styles.btn} onClick={() => exportMarkdown(galaxyName, config, empires, tradeRoutes, wormholes, stars, blackHole)}>Markdown</button>
        </div>

        {/* Publish to World */}
        {worldId && (
          <>
            <div className={styles.sectionHeader}>Publish to World</div>
            <button
              className={`${styles.btn} ${styles.publish}`}
              onClick={() => setPublishDialogOpen(true)}
            >
              &#9671; {selectedStar ? `Publish "${selectedStar.name}"` : 'Publish Galaxy'}
            </button>
            {selectedStar && (
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.35)', marginTop: 4, letterSpacing: '0.5px' }}>
                Deselect star to publish entire galaxy
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════ DATA PANEL ═══════════════════ */}
      <div className={styles.dataPanel}>
        <div className={styles.sectionHeader}>Selected Star</div>
        {selectedStar ? (
          <div className={styles.selectedStar}>
            <div className={styles.selectedStarName}>{selectedStar.name}</div>
            <span
              className={styles.starClass}
              style={{
                background: hexToRgba(STAR_TYPES[selectedStar.type].color, 0.15),
                border: `1px solid ${hexToRgba(STAR_TYPES[selectedStar.type].color, 0.3)}`,
                color: STAR_TYPES[selectedStar.type].color
              }}
            >
              Class {selectedStar.type}
            </span>
            <div className={styles.dataRow}>
              <span className={styles.dataLabel}>Temperature</span>
              <span className={styles.dataValue}>{STAR_TYPES[selectedStar.type].temp}</span>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.dataLabel}>Mass</span>
              <span className={styles.dataValue}>{STAR_TYPES[selectedStar.type].mass}</span>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.dataLabel}>Habitable</span>
              <span className={`${styles.dataValue} ${selectedStar.hasHabitable ? styles.green : ''}`}>
                {selectedStar.hasHabitable ? 'Yes' : 'No'}
              </span>
            </div>
            <div className={styles.dataRow}>
              <span className={styles.dataLabel}>Sovereignty</span>
              <span className={styles.dataValue} style={selectedStar.empire ? { color: selectedStar.empire.color } : undefined}>
                {selectedStar.empire?.name || 'Unclaimed'}
              </span>
            </div>
            <div className={styles.renameRow}>
              <input
                type="text"
                className={styles.input}
                value={renameInput}
                onChange={e => setRenameInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') renameStar(renameInput); }}
                placeholder="Rename star..."
              />
              <button className={`${styles.btn} ${styles.primary}`} onClick={() => renameStar(renameInput)}>Set</button>
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>Click a star to view details</div>
        )}

        <div className={styles.sectionHeader} style={{ marginTop: 16 }}>Statistics</div>
        <div className={styles.dataRow}>
          <span className={styles.dataLabel}>Total Stars</span>
          <span className={`${styles.dataValue} ${styles.cyan}`}>{stars.length.toLocaleString()}</span>
        </div>
        <div className={styles.dataRow}>
          <span className={styles.dataLabel}>Named Systems</span>
          <span className={styles.dataValue}>{namedSystems.toLocaleString()}</span>
        </div>
        <div className={styles.dataRow}>
          <span className={`${styles.dataLabel}`}>Habitable</span>
          <span className={`${styles.dataValue} ${styles.green}`}>{habitableCount.toLocaleString()}</span>
        </div>
        <div className={styles.dataRow}>
          <span className={styles.dataLabel}>Trade Routes</span>
          <span className={`${styles.dataValue} ${styles.orange}`}>{tradeRoutes.length}</span>
        </div>
        <div className={styles.dataRow}>
          <span className={styles.dataLabel}>Wormholes</span>
          <span className={styles.dataValue} style={{ color: '#E056FD' }}>{wormholes.length}</span>
        </div>

        <div className={styles.sectionHeader} style={{ marginTop: 16 }}>Spectral Classes</div>
        <div className={styles.spectralLegend}>
          <div className={styles.spectralItem}><span className={styles.spectralDot} style={{ background: '#9BB0FF' }} />O</div>
          <div className={styles.spectralItem}><span className={styles.spectralDot} style={{ background: '#AABFFF' }} />B</div>
          <div className={styles.spectralItem}><span className={styles.spectralDot} style={{ background: '#CAD7FF' }} />A</div>
          <div className={styles.spectralItem}><span className={styles.spectralDot} style={{ background: '#F8F7FF' }} />F</div>
          <div className={styles.spectralItem}><span className={styles.spectralDot} style={{ background: '#FFF4EA' }} />G</div>
          <div className={styles.spectralItem}><span className={styles.spectralDot} style={{ background: '#FFD2A1' }} />K</div>
          <div className={styles.spectralItem}><span className={styles.spectralDot} style={{ background: '#FFAA6F' }} />M</div>
        </div>

        <div className={styles.sectionHeader} style={{ marginTop: 16 }}>Indicators</div>
        <div className={styles.spectralLegend}>
          <div className={styles.spectralItem}>
            <span className={styles.spectralDot} style={{ background: 'transparent', border: '1.5px solid #2ECC71' }} />
            Habitable
          </div>
          <div className={styles.spectralItem}>
            <span className={styles.spectralDot} style={{ background: 'transparent', border: '1.5px solid #15C17B' }} />
            Selected
          </div>
        </div>
      </div>

      {/* ═══════════════════ ZOOM PANEL ═══════════════════ */}
      <div className={styles.zoomPanel}>
        <div className={styles.zoomValue}>{camera.zoom.toFixed(2)}×</div>
        <div className={styles.zoomLabel}>Zoom</div>
        <div className={styles.controlsHint}>Drag: orbit · Shift+drag: pan · Scroll: zoom · F: search · R: auto-rotate · Home: reset</div>
      </div>

      {/* ═══════════════════ TOOLTIP ═══════════════════ */}
      {hoveredStar && !isDraggingRef.current && (() => {
        const pos = worldToScreen(hoveredStar.x, hoveredStar.y, hoveredStar.z);
        return (
          <div
            className={`${styles.tooltip} ${styles.visible}`}
            style={{ left: pos.screenX + 15, top: pos.screenY - 10 }}
          >
            <div className={styles.tooltipName} style={{ color: hoveredStar.empire?.color || '#FAFAFA' }}>
              {hoveredStar.name}
            </div>
            <div className={styles.tooltipClass}>Class {hoveredStar.type} · {STAR_TYPES[hoveredStar.type].temp}</div>
            {hoveredStar.empire && (
              <div className={styles.tooltipEmpire} style={{ color: hoveredStar.empire.color }}>
                {hoveredStar.empire.name}
              </div>
            )}
          </div>
        );
      })()}

      {/* ═══════════════════ MODE INDICATORS ═══════════════════ */}
      {routeDrawing.active && (
        <div className={styles.modeIndicator}>
          Click stars · Z to undo · ESC to finish
        </div>
      )}
      {wormholeDrawing.active && (
        <div className={`${styles.modeIndicator} ${styles.wormhole}`}>
          {wormholeDrawing.firstStar ? 'Click second star to connect' : 'Click two stars to connect'}
        </div>
      )}

      {/* ═══════════════════ LOADING OVERLAY ═══════════════════ */}
      {isGenerating && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner} />
          <div className={styles.loadingText}>GENERATING GALAXY</div>
          <div className={styles.loadingSubtext}>{config.starCount.toLocaleString()} stars</div>
        </div>
      )}

      {/* ═══════════════════ STAR SEARCH ═══════════════════ */}
      {searchOpen && (
        <div className={styles.searchPanel}>
          <div className={styles.searchHeader}>
            <span className={styles.searchTitle}>FIND STAR</span>
            <button className={styles.searchClose} onClick={() => { setSearchOpen(false); setSearchQuery(''); }}>×</button>
          </div>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by name..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoFocus
          />
          {searchResults.length > 0 && (
            <div className={styles.searchResults}>
              {searchResults.map(star => (
                <button
                  key={star.id}
                  type="button"
                  className={styles.searchResultItem}
                  onClick={() => focusStar(star)}
                >
                  <span className={styles.searchResultDot} style={{ background: star.color }} />
                  <span className={styles.searchResultName}>{star.name}</span>
                  <span className={styles.searchResultMeta}>
                    {star.type} · {star.empire?.name || 'Unclaimed'}
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchQuery.length >= 2 && searchResults.length === 0 && (
            <div className={styles.searchEmpty}>No stars found</div>
          )}
          <div className={styles.searchHint}>Press F to toggle · ESC to close</div>
        </div>
      )}

      {/* ═══════════════════ MINIMAP ═══════════════════ */}
      <canvas
        ref={minimapRef}
        className={styles.minimap}
        width={MINIMAP_SIZE}
        height={MINIMAP_SIZE}
      />

      {/* ═══════════════════ CREDITS ═══════════════════ */}
      <div className={styles.credits}>
        © 2025–2026 Jason D. Batt, Ph.D. · <a href="https://stellarforge.tools" target="_blank" rel="noopener noreferrer">stellarforge.tools</a>
      </div>

      {/* ═══════════════════ PUBLISH TO WORLD DIALOG ═══════════════════ */}
      <PublishToWorldDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        payload={publishDialogOpen ? buildPublishPayload() : null}
        worldId={worldId}
        simulatorType="stellar-cartographer"
      />
    </div>
  );
};

export default StellarCartographer;
