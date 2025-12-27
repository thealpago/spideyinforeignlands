import React, { useMemo } from 'react';
import { Group, Mesh, Object3D, SphereGeometry, Vector3 } from 'three';
import { VisualConfig } from '../types';

interface BodyProps {
    headRef: React.MutableRefObject<Group>;
    bodyMeshRef: React.MutableRefObject<Mesh>;
    visualConfig: VisualConfig;
    abdomenScale?: number;
    hullScale?: number;
}

const SpiderBody: React.FC<BodyProps> = ({ headRef, bodyMeshRef, visualConfig, abdomenScale = 1.0, hullScale = 1.0 }) => {

    const lightTarget = useMemo(() => {
        const obj = new Object3D();
        obj.position.set(0, -2, 15);
        return obj;
    }, []);

    // --- Procedural Egg Geometry for Abdomen ---
    const eggGeometry = useMemo(() => {
        const geo = new SphereGeometry(1.0, 32, 32);
        const posAttribute = geo.attributes.position;
        const vertex = new Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);
            vertex.z *= 1.4;
            const zNorm = vertex.z / 1.4;
            const taper = 1.0 - (zNorm * 0.35);
            vertex.x *= taper;
            vertex.y *= taper;
            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }
        geo.computeVertexNormals();
        return geo;
    }, []);

    // --- Procedural Perfect Sphere Head ---
    // DESIGN: Perfect Sphere with a slight flat mount for the eye.
    const headGeometry = useMemo(() => {
        const geo = new SphereGeometry(1.0, 64, 64);
        const posAttribute = geo.attributes.position;
        const vertex = new Vector3();

        for (let i = 0; i < posAttribute.count; i++) {
            vertex.fromBufferAttribute(posAttribute, i);

            // 1. Perfect Sphere Logic
            // We do NOT scale X, Y, or Z in geometry. We use prop scaling.

            // 2. Front Face Cut
            // Create a flat mounting surface for the Cyclops eye
            const frontCutoff = 0.96;
            if (vertex.z > frontCutoff) {
                vertex.z = frontCutoff;
            }

            posAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
        }

        geo.computeVertexNormals();
        return geo;
    }, []);

    const bodyColor = visualConfig.spiderBodyColor || "#1a1a20";
    const plateColor = visualConfig.spiderPlateColor || "#ff6600";
    const glowColor = visualConfig.jointGlowColor || "#00ccff";
    const eyeColor = visualConfig.faceLightColor || "#ff0044";
    const headColor = visualConfig.spiderHeadColor || "#222222";

    return (
        <group ref={headRef} position={[0, 0, 0]} visible={visualConfig.showBody}>

            {/* -- Cephalothorax (Perfect Sphere Body) -- */}
            <mesh castShadow receiveShadow geometry={headGeometry} scale={[hullScale, hullScale, hullScale]}>
                <meshStandardMaterial color={headColor} roughness={0.4} metalness={0.6} />
            </mesh>

            {/* -- Armor Plating (Shell) -- */}
            <mesh castShadow receiveShadow scale={[hullScale * 1.01, hullScale * 1.01, hullScale * 1.01]} geometry={headGeometry}>
                <meshStandardMaterial
                    color={plateColor}
                    roughness={0.2}
                    metalness={0.8}
                    transparent
                    opacity={visualConfig.platingOpacity}
                    side={2}
                />
            </mesh>

            {/* -- CYCLOPS EYE (Mounted on Sphere Surface) -- */}
            {/* Positioned at z=0.96 scaled by hullScale to match surface */}
            <group position={[0, 0.0, 0.96 * hullScale]} scale={[hullScale, hullScale, hullScale]}>
                {/* Housing (Dark Metal Rim) */}
                <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                    <cylinderGeometry args={[0.28, 0.28, 0.1, 32]} />
                    <meshStandardMaterial color="#050505" roughness={0.8} metalness={0.5} />
                </mesh>

                {/* Outer Glowing Ring */}
                <mesh position={[0, 0, 0.06]}>
                    <torusGeometry args={[0.20, 0.03, 16, 32]} />
                    <meshBasicMaterial color={eyeColor} toneMapped={false} />
                </mesh>

                {/* Inner Lens - Large Domed */}
                <mesh position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
                    <sphereGeometry args={[0.16, 32, 16]} />
                    <meshBasicMaterial color={eyeColor} toneMapped={false} />
                </mesh>

                {/* Lens Glare */}
                <mesh position={[0, 0, 0.14]} rotation={[0, 0, 0]}>
                    <ringGeometry args={[0.0, 0.08, 32]} />
                    <meshBasicMaterial color="#ffffff" transparent opacity={0.5} side={2} />
                </mesh>
            </group>

            {/* -- Abdomen (Rear Body) -- */}
            {/* Moved relative to hull size to avoid clipping */}
            <group position={[0, 0.1, -1.1 * hullScale]} scale={[abdomenScale, abdomenScale, abdomenScale]}>
                <mesh castShadow receiveShadow geometry={eggGeometry}>
                    <meshStandardMaterial color={bodyColor} roughness={0.6} />
                </mesh>

                <mesh castShadow receiveShadow position={[0, 0, -0.35]} scale={[1.05, 1.05, 1.05]}>
                    <torusGeometry args={[0.95, 0.08, 16, 32]} />
                    <meshStandardMaterial color={plateColor} />
                </mesh>

                <mesh position={[0, 0.0, 1.1]}>
                    <sphereGeometry args={[0.15, 16, 16]} />
                    <meshBasicMaterial color={eyeColor} transparent opacity={0.4} />
                </mesh>

                <mesh castShadow receiveShadow position={[0, 0, -1.3]}>
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshStandardMaterial color="#111" />
                    <mesh castShadow receiveShadow scale={[0.8, 0.8, 0.8]}>
                        <sphereGeometry args={[0.2, 16, 16]} />
                        <meshBasicMaterial color={glowColor} transparent opacity={0.5} />
                    </mesh>
                </mesh>
            </group>

            {/* -- Headlight -- */}
            <primitive object={lightTarget} />
            <spotLight
                position={[0, 0.0, 1.2 * hullScale]}
                target={lightTarget}
                angle={visualConfig.faceLightAngle}
                penumbra={visualConfig.faceLightPenumbra}
                intensity={visualConfig.faceLightIntensity}
                distance={visualConfig.faceLightDistance}
                color={eyeColor}
                castShadow
            />
        </group>
    );
};

export default SpiderBody;