import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CloudSystem } from '../entities/CloudSystem/CloudSystem.js';

export class CloudTest {
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
        this.cloudSystem = null;
        this.clock = new THREE.Clock();

        this.init();
    }

    async init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);

        // Setup camera
        this.camera.position.set(0, 0, 15);

        // Setup controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0x404040);
        this.scene.add(ambientLight);

        // Add directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffcc, 1);
        sunLight.position.set(10, 10, 10);
        this.scene.add(sunLight);

        // Create cloud system
        this.cloudSystem = new CloudSystem(this.scene, {
            earthRadius: 5,
            cloudHeight: 0.1,
            cloudColor: new THREE.Color(0xffffff),
            cloudOpacity: 0.8,
            cloudSpeed: 0.1,
            cloudScale: 1.0,
            cloudDensity: 0.5,
            cloudCoverage: 0.5,
            sunColor: new THREE.Color(0xffffcc),
            sunIntensity: 1.0
        });

        // Initialize cloud system
        await this.cloudSystem.initialize();

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Start animation loop
        this.animate();
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

        // Update cloud system
        if (this.cloudSystem) {
            this.cloudSystem.update(delta);
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);
    }

    dispose() {
        if (this.cloudSystem) {
            this.cloudSystem.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
        
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
        
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }
} 