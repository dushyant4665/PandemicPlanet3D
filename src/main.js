import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Performance optimization constants
const EARTH_SEGMENTS = 128;
const STAR_COUNT = 15000;
const CLOUD_LAYER_SEGMENTS = 128;
const SHADOW_MAP_SIZE = 2048;
const MAX_PIXEL_RATIO = 2;

// Smooth animation constants
const EARTH_ROTATION_SPEED = 0.001;
const CLOUD_ROTATION_SPEED = 0.0006;
const STAR_ROTATION_SPEED = 0.00003;
const CAMERA_DAMPING = 0.05;
const CONTROLS_ROTATION_SPEED = 0.4;
const CONTROLS_ZOOM_SPEED = 0.8;

// Loading state management
let texturesLoaded = 0;
const TOTAL_TEXTURES = 5; // day, night, bump, specular, clouds

// Progress tracking
function updateProgress(progress, text) {
  const event = new CustomEvent('loading-progress', {
    detail: { progress, text },
  });
  window.dispatchEvent(event);
}

// Error handling
function showError(message) {
  const event = new CustomEvent('visualization-error', {
    detail: { message },
  });
  window.dispatchEvent(event);
  console.error(message);
}

// Create scene with optimized settings
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.0003);

// Optimized camera setup
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 5;

// Production-ready renderer with optimized settings
const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
  alpha: true,
  precision: 'highp',
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
document.body.appendChild(renderer.domElement);

// Smooth orbit controls with optimized settings
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = CAMERA_DAMPING;
controls.screenSpacePanning = false;
controls.minDistance = 3;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI / 1.5;
controls.rotateSpeed = CONTROLS_ROTATION_SPEED;
controls.zoomSpeed = CONTROLS_ZOOM_SPEED;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.3;
controls.enableSmoothing = true;
controls.smoothTime = 0.3;

// Create starfield
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  size: 0.12,
  transparent: true,
  opacity: 0.8,
  sizeAttenuation: true,
  vertexColors: true,
});

const starVertices = new Float32Array(STAR_COUNT * 3);
const starColors = new Float32Array(STAR_COUNT * 3);

for (let i = 0; i < STAR_COUNT; i++) {
  const i3 = i * 3;
  starVertices[i3] = THREE.MathUtils.randFloatSpread(2000);
  starVertices[i3 + 1] = THREE.MathUtils.randFloatSpread(2000);
  starVertices[i3 + 2] = THREE.MathUtils.randFloatSpread(2000);

  const color = new THREE.Color();
  color.setHSL(Math.random() * 0.1 + 0.5, 0.8, Math.random() * 0.2 + 0.8);
  starColors[i3] = color.r;
  starColors[i3 + 1] = color.g;
  starColors[i3 + 2] = color.b;
}

starGeometry.setAttribute('position', new THREE.BufferAttribute(starVertices, 3));
starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Lighting setup
const ambientLight = new THREE.AmbientLight(0x404040, 0.25);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
sunLight.position.set(5, 3, 5);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = SHADOW_MAP_SIZE;
sunLight.shadow.mapSize.height = SHADOW_MAP_SIZE;
sunLight.shadow.camera.near = 0.5;
sunLight.shadow.camera.far = 50;
sunLight.shadow.bias = -0.0001;
scene.add(sunLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
rimLight.position.set(-5, -3, -5);
scene.add(rimLight);

// Create Earth
const earthGeometry = new THREE.SphereGeometry(1, EARTH_SEGMENTS, EARTH_SEGMENTS);
const earthMaterial = new THREE.MeshPhongMaterial({
  shininess: 12,
  specular: 0x333333,
  bumpScale: 0.05,
  reflectivity: 0.8,
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Helper function to get correct asset path
const getAssetPath = path => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  // Use relative path in both development and production
  return `./assets/${cleanPath}`;
};

// Texture loading function with retry
const loadTexture = (path, retries = 3) => {
  return new Promise((resolve, reject) => {
    const textureLoader = new THREE.TextureLoader();
    const fullPath = getAssetPath(path);
    console.log('Loading texture:', fullPath);

    const attemptLoad = (attempt = 1) => {
      textureLoader.load(
        fullPath,
        texture => {
          console.log('Successfully loaded texture:', fullPath);
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
          resolve(texture);
        },
        undefined,
        error => {
          console.error(
            `Error loading texture ${fullPath} (attempt ${attempt}/${retries}):`,
            error
          );
          if (attempt < retries) {
            console.log(`Retrying texture load: ${fullPath}`);
            setTimeout(() => attemptLoad(attempt + 1), 1000 * attempt);
          } else {
            reject(error);
          }
        }
      );
    };

    attemptLoad();
  });
};

// Load all Earth textures
async function loadEarthTextures() {
  try {
    updateProgress(0.2, 'Loading Earth textures...');

    const texturePaths = {
      day: 'earth/earth-day.jpg',
      night: 'earth/earth-night.jpg',
      bump: 'earth/earth-bump.jpg',
      specular: 'earth/earth-specular.jpg',
      normal: 'earth/earth-normal.jpg',
      roughness: 'earth/earth-roughness.jpg',
      clouds: 'earth/earth-clouds.png',
      cloudsAlpha: 'earth/earth-clouds-alpha.png',
    };

    // Log available textures for debugging
    console.log('Attempting to load textures:', texturePaths);

    const [
      earthDayTexture,
      earthNightTexture,
      earthBumpTexture,
      earthSpecularTexture,
      earthNormalTexture,
      earthRoughnessTexture,
      cloudTexture,
      cloudAlphaTexture,
    ] = await Promise.all([
      loadTexture(texturePaths.day),
      loadTexture(texturePaths.night),
      loadTexture(texturePaths.bump),
      loadTexture(texturePaths.specular),
      loadTexture(texturePaths.normal),
      loadTexture(texturePaths.roughness),
      loadTexture(texturePaths.clouds),
      loadTexture(texturePaths.cloudsAlpha),
    ]);

    // Apply textures to Earth material
    earthMaterial.map = earthDayTexture;
    earthMaterial.emissiveMap = earthNightTexture;
    earthMaterial.emissive = new THREE.Color(0xffffff);
    earthMaterial.emissiveIntensity = 0.25;
    earthMaterial.bumpMap = earthBumpTexture;
    earthMaterial.bumpScale = 0.07;
    earthMaterial.specularMap = earthSpecularTexture;
    earthMaterial.specular = new THREE.Color(0x666666);
    earthMaterial.normalMap = earthNormalTexture;
    earthMaterial.normalScale = new THREE.Vector2(0.5, 0.5);
    earthMaterial.roughnessMap = earthRoughnessTexture;
    earthMaterial.roughness = 0.7;
    earthMaterial.metalness = 0.1;
    earthMaterial.shininess = 20;
    earthMaterial.needsUpdate = true;

    // Create cloud layer with alpha
    const cloudGeometry = new THREE.SphereGeometry(
      1.01,
      CLOUD_LAYER_SEGMENTS,
      CLOUD_LAYER_SEGMENTS
    );
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      alphaMap: cloudAlphaTexture,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      shininess: 0,
    });
    const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    earth.add(clouds);

    // Store cloud animation function
    earth.userData.animateClouds = delta => {
      clouds.rotation.y += CLOUD_ROTATION_SPEED * delta;
    };

    updateProgress(1, 'Visualization ready!');
    window.dispatchEvent(new Event('visualization-ready'));
    } catch (error) {
    console.error('Failed to load Earth textures:', error);
    showError(
      'Failed to load Earth textures. Please check your internet connection and refresh the page.'
    );
  }
}

// Resize handler
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  }, 100);
});

// Animation loop
let lastTime = 0;
function animate(currentTime) {
  requestAnimationFrame(animate);

  const delta = (currentTime - lastTime) / 1000;
  lastTime = currentTime;

  controls.update(delta);
  earth.rotation.y += EARTH_ROTATION_SPEED * delta;

  if (earth.userData.animateClouds) {
    earth.userData.animateClouds(delta);
  }

  stars.rotation.y += STAR_ROTATION_SPEED * delta;
  stars.rotation.x += STAR_ROTATION_SPEED * delta;

  renderer.render(scene, camera);
}

// Initialize visualization
async function initializeVisualization() {
  try {
    updateProgress(0, 'Initializing visualization...');
    await loadEarthTextures();
    animate(performance.now());
    console.log('Visualization initialized successfully');
  } catch (error) {
    console.error('Failed to initialize visualization:', error);
    showError('Failed to initialize visualization. Please refresh the page.');
  }
}

// Start initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initializeVisualization();
});
