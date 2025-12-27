import React from 'react';

interface AntarcticaMaterialProps {
    color: string;
}

export const AntarcticaMaterial: React.FC<AntarcticaMaterialProps> = ({ color }) => {
    return (
        <meshStandardMaterial
            color={color}
            roughness={0.8}
            metalness={0.1}
            flatShading={false}
        />
    );
};
