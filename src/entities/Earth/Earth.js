import * as THREE from 'three';

export class Earth {
    constructor({ loadingManager, options = {} }) {
        this.loadingManager = loadingManager;
        this.options = options;
        this.radius = 5;
        // Smooth rotation speed
        this.rotationSpeed = options.rotationSpeed || 0.3;
        this.group = null;
        this.textures = {};
        
        // Earth's axial tilt (23.44 degrees)
        this.axialTilt = 23.44 * (Math.PI / 180);
        
        // Track rotation state
        this.currentRotation = 0;
        this.lastUpdateTime = performance.now();
        
        // High-quality texture paths
        this.texturePaths = {
            diffuse: './assets/earth/earth-day.jpg',
            clouds: './assets/earth/earth-clouds-transparency.png'
        };

        // Performance optimization flags
        this.isTexturesLoaded = false;
        this.needsUpdate = true;
    }

    async initialize() {
        try {
            console.log('Earth: Starting initialization...');
            
            // Create Earth group
            this.group = new THREE.Group();
            this.group.position.set(0, 0, 0);
            
            // Apply axial tilt
            this.group.rotation.x = this.axialTilt;
            
            // Create optimized Earth geometry
            const geometry = new THREE.SphereGeometry(this.radius, 64, 64);
            geometry.computeVertexNormals();
            
            // Create high-quality Earth material
            const earthMaterial = new THREE.MeshPhongMaterial({
                color: 0x2233ff,
                shininess: 15,
                specular: 0x333333,
                emissive: 0x000000,
                flatShading: false
            });
            
            // Create Earth mesh with optimized settings
            this.earthMesh = new THREE.Mesh(geometry, earthMaterial);
            this.earthMesh.castShadow = false;
            this.earthMesh.receiveShadow = false;
            this.group.add(this.earthMesh);
            
            // Create optimized cloud layer
            const cloudGeometry = new THREE.SphereGeometry(this.radius + 0.1, 64, 64);
            cloudGeometry.computeVertexNormals();
            
            const cloudMaterial = new THREE.MeshPhongMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                flatShading: false
            });
            
            this.cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
            this.cloudMesh.castShadow = false;
            this.cloudMesh.receiveShadow = false;
            this.group.add(this.cloudMesh);
            
            // Set initial rotation
            this.currentRotation = 0;
            this.group.rotation.y = this.currentRotation;
            
            // Load textures in background
            this.loadTextures().then(() => {
                this.updateMaterials();
                this.isTexturesLoaded = true;
                this.needsUpdate = true;
            }).catch(error => {
                console.error('Error loading textures:', error);
            });
            
            console.log('Earth: Basic initialization complete');
            return this.group;
            
        } catch (error) {
            console.error('Earth: Initialization error:', error);
            throw error;
        }
    }

    async loadTextures() {
        try {
            const textureLoader = new THREE.TextureLoader(this.loadingManager);
            textureLoader.setPath('./');
            
            // Load textures with optimized settings
            const loadTexture = (path) => {
                return new Promise((resolve, reject) => {
                    textureLoader.load(
                        path,
                        (texture) => {
                            texture.colorSpace = THREE.SRGBColorSpace;
                            texture.minFilter = THREE.LinearFilter;
                            texture.magFilter = THREE.LinearFilter;
                            texture.anisotropy = 4;
                            resolve(texture);
                        },
                        undefined,
                        reject
                    );
                });
            };

            const [diffuseTexture, cloudsTexture] = await Promise.all([
                loadTexture(this.texturePaths.diffuse),
                loadTexture(this.texturePaths.clouds)
            ]);

            this.textures.diffuse = diffuseTexture;
            this.textures.clouds = cloudsTexture;
            
            console.log('Earth textures loaded');
        } catch (error) {
            console.error('Error loading textures:', error);
        }
    }

    updateMaterials() {
        if (!this.textures.diffuse) return;

        // Update Earth material with optimized settings
        if (this.earthMesh) {
            this.earthMesh.material = new THREE.MeshPhongMaterial({
                map: this.textures.diffuse,
                shininess: 15,
                specular: 0x333333,
                emissive: 0x000000,
                flatShading: false
            });
        }

        // Update cloud material with optimized settings
        if (this.cloudMesh && this.textures.clouds) {
            this.cloudMesh.material = new THREE.MeshPhongMaterial({
                map: this.textures.clouds,
                transparent: true,
                opacity: 0.4,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                flatShading: false
            });
        }

        this.needsUpdate = true;
    }

    update(delta) {
        if (!this.group || !this.needsUpdate) return;
        
        // Calculate smooth rotation using fixed delta time
        const rotationAmount = this.rotationSpeed * Math.min(delta, 0.1);
        
        // Update Earth rotation with smooth interpolation
        this.currentRotation += rotationAmount;
        this.group.rotation.y = this.currentRotation;
        
        // Update cloud rotation with smooth interpolation
        if (this.cloudMesh) {
            this.cloudMesh.rotation.y = this.currentRotation * 1.2;
        }
    }

    dispose() {
        // Dispose of textures
        Object.values(this.textures).forEach(texture => {
            if (texture && texture.dispose) {
                texture.dispose();
            }
        });

        // Dispose of geometries and materials
        [this.earthMesh, this.cloudMesh].forEach(mesh => {
            if (mesh) {
                if (mesh.geometry) mesh.geometry.dispose();
                if (mesh.material) {
                    if (Array.isArray(mesh.material)) {
                        mesh.material.forEach(material => material.dispose());
                    } else {
                        mesh.material.dispose();
                    }
                }
            }
        });

        // Clear the group
        if (this.group) {
            while (this.group.children.length > 0) {
                this.group.remove(this.group.children[0]);
            }
        }

        this.needsUpdate = false;
    }
} 