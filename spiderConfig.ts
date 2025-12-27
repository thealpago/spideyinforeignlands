export const SPIDER_CONFIG = {
  // Movement speed (World units/sec)
  SPEED: 2.8,
  // Rotation speed
  TURN_SPEED: 1.8,
  // Target height above terrain
  BODY_HEIGHT: 2.0,
  // Height of leg lift during step
  STEP_HEIGHT: 1.6,
  // Time to complete one step (seconds)
  STEP_DURATION: 0.28,
  // Distance deviation before triggering a step
  GAIT_THRESHOLD: 1.8,
  // Velocity prediction multiplier for step targeting
  GAIT_RECOVERY: 1.5,
  // Maximum allowed step distance
  MAX_STRIDE: 4.5,
  
  // 3-Segment Leg Configuration
  // L1 Coxa (Base) - Short
  LEG_L1: 1.2,            
  // L2 Femur (Upper) - Medium
  LEG_L2: 2.0,            
  // L3 Tibia (Lower) - Long
  LEG_L3: 1.3,            
  
  // Max legs allowed to lift simultaneously
  MAX_ACTIVE_STEPS: 3,
  // Idle animation frequency
  BREATHING_RATE: 2.0,
  // Idle animation amplitude
  BREATHING_AMP: 0.05,

  // Legacy/Base properties (Preserved for compatibility)
  legCount: 8,
  bodyHeight: 1.6,
  legReach: 2.8,
  stepThreshold: 1.8,
  stepHeight: 1.2,
  stepSpeed: 0.12,
  movementSpeed: 5.0,
  dimensions: {
    upperLeg: 1.8,
    lowerLeg: 2.2,
    bodyRadius: 0.7
  },
  colors: {
    bodyMain: '#1a1a1a',
    bodyAccent: '#ff3333', 
    legUpper: '#2a2a2a',
    legLower: '#333333',
    joint: '#111111'
  }
};