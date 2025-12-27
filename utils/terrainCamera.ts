import { Vector3, Euler } from 'three';

// Terrain-export varsayılan kamera ayarları
export const TERRAIN_CAMERA_CONFIG = {
  camera: {
    type: 'PerspectiveCamera',
    fov: 60,
    aspect: window.innerWidth / window.innerHeight,
    near: 0.1,
    far: 3000,
    position: { x: 15, y: 12, z: 15 }, // Yüksekten bakış açısı
    rotation: { x: -0.3, y: 0.785, z: 0 }, // Aşağı ve 45 derece dönük
    quaternion: { x: 0, y: 0, z: 0, w: 1 }
  },
  target: { x: 0, y: 0, z: 0 }, // Merkeze bak
  controls: {
    enabled: true,
    enableDamping: true,
    dampingFactor: 0.05,
    enableZoom: true,
    enableRotate: true,
    enablePan: true,
    minDistance: 5,
    maxDistance: 50,
    minPolarAngle: 0,
    maxPolarAngle: Math.PI / 2.2, // Yere paralelden biraz yukarı
    minAzimuthAngle: -Infinity,
    maxAzimuthAngle: Infinity
  },
  metadata: {
    name: 'Terrain Export Camera',
    description: 'Yüksekten terrain bakış açısı',
    version: '1.0'
  }
};

/**
 * Terrain kamera ayarlarını Three.js kamera objesine uygular
 * @param {THREE.Camera} camera - Güncellenecek kamera
 * @param {Object} controls - Güncellenecek kontrol objesi
 */
export const applyTerrainCamera = (camera, controls) => {
  const config = TERRAIN_CAMERA_CONFIG;
  
  // Kamera pozisyonu ve rotasyonu
  camera.position.set(
    config.camera.position.x,
    config.camera.position.y,
    config.camera.position.z
  );
  
  camera.rotation.set(
    config.camera.rotation.x,
    config.camera.rotation.y,
    config.camera.rotation.z
  );
  
  // PerspectiveCamera özellikleri
  if (camera.isPerspectiveCamera) {
    camera.fov = config.camera.fov;
    camera.aspect = config.camera.aspect;
    camera.near = config.camera.near;
    camera.far = config.camera.far;
    camera.updateProjectionMatrix();
  }
  
  // Hedef noktaya bak
  if (config.target) {
    const target = new Vector3(config.target.x, config.target.y, config.target.z);
    camera.lookAt(target);
  }
  
  // Kontrol ayarları
  if (controls && config.controls) {
    Object.assign(controls, config.controls);
  }
  
  return { camera, controls };
};
