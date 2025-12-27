import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { lerp } from '../utils/helpers';

interface HoverSphereProps {
    target: Vector3;
    onMoveStateChange: (moving: boolean) => void;
    isLocked?: boolean;
    controlsRef?: React.MutableRefObject<any>;
    sharedPosRef?: React.MutableRefObject<Vector3>;
}

export const HoverSphere: React.FC<HoverSphereProps> = ({ target, onMoveStateChange, isLocked, controlsRef, sharedPosRef }) => {
    const ref = useRef<Group>(null);
    const [pos] = useState(() => sharedPosRef ? sharedPosRef.current.clone() : new Vector3(0, 5, 0));

    useFrame((state, delta) => {
        if (!ref.current) return;

        // Update shared pos
        if (sharedPosRef) {
            sharedPosRef.current.copy(pos);
        }

        const dist = pos.distanceTo(target);
        if (onMoveStateChange) onMoveStateChange(dist > 0.1);

        if (dist > 0.1) {
            const dir = new Vector3().subVectors(target, pos).normalize();
            pos.add(dir.multiplyScalar(10 * delta));
        }

        // Hover effect
        const targetY = 3 + Math.sin(state.clock.elapsedTime * 2) * 0.5;
        // If we switched from something high, lerp down
        pos.y = lerp(pos.y, targetY, 0.1);

        ref.current.position.copy(pos);

        // Camera Follow
        if (isLocked && controlsRef?.current) {
            controlsRef.current.target.lerp(pos, 0.1);
            controlsRef.current.update();
        }
    });

    return (
        <group ref={ref}>
            <mesh castShadow receiveShadow>
                <sphereGeometry args={[1.5, 32, 32]} />
                <meshStandardMaterial color="cyan" roughness={0.2} metalness={0.8} />
            </mesh>
            <pointLight intensity={2} color="cyan" distance={10} />
        </group>
    );
}