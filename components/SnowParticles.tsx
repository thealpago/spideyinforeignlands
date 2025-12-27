import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, AdditiveBlending, Vector3 } from 'three';

/**
 * SNOW PARTICLES
 * Optimized for slow drifting flakes and soft motion.
 */
export const SnowParticles: React.FC = () => {
    const pointsRef = useRef<any>(null);
    const count = 8000;
    const radius = 100;

    const positions = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * radius * 2;
            pos[i * 3 + 1] = Math.random() * 100;
            pos[i * 3 + 2] = (Math.random() - 0.5) * radius * 2;
        }
        return pos;
    }, []);

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uColor: { value: new Color("#ffffff") },
        uCameraPos: { value: new Vector3() },
        uHeight: { value: 100.0 }
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
      
      // Fall Animation - Slower for snow
      float speed = 3.0; 
      float fallOffset = uTime * speed;
      
      // Wrap Y
      pos.y = mod(pos.y - fallOffset, uHeight);
      
      // Wrap X/Z around camera
      vec3 worldPos = pos + vec3(uCameraPos.x, 0.0, uCameraPos.z);
      vec3 relPos = mod(worldPos - uCameraPos, vec3(200.0, uHeight, 200.0)) - vec3(100.0, uHeight * 0.4, 100.0);
      
      // Add more chaotic wind drift for snow
      float windX = sin(uTime * 0.3 + pos.x) * 4.0;
      float windZ = cos(uTime * 0.4 + pos.z) * 4.0;
      relPos.x += windX;
      relPos.z += windZ;

      vec4 mvPosition = modelViewMatrix * vec4(uCameraPos + relPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Scale based on depth - snow flakes are rounder/bigger
      gl_PointSize = 400.0 / -mvPosition.z;
    }
  `;

    const fragmentShader = `
    uniform vec3 uColor;
    
    void main() {
      // Create a round flake shape
      vec2 coord = gl_PointCoord * 2.0 - 1.0;
      float d = length(coord);
      
      // Soft alpha falloff
      float alpha = 1.0 - smoothstep(0.4, 1.0, d);
      
      if (alpha < 0.01) discard;
      
      gl_FragColor = vec4(uColor, alpha * 0.8);
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
