import React, { useMemo } from 'react';
import { Color } from 'three';

interface AntarcticaMaterialProps {
    color: string;
}

export const AntarcticaMaterial: React.FC<AntarcticaMaterialProps> = ({ color }) => {
    const uniforms = useMemo(() => ({
        uColor: { value: new Color(color) },
    }), []);

    useMemo(() => {
        uniforms.uColor.value.set(color);
    }, [color, uniforms]);

    const onBeforeCompile = (shader: any) => {
        shader.uniforms.uColor = uniforms.uColor;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `#include <common>
       varying vec3 vAntarcticaWorldPos;`
        );
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
       vAntarcticaWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `#include <common>
       uniform vec3 uColor;
       varying vec3 vAntarcticaWorldPos;`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `#include <map_fragment>
       
       vec3 normal = normalize(vNormal);
       vec3 viewDir = normalize(vViewPosition);
       float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 4.0);
       
       // Combine Ice transparency look with Crystal iridescence
       float iceFactor = smoothstep(-2.0, 5.0, vAntarcticaWorldPos.y);
       vec3 iceColor = mix(uColor * 0.8, vec3(1.0), iceFactor * 0.4);
       
       // Shimmering Crystal effect
       vec3 shimmer = vec3(0.0);
       shimmer.r = sin(vAntarcticaWorldPos.x * 0.2 + vAntarcticaWorldPos.z * 0.1) * 0.5 + 0.5;
       shimmer.g = sin(vAntarcticaWorldPos.z * 0.2 - vAntarcticaWorldPos.y * 0.1) * 0.5 + 0.5;
       shimmer.b = sin(vAntarcticaWorldPos.y * 0.2 + vAntarcticaWorldPos.x * 0.1) * 0.5 + 0.5;
       
       diffuseColor.rgb = mix(iceColor, shimmer * uColor, fresnel * 0.3);
       diffuseColor.rgb += fresnel * 0.5 * vec3(0.8, 0.9, 1.0); // Cold frost glow
       diffuseColor.a = 0.95;
       `
        );
    };

    return (
        <meshPhysicalMaterial
            color={color}
            roughness={0.15}
            metalness={0.2}
            transmission={0.4}
            thickness={2.0}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            ior={1.35}
            transparent
            onBeforeCompile={onBeforeCompile}
            customProgramCacheKey={() => 'antarctica-material'}
        />
    );
};
