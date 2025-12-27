export const SPIDER_CONFIG = {
  // Constants used in App.tsx for PhysicsConfig initialization
  SPEED: 4.5,
  TURN_SPEED: 2.9,
  BODY_HEIGHT: 1.5,
  STEP_HEIGHT: 1.0,
  STEP_DURATION: 0.29,
  GAIT_THRESHOLD: 1.5,
  GAIT_RECOVERY: 1.4,
  MAX_ACTIVE_STEPS: 3,

  // --- BACAK UZUNLUK AYARLARI (LEG LENGTHS) ---
  // Bu değerleri değiştirerek boğumların uzunluğunu ayarlayabilirsin.
  
  LEG_L1: 0.5, // Coxa (Kalça) - Gövdeye bağlı olan ilk kısa parça
  LEG_L2: 1.5, // Femur (Üst Bacak) - Yukarı uzanan orta parça
  LEG_L3: 1.5, // Tibia (Alt Bacak) - Yere basan en uzun sivri uç

  // -------------------------------------------
  
  BREATHING_RATE: 2.0,
  BREATHING_AMP: 0.05,
  MAX_STRIDE: 3.5,

  // Legacy/Base properties
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
    bodyAccent: '#ff3333', // Red eyes/details
    legUpper: '#2a2a2a',
    legLower: '#333333',
    joint: '#111111'
  }
};