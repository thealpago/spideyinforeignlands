import React, { useMemo, useRef, useEffect } from 'react';
import { InstancedMesh, Object3D, Color } from 'three';
import { getTerrainHeight } from '../utils/helpers';

interface WetRocksProps {
    offset: [number, number];
    size: number;
}

export const WetRocks: React.FC<WetRocksProps> = ({ offset, size }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const count = 15; // Fewer rocks per chunk
  const dummy = useMemo(() => new Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;
    
    for (let i = 0; i < count; i++) {
      const lx = (Math.random() - 0.5) * size;
      const lz = (Math.random() - 0.5) * size;
      
      const wx = lx + offset[0];
      const wz = lz + offset[1];
      
      const y = getTerrainHeight(wx, wz, 'rain');

      dummy.position.set(lx, y + 0.1, lz);
      
      dummy.rotation.set(
          Math.random() * Math.PI, 
          Math.random() * Math.PI, 
          Math.random() * Math.PI
      );
      
      const scale = 0.5 + Math.random() * 1.5;
      dummy.scale.set(scale, scale * 0.6, scale); // Flattened rocks

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      
      // Random gray colors
      const gray = 0.2 + Math.random() * 0.2;
      meshRef.current.setColorAt(i, new Color(gray, gray, gray));
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [offset, size]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={true}>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial 
        roughness={0.2} // Wet rocks are smooth
        metalness={0.1} 
        color="#555555"
      />
    </instancedMesh>
  );
};