import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Quaternion, Matrix4, Group, MathUtils, Mesh } from 'three';
import { getTerrainHeight, easeInOutCubic } from '../utils/helpers';
import { SPIDER_CONFIG } from '../config';
import { LegState, LegConfiguration, PhysicsConfig, TerrainType } from '../types';

// Optimization: Pre-allocate vector objects to avoid Garbage Collection spikes during the 60fps loop.
const _vec3_a = new Vector3();
const _vec3_b = new Vector3();
const _vec3_c = new Vector3();
const _vec3_normal = new Vector3();
const _quat_a = new Quaternion();
const _mat4_a = new Matrix4();

// New pooled vectors for loop calculations
const _vec3_home = new Vector3();
const _vec3_shoulder = new Vector3();
const _vec3_lead = new Vector3();
const _vec3_forward = new Vector3();

// --- POOLING FOR GAIT SCHEDULER ---
interface StepCandidate {
  index: number;
  dist: number;
  isCritical: boolean;
}
const MAX_LEGS = 8;
const _pooledCandidates: StepCandidate[] = new Array(MAX_LEGS).fill(null).map((_, i) => ({
  index: i,
  dist: 0,
  isCritical: false
}));

export const useSpiderController = (
  target: Vector3,
  mousePosRef: React.MutableRefObject<Vector3>,
  onMoveStateChange: (isMoving: boolean) => void,
  physicsConfig: PhysicsConfig,
  terrainType: TerrainType,
  onStep?: (pos: Vector3) => void,
  sharedPosRef?: React.MutableRefObject<Vector3>
) => {
  const groupRef = useRef<Group>(null);
  const headRef = useRef<Group>(null);
  const bodyMeshRef = useRef<Mesh>(null);

  const wasMovingRef = useRef(false);

  const sim = useRef({
    // Initialize position from shared ref if available, otherwise default
    position: sharedPosRef ? sharedPosRef.current.clone() : new Vector3(0, 10, 0),
    velocity: new Vector3(),
    quaternion: new Quaternion(),
    legs: [] as LegState[],
    legConfigs: [] as LegConfiguration[],
    time: 0,
    gazeTarget: new Vector3(),
    verticalVelocity: 0,
    isJumping: false,
    isChargingJump: false,
    chargeStartTime: 0,
    nextGazeTime: 0,
  });

  // -- Jump Mechanics (Charge & Release) --
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (!sim.current.isJumping && !sim.current.isChargingJump) {
          sim.current.isChargingJump = true;
          sim.current.chargeStartTime = sim.current.time;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (sim.current.isChargingJump) {
          const s = sim.current;
          const chargeDuration = s.time - s.chargeStartTime;
          // Cap charge at 1.0 second
          const chargeFactor = Math.min(chargeDuration, 1.0);

          // Jump Physics
          const minJump = 20;
          const maxJump = 50;

          s.verticalVelocity = minJump + (maxJump - minJump) * chargeFactor;
          s.isJumping = true;
          s.isChargingJump = false;

          // Forward Boost (Launch further if moving or generally forward)
          // If we are moving, boost that direction. If still, boost forward relative to body.
          const isMoving = s.velocity.length() > 0.1;
          const launchDir = isMoving ? s.velocity.clone().normalize() : _vec3_forward.set(0, 0, 1).applyQuaternion(s.quaternion);

          const speedBoost = 15 + (30 * chargeFactor);
          s.velocity.add(launchDir.multiplyScalar(speedBoost));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // -- Initialization --
  useMemo(() => {
    if (sim.current.legConfigs.length > 0) return;

    // Get current body start position to initialize legs relative to it
    const bodyStartPos = sim.current.position;

    const legCount = 8;
    for (let i = 0; i < legCount; i++) {
      const side = i < 4 ? 1 : -1; // Right vs Left
      const row = i % 4; // 0 (front) to 3 (back)

      const isFront = row === 0;

      const legScale = isFront ? 0.92 : 1.0;
      const currentL1 = SPIDER_CONFIG.LEG_L1 * legScale;
      const currentL2 = SPIDER_CONFIG.LEG_L2 * legScale;
      const currentL3 = SPIDER_CONFIG.LEG_L3 * legScale;

      const zOffset = [1.1, 0.5, -0.6, -1.7][row];
      const xOffset = [0.65, 1.2, 1.2, 0.8][row] * side;

      const origin = new Vector3(xOffset, 0, zOffset);

      const restScale = isFront ? 0.8 : 1.0;

      let rX = xOffset * 2.8 * restScale;
      let rZ = zOffset * 1.5 * restScale;

      if (isFront) {
        rZ += physicsConfig.frontLegReach;
        rX *= physicsConfig.frontLegSpread;
      }

      const rest = new Vector3(
        rX,
        -physicsConfig.bodyHeight,
        rZ
      );

      // Determine initial leg world position
      const startX = rest.x + bodyStartPos.x;
      const startZ = rest.z + bodyStartPos.z;

      // Calculate terrain height at this spot
      const terrainY = getTerrainHeight(startX, startZ, terrainType);

      sim.current.legConfigs.push({
        id: i,
        originOffset: origin,
        restOffset: rest,
        maxReach: currentL1 + currentL2 + currentL3,
        l1: currentL1,
        l2: currentL2,
        l3: currentL3
      });

      sim.current.legs.push({
        currentPos: new Vector3(startX, terrainY, startZ),
        targetPos: new Vector3(startX, terrainY, startZ),
        stepStartPos: new Vector3(startX, terrainY, startZ),
        homePos: new Vector3(),
        isStepping: false,
        stepProgress: 0,
        stepHeight: 0,
      });
    }
  }, []);

  // -- Real-time Config Updates --
  useEffect(() => {
    sim.current.legConfigs.forEach((config, i) => {
      const row = i % 4;
      const isFront = row === 0;
      const side = i < 4 ? 1 : -1;

      const xOffset = [0.65, 1.2, 1.2, 0.8][row] * side;
      const zOffset = [1.1, 0.5, -0.6, -1.7][row];

      config.originOffset.set(xOffset, 0, zOffset);

      const restScale = isFront ? 0.8 : 1.0;

      let rX = xOffset * 2.8 * restScale;
      let rZ = zOffset * 1.5 * restScale;

      if (isFront) {
        rZ += physicsConfig.frontLegReach;
        rX *= physicsConfig.frontLegSpread;
      }

      config.restOffset.set(rX, -physicsConfig.bodyHeight, rZ);
    });
  }, [physicsConfig.frontLegReach, physicsConfig.frontLegSpread, physicsConfig.bodyHeight]);


  // -- THE LOOP --
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const s = sim.current;
    s.time += delta;

    // UPDATE SHARED REF
    if (sharedPosRef) {
      sharedPosRef.current.copy(s.position);
    }

    // 1. KINEMATICS
    const currentPos = s.position;
    const flatTarget = _vec3_a.set(target.x, 0, target.z);
    const flatPos = _vec3_b.set(currentPos.x, 0, currentPos.z);
    const dirToTarget = _vec3_c.subVectors(flatTarget, flatPos);
    const distToTarget = dirToTarget.length();

    // Hysteresis
    const isMoving = wasMovingRef.current
      ? distToTarget > 0.1
      : distToTarget > 0.2;

    let speed = 0;

    if (isMoving !== wasMovingRef.current) {
      wasMovingRef.current = isMoving;
      onMoveStateChange(isMoving);
    }

    if (isMoving && !s.isChargingJump) { // Don't move normally while charging jump
      dirToTarget.normalize();
      speed = Math.min(physicsConfig.speed, distToTarget * 1.5);
      const targetVel = dirToTarget.multiplyScalar(speed);
      s.velocity.lerp(targetVel, delta * 3);
    } else {
      // Decelerate
      s.velocity.lerp(new Vector3(0, 0, 0), delta * (s.isChargingJump ? 8 : 5)); // Stop faster when charging
    }

    s.position.add(s.velocity.clone().multiplyScalar(delta));

    // 2. ORIENTATION & HEIGHT CONTROL
    let avgFootPos = _vec3_a.set(0, 0, 0);
    let groundedCount = 0;

    s.legs.forEach((l) => {
      const p = l.isStepping ? l.targetPos : l.currentPos;
      avgFootPos.add(p);
      groundedCount++;
    });
    avgFootPos.divideScalar(groundedCount || 1);

    const breath = Math.sin(s.time * SPIDER_CONFIG.BREATHING_RATE) * SPIDER_CONFIG.BREATHING_AMP;
    // Calculate ideal height
    let targetY = avgFootPos.y + physicsConfig.bodyHeight + breath;

    // Charge Crouch Logic
    if (s.isChargingJump) {
      const chargeTime = s.time - s.chargeStartTime;
      const chargeAmount = Math.min(chargeTime, 1.0);

      // Crouch down lower as we charge, but clamp to avoid burying
      // Ensure body stays at least 0.5 units above average foot height
      const crouchDepth = chargeAmount * 2.5;
      const minHeight = avgFootPos.y + 0.5;

      targetY = Math.max(targetY - crouchDepth, minHeight);

      // Add "Tension Shake"
      if (chargeAmount > 0.3) {
        const shake = Math.sin(s.time * 60) * chargeAmount * 0.03;
        s.position.x += shake;
        s.position.z += shake;
      }
    }

    // Jump / Height Logic
    if (s.isJumping) {
      // Gravity
      s.verticalVelocity -= 60.0 * delta;
      s.position.y += s.verticalVelocity * delta;

      // Landing (Only check if falling)
      if (s.position.y <= targetY && s.verticalVelocity <= 0) {
        s.position.y = targetY;
        s.isJumping = false;
        s.verticalVelocity = 0;
        // Dampen horizontal velocity on landing
        s.velocity.multiplyScalar(0.5);
      }
    } else {
      // Normal terrain following / Smooth crouch
      s.position.y = MathUtils.lerp(s.position.y, targetY, delta * 3);
    }

    // Orientation Logic
    const frontLeft = s.legs[0].currentPos;
    const backRight = s.legs[7].currentPos;
    const frontRight = s.legs[4].currentPos;
    const backLeft = s.legs[3].currentPos;

    _vec3_b.subVectors(frontRight, backLeft).normalize();
    _vec3_c.subVectors(frontLeft, backRight).normalize();
    _vec3_normal.crossVectors(_vec3_b, _vec3_c).normalize();

    if (_vec3_normal.y < 0) _vec3_normal.negate();

    const currentQuat = s.quaternion;
    const dummyUp = _vec3_a.set(0, 1, 0).applyQuaternion(currentQuat);
    // Smoothly align up vector to terrain normal
    const alignQuat = _quat_a.setFromUnitVectors(dummyUp, _vec3_normal);
    s.quaternion.premultiply(alignQuat);

    // Only turn if moving and NOT charging
    if (s.velocity.lengthSq() > 0.1 && !s.isChargingJump) {
      const velDir = s.velocity.clone().normalize();
      const dot = velDir.dot(_vec3_normal);
      const forward = velDir.sub(_vec3_normal.clone().multiplyScalar(dot)).normalize();
      const right = new Vector3().crossVectors(_vec3_normal, forward).normalize();
      const lookMat = _mat4_a.makeBasis(right, _vec3_normal, forward);

      const targetRot = new Quaternion().setFromRotationMatrix(lookMat);
      s.quaternion.slerp(targetRot, delta * physicsConfig.turnSpeed);
    }

    groupRef.current.position.copy(s.position);
    groupRef.current.quaternion.copy(s.quaternion);
    groupRef.current.updateMatrixWorld();

    // 4. GAIT SCHEDULER
    const bodyMatrix = groupRef.current.matrixWorld;
    const activeSteppers = s.legs.filter((l) => l.isStepping).length;

    for (let i = 0; i < 8; i++) {
      const leg = s.legs[i];
      _vec3_home.copy(s.legConfigs[i].restOffset).applyMatrix4(bodyMatrix);

      if (speed > 0.1) {
        _vec3_lead.copy(s.velocity).multiplyScalar(0.1);
        _vec3_home.add(_vec3_lead);
      }

      // Home Y is terrain height at Home X,Z
      _vec3_home.y = getTerrainHeight(_vec3_home.x, _vec3_home.z, terrainType);
      leg.homePos.copy(_vec3_home);

      const dist = leg.currentPos.distanceTo(_vec3_home);

      _vec3_shoulder.copy(s.legConfigs[i].originOffset).applyMatrix4(bodyMatrix);
      const distFromShoulder = leg.currentPos.distanceTo(_vec3_shoulder);
      const isCritical = distFromShoulder > s.legConfigs[i].maxReach * 0.9;

      _pooledCandidates[i].index = i;
      _pooledCandidates[i].dist = dist;
      _pooledCandidates[i].isCritical = isCritical;
    }

    _pooledCandidates.sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return b.dist - a.dist;
    });

    for (let i = 0; i < 8; i++) {
      const candidate = _pooledCandidates[i];
      const leg = s.legs[candidate.index];

      if (leg.isStepping) continue;

      const isFront = (candidate.index % 4) === 0;

      const baseThreshold = physicsConfig.gaitThreshold;
      const urgencyThreshold = isFront ? baseThreshold * physicsConfig.frontLegGaitThresholdMult : baseThreshold;

      const mustStep = candidate.isCritical || candidate.dist > urgencyThreshold;

      if (mustStep) {
        const neighbors = [
          (candidate.index + 1) % 8,
          (candidate.index + 7) % 8,
          (candidate.index + 4) % 8,
        ];

        const neighborsStepping = neighbors.some((nIdx) => s.legs[nIdx].isStepping);

        if ((!neighborsStepping && activeSteppers < physicsConfig.maxActiveSteps) || candidate.isCritical) {
          leg.isStepping = true;
          leg.stepProgress = 0;
          leg.stepStartPos.copy(leg.currentPos);

          const leadVec = _vec3_lead.copy(s.velocity).multiplyScalar(physicsConfig.stepDuration * physicsConfig.gaitRecovery);
          if (leadVec.length() > SPIDER_CONFIG.MAX_STRIDE) leadVec.setLength(SPIDER_CONFIG.MAX_STRIDE);

          leg.targetPos.copy(leg.homePos).add(leadVec);
          leg.targetPos.y = getTerrainHeight(leg.targetPos.x, leg.targetPos.z, terrainType);

          leg.stepHeight = physicsConfig.stepHeight * (0.9 + Math.random() * 0.2);
        }
      }
    }

    s.legs.forEach((leg, i) => {
      if (leg.isStepping) {
        const isFront = (i % 4) === 0;
        const duration = isFront ? physicsConfig.stepDuration * physicsConfig.frontLegStepDurationMult : physicsConfig.stepDuration;

        leg.stepProgress += delta / duration;

        if (leg.stepProgress >= 1.0) {
          leg.isStepping = false;
          leg.currentPos.copy(leg.targetPos);

          // Trigger dust via callback
          if (onStep) {
            onStep(leg.currentPos);
          }

        } else {
          const t = leg.stepProgress;
          const easedT = easeInOutCubic(t);
          leg.currentPos.lerpVectors(leg.stepStartPos, leg.targetPos, easedT);
          const verticalOffset = Math.sin(t * Math.PI) * leg.stepHeight;
          const baseY = MathUtils.lerp(leg.stepStartPos.y, leg.targetPos.y, easedT);
          leg.currentPos.y = baseY + verticalOffset;
        }
      }
    });

    // 5. HEAD TRACKING
    if (headRef.current) {
      const bodyForward = _vec3_forward.set(0, 0, 1).applyQuaternion(s.quaternion).normalize();

      if (isMoving) {
        const proximityThreshold = 8.0;
        if (distToTarget < proximityThreshold) {
          const lookAheadPoint = _vec3_lead.copy(s.position).add(bodyForward.multiplyScalar(20));
          const blendFactor = 1.0 - (distToTarget / proximityThreshold);
          const safeBlend = MathUtils.clamp(blendFactor, 0, 1);
          s.gazeTarget.lerpVectors(target, lookAheadPoint, easeInOutCubic(safeBlend));
        } else {
          s.gazeTarget.copy(target);
        }
      } else {
        if (s.time > s.nextGazeTime) {
          const noise = _vec3_a.set(
            (Math.random() - 0.5) * 6,
            0,
            (Math.random() - 0.5) * 6
          );
          s.gazeTarget.copy(mousePosRef.current).add(noise);
          s.nextGazeTime = s.time + 0.5 + Math.random() * 2.0;
        }
      }

      const lookTarget = _vec3_b.copy(s.gazeTarget);
      lookTarget.y = getTerrainHeight(lookTarget.x, lookTarget.z, terrainType) + 1.0;

      const currentQuat = headRef.current.quaternion.clone();
      headRef.current.lookAt(lookTarget);
      const targetQuat = headRef.current.quaternion.clone();
      headRef.current.quaternion.copy(currentQuat);

      const slerpSpeed = isMoving ? 5 : 2;
      headRef.current.quaternion.slerp(targetQuat, delta * slerpSpeed);
    }
  });

  return { groupRef, headRef, bodyMeshRef, legs: sim.current.legs, legConfigs: sim.current.legConfigs };
};