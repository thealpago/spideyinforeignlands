import React, { useMemo } from 'react';
import { Color } from 'three';

interface MarsMaterialProps {
  color: string;
}

export const MarsMaterial: React.FC<MarsMaterialProps> = ({ color }) => {
  const uniforms = useMemo(() => ({
    uColor: { value: new Color(color) },
    uOtherColor: { value: new Color("#7a4b3a") }, // Darker rock color
    uScale: { value: 0.12 }, // Overall scale
  }), []);

  useMemo(() => {
    uniforms.uColor.value.set(color);
  }, [color, uniforms]);

  const onBeforeCompile = (shader: any) => {
    shader.uniforms.uColor = uniforms.uColor;
    shader.uniforms.uOtherColor = uniforms.uOtherColor;
    shader.uniforms.uScale = uniforms.uScale;

    // --- Vertex Shader ---
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

    // --- Fragment Shader ---
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform vec3 uColor;
       uniform vec3 uOtherColor;
       uniform float uScale;
       varying vec3 vWorldPosition;

       // Improved Hash
       float hash(vec2 p) {
           p  = 50.0*fract( p*0.3183099 + vec2(0.71,0.113));
           return -1.0+2.0*fract( p.x*p.y*(p.x+p.y) );
       }

       // Value Noise
       float noise(vec2 p) {
           vec2 i = floor(p);
           vec2 f = fract(p);
           vec2 u = f*f*(3.0-2.0*f);
           return mix( mix( hash( i + vec2(0.0,0.0) ), 
                            hash( i + vec2(1.0,0.0) ), u.x),
                       mix( hash( i + vec2(0.0,1.0) ), 
                            hash( i + vec2(1.0,1.0) ), u.x), u.y);
       }

       // FBM with 6 Octaves for high detail
       float fbm(vec2 p) {
           float f = 0.0;
           mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );
           f  = 0.5000*noise( p ); p = m*p;
           f += 0.2500*noise( p ); p = m*p;
           f += 0.1250*noise( p ); p = m*p;
           f += 0.0625*noise( p ); p = m*p;
           f += 0.03125*noise( p ); p = m*p;
           f += 0.015625*noise( p );
           return f;
       }
       `
    );

    // COLORING LOGIC
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       
       vec2 uvPos = vWorldPosition.xz * uScale;
       
       // Multi-layered noise
       float nLow = fbm(uvPos * 0.5);   // Large patches
       float nMid = fbm(uvPos * 2.0);   // Detail patches
       float nHigh = fbm(uvPos * 10.0); // Grit
       
       // Domain Warping for Strata / Flow look
       vec2 q = vec2( fbm( uvPos + vec2(0.0,0.0) ),
                      fbm( uvPos + vec2(5.2,1.3) ) );
                      
       float r = fbm( uvPos + 4.0*q );

       // Colors
       vec3 colBase = uColor; // Rust Red
       vec3 colDark = vec3(0.2, 0.1, 0.08); // Dark crevices
       vec3 colDust = vec3(0.7, 0.45, 0.35); // Sandy dust
       vec3 colBright = vec3(0.8, 0.6, 0.5); // Highlights

       // Mix based on warped noise 'r'
       vec3 finalColor = mix(colBase, colDark, smoothstep(0.2, 0.8, r));
       
       // Add dusty patches on top
       finalColor = mix(finalColor, colDust, smoothstep(0.4, 0.6, nMid + nHigh*0.2));
       
       // Add grit texture (speckles)
       float grit = smoothstep(0.6, 1.0, nHigh);
       finalColor = mix(finalColor, colBright, grit * 0.3); // Bright speckles
       finalColor = mix(finalColor, vec3(0.1), smoothstep(0.7, 1.0, -nHigh) * 0.2); // Dark pits

       diffuseColor.rgb = finalColor;
       `
    );
  };

  return (
    <meshStandardMaterial
      roughness={0.9}
      metalness={0.1}
      onBeforeCompile={onBeforeCompile}
      customProgramCacheKey={() => 'mars-material-v3-realistic'}
    />
  );
};