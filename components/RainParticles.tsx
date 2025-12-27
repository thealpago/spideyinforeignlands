import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, AdditiveBlending, Vector3 } from 'three';

/**
 * RAIN PARTICLES
 * Optimized for vertical streaks and fast motion.
 */
export const RainParticles: React.FC = () => {
  const pointsRef = useRef<any>(null);
  const count = 12000; // Increased density for larger volume
  const radius = 100; // Increased radius

  // Initialize positions
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * radius * 2;
      pos[i * 3 + 1] = Math.random() * 200; // Higher internal range
      pos[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
    }
    return pos;
  }, []);

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uColor: { value: new Color("#dbeeff") },
    uCameraPos: { value: new Vector3() },
    uHeight: { value: 200.0 } // Increased height
  }), []);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.material.uniforms.uTime.value = state.clock.elapsedTime;
      pointsRef.current.material.uniforms.uCameraPos.value.copy(state.camera.position);
    }
  });

  const vertexShader = `
    uniform float uTime;
    uniform vec3 uCameraPos;
    uniform float uHeight;
    
    void main() {
      vec3 pos = position;
      
      // Fall Animation
      float speed = 25.0; // Faster rain
      float fallOffset = uTime * speed;
      
      // Wrap Y
      pos.y = mod(pos.y - fallOffset, uHeight);
      
      // Wrap X/Z around camera
      vec3 worldPos = pos + vec3(uCameraPos.x, 0.0, uCameraPos.z);
      // Dimensions: X=200, Y=200, Z=200
      // Offset: Center X/Z, and shift Y down by 40% of height so it rains below camera too
      vec3 relPos = mod(worldPos - uCameraPos, vec3(200.0, uHeight, 200.0)) - vec3(100.0, uHeight * 0.4, 100.0);
      
      // Add wind drift
      float wind = sin(uTime * 0.5) * 2.0;
      relPos.x += wind * (relPos.y / uHeight);

      vec4 mvPosition = modelViewMatrix * vec4(uCameraPos + relPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Scale based on depth (Make streaks much thicker and longer visually)
      gl_PointSize = 300.0 / -mvPosition.z;
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    
    void main() {
      // Create a streak shape
      vec2 coord = gl_PointCoord * 2.0 - 1.0;
      
      // Stretch Y 
      float d = length(vec2(coord.x * 6.0, coord.y)); // Make it thinner relative to height (but base size is bigger now)
      
      float alpha = 1.0 - smoothstep(0.0, 1.0, d);
      
      if (alpha < 0.1) discard;
      
      // Higher opacity for visibility
      gl_FragColor = vec4(uColor, alpha * 0.9);
    }
  `;

  return (
    <points ref={pointsRef} raycast={() => null} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
      />
    </points>
  );
};