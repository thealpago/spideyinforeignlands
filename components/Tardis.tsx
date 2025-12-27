import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import { useGLTF } from '@react-three/drei';
import { lerp } from '../utils/helpers';

interface TardisProps {
    target: Vector3;
    onMoveStateChange: (moving: boolean) => void;
    isLocked?: boolean;
    controlsRef?: React.MutableRefObject<any>;
    sharedPosRef?: React.MutableRefObject<Vector3>;
}

// Updated URL to raw.githubusercontent.com to avoid redirect/fetch issues
const MODEL_URL = "https://raw.githubusercontent.com/thealpago/Astronaut/main/Tardis/tardis_exterior_2005.glb";
const AUDIO_URL = "https://github.com/thealpago/Astronaut/releases/download/Newapp/tardis.mp3";

export const Tardis: React.FC<TardisProps> = ({ target, onMoveStateChange, isLocked, controlsRef, sharedPosRef }) => {
    const ref = useRef<Group>(null);
    // Initialize position from shared ref if available
    const [pos] = useState(() => sharedPosRef ? sharedPosRef.current.clone() : new Vector3(0, 0, 0));
    const [isFlying, setIsFlying] = useState(false);
    
    // Audio Ref
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Track the height we took off from to ensure we fly high enough over potential obstacles
    const takeoffHeightRef = useRef<number>(pos.y);
    
    const { scene } = useGLTF(MODEL_URL);
    const clone = useMemo(() => scene.clone(), [scene]);

    useEffect(() => {
        clone.traverse((obj: any) => {
            if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
            }
        });
    }, [clone]);

    // Initialize Audio
    useEffect(() => {
        const audio = new Audio(AUDIO_URL);
        audio.loop = true; 
        audio.volume = 0.5; // Increased volume from 0.05 to 0.5 for visibility
        audio.preload = 'auto'; // Force preload
        audioRef.current = audio;
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    // Handle Playback State
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isFlying) {
            // Only trigger play if it's not already playing to prevent stutter
            if (audio.paused) {
                audio.currentTime = 0;
                audio.play().catch((e) => console.warn("Audio play prevented:", e));
            }
        } else {
            audio.pause();
            audio.currentTime = 0;
        }
    }, [isFlying]);

    useFrame((state, delta) => {
        if (!ref.current) return;
        
        // Update shared pos ref
        if (sharedPosRef) {
            sharedPosRef.current.copy(pos);
        }
        
        // Flight Parameters
        const FLY_SPEED = 15.0;     
        const ROTATION_SPEED = 6.0; 
        const DESCEND_DIST = 20.0;  
        const RELATIVE_ALTITUDE = 15.0;
        
        const dx = target.x - pos.x;
        const dz = target.z - pos.z;
        const distHorizontal = Math.sqrt(dx * dx + dz * dz);
        
        const ARRIVAL_THRESHOLD = 0.5;
        const currentlyFlying = distHorizontal > ARRIVAL_THRESHOLD;

        if (currentlyFlying !== isFlying) {
            setIsFlying(currentlyFlying);
            if (currentlyFlying) {
                // Update takeoff height ref to current height
                takeoffHeightRef.current = pos.y;
            }
            if (onMoveStateChange) onMoveStateChange(currentlyFlying);
        }
        
        const targetScale = 0.1; 

        if (currentlyFlying) {
             const safeCruiseAltitude = Math.max(takeoffHeightRef.current, target.y) + RELATIVE_ALTITUDE;
             let targetAltitude = safeCruiseAltitude;
             
             if (distHorizontal < DESCEND_DIST) {
                 const progress = distHorizontal / DESCEND_DIST; 
                 targetAltitude = lerp(target.y, safeCruiseAltitude, progress);
             }
             
             pos.y = lerp(pos.y, targetAltitude, delta * 3.0);

             const moveStep = Math.min(distHorizontal, FLY_SPEED * delta);
             const dirX = dx / distHorizontal;
             const dirZ = dz / distHorizontal;
             
             pos.x += dirX * moveStep;
             pos.z += dirZ * moveStep;

             ref.current.rotation.y += delta * ROTATION_SPEED;
             ref.current.rotation.z = lerp(ref.current.rotation.z, 0, delta * 5);
             ref.current.rotation.x = lerp(ref.current.rotation.x, 0, delta * 5);
             
        } else {
             pos.y = lerp(pos.y, target.y, delta * 5.0);
             if (Math.abs(pos.y - target.y) < 0.05) pos.y = target.y;

             if (distHorizontal < 0.1) {
                 pos.x = target.x;
                 pos.z = target.z;
             }

             ref.current.rotation.z = lerp(ref.current.rotation.z, 0, delta * 10);
             ref.current.rotation.x = lerp(ref.current.rotation.x, 0, delta * 10);
        }

        ref.current.position.copy(pos);
        ref.current.scale.setScalar(targetScale);

        if (isLocked && controlsRef?.current) {
            const lookAtPos = pos.clone();
            lookAtPos.y += 2.0; 
            controlsRef.current.target.lerp(lookAtPos, 0.1);
            controlsRef.current.update();
        }
    });

    return (
        <group ref={ref}>
            <primitive object={clone} />
            <pointLight 
                position={[0, 2.7, 0]} 
                color={isFlying ? "#ffffff" : "#ffaa00"} 
                intensity={isFlying ? 12 : 2} 
                distance={15} 
                decay={2} 
            />
            {isFlying && (
                <pointLight position={[0, -1.0, 0]} color="#00aaff" intensity={5} distance={10} />
            )}
        </group>
    );
}

useGLTF.preload(MODEL_URL);