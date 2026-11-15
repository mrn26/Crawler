import * as THREE from "three";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x080b10);
scene.fog = new THREE.Fog(0x080b10, 12, 35);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x303040, 2));

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(5, 10, 5);
scene.add(light);

// Materials
const stone = new THREE.MeshStandardMaterial({ color: 0x555963 });
const floorMat = new THREE.MeshStandardMaterial({ color: 0x292d35 });
const playerMat = new THREE.MeshStandardMaterial({ color: 0x4b83c5 });

// Geometry helper
function box(x, y, z, sx, sy, sz, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz),
    material
  );
  mesh.position.set(x, y, z);
  scene.add(mesh);
  return mesh;
}

// Floor
box(0, -0.5, 0, 30, 1, 30, floorMat);

// Dungeon walls
const wallHeight = 5;
const wallThickness = 1;

box(0, wallHeight / 2, -15, 30, wallHeight, wallThickness, stone);
box(0, wallHeight / 2, 15, 30, wallHeight, wallThickness, stone);
box(-15, wallHeight / 2, 0, wallThickness, wallHeight, 30, stone);
box(15, wallHeight / 2, 0, wallThickness, wallHeight, 30, stone);

// Simple obstacles
box(-4, 1, -5, 3, 2, 3, stone);
box(5, 1, -2, 3, 2, 3, stone);
box(-5, 1, 6, 2, 2, 2, stone);

// Player bounding box
const player = new THREE.Mesh(
  new THREE.BoxGeometry(0.8, 1.8, 0.8),
  playerMat
);
player.position.set(0, 0.9, 5);
scene.add(player);

// Camera
let yaw = 0;
let pitch = -0.2;
const cameraDistance = 6;

function updateCamera() {
  const target = player.position.clone();
  target.y += 0.7;

  const offset = new THREE.Vector3(
    Math.sin(yaw) * Math.cos(pitch),
    -Math.sin(pitch),
    Math.cos(yaw) * Math.cos(pitch)
  ).multiplyScalar(cameraDistance);

  camera.position.copy(target).add(offset);
  camera.lookAt(target);
}

// Mobile joystick
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");

let moveX = 0;
let moveY = 0;
let joystickPointer = null;

joystick.addEventListener("pointerdown", e => {
  joystickPointer = e.pointerId;
  joystick.setPointerCapture(e.pointerId);
  updateJoystick(e);
});

joystick.addEventListener("pointermove", e => {
  if (e.pointerId === joystickPointer) updateJoystick(e);
});

function updateJoystick(e) {
  const rect = joystick.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  let dx = e.clientX - centerX;
  let dy = e.clientY - centerY;

  const max = 38;
  const length = Math.hypot(dx, dy);

  if (length > max) {
    dx = dx / length * max;
    dy = dy / length * max;
  }

  moveX = dx / max;
  moveY = dy / max;

  stick.style.transform = `translate(${dx}px, ${dy}px)`;
}

function releaseJoystick() {
  joystickPointer = null;
  moveX = 0;
  moveY = 0;
  stick.style.transform = "translate(0px, 0px)";
}

joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);

// Touch camera control
const lookArea = document.getElementById("lookArea");
let lookPointer = null;
let lastX = 0;
let lastY = 0;

lookArea.addEventListener("pointerdown", e => {
  lookPointer = e.pointerId;
  lastX = e.clientX;
  lastY = e.clientY;
  lookArea.setPointerCapture(e.pointerId);
});

lookArea.addEventListener("pointermove", e => {
  if (e.pointerId !== lookPointer) return;

  const dx = e.clientX - lastX;
  const dy = e.clientY - lastY;

  yaw -= dx * 0.006;
  pitch += dy * 0.004;
  pitch = THREE.MathUtils.clamp(pitch, -0.8, 0.6);

  lastX = e.clientX;
  lastY = e.clientY;
});

lookArea.addEventListener("pointerup", () => lookPointer = null);
lookArea.addEventListener("pointercancel", () => lookPointer = null);

// Movement
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const speed = 5;

  const forward = new THREE.Vector3(
    -Math.sin(yaw), 0, -Math.cos(yaw)
  );

  const right = new THREE.Vector3(
    Math.cos(yaw), 0, -Math.sin(yaw)
  );

  const movement = new THREE.Vector3()
    .addScaledVector(forward, -moveY)
    .addScaledVector(right, moveX);

  if (movement.lengthSq() > 0) {
    movement.normalize();
    player.position.addScaledVector(movement, speed * delta);
  }

  player.position.x = THREE.MathUtils.clamp(player.position.x, -13.5, 13.5);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -13.5, 13.5);

  updateCamera();
  renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
