import { Vector3 } from "three";

export type TerrainType = 'grid' | 'sand' | 'ice' | 'canyon' | 'crystal' | 'tech' | 'moon' | 'mars' | 'obsidian' | 'volcano' | 'oasis' | 'rain' | 'water_planet' | 'grass' | 'flat_desert' | 'antarctica';

export enum BiomeType {
  DESERT = 'DESERT',
  VOLCANIC = 'VOLCANIC',
  CYBERPUNK = 'CYBERPUNK'
}

export interface BiomeConfig {
  name: string;
  groundColor: string;
  skyColorTop: string;
  skyColorBottom: string;
  fogColor: string;
  fogDensity: number;
  lightColor: string;
  lightIntensity: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  image?: string;
  isError?: boolean;
}

export interface LegConfiguration {
  id: number;
  originOffset: Vector3; // Shoulder attachment point relative to body center
  restOffset: Vector3;   // Ideal foot position relative to body center (at rest)
  maxReach: number;
  l1: number;            // Coxa (Hip) length
  l2: number;            // Femur (Upper Leg) length
  l3: number;            // Tibia (Lower Leg) length
}

export interface LegState {
  currentPos: Vector3;      // Current world position of foot
  targetPos: Vector3;       // Target world position (if stepping) or current (if grounded)
  isStepping: boolean;
  stepProgress: number;     // 0.0 to 1.0
  stepStartPos: Vector3;    // World position where step began
  stepHeight: number;       // Calculated height for this specific step
  homePos: Vector3;         // The calculated "ideal" world position for this frame
}

export interface IKResult {
  shoulder: Vector3;
  elbow: Vector3;
  foot: Vector3;
  isValid: boolean;
}

export interface SpiderSimState {
  position: Vector3;
  velocity: Vector3;
  legs: LegState[];
  legConfigs: LegConfiguration[];
}

export interface SphereConfig {
  radius: number;
  color: string;
  wireframe: boolean;
  useRainbow: boolean; // Toggle meshNormalMaterial
  glowIntensity: number;
}

export interface VisualConfig {
  showBody: boolean;
  showPlating: boolean;
  platingOpacity: number;

  // Separate Paint Channels
  spiderHeadColor: string;
  spiderBodyColor: string;
  spiderLegColor: string;
  spiderPlateColor?: string; // NEW: Secondary plating color
  jointGlowColor?: string;   // NEW: Emissive joint color

  // Face Light / Sensors
  faceLightColor: string;
  faceLightIntensity: number;
  faceLightDistance: number;
  faceLightAngle: number;
  faceLightPenumbra: number;

  // New Features
  solarPanelsOpen?: boolean;
}

export interface VehicleConfig {
  body: string;
  color: string;
  roughness: number;
  lift: number;
  rim: string;
  rim_diameter: number;
  rim_width: number;
  rim_color: string;
  rim_color_secondary: string;
  tire: string;
  tire_diameter: number;
  tire_muddiness: number;
  addons: Record<string, string | boolean>;
  lighting: Record<string, any>;
}

export interface PhysicsConfig {
  // Movement
  speed: number;
  turnSpeed: number;
  bodyHeight: number;

  // Gait / Stepping
  stepHeight: number;
  stepDuration: number;
  gaitThreshold: number;
  gaitRecovery: number; // Velocity prediction
  maxActiveSteps: number;

  // Front Leg "Feelers" Tuning
  frontLegReach: number; // Z-offset (How far forward)
  frontLegSpread: number; // X-multiplier (How narrow)
  frontLegStepDurationMult: number; // Slower/Faster steps
  frontLegGaitThresholdMult: number; // More/Less permissive

  // Body Shape
  abdomenScale: number;
  hullScale: number; // NEW: Scale for the main sphere body
}

export interface BgConfig {
  colorSpace: string;
  colorHorizon: string;
  colorSun: string;
  sunElevation: number;
  sunAzimuth: number;
  autoRotate: boolean;
  hasBlackHole?: boolean; // NEW: Enables Black Hole visualization
  distortionStrength: number;
  lightIntensity?: number; // Optional light intensity override

  // Particulate System
  dustOpacity: number; // 0 to 1 (Alpha transparency)
  dustSpeed: number;   // Vertical/Horizontal flow speed
  dustCount: number;   // Number of active particles (Density)
  dustRadius: number;  // Range from camera (Volume size)
  dustColor: string;

  // Cloud System
  cloudColor: string;
  cloudOpacity: number;
  cloudCount: number;
  cloudAltitude: number;
  cloudSpeed: number;

  terrainColor: string;
  terrainType: TerrainType;
}

export interface SceneObject {
  x: number;
  z: number;
  yOffset: number;
  scale: number;
  rotation: number;
  visible: boolean;
}

// Define the Three elements interface
export interface ThreeElements {
  // Core
  mesh: any;
  group: any;
  primitive: any;
  points: any;
  instancedMesh: any;
  fog: any;
  fogExp2: any;

  // Geometries
  bufferGeometry: any;
  boxGeometry: any;
  cylinderGeometry: any;
  sphereGeometry: any;
  coneGeometry: any;
  ringGeometry: any;
  planeGeometry: any;
  torusGeometry: any;
  dodecahedronGeometry: any;
  icosahedronGeometry: any;
  circleGeometry: any;

  // Materials
  meshStandardMaterial: any;
  meshBasicMaterial: any;
  shaderMaterial: any;
  meshPhysicalMaterial: any;
  meshNormalMaterial: any;

  // Lights
  directionalLight: any;
  pointLight: any;
  spotLight: any;
  hemisphereLight: any;
  ambientLight: any;

  // Cameras
  orthographicCamera: any;
  perspectiveCamera: any;

  // Misc
  bufferAttribute: any;

  // Allow all other elements (including HTML divs, spans, buttons, etc.)
  [elemName: string]: any;
}

// Augment Global JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements { }
  }
  namespace React {
    namespace JSX {
      interface IntrinsicElements extends ThreeElements { }
    }
  }
}