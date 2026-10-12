import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export default class House extends THREE.Group {
  constructor(position, rotation = 0) {
    super();
    this.position.copy(position);
    this.rotation.y = rotation;
    this.radius = 9;
    new GLTFLoader().load('/models/small_house.glb', (gltf) => {
      const model = gltf.scene;
      model.scale.setScalar(24);
      model.rotation.set(0, 0, 0);
      const bounds = new THREE.Box3().setFromObject(model);
      model.position.z = -bounds.min.z;
      this.add(model);
    });
  }
}
