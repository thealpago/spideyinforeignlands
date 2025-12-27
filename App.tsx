import React, { useState, useRef, useMemo, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { Vector3, MOUSE, PCFSoftShadowMap } from 'three';

// Components
import Spider from './components/Spider';
import GSpider from './components/GSpider';
import Vehicle4x4 from './components/Vehicle4x4';
import OldVehicle4x4 from './components/Vehicle4x4'; // Remapping old one if needed
// @ts-ignore
import Vehicle from './components/scene/vehicles/Vehicle';
import { HoverSphere } from './components/HoverSphere';
import { InfinitySphere } from './components/InfinitySphere';
import { Tardis } from './components/Tardis';
import Terrain from './components/Terrain';
import Background from './components/Background';
import { Physics, RigidBody, CuboidCollider } from '@react-three/rapier';
import { DustParticles } from './components/DustParticles';
import { Clouds } from './components/Clouds';
import Overlay from './components/Overlay';
import { TargetMarker } from './components/TargetMarker';
import { AmbientSound } from './components/AmbientSound';
import { DynamicShadowLight } from './components/DynamicShadowLight';

// Input store - klavye/gamepad kontrolü için gerekli
// @ts-ignore
import useInputStore from './store/inputStore';

// Types & Utils
import { BgConfig, VisualConfig, PhysicsConfig, SphereConfig } from './types';
import { getTerrainHeight } from './utils/helpers';
import { BIOMES } from './data/biomes';
import { SPIDER_CONFIG } from './config';
import vehicleConfigs from './vehicleConfigs';
import { VehicleConfig } from './types';

type CharacterType = 'spider' | 'hover_sphere' | 'tardis' | 'g_spidey' | 'infinity_sphere' | '4x4';

// --- SOUNDS ---
const REVEAL_SOUND_URL = "";
const ACQUIRE_SOUND_URL = "";

// --- DEFAULT CONFIGURATIONS ---

const DEFAULT_PHYSICS: PhysicsConfig = {
  speed: SPIDER_CONFIG.SPEED,
  turnSpeed: SPIDER_CONFIG.TURN_SPEED,
  bodyHeight: SPIDER_CONFIG.BODY_HEIGHT,
  stepHeight: SPIDER_CONFIG.STEP_HEIGHT,
  stepDuration: SPIDER_CONFIG.STEP_DURATION,
  gaitThreshold: SPIDER_CONFIG.GAIT_THRESHOLD,
  gaitRecovery: SPIDER_CONFIG.GAIT_RECOVERY,
  maxActiveSteps: SPIDER_CONFIG.MAX_ACTIVE_STEPS,
  frontLegReach: 0.6,
  frontLegSpread: 0.8,
  frontLegStepDurationMult: 0.9,
  frontLegGaitThresholdMult: 0.9,
  abdomenScale: 1.2,
  hullScale: 1.0,
};

const DEFAULT_SPIDEY_VISUALS: VisualConfig = {
  showBody: true,
  showPlating: true,
  platingOpacity: 0.9,
  spiderHeadColor: "#222222",
  spiderBodyColor: "#1a1a20",
  spiderLegColor: "#1a1a20",
  spiderPlateColor: "#ff6600",
  jointGlowColor: "#00ccff",
  faceLightColor: "#ff0044",
  faceLightIntensity: 20,
  faceLightDistance: 34,
  faceLightAngle: 0.95,
  faceLightPenumbra: 0.8,
};

const DEFAULT_GSPIDEY_VISUALS: VisualConfig = {
  showBody: true,
  showPlating: false, // G-Spidey defaults to no plating
  platingOpacity: 1.0,
  spiderHeadColor: "#003b6f", // Tardis Blue
  spiderBodyColor: "#003b6f",
  spiderLegColor: "#111111",
  spiderPlateColor: "#ffffff",
  jointGlowColor: "#ffaa00", // Amber
  faceLightColor: "#ffffff", // White Headlight
  faceLightIntensity: 20,
  faceLightDistance: 34,
  faceLightAngle: 0.95,
  faceLightPenumbra: 0.8,
};

const DEFAULT_SPHERE_CONFIG: SphereConfig = {
  radius: 5.0,
  color: "#00ffff",
  wireframe: true,
  useRainbow: true,
  glowIntensity: 0.5
};

// --- HELPER: LocalStorage Hook ---
function useStickyState<T>(defaultValue: T, key: string): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stickyValue = window.localStorage.getItem(key);
    return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
  });

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

/**
 * Klavye Event Handler Bileşeni
 * Bu bileşen klavye girdilerini dinler ve store'a aktarır
 */
const KeyboardHandler = () => {
  useEffect(() => {
    const { setKey } = (useInputStore as any).getState()

    const handleKeyDown = (e: KeyboardEvent) => {
      setKey(e.key, true)
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      setKey(e.key, false)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return null
}

const App: React.FC = () => {
  const [target, setTarget] = useState<Vector3>(new Vector3(0, 0, 10));

  // Character Selection State
  const [character, setCharacter] = useState<CharacterType>('spider');

  // Environment Configuration State
  const [bgConfig, setBgConfig] = useState<BgConfig>(
    BIOMES.find(b => b.id === 'desert')?.config || BIOMES[0].config
  );

  // Initialize marker based on initial height
  const [marker, setMarker] = useState<Vector3>(
    new Vector3(0, getTerrainHeight(0, 10, bgConfig.terrainType), 10)
  );

  const [isLocked, setIsLocked] = useState(true);
  const [isMoving, setIsMoving] = useState(false);

  // Track previous moving state to detect "Stop" event
  const wasMoving = useRef(false);

  useEffect(() => {
    // If we just stopped moving (transition from true -> false)
    if (wasMoving.current && !isMoving) {
      const audio = new Audio(REVEAL_SOUND_URL);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn("Reveal audio prevented:", e));
    }
    wasMoving.current = isMoving;
  }, [isMoving]);

  // SHARED POSITION REF
  const characterPosRef = useRef<Vector3>(new Vector3(0, 5, 0));

  // --- PERSISTENT CONFIGURATIONS (SEPARATED) ---

  // 1. Classic Spidey Configs
  const [spideyVisuals, setSpideyVisuals] = useStickyState<VisualConfig>(DEFAULT_SPIDEY_VISUALS, 'spidey_visuals_v2');
  const [spideyPhysics, setSpideyPhysics] = useStickyState<PhysicsConfig>(DEFAULT_PHYSICS, 'spidey_physics_v2');

  // 2. G-Spidey Configs
  const [gSpideyVisuals, setGSpideyVisuals] = useStickyState<VisualConfig>(DEFAULT_GSPIDEY_VISUALS, 'g_spidey_visuals_v2');
  const [gSpideyPhysics, setGSpideyPhysics] = useStickyState<PhysicsConfig>(DEFAULT_PHYSICS, 'g_spidey_physics_v2');

  // 3. Infinity Sphere Config
  const [sphereConfig, setSphereConfig] = useStickyState<SphereConfig>(DEFAULT_SPHERE_CONFIG, 'sphere_config_v1');

  // 4. Vehicle Config
  const [vehicleConfig, setVehicleConfig] = useStickyState<VehicleConfig>(vehicleConfigs.defaults, 'vehicle_config_v1');

  // 5. Resolve Current Active Config for RENDER (Spider components use this)
  const activeVisualConfig = character === 'g_spidey' ? gSpideyVisuals : spideyVisuals;
  const activePhysicsConfig = character === 'g_spidey' ? gSpideyPhysics : spideyPhysics;

  // Ref to track mouse position
  const mousePosRef = useRef<Vector3>(new Vector3(0, 0, 10));
  const controlsRef = useRef<any>(null);

  // Auto-Rotation Logic
  useEffect(() => {
    if (!bgConfig.autoRotate) return;

    let animationFrameId: number;
    const animate = () => {
      setBgConfig(prev => ({
        ...prev,
        sunAzimuth: (prev.sunAzimuth + 0.0005) % (Math.PI * 2)
      }));
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [bgConfig.autoRotate]);

  // Calculate Sun Direction Vector based on Azimuth/Elevation
  const sunDirection = useMemo(() => {
    const elevRad = bgConfig.sunElevation * (Math.PI / 2);
    const phi = bgConfig.sunAzimuth;

    // Spherical conversion
    const y = Math.sin(elevRad);
    const r = Math.cos(elevRad);
    const x = r * Math.sin(phi);
    const z = r * Math.cos(phi);

    return new Vector3(x, y, z).normalize();
  }, [bgConfig.sunElevation, bgConfig.sunAzimuth]);

  // Position the light far away in the calculated direction
  const sunLightPosition = useMemo(() => {
    return sunDirection.clone().multiplyScalar(100);
  }, [sunDirection]);

  return (
    <div className="relative w-full h-screen bg-[#020205] overflow-hidden">
      {/* Klavye handler - Canvas dışında */}
      <KeyboardHandler />

      {/* 2D UI Overlay */}
      <Overlay
        target={target}
        marker={marker}
        config={bgConfig}
        onConfigChange={setBgConfig}
        isLocked={isLocked}
        onLockToggle={() => setIsLocked(!isLocked)}

        // Pass ALL separate config states to the overlay panel
        spideyVisuals={spideyVisuals}
        setSpideyVisuals={setSpideyVisuals}
        spideyPhysics={spideyPhysics}
        setSpideyPhysics={setSpideyPhysics}

        gSpideyVisuals={gSpideyVisuals}
        setGSpideyVisuals={setGSpideyVisuals}
        gSpideyPhysics={gSpideyPhysics}
        setGSpideyPhysics={setGSpideyPhysics}

        // Pass Sphere Config
        sphereConfig={sphereConfig}
        setSphereConfig={setSphereConfig}

        // Pass generic active config for fallback characters (Tardis etc)
        activeVisualConfig={activeVisualConfig}
        onVisualConfigChange={(v) => character === 'g_spidey' ? setGSpideyVisuals(v) : setSpideyVisuals(v)}
        activePhysicsConfig={activePhysicsConfig}
        onPhysicsConfigChange={(p) => character === 'g_spidey' ? setGSpideyPhysics(p) : setSpideyPhysics(p)}

        onCharacterChange={setCharacter}

        // Vehicle Config
        vehicleConfig={vehicleConfig}
        setVehicleConfig={setVehicleConfig}

        character={character}
      />

      {/* Audio Manager */}
      <AmbientSound terrainType={bgConfig.terrainType} />

      <Canvas
        shadows={{ type: PCFSoftShadowMap }} // Soft shadows to reduce blockiness
        dpr={[1, 1.5]} // Clamp pixel ratio for high-dpi screens to save GPU
        gl={{ antialias: true, toneMappingExposure: 1.1 }}
      >
        <PerspectiveCamera makeDefault position={[25, 20, 25]} fov={40} />

        {/* Fog blended with the dynamic horizon color */}
        <fog attach="fog" args={[bgConfig.colorHorizon, 50, 900]} />

        {/* Background Atmosphere Shader */}
        <Background
          colorSpace={bgConfig.colorSpace}
          colorHorizon={bgConfig.colorHorizon}
          colorSun={bgConfig.colorSun}
          sunDirection={sunDirection}
          distortionStrength={bgConfig.distortionStrength}
          hasBlackHole={bgConfig.hasBlackHole}
        />

        {/* Ambient Fill */}
        <hemisphereLight
          args={[bgConfig.colorHorizon, bgConfig.colorSpace, 0.8]}
        />

        {/* Main Key Light - Dynamically follows character for consistent shadows */}
        <DynamicShadowLight
          characterPosRef={characterPosRef}
          sunDirection={sunDirection}
          intensity={bgConfig.lightIntensity ?? 2.5}
          color={bgConfig.colorSun}
        />

        {/* Infinite Terrain System / Background Elements */}
        <group
          onClick={(e: any) => {
            if (e.button === 0) {
              e.stopPropagation();
              const point = e.point;
              setTarget(point);
              setMarker(point);

              const audio = new Audio(ACQUIRE_SOUND_URL);
              audio.volume = 0.3;
              audio.play().catch(e => console.warn("Acquire audio prevented:", e));
            }
          }}
          onPointerMove={(e: any) => {
            e.stopPropagation();
            mousePosRef.current.copy(e.point);
          }}
        >
          <Terrain
            color={bgConfig.terrainColor}
            type={bgConfig.terrainType}
            characterPosRef={characterPosRef}
          />
        </group>

        {/* Physics World: Wraps Everything that interacts physically */}
        <Physics gravity={[0, -9.81, 0]}>
          {/* Static Ground Collider */}
          <RigidBody type="fixed" colliders={false}>
            <CuboidCollider args={[1000, 2, 1000]} position={[0, -2, 0]} />
          </RigidBody>

          {/* 4x4 Vehicle Character */}
          <Suspense fallback={null}>
            {character === '4x4' && (
              <Vehicle
                {...vehicleConfig}
                onMoveStateChange={setIsMoving}
                isLocked={isLocked}
                controlsRef={controlsRef}
                terrainType={bgConfig.terrainType}
              />
            )}
          </Suspense>
        </Physics>

        {/* Atmospheric Dust */}
        <DustParticles
          opacity={bgConfig.dustOpacity}
          speed={bgConfig.dustSpeed}
          count={bgConfig.dustCount}
          color={bgConfig.dustColor}
          radius={bgConfig.dustRadius}
        />

        {/* Cloud Layers */}
        <Clouds
          color={bgConfig.cloudColor}
          opacity={bgConfig.cloudOpacity}
          count={bgConfig.cloudCount}
          altitude={bgConfig.cloudAltitude}
          speed={bgConfig.cloudSpeed}
        />



        {/* Main Character Swapper */}
        <Suspense fallback={null}>
          {character === 'spider' ? (
            <Spider
              key="spider"
              target={target}
              mousePosRef={mousePosRef}
              onMoveStateChange={setIsMoving}
              isLocked={isLocked}
              controlsRef={controlsRef}
              visualConfig={activeVisualConfig}
              physicsConfig={activePhysicsConfig}
              terrainType={bgConfig.terrainType}
              sharedPosRef={characterPosRef}
            />
          ) : character === 'g_spidey' ? (
            <GSpider
              key="g_spidey"
              target={target}
              mousePosRef={mousePosRef}
              onMoveStateChange={setIsMoving}
              isLocked={isLocked}
              controlsRef={controlsRef}
              visualConfig={activeVisualConfig}
              physicsConfig={activePhysicsConfig}
              terrainType={bgConfig.terrainType}
              sharedPosRef={characterPosRef}
            />
          ) : character === '4x4' ? null : character === 'infinity_sphere' ? (
            <InfinitySphere
              target={target}
              onMoveStateChange={setIsMoving}
              isLocked={isLocked}
              controlsRef={controlsRef}
              sharedPosRef={characterPosRef}
              terrainType={bgConfig.terrainType}
              config={sphereConfig}
            />
          ) : character === 'hover_sphere' ? (
            <HoverSphere
              target={target}
              onMoveStateChange={setIsMoving}
              isLocked={isLocked}
              controlsRef={controlsRef}
              sharedPosRef={characterPosRef}
            />
          ) : (
            <Tardis
              target={target}
              onMoveStateChange={setIsMoving}
              isLocked={isLocked}
              controlsRef={controlsRef}
              sharedPosRef={characterPosRef}
            />
          )}
        </Suspense>

        {/* Target Marker Visual */}
        {isMoving && <TargetMarker position={marker} />}

        <OrbitControls
          ref={controlsRef}
          maxPolarAngle={Math.PI / 2 - 0.05}
          minDistance={10}
          maxDistance={500}
          enablePan={!isLocked}
          autoRotate={false}
          enableDamping={true}
          dampingFactor={0.05}
          target={[0, 0, 0]}
          mouseButtons={{
            LEFT: -1 as any,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.ROTATE
          }}
        />
      </Canvas>
    </div>
  );
};

export default App;