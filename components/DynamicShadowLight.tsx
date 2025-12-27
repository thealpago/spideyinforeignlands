import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DirectionalLight, Vector3, Object3D } from 'three';

interface DynamicShadowLightProps {
    characterPosRef: React.MutableRefObject<Vector3>;
    sunDirection: Vector3;
    intensity: number;
    color: string;
}

/**
 * Dynamic Shadow Light Component
 * Follows the character to ensure shadows are always rendered
 * Prevents shadow camera frustum from losing the character
 */
export const DynamicShadowLight: React.FC<DynamicShadowLightProps> = ({
    characterPosRef,
    sunDirection,
    intensity,
    color
}) => {
    const lightRef = useRef<DirectionalLight>(null);
    const targetRef = useRef<Object3D>(new Object3D());

    // Update shadow camera to follow character
    useFrame(() => {
        if (!lightRef.current || !targetRef.current) return;

        const characterPos = characterPosRef.current;

        // Position the shadow camera target at the character
        targetRef.current.position.set(
            characterPos.x,
            0, // Ground level
            characterPos.z
        );

        // Update the shadow camera position to maintain sun direction
        const offset = sunDirection.clone().multiplyScalar(100);
        lightRef.current.position.set(
            characterPos.x + offset.x,
            offset.y,
            characterPos.z + offset.z
        );

        // Update matrices for shadow calculations
        targetRef.current.updateMatrixWorld();
        if (lightRef.current.shadow?.camera) {
            lightRef.current.shadow.camera.updateProjectionMatrix();
        }
    });

    return (
        <directionalLight
            ref={lightRef}
            intensity={intensity}
            color={color}
            castShadow
            // Ultra High Quality Shadow Map
            shadow-mapSize={[4096, 4096]}
            // Optimized bounds - covers ~120m area centered on character
            shadow-camera-left={-60}
            shadow-camera-right={60}
            shadow-camera-top={60}
            shadow-camera-bottom={-60}
            shadow-camera-near={0.1}
            shadow-camera-far={250}
            // Fine-tuned bias to prevent shadow acne and peter panning
            shadow-bias={-0.00005}
            shadow-normalBias={0.04}
        >
            {/* Shadow camera target - will be updated by useFrame */}
            <primitive object={targetRef.current} attach="target" />
        </directionalLight>
    );
};
