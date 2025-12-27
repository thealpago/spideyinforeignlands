import React, { useMemo } from 'react';
import { Color } from 'three';

interface CrystalMaterialProps {
  color: string;
}

export const CrystalMaterial: React.FC<CrystalMaterialProps> = ({ color }) => {
  const uniforms = useMemo(() => ({
    uColor: { value: new Color(color) },
    uTime: { value: 0 }
  }), []);

  useMemo(() => {
    uniforms.uColor.value.set(color);
  }, [color, uniforms]);

  // Note: For a real shimmering effect we usually need useFrame to update uTime,
  // but for static terrain, view-dependent iridescence is often enough.

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uColor = uniforms.uColor;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vWorldPosition;
       varying vec3 vViewPosition;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vec4 worldPos = modelMatrix * vec4(position, 1.0);
       vWorldPosition = worldPos.xyz;
       vec4 mvPosition = viewMatrix * worldPos;
       vViewPosition = -mvPosition.xyz;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform vec3 uColor;
       varying vec3 vWorldPosition;
       varying vec3 vViewPosition;
       `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       
       vec3 viewDir = normalize(vViewPosition);
       vec3 normal = normalize(vNormal);
       
       // Fresnel effect
       float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 3.0);
       
       // Subtle coloring based on height
       float heightFactor = smoothstep(-5.0, 10.0, vWorldPosition.y);
       vec3 baseColor = mix(uColor * 0.5, uColor, heightFactor);
       
       // Iridescence
       vec3 irid = vec3(0.0);
       irid.r = sin(vWorldPosition.y * 0.5 + 0.0) * 0.5 + 0.5;
       irid.g = sin(vWorldPosition.y * 0.5 + 2.0) * 0.5 + 0.5;
       irid.b = sin(vWorldPosition.y * 0.5 + 4.0) * 0.5 + 0.5;
       
       diffuseColor.rgb = mix(baseColor, irid, fresnel * 0.5);
       diffuseColor.rgb += uColor * fresnel * 0.8;
       `
    );
  };

  return (
    <meshPhysicalMaterial
      roughness={0.1}
      metalness={0.9}
      flatShading={true}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'crystal-material'}
    />
  );
};