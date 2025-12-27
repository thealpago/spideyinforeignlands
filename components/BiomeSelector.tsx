import React from 'react';
import { BIOMES } from '../data/biomes';
import { BgConfig } from '../types';

interface BiomeSelectorProps {
  currentConfig: BgConfig;
  onSelect: (config: BgConfig) => void;
}

export const BiomeSelector: React.FC<BiomeSelectorProps> = ({ currentConfig, onSelect }) => {
  return (
    <div className="flex flex-col items-end gap-1 pointer-events-auto bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/5 shadow-xl">
      <div className="text-[10px] font-mono text-white tracking-widest uppercase mb-1 font-bold drop-shadow-md opacity-80">Target Biome</div>
      <div className="flex flex-col gap-1.5">
        {BIOMES.map((biome) => {
          const isActive = currentConfig.terrainType === biome.config.terrainType;
          return (
            <button
              key={biome.id}
              onClick={() => onSelect(biome.config)}
              className={`
                text-right text-xs font-mono py-1 px-3 border-r-2 transition-all duration-300
                ${isActive
                  ? 'border-white text-white bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                  : 'border-white/10 text-white hover:text-white hover:border-white/30 hover:bg-white/5'}
              `}
            >
              {biome.name.toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
};