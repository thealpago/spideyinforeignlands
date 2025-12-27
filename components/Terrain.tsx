import React, { useMemo, useRef, useEffect, useState } from 'react';
import { BufferGeometry, BufferAttribute, InstancedMesh, Object3D, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { getTerrainHeight } from '../utils/helpers';
import {
  SandMaterial,
  IceMaterial,
  CanyonMaterial,
  CrystalMaterial,
  MoonMaterial,
  MarsMaterial,
  ObsidianMaterial,
  VolcanoMaterial,
  OasisMaterial,
  MatrixMaterial,
  RainMaterial,
  WaterPlanetMaterial,
  AntarcticaMaterial
} from './Materials';
import { WaterMaterial } from './Materials/BiomeMaterials';
import { RainParticles } from './RainParticles';
import { SnowParticles } from './SnowParticles';
import { WetRocks } from './WetRocks';
import { Grass } from './Grass';
import { TerrainType } from '../types';

// --- Procedural Mars Rocks (Updated for Chunks) ---
const MarsRocks: React.FC<{ offset: [number, number], size: number }> = ({ offset, size }) => {
  const meshRef = useRef<InstancedMesh>(null);
  const count = 30; // Fewer rocks per chunk (was 400 for whole map)
  const dummy = useMemo(() => new Object3D(), []);

  useEffect(() => {
    if (!meshRef.current) return;

    // Use deterministic random based on chunk coord would be better, but simple random per chunk mount works for now
    // provided we don't unmount frequently.

    for (let i = 0; i < count; i++) {
      // Local position in chunk
      const lx = (Math.random() - 0.5) * size;
      const lz = (Math.random() - 0.5) * size;

      const worldX = lx + offset[0];
      const worldZ = lz + offset[1];

      const y = getTerrainHeight(worldX, worldZ, 'mars');

      dummy.position.set(lx, y + 0.2, lz); // Local position for instanced mesh

      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      );

      const scale = 0.2 + Math.random() * 0.8;
      dummy.scale.set(scale, scale, scale);

      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [offset, size]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={true}>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#5a3d31" roughness={0.9} />
    </instancedMesh>
  );
};

// --- Single Terrain Chunk Component ---
const TerrainChunk: React.FC<{
  chunkX: number;
  chunkZ: number;
  size: number;
  color: string;
  type: TerrainType
}> = React.memo(({ chunkX, chunkZ, size, color, type }) => {

  const segments = 48; // Lower resolution per chunk for performance
  const worldOffsetX = chunkX * size;
  const worldOffsetZ = chunkZ * size;

  const geometry = useMemo(() => {
    const positions = [];
    const normals = [];
    const indices = [];
    const uvs = [];

    const halfSize = size / 2;
    const segmentSize = size / segments;
    const epsilon = 0.1; // Small delta for calculating derivatives

    // Generate vertices
    for (let i = 0; i <= segments; i++) {
      for (let j = 0; j <= segments; j++) {
        // Local coordinates (relative to chunk center 0,0)
        const x = i * segmentSize - halfSize;
        const z = j * segmentSize - halfSize;

        // World coordinates for noise calculation
        const wx = x + worldOffsetX;
        const wz = z + worldOffsetZ;

        const y = getTerrainHeight(wx, wz, type);

        positions.push(x, y, z);
        uvs.push(i / segments, j / segments);

        // --- Manual Normal Calculation ---
        // Instead of using computeVertexNormals (which causes seams at edges),
        // we calculate the normal analytically using the global height function.
        // This ensures normals at the edge of Chunk A match Chunk B perfectly.

        const hL = getTerrainHeight(wx - epsilon, wz, type);
        const hR = getTerrainHeight(wx + epsilon, wz, type);
        const hD = getTerrainHeight(wx, wz - epsilon, type);
        const hU = getTerrainHeight(wx, wz + epsilon, type);

        // Tangent vectors approach
        // Normal = Cross(Up-Vector, Right-Vector)
        // Vector X+ (Right): (2e, hR-hL, 0)
        // Vector Z+ (Up/Forward): (0, hU-hD, 2e)
        // Result: (hL-hR, 2e, hD-hU) normalized

        const nx = hL - hR;
        const ny = 2 * epsilon;
        const nz = hD - hU;

        // Normalize manually to avoid Vector3 overhead in loop if possible, 
        // but Vector3 class is convenient.
        const n = new Vector3(nx, ny, nz).normalize();
        normals.push(n.x, n.y, n.z);
      }
    }

    // Generate indices
    for (let i = 0; i < segments; i++) {
      for (let j = 0; j < segments; j++) {
        const a = i * (segments + 1) + j;
        const b = i * (segments + 1) + j + 1;
        const c = (i + 1) * (segments + 1) + j;
        const d = (i + 1) * (segments + 1) + j + 1;

        indices.push(a, b, d);
        indices.push(a, d, c);
      }
    }

    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3));
    geo.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3));
    geo.setAttribute('uv', new BufferAttribute(new Float32Array(uvs), 2));
    geo.setIndex(indices);

    // Do NOT call computeVertexNormals(), we did it manually to fix seams.

    return geo;
  }, [chunkX, chunkZ, size, type]);

  const renderMaterial = () => {
    switch (type) {
      case 'ice': return <IceMaterial color={color} />;
      case 'canyon': return <CanyonMaterial color={color} />;
      case 'crystal': return <CrystalMaterial color={color} />;
      case 'moon': return <MoonMaterial color={color} />;
      case 'mars': return <MarsMaterial color={color} />;
      case 'volcano': return <VolcanoMaterial color={color} />;
      case 'obsidian': return <ObsidianMaterial color={color} />;
      case 'oasis': return <OasisMaterial color={color} />;
      case 'rain': return <RainMaterial color={color} />;
      case 'water_planet': return <WaterPlanetMaterial color={color} offset={[chunkX * size, chunkZ * size]} />;
      case 'antarctica': return <AntarcticaMaterial color={color} />;
      case 'grass': return <SandMaterial color={color} roughness={1} />;
      case 'tech':
      case 'grid': return <MatrixMaterial color={color} />;
      case 'sand':
      default: return <SandMaterial color={color} />;
    }
  };

  return (
    <group position={[worldOffsetX, 0, worldOffsetZ]}>
      <mesh receiveShadow castShadow geometry={geometry} frustumCulled={false}>
        {renderMaterial()}
      </mesh>

      {/* Chunk-Specific Decorations */}
      {type === 'mars' && <MarsRocks offset={[worldOffsetX, worldOffsetZ]} size={size} />}
      {type === 'rain' && <WetRocks offset={[worldOffsetX, worldOffsetZ]} size={size} />}
      {type === 'grass' && <Grass offset={[worldOffsetX, worldOffsetZ]} size={size} />}

      {/* Special Case Extras */}
      {type === 'oasis' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.5, 0]}>
          <planeGeometry args={[size, size, 1, 1]} />
          <WaterMaterial />
        </mesh>
      )}
    </group>
  );
});

// --- Infinite Terrain Manager ---
interface InfiniteTerrainProps {
  color?: string;
  type?: TerrainType;
  characterPosRef: React.MutableRefObject<Vector3>;
}

const InfiniteTerrain: React.FC<InfiniteTerrainProps> = ({ color = "#f4a460", type = 'sand', characterPosRef }) => {
  const CHUNK_SIZE = 120; // Size of one tile
  const RENDER_DISTANCE = 2; // Radius of chunks to render (2 = 5x5 grid)

  const [visibleChunks, setVisibleChunks] = useState<string[]>([]);

  // Ref to store current center chunk to avoid state updates every frame
  const currentCenterRef = useRef<{ x: number, z: number } | null>(null);

  useFrame(() => {
    if (!characterPosRef.current) return;

    const pX = characterPosRef.current.x;
    const pZ = characterPosRef.current.z;

    const centerChunkX = Math.round(pX / CHUNK_SIZE);
    const centerChunkZ = Math.round(pZ / CHUNK_SIZE);

    if (
      !currentCenterRef.current ||
      currentCenterRef.current.x !== centerChunkX ||
      currentCenterRef.current.z !== centerChunkZ
    ) {
      currentCenterRef.current = { x: centerChunkX, z: centerChunkZ };

      const newChunks: string[] = [];
      for (let x = -RENDER_DISTANCE; x <= RENDER_DISTANCE; x++) {
        for (let z = -RENDER_DISTANCE; z <= RENDER_DISTANCE; z++) {
          newChunks.push(`${centerChunkX + x}:${centerChunkZ + z}`);
        }
      }
      setVisibleChunks(newChunks);
    }
  });

  return (
    <group>
      {visibleChunks.map(key => {
        const [x, z] = key.split(':').map(Number);
        return (
          <TerrainChunk
            key={key}
            chunkX={x}
            chunkZ={z}
            size={CHUNK_SIZE}
            color={color}
            type={type}
          />
        );
      })}

      {/* Global Particles (Atmosphere) - Rendered once, moved via shader usually */}
      {type === 'rain' && <RainParticles />}
      {type === 'antarctica' && <SnowParticles />}
    </group>
  );
};

export default InfiniteTerrain;