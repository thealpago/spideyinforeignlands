import React, { useMemo } from 'react';
import { Color } from 'three';

interface MoonMaterialProps {
  color: string;
}

export const MoonMaterial: React.FC<MoonMaterialProps> = ({ color }) => {
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
       float n = noise(vWorldPosition.xz * 0.5);
       float craters = smoothstep(0.4, 0.45, n);
       
       vec3 dust = uColor;
       vec3 dark = uColor * 0.5;
       
       diffuseColor.rgb = mix(dust, dark, craters);
       `
    );
  };

  return (
    <meshStandardMaterial
      roughness={0.9}
      metalness={0.0}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'moon-material'}
    />
  );
};