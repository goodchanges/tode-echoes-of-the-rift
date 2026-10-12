import * as THREE from 'three';

export default function createCamera() {
  const camera = new THREE.PerspectiveCamera(
    38,
    window.innerWidth / window.innerHeight,
    0.1,
    9000,
  );

  camera.position.set(78, -78, 58);
  camera.up.set(0, 0, 1);
  camera.lookAt(0, 0, 8);

  return camera;
}
