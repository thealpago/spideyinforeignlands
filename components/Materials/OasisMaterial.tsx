import React, { useMemo } from 'react';
import { Color } from 'three';

interface OasisMaterialProps {
  color: string;
}

export const OasisMaterial: React.FC<OasisMaterialProps> = ({ color }) => {
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
       `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       float h = vWorldPosition.y;
       
       vec3 sand = uColor;
       vec3 grass = vec3(0.2, 0.5, 0.2);
       vec3 rock = vec3(0.5, 0.5, 0.5);
       
       // Water level is approx -2.5
       float grassMix = smoothstep(-2.5, 2.0, h) - smoothstep(5.0, 10.0, h);
       
       vec3 final = mix(sand, grass, grassMix * 0.5);
       
       diffuseColor.rgb = final;
       `
    );
  };

  return (
    <meshStandardMaterial
      roughness={0.8}
      metalness={0.0}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'oasis-material'}
    />
  );
};