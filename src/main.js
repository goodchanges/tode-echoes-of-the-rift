import * as THREE from 'three';
import './style.css';
import Player from './components/Player.js';
import Enemy from './components/Enemy.js';
import Map from './components/Map.js';
import RiftWarden from './components/RiftWarden.js';
import createCamera from './components/Camera.js';
import createRenderer from './components/Renderer.js';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x062f3b, 130, 360);
const ambientLight = new THREE.AmbientLight(0xb8e8dc, 1.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(-100, -100, 200);
directionalLight.castShadow = true;
scene.add(directionalLight);
const magicLight = new THREE.PointLight(0x9b5cff, 80, 180, 2);
magicLight.position.set(30, 30, 45);
scene.add(magicLight);

const map = new Map();
scene.add(map);
const player = new Player();
player.position.set(-102, -68, 0);
scene.add(player);
const camera = createCamera();
player.add(camera);
const renderer = createRenderer();
renderer.shadowMap.enabled = true;
function resizeRenderer() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', resizeRenderer);

const ui = document.createElement('div');
ui.className = 'ui';
ui.innerHTML = `<section class="screen title-screen"><p class="eyebrow">A magical swamp adventure</p><h1>TODE</h1><h2>RIFT OF THE LOST SWAMP</h2><p>Collect ten spirit fireflies, survive the swamp, and find the portal home.</p><button class="primary start-button">Start Game</button><small>WASD / arrows move · Space jumps · J attacks · Q shifts realms</small></section><section class="screen pause-screen hidden"><h1>PAUSED</h1><p>The swamp waits in silence.</p><button class="primary resume-button">Resume</button></section><section class="screen end-screen hidden"><p class="eyebrow end-eyebrow"></p><h1 class="end-title"></h1><p class="end-copy"></p><button class="primary restart-button">Play Again</button></section><div class="hud hidden"><div class="hud-title">TODE <span class="realm-label">LIVING SWAMP</span></div><div class="hud-stats"><span class="health-label">♥ ♥ ♥</span><span class="score-label">Score 0</span><span class="collect-label">Fireflies 0 / 10</span></div><div class="objective">Find the portal at the far side of the swamp.</div></div><div class="toast"></div>`;
document.body.appendChild(ui);
const pulseHud = document.createElement('div');
pulseHud.className = 'pulse-meter';
pulseHud.innerHTML = '<span>RIFT PULSE</span><strong>READY · E</strong>';
ui.querySelector('.hud').appendChild(pulseHud);
const areaLabel = document.createElement('div');
areaLabel.className = 'area-label';
ui.querySelector('.hud').appendChild(areaLabel);
const bossHud = document.createElement('div');
bossHud.className = 'boss-hud hidden';
bossHud.innerHTML = '<div class="boss-name">RIFT WARDEN <span>PHASE I</span></div><div class="boss-track"><i></i></div>';
ui.appendChild(bossHud);
const titleScreen = ui.querySelector('.title-screen');
const pauseScreen = ui.querySelector('.pause-screen');
const endScreen = ui.querySelector('.end-screen');
const hud = ui.querySelector('.hud');
const toast = ui.querySelector('.toast');
const scoreLabel = ui.querySelector('.score-label');
const collectLabel = ui.querySelector('.collect-label');
const healthLabel = ui.querySelector('.health-label');
const realmLabel = ui.querySelector('.realm-label');
const endEyebrow = ui.querySelector('.end-eyebrow');
const endTitle = ui.querySelector('.end-title');
const endCopy = ui.querySelector('.end-copy');
const objectiveLabel = ui.querySelector('.objective');
titleScreen.querySelector('h2').textContent = 'ECHOES OF THE RIFT';
titleScreen.querySelector('p:not(.eyebrow)').textContent = 'Gather the rift fireflies, awaken ancient runes, and face the Warden beyond the sanctum.';
titleScreen.querySelector('small').textContent = 'WASD / arrows move · Space jump · J attack · Q realm · E Rift Pulse';
const controlsButton = document.createElement('button');
controlsButton.className = 'controls-link';
controlsButton.textContent = 'Controls';
controlsButton.addEventListener('click', () => showToast('WASD move · Space jump · Shift sprint · J attack · Q realm · E Rift Pulse'));
pauseScreen.appendChild(controlsButton);

const state = { mode: 'title', realm: 'living', score: 0, collected: 0, defeated: 0, health: 3, elapsed: 0, attackCooldown: 0, invulnerability: 0, spawnTimer: 0, pulseCooldown: 0, pulseTime: 0, bossStarted: false };
const keys = new Set();
const enemies = [];
const hazards = [];
let boss = null;
const fireflies = [];
const spawnPoints = [new THREE.Vector3(-88, 62, 0), new THREE.Vector3(70, -62, 0), new THREE.Vector3(92, 28, 0), new THREE.Vector3(-20, 66, 0)];
const collectiblePositions = [[-68, -48], [-24, -17], [21, -42], [62, -26], [92, -2], [-82, 28], [-42, 52], [4, 46], [48, 50], [96, 54]];

for (const [x, y] of collectiblePositions) {
  const firefly = new THREE.Group();
  firefly.position.set(x, y, 4);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(1.7, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffec83 }));
  const halo = new THREE.PointLight(0xffbd65, 8, 22, 2);
  firefly.add(orb, halo);
  fireflies.push(firefly);
  scene.add(firefly);
}
const attackEffect = new THREE.Mesh(new THREE.RingGeometry(10, 11.5, 40), new THREE.MeshBasicMaterial({ color: 0xffe36e, transparent: true, opacity: 0, side: THREE.DoubleSide }));
attackEffect.position.z = 0.3;
player.add(attackEffect);
const pulseEffect = new THREE.Mesh(new THREE.RingGeometry(1, 2.2, 64), new THREE.MeshBasicMaterial({ color: 0x8af7ed, transparent: true, opacity: 0, side: THREE.DoubleSide }));
pulseEffect.position.z = 0.45;
pulseEffect.visible = false;
player.add(pulseEffect);

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 1800);
}
function updateHud() {
  scoreLabel.textContent = `Score ${Math.floor(state.score)}`;
  collectLabel.textContent = `Fireflies ${state.collected} / 10`;
  healthLabel.textContent = `${'♥ '.repeat(state.health)}${'♡ '.repeat(3 - state.health)}`.trim();
  realmLabel.textContent = state.realm === 'living' ? 'LIVING SWAMP' : 'SPIRIT REALM';
  const pulseReady = state.pulseCooldown <= 0;
  pulseHud.querySelector('strong').textContent = pulseReady ? 'READY · E' : `${state.pulseCooldown.toFixed(1)}s`;
  pulseHud.classList.toggle('ready', pulseReady);
  areaLabel.textContent = getAreaName();
  objectiveLabel.textContent = boss ? 'Use Rift Pulse while the Warden is exposed.' : state.collected >= 10 ? 'Reach the portal in the Rift Sanctum.' : 'Collect fireflies and follow the rift lights.';
  if (boss) {
    bossHud.querySelector('i').style.width = `${(boss.health / boss.maxHealth) * 100}%`;
    bossHud.querySelector('.boss-name span').textContent = `PHASE ${boss.phase}`;
  }
}
function getAreaName() {
  if (player.position.x > 75 && player.position.y > 35) return 'RIFT SANCTUM';
  if (player.position.x > -10 || player.position.y > 15) return 'FORGOTTEN CANOPY';
  return 'MOSSLIGHT MARSH';
}
function setRealm(realm) {
  state.realm = realm;
  const spirit = realm === 'spirit';
  const color = spirit ? 0x160d3b : 0x062f3b;
  scene.fog.color.setHex(color);
  renderer.setClearColor(color, 1);
  ambientLight.color.setHex(spirit ? 0xb7a6ff : 0xb8e8dc);
  magicLight.color.setHex(spirit ? 0x65d5ff : 0x9b5cff);
  showToast(spirit ? 'The Spirit Realm awakens' : 'Back to the Living Swamp');
  updateHud();
}
function activatePulse() {
  if (state.mode !== 'playing' || state.pulseCooldown > 0) return;
  state.pulseCooldown = 6;
  state.pulseTime = 0.8;
  pulseEffect.visible = true;
  pulseEffect.scale.setScalar(1);
  map.reveal(5);
  for (const enemy of enemies) {
    if (enemy.position.distanceTo(player.position) < 35) enemy.stun = 2.5;
  }
  if (boss && boss.position.distanceTo(player.position) < 48) {
    boss.makeVulnerable(3.8);
    boss.takeDamage(14);
    showToast('The Rift Warden is exposed!');
  } else showToast('Rift Pulse reveals hidden paths');
}
function spawnBoss() {
  if (boss) return;
  boss = new RiftWarden(new THREE.Vector3(98, 62, 0));
  scene.add(boss);
  state.bossStarted = true;
  bossHud.classList.remove('hidden');
  showToast('The Rift Warden rises from the sanctum');
}
function addBossHazard(type) {
  const origin = boss.position.clone();
  if (type === 'shockwave') {
    const mesh = new THREE.Mesh(new THREE.RingGeometry(3, 5, 48), new THREE.MeshBasicMaterial({ color: 0xff6acb, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
    mesh.position.set(origin.x, origin.y, 0.6);
    hazards.push({ mesh, type, life: 2.2, age: 0 });
  } else if (type === 'bolts') {
    const direction = new THREE.Vector3(player.position.x - origin.x, player.position.y - origin.y, 0).normalize();
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(2.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0x74ecff }));
    mesh.position.set(origin.x, origin.y, 6);
    hazards.push({ mesh, type, life: 3.5, age: 0, direction });
  } else {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(46, 2.5, 1), new THREE.MeshBasicMaterial({ color: 0x9f63ff, transparent: true, opacity: 0.8 }));
    mesh.position.set(origin.x, origin.y, 1);
    hazards.push({ mesh, type, life: 2.5, age: 0 });
  }
  scene.add(hazards[hazards.length - 1].mesh);
  showToast(type === 'shockwave' ? 'Shockwave incoming — jump!' : type === 'bolts' ? 'Warden bolts incoming!' : 'Sweeping rift — move or shift realms!');
}
function updateBossHazards(delta) {
  for (const hazard of [...hazards]) {
    hazard.age += delta;
    hazard.life -= delta;
    if (hazard.type === 'shockwave') {
      hazard.mesh.scale.setScalar(1 + hazard.age * 5);
      if (hazard.age > 0.45 && hazard.age < 1.2 && player.position.z < 4 && player.position.distanceTo(hazard.mesh.position) < hazard.age * 42 && state.invulnerability <= 0) damagePlayer();
    } else if (hazard.type === 'bolts') {
      hazard.mesh.position.addScaledVector(hazard.direction, 32 * delta);
      if (hazard.mesh.position.distanceTo(player.position) < 7 && state.invulnerability <= 0) damagePlayer();
    } else {
      hazard.mesh.rotation.z += delta * 2.2;
      if (hazard.age > 0.5 && hazard.age < 2.1 && player.position.distanceTo(hazard.mesh.position) < 22 && state.invulnerability <= 0) damagePlayer();
    }
    if (hazard.life <= 0) { scene.remove(hazard.mesh); hazards.splice(hazards.indexOf(hazard), 1); }
  }
}
function damagePlayer() {
  state.health -= 1;
  state.invulnerability = 1.5;
  showToast('The Rift Warden strikes!');
  if (state.health <= 0) finish(false);
}
function spawnEnemy() {
  if (enemies.length >= 8) return;
  const point = spawnPoints[Math.floor(Math.random() * spawnPoints.length)].clone();
  const enemy = new Enemy(point, enemies.length % 2);
  enemies.push(enemy);
  scene.add(enemy);
}
function removeEnemy(enemy) {
  const index = enemies.indexOf(enemy);
  if (index === -1) return;
  enemies.splice(index, 1);
  scene.remove(enemy);
  state.defeated += 1;
  state.score += 10;
}
function blocked(position, movingEnemy = null) {
  if (map.isBlocked(position, movingEnemy ? movingEnemy.radius : player.radius)) return true;
  return movingEnemy && enemies.some((enemy) => enemy !== movingEnemy && enemy.position.distanceTo(position) < enemy.radius + movingEnemy.radius);
}
function attack() {
  if (state.mode !== 'playing' || state.attackCooldown > 0) return;
  const difficulty = 1 + Math.min(state.score / 200, 1.5);
  state.attackCooldown = Math.max(0.35, 0.7 / difficulty);
  attackEffect.material.opacity = 0.8;
  const attackRadius = 15 + Math.min(state.score / 80, 5);
  for (const enemy of [...enemies]) {
    if (Math.hypot(enemy.position.x - player.position.x, enemy.position.y - player.position.y) < attackRadius) removeEnemy(enemy);
  }
}
function startGame() {
  state.mode = 'playing';
  state.score = 0; state.collected = 0; state.defeated = 0; state.health = 3; state.elapsed = 0; state.spawnTimer = 0; state.pulseCooldown = 0; state.pulseTime = 0; state.bossStarted = false;
  player.position.set(-102, -68, 0); player.velocityZ = 0; player.visible = true;
  for (const enemy of [...enemies]) scene.remove(enemy);
  enemies.length = 0;
  if (boss) { scene.remove(boss); boss = null; }
  for (const hazard of hazards) scene.remove(hazard.mesh);
  hazards.length = 0;
  bossHud.classList.add('hidden');
  for (const firefly of fireflies) firefly.visible = true;
  map.revealTime = 0;
  for (const element of map.hiddenElements) element.visible = false;
  spawnEnemy(); spawnEnemy();
  titleScreen.classList.add('hidden'); pauseScreen.classList.add('hidden'); endScreen.classList.add('hidden'); hud.classList.remove('hidden');
  setRealm('living'); updateHud();
}
function finish(won) {
  state.mode = won ? 'won' : 'lost';
  player.visible = won;
  endEyebrow.textContent = won ? 'The rift is sealed' : 'The swamp claims another traveler';
  endTitle.textContent = won ? 'YOU ESCAPED' : 'GAME OVER';
  endCopy.textContent = `Score ${Math.floor(state.score)} · Fireflies ${state.collected} · Enemies defeated ${state.defeated}`;
  hud.classList.add('hidden'); endScreen.classList.remove('hidden');
  bossHud.classList.add('hidden');
}
function togglePause() {
  if (state.mode === 'playing') { state.mode = 'paused'; pauseScreen.classList.remove('hidden'); }
  else if (state.mode === 'paused') { state.mode = 'playing'; pauseScreen.classList.add('hidden'); }
}

window.addEventListener('keydown', (event) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
  if (event.key === 'Escape') { togglePause(); return; }
  if (event.key.toLowerCase() === 'r' && (state.mode === 'won' || state.mode === 'lost')) { startGame(); return; }
  if (event.key === ' ' && state.mode === 'lost') { startGame(); return; }
  if (event.key.toLowerCase() === 'j') attack();
  if (event.key.toLowerCase() === 'e') activatePulse();
  if (event.key.toLowerCase() === 'q' && state.mode === 'playing') setRealm(state.realm === 'living' ? 'spirit' : 'living');
  keys.add(event.key.toLowerCase());
});
window.addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
window.addEventListener('mousedown', attack);
ui.querySelector('.start-button').addEventListener('click', startGame);
ui.querySelector('.resume-button').addEventListener('click', togglePause);
ui.querySelector('.restart-button').addEventListener('click', startGame);

function updateGame(delta, time) {
  state.elapsed += delta;
  state.score += delta * 0.1;
  state.attackCooldown = Math.max(0, state.attackCooldown - delta);
  state.invulnerability = Math.max(0, state.invulnerability - delta);
  state.pulseCooldown = Math.max(0, state.pulseCooldown - delta);
  if (state.pulseTime > 0) {
    state.pulseTime -= delta;
    pulseEffect.scale.setScalar(1 + (0.8 - state.pulseTime) * 35);
    pulseEffect.material.opacity = Math.min(0.8, state.pulseTime * 1.5);
  } else pulseEffect.visible = false;
  attackEffect.material.opacity = Math.max(0, attackEffect.material.opacity - delta * 4);
  map.update(delta, time);
  const direction = new THREE.Vector3((keys.has('d') || keys.has('arrowright') ? 1 : 0) - (keys.has('a') || keys.has('arrowleft') ? 1 : 0), (keys.has('w') || keys.has('arrowup') ? 1 : 0) - (keys.has('s') || keys.has('arrowdown') ? 1 : 0), 0);
  if (direction.lengthSq()) {
    direction.normalize();
    const difficulty = 1 + Math.min(state.score / 300, 0.75);
    const next = player.position.clone().addScaledVector(direction, (keys.has('shift') ? 34 : 22) * difficulty * delta);
    if (!blocked(next)) { player.position.x = next.x; player.position.y = next.y; }
    player.setHeading(Math.atan2(direction.y, direction.x));
  }
  if ((keys.has(' ') || keys.has('space')) && player.isGrounded) { player.velocityZ = 18; player.isGrounded = false; }
  player.velocityZ -= 42 * delta; player.position.z += player.velocityZ * delta;
  if (player.position.z <= 0) { player.position.z = 0; player.velocityZ = 0; player.isGrounded = true; }
  for (const enemy of enemies) {
    if (enemy.stun > 0) { enemy.stun -= delta; continue; }
    enemy.speed = enemy.baseSpeed * (1 + Math.min(state.score / 160, 1.25));
    enemy.update(delta, player.position, blocked);
    if (state.invulnerability <= 0 && Math.hypot(enemy.position.x - player.position.x, enemy.position.y - player.position.y) < enemy.radius + player.radius) {
      state.health -= 1; state.invulnerability = 1.5; showToast('Tode was hit!');
      if (state.health <= 0) { finish(false); return; }
    }
  }
  player.visible = state.invulnerability <= 0 || Math.floor(state.invulnerability * 10) % 2 === 0;
  for (const firefly of fireflies) {
    if (!firefly.visible) continue;
    firefly.rotation.z += delta; firefly.position.z = 4 + Math.sin(time * 3 + firefly.position.x) * 0.8;
    if (Math.hypot(firefly.position.x - player.position.x, firefly.position.y - player.position.y) < 7) { firefly.visible = false; state.collected += 1; state.score += 25; showToast(`Firefly collected (${state.collected}/10)`); }
  }
  if (state.collected >= 10 && Math.hypot(map.portal.position.x - player.position.x, map.portal.position.y - player.position.y) < 14 && !boss) spawnBoss();
  if (boss) {
    boss.update(delta, player.position);
    const attackType = boss.consumeAttack();
    if (attackType) addBossHazard(attackType);
    updateBossHazards(delta);
    if (boss.health <= 0) { state.score += 100; finish(true); return; }
  }
  state.spawnTimer += delta;
  if (!boss && state.spawnTimer > Math.max(4, 11 - state.score / 80)) { state.spawnTimer = 0; spawnEnemy(); }
  updateHud();
}

const clock = new THREE.Clock();
function render() {
  const delta = Math.min(clock.getDelta(), 0.05);
  if (state.mode === 'playing') updateGame(delta, clock.elapsedTime);
  renderer.render(scene, camera);
  window.requestAnimationFrame(render);
}
render();
