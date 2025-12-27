import React, { useMemo } from 'react';
import { Color } from 'three';

interface IceMaterialProps {
  color: string;
}

export const IceMaterial: React.FC<IceMaterialProps> = ({ color }) => {
  return (
    <meshPhysicalMaterial 
      color={color}
      roughness={0.2}
      metalness={0.1}
      transmission={0.6}
      thickness={5.0}
      clearcoat={1.0}
      clearcoatRoughness={0.1}
      ior={1.31} // Ice IOR
    />
  );
};