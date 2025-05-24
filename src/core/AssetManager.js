import * as THREE from 'three';

export class AssetManager {
    constructor() {
        this.textureLoader = new THREE.TextureLoader();
        this.loadingManager = new THREE.LoadingManager();
        this.textureCache = new Map();
        this.totalAssets = 0;
        this.loadedAssets = 0;
        this.onProgressCallback = null;
        this.onCompleteCallback = null;

        // Configure loading manager
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            this.loadedAssets = itemsLoaded;
            this.totalAssets = itemsTotal;
            const progress = itemsLoaded / itemsTotal;
            
            if (this.onProgressCallback) {
                this.onProgressCallback(progress);
            }
        };

        this.loadingManager.onLoad = () => {
            if (this.onCompleteCallback) {
                this.onCompleteCallback();
            }
        };

        this.loadingManager.onError = (url) => {
            console.error('Error loading asset:', url);
        };

        // Set texture loader to use loading manager
        this.textureLoader.setPath('/assets/earth/');
        this.textureLoader.crossOrigin = 'anonymous';
    }

    setProgressCallback(callback) {
        this.onProgressCallback = callback;
    }

    setCompleteCallback(callback) {
        this.onCompleteCallback = callback;
    }

    async loadTexture(name, path, options = {}) {
        const cacheKey = `${name}_${path}`;
        
        // Return cached texture if available
        if (this.textureCache.has(cacheKey)) {
            return this.textureCache.get(cacheKey);
        }

        // Load new texture with options
        return new Promise((resolve, reject) => {
            this.textureLoader.load(
                path,
                (texture) => {
                    // Apply texture optimizations
                    texture.minFilter = options.minFilter || THREE.LinearFilter;
                    texture.magFilter = options.magFilter || THREE.LinearFilter;
                    texture.anisotropy = options.anisotropy || 16;
                    texture.encoding = THREE.sRGBEncoding;
                    
                    // Enable mipmaps if specified
                    if (options.generateMipmaps !== false) {
                        texture.generateMipmaps = true;
                    }

                    // Cache the texture
                    this.textureCache.set(cacheKey, texture);
                    resolve(texture);
                },
                undefined,
                (error) => reject(error)
            );
        });
    }

    async loadEarthTextures() {
        const texturePromises = [
            this.loadTexture('earth_day', 'earth-day.jpg', {
                anisotropy: 16,
                generateMipmaps: true
            }),
            this.loadTexture('earth_night', 'earth-night.jpg', {
                anisotropy: 16,
                generateMipmaps: true
            }),
            this.loadTexture('earth_bump', 'bump.jpg', {
                anisotropy: 8,
                generateMipmaps: true
            }),
            this.loadTexture('earth_specular', 'specular.jpg', {
                anisotropy: 8,
                generateMipmaps: true
            }),
            this.loadTexture('earth_normal', 'normal.jpg', {
                anisotropy: 8,
                generateMipmaps: true
            }),
            this.loadTexture('earth_roughness', 'roughness.jpg', {
                anisotropy: 8,
                generateMipmaps: true
            }),
            this.loadTexture('earth_clouds', 'earth-clouds-transparency.png', {
                anisotropy: 16,
                generateMipmaps: true
            }),
            this.loadTexture('earth_city_lights', 'earth_city_lights.png', {
                anisotropy: 16,
                generateMipmaps: true
            })
        ];

        try {
            const textures = await Promise.all(texturePromises);
            return {
                day: textures[0],
                night: textures[1],
                bump: textures[2],
                specular: textures[3],
                normal: textures[4],
                roughness: textures[5],
                clouds: textures[6],
                cityLights: textures[7]
            };
        } catch (error) {
            console.error('Error loading Earth textures:', error);
            throw error;
        }
    }

    dispose() {
        // Dispose all cached textures
        this.textureCache.forEach(texture => {
            texture.dispose();
        });
        this.textureCache.clear();
    }
} 