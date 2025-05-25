import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SceneManager {
  constructor() {
    // Performance monitoring
    this.fps = 0;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.targetFPS = 60;
    this.frameTime = 1000 / this.targetFPS;
    this.lastFrameTime = 0;

    // Scene setup
    this.scene = new THREE.Scene();
    this.setupRenderer();
    this.setupCamera();
    this.setupControls();
    this.setupLights();

    // Performance optimization flags
    this.isInitialized = false;
    this.needsUpdate = true;
    this.useHighPerformance = true;

    // Animation frame tracking
    this.animationFrameId = null;
    this.clock = new THREE.Clock();

    // Bind methods
    this.animate = this.animate.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);
  }

  setupRenderer() {
    // Create high-performance renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
      precision: 'highp',
      stencil: false,
      depth: true,
      logarithmicDepthBuffer: true,
    });

    // Optimize renderer settings
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Enable WebGL2 features if available
    if (this.renderer.capabilities.isWebGL2) {
      this.renderer.getContext().getExtension('EXT_color_buffer_float');
    }

    // Add to DOM
    document.getElementById('container').appendChild(this.renderer.domElement);
  }

  setupCamera() {
    // Create optimized camera
    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    // Set optimal camera position
    this.camera.position.set(0, 0, 20);
    this.camera.fov = 45;
    this.camera.updateProjectionMatrix();
  }

  setupControls() {
    // Create smooth controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 10;
    this.controls.maxDistance = 50;
    this.controls.enablePan = false;
    this.controls.autoRotate = false;
    this.controls.maxPolarAngle = Math.PI;
    this.controls.minPolarAngle = 0;
    this.controls.screenSpacePanning = false;
    this.controls.enableZoom = true;
    this.controls.zoomSpeed = 0.5;
  }

  setupLights() {
    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2);
    this.scene.add(ambientLight);

    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(50, 20, 50);
    sunLight.castShadow = true;

    // Optimize shadow settings
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -50;
    sunLight.shadow.camera.right = 50;
    sunLight.shadow.camera.top = 50;
    sunLight.shadow.camera.bottom = -50;

    this.scene.add(sunLight);
  }

  updatePerformance() {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;

    // Update FPS counter
    this.frameCount++;
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / deltaTime);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }

    // Frame timing
    const frameDelta = currentTime - this.lastFrameTime;
    if (frameDelta < this.frameTime) {
      return false; // Skip frame to maintain target FPS
    }
    this.lastFrameTime = currentTime;
    return true;
  }

  animate() {
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Performance check
    if (!this.updatePerformance()) return;

    // Update controls
    if (this.controls) {
      this.controls.update();
    }

    // Render scene
    if (this.needsUpdate || this.controls.enabled) {
      this.renderer.render(this.scene, this.camera);
      this.needsUpdate = false;
    }
  }

  onWindowResize() {
    // Debounced resize handler
    if (this.resizeTimeout) clearTimeout(this.resizeTimeout);

    this.resizeTimeout = setTimeout(() => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update camera
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      // Update renderer
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.needsUpdate = true;
    }, 100);
  }

  init() {
    // Add event listeners
    window.addEventListener('resize', this.onWindowResize, { passive: true });

    // Start animation loop
    this.animate();

    // Mark as initialized
    this.isInitialized = true;
  }

  dispose() {
    // Cleanup
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    window.removeEventListener('resize', this.onWindowResize);

    if (this.controls) {
      this.controls.dispose();
    }

    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.forceContextLoss();
      this.renderer.domElement.remove();
    }

    // Clear scene
    while (this.scene.children.length > 0) {
      const object = this.scene.children[0];
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
      this.scene.remove(object);
    }
  }
}
