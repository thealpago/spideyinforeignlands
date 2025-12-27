import { BgConfig } from '../types';

interface BiomeData {
  id: string;
  name: string;
  config: BgConfig;
}

export const BIOMES: BiomeData[] = [
  {
    id: 'desert',
    name: 'Sahara',
    config: {
      colorSpace: '#87CEEB',
      colorHorizon: '#f5deb3',
      colorSun: '#ffffff',
      // Lower elevation to see sun in view (approx 18 degrees)
      sunElevation: 0.2,
      sunAzimuth: 0.0,
      autoRotate: false,
      distortionStrength: 0.2,
      dustOpacity: 0.3,
      dustSpeed: 0.2,
      dustCount: 200,
      dustRadius: 50,
      dustColor: '#f5deb3',
      cloudColor: '#ffffff',
      cloudOpacity: 0.8,
      cloudCount: 8,
      cloudAltitude: 40,
      cloudSpeed: 0.05,
      terrainColor: '#d2a679',
      terrainType: 'sand'
    }
  },
  {
    id: 'rainland',
    name: 'RainLand',
    config: {
      colorSpace: '#4a5e6a', // Lighter storm blue-grey
      colorHorizon: '#6e7a88', // Lighter slate horizon
      colorSun: '#dbeeff',     // Bright cold light
      lightIntensity: 4.5,     // Increased intensity
      sunElevation: 0.8,       // High overhead (overcast)
      sunAzimuth: 0.5,
      autoRotate: false,
      distortionStrength: 0.1,
      dustOpacity: 0,          // Use RainParticles instead
      dustSpeed: 0,
      dustCount: 0,
      dustRadius: 0,
      dustColor: '#000000',
      cloudColor: '#2b3035',   // Darkish storm clouds, but visible
      cloudOpacity: 0.9,
      cloudCount: 40,          // Dense clouds
      cloudAltitude: 50,
      cloudSpeed: 0.5,         // Fast moving storm
      terrainColor: '#5a5a5a', // Brighter grey rock so it captures light better
      terrainType: 'rain'
    }
  },
  {
    id: 'millers',
    name: 'Miller\'s Planet',
    config: {
      colorSpace: '#bfd1e5',   // Hazy Sky Blue (Replaces Black Void)
      colorHorizon: '#aaccff', // Light Blue Horizon (Replaces Black Horizon)
      colorSun: '#ffffff',     // Bright White Sun
      lightIntensity: 2.5,     // Normal daylight intensity
      sunElevation: 0.35,      // Mid-day
      sunAzimuth: 0.2,
      autoRotate: true,        // Slow rotation
      hasBlackHole: false,     // DISABLED: Removes 3D Model
      distortionStrength: 0.3, // High heat/water haze
      dustOpacity: 0.2,        // Light Mist
      dustSpeed: 0.1,
      dustCount: 200,          // Atmospheric particles
      dustRadius: 60,
      dustColor: '#ffffff',
      cloudColor: '#ffffff',   // Restore Clouds
      cloudOpacity: 0.5,
      cloudCount: 20,
      cloudAltitude: 60,
      cloudSpeed: 0.08,
      terrainColor: '#005577', // Deep Ocean Blue
      terrainType: 'water_planet'
    }
  },
  {
    id: 'grass',
    name: 'Grass Terrain',
    config: {
      colorSpace: '#87CEEB',   // Sky Blue
      colorHorizon: '#c3e8bd', // Light Green Horizon
      colorSun: '#ffffff',     // White Sun
      lightIntensity: 3.5,     // Bright Daylight
      sunElevation: 0.6,       // High Sun
      sunAzimuth: 0.1,
      autoRotate: false,
      distortionStrength: 0.1, // Clear air
      dustOpacity: 0.3,        // Pollen/Seeds
      dustSpeed: 0.1,
      dustCount: 300,
      dustRadius: 50,
      dustColor: '#ffffff',    // White specs
      cloudColor: '#ffffff',   // White fluffy clouds
      cloudOpacity: 0.9,
      cloudCount: 15,
      cloudAltitude: 50,
      cloudSpeed: 0.05,
      terrainColor: '#2d4c1e', // Dark Green Ground (Base)
      terrainType: 'grass'
    }
  },
  {
    id: 'mars',
    name: 'Mars Surface',
    config: {
      colorSpace: '#4a2517', // Dark reddish brown space/upper sky
      colorHorizon: '#c97d5d', // Dusty orange horizon
      colorSun: '#ffccaa',     // Pale yellowish sun
      // Mars sun is smaller and further, often lower in visual perception
      sunElevation: 0.15,
      sunAzimuth: 0.0,
      autoRotate: false,
      distortionStrength: 0.4, // Heat haze
      dustOpacity: 0.8,        // High visibility
      dustSpeed: 2.5,          // Fast wind
      dustCount: 4000,         // Dense atmosphere
      dustRadius: 80,          // Wide radius
      dustColor: '#e3ae8f',    // Lighter dust color to stand out against ground
      cloudColor: '#e0b596',   // Dust clouds
      cloudOpacity: 0.4,
      cloudCount: 6,
      cloudAltitude: 60,
      cloudSpeed: 0.2,
      terrainColor: '#b44d28', // Iron Oxide
      terrainType: 'mars'
    }
  },
  {
    id: 'moon',
    name: 'Lunar Base',
    config: {
      colorSpace: '#000000',
      colorHorizon: '#111111',
      colorSun: '#ffffff',
      sunElevation: 0.1,
      sunAzimuth: 0.1,
      autoRotate: false,
      distortionStrength: 0.0,
      dustOpacity: 0.1,
      dustSpeed: 0.05,
      dustCount: 50,
      dustRadius: 40,
      dustColor: '#ffffff',
      cloudColor: '#000000',
      cloudOpacity: 0,
      cloudCount: 0,
      cloudAltitude: 100,
      cloudSpeed: 0,
      terrainColor: '#888888',
      terrainType: 'moon'
    }
  },
  {
    id: 'for4x4',
    name: 'For 4x4',
    config: {
      colorSpace: '#ffccaa',
      colorHorizon: '#d2a679',
      colorSun: '#ffffff',
      sunElevation: 0.4,
      sunAzimuth: 0.2,
      autoRotate: false,
      distortionStrength: 0.15,
      dustOpacity: 0.4,
      dustSpeed: 0.3,
      dustCount: 500,
      dustRadius: 80,
      dustColor: '#e3ae8f',
      cloudColor: '#ffffff',
      cloudOpacity: 0.6,
      cloudCount: 5,
      cloudAltitude: 70,
      cloudSpeed: 0.03,
      terrainColor: '#c29260',
      terrainType: 'flat_desert'
    }
  }
];