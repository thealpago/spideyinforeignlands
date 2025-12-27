import { Vector3, MathUtils } from 'three';
import { TerrainType } from '../types';

// --- Math & Easing ---

export const lerp = (start: number, end: number, t: number) => {
    return start * (1 - t) + end * t;
};

export const easeInOutCubic = (x: number): number => {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

// --- Procedural Noise Utils ---

// Pseudo-random hash
const hash2d = (x: number, y: number) => {
    const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
};

// Value Noise
const noise = (x: number, z: number) => {
    const i = Math.floor(x);
    const j = Math.floor(z);
    const f = x - i;
    const g = z - j;

    // Smoothstep
    const u = f * f * (3.0 - 2.0 * f);
    const v = g * g * (3.0 - 2.0 * g);

    return MathUtils.lerp(
        MathUtils.lerp(hash2d(i, j), hash2d(i + 1, j), u),
        MathUtils.lerp(hash2d(i, j + 1), hash2d(i + 1, j + 1), u),
        v
    );
};

// Fractal Brownian Motion
const fbm = (x: number, z: number, octaves: number, persistence: number, lacunarity: number) => {
    let total = 0;
    let frequency = 1;
    let amplitude = 1;
    let maxValue = 0;
    for (let i = 0; i < octaves; i++) {
        total += noise(x * frequency, z * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return total / maxValue;
};

// --- Terrain Generation ---

const getDuneHeight = (x: number, z: number): number => {
    let y = 0;
    const warpX = x + Math.sin(z * 0.035) * 12.0;
    const warpZ = z + Math.sin(x * 0.040) * 8.0;
    const baseDune = Math.sin(warpX * 0.04 + warpZ * 0.01);
    y += Math.pow(baseDune * 0.5 + 0.5, 2.5) * 5.0;
    y += Math.sin(warpX * 0.13 + warpZ * 0.11) * 1.2;
    y += Math.sin(x * 0.37 - z * 0.23) * 0.35;
    return y;
};

const getIceHeight = (x: number, z: number): number => {
    let y = 0;
    const warpX = x + Math.sin(z * 0.025) * 25.0;
    const warpZ = z + Math.sin(x * 0.025) * 20.0;
    y += Math.sin(warpX * 0.03 + warpZ * 0.02) * 5.0;
    const rX = x * 0.12 + z * 0.08;
    const rZ = z * 0.12 - x * 0.08;
    const ridge1 = Math.pow(Math.abs(Math.sin(rX)), 4.0);
    const ridge2 = Math.pow(Math.abs(Math.sin(rZ)), 4.0);
    y += (ridge1 + ridge2) * 2.5;
    y += Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.4;
    return y;
};

const getCanyonHeight = (x: number, z: number): number => {
    let y = 0;
    const warpX = x + Math.sin(z * 0.012) * 30.0;
    const warpZ = z + Math.cos(x * 0.015) * 30.0;
    const scale = 0.012;
    const base = Math.sin(warpX * scale) * Math.cos(warpZ * scale);
    y = Math.pow(base, 3.0) * 22.0;
    y += Math.sin(y * 1.5) * 1.2;
    y += Math.sin(x * 0.3) * Math.cos(z * 0.24) * 0.8;
    return y;
};

const getCrystalHeight = (x: number, z: number): number => {
    const blockSize = 15.0;
    const qx = Math.floor(x / blockSize);
    const qz = Math.floor(z / blockSize);
    const hash = Math.sin(qx * 12.9898 + qz * 78.233) * 43758.5453;
    const val = hash - Math.floor(hash);
    let h = 0;
    if (val > 0.85) h = 8.0;
    else if (val > 0.6) h = 4.0;
    else if (val > 0.4) h = -2.0;
    h += Math.sin(x * 0.02 + z * 0.02) * 2.0;
    return h;
};

const getTechHeight = (x: number, z: number): number => {
    const y1 = Math.sin(x * 0.3) * Math.cos(z * 0.3) * 1.5;
    const y2 = Math.sin(x * 0.8 + 2) * Math.sin(z * 0.5) * 0.5;
    return Math.max(-2, y1 + y2);
};

const getMoonHeight = (x: number, z: number): number => {
    let y = 0;
    y += Math.sin(x * 0.02 + z * 0.015) * Math.cos(z * 0.025 - x * 0.01) * 8.0;
    y += Math.sin(x * 0.06) * Math.cos(z * 0.07) * 3.5;
    y += Math.sin(x * 0.25 + 1.5) * Math.sin(z * 0.22 + 2.0) * 1.0;
    const craterNoise = Math.sin(x * 0.07) + Math.cos(z * 0.085);
    if (craterNoise > 1.3) {
        const val = craterNoise - 1.3;
        const depth = val * val * 20.0;
        y -= depth;
        if (val < 0.2) y += val * 3.0;
    }
    return y;
};

const getMarsHeight = (x: number, z: number): number => {
    let y = 0;
    y += fbm(x * 0.01, z * 0.01, 3, 0.5, 2.0) * 15.0;
    const ridgeNoise = 1.0 - Math.abs(fbm(x * 0.03, z * 0.03, 2, 0.5, 2.0) * 2.0 - 1.0);
    y += Math.pow(ridgeNoise, 2.0) * 10.0;
    const duneFreq = 0.08;
    const duneAmp = 1.2;
    const duneMask = smoothstep(0.3, 1.0, fbm(x * 0.005, z * 0.005, 2, 0.5, 2.0));
    const duneShape = Math.sin(x * duneFreq + z * duneFreq * 0.5 + fbm(x * 0.02, z * 0.02, 2, 0.5, 2.0) * 2.0);
    const sharpenedDune = Math.pow(duneShape * 0.5 + 0.5, 1.5) * duneAmp;
    y += sharpenedDune * duneMask;
    y += noise(x * 0.5, z * 0.5) * 0.5;
    return y;
};

const getObsidianHeight = (x: number, z: number): number => {
    let y = 0;
    const f1 = 0.05;
    const n1 = Math.abs(Math.sin(x * f1 + z * 0.02) + Math.cos(z * f1 + x * 0.03));
    y += Math.pow(n1, 2.0) * 15.0;
    const f2 = 0.2;
    const n2 = Math.sin(x * f2) * Math.cos(z * f2);
    y += Math.abs(n2) * 5.0;
    const fissureBase = Math.sin(x * 0.08) + Math.cos(z * 0.09);
    if (fissureBase < -1.2) y -= 12.0 * (Math.abs(fissureBase) - 1.2);
    const pillarChance = Math.sin(x * 0.5 + 100) * Math.cos(z * 0.5 + 100);
    if (pillarChance > 0.95) y += 8.0;
    y += Math.sin(x * 0.02) * 5.0;
    return y;
};

const getVolcanoHeight = (x: number, z: number): number => {
    let y = 0;
    y += Math.sin(x * 0.03) * Math.cos(z * 0.04) * 2.0;
    y += Math.sin(x * 0.8) * Math.cos(z * 0.9) * 0.15;
    const wx = x * 0.08 + Math.sin(z * 0.05) * 5.0;
    const wz = z * 0.08 + Math.cos(x * 0.05) * 5.0;
    const ridge = Math.abs(Math.sin(wx) + Math.cos(wz));
    if (ridge < 0.25) {
        const depth = (0.25 - ridge) * 4.0;
        y -= depth * 3.5;
    }
    const rockNoise = Math.sin(x * 0.6 + z * 0.4) * Math.cos(x * 0.3 - z * 0.5);
    if (rockNoise > 0.92) y += 1.5 + (rockNoise - 0.92) * 5.0;
    return y;
};

const getOasisHeight = (x: number, z: number): number => {
    let y = 0;
    const slope = MathUtils.smoothstep(x, -30, 40);
    const baseHeight = lerp(-6, 8, slope);
    y += baseHeight;
    const duneAmp = slope * 6.0;
    if (duneAmp > 0.1) {
        const warpX = x + Math.sin(z * 0.03) * 10.0;
        const duneNoise = Math.sin(warpX * 0.04 + z * 0.02);
        y += Math.pow(duneNoise * 0.5 + 0.5, 2.0) * duneAmp;
    }
    const rockZone = Math.max(0, 1.0 - Math.abs((x - 10) / 20.0));
    if (rockZone > 0) {
        const rockNoise = Math.sin(x * 0.4) * Math.cos(z * 0.5);
        if (rockNoise > 0.85) y += (rockNoise - 0.85) * 20.0 * rockZone;
    }
    if (x < -10) y += Math.sin(x * 0.2) * Math.cos(z * 0.2) * 1.0;
    const distToWater = Math.abs(y - (-2.5));
    if (distToWater < 1.0 && x > -20) y = lerp(y, -2.5, 0.4 * (1.0 - distToWater));
    return y;
};

const getRainHeight = (x: number, z: number): number => {
    let y = 0;
    y += (Math.sin(x * 0.015) + Math.cos(z * 0.018)) * 4.0;
    y += Math.sin(x * 0.03 + z * 0.04) * 2.0;
    y += fbm(x * 0.08, z * 0.08, 2, 0.5, 2.0) * 2.0;
    return y;
};

const getWaterPlanetHeight = (x: number, z: number): number => {
    // MILLER'S PLANET PHYSICS
    // The physics terrain (walkable) is "Shallow Water" (Knee deep).
    // The giant waves are purely visual (Vertex Displacement in Shader).
    // If we make the physics wavey, the spider will fly into the sky.
    // Instead, we create a flat surface with small ripples for walking.

    // Slight noise to make it feel like walking on uneven seabed
    const seabed = noise(x * 0.05, z * 0.05) * 0.5;

    // Base level -1.0 so the water surface (y=0 visual) is around the spider's knees
    return seabed - 1.5;
};

const getGrassHeight = (x: number, z: number): number => {
    // Soft Rolling Hills
    let y = 0;
    y += Math.sin(x * 0.01 + z * 0.02) * 5.0; // Long gentle waves
    return y;
};

const getFlatDesertHeight = (x: number, z: number): number => {
    // 4x4 Test Track: Dümdüz ama mikroskopik pürüzler var (lastik dokusu için)
    return Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.05;
};

const getAntarcticaHeight = (x: number, z: number): number => {
    let y = 0;
    // Combine sharp ridges with crystalline blocks
    const ridgeFreq = 0.03;
    const ridgeNoise = Math.abs(Math.sin(x * ridgeFreq) * Math.cos(z * ridgeFreq));
    y += Math.pow(1.0 - ridgeNoise, 3.0) * 12.0;

    // Crystalline stepping
    const blockSize = 20.0;
    const qx = Math.floor(x / blockSize);
    const qz = Math.floor(z / blockSize);
    const crystalHash = Math.sin(qx * 12.9898 + qz * 78.233) * 43758.5453;
    const crystalVal = crystalHash - Math.floor(crystalHash);
    if (crystalVal > 0.7) y += 4.0;

    // Frosty surface noise
    y += (Math.sin(x * 0.4) + Math.cos(z * 0.4)) * 0.3;

    return y;
};

// Helper for smoothstep (missing in MathUtils in some versions, ensuring availability)
function smoothstep(min: number, max: number, value: number) {
    var x = Math.max(0, Math.min(1, (value - min) / (max - min)));
    return x * x * (3 - 2 * x);
}

export const getTerrainHeight = (x: number, z: number, type: TerrainType = 'sand'): number => {
    if (type === 'ice') return getIceHeight(x, z);
    if (type === 'canyon') return getCanyonHeight(x, z);
    if (type === 'crystal') return getCrystalHeight(x, z);
    if (type === 'tech') return getTechHeight(x, z);
    if (type === 'moon') return getMoonHeight(x, z);
    if (type === 'mars') return getMarsHeight(x, z);
    if (type === 'obsidian') return getObsidianHeight(x, z);
    if (type === 'volcano') return getVolcanoHeight(x, z);
    if (type === 'oasis') return getOasisHeight(x, z);
    if (type === 'rain') return getRainHeight(x, z);
    if (type === 'water_planet') return getWaterPlanetHeight(x, z);
    if (type === 'grass') return getGrassHeight(x, z);
    if (type === 'flat_desert') return getFlatDesertHeight(x, z);
    if (type === 'antarctica') return getAntarcticaHeight(x, z);
    return getDuneHeight(x, z);
};

// --- Inverse Kinematics ---

const _ik_dir = new Vector3();
const _ik_forward = new Vector3();
const _ik_right = new Vector3();
const _ik_up = new Vector3();
const _ik_jointDir = new Vector3();
const _ik_result = new Vector3();

export const solveIK = (
    origin: Vector3,
    target: Vector3,
    l1: number,
    l2: number,
    hintUp: Vector3,
    hintForward: Vector3
): Vector3 | null => {
    _ik_dir.subVectors(target, origin);
    const dist = _ik_dir.length();
    const maxReach = l1 + l2 - 0.01;
    const minReach = Math.abs(l1 - l2) + 0.01;
    const safeDist = MathUtils.clamp(dist, minReach, maxReach);
    const cosAngle1 = (l1 * l1 + safeDist * safeDist - l2 * l2) / (2 * l1 * safeDist);
    const angle1 = Math.acos(MathUtils.clamp(cosAngle1, -1, 1));
    _ik_forward.copy(_ik_dir).normalize();
    _ik_right.crossVectors(_ik_forward, hintUp).normalize();
    if (_ik_right.lengthSq() < 0.01) {
        _ik_right.crossVectors(_ik_forward, hintForward).normalize();
    }
    _ik_up.crossVectors(_ik_right, _ik_forward).normalize();
    _ik_jointDir.copy(_ik_forward).multiplyScalar(Math.cos(angle1))
        .add(_ik_up.multiplyScalar(Math.sin(angle1)));
    return _ik_result.copy(origin).add(_ik_jointDir.multiplyScalar(l1));
};

/**
 * 3-Bone IK Solver (Coxa, Femur, Tibia)
 * Returns joint positions for the end of Bone 1 (j1) and Bone 2 (j2).
 */
export const solveIK3Bone = (
    origin: Vector3,
    target: Vector3,
    l1: number, // Coxa Length
    l2: number, // Femur Length
    l3: number, // Tibia Length
    up: Vector3,     // Body Up Vector
    forward: Vector3 // Body Forward Vector
): { j1: Vector3, j2: Vector3 } | null => {

    // 1. Calculate Coxa Endpoint (j1)
    const toTarget = new Vector3().subVectors(target, origin);

    // Project onto plane perpendicular to Up (Local Horizontal)
    const vert = up.clone().multiplyScalar(toTarget.dot(up));
    const horiz = new Vector3().subVectors(toTarget, vert);

    if (horiz.lengthSq() < 0.0001) {
        horiz.copy(forward).sub(up.clone().multiplyScalar(forward.dot(up)));
    }
    horiz.normalize();

    // Joint 1 is fixed length L1 from origin along the horizontal projection
    const j1 = origin.clone().add(horiz.multiplyScalar(l1));

    // 2. Solve 2-Bone IK for Femur + Tibia (j1 -> j2 -> target)
    const start = j1;
    const end = target;
    const dist = start.distanceTo(end);

    // Clamping limits
    const maxDist = l2 + l3 - 0.001;
    const minDist = Math.abs(l2 - l3) + 0.001;
    const validDist = MathUtils.clamp(dist, minDist, maxDist);

    // Law of Cosines
    const cosAngle = (l2 * l2 + validDist * validDist - l3 * l3) / (2 * l2 * validDist);
    const angle = Math.acos(MathUtils.clamp(cosAngle, -1, 1));

    // Direction from j1 to target
    const dir = new Vector3().subVectors(end, start).normalize();

    let planeNormal = new Vector3().crossVectors(dir, up);

    if (planeNormal.lengthSq() < 0.001) {
        const radial = new Vector3().subVectors(j1, origin).normalize();
        planeNormal.crossVectors(dir, radial);
    }
    planeNormal.normalize();

    const femurDir = dir.clone().applyAxisAngle(planeNormal, angle);
    const j2 = start.clone().add(femurDir.multiplyScalar(l2));

    return { j1, j2 };
}