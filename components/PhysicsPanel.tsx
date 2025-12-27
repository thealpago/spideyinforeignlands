import React, { useState } from 'react';
import { PhysicsConfig } from '../types';

interface PhysicsPanelProps {
    config: PhysicsConfig;
    onChange: (newConfig: PhysicsConfig) => void;
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
                className="w-full flex justify-between items-center text-[10px] text-gray-400 font-mono tracking-wider hover:text-white transition-colors py-1"
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
        <div className="flex justify-between text-[9px] text-gray-400 font-mono">
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

const PhysicsPanel: React.FC<PhysicsPanelProps> = ({ config, onChange, buttonClassName, isOpen = false, onToggle }) => {
    const [copied, setCopied] = useState(false);

    const handleChange = (key: keyof PhysicsConfig, value: number) => {
        onChange({ ...config, [key]: value });
    };

    const handleCopy = async () => {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        } catch (err) {
            console.error("Failed to copy configuration", err);
        }
    };
    
    const activeStyle = 'bg-white/10 text-white border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.2)]';
    const defaultStyle = `p-3 rounded-xl transition-all duration-300 ${isOpen ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`;
    
    const buttonClass = buttonClassName 
        ? `${buttonClassName} ${isOpen ? activeStyle : ''}`
        : defaultStyle;

    return (
        <div className="pointer-events-auto">
            {/* Panel Body - Centered Relative to Navbar Container */}
            <div className={`
                absolute bottom-[calc(100%+16px)] left-1/2 -translate-x-1/2
                bg-transparent border border-transparent p-4 rounded-xl backdrop-blur-0 shadow-none w-[85vw] sm:w-72 z-50 max-h-[60vh] overflow-y-auto custom-scrollbar origin-bottom
                transition-all duration-300 ease-in-out 
                ${isOpen ? 'opacity-100 scale-100 pointer-events-auto translate-y-0' : 'opacity-0 scale-95 pointer-events-none translate-y-2'}
            `}>
                
                {/* Header */}
                <div className="flex justify-between items-center mb-4 border-b border-transparent pb-2">
                    <h3 className="text-xs font-mono text-white font-bold tracking-wide">PHYSICS ENGINE</h3>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCopy}
                            title="Copy JSON"
                            className={`text-[9px] px-1.5 py-0.5 rounded border transition-all duration-200 font-mono tracking-wide ${copied ? 'border-green-500/50 text-green-400 bg-green-500/10' : 'border-white/20 text-gray-400 hover:text-white hover:border-white/40 hover:bg-white/5'}`}
                        >
                            {copied ? 'COPIED' : 'JSON'}
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <CollapsibleSection title="LOCOMOTION" defaultOpen={true}>
                        <RangeControl label="SPEED" value={config.speed} min={0.5} max={6.0} step={0.1} onChange={(v) => handleChange('speed', v)} />
                        <RangeControl label="TURN" value={config.turnSpeed} min={0.5} max={5.0} step={0.1} onChange={(v) => handleChange('turnSpeed', v)} />
                        <RangeControl label="BODY HEIGHT" value={config.bodyHeight} min={1.0} max={3.5} step={0.1} onChange={(v) => handleChange('bodyHeight', v)} />
                    </CollapsibleSection>

                    <CollapsibleSection title="GAIT">
                        <RangeControl label="STEP HEIGHT" value={config.stepHeight} min={0.5} max={3.0} step={0.1} onChange={(v) => handleChange('stepHeight', v)} />
                        <RangeControl label="DURATION" value={config.stepDuration} min={0.1} max={1.0} step={0.01} onChange={(v) => handleChange('stepDuration', v)} />
                    </CollapsibleSection>

                    <CollapsibleSection title="MORPHOLOGY">
                        <RangeControl label="ABDOMEN" value={config.abdomenScale} min={0.5} max={2.5} step={0.1} onChange={(v) => handleChange('abdomenScale', v)} />
                    </CollapsibleSection>
                </div>
            </div>

            {/* Navbar Icon Button */}
            <button
                onClick={onToggle}
                className={buttonClass}
                title="Physics Settings"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6m2-6h6m2 8h6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
            </button>
        </div>
    );
};

export default PhysicsPanel;