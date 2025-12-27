import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';

export const RangerShip: React.FC = () => {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      // Gentle hovering animation over the water
      groupRef.current.position.y = 2.5 + Math.sin(t * 0.5) * 0.5;
      // Subtle roll/pitch to simulate floating
      groupRef.current.rotation.z = Math.sin(t * 0.2) * 0.05;
      groupRef.current.rotation.x = Math.cos(t * 0.3) * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, 2, -20]} rotation={[0, Math.PI, 0]} scale={[0.8, 0.8, 0.8]}>
      
      {/* --- PROCEDURAL RANGER SHIP --- */}
      
      {/* Main Fuselage (Wedge) */}
      <mesh position={[0, 0, 0.5]} castShadow receiveShadow>
         <boxGeometry args={[1.0, 0.4, 2.5]} />
         <meshStandardMaterial color="#222" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* Angled Side Panels / Wings */}
      <mesh position={[0.8, -0.1, 0.2]} rotation={[0, 0, -0.3]} scale={[1, 1, 1]} castShadow receiveShadow>
         <boxGeometry args={[0.8, 0.1, 1.8]} />
         <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.8} />
      </mesh>
      <mesh position={[-0.8, -0.1, 0.2]} rotation={[0, 0, 0.3]} scale={[1, 1, 1]} castShadow receiveShadow>
         <boxGeometry args={[0.8, 0.1, 1.8]} />
         <meshStandardMaterial color="#1a1a1a" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* Cockpit Windows */}
      <mesh position={[0, 0.21, 1.2]} rotation={[-0.5, 0, 0]}>
         <planeGeometry args={[0.7, 0.4]} />
         <meshStandardMaterial color="#000" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[0.35, 0.21, 1.1]} rotation={[-0.5, 0.5, 0]}>
         <planeGeometry args={[0.3, 0.4]} />
         <meshStandardMaterial color="#000" roughness={0.1} metalness={0.9} />
      </mesh>
      <mesh position={[-0.35, 0.21, 1.1]} rotation={[-0.5, -0.5, 0]}>
         <planeGeometry args={[0.3, 0.4]} />
         <meshStandardMaterial color="#000" roughness={0.1} metalness={0.9} />
      </mesh>

      {/* Rear Engines */}
      <group position={[0, 0.1, -1.2]}>
          <mesh position={[0.4, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.15, 0.5, 16]} />
              <meshStandardMaterial color="#333" />
          </mesh>
          <mesh position={[-0.4, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.2, 0.15, 0.5, 16]} />
              <meshStandardMaterial color="#333" />
          </mesh>
          
          {/* Engine Glows */}
          <mesh position={[0.4, 0, -0.26]}>
              <circleGeometry args={[0.12, 16]} />
              <meshBasicMaterial color="#00aaff" />
          </mesh>
          <mesh position={[-0.4, 0, -0.26]}>
              <circleGeometry args={[0.12, 16]} />
              <meshBasicMaterial color="#00aaff" />
          </mesh>
      </group>

      {/* Lights */}
      <pointLight position={[0.8, 0.5, -1.5]} color="#00aaff" distance={8} intensity={2} />
      <pointLight position={[-0.8, 0.5, -1.5]} color="#00aaff" distance={8} intensity={2} />
      
    </group>
  );
};