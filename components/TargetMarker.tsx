import React, { useRef, useMemo } from 'react';
import { Vector3, Mesh, DoubleSide, AdditiveBlending } from 'three';
import { useFrame } from '@react-three/fiber';

interface TargetMarkerProps {
  position: Vector3;
}

export const TargetMarker: React.FC<TargetMarkerProps> = ({ position }) => {
  const pointerRef = useRef<Mesh>(null);
  const ring1Ref = useRef<Mesh>(null);
  const ring2Ref = useRef<Mesh>(null);
  const crossRef = useRef<Mesh>(null);
  const coreRef = useRef<Mesh>(null);

  // Safely map the position vector to a tuple
  const safePosition = useMemo(() => [position.x, position.y, position.z] as [number, number, number], [position.x, position.y, position.z]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (pointerRef.current) {
        // High altitude bobbing
        // Moves from y=12 down to y=2 relative to position
        const yOffset = 7.0 + Math.sin(t * 2.0) * 5.0; 
        pointerRef.current.position.y = yOffset;
        pointerRef.current.rotation.y = t * 2.0;
    }

    if (ring1Ref.current) {
        ring1Ref.current.rotation.z = t * 0.2;
        const s = 1.0 + Math.sin(t * 4.0) * 0.05;
        ring1Ref.current.scale.set(s, s, 1);
    }

    if (ring2Ref.current) {
        ring2Ref.current.rotation.z = -t * 0.5;
        const opacity = 0.3 + Math.sin(t * 10.0) * 0.1;
        if (ring2Ref.current.material) (ring2Ref.current.material as any).opacity = opacity;
    }

    if (crossRef.current) {
        crossRef.current.rotation.z = t * 0.1;
    }
    
    if (coreRef.current) {
        coreRef.current.rotation.z = t * 3.0;
        const s = 0.8 + Math.cos(t * 8.0) * 0.1;
        coreRef.current.scale.set(s, s, 1);
    }
  });

  // Holographic material settings for overlay effect
  // depthTest: false ensures it draws "on top" of terrain even if technically clipping
  const holoProps = {
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: DoubleSide,
      blending: AdditiveBlending
  };

  return (
    <group position={safePosition}>
        {/* 1. The Pointer (Doubled Length, No Sphere) */}
        {/* Original height 1.4 -> New 2.8. Slimmer top radius for sci-fi look (0.8 -> 0.4) */}
        <mesh ref={pointerRef} position={[0, 5, 0]}>
            <cylinderGeometry args={[0.4, 0.0, 2.8, 3, 1]} />
            <meshBasicMaterial color="#00ffff" wireframe transparent opacity={0.6} />
        </mesh>

        {/* 2. Sci-Fi Ground Hologram */}
        {/* Raised slightly (0.2) to avoid z-fighting, but depthTest=false handles the rest */}
        <group rotation={[-Math.PI/2, 0, 0]} position={[0, 0.2, 0]}>
            
            {/* Main Outer Ring */}
            <mesh ref={ring1Ref}>
                <ringGeometry args={[0.8, 0.9, 64]} />
                <meshBasicMaterial color="#00ffff" opacity={0.6} {...holoProps} />
            </mesh>

            {/* Tech Segmented Ring */}
            <mesh ref={ring2Ref}>
                <ringGeometry args={[0.6, 0.75, 4]} />
                <meshBasicMaterial color="#0088ff" opacity={0.4} wireframe {...holoProps} />
            </mesh>

            {/* Inner Fast Spinner */}
            <mesh ref={coreRef}>
                <ringGeometry args={[0.2, 0.3, 3]} />
                <meshBasicMaterial color="#ffffff" opacity={0.8} {...holoProps} />
            </mesh>
            
            {/* Crosshair Scanner */}
            <mesh ref={crossRef}>
                <planeGeometry args={[2.5, 0.02]} />
                <meshBasicMaterial color="#00ffff" opacity={0.2} {...holoProps} />
                <mesh rotation={[0, 0, Math.PI/2]}>
                    <planeGeometry args={[2.5, 0.02]} />
                    <meshBasicMaterial color="#00ffff" opacity={0.2} {...holoProps} />
                </mesh>
            </mesh>

            {/* Ground Glow */}
            <mesh position={[0, 0, -0.05]}>
                <circleGeometry args={[1.5, 32]} />
                <meshBasicMaterial color="#00ffff" opacity={0.1} transparent depthWrite={false} />
            </mesh>

        </group>
        
        {/* Laser Beam connection from sky */}
         <mesh position={[0, 20, 0]}>
            <cylinderGeometry args={[0.01, 0.01, 40, 4]} />
            <meshBasicMaterial color="#00ffff" opacity={0.15} transparent depthWrite={false} />
        </mesh>

        <pointLight position={[0, 2, 0]} distance={10} intensity={3} color="#00ffff" decay={2} />
    </group>
  );
};