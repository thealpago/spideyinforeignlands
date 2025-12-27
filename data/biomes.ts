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
      colorSpace: '#4a5e6a',
      colorHorizon: '#6e7a88',
      colorSun: '#dbeeff',
      lightIntensity: 4.5,
      sunElevation: 0.8,
      sunAzimuth: 0.5,
      autoRotate: false,
      distortionStrength: 0.1,
      dustOpacity: 0,
      dustSpeed: 0,
      dustCount: 0,
      dustRadius: 0,
      dustColor: '#000000',
      cloudColor: '#2b3035',
      cloudOpacity: 0.9,
      cloudCount: 40,
      cloudAltitude: 50,
      cloudSpeed: 0.5,
      terrainColor: '#5a5a5a',
      terrainType: 'rain'
    }
  },
  {
    id: 'millers',
    name: 'Miller\'s Planet',
    config: {
      colorSpace: '#bfd1e5',
      colorHorizon: '#aaccff',
      colorSun: '#ffffff',
      lightIntensity: 2.5,
      sunElevation: 0.35,
      sunAzimuth: 0.2,
      autoRotate: true,
      hasBlackHole: false,
      distortionStrength: 0.3,
      dustOpacity: 0.2,
      dustSpeed: 0.1,
      dustCount: 200,
      dustRadius: 60,
      dustColor: '#ffffff',
      cloudColor: '#ffffff',
      cloudOpacity: 0.5,
      cloudCount: 20,
      cloudAltitude: 60,
      cloudSpeed: 0.08,
      terrainColor: '#005577',
      terrainType: 'water_planet'
    }
  },
  {
    id: 'grass',
    name: 'Grass Terrain',
    config: {
      colorSpace: '#87CEEB',
      colorHorizon: '#c3e8bd',
      colorSun: '#ffffff',
      lightIntensity: 3.5,
      sunElevation: 0.6,
      sunAzimuth: 0.1,
      autoRotate: false,
      distortionStrength: 0.1,
      dustOpacity: 0.3,
      dustSpeed: 0.1,
      dustCount: 300,
      dustRadius: 50,
      dustColor: '#ffffff',
      cloudColor: '#ffffff',
      cloudOpacity: 0.9,
      cloudCount: 15,
      cloudAltitude: 50,
      cloudSpeed: 0.05,
      terrainColor: '#2d4c1e',
      terrainType: 'grass'
    }
  },
  {
    id: 'mars',
    name: 'Mars Surface',
    config: {
      colorSpace: '#4a2517',
      colorHorizon: '#c97d5d',
      colorSun: '#ffccaa',
      sunElevation: 0.15,
      sunAzimuth: 0.0,
      autoRotate: false,
      distortionStrength: 0.4,
      dustOpacity: 0.8,
      dustSpeed: 2.5,
      dustCount: 4000,
      dustRadius: 80,
      dustColor: '#e3ae8f',
      cloudColor: '#e0b596',
      cloudOpacity: 0.4,
      cloudCount: 6,
      cloudAltitude: 60,
      cloudSpeed: 0.2,
      terrainColor: '#b44d28',
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
  },
  {
    id: 'antarctica',
    name: 'Antarctica',
    config: {
      colorSpace: '#a0c4ff',
      colorHorizon: '#ffffff',
      colorSun: '#ffffff',
      lightIntensity: 4.5,
      sunElevation: 0.1,
      sunAzimuth: 1.5,
      autoRotate: false,
      distortionStrength: 0.05,
      dustOpacity: 0,
      dustSpeed: 0,
      dustCount: 0,
      dustRadius: 0,
      dustColor: '#ffffff',
      cloudColor: '#ffffff',
      cloudOpacity: 0.8,
      cloudCount: 30,
      cloudAltitude: 40,
      cloudSpeed: 0.02,
      terrainColor: '#ffffff',
      terrainType: 'antarctica'
    }
  }
];