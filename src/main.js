import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { Earth } from './entities/Earth/Earth.js';
import { SceneManager } from './core/SceneManager.js';
import { Starfield } from './entities/Starfield/Starfield.js';
import { SunGlow } from './entities/SunGlow/SunGlow.js';

let sceneManager = null;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// Add performance monitoring
let lastTime = performance.now();
let frames = 0;

function updateFPS() {
    const currentTime = performance.now();
    frames++;
    
    if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        console.log(`FPS: ${fps}`);
        frames = 0;
        lastTime = currentTime;
    }
    
    requestAnimationFrame(updateFPS);
}

async function init() {
    try {
        console.log('Starting application initialization...');
        const container = document.getElementById('container');
        if (!container) {
            throw new Error('Container element not found');
        }

        // Ensure container has proper dimensions and visibility
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.visibility = 'visible';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.zIndex = '1';
        console.log('Container dimensions:', container.clientWidth, 'x', container.clientHeight);

        // Create loading manager with better error handling
        const loadingManager = new THREE.LoadingManager();
        const progressBar = document.getElementById('loading-progress-bar');
        const loadingText = document.getElementById('loading-text');

        loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            console.log(`Loading progress: ${progress.toFixed(2)}% - ${url}`);
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            if (loadingText) {
                loadingText.textContent = `Loading: ${Math.round(progress)}%`;
            }
        };

        loadingManager.onError = (url) => {
            console.error('Error loading:', url);
            showError(`Failed to load resource: ${url}. Please refresh the page.`);
        };

        loadingManager.onLoad = () => {
            console.log('All resources loaded successfully');
            // Ensure loading screen is hidden after a short delay
            setTimeout(hideLoading, 1000);
        };

        // Initialize scene manager with the container element directly
        console.log('Creating SceneManager...');
        sceneManager = new SceneManager(container, loadingManager);
        
        console.log('Initializing SceneManager...');
        await sceneManager.init();

        // Add Earth component first to ensure it's visible
        console.log('Creating Earth component...');
        const earth = new Earth({
            loadingManager,
            options: {
                rotationSpeed: 0.15,
                enableAutoRotation: true,
                highPerformance: true
            }
        });
        
        console.log('Adding Earth to scene...');
        await sceneManager.addComponent('earth', earth);

        // Add starfield after Earth
        console.log('Adding starfield...');
        const starfield = new Starfield({
            starCount: 2000,
            starSize: 0.1,
            starColor: 0xffffff,
            starBrightness: 1.0
        });
        await sceneManager.addComponent('starfield', starfield);

        // Add sun glow last
        console.log('Adding sun glow...');
        const sunGlow = new SunGlow({
            color: 0xffffcc,
            intensity: 1.0,
            distance: 100,
            decay: 2.0
        });
        await sceneManager.addComponent('sunGlow', sunGlow);
        
        console.log('Initialization complete!');
        initializationAttempts = 0;

        // Force a resize event to ensure proper dimensions
        window.dispatchEvent(new Event('resize'));

        // Force hide loading screen after all components are added
        setTimeout(hideLoading, 1000);
        
    } catch (error) {
        console.error('Initialization error:', error);
        initializationAttempts++;
        
        if (initializationAttempts < MAX_INIT_ATTEMPTS) {
            console.log(`Retrying initialization (attempt ${initializationAttempts + 1}/${MAX_INIT_ATTEMPTS})...`);
            setTimeout(init, 1000);
        } else {
            showError('Failed to initialize Earth visualization. Please refresh the page or try again later.');
        }
    }
}

function showError(message) {
    const errorElement = document.getElementById('error-message');
    const loadingElement = document.getElementById('loading');
    const progressElement = document.getElementById('loading-progress');
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    if (progressElement) {
        progressElement.style.display = 'none';
    }
}

function hideLoading() {
    const loadingElement = document.getElementById('loading');
    const loadingText = document.getElementById('loading-text');
    const container = document.getElementById('container');
    
    if (loadingText) {
        loadingText.textContent = 'Loading complete!';
    }
    if (loadingElement) {
        loadingElement.style.opacity = '0';
        setTimeout(() => {
            loadingElement.style.display = 'none';
            // Ensure container is visible after loading screen is hidden
            if (container) {
                container.style.visibility = 'visible';
                container.style.opacity = '1';
                // Force a render
                if (sceneManager && sceneManager.renderer && sceneManager.scene && sceneManager.camera) {
                    sceneManager.renderer.render(sceneManager.scene, sceneManager.camera);
                }
            }
        }, 500);
    }
}

// Start initialization
init().catch(error => {
    console.error('Fatal error during initialization:', error);
    showError('Fatal error during initialization. Please refresh the page or try again later.');
});

// Cleanup on page unload
window.addEventListener('unload', () => {
    if (sceneManager) {
        sceneManager.dispose();
    }
}); 