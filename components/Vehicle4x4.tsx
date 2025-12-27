import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3, Quaternion, Group, MathUtils, Euler } from 'three';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { getTerrainHeight } from '../utils/helpers';
import { PhysicsConfig, TerrainType } from '../types';
// @ts-ignore
import EngineAudio from './scene/vehicles/EngineAudio';
// @ts-ignore
import { vehicleState } from '../store/gameStore';

// -------------------------------
// Controller
// -------------------------------
const useVehicleController = (
    target: Vector3,
    onMoveStateChange: (isMoving: boolean) => void,
    physicsConfig: PhysicsConfig,
    terrainType: TerrainType,
    sharedPosRef?: React.MutableRefObject<Vector3>
) => {
    const groupRef = useRef<Group>(null);
    const wasMovingRef = useRef(false);

    // ===== Tunables =====
    const WHEEL_SCALE = 3.0;
    const WHEEL_RADIUS = 1.3 * WHEEL_SCALE; // model-dependent
    const WHEEL_BASE_X = 2.4;
    const WHEEL_BASE_Z = 3.6;

    const SUSP_MAX_TRAVEL = 0.6;
    const SUSP_SPRING = 0.25;
    const BASE_WHEEL_Y = 0.35;

    const CLEARANCE = WHEEL_RADIUS + 0.1; // dynamic ground clearance

    const sim = useRef({
        position: sharedPosRef ? sharedPosRef.current.clone() : new Vector3(0, 10, 0),
        velocity: new Vector3(),
        quaternion: new Quaternion(),
        wheelRotation: 0,
        steeringAngle: 0,
        suspensionOffsets: [0, 0, 0, 0] as number[], // FL, FR, BL, BR
    });

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const s = sim.current;

        if (sharedPosRef) sharedPosRef.current.copy(s.position);

        // ------------------
        // Movement & Steering
        // ------------------
        const flatTarget = new Vector3(target.x, 0, target.z);
        const flatPos = new Vector3(s.position.x, 0, s.position.z);
        const dirToTarget = flatTarget.clone().sub(flatPos);
        const dist = dirToTarget.length();

        const isMoving = wasMovingRef.current ? dist > 0.5 : dist > 1.0;
        if (isMoving !== wasMovingRef.current) {
            wasMovingRef.current = isMoving;
            onMoveStateChange(isMoving);
        }

        let speed = 0;

        if (isMoving) {
            dirToTarget.normalize();

            const forward = new Vector3(0, 0, 1).applyQuaternion(s.quaternion).normalize();
            const aTarget = Math.atan2(dirToTarget.x, dirToTarget.z);
            const aForward = Math.atan2(forward.x, forward.z);

            let diff = aTarget - aForward;
            if (diff > Math.PI) diff -= Math.PI * 2;
            if (diff < -Math.PI) diff += Math.PI * 2;

            const steerTarget = MathUtils.clamp(diff * 2.0, -0.5, 0.5);
            s.steeringAngle = MathUtils.lerp(s.steeringAngle, steerTarget, delta * 5);

            const yawTurn = s.steeringAngle * delta * 2.5;
            s.quaternion.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yawTurn));

            speed = Math.min(physicsConfig.speed * 1.5, dist * 2.0);
            const velDir = new Vector3(0, 0, 1).applyQuaternion(s.quaternion).normalize();
            s.velocity.lerp(velDir.multiplyScalar(speed), delta * 2);

            // Physical wheel rotation: distance / radius
            s.wheelRotation += (speed * delta) / WHEEL_RADIUS;
        } else {
            s.velocity.lerp(new Vector3(0, 0, 0), delta * 5);
            s.steeringAngle = MathUtils.lerp(s.steeringAngle, 0, delta * 5);
        }

        // --- Audio Simulation ---
        const MAX_SPEED = physicsConfig.speed * 1.5;
        const speedRatio = speed / MAX_SPEED;
        const targetRpm = 800 + (speedRatio * 5000);

        // Update global vehicle state for audio
        vehicleState.rpm = MathUtils.lerp(vehicleState.rpm || 800, targetRpm, 0.1);
        vehicleState.throttle = isMoving ? 0.8 : 0;
        vehicleState.load = isMoving ? 0.6 : 0.1;
        vehicleState.speed = speed;
        // ------------------------

        s.position.add(s.velocity.clone().multiplyScalar(delta));

        // ------------------
        // Suspension & Ground Alignment
        // ------------------
        const forward = new Vector3(0, 0, 1).applyQuaternion(s.quaternion).normalize();
        const right = new Vector3(1, 0, 0).applyQuaternion(s.quaternion).normalize();

        const points = [
            forward.clone().multiplyScalar(WHEEL_BASE_Z).add(right.clone().multiplyScalar(WHEEL_BASE_X)),  // FL
            forward.clone().multiplyScalar(WHEEL_BASE_Z).add(right.clone().multiplyScalar(-WHEEL_BASE_X)), // FR
            forward.clone().multiplyScalar(-WHEEL_BASE_Z).add(right.clone().multiplyScalar(WHEEL_BASE_X)), // BL
            forward.clone().multiplyScalar(-WHEEL_BASE_Z).add(right.clone().multiplyScalar(-WHEEL_BASE_X)) // BR
        ].map(v => v.add(s.position));

        const heights = points.map(p => getTerrainHeight(p.x, p.z, terrainType));
        const avgH = (heights[0] + heights[1] + heights[2] + heights[3]) / 4;

        // Chassis vertical placement
        s.position.y = MathUtils.lerp(s.position.y, avgH + CLEARANCE, delta * 8);

        // Pitch & Roll
        const pitch = Math.atan2(((heights[0] + heights[1]) * 0.5) - ((heights[2] + heights[3]) * 0.5), WHEEL_BASE_Z * 2);
        const roll = Math.atan2(((heights[0] + heights[2]) * 0.5) - ((heights[1] + heights[3]) * 0.5), WHEEL_BASE_X * 2);

        const yaw = new Euler().setFromQuaternion(s.quaternion, 'YXZ').y;
        const targetQuat = new Quaternion()
            .setFromAxisAngle(new Vector3(0, 1, 0), yaw)
            .multiply(new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), pitch))
            .multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), -roll));

        s.quaternion.slerp(targetQuat, delta * 5);

        // Visual suspension offsets
        heights.forEach((h, i) => {
            const raw = (h - s.position.y) + WHEEL_RADIUS - BASE_WHEEL_Y;
            const clamped = MathUtils.clamp(raw, -SUSP_MAX_TRAVEL, SUSP_MAX_TRAVEL);
            s.suspensionOffsets[i] = MathUtils.lerp(s.suspensionOffsets[i], clamped, SUSP_SPRING);
        });

        groupRef.current.position.copy(s.position);
        groupRef.current.quaternion.copy(s.quaternion);
    });

    return {
        groupRef,
        wheelRotation: sim.current.wheelRotation,
        steeringAngle: sim.current.steeringAngle,
        suspensionOffsets: sim.current.suspensionOffsets,
        WHEEL_SCALE,
    };
};

// -------------------------------
// Component
// -------------------------------
interface Vehicle4x4Props {
    target: Vector3;
    onMoveStateChange: (isMoving: boolean) => void;
    isLocked: boolean;
    controlsRef: React.RefObject<any>;
    physicsConfig: PhysicsConfig;
    terrainType: TerrainType;
    sharedPosRef?: React.MutableRefObject<Vector3>;
}

const Vehicle4x4: React.FC<Vehicle4x4Props> = ({
    target,
    onMoveStateChange,
    isLocked,
    controlsRef,
    physicsConfig,
    terrainType,
    sharedPosRef,
}) => {
    const {
        groupRef,
        wheelRotation,
        steeringAngle,
        suspensionOffsets,
        WHEEL_SCALE,
    } = useVehicleController(
        target,
        onMoveStateChange,
        physicsConfig,
        terrainType,
        sharedPosRef
    );

    useFrame(() => {
        if (isLocked && groupRef.current && controlsRef?.current) {
            controlsRef.current.target.lerp(groupRef.current.position, 0.1);
        }
    });

    const { scene: bodyScene } = useGLTF('./models/yj.glb');
    const { scene: tireScene } = useGLTF('./models/bfg_km2.glb');
    const { scene: rimScene } = useGLTF('./models/rim.glb');

    // Enable shadows on all meshes
    useEffect(() => {
        [bodyScene, tireScene, rimScene].forEach(scene => {
            scene.traverse((child: any) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
        });
    }, [bodyScene, tireScene, rimScene]);

    const WheelAssembly = ({ side, steer = 0 }: { side: 'left' | 'right'; steer?: number }) => {
        const tire = useMemo(() => tireScene.clone(), []);
        const rim = useMemo(() => rimScene.clone(), []);
        const isLeft = side === 'left';
        const RIM_RATIO = 0.72;

        return (
            <group rotation={[0, steer, 0]}>
                <group rotation={[wheelRotation, Math.PI / 2, 0]}>
                    <primitive
                        object={tire}
                        scale={[(isLeft ? 1 : -1) * WHEEL_SCALE, WHEEL_SCALE, WHEEL_SCALE]}
                    />
                    <primitive
                        object={rim}
                        scale={WHEEL_SCALE * RIM_RATIO}
                        rotation={[0, isLeft ? 0 : Math.PI, 0]}
                    />
                </group>
            </group>
        );
    };

    const CHASSIS_SCALE = 3.0;
    const wheelX = 2.4;
    const wheelZ = 3.6;
    const wheelY = 0.35;

    return (
        <group ref={groupRef}>
            {/* @ts-ignore */}
            <EngineAudio isActive={isLocked} />
            <primitive object={bodyScene} scale={CHASSIS_SCALE} />

            <group position={[wheelX, wheelY + suspensionOffsets[0], wheelZ]}>
                <WheelAssembly side="left" steer={steeringAngle} />
            </group>
            <group position={[-wheelX, wheelY + suspensionOffsets[1], wheelZ]}>
                <WheelAssembly side="right" steer={steeringAngle} />
            </group>
            <group position={[wheelX, wheelY + suspensionOffsets[2], -wheelZ]}>
                <WheelAssembly side="left" />
            </group>
            <group position={[-wheelX, wheelY + suspensionOffsets[3], -wheelZ]}>
                <WheelAssembly side="right" />
            </group>

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
                <planeGeometry args={[5, 8]} />
                <meshBasicMaterial color="black" transparent opacity={0.6} depthWrite={false} />
            </mesh>
        </group>
    );
};

export default Vehicle4x4;
