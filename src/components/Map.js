import * as THREE from 'three';
import House from './House.js';

const MAP_WIDTH = 240;
const MAP_DEPTH = 180;

function material(color, roughness = 0.9, emissive = 0x000000) {
  return new THREE.MeshStandardMaterial({ color, roughness, emissive, emissiveIntensity: emissive ? 0.55 : 0 });
}

export default class Map extends THREE.Group {
  constructor() {
    super();
    this.houses = [];
    this.decorations = [];
    this.hiddenElements = [];
    this.runes = [];
    this.buildGround();
    this.buildPlatforms();
    this.buildVegetation();
    this.buildHouses();
    this.buildRiftRoutes();
    this.buildPortal();
  }

  buildGround() {
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(MAP_WIDTH, MAP_DEPTH), material(0x174f3d, 0.98));
    ground.position.z = -0.08;
    this.add(ground);
    const mudPalette = [0x1c5a43, 0x27684a, 0x315f42, 0x24513d, 0x3d6744];
    for (let index = 0; index < 42; index += 1) {
      const patch = new THREE.Mesh(new THREE.CircleGeometry(4 + Math.random() * 7, 9), material(mudPalette[index % mudPalette.length], 1));
      patch.position.set((Math.random() - 0.5) * 220, (Math.random() - 0.5) * 155, 0.03);
      patch.scale.y = 0.55 + Math.random() * 0.45;
      this.add(patch);
    }
    for (const [x, y, scale] of [[-84, -50, 1.2], [-58, -36, .8], [-32, -24, 1.1], [-4, -8, .9], [27, 4, 1.2], [55, 22, .8], [77, 40, 1]]) {
      const stone = new THREE.Mesh(new THREE.DodecahedronGeometry(4.5, 0), material(0x496b63, 0.82));
      stone.position.set(x, y, 1.3);
      stone.scale.set(scale, scale * 0.75, scale * 0.45);
      stone.rotation.z = Math.random() * Math.PI;
      this.add(stone);
    }
    const water = new THREE.Mesh(new THREE.PlaneGeometry(205, 48), material(0x075b68, 0.25, 0x032c3c));
    water.rotation.z = Math.PI / 2;
    water.position.set(0, 47, 0.05);
    this.add(water);
  }

  buildPlatforms() {
    const platforms = [
      [-62, -25, 3, 18, 10], [8, -38, 6, 22, 14], [66, -3, 3, 20, 12],
      [-30, 33, 5, 18, 12], [43, 44, 8, 22, 14], [92, 30, 4, 18, 12],
    ];
    for (const [x, y, z, width, depth] of platforms) {
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, depth, 3), material(0x3b7d57));
      mesh.position.set(x, y, z - 1.5);
      this.add(mesh);
      this.decorations.push({ x, y, radius: Math.max(width, depth) / 2, z });
    }
  }

  buildVegetation() {
    const trunkMaterial = material(0x3d2949);
    const leafMaterial = material(0x3caa62, 0.8, 0x092a19);
    for (const [x, y, scale] of [[-105, -64, 0.8], [-94, 70, 0.72], [106, -54, 0.75], [106, 69, 0.7], [-16, -74, 0.62], [77, 73, 0.68]]) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.8, 16, 7), trunkMaterial);
      trunk.position.set(x, y, 8);
      trunk.scale.setScalar(scale);
      this.add(trunk);
      for (const [offsetX, offsetY, offsetZ, size] of [[-3, 0, 16, 7], [3, 1, 18, 8], [0, -2, 23, 6]]) {
        const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 1), leafMaterial);
        crown.position.set(x + offsetX * scale, y + offsetY * scale, offsetZ * scale);
        crown.scale.set(1, 0.85, 0.8);
        this.add(crown);
      }
      for (const side of [-1, 1]) {
        const root = new THREE.Mesh(new THREE.ConeGeometry(0.9, 7, 6), trunkMaterial);
        root.position.set(x + side * 3 * scale, y, 2);
        root.rotation.z = side * Math.PI / 3;
        this.add(root);
      }
    }
    for (const [x, y, color] of [[-72, 50, 0xe86ab0], [20, 63, 0x7ce4d1], [78, 12, 0xc88cff], [-44, -55, 0xff9a66]]) {
      const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(3.5, 0), material(color, 0.35, color));
      crystal.position.set(x, y, 4);
      this.add(crystal);
      this.decorations.push({ object: crystal, spin: 0.8 + Math.random() });
    }
    for (const [x, y, color] of [[-93, -38, 0xff799e], [-51, -12, 0xffbb7a], [13, 7, 0xff7bd4], [59, 35, 0xffaa76]]) {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.55, 3, 6), material(0x3c8056));
      stem.position.set(x, y, 1.5);
      this.add(stem);
      const cap = new THREE.Mesh(new THREE.SphereGeometry(2.1, 8, 5), material(color, 0.35, color));
      cap.scale.y = 0.55;
      cap.position.set(x, y, 3.5);
      this.add(cap);
    }
    for (const [x, y] of [[-73, -57], [-20, -51], [7, 30], [65, 7], [87, 45]]) {
      for (let blade = 0; blade < 4; blade += 1) {
        const grass = new THREE.Mesh(new THREE.ConeGeometry(0.18, 3.5, 4), material(0x5cae63));
        grass.position.set(x + (blade - 1.5) * 0.5, y + Math.sin(blade) * 0.5, 1.6);
        grass.rotation.y = (blade - 1.5) * 0.2;
        this.add(grass);
      }
    }
  }

  buildHouses() {
    for (const [x, y, rotation] of [[-82, 4, 0], [40, -69, Math.PI / 2], [83, 73, Math.PI]]) {
      const house = new House(new THREE.Vector3(x, y, 0), rotation);
      this.houses.push(house);
      this.add(house);
    }
  }

  buildRiftRoutes() {
    const hiddenMaterial = material(0x593c9b, 0.45, 0x5e2ca7);
    for (const [x, y, z] of [[-4, -2, 6], [22, 16, 7], [53, 25, 8], [76, 42, 9]]) {
      const platform = new THREE.Mesh(new THREE.CylinderGeometry(7, 8, 2, 8), hiddenMaterial);
      platform.position.set(x, y, z - 1);
      platform.visible = false;
      this.hiddenElements.push(platform);
      this.add(platform);
    }
    for (const [x, y] of [[-12, 13], [30, 29], [68, 49]]) {
      const rune = new THREE.Mesh(new THREE.RingGeometry(3, 3.7, 8), new THREE.MeshBasicMaterial({ color: 0xb46dff, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
      rune.position.set(x, y, 0.35);
      rune.rotation.x = 0;
      rune.visible = false;
      this.runes.push(rune);
      this.hiddenElements.push(rune);
      this.add(rune);
    }
    for (let index = 0; index < 35; index += 1) {
      const mote = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 4), new THREE.MeshBasicMaterial({ color: index % 2 ? 0x6fe6d3 : 0xb77cff }));
      mote.position.set((Math.random() - 0.5) * 220, (Math.random() - 0.5) * 155, 5 + Math.random() * 24);
      this.decorations.push({ object: mote, spin: 0.2 + Math.random() * 0.5, drift: 0.3 + Math.random() * 0.7 });
      this.add(mote);
    }
  }

  reveal(duration = 5) {
    for (const element of this.hiddenElements) element.visible = true;
    this.revealTime = Math.max(this.revealTime || 0, duration);
  }

  buildPortal() {
    this.portal = new THREE.Group();
    this.portal.position.set(98, 62, 8);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 1.6, 10, 32), material(0xb36cff, 0.25, 0x713cc4));
    ring.rotation.x = Math.PI / 2;
    this.portal.add(ring);
    const core = new THREE.Mesh(new THREE.CircleGeometry(7.5, 32), new THREE.MeshBasicMaterial({ color: 0x65e6ff, transparent: true, opacity: 0.55 }));
    core.rotation.x = Math.PI / 2;
    this.portal.add(core);
    this.add(this.portal);
  }

  update(delta, time) {
    for (const item of this.decorations) {
      if (item.object) {
        item.object.rotation.z += delta * item.spin;
        item.object.position.z += Math.sin(time * (item.drift || 0) + item.object.position.x) * delta * 0.25;
      }
    }
    if (this.revealTime > 0) {
      this.revealTime -= delta;
      if (this.revealTime <= 0) for (const element of this.hiddenElements) element.visible = false;
    }
    if (this.portal) this.portal.rotation.z = Math.sin(time) * 0.08;
  }

  isBlocked(position, radius = 4) {
    if (Math.abs(position.x) > MAP_WIDTH / 2 - radius || Math.abs(position.y) > MAP_DEPTH / 2 - radius) return true;
    return this.houses.some((house) => Math.hypot(position.x - house.position.x, position.y - house.position.y) < house.radius + radius);
  }
}

export { MAP_WIDTH, MAP_DEPTH };
