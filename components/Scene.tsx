import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import Terrain from './Terrain';
import Spider from './Spider';
import Background from './Background';
import { BiomeConfig, VisualConfig, PhysicsConfig } from '../types';
import { DynamicShadowLight } from './DynamicShadowLight';
import useGameStore from '../store/gameStore';
import { applyTerrainCamera } from '../utils/terrainCamera';

interface SceneProps {
    biome: BiomeConfig;
    onCaptureRef?: (fn: () => Promise<string>) => void;
}

const SceneContent: React.FC<{ biome: BiomeConfig, setTarget: (v: THREE.Vector3) => void, target: THREE.Vector3, onCaptureRef?: (fn: () => Promise<string>) => void }> = ({ biome, setTarget, target, onCaptureRef }) => {
    const { scene, gl, camera } = useThree();
    const terrainCameraEnabled = useGameStore((state) => state.terrainCameraEnabled);
    const controlsRef = useRef<any>(null);

    // Define constant sun position for lighting and background sync
    const sunPos = useMemo(() => new THREE.Vector3(10, 20, 10), []);
    const sunDir = useMemo(() => sunPos.clone().normalize(), [sunPos]);

    // Added for Spider compatibility
    const mousePosRef = useRef(new THREE.Vector3());
    const onMoveStateChange = () => { };
    const characterPosRef = useRef(new THREE.Vector3(0, 5, 0));

    const visualConfig: VisualConfig = useMemo(() => ({
        showBody: true,
        showPlating: false,
        platingOpacity: 1,
        spiderHeadColor: "#222222",
        spiderBodyColor: "#1a1a20",
        spiderLegColor: "#1a1a20",
        faceLightColor: "#ff0044",
        faceLightIntensity: 20,
        faceLightDistance: 34,
        faceLightAngle: 0.95,
        faceLightPenumbra: 0.8,
    }), []);

    const physicsConfig: PhysicsConfig = useMemo(() => ({
        speed: 4.5,
        turnSpeed: 2.9,
        bodyHeight: 1.5,
        stepHeight: 1.0,
        stepDuration: 0.29,
        gaitThreshold: 1.5,
        gaitRecovery: 1.4,
        maxActiveSteps: 3,
        frontLegReach: 0.6,
        frontLegSpread: 0.8,
        frontLegStepDurationMult: 0.9,
        frontLegGaitThresholdMult: 0.9,
        abdomenScale: 1.2,
        hullScale: 1.0,
    }), []);

    useEffect(() => {
        // Scene background is now handled by the Background component mesh
        // We only update fog to blend distant terrain
        scene.fog = new THREE.FogExp2(biome.fogColor, biome.fogDensity);
    }, [biome, scene]);

    // Apply terrain camera settings when enabled
    useEffect(() => {
        if (terrainCameraEnabled && controlsRef.current) {
            applyTerrainCamera(camera, controlsRef.current);
        }
    }, [terrainCameraEnabled]);

    // Handle Capture Reference for Gemini Vision
    useEffect(() => {
        if (onCaptureRef) {
            onCaptureRef(async () => {
                // Force a render to ensure the buffer is populated for capture
                gl.render(scene, camera);
                return gl.domElement.toDataURL('image/png');
            });
        }
    }, [onCaptureRef, gl, scene, camera]);

    const handlePointerDown = (e: any) => {
        // Raycast to floor
        if (e.object.type === 'Mesh') {
            setTarget(e.point);
        }
    };

    return (
        <>
            <Background
                colorSpace={biome.skyColorTop}
                colorHorizon={biome.skyColorBottom}
                colorSun={biome.lightColor}
                sunDirection={sunDir}
                distortionStrength={0.2}
            />

            <ambientLight intensity={0.4} />
            <DynamicShadowLight
                characterPosRef={characterPosRef}
                sunDirection={sunDir}
                intensity={biome.lightIntensity}
                color={biome.lightColor}
            />

            <Spider
                target={target}
                mousePosRef={mousePosRef}
                onMoveStateChange={onMoveStateChange}
                visualConfig={visualConfig}
                physicsConfig={physicsConfig}
                terrainType="sand"
                isLocked={false}
                controlsRef={controlsRef}
                sharedPosRef={characterPosRef}
            />

            <group onClick={handlePointerDown}>
                <Terrain
                    color={biome.groundColor}
                    characterPosRef={characterPosRef}
                />
            </group>

            {/* Visual Target Indicator */}
            <mesh position={target}>
                <ringGeometry args={[0.2, 0.3, 32]} />
                <meshBasicMaterial color="white" transparent opacity={0.5} side={THREE.DoubleSide} />
            </mesh>

            <OrbitControls ref={controlsRef} maxPolarAngle={Math.PI / 2 - 0.1} />
            {/* Stars component removed as Background shader includes procedural stars */}
        </>
    );
}

const Scene: React.FC<SceneProps> = ({ biome, onCaptureRef }) => {
    const [target, setTarget] = useState(new THREE.Vector3(0, 0, 5));

    return (
        <Canvas
            shadows
            camera={{ position: [8, 5, 8], fov: 45, far: 3000 }} // Increased far clip for background sphere
            gl={{ preserveDrawingBuffer: true }} // Required for screenshot capture
        >
            <SceneContent biome={biome} setTarget={setTarget} target={target} onCaptureRef={onCaptureRef} />
        </Canvas>
    );
};

export default Scene;