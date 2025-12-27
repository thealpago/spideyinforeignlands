
import React, { useRef, useMemo, useImperativeHandle, forwardRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D, Vector3, DynamicDrawUsage, MathUtils } from 'three';

export interface FootDustHandle {
  burst: (position: Vector3, color?: string) => void;
}

const PARTICLE_COUNT = 150; // Max active particles
const BURST_COUNT = 8;      // Particles per footstep

export const FootDust = forwardRef<FootDustHandle, {}>((_, ref) => {
  const meshRef = useRef<any>(null);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Particle State Storage (CPU side)
  // We avoid React State for animation loops to keep 60fps
  const particles = useMemo(() => {
    return new Array(PARTICLE_COUNT).fill(0).map(() => ({
      active: false,
      position: new Vector3(),
      velocity: new Vector3(),
      scale: 0,
      life: 0,
      maxLife: 0,
      growth: 0
    }));
  }, []);

  // Index of the next available particle in the pool
  const cursor = useRef(0);

  // Set Dynamic Usage for performance since we update every frame
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.instanceMatrix.setUsage(DynamicDrawUsage);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    burst: (position: Vector3) => {
      // Spawn a burst of particles
      for (let i = 0; i < BURST_COUNT; i++) {
        const idx = cursor.current;
        const p = particles[idx];
        
        p.active = true;
        // Start exactly at foot position
        p.position.copy(position);
        // Add slight random offset so they don't spawn inside each other
        p.position.x += (Math.random() - 0.5) * 0.5;
        p.position.z += (Math.random() - 0.5) * 0.5;
        p.position.y += Math.random() * 0.2;

        // Velocity: Upwards and spreading out
        p.velocity.set(
          (Math.random() - 0.5) * 2.0, // Spread X
          Math.random() * 1.5 + 0.5,   // Up Y
          (Math.random() - 0.5) * 2.0  // Spread Z
        );

        p.scale = 0.1; // Start small
        p.growth = Math.random() * 2.0 + 1.0; // Growth speed
        p.life = 0;
        p.maxLife = 0.5 + Math.random() * 0.5; // Seconds to live

        // Advance cursor (Circle buffer)
        cursor.current = (cursor.current + 1) % PARTICLE_COUNT;
      }
    }
  }));

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    let activeCount = 0;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];

      if (p.active) {
        p.life += delta;

        if (p.life >= p.maxLife) {
          p.active = false;
          p.scale = 0; // Hide
        } else {
          // Physics
          p.velocity.y -= delta * 2.0; // Gravity/Drag
          p.position.addScaledVector(p.velocity, delta);
          
          // Visuals
          const progress = p.life / p.maxLife;
          // Scale up quickly, then shrink/fade
          // Simulate opacity fade by shrinking to 0 at the end
          const sizeCurve = Math.sin(progress * Math.PI); 
          p.scale = sizeCurve * 0.8; 
        }

        // Update Matrix
        dummy.position.copy(p.position);
        dummy.scale.setScalar(p.scale);
        dummy.updateMatrix();
        
        meshRef.current.setMatrixAt(i, dummy.matrix);
        activeCount++;
      } else {
        // Ensure inactive particles are hidden
        meshRef.current.setMatrixAt(i, new Object3D().matrix); // scale 0,0,0
      }
    }

    if (activeCount > 0 || meshRef.current.count > 0) {
        meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[undefined, undefined, PARTICLE_COUNT]}
      frustumCulled={false}
    >
      <sphereGeometry args={[0.3, 6, 6]} /> {/* Low poly spheres for dust */}
      <meshStandardMaterial 
        color="#cfc0a5" // Generic Dust Color
        transparent 
        opacity={0.6} 
        roughness={1} 
        depthWrite={false} 
      />
    </instancedMesh>
  );
});
