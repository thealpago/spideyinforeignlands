import React, { useMemo } from 'react';
import { Color } from 'three';

interface VolcanoMaterialProps {
  color: string;
}

export const VolcanoMaterial: React.FC<VolcanoMaterialProps> = ({ color }) => {
  const uniforms = useMemo(() => ({
    uColor: { value: new Color(color) },
  }), []);

  useMemo(() => {
    uniforms.uColor.value.set(color);
  }, [color, uniforms]);

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uColor = uniforms.uColor;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vWorldPosition;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vec4 worldPos = modelMatrix * vec4(position, 1.0);
       vWorldPosition = worldPos.xyz;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform vec3 uColor;
       varying vec3 vWorldPosition;
       
       float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
       float noise(vec2 p) {
           vec2 i = floor(p);
           vec2 f = fract(p);
           f = f*f*(3.0-2.0*f);
           return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), f.x),
                      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x), f.y);
       }
       `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       float n = noise(vWorldPosition.xz * 0.1);
       float cracks = smoothstep(0.4, 0.45, n);
       
       vec3 rock = vec3(0.05, 0.05, 0.05);
       vec3 lava = vec3(1.0, 0.2, 0.0) * 2.0; // Bright emission
       
       diffuseColor.rgb = rock;
       `
    );
    
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         float n2 = noise(vWorldPosition.xz * 0.1);
         float lavaMask = 1.0 - smoothstep(0.35, 0.4, n2);
         // Only lava in low areas or specific noise patterns
         totalEmissiveRadiance += lava * lavaMask;
         `
    );
  };

  return (
    <meshStandardMaterial
      color={color}
      roughness={0.9}
      metalness={0.2}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'volcano-material'}
    />
  );
};