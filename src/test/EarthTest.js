import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Earth } from '../entities/Earth/Earth.js';

export class EarthTest {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.controls = null;
        this.earth = null;
        this.clock = new THREE.Clock();

        this.init();
    }

    async init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;
        this.container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 0, 15);

        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 5;
        this.controls.maxDistance = 50;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Add directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffcc, 1);
        sunLight.position.set(10, 10, 10);
        this.scene.add(sunLight);

        // Create Earth
        this.earth = new Earth({
            radius: 5,
            segments: 64,
            rotationSpeed: 0.1,
            texturePath: '/assets/earth/'
        });

        // Initialize Earth
        const earthGroup = await this.earth.initialize();
        this.scene.add(earthGroup);

        // Add environment map for better PBR reflections
        const envMap = await this.loadEnvironmentMap();
        this.scene.environment = envMap;
        this.scene.background = new THREE.Color(0x000000);

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Start animation loop
        this.animate();
    }

    async loadEnvironmentMap() {
        const cubeTextureLoader = new THREE.CubeTextureLoader();
        const envMap = await new Promise((resolve, reject) => {
            cubeTextureLoader.load(
                [
                    '/assets/envmap/px.jpg',
                    '/assets/envmap/nx.jpg',
                    '/assets/envmap/py.jpg',
                    '/assets/envmap/ny.jpg',
                    '/assets/envmap/pz.jpg',
                    '/assets/envmap/nz.jpg'
                ],
                resolve,
                undefined,
                reject
            );
        });
        envMap.encoding = THREE.sRGBEncoding;
        return envMap;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));

        const delta = this.clock.getDelta();

        // Update controls
        this.controls.update();

        // Update Earth
        if (this.earth) {
            this.earth.update(delta);
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        if (this.earth) {
            this.earth.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        if (this.scene.environment) {
            this.scene.environment.dispose();
        }
        
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
        
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }
} 