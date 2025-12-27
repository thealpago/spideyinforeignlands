import React, { useState } from 'react';
import { BgConfig } from '../types';

interface ConfigPanelProps {
    config: BgConfig;
    onChange: (newConfig: BgConfig) => void;
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

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange, buttonClassName, isOpen = false, onToggle }) => {
    const [copied, setCopied] = useState(false);

    const handleChange = (key: keyof BgConfig, value: any) => {
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
                    <h3 className="text-xs font-mono text-white font-bold tracking-wide">ATMOSPHERE</h3>
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
                    {/* Sun Settings */}
                    <CollapsibleSection title="SOLAR DYNAMICS" defaultOpen={true}>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <span className="text-[9px] text-gray-400 font-mono">COLOR</span>
                                <div className="flex items-center gap-2 bg-white/5 p-1 rounded border border-white/5">
                                    <input 
                                        type="color" 
                                        value={config.colorSun} 
                                        onChange={(e) => handleChange('colorSun', e.target.value)}
                                        className="bg-transparent w-full h-4 cursor-pointer"
                                    />
                                </div>
                            </div>
                                <div className="space-y-1">
                                <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                                    <span>ELEVATION</span>
                                    <span>{config.sunElevation.toFixed(2)}</span>
                                </div>
                                <input 
                                    type="range" min="-0.2" max="1.0" step="0.01"
                                    value={config.sunElevation}
                                    onChange={(e) => handleChange('sunElevation', parseFloat(e.target.value))}
                                    className="w-full accent-white h-1 bg-white/20 rounded-full appearance-none mt-1"
                                />
                            </div>
                        </div>

                        <div className="bg-white/5 p-2 rounded border border-white/5 space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] text-gray-400 font-mono">AZIMUTH</span>
                                <div className="flex items-center gap-2">
                                    <label className="text-[8px] text-gray-500 uppercase">Auto</label>
                                    <input 
                                        type="checkbox"
                                        checked={config.autoRotate}
                                        onChange={(e) => handleChange('autoRotate', e.target.checked)}
                                        className="accent-white w-3 h-3"
                                    />
                                </div>
                            </div>
                            <input 
                                type="range" min="0" max={Math.PI * 2} step="0.01"
                                value={config.sunAzimuth}
                                onChange={(e) => handleChange('sunAzimuth', parseFloat(e.target.value))}
                                disabled={config.autoRotate}
                                className={`w-full h-1 rounded-full appearance-none ${config.autoRotate ? 'bg-white/5 cursor-not-allowed' : 'accent-white bg-white/20'}`}
                            />
                        </div>
                    </CollapsibleSection>

                    {/* Terrain Settings */}
                    <CollapsibleSection title="TERRAIN">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center bg-white/5 p-2 rounded border border-white/5">
                                <span className="text-[9px] text-gray-400 font-mono">COLOR</span>
                                <input 
                                    type="color" 
                                    value={config.terrainColor} 
                                    onChange={(e) => handleChange('terrainColor', e.target.value)}
                                    className="bg-transparent w-6 h-6 cursor-pointer"
                                />
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Sky Settings */}
                    <CollapsibleSection title="COLORS">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <span className="text-[9px] text-gray-400 font-mono block">HORIZON</span>
                                <div className="flex items-center gap-2 bg-white/5 p-1 rounded border border-white/5">
                                    <input 
                                        type="color" 
                                        value={config.colorHorizon} 
                                        onChange={(e) => handleChange('colorHorizon', e.target.value)}
                                        className="bg-transparent w-full h-4 cursor-pointer"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[9px] text-gray-400 font-mono block">SPACE</span>
                                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded border border-white/5">
                                    <input 
                                        type="color" 
                                        value={config.colorSpace} 
                                        onChange={(e) => handleChange('colorSpace', e.target.value)}
                                        className="bg-transparent w-full h-4 cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </CollapsibleSection>
                </div>
            </div>

            {/* Navbar Icon Button */}
            <button
                onClick={onToggle}
                className={buttonClass}
                title="Environment Settings"
            >
                <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
                    <div className={`rounded-sm ${isOpen ? 'bg-current' : 'bg-current opacity-60'}`}></div>
                    <div className={`rounded-sm ${isOpen ? 'bg-current' : 'bg-current opacity-40'}`}></div>
                    <div className={`rounded-sm ${isOpen ? 'bg-current' : 'bg-current opacity-40'}`}></div>
                    <div className={`rounded-sm ${isOpen ? 'bg-current' : 'bg-current opacity-60'}`}></div>
                </div>
            </button>
        </div>
    );
};

export default ConfigPanel;