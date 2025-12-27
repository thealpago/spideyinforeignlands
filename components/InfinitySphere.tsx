import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, Group, Mesh } from 'three';
import { getTerrainHeight } from '../utils/helpers';
import { TerrainType, SphereConfig } from '../types';

interface InfinitySphereProps {
    target: Vector3;
    onMoveStateChange: (moving: boolean) => void;
    isLocked?: boolean;
    controlsRef?: React.MutableRefObject<any>;
    sharedPosRef?: React.MutableRefObject<Vector3>;
    terrainType: TerrainType;
    config: SphereConfig;
}

export const InfinitySphere: React.FC<InfinitySphereProps> = ({ 
    target, 
    onMoveStateChange, 
    isLocked, 
    controlsRef, 
    sharedPosRef,
    terrainType,
    config
}) => {
    const groupRef = useRef<Group>(null);
    const meshRef = useRef<Mesh>(null);
    
    // Dynamic Radius from config
    const RADIUS = config.radius;
    const SPEED = 20;

    // Initialize position from shared ref or default
    const [pos] = useState(() => {
        const start = sharedPosRef ? sharedPosRef.current.clone() : new Vector3(0, 5, 0);
        // Use terrainType for initial height calculation
        const groundH = getTerrainHeight(start.x, start.z, terrainType);
        start.y = Math.max(start.y, groundH + RADIUS);
        return start;
    });

    // Rotation quaternion for the rolling effect
    const q = useMemo(() => new Quaternion(), []);
    const upAxis = useMemo(() => new Vector3(0, 1, 0), []);
    const moveDir = useMemo(() => new Vector3(), []);
    const rotationAxis = useMemo(() => new Vector3(), []);

    useFrame((state, delta) => {
        if (!groupRef.current || !meshRef.current) return;

        // 1. Logic: Move towards target
        // Ignore Y for distance calculation (planar movement logic first)
        const dx = target.x - pos.x;
        const dz = target.z - pos.z;
        const dist = Math.sqrt(dx*dx + dz*dz);
        
        const isMoving = dist > 0.1;
        if (onMoveStateChange) onMoveStateChange(isMoving);

        // Update Shared Ref
        if (sharedPosRef) sharedPosRef.current.copy(pos);

        if (isMoving) {
            // Calculate movement amount for this frame
            const moveStep = Math.min(dist, SPEED * delta);
            
            // Normalize direction
            moveDir.set(dx, 0, dz).normalize();

            // Apply position change
            pos.x += moveDir.x * moveStep;
            pos.z += moveDir.z * moveStep;

            // 2. Physics: Rolling Rotation
            // To roll correctly, we rotate around an axis perpendicular to the movement direction.
            // Axis = Up x MoveDirection
            rotationAxis.crossVectors(upAxis, moveDir).normalize();

            // Arc length formula: s = r * theta  =>  theta = s / r
            const theta = moveStep / RADIUS;
            
            // Create rotation quaternion for this frame
            const deltaQ = new Quaternion().setFromAxisAngle(rotationAxis, theta);
            
            // Multiply current rotation by delta rotation
            meshRef.current.quaternion.premultiply(deltaQ);
        }

        // 3. Terrain Following
        // Snap Y to terrain height + radius using the CURRENT TERRAIN TYPE
        const terrainH = getTerrainHeight(pos.x, pos.z, terrainType);
        
        // Smooth Y transition slightly to avoid jitter on sharp edges
        // We use a faster lerp factor (0.3) so it doesn't sink into steep hills
        pos.y += (terrainH + RADIUS - pos.y) * 0.3;

        // Apply visual updates
        groupRef.current.position.copy(pos);

        // 4. Camera Follow
        if (isLocked && controlsRef?.current) {
            controlsRef.current.target.lerp(pos, 0.1);
            controlsRef.current.update();
        }
    });

    return (
        <group ref={groupRef}>
            <mesh ref={meshRef} castShadow receiveShadow>
                <sphereGeometry args={[RADIUS, 32, 32]} />
                {config.useRainbow ? (
                     <meshNormalMaterial wireframe={config.wireframe} />
                ) : (
                    <meshStandardMaterial 
                        color={config.color} 
                        wireframe={config.wireframe} 
                        roughness={0.2} 
                        metalness={0.8} 
                    />
                )}
            </mesh>
            
            {/* Inner glow core - changes size with radius */}
            <mesh scale={[0.8, 0.8, 0.8]}>
                <sphereGeometry args={[RADIUS, 16, 16]} />
                <meshBasicMaterial 
                    color={config.useRainbow ? "#00ffff" : config.color} 
                    transparent 
                    opacity={config.glowIntensity} 
                />
            </mesh>
        </group>
    );
};