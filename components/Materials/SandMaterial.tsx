import React, { useMemo } from 'react';
import { Color } from 'three';

interface SandMaterialProps {
  color: string;
  roughness?: number;
  metalness?: number;
}

export const SandMaterial: React.FC<SandMaterialProps> = ({ 
  color, 
  roughness = 0.9, 
  metalness = 0.1 
}) => {
  const uniforms = useMemo(() => ({
    uColor: { value: new Color(color) },
    uNoiseScale: { value: 1.0 },
  }), []);

  // Update uniforms when props change
  useMemo(() => {
    uniforms.uColor.value.set(color);
  }, [color, uniforms]);

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uColor = uniforms.uColor;
    shader.uniforms.uNoiseScale = uniforms.uNoiseScale;

    // Inject Varyings
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `
      #include <common>
      varying vec3 vWorldPosition;
      `
    );
    
    // Rename variable to avoid conflict with Three.js internal 'worldPosition'
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      vec4 customWorldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = customWorldPos.xyz;
      `
    );

    // Inject Noise Logic & Color Mixing in Fragment
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `
      #include <common>
      uniform vec3 uColor;
      varying vec3 vWorldPosition;

      // Simple 2D noise
      float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
      }

      float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float res = mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
                          mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
          return res;
      }
      `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #include <map_fragment>
      
      vec2 uvPos = vWorldPosition.xz;
      
      // Multi-layered noise for sand grain
      // WE HAVE STRETCHED THESE VALUES (LOWER NUMBERS = BIGGER TEXTURE)
      // Original: 2.0 -> New: 0.4 (Large color drifts)
      // Original: 50.0 -> New: 15.0 (Visible grain texture)
      
      float n1 = noise(uvPos * 0.4); // Low freq variation (Wet/Dry patches)
      float n2 = noise(uvPos * 15.0); // High freq grain (Sand texture)
      float n3 = noise(uvPos * 0.02); // Very low freq dunes color shift

      // Subtle sparkle/grain
      float grain = mix(0.9, 1.15, n2);
      
      // Dune-like color banding
      vec3 baseColor = uColor;
      vec3 darkerColor = uColor * 0.65;
      vec3 lighterColor = uColor * 1.15;

      // Mix based on noise
      vec3 finalSand = mix(baseColor, darkerColor, n3 * 0.6);
      finalSand = mix(finalSand, lighterColor, n1 * 0.4);
      finalSand *= grain;

      diffuseColor.rgb *= finalSand;
      `
    );
  };

  return (
    <meshStandardMaterial
      roughness={roughness}
      metalness={metalness}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'sand-material-v2'}
    />
  );
};