import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import { Vector3, Quaternion, Object3D, Group, Mesh } from 'three';
import { LegState, LegConfiguration, VisualConfig } from '../types';
import { solveIK3Bone } from '../utils/helpers';

// Solar Panel Component
const SolarPanel: React.FC<{ visualConfig: VisualConfig }> = ({ visualConfig }) => {
  const { deploy } = useSpring({
    deploy: visualConfig.solarPanelsOpen ? 1 : 0,
    config: { mass: 1, tension: 170, friction: 26 }
  });

  return (
    // @ts-ignore
    <animated.group
      position={[0, 0.12, 0]} // On Top of Leg
      rotation={[0, 0, 0]}
      scale={deploy.to(s => [s, s, s])}
    >
      {/* Central Spine */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.05, 0.4]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Left Wing - Flaps Up */}
      <animated.group
        // Fold Up (-90 deg Z) to Flat (0 deg)
        rotation-z={deploy.to(d => (d - 1) * (Math.PI * 0.5))}
        position={[-0.05, 0.02, 0]}
      >
        <mesh position={[-0.35, 0, 0]}>
          <boxGeometry args={[0.7, 0.02, 1.2]} />
          <meshPhysicalMaterial
            color="#44aaff"
            emissive="#002244"
            emissiveIntensity={0.3}
            roughness={0.1}
            metalness={0.9}
            transparent={true}
            opacity={0.7}
            transmission={0.1}
          />
          <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.65, "1.2"]} />
            <meshBasicMaterial color="#88ccff" wireframe transparent opacity={0.4} />
          </mesh>
        </mesh>
      </animated.group>

      {/* Right Wing - Flaps Up */}
      <animated.group
        // Fold Up (+90 deg Z) to Flat (0 deg)
        rotation-z={deploy.to(d => (1 - d) * (Math.PI * 0.5))}
        position={[0.05, 0.02, 0]}
      >
        <mesh position={[0.35, 0, 0]}>
          <boxGeometry args={[0.7, 0.02, 1.2]} />
          <meshPhysicalMaterial
            color="#44aaff"
            emissive="#002244"
            emissiveIntensity={0.3}
            roughness={0.1}
            metalness={0.9}
            transparent={true}
            opacity={0.7}
            transmission={0.1}
          />
          <mesh position={[0, 0.011, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.65, 1.2]} />
            <meshBasicMaterial color="#88ccff" wireframe transparent opacity={0.4} />
          </mesh>
        </mesh>
      </animated.group>
    </animated.group>
  );
};

// Reusable math objects for Visuals to avoid GC
const _vec3_a = new Vector3();
const _vec3_b = new Vector3();
const _vec3_c = new Vector3();
const _quat_a = new Quaternion();
const _vec3_mid = new Vector3();
const _vec3_look = new Vector3();

interface LegVisualProps {
  shoulderRef: React.MutableRefObject<Object3D>;
  legState: LegState;
  config: LegConfiguration;
  visualConfig: VisualConfig;
}

/**
 * GSpiderLegVisual
 * Updated to 3 Segments (Coxa, Femur, Tibia)
 */
const LegVisual: React.FC<LegVisualProps> = ({ shoulderRef, legState, config, visualConfig }) => {
  // 3 Leg Segments
  const meshLeg1 = useRef<Mesh>(null); // Coxa
  const meshLeg2 = useRef<Group>(null); // Femur Group
  const meshLeg2Visual = useRef<Mesh>(null); // Femur Cylinder
  const meshLeg3 = useRef<Mesh>(null); // Tibia

  // 2 Joints + Foot
  const meshJoint1 = useRef<Group>(null);
  const meshJoint2 = useRef<Group>(null);
  const meshFoot = useRef<Mesh>(null);

  const legColor = visualConfig.spiderLegColor || "#2a2a35";

  useFrame(() => {
    if (!shoulderRef.current || !meshLeg1.current || !meshLeg2.current || !meshLeg3.current) return;

    // 1. Get World Positions
    const shoulderPos = _vec3_a.set(0, 0, 0).applyMatrix4(shoulderRef.current.matrixWorld);

    // Safety: Clamp foot position to max reach
    let footPos = legState.currentPos;
    const dist = shoulderPos.distanceTo(footPos);
    const maxReach = config.maxReach * 0.99;

    if (dist > maxReach) {
      const dir = _vec3_b.subVectors(footPos, shoulderPos).normalize();
      footPos = _vec3_c.copy(shoulderPos).add(dir.multiplyScalar(maxReach));
    }

    // 2. Solve 3-Bone IK
    const bodyUp = _vec3_b.set(0, 1, 0).applyQuaternion(shoulderRef.current.getWorldQuaternion(_quat_a));
    const bodyCenter = _vec3_look.setFromMatrixPosition(shoulderRef.current.parent?.matrixWorld || shoulderRef.current.matrixWorld);
    const hintForward = new Vector3().subVectors(shoulderPos, bodyCenter).normalize();

    // Returns { j1, j2 } where j1 is end of Coxa, j2 is end of Femur
    const ikResult = solveIK3Bone(
      shoulderPos,
      footPos,
      config.l1,
      config.l2,
      config.l3, // Uses the 3rd leg length from config
      bodyUp,
      hintForward
    );

    if (ikResult) {
      const { j1, j2 } = ikResult;

      // Optional: Lift J1 slightly for a more "arched" mechanical look
      // j1.y += 0.1;

      // --- SEGMENT 1 (Coxa: Shoulder -> J1) ---
      _vec3_mid.addVectors(shoulderPos, j1).multiplyScalar(0.5);
      meshLeg1.current.position.copy(_vec3_mid);
      meshLeg1.current.lookAt(j1);
      meshLeg1.current.rotateX(Math.PI / 2);
      meshLeg1.current.scale.set(1, shoulderPos.distanceTo(j1), 1);

      // Joint 1
      if (meshJoint1.current) meshJoint1.current.position.copy(j1);

      // --- SEGMENT 2 (Femur: J1 -> J2) ---
      // Apply Group Transform
      _vec3_mid.addVectors(j1, j2).multiplyScalar(0.5);
      meshLeg2.current.position.copy(_vec3_mid);
      meshLeg2.current.lookAt(j2);
      // No group scaling/rotation to avoid distorting children

      // Apply Visual Mesh Transform
      if (meshLeg2Visual.current) {
        meshLeg2Visual.current.scale.set(1, j1.distanceTo(j2), 1);
        meshLeg2Visual.current.rotation.set(Math.PI / 2, 0, 0);
      }

      // Joint 2
      if (meshJoint2.current) {
        meshJoint2.current.position.copy(j2);
        // Angle Joint 2 to match bend
        meshJoint2.current.lookAt(j1);
      }

      // --- SEGMENT 3 (Tibia: J2 -> Foot) ---
      _vec3_mid.addVectors(j2, footPos).multiplyScalar(0.5);
      meshLeg3.current.position.copy(_vec3_mid);
      meshLeg3.current.lookAt(footPos);
      meshLeg3.current.rotateX(Math.PI / 2);
      meshLeg3.current.scale.set(1, j2.distanceTo(footPos), 1);

      // Foot
      if (meshFoot.current) meshFoot.current.position.copy(footPos);
    }
  });

  return (
    <group>
      {/* SEGMENT 1 (Upper/Coxa) */}
      <mesh ref={meshLeg1} castShadow receiveShadow>
        <cylinderGeometry args={[0.14, 0.12, 1, 6]} />
        <meshStandardMaterial color={legColor} roughness={0.4} metalness={0.8} />
      </mesh>

      {/* JOINT 1 */}
      <group ref={meshJoint1}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.35, 12]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
        {/* Glowing Rings */}
        <mesh position={[0.12, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.1, 0.01, 8, 16]} />
          <meshBasicMaterial color={visualConfig.jointGlowColor || "#00ffcc"} />
        </mesh>
      </group>

      {/* SEGMENT 2 (Middle/Femur) - GROUP */}
      <group ref={meshLeg2}>
        {/* Visual Cylinder */}
        <mesh ref={meshLeg2Visual} castShadow receiveShadow>
          <cylinderGeometry args={[0.12, 0.09, 1, 6]} />
          <meshStandardMaterial color={legColor} roughness={0.4} metalness={0.7} />

          {/* Plating visual attached to cylinder (still scaled, might look stretched but OK for simple plate) */}
          {visualConfig.showPlating && (
            <mesh position={[0, 0, 0.1]}>
              <boxGeometry args={[0.2, 0.6, 0.05]} />
              <meshStandardMaterial color="#3a3a45" />
            </mesh>
          )}
        </mesh>

        {/* -- SOLAR PANEL ATTACHMENT (Unscaled) -- */}
        <SolarPanel visualConfig={visualConfig} />
      </group>

      {/* JOINT 2 */}
      <group ref={meshJoint2}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.11, 0.11, 0.3, 12]} />
          <meshStandardMaterial color="#111" roughness={0.5} />
        </mesh>
      </group>

      {/* SEGMENT 3 (Lower/Tibia) */}
      <mesh ref={meshLeg3} castShadow receiveShadow>
        <cylinderGeometry args={[0.09, 0.04, 1, 6]} />
        <meshStandardMaterial color={legColor} roughness={0.4} metalness={0.6} />
      </mesh>

      {/* FOOT */}
      <mesh ref={meshFoot} receiveShadow castShadow>
        <cylinderGeometry args={[0.04, 0.08, 0.15, 8]} />
        <meshStandardMaterial color="#111" />
      </mesh>
    </group>
  );
};

interface LegProxyProps {
  parentRef: React.RefObject<Group>;
  config: LegConfiguration;
  legState: LegState;
  visualConfig: VisualConfig;
}

const GSpiderLeg: React.FC<LegProxyProps> = ({ parentRef, config, legState, visualConfig }) => {
  const shoulderRef = useRef(new Object3D()); // Initialize directly

  useFrame(() => {
    if (parentRef.current) {
      // Ensure shoulder remains attached to parent group
      if (shoulderRef.current.parent !== parentRef.current) {
        parentRef.current.add(shoulderRef.current);
        shoulderRef.current.position.copy(config.originOffset);
      }
    }
  });

  return <LegVisual shoulderRef={shoulderRef} legState={legState} config={config} visualConfig={visualConfig} />;
};

export default GSpiderLeg;