import React, { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useSpiderController } from '../hooks/useSpiderController';
import SpiderBody from './SpiderBody';
import SpiderLeg from './SpiderLeg';
import { FootDust, FootDustHandle } from './FootDust';
import { VisualConfig, PhysicsConfig, TerrainType } from '../types';

interface SpiderProps {
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

const Spider: React.FC<SpiderProps> = ({
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
      // Maintain the relative offset between camera and target
      const offset = camera.position.clone().sub(controls.target);

      // Update OrbitControls target to match spider
      controls.target.lerp(targetPos, 0.1);

      // Move camera to keep the same relative view
      camera.position.addVectors(controls.target, offset);
    }
  });

  return (
    <>
      <group ref={groupRef}>
        <SpiderBody
          headRef={headRef as any}
          bodyMeshRef={bodyMeshRef as any}
          visualConfig={visualConfig}
          abdomenScale={physicsConfig.abdomenScale}
          hullScale={physicsConfig.hullScale}
        />

        {/* Shoulder Mounts Visuals */}
        {legConfigs.map(config => (
          <mesh key={`mount-${config.id}`} position={config.originOffset} visible={visualConfig.showBody}>
            <cylinderGeometry args={[0.15, 0.2, 0.2, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
      </group>

      {/* -- Legs -- */}
      {legs.map((legState, i) => {
        return (
          <SpiderLeg
            key={i}
            parentRef={groupRef as any}
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

export default Spider;