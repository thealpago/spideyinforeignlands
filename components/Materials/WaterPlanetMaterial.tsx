import React, { useMemo, useRef } from 'react';
import { Color, Vector2 } from 'three';
import { useFrame } from '@react-three/fiber';

interface WaterPlanetMaterialProps {
  color: string;
  offset: [number, number];
}

export const WaterPlanetMaterial: React.FC<WaterPlanetMaterialProps> = ({ color, offset }) => {
  const materialRef = useRef<any>(null);
  const uniforms = useMemo(() => ({
    uColor: { value: new Color(color) },
    uTime: { value: 0 },
    uOffset: { value: new Vector2(offset[0], offset[1]) },
  }), []);

  useMemo(() => {
    uniforms.uColor.value.set(color);
    uniforms.uOffset.value.set(offset[0], offset[1]);
  }, [color, offset, uniforms]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uColor = uniforms.uColor;
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uOffset = uniforms.uOffset;
    materialRef.current = shader;

    // 1. Inject Varyings AND Uniforms for Vertex Shader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       uniform float uTime;
       uniform vec2 uOffset;
       varying vec3 vWaterWorldPosition;
       varying vec3 vWaterViewPosition;
       varying float vWaveHeight; // Pass wave height to fragment for coloring
       
       // Constants for Solitary "Wall" Wave
       float K_FREQ = 0.0015;   // Extremely low frequency (Wavelength ~4000 units)
       float S_SPEED = 0.15;    // Speed
       float SHARPNESS = 15.0;  // Extremely sharp peak to create a "Wall of Water"
       float WAVE_OFFSET = 12.0; // Push the base down so mostly flat water exists
       float AMP_SCALE = 2.5;    // Vertical multiplier
       
       // Function to calculate massive steep wave shape
       float getGiantWave(vec2 p, float t) {
           float x = p.x;
           float u = x * K_FREQ + t * S_SPEED;
           float wave = sin(u);
           
           // Exponential sharpening
           // Peak: exp(1 * 15 - 12) = exp(3) ~= 20.08
           // Scale: 20.08 * 2.5 ~= 50.2 (Max Height)
           // Trough: exp(-1 * 15 - 12) ~= 0 (Flat)
           
           float shape = exp(wave * SHARPNESS - WAVE_OFFSET);
           
           // FIX: Do not subtract 1.5 here. The base geometry is already at -1.5.
           // Adding displacement should start from 0 for flat water.
           return shape * AMP_SCALE; 
       }
       
       // Analytical derivative for steep normal recalculation
       float getWaveDerivative(vec2 p, float t) {
           float x = p.x;
           float u = x * K_FREQ + t * S_SPEED;
           float wave = sin(u);
           float shape = exp(wave * SHARPNESS - WAVE_OFFSET);
           
           // Chain Rule:
           // d/dx [ A * exp(sin(kx + wt)*S - O) ]
           // = A * exp(...) * (cos(kx + wt) * S) * k
           
           return (shape * AMP_SCALE) * (cos(u) * SHARPNESS) * K_FREQ;
       }
      `
    );

    // 2. Vertex Displacement
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
       vec3 transformed = vec3( position );
       
       // Get World Position (XZ) for seamless waves using uOffset
       vec2 worldPosXZ = transformed.xz + uOffset;
       
       float t = uTime;
       
       // Calculate Displacement using WORLD coordinates
       float waveHeight = getGiantWave(worldPosXZ, t);
       transformed.y += waveHeight;
       vWaveHeight = waveHeight;
       
       // RECALCULATE NORMALS
       // Since the wave is steep, normals are critical for 3D look
       float dydx = getWaveDerivative(worldPosXZ, t);
       
       // Tangent vector is (1, dy/dx, 0)
       // Normal is (-dy/dx, 1, 0) normalized
       vec3 newNormal = normalize(vec3(-dydx, 1.0, 0.0));
       
       vNormal = normalize(normalMatrix * newNormal);
       
       vec4 waterWorldPos = modelMatrix * vec4(transformed, 1.0);
       vWaterWorldPosition = waterWorldPos.xyz;
       
       vec4 waterMvPos = viewMatrix * waterWorldPos;
       vWaterViewPosition = -waterMvPos.xyz;
      `
    );

    // 3. Fragment Shader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform vec3 uColor;
       uniform float uTime;
       varying vec3 vWaterWorldPosition;
       varying vec3 vWaterViewPosition;
       varying float vWaveHeight;

       float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
       float noise(vec2 p) {
           vec2 i = floor(p);
           vec2 f = fract(p);
           f = f*f*(3.0-2.0*f);
           return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), f.x),
                      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x), f.y);
       }
       
       float fbm(vec2 p) {
           float v = 0.0;
           float a = 0.5;
           mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
           for (int i = 0; i < 4; ++i) {
               v += a * noise(p);
               p = rot * p * 2.0;
               a *= 0.5;
           }
           return v;
       }
       `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       
       vec3 viewDir = normalize(vWaterViewPosition);
       
       // Micro-surface texture (Foam/Noise)
       vec2 uv = vWaterWorldPosition.xz * 0.1;
       float t = uTime * 0.2;
       
       float surfaceNoise = fbm(uv + t);
       
       // Normal perturbation for surface detail
       vec3 waterNormal = normalize(vNormal + vec3(0.0, surfaceNoise * 0.2, 0.0));
       
       float fresnel = pow(1.0 - abs(dot(viewDir, waterNormal)), 3.0);
       
       // Colors
       vec3 deepWater = vec3(0.01, 0.05, 0.1); // Dark Abyss
       vec3 wavePeak = uColor; // Lighter Blue
       vec3 foam = vec3(0.8, 0.85, 0.9);
       
       // Mix colors based on height (Steep wave logic)
       // Range is -1.5 (flat) to ~50.0 (peak)
       
       float heightFactor = smoothstep(5.0, 45.0, vWaveHeight);
       vec3 finalColor = mix(deepWater, wavePeak, heightFactor);
       
       // Foam only at the very crest
       float foamMask = smoothstep(40.0, 50.0, vWaveHeight) * surfaceNoise;
       finalColor = mix(finalColor, foam, foamMask * 0.8);
       
       // Sky Reflection
       vec3 skyColor = vec3(0.5, 0.6, 0.7);
       finalColor = mix(finalColor, skyColor, fresnel * 0.5);
       
       diffuseColor.rgb = finalColor;
       `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <roughnessmap_fragment>',
      `#include <roughnessmap_fragment>
         roughnessFactor = 0.1; // Very smooth water
        `
    );
  };

  return (
    <meshStandardMaterial
      roughness={0.2}
      metalness={0.6}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'water-planet-wall-wave-fix'}
    />
  );
};