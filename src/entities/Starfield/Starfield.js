import * as THREE from 'three';

export class Starfield {
    constructor(options = {}) {
        this.options = {
            starCount: 2000,
            starSize: 0.1,
            starColor: 0xffffff,
            starBrightness: 1.0,
            ...options
        };

        this.group = null;
        this.material = null;
        this.geometry = null;
    }

    async initialize() {
        try {
            console.log('Initializing Starfield...');
            
            // Create group
            this.group = new THREE.Group();

            // Create star geometry
            this.geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(this.options.starCount * 3);
            const colors = new Float32Array(this.options.starCount * 3);
            const sizes = new Float32Array(this.options.starCount);

            // Generate random star positions in a sphere
            for (let i = 0; i < this.options.starCount; i++) {
                const i3 = i * 3;
                
                // Random position in a sphere
                const radius = 100 + Math.random() * 50; // Stars between 100 and 150 units away
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                
                positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
                positions[i3 + 2] = radius * Math.cos(phi);

                // Random star color with slight variation
                const color = new THREE.Color(this.options.starColor);
                const brightness = 0.8 + Math.random() * 0.4; // Random brightness variation
                colors[i3] = color.r * brightness;
                colors[i3 + 1] = color.g * brightness;
                colors[i3 + 2] = color.b * brightness;

                // Random star size
                sizes[i] = this.options.starSize * (0.5 + Math.random() * 1.5);
            }

            // Set attributes
            this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

            // Create material
            this.material = new THREE.PointsMaterial({
                size: this.options.starSize,
                vertexColors: true,
                transparent: true,
                opacity: this.options.starBrightness,
                sizeAttenuation: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });

            // Create points
            const stars = new THREE.Points(this.geometry, this.material);
            this.group.add(stars);

            console.log('Starfield initialized successfully');
            return this.group;
        } catch (error) {
            console.error('Error initializing Starfield:', error);
            throw error;
        }
    }

    update(delta) {
        // Optional: Add subtle star twinkling effect
        if (this.material) {
            const time = Date.now() * 0.001;
            this.material.opacity = this.options.starBrightness * (0.8 + Math.sin(time) * 0.2);
        }
    }

    dispose() {
        if (this.geometry) {
            this.geometry.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
        if (this.group) {
            this.group.clear();
            this.group = null;
        }
    }
} 