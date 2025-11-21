import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

let galaxyAudio = null;

function preloadGalaxyAudio() {
  const audioSources = [
     "music/song.mp3"
  ];

  const randomIndex = Math.floor(Math.random() * audioSources.length);
  const selectedSrc = audioSources[randomIndex];

  galaxyAudio = new Audio(selectedSrc);
  galaxyAudio.loop = true;
  galaxyAudio.volume = 1.0;

  // Preload không autoplay
  galaxyAudio.preload = "auto";
}

function playGalaxyAudio() {
  if (galaxyAudio) {
    galaxyAudio.play().catch(err => {
      console.warn("Audio play blocked or delayed:", err);
    });
  }
}
preloadGalaxyAudio();
// ---- VÒNG LẶP ANIMATE ----
let fadeOpacity = 0.1;
let fadeInProgress = false;
// ---- KHỞI TẠO SCENE, CAMERA, RENDERER ----
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.0015);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100000);
camera.position.set(0, 20, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('container').appendChild(renderer.domElement);

// ---- KHỞI TẠO CONTROLS ----
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.5;
controls.enabled = false;
controls.target.set(0, 0, 0);
controls.enablePan = false;
controls.minDistance = 15;
controls.maxDistance = 300;
controls.zoomSpeed = 0.3;
controls.rotateSpeed = 0.3;
controls.update();

// ---- HÀM TIỆN ÍCH TẠO HIỆU ỨNG GLOW ----
function createGlowMaterial(color, size = 128, opacity = 0.55) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    opacity: opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  return new THREE.Sprite(material);
}

// ---- TẠO CÁC THÀNH PHẦN CỦA SCENE ----

// Glow trung tâm
const centralGlow = createGlowMaterial('rgba(255,255,255,0.8)', 156, 0.25);
centralGlow.scale.set(8, 8, 1);
scene.add(centralGlow);
// Các đám mây tinh vân (Nebula) ngẫu nhiên
for (let i = 0; i < 15; i++) {
  const hue = Math.random() * 360;
  const color = `hsla(${hue}, 80%, 50%, 0.6)`;
  const nebula = createGlowMaterial(color, 256);
  nebula.scale.set(100, 100, 1);
  nebula.position.set(
    (Math.random() - 0.5) * 175,
    (Math.random() - 0.5) * 175,
    (Math.random() - 0.5) * 175
  );
  scene.add(nebula);
}

// ---- TẠO THIÊN HÀ (GALAXY) ----
const galaxyParameters = {
  count: 100000,
  arms: 6,
  radius: 100,
  spin: 0.5,
  randomness: 0.2,
  randomnessPower: 20,
  insideColor: new THREE.Color(0xd63ed6),
  outsideColor: new THREE.Color(0x48b8b8),
};

const defaultHeartImages = Array.from({ length: 38 }, (_, i) => `images/img${i + 1}.jpg`);

const heartImages = [
  ...(window.dataCCD?.data?.heartImages || []),
  ...defaultHeartImages,
];

const textureLoader = new THREE.TextureLoader();
const numGroups = heartImages.length;
// ---- TẠO CÁC NHÓM ĐIỂM HÌNH TRÁI TIM ----
for (let group = 0; group < numGroups; group++) {
  const groupPositions = new Float32Array(pointsPerGroup * 3);
  const groupColorsNear = new Float32Array(pointsPerGroup * 3);
  const groupColorsFar = new Float32Array(pointsPerGroup * 3);
  let validPointCount = 0;

  for (let i = 0; i < pointsPerGroup; i++) {
    const idx = validPointCount * 3;
    const globalIdx = group * pointsPerGroup + i;
    const radius = Math.pow(Math.random(), galaxyParameters.randomnessPower) * galaxyParameters.radius;
    if (radius < 30) continue;

    const branchAngle = (globalIdx % galaxyParameters.arms) / galaxyParameters.arms * Math.PI * 2;
    const spinAngle = radius * galaxyParameters.spin;

    const randomX = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
    const randomY = (Math.random() - 0.5) * galaxyParameters.randomness * radius * 0.5;
    const randomZ = (Math.random() - 0.5) * galaxyParameters.randomness * radius;
    const totalAngle = branchAngle + spinAngle;

    groupPositions[idx] = Math.cos(totalAngle) * radius + randomX;
    groupPositions[idx + 1] = randomY;
    groupPositions[idx + 2] = Math.sin(totalAngle) * radius + randomZ;

    const colorNear = new THREE.Color(0xffffff);
    groupColorsNear[idx] = colorNear.r;
    groupColorsNear[idx + 1] = colorNear.g;
    groupColorsNear[idx + 2] = colorNear.b;

    const colorFar = galaxyParameters.insideColor.clone();
    colorFar.lerp(galaxyParameters.outsideColor, radius / galaxyParameters.radius);
    colorFar.multiplyScalar(0.7 + 0.3 * Math.random());
    groupColorsFar[idx] = colorFar.r;
    groupColorsFar[idx + 1] = colorFar.g;
    groupColorsFar[idx + 2] = colorFar.b;

    validPointCount++;
  }

  if (validPointCount === 0) continue;
