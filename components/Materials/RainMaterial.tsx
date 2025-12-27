import React, { useMemo, useRef } from 'react';
import { Color } from 'three';
import { useFrame } from '@react-three/fiber';

interface RainMaterialProps {
  color: string;
}

export const RainMaterial: React.FC<RainMaterialProps> = ({ color }) => {
  const materialRef = useRef<any>(null);
  const uniforms = useMemo(() => ({
    uColor: { value: new Color(color) },
    uTime: { value: 0 },
    uRoughness: { value: 0.6 },
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
    shader.uniforms.uRoughness = uniforms.uRoughness;
    materialRef.current = shader;

    // Inject Varyings with unique names to avoid collisions
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vRainWorldPosition;
       varying vec3 vRainViewPosition;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vec4 rainWorldPos = modelMatrix * vec4(position, 1.0);
       vRainWorldPosition = rainWorldPos.xyz;
       vec4 rainMvPos = viewMatrix * rainWorldPos;
       vRainViewPosition = -rainMvPos.xyz;`
    );

    // Fragment Logic
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform vec3 uColor;
       uniform float uTime;
       varying vec3 vRainWorldPosition;
       varying vec3 vRainViewPosition;

       float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
       
       float noise(vec2 p) {
           vec2 i = floor(p);
           vec2 f = fract(p);
           f = f*f*(3.0-2.0*f);
           return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), f.x),
                      mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), f.x), f.y);
       }
       
       // Procedural Ripple Logic
       float ripple(vec2 uv, float speed, float freq) {
           float t = uTime * speed;
           // Create a grid of drops
           vec2 grid = floor(uv);
           vec2 sub = fract(uv);
           
           // Random start time for this cell
           float offset = hash(grid) * 10.0;
           float localTime = t + offset;
           
           // Drop life cycle
           float life = fract(localTime); // 0.0 to 1.0
           
           // Center of drop in this cell
           vec2 center = vec2(0.5) + (vec2(hash(grid * 2.5), hash(grid * 3.5)) - 0.5) * 0.5;
           
           float d = distance(sub, center);
           
           // Ring expanding
           float ring = sin(d * freq - life * 20.0);
           
           // Fade out over life and distance
           float alpha = (1.0 - life) * (1.0 - smoothstep(0.0, 0.4, d));
           
           return ring * alpha * step(life, 0.8); // Cutoff end of life
       }
       `
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       vec3 rainViewDir = normalize(vRainViewPosition);
       vec3 rainNormal = normalize(vNormal);

       // 1. Base Rock Texture
       float n = noise(vRainWorldPosition.xz * 0.3);
       float n2 = noise(vRainWorldPosition.xz * 1.5);
       
       vec3 rock = uColor;
       vec3 darkRock = uColor * 0.3;
       
       vec3 baseColor = mix(darkRock, rock, n);
       baseColor *= (0.8 + n2 * 0.4);

       // 2. Wetness / Puddle Mask
       // Low areas are wetter
       float wetMask = smoothstep(0.55, 0.35, n); // Invert noise for puddles
       
       // 3. Ripples
       // Add ripples only in wet areas
       float r1 = ripple(vRainWorldPosition.xz * 2.0, 1.0, 20.0);
       float r2 = ripple(vRainWorldPosition.xz * 1.5 + 5.0, 0.8, 15.0);
       
       // Perturb normal slightly with ripples (fake bump)
       float rippleEffect = (r1 + r2) * wetMask * 0.5;
       
       // 4. Fresnel / Reflection
       // Wet surfaces are darker and shiny
       // Using calculated rainViewDir and rainNormal to avoid collision with 'normal'
       float fresnel = pow(1.0 - abs(dot(rainViewDir, rainNormal)), 4.0);
       
       // Sky Reflection Color (Gray-Blue)
       vec3 skyReflect = vec3(0.3, 0.35, 0.4) * 2.0; 
       
       vec3 wetColor = baseColor * 0.4; // Darken when wet
       wetColor = mix(wetColor, skyReflect, fresnel);
       wetColor += rippleEffect * 0.2; // Add ripple highlight

       // 5. Final Mix
       diffuseColor.rgb = mix(baseColor, wetColor, wetMask);
       `
    );
    
    // Override roughness for PBR
    shader.fragmentShader = shader.fragmentShader.replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
         float n_r = noise(vRainWorldPosition.xz * 0.3);
         float wetness = smoothstep(0.55, 0.35, n_r);
         roughnessFactor = mix(0.9, 0.1, wetness); // Dry is rough, wet is smooth
        `
    );
  };

  return (
    <meshStandardMaterial
      roughness={0.9}
      metalness={0.1}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'rain-material'}
    />
  );
};