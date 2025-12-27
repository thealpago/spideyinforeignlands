import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, AdditiveBlending, Vector3 } from 'three';

/**
 * ULTRA-REALISTIC BLIZZARD PARTICLES
 * Optimized for cinematic motion-blurred streaks and turbulent drifting.
 */
export const SnowParticles: React.FC = () => {
    const pointsRef = useRef<any>(null);
    const count = 15000; // Denser blizzard
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
    varying float vAlpha;
    
    void main() {
      vec3 pos = position;
      
      // Intense Blizzard Speed - Fast katabatic winds
      float fallSpeed = 8.0; 
      float windSpeed = 25.0;
      
      float fallOffset = uTime * fallSpeed;
      float windOffset = uTime * windSpeed;
      
      // Wrap and animate
      pos.y = mod(pos.y - fallOffset, uHeight);
      pos.x += sin(pos.y * 0.1 + uTime) * 2.0; // Turbulence
      
      // Wrap X/Z around camera
      vec3 worldPos = pos + vec3(uCameraPos.x - windOffset, 0.0, uCameraPos.z);
      vec3 relPos = mod(worldPos - uCameraPos, vec3(200.0, uHeight, 200.0)) - vec3(100.0, uHeight * 0.4, 100.0);
      
      // Motion Blur Stretch based on velocity
      // We simulate stretch by shifting vertex based on time slightly? 
      // Actually simpler: stretched billboard in fragment
      
      vec4 mvPosition = modelViewMatrix * vec4(uCameraPos + relPos, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      
      // Scale based on distance, but keep blizzard visible
      gl_PointSize = 600.0 / -mvPosition.z;
      
      // Fade out based on height to simulate ground fog/blizzard density
      vAlpha = smoothstep(0.0, 10.0, pos.y) * 0.8;
    }
  `;

    const fragmentShader = `
    varying float vAlpha;
    uniform vec3 uColor;
    
    void main() {
      // Motion-Blurred Streak Shape
      vec2 coord = gl_PointCoord * 2.0 - 1.0;
      
      // Stretch X and Y for a diagonal streak look (wind-driven)
      float x = coord.x * 8.0 + coord.y * 4.0;
      float y = coord.y * 1.5;
      float d = length(vec2(x, y));
      
      float alpha = 1.0 - smoothstep(0.2, 1.0, d);
      if (alpha < 0.01) discard;
      
      gl_FragColor = vec4(uColor, alpha * vAlpha);
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
