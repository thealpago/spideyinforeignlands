import React, { useMemo } from 'react';
import { Color } from 'three';
import { useFrame } from '@react-three/fiber';

interface AntarcticaMaterialProps {
    color: string;
}

export const AntarcticaMaterial: React.FC<AntarcticaMaterialProps> = ({ color }) => {
    const uniforms = useMemo(() => ({
        uColor: { value: new Color(color) },
        uTime: { value: 0 }
    }), []);

    useFrame((state) => {
        uniforms.uTime.value = state.clock.elapsedTime;
    });

    useMemo(() => {
        uniforms.uColor.value.set(color);
    }, [color, uniforms]);

    const onBeforeCompile = (shader: any) => {
        shader.uniforms.uColor = uniforms.uColor;
        shader.uniforms.uTime = uniforms.uTime;

        shader.vertexShader = shader.vertexShader.replace(
            '#include <common>',
            `#include <common>
       varying vec3 vAntarcticaWorldPos;
       varying vec3 vAntarcticaNormal;`
        );
        shader.vertexShader = shader.vertexShader.replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>
       vAntarcticaWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
       vAntarcticaNormal = normalize(normalMatrix * normal);`
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <common>',
            `#include <common>
       uniform vec3 uColor;
       uniform float uTime;
       varying vec3 vAntarcticaWorldPos;
       varying vec3 vAntarcticaNormal;

       // Optimized Gradient Noise for PBR Texture Look
       float hash(vec2 p) {
           return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
       }

       float noise(vec2 p) {
           vec2 i = floor(p);
           vec2 f = fract(p);
           vec2 u = f * f * (3.0 - 2.0 * f);
           return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
                      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
       }

       float fbm(vec2 p) {
           float v = 0.0;
           float a = 0.5;
           for (int i = 0; i < 4; i++) {
               v += a * noise(p);
               p *= 2.0;
               a *= 0.5;
           }
           return v;
       }
       `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
            '#include <map_fragment>',
            `#include <map_fragment>
       
       vec3 worldPos = vAntarcticaWorldPos;
       vec3 normal = normalize(vNormal);
       vec3 viewDir = normalize(vViewPosition);

       // 1. Physically Based Albedo Variation
       // Domain Warping for ice patterns
       vec2 q = vec2(fbm(worldPos.xz * 0.1), fbm(worldPos.xz * 0.1 + vec2(5.2, 1.3)));
       vec2 r = vec2(fbm(worldPos.xz * 0.1 + 4.0 * q + vec2(1.7, 9.2)), fbm(worldPos.xz * 0.1 + 4.0 * q + vec2(8.3, 2.8)));
       float pattern = fbm(worldPos.xz * 0.05 + 4.0 * r);

       // High-frequency granular snow noise
       float grain = hash(worldPos.xz * 15.0) * 0.15;
       
       // Sastrugi highlight (wind alignment)
       float sastrugi = noise(worldPos.xz * vec2(0.05, 0.4)) * 0.2;

       // 2. Color Composition
       // Deep blue ice for crevasses/slopes, bright white for peaks
       float heightFactor = smoothstep(-15.0, 10.0, worldPos.y);
       float slopeFactor = 1.0 - max(0.0, dot(normal, vec3(0, 1, 0)));
       
       vec3 iceBase = mix(vec3(0.4, 0.6, 0.8), vec3(0.9, 0.95, 1.0), heightFactor); // Blue-white transition
       vec3 snowAlbedo = mix(iceBase, vec3(1.0), pattern * 0.5);
       
       // Add cold gray shadows to slopes
       snowAlbedo = mix(snowAlbedo, vec3(0.5, 0.55, 0.6), slopeFactor * 0.6);
       
       // Fresnel / Scattering look
       float fresnel = pow(1.0 - max(0.0, dot(normal, viewDir)), 3.0);
       
       diffuseColor.rgb = snowAlbedo + grain + sastrugi;
       diffuseColor.rgb += vec3(0.3, 0.5, 0.8) * fresnel * 0.4; // Internal scattering glow

       // 3. PBR Properties adjustment
       float roughness = mix(0.1, 0.85, pattern); // Ice is smooth, snow is rough
       roughness = mix(roughness, 1.0, grain);
       // We can't directly set roughness here in map_fragment without more hacking, 
       // but we can adjust specular/metalness if needed by extending other chunks.
       `
        );
    };

    return (
        <meshPhysicalMaterial
            color={color}
            roughness={0.4}
            metalness={0.05}
            transmission={0.0} // Reverting transmission for better solid ground visibility
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            ior={1.31}
            onBeforeCompile={onBeforeCompile}
            customProgramCacheKey={() => 'antarctica-pbr-v2'}
        />
    );
};
