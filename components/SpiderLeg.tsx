import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, Object3D, Group, Mesh } from 'three';
import { LegState, LegConfiguration, VisualConfig } from '../types';
import { solveIK3Bone } from '../utils/helpers';

// Reusable math objects for Visuals to avoid GC
const _vec3_a = new Vector3();
const _vec3_b = new Vector3();
const _vec3_c = new Vector3();
const _quat_a = new Quaternion();
const _vec3_mid = new Vector3();
const _vec3_look = new Vector3();

interface SpiderLegProps {
  parentRef: React.MutableRefObject<Group>;
  legState: LegState;
  config: LegConfiguration;
  visualConfig: VisualConfig;
}

/**
 * SpiderLeg (Organic 3-Segment)
 * Updated to 3 bones: Coxa, Femur, Tibia
 * 
 * Visual Style: Standard Organic/Mechanical Leg
 * Segment 1 (Coxa) connects shoulder to hip directly.
 */
const SpiderLeg: React.FC<SpiderLegProps> = ({ parentRef, legState, config, visualConfig }) => {
  const meshLeg1 = useRef<Mesh>(null); // Coxa (Hip)
  const meshLeg2 = useRef<Mesh>(null); // Femur (Upper Leg)
  const meshLeg3 = useRef<Mesh>(null); // Tibia (Lower Leg)

  const meshJoint1 = useRef<Mesh>(null); // Hip Joint
  const meshJoint2 = useRef<Mesh>(null); // Knee Joint

  const meshFoot = useRef<Mesh>(null);

  const legColor = visualConfig.spiderLegColor || "#1a1a20";
  const plateColor = visualConfig.spiderPlateColor || "#ff6600";
  const glowColor = visualConfig.jointGlowColor || "#00ccff";

  useFrame(() => {
    if (!parentRef.current || !meshLeg1.current || !meshLeg2.current || !meshLeg3.current) return;

    // 1. Get World Positions relative to the Body (Parent)
    const shoulderPos = _vec3_a.copy(config.originOffset).applyMatrix4(parentRef.current.matrixWorld);

    // Safety: Clamp foot position to max reach
    let footPos = legState.currentPos;
    const dist = shoulderPos.distanceTo(footPos);
    const maxReach = config.maxReach * 0.99;

    if (dist > maxReach) {
      const dir = _vec3_b.subVectors(footPos, shoulderPos).normalize();
      footPos = _vec3_c.copy(shoulderPos).add(dir.multiplyScalar(maxReach));
    }

    // 2. Solve 3-Bone IK
    const bodyUp = _vec3_b.set(0, 1, 0).applyQuaternion(parentRef.current.getWorldQuaternion(_quat_a));
    const bodyCenter = _vec3_look.setFromMatrixPosition(parentRef.current.matrixWorld);
    const hintForward = new Vector3().subVectors(shoulderPos, bodyCenter).normalize();

    // The helper returns positions for Joint 1 (End of Coxa) and Joint 2 (End of Femur)
    const ikResult = solveIK3Bone(
      shoulderPos,
      footPos,
      config.l1,
      config.l2,
      config.l3,
      bodyUp,
      hintForward
    );

    if (ikResult) {
      const j1 = ikResult.j1;
      const j2 = ikResult.j2;

      // --- VISUAL STANCE ADJUSTMENT ---
      // Lift the Hip Joint (J1) to create an arched "Spider" stance.
      // Without this, the Coxa stays perfectly horizontal.
      j1.y += 0.5;

      const rotationFix = -Math.PI / 2;

      // --- SEGMENT 1 (Coxa) ---
      // From Shoulder -> Joint 1
      _vec3_mid.addVectors(shoulderPos, j1).multiplyScalar(0.5);
      meshLeg1.current.position.copy(_vec3_mid);
      meshLeg1.current.lookAt(j1);
      // Align cylinder (Y-axis) to bone vector (Z-axis)
      meshLeg1.current.rotateX(rotationFix);

      const d1 = shoulderPos.distanceTo(j1);
      meshLeg1.current.scale.set(1, 1, d1); // Scale Z to match length

      // --- JOINT 1 (Hip) ---
      if (meshJoint1.current) meshJoint1.current.position.copy(j1);

      // --- SEGMENT 2 (Femur) ---
      _vec3_mid.addVectors(j1, j2).multiplyScalar(0.5);
      meshLeg2.current.position.copy(_vec3_mid);
      meshLeg2.current.lookAt(j2);
      meshLeg2.current.rotateX(rotationFix);
      const d2 = j1.distanceTo(j2);
      meshLeg2.current.scale.set(1, 1, d2);

      // --- JOINT 2 (Knee) ---
      if (meshJoint2.current) meshJoint2.current.position.copy(j2);

      // --- SEGMENT 3 (Tibia) ---
      _vec3_mid.addVectors(j2, footPos).multiplyScalar(0.5);
      meshLeg3.current.position.copy(_vec3_mid);
      meshLeg3.current.lookAt(footPos);
      meshLeg3.current.rotateX(rotationFix);
      const d3 = j2.distanceTo(footPos);
      meshLeg3.current.scale.set(1, 1, d3);

      // --- FOOT ---
      if (meshFoot.current) meshFoot.current.position.copy(footPos);
    }
  });

  // --- GEOMETRY ---
  return (
    <group>
      {/* SEGMENT 1: COXA (Connected to Shoulder) */}
      <mesh ref={meshLeg1} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.01, 1.0, 12]} />
        <meshStandardMaterial color={legColor} roughness={0.4} />
        {visualConfig.showPlating && (
          <mesh castShadow receiveShadow position={[0, 0, 0]} scale={[1.1, 0.8, 1.1]}>
            <cylinderGeometry args={[0.15, 0.12, 1.0, 12]} />
            <meshStandardMaterial color={plateColor} transparent opacity={visualConfig.platingOpacity} />
          </mesh>
        )}
      </mesh>

      {/* JOINT 1: HIP */}
      <mesh ref={meshJoint1} castShadow receiveShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
        <mesh castShadow receiveShadow scale={[1.05, 1.05, 1.05]}>
          <torusGeometry args={[0.16, 0.02, 8, 16]} />
          <meshBasicMaterial color={glowColor} />
        </mesh>
      </mesh>

      {/* SEGMENT 2: FEMUR */}
      <mesh ref={meshLeg2} castShadow receiveShadow>
        <cylinderGeometry args={[0.15, 0.12, 1.0, 12]} />
        <meshStandardMaterial color={legColor} roughness={0.4} />
        {visualConfig.showPlating && (
          <mesh castShadow receiveShadow position={[0, 0, 0]} scale={[1.1, 0.8, 1.1]}>
            <cylinderGeometry args={[0.15, 0.12, 1.0, 12]} />
            <meshStandardMaterial color={plateColor} transparent opacity={visualConfig.platingOpacity} />
          </mesh>
        )}
      </mesh>

      {/* JOINT 2: KNEE */}
      <mesh ref={meshJoint2} castShadow receiveShadow>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#333" roughness={0.5} />
        <mesh castShadow receiveShadow scale={[1.05, 1.05, 1.05]}>
          <torusGeometry args={[0.16, 0.02, 8, 16]} />
          <meshBasicMaterial color={glowColor} />
        </mesh>
      </mesh>

      {/* SEGMENT 3: TIBIA */}
      <mesh ref={meshLeg3} castShadow receiveShadow>
        <cylinderGeometry args={[0.10, 0.04, 1.0, 12]} />
        <meshStandardMaterial color={legColor} roughness={0.4} />
        {visualConfig.showPlating && (
          <mesh castShadow receiveShadow position={[0, 0.1, 0]} scale={[1.1, 0.5, 1.1]}>
            <cylinderGeometry args={[0.10, 0.08, 1.0, 12]} />
            <meshStandardMaterial color={plateColor} transparent opacity={visualConfig.platingOpacity} />
          </mesh>
        )}
      </mesh>

      {/* FOOT */}
      <mesh ref={meshFoot} castShadow receiveShadow>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
};

export default SpiderLeg;