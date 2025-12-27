import React, { useMemo, useRef } from 'react';
import { Color } from 'three';
import { useFrame } from '@react-three/fiber';

interface MatrixMaterialProps {
  color: string;
}

export const MatrixMaterial: React.FC<MatrixMaterialProps> = ({ color }) => {
  const materialRef = useRef<any>(null);
  const uniforms = useMemo(() => ({
    uColor: { value: new Color(color) },
    uTime: { value: 0 }
  }), []);

  useMemo(() => {
    uniforms.uColor.value.set(color);
  }, [color, uniforms]);

  useFrame((state) => {
    if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uColor = uniforms.uColor;
    shader.uniforms.uTime = uniforms.uTime;
    materialRef.current = shader;

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
       uniform float uTime;
       varying vec3 vWorldPosition;
       `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       // Grid effect
       float gridSize = 2.0;
       vec2 gridPos = fract(vWorldPosition.xz / gridSize);
       float lineThickness = 0.05;
       float grid = step(1.0 - lineThickness, gridPos.x) + step(1.0 - lineThickness, gridPos.y);
       
       // Digital rain effect
       float rainSpeed = 5.0;
       float column = floor(vWorldPosition.x / 1.0);
       float drop = fract(vWorldPosition.z / 20.0 + uTime * 0.2 + sin(column)*10.0);
       float trail = smoothstep(0.0, 1.0, drop);
       
       vec3 glow = uColor * (grid + trail * 0.5);
       
       // Base dark color
       vec3 base = vec3(0.02, 0.02, 0.05);
       
       diffuseColor.rgb = base + glow;
       diffuseColor.a = 1.0;
       `
    );
    
    // Make it glow
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
         totalEmissiveRadiance += glow;`
    );
  };

  return (
    <meshStandardMaterial
      color="#000000"
      roughness={0.2}
      metalness={0.8}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'matrix-material'}
    />
  );
};