import * as THREE from 'three';

export class Starfield {
    constructor(scene, starTexture) {
        this.scene = scene;
        this.starTexture = starTexture;
        this.createStarfield();
    }

    createStarfield() {
        // Create a large sphere for the starfield
        const geometry = new THREE.SphereGeometry(100, 64, 64);
        
        // Create material with star texture
        const material = new THREE.MeshBasicMaterial({
            map: this.starTexture,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.8
        });

        // Create and add starfield mesh
        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // Add some random stars for depth
        this.addRandomStars();
    }

    addRandomStars() {
        const starGeometry = new THREE.BufferGeometry();
        const starMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        // Create random star positions
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            // Random position within a sphere
            const radius = 50 + Math.random() * 50;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        // Create and add star points
        this.stars = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.stars);
    }

    update(time) {
        // Slowly rotate the starfield
        if (this.mesh) {
            this.mesh.rotation.y = time * 0.0001;
        }
        if (this.stars) {
            this.stars.rotation.y = time * 0.00005;
        }
    }

    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.material.dispose();
            this.scene.remove(this.mesh);
        }
        if (this.stars) {
            this.stars.geometry.dispose();
            this.stars.material.dispose();
            this.scene.remove(this.stars);
        }
    }
} 