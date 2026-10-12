import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class Enemy extends THREE.Group {
  constructor(position, variant = 0) {
    super();
    this.position.copy(position);
    this.radius = variant ? 4.5 : 3.5;
    this.baseSpeed = variant ? 9 : 7;
    this.speed = this.baseSpeed;
    this.variant = variant;
    this.flashTime = 0;
    this.loadModel();
  }

  loadModel() {
    new GLTFLoader().load('/models/enemy.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(5 * (this.variant ? 1.25 : 1));
      model.rotation.x = Math.PI / 2;
      const bounds = new THREE.Box3().setFromObject(model);
      model.position.z = -bounds.min.z;
      this.add(model);
    }, undefined, () => {
      const material = new THREE.MeshStandardMaterial({
        color: this.variant ? 0xd83b8b : 0x9c45d6,
        emissive: this.variant ? 0x42132d : 0x241044,
        emissiveIntensity: 0.35,
      });
      const body = new THREE.Mesh(new THREE.IcosahedronGeometry(this.radius, 1), material);
      body.position.z = this.radius;
      this.add(body);
    });
  }

  update(delta, target, blocked) {
    const direction = new THREE.Vector3(target.x - this.position.x, target.y - this.position.y, 0);
    if (direction.lengthSq() < 0.001) return;
    direction.normalize();
    const next = this.position.clone().addScaledVector(direction, this.speed * delta);
    if (!blocked(next, this)) {
      this.position.x = next.x;
      this.position.y = next.y;
    }
    this.rotation.z = Math.atan2(direction.y, direction.x);
    this.flashTime = Math.max(0, this.flashTime - delta);
    this.scale.setScalar(this.flashTime > 0 ? 1.25 : 1);
  }
}
