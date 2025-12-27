import React, { useState, useEffect } from 'react';
import { Vector3 } from 'three';
import ConfigPanel from './ConfigPanel';
import VisualsPanel from './AppearancePanel';
import PhysicsPanel from './PhysicsPanel';
import { SpideyPanel } from './SpideyPanel';
import { SpherePanel } from './SpherePanel';
import VehiclePanel from './VehiclePanel';
import { BiomeSelector } from './BiomeSelector';
import MobileControls from './MobileControls';
import useGameStore, { vehicleState } from '../store/gameStore';
import useVehicleInput from '../hooks/useVehicleInput.js';
import { Stats } from './Stats';
import { GSpiderHUD } from './GSpiderHUD';
import { BgConfig, VisualConfig, PhysicsConfig, SphereConfig, VehicleConfig } from '../types';

interface OverlayProps {
    target: Vector3;
    marker: Vector3;
    config: BgConfig;
    onConfigChange: (newConfig: BgConfig) => void;
    isLocked: boolean;
    onLockToggle: () => void;

    // Spidey Specifics
    spideyVisuals: VisualConfig;
    setSpideyVisuals: (c: VisualConfig) => void;
    spideyPhysics: PhysicsConfig;
    setSpideyPhysics: (c: PhysicsConfig) => void;

    // G-Spidey Specifics
    gSpideyVisuals: VisualConfig;
    setGSpideyVisuals: (c: VisualConfig) => void;
    gSpideyPhysics: PhysicsConfig;
    setGSpideyPhysics: (c: PhysicsConfig) => void;

    // Sphere Specifics
    sphereConfig: SphereConfig;
    setSphereConfig: (c: SphereConfig) => void;

    // Fallbacks for simple chars
    activeVisualConfig: VisualConfig;
    onVisualConfigChange: (c: VisualConfig) => void;
    activePhysicsConfig: PhysicsConfig;
    onPhysicsConfigChange: (c: PhysicsConfig) => void;

    // Vehicle Specifics
    vehicleConfig: VehicleConfig;
    setVehicleConfig: (c: VehicleConfig) => void;

    character: string;
    onCharacterChange: (c: any) => void;
}

const Overlay: React.FC<OverlayProps> = ({
    target,
    marker,
    config,
    onConfigChange,
    isLocked,
    onLockToggle,

    spideyVisuals, setSpideyVisuals, spideyPhysics, setSpideyPhysics,
    gSpideyVisuals, setGSpideyVisuals, gSpideyPhysics, setGSpideyPhysics,
    sphereConfig, setSphereConfig,

    activeVisualConfig, onVisualConfigChange,
    activePhysicsConfig, onPhysicsConfigChange,

    vehicleConfig, setVehicleConfig,

    character,
    onCharacterChange
}) => {
    // Styles
    const ACTIVE_GRAY_STYLE = 'bg-white/10 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]';
    const INACTIVE_STYLE = 'text-gray-400 hover:text-white hover:bg-white/5 border-transparent';
    const NAVBAR_BG_STYLE = 'bg-transparent backdrop-blur-0 border border-transparent';

    // Centralized Panel State for Mutual Exclusivity
    const [activePanel, setActivePanel] = useState<string | null>(null);

    // Close panels when character changes to avoid confusion
    useEffect(() => {
        setActivePanel(null);
    }, [character]);

    const togglePanel = (panelName: string) => {
        setActivePanel(current => current === panelName ? null : panelName);
    };

    const toggleLights = useGameStore((state) => state.toggleLights)
    const terrainCameraEnabled = useGameStore((state) => state.terrainCameraEnabled)
    const toggleTerrainCamera = useGameStore((state) => state.toggleTerrainCamera)
    const isMobile = useGameStore((state) => state.isMobile)

    // Show mobile controls for 4x4 model on mobile devices
    const showMobileControls = isMobile && character === '4x4';

    return (
        <>
            <Stats />
            <MobileControls visible={showMobileControls} />

            <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 p-4 md:p-8 flex flex-col justify-between">
                {/* Top Header: Biome Selector */}
                <div className="flex justify-end items-start w-full mt-16 md:mt-0">
                    <div className="pointer-events-auto">
                        <BiomeSelector currentConfig={config} onSelect={onConfigChange} />
                    </div>
                </div>

                {/* Footer Removed (LMB/RMB Instructions) */}

                {/* NAV BAR */}
                <div className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto max-w-[95vw] w-auto origin-bottom scale-[0.85] md:scale-100 transition-all duration-300">
                    <div className={`flex flex-col md:flex-row items-center gap-1.5 p-1.5 ${NAVBAR_BG_STYLE} rounded-3xl transition-all duration-300`}>

                        {/* 1. Character Selection Group */}
                        <div className="flex overflow-x-auto max-w-full rounded-2xl p-1 gap-1 flex-shrink-0 no-scrollbar">
                            <button
                                onClick={() => onCharacterChange('spider')}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${character === 'spider' ? ACTIVE_GRAY_STYLE : INACTIVE_STYLE}`}
                            >
                                SPIDEY
                            </button>

                            <button
                                onClick={() => onCharacterChange('g_spidey')}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${character === 'g_spidey' ? ACTIVE_GRAY_STYLE : INACTIVE_STYLE}`}
                            >
                                G-SPIDEY
                            </button>

                            <button
                                onClick={() => {
                                    onCharacterChange('4x4');
                                    setActivePanel('vehicle');
                                }}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${character === '4x4' ? ACTIVE_GRAY_STYLE : INACTIVE_STYLE}`}
                            >
                                4x4
                            </button>

                            <button
                                onClick={() => onCharacterChange('infinity_sphere')}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${character === 'infinity_sphere' ? ACTIVE_GRAY_STYLE : INACTIVE_STYLE}`}
                            >
                                SPHERE
                            </button>

                            <button
                                onClick={() => onCharacterChange('tardis')}
                                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${character === 'tardis' ? ACTIVE_GRAY_STYLE : INACTIVE_STYLE}`}
                            >
                                TARDIS
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />

                        {/* Camera Control */}
                        <button
                            onClick={onLockToggle}
                            className={`p-2 rounded-xl transition-all duration-300 group border flex-shrink-0 ${isLocked ? ACTIVE_GRAY_STYLE : INACTIVE_STYLE}`}
                            title={isLocked ? "Unlock Camera" : "Lock Camera"}
                        >
                            <div className="relative w-4 h-4 flex items-center justify-center text-current">
                                <div className={`absolute inset-0 border rounded-sm transition-all duration-300 ${isLocked ? 'border-current w-full h-full opacity-100' : 'border-current w-3/4 h-3/4 opacity-50'}`}></div>
                                <div className={`w-1 h-1 bg-current rounded-full transition-all duration-300 ${isLocked ? 'scale-100' : 'scale-0'}`}></div>
                                {!isLocked && (
                                    <>
                                        <div className="absolute top-0 left-0 w-1 h-1 h-1.5 border-t border-l border-current"></div>
                                        <div className="absolute top-0 right-0 w-1.5 h-1.5 border-t border-r border-current"></div>
                                        <div className="absolute bottom-0 left-0 w-1.5 h-1.5 border-b border-l border-current"></div>
                                        <div className="absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-current"></div>
                                    </>
                                )}
                            </div>
                        </button>

                        <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />

                        {/* Solar Power Toggle (G-Spidey Only) */}
                        {character === 'g_spidey' && (
                            <>
                                <button
                                    onClick={() => setGSpideyVisuals({ ...gSpideyVisuals, solarPanelsOpen: !gSpideyVisuals.solarPanelsOpen })}
                                    className={`p-2 rounded-xl transition-all duration-300 group border flex-shrink-0 ${gSpideyVisuals.solarPanelsOpen ? 'bg-amber-500/20 text-amber-400 border-amber-500/50 shadow-[0_0_15px_rgba(255,170,0,0.3)]' : INACTIVE_STYLE}`}
                                    title={gSpideyVisuals.solarPanelsOpen ? "Retract Solar Panels" : "Deploy Solar Panels"}
                                >
                                    <div className="w-4 h-4 flex items-center justify-center">
                                        {/* Charging Bolt Icon */}
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                            <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.982 9.75h7.268a.75.75 0 01.548 1.262l-10.5 11.25a.75.75 0 01-1.272-.71l1.992-7.302H3.75a.75.75 0 01-.548-1.262l10.5-11.25a.75.75 0 01.913-.143z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </button>
                                <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />
                            </>
                        )}
                        <div className="hidden md:block w-px h-6 bg-white/10 mx-1" />

                        {/* 2. Configuration Group */}
                        <div className="flex gap-1 flex-wrap justify-center md:justify-end">
                            <ConfigPanel
                                config={config}
                                onChange={onConfigChange}
                                isOpen={activePanel === 'config'}
                                onToggle={() => togglePanel('config')}
                                buttonClassName={`p-2 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${INACTIVE_STYLE}`}
                            />

                            {(character === 'spider' || character === 'g_spidey') ? (
                                <SpideyPanel
                                    spideyVisuals={spideyVisuals}
                                    setSpideyVisuals={setSpideyVisuals}
                                    spideyPhysics={spideyPhysics}
                                    setSpideyPhysics={setSpideyPhysics}
                                    gSpideyVisuals={gSpideyVisuals}
                                    setGSpideyVisuals={setGSpideyVisuals}
                                    gSpideyPhysics={gSpideyPhysics}
                                    setGSpideyPhysics={setGSpideyPhysics}
                                    activeCharacter={character}
                                    isOpen={activePanel === 'spidey'}
                                    onToggle={() => togglePanel('spidey')}
                                    buttonClassName={`p-2 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${INACTIVE_STYLE}`}
                                />
                            ) : character === '4x4' ? (
                                <VehiclePanel
                                    config={vehicleConfig}
                                    onChange={setVehicleConfig}
                                    isOpen={activePanel === 'vehicle'}
                                    onToggle={() => togglePanel('vehicle')}
                                    buttonClassName={`p-2 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${INACTIVE_STYLE}`}
                                />
                            ) : character === 'infinity_sphere' ? (
                                <SpherePanel
                                    config={sphereConfig}
                                    onChange={setSphereConfig}
                                    isOpen={activePanel === 'sphere'}
                                    onToggle={() => togglePanel('sphere')}
                                    buttonClassName={`p-2 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${INACTIVE_STYLE}`}
                                />
                            ) : (
                                <>
                                    <PhysicsPanel
                                        config={activePhysicsConfig}
                                        onChange={onPhysicsConfigChange}
                                        isOpen={activePanel === 'physics'}
                                        onToggle={() => togglePanel('physics')}
                                        buttonClassName={`p-2 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${INACTIVE_STYLE}`}
                                    />
                                    <VisualsPanel
                                        config={activeVisualConfig}
                                        onChange={onVisualConfigChange}
                                        isOpen={activePanel === 'visuals'}
                                        onToggle={() => togglePanel('visuals')}
                                        buttonClassName={`p-2 rounded-xl text-[11px] font-mono transition-all duration-200 flex-shrink-0 border ${INACTIVE_STYLE}`}
                                    />
                                </>
                            )}
                        </div>

                    </div>
                </div>

                {/* 3. G-Spider HUD (Bottom Left) */}
                {character === 'g_spidey' && <GSpiderHUD />}

                {/* Terrain Camera Toggle Button (Bottom Left) */}
                <div className="absolute bottom-4 md:bottom-8 left-4 md:left-8 pointer-events-auto z-40">
                    <button
                        onClick={toggleTerrainCamera}
                        className={`p-2.5 rounded-xl transition-all duration-300 group border flex-shrink-0 ${terrainCameraEnabled ? ACTIVE_GRAY_STYLE : INACTIVE_STYLE}`}
                        title={terrainCameraEnabled ? "Switch to Orbit Camera" : "Switch to Terrain Camera"}
                    >
                        <div className="relative w-4 h-4 flex items-center justify-center text-current">
                            {/* Camera/terrain icon */}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                <circle cx="12" cy="13" r="4" />
                            </svg>
                        </div>
                    </button>
                </div>
            </div>
        </>
    );
};

export default Overlay;