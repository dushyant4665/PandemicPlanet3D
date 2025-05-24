import * as THREE from 'three';

export class MeteorShower {
    constructor(scene, earthRadius) {
        this.scene = scene;
        this.earthRadius = earthRadius;
        this.meteors = [];
        this.maxMeteors = 5;
        this.spawnInterval = 2000; // ms
        this.lastSpawnTime = 0;
        
        // Create meteor material
        this.createMeteorMaterial();
        
        // Start spawning meteors
        this.startSpawning();
    }

    createMeteorMaterial() {
        // Create custom shader material for meteors
        this.meteorMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                trailLength: { value: 0.5 },
                trailColor: { value: new THREE.Color(0xffffff) }
            },
            vertexShader: `
                attribute float alpha;
                varying float vAlpha;
                
                void main() {
                    vAlpha = alpha;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 trailColor;
                uniform float time;
                uniform float trailLength;
                varying float vAlpha;
                
                void main() {
                    // Create glowing trail effect
                    float glow = smoothstep(0.0, trailLength, vAlpha);
                    vec3 color = trailColor * glow;
                    
                    // Add subtle flickering
                    float flicker = sin(time * 10.0) * 0.1 + 0.9;
                    color *= flicker;
                    
                    gl_FragColor = vec4(color, glow * 0.8);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
    }

    createMeteor() {
        // Generate random spawn position (outside Earth)
        const spawnDistance = this.earthRadius * 2;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const x = spawnDistance * Math.sin(phi) * Math.cos(theta);
        const y = spawnDistance * Math.sin(phi) * Math.sin(theta);
        const z = spawnDistance * Math.cos(phi);
        
        // Generate random direction (towards Earth)
        const target = new THREE.Vector3(
            (Math.random() - 0.5) * this.earthRadius,
            (Math.random() - 0.5) * this.earthRadius,
            (Math.random() - 0.5) * this.earthRadius
        );
        
        const direction = target.sub(new THREE.Vector3(x, y, z)).normalize();
        const speed = 0.05 + Math.random() * 0.05;
        
        // Create meteor trail geometry
        const trailLength = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(trailLength * 3);
        const alphas = new Float32Array(trailLength);
        
        // Initialize trail
        for (let i = 0; i < trailLength; i++) {
            const t = i / (trailLength - 1);
            positions[i * 3] = x - direction.x * t * speed * trailLength;
            positions[i * 3 + 1] = y - direction.y * t * speed * trailLength;
            positions[i * 3 + 2] = z - direction.z * t * speed * trailLength;
            alphas[i] = 1 - t;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        
        // Create meteor mesh
        const meteor = new THREE.Points(geometry, this.meteorMaterial.clone());
        meteor.userData = {
            position: new THREE.Vector3(x, y, z),
            direction: direction,
            speed: speed,
            trailLength: trailLength,
            age: 0,
            maxAge: 100 + Math.random() * 50
        };
        
        this.scene.add(meteor);
        this.meteors.push(meteor);
    }

    startSpawning() {
        // Initial spawn
        for (let i = 0; i < this.maxMeteors; i++) {
            this.createMeteor();
        }
    }

    update(time) {
        // Spawn new meteors
        const currentTime = performance.now();
        if (currentTime - this.lastSpawnTime > this.spawnInterval && this.meteors.length < this.maxMeteors) {
            this.createMeteor();
            this.lastSpawnTime = currentTime;
        }
        
        // Update existing meteors
        for (let i = this.meteors.length - 1; i >= 0; i--) {
            const meteor = this.meteors[i];
            const data = meteor.userData;
            
            // Update position
            data.position.add(data.direction.clone().multiplyScalar(data.speed));
            data.age++;
            
            // Update trail
            const positions = meteor.geometry.attributes.position.array;
            const alphas = meteor.geometry.attributes.alpha.array;
            
            // Shift trail
            for (let j = data.trailLength - 1; j > 0; j--) {
                positions[j * 3] = positions[(j - 1) * 3];
                positions[j * 3 + 1] = positions[(j - 1) * 3 + 1];
                positions[j * 3 + 2] = positions[(j - 1) * 3 + 2];
                alphas[j] = alphas[j - 1];
            }
            
            // Update head position
            positions[0] = data.position.x;
            positions[1] = data.position.y;
            positions[2] = data.position.z;
            alphas[0] = 1;
            
            meteor.geometry.attributes.position.needsUpdate = true;
            meteor.geometry.attributes.alpha.needsUpdate = true;
            
            // Update material
            if (meteor.material.uniforms) {
                meteor.material.uniforms.time.value = time;
            }
            
            // Check for collision with Earth or max age
            const distanceToEarth = data.position.length();
            if (distanceToEarth < this.earthRadius || data.age > data.maxAge) {
                this.scene.remove(meteor);
                meteor.geometry.dispose();
                meteor.material.dispose();
                this.meteors.splice(i, 1);
            }
        }
    }

    dispose() {
        // Cleanup all meteors
        this.meteors.forEach(meteor => {
            this.scene.remove(meteor);
            meteor.geometry.dispose();
            meteor.material.dispose();
        });
        
        this.meteors = [];
        this.meteorMaterial.dispose();
    }
} 