import React, { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useSpiderController } from '../hooks/useSpiderController';
import GSpiderBody from './GSpiderBody';
import GSpiderLeg from './GSpiderLeg';
import { FootDust, FootDustHandle } from './FootDust';
import { VisualConfig, PhysicsConfig, TerrainType } from '../types';

interface GSpiderProps {
  target: Vector3;
  mousePosRef: React.MutableRefObject<Vector3>;
  onMoveStateChange: (isMoving: boolean) => void;
  isLocked: boolean;
  isThirdPerson?: boolean;
  controlsRef: React.RefObject<any>;
  visualConfig: VisualConfig;
  physicsConfig: PhysicsConfig;
  terrainType: TerrainType;
  sharedPosRef?: React.MutableRefObject<Vector3>;
}

const GSpider: React.FC<GSpiderProps> = ({
  target,
  mousePosRef,
  onMoveStateChange,
  isLocked,
  isThirdPerson = false,
  controlsRef,
  visualConfig,
  physicsConfig,
  terrainType,
  sharedPosRef
}) => {
  const dustRef = useRef<FootDustHandle>(null);
  const { camera } = useThree();

  // Automatic Camera Switching Logic
  useEffect(() => {
    if (!controlsRef?.current) return;

    if (isThirdPerson || terrainType === 'canyon') {
      // Switch to Third Person (Close, low, behind)
      controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.1;
      controlsRef.current.minDistance = 5;
      controlsRef.current.maxDistance = 30;
    } else {
      controlsRef.current.maxPolarAngle = Math.PI / 2 - 0.05;
      controlsRef.current.minDistance = 10;
      controlsRef.current.maxDistance = 500;
    }
  }, [terrainType, isThirdPerson, camera, controlsRef]);


  // Callback to trigger dust when a foot lands
  const onStep = (pos: Vector3) => {
    if (dustRef.current) {
      dustRef.current.burst(pos);
    }
  };

  const { groupRef, headRef, bodyMeshRef, legs, legConfigs } = useSpiderController(
    target,
    mousePosRef,
    onMoveStateChange,
    physicsConfig,
    terrainType,
    onStep,
    sharedPosRef
  );

  useFrame((state) => {
    if (isLocked && groupRef.current && controlsRef?.current && controlsRef.current.target) {
      const controls = controlsRef.current;
      const camera = state.camera;
      const targetPos = groupRef.current.position;

      // Smooth follow logic:
      const offset = camera.position.clone().sub(controls.target);
      controls.target.lerp(targetPos, 0.1);
      camera.position.addVectors(controls.target, offset);
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <GSpiderBody
          headRef={headRef}
          bodyMeshRef={bodyMeshRef}
          visualConfig={visualConfig}
          hullScale={physicsConfig.hullScale}
          abdomenScale={physicsConfig.abdomenScale}
        />

        {/* Shoulder Mounts Visuals (Hidden for Tardis aesthetic usually, but kept for logic) */}
        {legConfigs.map(config => (
          <mesh key={`mount-${config.id}`} position={config.originOffset} visible={visualConfig.showBody}>
            <cylinderGeometry args={[0.1, 0.1, 0.2, 8]} />
            <meshStandardMaterial color="#111" />
          </mesh>
        ))}
      </group>

      {/* -- Legs -- */}
      {legs.map((legState, i) => {
        return (
          <GSpiderLeg
            key={i}
            parentRef={groupRef}
            config={legConfigs[i]}
            legState={legState}
            visualConfig={visualConfig}
          />
        );
      })}

      {/* -- Footstep Dust System -- */}
      <FootDust ref={dustRef} />
    </>
  );
};

export default GSpider;