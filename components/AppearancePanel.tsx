import React, { useState } from 'react';
import { VisualConfig } from '../types';

interface VisualsPanelProps {
    config: VisualConfig;
    onChange: (newConfig: VisualConfig) => void;
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

const VisualsPanel: React.FC<VisualsPanelProps> = ({ config, onChange, buttonClassName, isOpen = false, onToggle }) => {
    const [copied, setCopied] = useState(false);

    const toggleBody = () => onChange({ ...config, showBody: !config.showBody });
    const togglePlating = () => onChange({ ...config, showPlating: !config.showPlating });
    const changeOpacity = (val: number) => onChange({ ...config, platingOpacity: val });
    
    const handleChange = (key: keyof VisualConfig, value: any) => {
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
                    <h3 className="text-xs font-mono text-white font-bold tracking-wide">VISUALS</h3>
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
                    
                    <CollapsibleSection title="PAINT SHOP" defaultOpen={true}>
                        <div className="space-y-2">
                            {/* Head Color */}
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                                <span className="text-[9px] text-gray-400 font-mono">HEAD</span>
                                <input 
                                    type="color" 
                                    value={config.spiderHeadColor || "#222222"} 
                                    onChange={(e) => handleChange('spiderHeadColor', e.target.value)}
                                    className="bg-transparent w-6 h-6 cursor-pointer"
                                />
                            </div>

                            {/* Body Color */}
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                                <span className="text-[9px] text-gray-400 font-mono">BODY</span>
                                <input 
                                    type="color" 
                                    value={config.spiderBodyColor || "#1a1a20"} 
                                    onChange={(e) => handleChange('spiderBodyColor', e.target.value)}
                                    className="bg-transparent w-6 h-6 cursor-pointer"
                                />
                            </div>

                            {/* Leg Color */}
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                                <span className="text-[9px] text-gray-400 font-mono">LEGS</span>
                                <input 
                                    type="color" 
                                    value={config.spiderLegColor || "#1a1a20"} 
                                    onChange={(e) => handleChange('spiderLegColor', e.target.value)}
                                    className="bg-transparent w-6 h-6 cursor-pointer"
                                />
                            </div>
                            
                            {/* Plate Color */}
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                                <span className="text-[9px] text-gray-400 font-mono">PLATING</span>
                                <input 
                                    type="color" 
                                    value={config.spiderPlateColor || "#ff6600"} 
                                    onChange={(e) => handleChange('spiderPlateColor', e.target.value)}
                                    className="bg-transparent w-6 h-6 cursor-pointer"
                                />
                            </div>
                            
                            {/* Glow Color */}
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                                <span className="text-[9px] text-gray-400 font-mono">GLOW</span>
                                <input 
                                    type="color" 
                                    value={config.jointGlowColor || "#00ccff"} 
                                    onChange={(e) => handleChange('jointGlowColor', e.target.value)}
                                    className="bg-transparent w-6 h-6 cursor-pointer"
                                />
                            </div>
                        </div>
                    </CollapsibleSection>
                    
                    <CollapsibleSection title="ARMOR PLATING">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[9px] text-gray-400 font-mono">ENABLED</span>
                            <input 
                                type="checkbox"
                                checked={config.showPlating}
                                onChange={(e) => handleChange('showPlating', e.target.checked)}
                                className="accent-white w-3 h-3"
                            />
                        </div>
                        <RangeControl label="OPACITY" value={config.platingOpacity} min={0} max={1} step={0.05} onChange={(v) => handleChange('platingOpacity', v)} />
                    </CollapsibleSection>

                    <CollapsibleSection title="LIGHTING">
                            <div className="space-y-1 mb-3">
                            <span className="text-[9px] text-gray-400 font-mono block">COLOR</span>
                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded border border-white/5">
                                <input 
                                    type="color" 
                                    value={config.faceLightColor} 
                                    onChange={(e) => handleChange('faceLightColor', e.target.value)}
                                    className="bg-transparent w-full h-4 cursor-pointer"
                                />
                            </div>
                        </div>
                        <RangeControl label="INTENSITY" value={config.faceLightIntensity} min={0} max={20} step={0.5} onChange={(v) => handleChange('faceLightIntensity', v)} />
                    </CollapsibleSection>
                </div>
            </div>

            {/* Navbar Icon Button */}
            <button
                onClick={onToggle}
                className={buttonClass}
                title="Visual Settings"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                </svg>
            </button>
        </div>
    );
};

export default VisualsPanel;