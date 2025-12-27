import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { InstancedMesh, Object3D, DoubleSide, Color, PlaneGeometry } from 'three';
import { getTerrainHeight } from '../utils/helpers';

interface GrassProps {
    offset: [number, number];
    size: number;
}

export const Grass: React.FC<GrassProps> = ({ offset, size }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const time = useRef(0);
  const dummy = useMemo(() => new Object3D(), []);
  
  // Density relative to chunk size
  // Previous: 150000 for 960 size (~0.16 per unit sq)
  // New Chunk: 120 size. 120*120 * 0.16 ~= 2300 instances per chunk
  const COUNT = 3000; 

  // Create geometry and translate it imperatively to shift pivot
  const grassGeometry = useMemo(() => {
    const geo = new PlaneGeometry(0.12, 1, 1, 4);
    geo.translate(0, 0.5, 0); // Shift pivot to bottom
    return geo;
  }, []);

  // Initial Placement
  useEffect(() => {
    if (!meshRef.current) return;

    for (let i = 0; i < COUNT; i++) {
        // Local position
        const lx = (Math.random() - 0.5) * size;
        const lz = (Math.random() - 0.5) * size;
        
        // World position for height calculation
        const wx = lx + offset[0];
        const wz = lz + offset[1];
        
        const y = getTerrainHeight(wx, wz, 'grass');
        
        dummy.position.set(lx, y, lz);
        dummy.rotation.set(0, Math.random() * Math.PI, 0);
        
        // Randomize scale for variety (Height and Width)
        const heightScale = 0.8 + Math.random() * 0.8;
        dummy.scale.set(heightScale, heightScale, heightScale);
        
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [offset, size]);

  useFrame((_, delta) => {
    time.current += delta;
    const mat = meshRef.current?.material as any;
    if (mat && mat.userData && mat.userData.shader) {
        mat.userData.shader.uniforms.uTime.value = time.current;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]} frustumCulled={true}>
      <primitive object={grassGeometry} attach="geometry" />
      <meshStandardMaterial
        color="#4caf50" // Base healthy grass color
        transparent
        side={DoubleSide}
        onBeforeCompile={(shader) => {
          shader.uniforms.uTime = { value: 0 };
          
          if (meshRef.current) {
             (meshRef.current.material as any).userData = { shader };
          }

          shader.vertexShader = `
            uniform float uTime;
            ${shader.vertexShader}
          `.replace(
            '#include <begin_vertex>',
            `
              vec3 transformed = vec3(position);
              
              // --- 1. Tapering (Sivrilme) ---
              // Since we translated geometry up, uv.y goes from 0 (bottom) to 1 (top).
              // We want width (x) to be 100% at bottom and 0% at top.
              // Pow function gives it a slight curve instead of linear triangle.
              float taper = pow(1.0 - uv.y, 0.5); 
              transformed.x *= taper;
              
              // --- 2. Wind Animation ---
              // Wind affects the top more than the bottom.
              float heightFactor = uv.y; // 0 at root, 1 at tip
              
              // Combine differing frequencies for natural movement
              // Use world position (via instanceMatrix) for coherent wind across chunks
              float worldX = instanceMatrix[3][0] + ${offset[0].toFixed(1)};
              float worldZ = instanceMatrix[3][2] + ${offset[1].toFixed(1)};
              
              float wind = sin(uTime * 1.0 + worldX * 0.5 + worldZ * 0.5) * 0.3;
              float wind2 = cos(uTime * 2.0 + worldX * 0.2) * 0.15;
              
              // Apply wind relative to height squared (bends more at tip)
              float lean = (wind + wind2) * (heightFactor * heightFactor);
              
              transformed.x += lean;
              transformed.z += lean * 0.5; // Slight Z bend too
              
              // Slight y-dip when bending to preserve length illusion
              transformed.y -= abs(lean) * 0.3;
            `
          );
        }}
      />
    </instancedMesh>
  );
}