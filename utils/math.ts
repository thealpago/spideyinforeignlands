import { Vector3 } from 'three';

// Simple pseudo-random noise function (replacement for simplex-noise dependency)
// Based on a simple hashing of coordinates
export function noise(x: number, z: number): number {
  const sin = Math.sin;
  const cos = Math.cos;
  return (sin(x * 0.5) + cos(z * 0.5) * 0.5 + sin(x * 0.2 + z * 0.1) * 0.25) * 2;
}

export function getTerrainHeight(x: number, z: number): number {
  // Combine frequencies for "terrain-like" look
  const base = noise(x * 0.1, z * 0.1) * 2;
  const detail = noise(x * 0.5, z * 0.5) * 0.5;
  return base + detail;
}

// Inverse Kinematics Solver for a 2-bone leg
// Returns joint angles: [shoulderAngle, kneeAngle]
export function solveIK(
  target: Vector3,
  origin: Vector3,
  upperLegLength: number,
  lowerLegLength: number
): { angle1: number; angle2: number } | null {
  const dist = origin.distanceTo(target);

  // Unreachable
  if (dist > upperLegLength + lowerLegLength) {
    return null; 
  }

  // Law of Cosines
  // c^2 = a^2 + b^2 - 2ab cos(C)
  const a = upperLegLength;
  const b = lowerLegLength;
  const c = dist;

  // Angle at the shoulder (between upper leg and vector to target)
  const acosArg1 = (a * a + c * c - b * b) / (2 * a * c);
  const angle1 = Math.acos(Math.max(-1, Math.min(1, acosArg1)));

  // Angle at the knee (between upper and lower leg)
  const acosArg2 = (a * a + b * b - c * c) / (2 * a * b);
  const angle2 = Math.acos(Math.max(-1, Math.min(1, acosArg2)));

  return { angle1, angle2: Math.PI - angle2 };
}

export function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}
