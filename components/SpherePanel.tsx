import React, { useState } from 'react';
import { SphereConfig } from '../types';

interface SpherePanelProps {
    config: SphereConfig;
    onChange: (newConfig: SphereConfig) => void;
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

export const SpherePanel: React.FC<SpherePanelProps> = ({ config, onChange, buttonClassName, isOpen = false, onToggle }) => {

    const handleChange = (key: keyof SphereConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const activeStyle = 'bg-white/10 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]';
    const defaultStyle = `flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 border ${isOpen ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'bg-zinc-900/60 border-white/10 text-white hover:text-white hover:bg-zinc-800'}`;

    const buttonClass = buttonClassName
        ? `${buttonClassName} ${isOpen ? activeStyle : ''}`
        : defaultStyle;

    return (
        <div className="pointer-events-auto">
            {/* Panel Body - Centered Relative to Navbar Container */}
            <div className={`
                absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2
                bg-zinc-900/90 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-2xl w-[90vw] sm:w-72 z-50 max-h-[75vh] overflow-y-auto custom-scrollbar origin-bottom
                transition-all duration-300 ease-in-out 
                ${isOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none translate-y-2'}
            `}>

                {/* Header */}
                <div className="flex items-center justify-between mb-4 border-b border-transparent pb-2">
                    <h3 className="text-xs font-mono text-white font-bold tracking-widest">SPHERE CONFIG</h3>
                </div>

                <div className="space-y-4">

                    {/* 1. DIMENSIONS */}
                    <CollapsibleSection title="DIMENSIONS" defaultOpen={true}>
                        <RangeControl
                            label="RADIUS (SIZE)"
                            value={config.radius}
                            min={1.0}
                            max={15.0}
                            step={0.5}
                            onChange={(v) => handleChange('radius', v)}
                        />
                    </CollapsibleSection>

                    {/* 2. APPEARANCE */}
                    <CollapsibleSection title="APPEARANCE" defaultOpen={true}>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-white font-mono">RAINBOW MODE</span>
                                <input
                                    type="checkbox"
                                    checked={config.useRainbow}
                                    onChange={(e) => handleChange('useRainbow', e.target.checked)}
                                    className="accent-white w-3 h-3"
                                />
                            </div>

                            {!config.useRainbow && (
                                <ColorControl
                                    label="BASE COLOR"
                                    value={config.color}
                                    onChange={(v) => handleChange('color', v)}
                                />
                            )}

                            <div className="flex items-center justify-between">
                                <span className="text-[9px] text-white font-mono">WIREFRAME</span>
                                <input
                                    type="checkbox"
                                    checked={config.wireframe}
                                    onChange={(e) => handleChange('wireframe', e.target.checked)}
                                    className="accent-white w-3 h-3"
                                />
                            </div>

                            <RangeControl
                                label="CORE GLOW"
                                value={config.glowIntensity}
                                min={0}
                                max={1}
                                step={0.1}
                                onChange={(v) => handleChange('glowIntensity', v)}
                            />
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
                <span className="text-[10px] font-mono font-bold tracking-wider">SPHERE CONFIG</span>
            </button>
        </div>
    );
};