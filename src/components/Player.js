import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class Player extends THREE.Group {
  constructor() {
    super();
    this.model = null;
    this.radius = 4;
    this.health = 3;
    this.velocityZ = 0;
    this.isGrounded = true;
    this.heading = 0;
    this.loadModel();
  }

  setHeading(angle) {
    this.heading = angle;
    if (this.model) this.model.rotation.z = angle + Math.PI / 2;
  }

  loadModel() {
    const loader = new GLTFLoader();

    loader.load('/models/tode.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(20);
      model.rotation.set(Math.PI / 2, 0, 0);
      model.userData.fixedOrientation = 'y-up-to-z-up';

      const bounds = new THREE.Box3().setFromObject(model);
      model.position.z = -bounds.min.z;

      const visual = new THREE.Group();
      visual.userData.forwardAxis = '+Z';
      visual.add(model);
      this.model = visual;
      this.add(visual);
      this.setHeading(this.heading);
    }, undefined, () => {
      const fallback = new THREE.Mesh(
        new THREE.SphereGeometry(3.5, 12, 8),
        new THREE.MeshStandardMaterial({ color: 0x54d66a, roughness: 0.8 }),
      );
      fallback.position.z = 3.5;
      const visual = new THREE.Group();
      visual.userData.forwardAxis = '+Z';
      visual.add(fallback);
      this.model = visual;
      this.add(visual);
      this.setHeading(this.heading);
    });
  }
}
