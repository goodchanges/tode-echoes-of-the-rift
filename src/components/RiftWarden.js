import * as THREE from 'three';

export default class RiftWarden extends THREE.Group {
  constructor(position) {
    super();
    this.position.copy(position);
    this.health = 100;
    this.maxHealth = 100;
    this.phase = 1;
    this.attackCooldown = 2.5;
    this.attackIndex = 0;
    this.activeAttack = null;
    this.vulnerability = 0;
    this.hitFlash = 0;
    this.buildBody();
  }

  buildBody() {
    const coreMaterial = new THREE.MeshStandardMaterial({ color: 0x6f3bb3, emissive: 0x32115d, emissiveIntensity: 1.2, metalness: 0.35, roughness: 0.35 });
    const accentMaterial = new THREE.MeshStandardMaterial({ color: 0x72e7dc, emissive: 0x1b9695, emissiveIntensity: 1.4, metalness: 0.2, roughness: 0.25 });
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(13, 1), coreMaterial);
    core.position.z = 14;
    this.add(core);
    this.core = core;
    this.aura = new THREE.Mesh(new THREE.TorusGeometry(16, 1.2, 8, 32), accentMaterial);
    this.aura.position.z = 14;
    this.aura.rotation.x = Math.PI / 2;
    this.add(this.aura);
    for (let index = 0; index < 6; index += 1) {
      const spike = new THREE.Mesh(new THREE.ConeGeometry(2.3, 12, 5), accentMaterial);
      const angle = (index / 6) * Math.PI * 2;
      spike.position.set(Math.cos(angle) * 12, Math.sin(angle) * 12, 14);
      spike.rotation.z = Math.PI / 2;
      spike.rotation.y = angle;
      this.add(spike);
    }
    this.radius = 14;
  }

  update(delta, target) {
    this.aura.rotation.z += delta * 0.8;
    this.core.rotation.x += delta * 0.25;
    this.core.rotation.z -= delta * 0.35;
    this.vulnerability = Math.max(0, this.vulnerability - delta);
    this.hitFlash = Math.max(0, this.hitFlash - delta);
    this.scale.setScalar(this.hitFlash > 0 ? 1.14 : 1);
    this.lookAt(target.x, target.y, this.position.z + 14);
    this.attackCooldown -= delta;
    if (!this.activeAttack && this.attackCooldown <= 0) {
      const types = ['shockwave', 'bolts', 'sweep'];
      this.activeAttack = { type: types[this.attackIndex % types.length], age: 0, emitted: false };
      this.attackIndex += 1;
      this.attackCooldown = this.phase === 3 ? 2.3 : 3.3;
    }
    if (this.activeAttack) {
      this.activeAttack.age += delta;
      if (this.activeAttack.age > 2.5) this.activeAttack = null;
    }
    const nextPhase = this.health <= 33 ? 3 : this.health <= 66 ? 2 : 1;
    if (nextPhase !== this.phase) this.phase = nextPhase;
  }

  consumeAttack() {
    if (!this.activeAttack || this.activeAttack.emitted || this.activeAttack.age > 0.3) return null;
    this.activeAttack.emitted = true;
    return this.activeAttack.type;
  }

  takeDamage(amount) {
    if (this.vulnerability <= 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.hitFlash = 0.25;
    return true;
  }

  makeVulnerable(duration = 3.5) {
    this.vulnerability = Math.max(this.vulnerability, duration);
  }
}
