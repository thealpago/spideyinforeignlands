import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Box, Cylinder } from '@react-three/drei';

const HologramModel = ({ isLowBattery }: { isLowBattery: boolean }) => {
    const groupRef = useRef<any>(null);

    // Spin animation
    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.5;
        }
    });

    const color = isLowBattery ? "#ff0000" : "#e0e0e0";

    const HoloMaterial = () => (
        <meshBasicMaterial
            color={color}
            wireframe={true}
            transparent
            opacity={0.3}
        />
    );

    const SolidHoloMaterial = () => (
        <meshBasicMaterial
            color={isLowBattery ? "#ff0000" : "#ffffff"}
            transparent
            opacity={0.05}
            side={2} // DoubleSide
        />
    );

    return (
        <group ref={groupRef} scale={0.6}>
            {/* --- BODY --- */}
            <mesh>
                <boxGeometry args={[1.4, 0.8, 2.2]} />
                <HoloMaterial />
            </mesh>
            {/* Inner solid for volume */}
            <mesh scale={0.95}>
                <boxGeometry args={[1.4, 0.8, 2.2]} />
                <SolidHoloMaterial />
            </mesh>

            {/* --- HEAD --- */}
            <mesh position={[0, -0.2, 1.4]} rotation={[0.2, 0, 0]}>
                <sphereGeometry args={[0.5, 16, 16]} />
                <HoloMaterial />
            </mesh>

            {/* --- LEGS --- */}
            {[1, -1].map((side) =>
                Array.from({ length: 4 }).map((_, i) => {
                    const zOffset = 0.8 - (i * 0.6); // Spread along body
                    const isRight = side === 1;

                    return (
                        <group key={`leg-${side}-${i}`} position={[side * 0.6, 0, zOffset]}>
                            {/* Coxa */}
                            <mesh rotation={[0, 0, -side * 0.5]} position={[side * 0.3, 0.2, 0]}>
                                <cylinderGeometry args={[0.05, 0.05, 0.6]} />
                                <HoloMaterial />
                            </mesh>
                            {/* Femur */}
                            <mesh rotation={[0, 0, -side * 1.2]} position={[side * 0.8, 0.8, 0]}>
                                <cylinderGeometry args={[0.04, 0.04, 1.2]} />
                                <HoloMaterial />
                            </mesh>
                            {/* Tibia */}
                            <mesh rotation={[0, 0, side * 0.2]} position={[side * 1.5, -0.2, 0]}>
                                <cylinderGeometry args={[0.03, 0.03, 1.5]} />
                                <HoloMaterial />
                            </mesh>
                        </group>
                    )
                })
            )}
        </group>
    );
};

export const GSpiderHUD = () => {
    // Battery Warning Logic
    const [isLowBattery, setIsLowBattery] = React.useState(false);

    // Refs for tracking key presses
    const spaceCountRef = useRef(0);
    const lastSpaceTimeRef = useRef(0);
    const keyDownTimeRef = useRef(0);
    const timeoutRef = useRef<any>(null);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code !== 'Space') return;
            if (e.repeat) return; // Ignore hold repeats for the spam counter

            const now = Date.now();
            keyDownTimeRef.current = now;

            // Long Press Detection
            timeoutRef.current = setTimeout(() => {
                // If key is still down after 600ms, trigger Low Battery
                setIsLowBattery(true);
            }, 600);

            // Spam Detection
            if (now - lastSpaceTimeRef.current < 500) {
                spaceCountRef.current += 1;
            } else {
                spaceCountRef.current = 1; // Reset window
            }
            lastSpaceTimeRef.current = now;

            if (spaceCountRef.current > 3 && !isLowBattery) {
                setIsLowBattery(true);
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.code !== 'Space') return;

            // Cancel long press check
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [isLowBattery]);

    // Cleanup effect (reset battery after 3s) behavior? 
    // Request says change it. Usually implies a state change. 
    // Let's keep it 'Low' for a bit or until user relaxes. 
    // I'll make it auto-recover after 4 seconds of no activity?
    // For now, let's just let it stick for 3 seconds, then recover.
    React.useEffect(() => {
        if (isLowBattery) {
            const timer = setTimeout(() => {
                setIsLowBattery(false);
                spaceCountRef.current = 0; // Reset
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isLowBattery]);


    // Styles
    const containerBorder = isLowBattery ? "border-red-500/60" : "border-white/20";
    const containerBg = isLowBattery ? "bg-red-950/40" : "bg-zinc-950/60";
    const shadowStyle = isLowBattery ? "shadow-[0_0_20px_rgba(255,0,0,0.4)]" : "shadow-[0_0_15px_rgba(255,255,255,0.05)]";
    const textColor = isLowBattery ? "text-red-500" : "text-amber-400";
    const decoratorColor = isLowBattery ? "bg-red-500" : "bg-white/50";
    const shakeClass = isLowBattery ? "animate-[spin_0.1s_ease-in-out_infinite] origin-center" : "";
    // Wait, spin isn't shake. Let's use translate.
    // Basic CSS shake animation isn't in Tailwind default usually without config.
    // I'll use a simple style inline or "animate-ping" is too much.
    // I'll use a hard-coded shake using transforms if possible, or just the color change which is strong.
    // Let's add a custom inline style for shake if low battery.

    const shakeStyle = isLowBattery ? { animation: "shake 0.5s cubic-bezier(.36,.07,.19,.97) both infinite" } : {};

    // Inject keyframes style once
    // (In a real app, I'd put this in CSS file, but here I'll inject a style tag or just rely on pulse/color)
    // The user asked for "titreşerek" (shaking).

    return (
        <>
            {isLowBattery && (
                <style>{`
                    @keyframes shake {
                        10%, 90% { transform: translate3d(-1px, 0, 0); }
                        20%, 80% { transform: translate3d(2px, 0, 0); }
                        30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
                        40%, 60% { transform: translate3d(4px, 0, 0); }
                    }
                `}</style>
            )}

            <div
                className={`absolute bottom-4 left-4 md:bottom-8 md:left-8 w-28 h-28 md:w-40 md:h-40 pointer-events-none select-none z-50 transition-all duration-300`}
                style={shakeStyle}
            >
                {/* HUD Frame visuals */}
                <div className={`absolute inset-0 border rounded-full backdrop-blur-md overflow-hidden transition-colors duration-300 ${containerBorder} ${containerBg} ${shadowStyle}`}>

                    {/* Scanlines */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(20,20,20,0)_50%,rgba(255,255,255,0.02)_50%),linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01),rgba(255,255,255,0.03))] z-10 bg-[length:100%_4px,6px_100%] pointer-events-none" />

                    {/* Spinning Model */}
                    <Canvas camera={{ position: [4, 3, 4], fov: 40 }} gl={{ alpha: true }}>
                        <ambientLight intensity={1} />
                        <HologramModel isLowBattery={isLowBattery} />
                    </Canvas>

                    {/* HUD Info: Charging Status */}
                    <div className="absolute bottom-3 left-0 w-full flex flex-col items-center justify-center gap-1">
                        <div className={`flex items-center gap-1.5 ${textColor} animate-pulse`}>
                            {/* Bolt Icon */}
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                                <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                            </svg>
                            <span className="text-[10px] font-mono tracking-wider font-bold">
                                {isLowBattery ? "BATTERY LOW" : "CHARGE %99"}
                            </span>
                        </div>
                        {isLowBattery && (
                            <span className="text-[9px] font-mono text-red-400 font-bold tracking-tight">CHARGE %1</span>
                        )}
                    </div>

                    {/* HUD Decorators */}
                    <div className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full animate-ping ${decoratorColor}`} />
                </div>
            </div>
        </>
    );
};
