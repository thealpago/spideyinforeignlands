import React, { useState } from 'react';
import { VehicleConfig } from '../types';
import vehicleConfigs from '../vehicleConfigs';

interface VehiclePanelProps {
    config: VehicleConfig;
    onChange: (newConfig: VehicleConfig) => void;
    buttonClassName?: string;
    isOpen?: boolean;
    onToggle?: () => void;
}

const CollapsibleSection: React.FC<{
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, icon, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-white/5 last:border-0 pb-4 mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center text-[11px] text-gray-400 font-mono tracking-widest hover:text-white transition-all py-1 group"
            >
                <div className="flex items-center gap-2">
                    {icon && <span className="opacity-50 group-hover:opacity-100 transition-opacity">{icon}</span>}
                    <span>{title}</span>
                </div>
                <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </span>
            </button>

            <div className={`space-y-4 transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? 'mt-4 max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
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
    unit?: string;
    onChange: (val: number) => void;
}> = ({ label, value, min, max, step, unit = '', onChange }) => (
    <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono">
            <span className="text-gray-500 uppercase tracking-tighter">{label}</span>
            <span className="text-white bg-white/10 px-1.5 rounded-sm">{value.toFixed(1)}{unit}</span>
        </div>
        <input
            type="range" min={min} max={max} step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-white h-1 bg-white/10 rounded-full appearance-none cursor-pointer hover:bg-white/20 transition-colors"
        />
    </div>
);

const SelectControl: React.FC<{
    label: string;
    value: string;
    options: Record<string, any>;
    onChange: (val: string) => void;
}> = ({ label, value, options, onChange }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] text-gray-500 font-mono block uppercase tracking-tighter">{label}</label>
        <div className="relative group">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full bg-transparent border border-transparent rounded-lg px-3 py-2 text-[11px] text-white font-mono focus:outline-none focus:border-transparent appearance-none cursor-pointer transition-all"
            >
                {Object.entries(options).map(([id, opt]: [string, any]) => (
                    <option key={id} value={id} className="bg-transparent text-white py-2">
                        {opt.name || id}
                    </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </div>
    </div>
);

const ColorControl: React.FC<{
    label: string;
    value: string;
    onChange: (val: string) => void;
}> = ({ label, value, onChange }) => (
    <div className="flex justify-between items-center bg-white/5 p-2.5 rounded-xl border border-white/5 hover:border-white/10 transition-all">
        <span className="text-[10px] text-gray-400 font-mono uppercase tracking-tighter">{label}</span>
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/20 shadow-inner group cursor-pointer">
            <input
                type="color"
                value={value.startsWith('#') ? value : '#000000'}
                onChange={(e) => onChange(e.target.value)}
                className="absolute inset-0 w-full h-full scale-150 cursor-pointer bg-transparent border-none"
            />
        </div>
    </div>
);

export const VehiclePanel: React.FC<VehiclePanelProps> = ({ config, onChange, buttonClassName, isOpen = false, onToggle }) => {

    const handleChange = (key: keyof VehicleConfig, value: any) => {
        onChange({ ...config, [key]: value });
    };

    const activeStyle = 'bg-white/10 text-white border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.15)]';
    const defaultStyle = `p-2 rounded-xl transition-all duration-300 ${isOpen ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`;

    const buttonClass = buttonClassName
        ? `${buttonClassName} ${isOpen ? activeStyle : ''}`
        : defaultStyle;

    return (
        <div className="pointer-events-auto">
            <div className={`
                absolute bottom-[calc(100%+20px)] left-1/2 -translate-x-1/2
                bg-transparent border border-transparent p-6 rounded-3xl backdrop-blur-0 shadow-none w-[90vw] sm:w-[360px] z-50 max-h-[75vh] overflow-y-auto custom-scrollbar origin-bottom
                transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
                ${isOpen ? 'opacity-100 scale-100 translate-y-0 rotate-0' : 'opacity-0 scale-95 translate-y-4 rotate-1 pointer-events-none'}
            `}>

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-[13px] font-mono text-white font-bold tracking-[0.2em] uppercase">Vehicle Config</h3>
                        <p className="text-[9px] text-gray-500 font-mono uppercase mt-1">4x4 Off-Road Customizer</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <CollapsibleSection
                        title="BODY & EXTERIOR"
                        defaultOpen={true}
                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C1.4 11.1 1 11.7 1 12.4V16c0 .6.4 1 1 1h2" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>}
                    >
                        <SelectControl
                            label="Vehicle Model"
                            value={config.body}
                            options={vehicleConfigs.vehicles}
                            onChange={(v) => handleChange('body', v)}
                        />
                        <div className="grid grid-cols-1 gap-3">
                            <ColorControl
                                label="Body Color"
                                value={config.color}
                                onChange={(v) => handleChange('color', v)}
                            />
                            <RangeControl
                                label="Paint Roughness"
                                value={config.roughness}
                                min={0}
                                max={1}
                                step={0.01}
                                onChange={(v) => handleChange('roughness', v)}
                            />
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="SUSPENSION"
                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 20l5-5 5 5M7 4l5 5 5-5M12 9v6" /></svg>}
                    >
                        <RangeControl
                            label="Suspension Lift"
                            value={config.lift}
                            min={0}
                            max={16}
                            step={0.5}
                            unit='"'
                            onChange={(v) => handleChange('lift', v)}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="WHEELS"
                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>}
                    >
                        <SelectControl
                            label="Rim Style"
                            value={config.rim}
                            options={vehicleConfigs.wheels.rims}
                            onChange={(v) => handleChange('rim', v)}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <RangeControl label="Rim Dia" value={config.rim_diameter} min={15} max={28} step={1} unit='"' onChange={(v) => handleChange('rim_diameter', v)} />
                            <RangeControl label="Rim Width" value={config.rim_width} min={8} max={18} step={1} unit='"' onChange={(v) => handleChange('rim_width', v)} />
                        </div>
                        <ColorControl
                            label="Rim Color Primary"
                            value={config.rim_color === 'gloss_black' ? '#000000' : config.rim_color}
                            onChange={(v) => handleChange('rim_color', v)}
                        />
                        <ColorControl
                            label="Rim Color Secondary"
                            value={config.rim_color_secondary === 'gloss_black' ? '#000000' : config.rim_color_secondary}
                            onChange={(v) => handleChange('rim_color_secondary', v)}
                        />
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="TIRES"
                        icon={<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M4.93 19.07L19.07 4.93" /></svg>}
                    >
                        <SelectControl
                            label="Tire Tread"
                            value={config.tire}
                            options={vehicleConfigs.wheels.tires}
                            onChange={(v) => handleChange('tire', v)}
                        />
                        <RangeControl
                            label="Tire Diameter"
                            value={config.tire_diameter}
                            min={28}
                            max={48}
                            step={1}
                            unit='"'
                            onChange={(v) => handleChange('tire_diameter', v)}
                        />
                        <RangeControl
                            label="Tire Muddiness"
                            value={config.tire_muddiness || 0}
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(v) => handleChange('tire_muddiness', v)}
                        />
                    </CollapsibleSection>
                </div>

                {/* Footer Info */}
                <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-[8px] font-mono text-gray-600 uppercase tracking-widest">
                    <span>Advanced Physics Engine</span>
                    <span>Ready for Terrain</span>
                </div>
            </div>

            {/* Navbar Icon Button */}
            <button
                onClick={onToggle}
                className={buttonClass}
                title="Vehicle Customization"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:rotate-12">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
                </svg>
            </button>
        </div>
    );
};

export default VehiclePanel;
