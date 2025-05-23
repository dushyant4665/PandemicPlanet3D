import * as THREE from 'three';

export class SunGlow {
    constructor(options = {}) {
        this.options = {
            color: 0xffffcc,
            intensity: 1.0,
            distance: 100,
            decay: 2.0,
            ...options
        };

        this.group = null;
        this.light = null;
        this.glowMesh = null;
    }

    async initialize() {
        try {
            console.log('Initializing SunGlow...');
            
            // Create group
            this.group = new THREE.Group();

            // Create point light
            this.light = new THREE.PointLight(
                this.options.color,
                this.options.intensity,
                this.options.distance,
                this.options.decay
            );
            this.light.position.set(50, 20, 50);
            this.group.add(this.light);

            // Create glow mesh
            const glowGeometry = new THREE.SphereGeometry(5, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: this.options.color,
                transparent: true,
                opacity: 0.3,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide
            });

            this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
            this.glowMesh.position.copy(this.light.position);
            this.group.add(this.glowMesh);

            // Create a simple flare sprite without texture
            const flareGeometry = new THREE.PlaneGeometry(20, 20);
            const flareMaterial = new THREE.MeshBasicMaterial({
                color: this.options.color,
                transparent: true,
                opacity: 0.5,
                blending: THREE.AdditiveBlending,
                side: THREE.DoubleSide
            });

            const flare = new THREE.Mesh(flareGeometry, flareMaterial);
            flare.position.copy(this.light.position);
            flare.lookAt(0, 0, 0); // Make flare face the camera
            this.group.add(flare);

            console.log('SunGlow initialized successfully');
            return this.group;
        } catch (error) {
            console.error('Error initializing SunGlow:', error);
            throw error;
        }
    }

    update(delta) {
        if (this.glowMesh) {
            // Subtle pulsing effect
            const time = Date.now() * 0.001;
            const scale = 1 + Math.sin(time) * 0.1;
            this.glowMesh.scale.set(scale, scale, scale);
            
            // Update glow opacity
            this.glowMesh.material.opacity = 0.3 + Math.sin(time * 0.5) * 0.1;
        }
    }

    dispose() {
        if (this.glowMesh) {
            this.glowMesh.geometry.dispose();
            this.glowMesh.material.dispose();
        }
        if (this.group) {
            this.group.clear();
            this.group = null;
        }
    }
}