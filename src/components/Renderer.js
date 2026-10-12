import * as THREE from 'three';

export default function createRenderer() {
  const canvas = document.querySelector('canvas.game');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });

  renderer.setClearColor(0x062f3b, 1);
  renderer.setSize(window.innerWidth, window.innerHeight);

  return renderer;
}
