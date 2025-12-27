import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D, InstancedMesh, DoubleSide } from 'three';

interface CloudsProps {
  color: string;
  opacity: number;
  count: number;
  altitude: number;
  speed: number;
}

/**
 * OPTIMIZED PROCEDURAL CLOUDS (STRATA LAYERS)
 * 
 * Design:
 * Instead of low-poly spheres (which look "blobby" and clash with the tech aesthetic),
 * we use simple 2D Planes oriented horizontally.
 * 
 * Aesthetic:
 * They look like "Lenticular Clouds" or high-altitude vapor layers.
 * This fits the "Kinematics/Sci-Fi" vibe much better—clean, geometric, and unobtrusive.
 * 
 * Performance:
 * Geometry: PlaneGeometry (2 triangles).
 * Instances: ~20-50.
 * Animation: Matrix updates in JS (negligible for this count).
 */
export const Clouds: React.FC<CloudsProps> = ({ color, opacity, count, altitude, speed }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const materialRef = useRef<any>(null);
  
  const dummy = useMemo(() => new Object3D(), []);

  // Generate random initial positions and scales
  const cloudData = useMemo(() => {
    const data = [];
    const spread = 500; // Wider area coverage

    for (let i = 0; i < 150; i++) { // Max pool size
      const scaleBase = 30 + Math.random() * 50;
      data.push({
        x: (Math.random() - 0.5) * spread,
        z: (Math.random() - 0.5) * spread,
        // Stratified layers: Random height offsets to create depth
        yOffset: (Math.random() - 0.5) * 15, 
        rotation: Math.random() * Math.PI,
        scaleX: scaleBase * (1.5 + Math.random()), // Stretch horizontally
        scaleZ: scaleBase * (0.8 + Math.random() * 0.4),
        speedMod: 0.5 + Math.random() * 0.8 // Parallax effect
      });
    }
    return data;
  }, []);

  // Update instance count when prop changes
  useEffect(() => {
      if (meshRef.current) {
          meshRef.current.count = Math.min(count, 150);
      }
  }, [count]);

  useFrame((state, delta) => {
    if (!meshRef.current || !materialRef.current) return;

    // Update Uniforms
    materialRef.current.uniforms.uColor.value.set(color);
    materialRef.current.uniforms.uOpacity.value = opacity;

    // Animate Positions (Drift)
    const moveSpeed = speed * delta * 2.0; // Base speed
    const boundary = 250; // Wrap boundary

    for (let i = 0; i < meshRef.current.count; i++) {
      const cloud = cloudData[i];
      
      // Move along X axis
      cloud.x += moveSpeed * cloud.speedMod;
      
      // Seamless Wrap
      if (cloud.x > boundary) cloud.x = -boundary;
      if (cloud.x < -boundary) cloud.x = boundary;

      // Update Matrix
      dummy.position.set(
          cloud.x, 
          altitude + cloud.yOffset, 
          cloud.z
      );
      
      // Rotate flat plane to be horizontal (XZ plane)
      dummy.rotation.set(-Math.PI / 2, 0, cloud.rotation);
      
      dummy.scale.set(cloud.scaleX, cloud.scaleZ, 1); // Z is Y in local space due to rotation
      dummy.updateMatrix();

      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform vec3 uColor;
    uniform float uOpacity;
    varying vec2 vUv;

    void main() {
      // Create a soft, radial gradient
      // Center (0.5, 0.5) is opaque, edges are transparent.
      vec2 center = vUv - 0.5;
      float dist = length(center) * 2.0; // 0.0 to 1.0+
      
      // Inverse soft circle
      float shape = 1.0 - smoothstep(0.0, 1.0, dist);
      
      // Powell curve to make the core tighter and the fade longer
      shape = pow(shape, 1.5);
      
      // Subtle "Cloud Texture" using simple math noise (optional, keeps it looking procedural)
      // This breaks up the perfect gradient so it doesn't look like a UI element
      // float noise = sin(vUv.y * 10.0 + vUv.x * 20.0) * 0.05;
      // shape += noise;

      if (shape < 0.01) discard;

      gl_FragColor = vec4(uColor, shape * uOpacity);
    }
  `;

  const uniforms = useMemo(() => ({
      uColor: { value: new Color(color) },
      uOpacity: { value: opacity }
  }), []);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 150]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial 
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={DoubleSide}
      />
    </instancedMesh>
  );
};