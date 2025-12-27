import React from 'react';

// --- BIOME MATERIALS ---

// Obsidian doesn't have a dedicated shader file yet, so we keep it here.
export const ObsidianMaterial = ({ color }: { color: string }) => (
  <meshStandardMaterial 
    color={color} 
    roughness={0.1} 
    metalness={0.8} 
    flatShading 
  />
);

export const WaterMaterial = () => (
    <meshPhysicalMaterial 
        color="#00aaff" 
        transmission={0.8} 
        roughness={0.0} 
        metalness={0.1} 
        transparent 
        opacity={0.8} 
    />
);