import React, { useState, useEffect } from 'react';
import { VisualConfig, PhysicsConfig } from '../types';

interface SpideyPanelProps {
    spideyVisuals: VisualConfig;
    setSpideyVisuals: (c: VisualConfig) => void;
    spideyPhysics: PhysicsConfig;
    setSpideyPhysics: (c: PhysicsConfig) => void;

    gSpideyVisuals: VisualConfig;
    setGSpideyVisuals: (c: VisualConfig) => void;
    gSpideyPhysics: PhysicsConfig;
    setGSpideyPhysics: (c: PhysicsConfig) => void;

    activeCharacter: string;
    buttonClassName?: string;
    isOpen?: boolean;
    onToggle?: () => void;
}

const CollapsibleSection: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-t border-white/10 pt-2 first:border-0 first:pt-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-[10px] text-white font-mono tracking-wider hover:text-white transition-colors py-1"
            >
                <span>{title}</span>
                <span className="opacity-50 transition-transform duration-200 transform">{isOpen ? '[-]' : '[+]'}</span>
            </button>

            <div className={`space-y-3 transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'mt-3 max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {children}
            </div>
        </div>
    );
};

const RangeControl: React.FC<{
    label: string;
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (val: number) => void;
}> = ({ label, value, min, max, step, onChange }) => (
    <div className="space-y-1">
        <div className="flex justify-between text-[9px] text-white font-mono">
            <span>{label}</span>
            <span>{value.toFixed(2)}</span>
        </div>
        <input
            type="range" min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-white h-1 bg-white/20 rounded-full appearance-none"
        />
    </div>
);

const ColorControl: React.FC<{ label: string; value: string; onChange: (val: string) => void }> = ({ label, value, onChange }) => (
    <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
        <span className="text-[9px] text-white font-mono">{label}</span>
        <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-transparent w-6 h-6 cursor-pointer"
        />
    </div>
);

export const SpideyPanel: React.FC<SpideyPanelProps> = ({
    spideyVisuals, setSpideyVisuals, spideyPhysics, setSpideyPhysics,
    gSpideyVisuals, setGSpideyVisuals, gSpideyPhysics, setGSpideyPhysics,
    activeCharacter,
    buttonClassName,
    isOpen = false,
    onToggle
}) => {
    // Tab State: 'spidey' or 'g_spidey'
    const [activeTab, setActiveTab] = useState<'spider' | 'g_spidey'>('spider');

    useEffect(() => {
        if (activeCharacter === 'g_spidey') setActiveTab('g_spidey');
        else if (activeCharacter === 'spider') setActiveTab('spider');
    }, [activeCharacter]);

    const currentVisuals = activeTab === 'spider' ? spideyVisuals : gSpideyVisuals;
    const currentPhysics = activeTab === 'spider' ? spideyPhysics : gSpideyPhysics;

    const setVisuals = activeTab === 'spider' ? setSpideyVisuals : setGSpideyVisuals;
    const setPhysics = activeTab === 'spider' ? setSpideyPhysics : setGSpideyPhysics;

    const handleVisual = (key: keyof VisualConfig, value: any) => {
        setVisuals({ ...currentVisuals, [key]: value });
    };

    const handlePhysics = (key: keyof PhysicsConfig, value: any) => {
        setPhysics({ ...currentPhysics, [key]: value });
    };

    const activeStyle = 'bg-white/10 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]';
    const defaultStyle = `flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 border ${isOpen ? activeStyle : 'bg-zinc-900/60 border-white/10 text-white hover:text-white hover:bg-zinc-800'}`;

    const buttonClass = buttonClassName
        ? `${buttonClassName} ${isOpen ? activeStyle : ''}`
        : defaultStyle;

    return (
        <div className="pointer-events-auto">
            {/* Panel Body - Centered Relative to Navbar Container */}
            <div className={`
                absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2
                bg-zinc-900/90 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-2xl w-[90vw] sm:w-80 z-50 max-h-[75vh] overflow-y-auto custom-scrollbar origin-bottom
                transition-all duration-300 ease-in-out 
                ${isOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none translate-y-2'}
            `}>

                {/* Header / Tabs */}
                <div className="flex items-center justify-between mb-4 border-b border-transparent pb-2">
                    <h3 className="text-xs font-mono text-white font-bold tracking-widest">UNIT CONFIG</h3>
                    <div className="flex bg-transparent rounded-lg p-0.5">
                        <button
                            onClick={() => setActiveTab('spider')}
                            className={`px-3 py-1 text-[9px] font-mono rounded-md transition-all ${activeTab === 'spider' ? 'bg-white/20 text-white' : 'text-white hover:text-gray-300'}`}
                        >
                            SPIDEY
                        </button>
                        <button
                            onClick={() => setActiveTab('g_spidey')}
                            className={`px-3 py-1 text-[9px] font-mono rounded-md transition-all ${activeTab === 'g_spidey' ? 'bg-white/20 text-white' : 'text-white hover:text-gray-300'}`}
                        >
                            G-SPIDEY
                        </button>
                    </div>
                </div>

                <div className="space-y-4">

                    {/* 1. APPEARANCE */}
                    <CollapsibleSection title="APPEARANCE" defaultOpen={true}>
                        <div className="space-y-2">
                            <ColorControl
                                label="MAIN HULL"
                                value={currentVisuals.spiderHeadColor}
                                onChange={(v) => handleVisual('spiderHeadColor', v)}
                            />
                            <ColorControl
                                label="REAR ABDOMEN"
                                value={currentVisuals.spiderBodyColor}
                                onChange={(v) => handleVisual('spiderBodyColor', v)}
                            />
                            <ColorControl
                                label="LEGS"
                                value={currentVisuals.spiderLegColor}
                                onChange={(v) => handleVisual('spiderLegColor', v)}
                            />
                            <ColorControl
                                label="ARMOR PLATING"
                                value={currentVisuals.spiderPlateColor || "#ff6600"}
                                onChange={(v) => handleVisual('spiderPlateColor', v)}
                            />
                            <ColorControl
                                label="JOINT GLOW"
                                value={currentVisuals.jointGlowColor || "#00ccff"}
                                onChange={(v) => handleVisual('jointGlowColor', v)}
                            />
                            <ColorControl
                                label="CYCLOPS EYE"
                                value={currentVisuals.faceLightColor}
                                onChange={(v) => handleVisual('faceLightColor', v)}
                            />
                        </div>
                        <div className="mt-3">
                            <RangeControl label="PLATING OPACITY" value={currentVisuals.platingOpacity} min={0} max={1} step={0.1} onChange={(v) => handleVisual('platingOpacity', v)} />
                        </div>
                    </CollapsibleSection>

                    {/* 2. MORPHOLOGY */}
                    <CollapsibleSection title="MORPHOLOGY">
                        <RangeControl label="HULL SCALE" value={currentPhysics.hullScale} min={0.5} max={2.5} step={0.1} onChange={(v) => handlePhysics('hullScale', v)} />
                        <RangeControl label="ABDOMEN SCALE" value={currentPhysics.abdomenScale} min={0.5} max={2.5} step={0.1} onChange={(v) => handlePhysics('abdomenScale', v)} />
                    </CollapsibleSection>

                    {/* 3. MOTOR FUNCTIONS */}
                    <CollapsibleSection title="MOTOR FUNCTIONS">
                        <RangeControl label="MOVEMENT SPEED" value={currentPhysics.speed} min={0.5} max={8.0} step={0.1} onChange={(v) => handlePhysics('speed', v)} />
                        <RangeControl label="TURN AGILITY" value={currentPhysics.turnSpeed} min={0.5} max={5.0} step={0.1} onChange={(v) => handlePhysics('turnSpeed', v)} />
                        <RangeControl label="RIDE HEIGHT" value={currentPhysics.bodyHeight} min={1.0} max={3.5} step={0.1} onChange={(v) => handlePhysics('bodyHeight', v)} />
                    </CollapsibleSection>

                    {/* 4. LEG MECHANICS */}
                    <CollapsibleSection title="LEG MECHANICS">
                        <RangeControl label="STEP HEIGHT" value={currentPhysics.stepHeight} min={0.5} max={3.0} step={0.1} onChange={(v) => handlePhysics('stepHeight', v)} />
                        <RangeControl label="STEP SPEED" value={currentPhysics.stepDuration} min={0.1} max={1.0} step={0.01} onChange={(v) => handlePhysics('stepDuration', v)} />
                    </CollapsibleSection>

                    {/* 5. UTILITIES (NEW) */}
                    <CollapsibleSection title="UTILITIES">
                        <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                            <span className="text-[9px] text-white font-mono">SOLAR PANELS</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[8px] text-white uppercase">{currentVisuals.solarPanelsOpen ? 'DEPLOYED' : 'RETRACTED'}</span>
                                <input
                                    type="checkbox"
                                    checked={!!currentVisuals.solarPanelsOpen}
                                    onChange={(e) => handleVisual('solarPanelsOpen', e.target.checked)}
                                    className="accent-white w-3 h-3 cursor-pointer"
                                />
                            </div>
                        </div>
                    </CollapsibleSection>

                </div>
            </div>

            {/* Main Toggle Button */}
            <button
                onClick={onToggle}
                className={buttonClass}
            >
                <div className="w-2 h-2 bg-current rounded-full"></div>
                <span className="text-[10px] font-mono font-bold tracking-wider">SPIDEY CONFIG</span>
            </button>
        </div>
    );
};