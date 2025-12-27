import React, { useMemo, useRef, useEffect } from 'react';
import { BackSide, Color, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface BackgroundProps {
  colorSpace: string;
  colorHorizon: string;
  colorSun: string;
  sunDirection: Vector3; // Normalized direction vector
  distortionStrength: number;
  hasBlackHole?: boolean;
}

const Background: React.FC<BackgroundProps> = ({ 
  colorSpace, 
  colorHorizon, 
  colorSun, 
  sunDirection, 
  distortionStrength,
  hasBlackHole = false
}) => {
  const materialRef = useRef<any>(null);
  
  const uniforms = useMemo(() => ({
    uColorSpace: { value: new Color(colorSpace) },
    uColorHorizon: { value: new Color(colorHorizon) },
    uColorSun: { value: new Color(colorSun) },
    uSunPosition: { value: new Vector3().copy(sunDirection) },
    uDistortionStrength: { value: distortionStrength },
    uHasBlackHole: { value: hasBlackHole ? 1.0 : 0.0 },
    uTime: { value: 0 },
  }), []);

  // Update uniforms when props change
  useEffect(() => {
    if (materialRef.current) {
        materialRef.current.uniforms.uColorSpace.value.set(colorSpace);
        materialRef.current.uniforms.uColorHorizon.value.set(colorHorizon);
        materialRef.current.uniforms.uColorSun.value.set(colorSun);
        materialRef.current.uniforms.uSunPosition.value.copy(sunDirection);
        materialRef.current.uniforms.uDistortionStrength.value = distortionStrength;
        materialRef.current.uniforms.uHasBlackHole.value = hasBlackHole ? 1.0 : 0.0;
    }
  }, [colorSpace, colorHorizon, colorSun, sunDirection, distortionStrength, hasBlackHole]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  const vertexShader = `
    varying vec3 vWorldPosition;
    
    void main() {
      vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `;

  const fragmentShader = `
    uniform vec3 uColorSpace;
    uniform vec3 uColorHorizon;
    uniform vec3 uColorSun;
    uniform vec3 uSunPosition;
    uniform float uDistortionStrength;
    uniform float uHasBlackHole;
    uniform float uTime;
    
    varying vec3 vWorldPosition;

    // Simple noise
    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      vec3 viewDir = normalize(vWorldPosition);
      
      // 1. Heat Distortion (Only for Horizon/Sky)
      float distortion = sin(viewDir.y * 100.0 + uTime * 2.0) * uDistortionStrength;
      distortion *= (1.0 - smoothstep(0.0, 0.3, viewDir.y)); // Fade out distortion high up
      
      vec3 distortedDir = viewDir;
      distortedDir.x += distortion;

      // 2. Sky Gradient
      float horizonFactor = smoothstep(-0.2, 0.6, distortedDir.y);
      vec3 skyColor = mix(uColorHorizon, uColorSpace, horizonFactor);
      
      vec3 finalColor = skyColor;
      
      // 3. Black Hole Mode Logic
      // If we have a black hole, we want a deep space background, 
      // not the atmospheric gradient of the planet.
      if (uHasBlackHole > 0.5) {
         finalColor = vec3(0.0, 0.0, 0.0); // Pitch black space
      } else {
          // --- STANDARD SUN MODE ---
          
          float sunDot = dot(viewDir, uSunPosition);
          
          // Sun Disk
          float sunRadius = 0.998; 
          float sunEdge = smoothstep(sunRadius, sunRadius + 0.0005, sunDot);
          
          // Sun Glow (Halo)
          float sunGlow = pow(max(0.0, sunDot), 64.0) * 0.6;
          
          // Wide Bloom
          float wideGlow = pow(max(0.0, sunDot), 8.0) * 0.3;
          
          // Add Sun Layers
          finalColor += uColorSun * sunEdge * 5.0; // Core
          finalColor += uColorSun * sunGlow;       // Halo
          finalColor += uColorHorizon * wideGlow;  // Atmosphere Bloom
      }
      
      // 5. Stars
      vec2 starSeed = viewDir.xz * 400.0 + viewDir.yy * 200.0;
      float starThreshold = 0.998;
      float starVal = random(starSeed); 
      
      // Determine if stars should be visible
      // If black hole, full visibility. If sun, fade near sun.
      float sunDot = dot(viewDir, uSunPosition);
      float sunFade = (uHasBlackHole > 0.5) ? 1.0 : (1.0 - pow(max(0.0, sunDot), 8.0) * 0.6);
      
      if (starVal > starThreshold) {
          float visibility = smoothstep(0.2, 0.5, viewDir.y) * sunFade;
          // Ensure stars are visible everywhere in Black Hole mode
          if (uHasBlackHole > 0.5) visibility = 1.0; 
          
          finalColor += vec3(visibility);
      }
      
      // Horizon Band boost (Standard Atmosphere only)
      if (uHasBlackHole < 0.5) {
          float horizonBand = 1.0 - smoothstep(0.0, 0.05, abs(distortedDir.y));
          finalColor += uColorHorizon * horizonBand * 0.15;
      }

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `;

  return (
    <mesh>
      <sphereGeometry args={[1500, 32, 32]} />
      <shaderMaterial
        ref={materialRef}
        side={BackSide}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        depthWrite={false}
      />
    </mesh>
  );
};

export default Background;