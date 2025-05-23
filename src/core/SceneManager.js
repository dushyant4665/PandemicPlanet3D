import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Starfield } from '../entities/Starfield/Starfield.js';
import { SunGlow } from '../entities/SunGlow/SunGlow.js';

export class SceneManager {
    constructor(container, loadingManager) {
        console.log('SceneManager constructor called with container:', container);
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('Container must be a valid HTML element');
        }
        
        if (!container.id) {
            console.warn('Container element has no ID, this may cause issues with event handling');
        }
        
        this.container = container;
        this.loadingManager = loadingManager || new THREE.LoadingManager();
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        this.components = new Map();
        this.eventHandlers = new Map();
        this.isInitialized = false;
        this.envMap = null;
        this.isContextLost = false;
        this.lastFrameTime = 0;
        this.isLoading = true;

        // Store container dimensions
        this.containerWidth = container.clientWidth;
        this.containerHeight = container.clientHeight;

        // Setup loading manager
        this.setupLoadingManager();
    }

    setupLoadingManager() {
        const loadingElement = document.getElementById('loading');
        const progressElement = document.getElementById('loading-progress-bar');
        const loadingText = document.getElementById('loading-text');

        if (!loadingElement || !progressElement || !loadingText) {
            console.warn('Loading elements not found, creating them');
            this.createLoadingElements();
        }

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            console.log(`Loading progress: ${progress.toFixed(2)}% - ${url}`);
            if (progressElement) {
                progressElement.style.width = `${progress}%`;
            }
            if (loadingText) {
                loadingText.textContent = `Loading: ${Math.round(progress)}%`;
            }
        };

        this.loadingManager.onLoad = () => {
            console.log('All resources loaded successfully');
            this.isLoading = false;
            // Force hide loading screen after a short delay
            setTimeout(() => {
                if (loadingElement) {
                    loadingElement.style.opacity = '0';
                    setTimeout(() => {
                        loadingElement.style.display = 'none';
                        // Ensure container is visible
                        if (this.container) {
                            this.container.style.visibility = 'visible';
                            this.container.style.opacity = '1';
                        }
                    }, 500);
                }
            }, 1000);
        };

        this.loadingManager.onError = (url) => {
            console.error('Error loading:', url);
            if (loadingText) {
                loadingText.textContent = 'Error loading resources. Please refresh.';
            }
            // Show error message
            const errorElement = document.getElementById('error-message');
            if (errorElement) {
                errorElement.textContent = `Failed to load resource: ${url}. Please refresh the page.`;
                errorElement.style.display = 'block';
            }
        };
    }

    createLoadingElements() {
        const loadingHTML = `
            <div id="loading-screen" style="
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: #000;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 1000;
                transition: opacity 0.5s;
            ">
                <div style="
                    width: 200px;
                    height: 4px;
                    background: #333;
                    border-radius: 2px;
                    overflow: hidden;
                    margin-bottom: 20px;
                ">
                    <div id="loading-progress" style="
                        width: 0%;
                        height: 100%;
                        background: #4CAF50;
                        transition: width 0.3s;
                    "></div>
                </div>
                <div id="loading-text" style="
                    color: #fff;
                    font-family: Arial, sans-serif;
                    font-size: 16px;
                ">Loading...</div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    async init() {
        if (this.isInitialized) return;

        try {
            console.log('SceneManager: Starting initialization...');
            
            // Create minimal scene
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x000000);
            this.scene.fog = null;
            this.scene.autoUpdate = false;

            // Optimize camera
            const aspect = this.containerWidth / this.containerHeight;
            this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
            // Position camera for a better view of Earth's rotation
            this.camera.position.set(0, 8, 20);
            this.camera.lookAt(0, 0, 0);
            this.camera.updateProjectionMatrix();

            // Create minimal renderer
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                alpha: false,
                powerPreference: 'high-performance',
                preserveDrawingBuffer: false,
                precision: 'highp',
                stencil: false,
                depth: true,
                logarithmicDepthBuffer: false
            });

            // Minimal renderer settings
            this.renderer.setSize(this.containerWidth, this.containerHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.outputColorSpace = THREE.SRGBColorSpace;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.0;
            this.renderer.shadowMap.enabled = false;
            this.renderer.physicallyCorrectLights = false;
            this.renderer.sortObjects = true;
            this.renderer.localClippingEnabled = false;
            this.renderer.autoClear = true;
            this.renderer.autoClearColor = true;
            this.renderer.autoClearDepth = true;
            this.renderer.autoClearStencil = false;
            this.renderer.info.autoReset = false;

            // Basic renderer setup
            this.renderer.domElement.style.display = 'block';
            this.renderer.domElement.style.width = '100%';
            this.renderer.domElement.style.height = '100%';
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0';
            this.renderer.domElement.style.left = '0';
            this.renderer.domElement.style.zIndex = '1';

            this.container.appendChild(this.renderer.domElement);

            // Simple black background
            this.scene.background = new THREE.Color(0x000000);

            // Basic lighting with better positioning
            const ambientLight = new THREE.AmbientLight(0x404040, 1.0);
            this.scene.add(ambientLight);

            // Position sun light to simulate real sunlight
            const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
            sunLight.position.set(50, 20, 50).normalize();
            this.scene.add(sunLight);

            // Setup smooth camera controls
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.rotateSpeed = 0.8;
            this.controls.minDistance = 15;
            this.controls.maxDistance = 30;
            this.controls.maxPolarAngle = Math.PI * 0.95;
            this.controls.minPolarAngle = Math.PI * 0.05;
            this.controls.zoomSpeed = 1.2;
            this.controls.enablePan = false;
            this.controls.autoRotate = false;
            this.controls.screenSpacePanning = true;
            this.controls.update();

            // Add resize handler
            window.addEventListener('resize', this.onResize.bind(this));

            // Start render loop
            this.animate();

            this.isInitialized = true;
            console.log('SceneManager: Initialization complete');

            // Force initial render
            this.renderer.render(this.scene, this.camera);
        } catch (error) {
            console.error('SceneManager: Initialization error:', error);
            throw error;
        }
    }

    createSpaceEnvironment() {
        console.log('Creating fallback space environment...');
        // Create a simple space environment
        const canvas = document.createElement('canvas');
        canvas.width = 2048;
        canvas.height = 1024;
        const context = canvas.getContext('2d');

        // Create gradient background
        const gradient = context.createRadialGradient(1024, 512, 0, 1024, 512, 1024);
        gradient.addColorStop(0, '#000000');
        gradient.addColorStop(0.5, '#000033');
        gradient.addColorStop(1, '#000066');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 2048, 1024);

        // Add stars
        for (let i = 0; i < 5000; i++) {
            const x = Math.random() * 2048;
            const y = Math.random() * 1024;
            const size = Math.random() * 1.5;
            const brightness = Math.random() * 0.5 + 0.5;
            context.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            context.beginPath();
            context.arc(x, y, size, 0, Math.PI * 2);
            context.fill();
        }

        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.mapping = THREE.EquirectangularReflectionMapping;
        this.scene.background = texture;
        this.scene.environment = texture;
        console.log('Fallback space environment created');
    }

    addStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        const starsVertices = [];
        for (let i = 0; i < 10000; i++) {
            const x = (Math.random() - 0.5) * 2000;
            const y = (Math.random() - 0.5) * 2000;
            const z = (Math.random() - 0.5) * 2000;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(stars);
    }

    setupEventListeners() {
        // Throttled resize handler with RAF
        let resizeRAF = null;
        const throttledResize = () => {
            if (resizeRAF) return;
            resizeRAF = requestAnimationFrame(() => {
                this.onResize();
                resizeRAF = null;
            });
        };
        window.addEventListener('resize', throttledResize, { passive: true });
        this.eventHandlers.set('resize', throttledResize);
    }

    handleContextLost(event) {
        event.preventDefault();
        console.log('WebGL context lost');
        this.isContextLost = true;
    }

    async handleContextRestored() {
        console.log('WebGL context restored');
        this.isContextLost = false;
        
        // Reinitialize components
        for (const [name, component] of this.components) {
            if (typeof component.initialize === 'function') {
                try {
                    await component.initialize();
                } catch (error) {
                    console.error(`Error reinitializing component ${name}:`, error);
                }
            }
        }
    }

    onResize() {
        if (!this.camera || !this.renderer) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Only update if size actually changed
        if (width !== this.containerWidth || height !== this.containerHeight) {
            this.containerWidth = width;
            this.containerHeight = height;
            
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
        }
    }

    async addComponent(name, component) {
        if (!this.isInitialized) {
            throw new Error('SceneManager must be initialized before adding components');
        }

        console.log(`Adding component: ${name}`);
        try {
            if (this.components.has(name)) {
                console.log(`Component ${name} already exists, removing old one`);
                await this.removeComponent(name);
            }
            
            if (typeof component.initialize === 'function') {
                console.log(`Initializing component: ${name}`);
                const result = await component.initialize();
                if (result instanceof THREE.Object3D) {
                    console.log(`Adding ${name} to scene at position:`, result.position);
                    this.scene.add(result);
                    // Log the component's world position after adding to scene
                    result.updateMatrixWorld(true);
                    console.log(`${name} world position:`, result.getWorldPosition(new THREE.Vector3()));
                } else {
                    console.warn(`Component ${name} did not return a valid THREE.Object3D`);
                }
            } else {
                console.warn(`Component ${name} has no initialize method`);
            }
            
            this.components.set(name, component);
            console.log(`Component ${name} added successfully`);
            return component;
        } catch (error) {
            console.error(`Error adding component ${name}:`, error);
            throw error;
        }
    }

    async removeComponent(name) {
        console.log(`Removing component: ${name}`);
        const component = this.components.get(name);
        if (component) {
            try {
                if (typeof component.dispose === 'function') {
                    await component.dispose();
                }
                this.components.delete(name);
                console.log(`Component ${name} removed successfully`);
            } catch (error) {
                console.error(`Error removing component ${name}:`, error);
                throw error;
            }
        }
    }

    update() {
        if (!this.isInitialized || this.isContextLost) return;

        // Use fixed timestep for consistent updates
        const delta = Math.min(this.clock.getDelta(), 0.1);

        // Update controls
        if (this.controls && delta > 0) {
            this.controls.update();
        }

        // Update components with fixed timestep
        for (const component of this.components.values()) {
            if (typeof component.update === 'function') {
                try {
                    component.update(delta);
                } catch (error) {
                    console.error('Error updating component:', error);
                }
            }
        }

        // Render scene
        if (this.renderer && this.scene && this.camera && !this.isContextLost) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    animate() {
        if (!this.isInitialized || this.isContextLost) return;

        requestAnimationFrame(this.animate.bind(this));

        // Use fixed timestep for consistent updates
        const delta = Math.min(this.clock.getDelta(), 0.1);

        // Update controls with damping
        if (this.controls) {
            this.controls.update();
        }

        // Update components
        for (const component of this.components.values()) {
            if (component.update && component.group && component.group.visible) {
                component.update(delta);
            }
        }

        // Always render for smooth animation
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    async dispose() {
        console.log('Disposing SceneManager');
        try {
            // Remove WebGL context event listeners
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.removeEventListener('webglcontextlost', this.handleContextLost);
                this.renderer.domElement.removeEventListener('webglcontextrestored', this.handleContextRestored);
            }

            for (const [name, component] of this.components) {
                await this.removeComponent(name);
            }
            
            for (const [name, handler] of this.eventHandlers) {
                window.removeEventListener(name, handler);
            }
            
            if (this.controls) {
                this.controls.dispose();
            }
            
            if (this.renderer) {
                this.renderer.dispose();
                this.container.removeChild(this.renderer.domElement);
            }
            
            this.components.clear();
            this.eventHandlers.clear();
            this.isInitialized = false;
            console.log('SceneManager disposed successfully');
        } catch (error) {
            console.error('Error disposing SceneManager:', error);
            throw error;
        }
    }
}