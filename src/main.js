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

// Create scene with optimized settings
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);
scene.fog = new THREE.FogExp2(0x000000, 0.0003); // Reduced fog density for better performance

// Optimized camera setup
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
camera.position.z = 5;

// Production-ready renderer with optimized settings
const renderer = new THREE.WebGLRenderer({ 
    antialias: true,
    powerPreference: 'high-performance',
    alpha: true,
    precision: 'highp'
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

// Optimized starfield with better performance
const starGeometry = new THREE.BufferGeometry();
const starMaterial = new THREE.PointsMaterial({
    color: 0xFFFFFF,
    size: 0.12,
    transparent: true,
    opacity: 0.8,
    sizeAttenuation: true,
    vertexColors: true
});

// Pre-allocate arrays for better performance
const starVertices = new Float32Array(STAR_COUNT * 3);
const starColors = new Float32Array(STAR_COUNT * 3);

// Optimized star generation
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

// Optimized lighting setup
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

// Optimized Earth setup
const earthGeometry = new THREE.SphereGeometry(1, EARTH_SEGMENTS, EARTH_SEGMENTS);
const earthMaterial = new THREE.MeshPhongMaterial({
    shininess: 12,
    specular: 0x333333,
    bumpScale: 0.05,
    reflectivity: 0.8
});
const earth = new THREE.Mesh(earthGeometry, earthMaterial);
scene.add(earth);

// Optimized texture loading with progress tracking
const textureLoader = new THREE.TextureLoader();
textureLoader.crossOrigin = '';

const updateLoadingProgress = () => {
    texturesLoaded++;
    const progress = (texturesLoaded / TOTAL_TEXTURES) * 100;
    window.dispatchEvent(new CustomEvent('texture-load-progress', { detail: { progress } }));
    
    if (texturesLoaded === TOTAL_TEXTURES) {
        window.dispatchEvent(new Event('visualization-ready'));
    }
};

const loadEarthTextures = () => {
    const texturePromises = [
        // Day texture
        new Promise(resolve => textureLoader.load('/assets/earth/8k_earth_daymap1.jpg', 
            texture => {
                texture.encoding = THREE.sRGBEncoding;
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                earthMaterial.map = texture;
                earthMaterial.needsUpdate = true;
                updateLoadingProgress();
                resolve();
            }
        )),
        // Night texture
        new Promise(resolve => textureLoader.load('/assets/earth/8k_earth_nightmap1.jpg',
            texture => {
                texture.encoding = THREE.sRGBEncoding;
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                earthMaterial.emissiveMap = texture;
                earthMaterial.emissive = new THREE.Color(0xffffff);
                earthMaterial.emissiveIntensity = 0.25;
                earthMaterial.needsUpdate = true;
                updateLoadingProgress();
                resolve();
            }
        )),
        // Bump map
        new Promise(resolve => textureLoader.load('/assets/earth/earth-bump.jpg',
            texture => {
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                earthMaterial.bumpMap = texture;
                earthMaterial.bumpScale = 0.07;
                earthMaterial.needsUpdate = true;
                updateLoadingProgress();
                resolve();
            }
        )),
        // Specular map
        new Promise(resolve => textureLoader.load('/assets/earth/earth-specular.jpg',
            texture => {
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                earthMaterial.specularMap = texture;
                earthMaterial.specular = new THREE.Color(0x666666);
                earthMaterial.shininess = 20;
                earthMaterial.needsUpdate = true;
                updateLoadingProgress();
                resolve();
            }
        )),
        // Clouds
        new Promise(resolve => textureLoader.load('/assets/earth/earth-clouds.png',
            texture => {
                texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
                const cloudGeometry = new THREE.SphereGeometry(1.01, CLOUD_LAYER_SEGMENTS, CLOUD_LAYER_SEGMENTS);
                const cloudMaterial = new THREE.MeshPhongMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.3,
                    blending: THREE.AdditiveBlending,
                    shininess: 0
                });
                const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
                earth.add(clouds);
                
                // Smooth cloud animation using delta time
                const animateClouds = (delta) => {
                    clouds.rotation.y += CLOUD_ROTATION_SPEED * delta;
                };
                
                // Store animation function for use in main loop
                earth.userData.animateClouds = animateClouds;
                updateLoadingProgress();
                resolve();
            }
        ))
    ];

    // Handle any loading errors
    Promise.all(texturePromises).catch(error => {
        console.error('Error loading textures:', error);
        showError('Failed to load Earth textures. Please refresh the page.');
    });
};

// Optimized resize handler with debouncing
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

// Production-ready animation loop with delta time
let lastTime = 0;
function animate(currentTime) {
    requestAnimationFrame(animate);
    
    // Calculate delta time for smooth animations
    const delta = (currentTime - lastTime) / 1000;
    lastTime = currentTime;
    
    // Update controls with delta time
    controls.update(delta);
    
    // Smooth Earth rotation
    earth.rotation.y += EARTH_ROTATION_SPEED * delta;
    
    // Smooth cloud animation
    if (earth.userData.animateClouds) {
        earth.userData.animateClouds(delta);
    }
    
    // Subtle star movement
    stars.rotation.y += STAR_ROTATION_SPEED * delta;
    stars.rotation.x += STAR_ROTATION_SPEED * delta;
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize visualization with proper error handling
function initializeVisualization() {
    try {
        // Start loading textures
        loadEarthTextures();
        
        // Start animation loop with timestamp
        animate(performance.now());
        
        console.log('Visualization initialized successfully');
    } catch (error) {
        console.error('Failed to initialize visualization:', error);
        showError('Failed to initialize visualization. Please refresh the page.');
    }
}

// Error handling function
function showError(message) {
    window.dispatchEvent(new CustomEvent('visualization-error', { detail: { message } }));
}

// Start initialization
initializeVisualization(); 