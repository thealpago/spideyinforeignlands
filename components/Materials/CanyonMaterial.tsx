import React, { useMemo } from 'react';
import { Color } from 'three';

interface CanyonMaterialProps {
  color: string;
}

export const CanyonMaterial: React.FC<CanyonMaterialProps> = ({ color }) => {
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
       vec4 worldPosition = modelMatrix * vec4(position, 1.0);
       vWorldPosition = worldPosition.xyz;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform vec3 uColor;
       varying vec3 vWorldPosition;
       
       float hash(float n) { return fract(sin(n) * 43758.5453123); }
       float noise(float x) {
          float i = floor(x);
          float f = fract(x);
          f = f*f*(3.0-2.0*f);
          return mix(hash(i), hash(i+1.0), f);
       }
       `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       float y = vWorldPosition.y;
       
       // Stratified layers
       float strata = noise(y * 0.5) + noise(y * 2.0) * 0.5;
       
       vec3 c1 = uColor;
       vec3 c2 = uColor * 0.6; // Darker band
       vec3 c3 = uColor * 1.2; // Lighter band
       
       float mix1 = smoothstep(0.3, 0.7, sin(y * 0.8 + strata));
       float mix2 = smoothstep(0.4, 0.6, sin(y * 3.0 + strata * 2.0));
       
       vec3 finalColor = mix(c1, c2, mix1);
       finalColor = mix(finalColor, c3, mix2);
       
       diffuseColor.rgb = finalColor;
       `
    );
  };

  return (
    <meshStandardMaterial
      roughness={0.9}
      metalness={0.0}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'canyon-material'}
    />
  );
};