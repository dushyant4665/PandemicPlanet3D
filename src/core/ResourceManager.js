import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';

export class ResourceManager {
  constructor() {
    // Loaders
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();

    // Configure GLTF loader with Draco compression
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader.setDRACOLoader(dracoLoader);

    // Resource caches
    this.textures = new Map();
    this.models = new Map();
    this.cubeTextures = new Map();
    this.materials = new Map();

    // Loading state
    this.loadingManager = new THREE.LoadingManager();
    this.loadingQueue = new Map();
    this.totalResources = 0;
    this.loadedResources = 0;

    // Performance settings
    this.maxConcurrentLoads = 4;
    this.quality = 'high';
    this.enableCompression = true;

    // Quality settings
    this.qualitySettings = {
      high: {
        pixelRatio: 2,
        textureQuality: 1.0,
        anisotropy: 16,
      },
      medium: {
        pixelRatio: 1.5,
        textureQuality: 0.75,
        anisotropy: 8,
      },
      low: {
        pixelRatio: 1,
        textureQuality: 0.5,
        anisotropy: 4,
      },
    };

    // Initialize loading manager callbacks
    this.setupLoadingManager();
  }

  setupLoadingManager() {
    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      this.totalResources = itemsTotal;
      this.loadedResources = itemsLoaded;
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      this.loadedResources = itemsLoaded;
      const progress = (itemsLoaded / itemsTotal) * 100;
      this.onProgress?.(progress, url);
    };

    this.loadingManager.onLoad = () => {
      this.onLoad?.();
    };

    this.loadingManager.onError = url => {
      console.error('Error loading resource:', url);
      this.onError?.(url);
    };
  }

  setQuality(quality) {
    if (!this.qualitySettings[quality]) {
      console.warn(`Invalid quality setting: ${quality}. Using 'medium' instead.`);
      quality = 'medium';
    }

    this.quality = quality;
    const settings = this.qualitySettings[quality];

    // Update existing textures
    this.textures.forEach(texture => {
      if (texture.isTexture) {
        texture.anisotropy = settings.anisotropy;
        texture.needsUpdate = true;
      }
    });

    // Update materials
    this.materials.forEach(material => {
      if (material.map) {
        material.map.anisotropy = settings.anisotropy;
        material.map.needsUpdate = true;
      }
    });

    return settings;
  }

  async loadTextures(texturePaths, onProgress) {
    const totalTextures = Object.keys(texturePaths).length;
    let loadedTextures = 0;
    const textures = {};

    const updateProgress = () => {
      loadedTextures++;
      if (onProgress) {
        onProgress(loadedTextures / totalTextures);
      }
    };

    const loadPromises = Object.entries(texturePaths).map(async ([key, path]) => {
      try {
        if (Array.isArray(path)) {
          // Load cube texture
          const cubeTexture = await this.loadCubeTexture(path);
          textures[key] = cubeTexture;
        } else {
          // Load regular texture
          const texture = await this.loadTexture(path);
          textures[key] = texture;
        }
        updateProgress();
      } catch (error) {
        console.error(`Failed to load texture ${path}:`, error);
        throw error;
      }
    });

    await Promise.all(loadPromises);
    return textures;
  }

  async loadTexture(url, options = {}) {
    if (this.textures.has(url)) {
      return this.textures.get(url);
    }

    const texture = await new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        texture => {
          const settings = this.qualitySettings[this.quality];
          texture.minFilter = options.minFilter || THREE.LinearMipMapLinearFilter;
          texture.magFilter = options.magFilter || THREE.LinearFilter;
          texture.anisotropy = settings.anisotropy;
          texture.encoding = options.encoding || THREE.sRGBEncoding;

          if (options.flipY !== undefined) {
            texture.flipY = options.flipY;
          }

          this.textures.set(url, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });

    return texture;
  }

  async loadCubeTexture(urls, options = {}) {
    const key = urls.join('|');
    if (this.cubeTextures.has(key)) {
      return this.cubeTextures.get(key);
    }

    const texture = await new Promise((resolve, reject) => {
      this.cubeTextureLoader.load(
        urls,
        texture => {
          const settings = this.qualitySettings[this.quality];
          texture.encoding = options.encoding || THREE.sRGBEncoding;
          texture.anisotropy = settings.anisotropy;
          this.cubeTextures.set(key, texture);
          resolve(texture);
        },
        undefined,
        reject
      );
    });

    return texture;
  }

  async loadModel(url, options = {}) {
    if (this.models.has(url)) {
      return this.models.get(url);
    }

    const model = await new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        gltf => {
          this.models.set(url, gltf);
          resolve(gltf);
        },
        undefined,
        reject
      );
    });

    return model;
  }

  createMaterial(type, parameters) {
    const key = JSON.stringify({ type, parameters });
    if (this.materials.has(key)) {
      return this.materials.get(key);
    }

    const material = new THREE[type](parameters);
    this.materials.set(key, material);
    return material;
  }

  preloadResources(resources) {
    resources.forEach(resource => {
      if (!this.loadingQueue.has(resource.url)) {
        this.loadingQueue.set(resource.url, {
          type: resource.type,
          options: resource.options || {},
          priority: resource.priority || 0,
        });
      }
    });

    this.processLoadingQueue();
  }

  async processLoadingQueue() {
    const queue = Array.from(this.loadingQueue.entries()).sort(
      (a, b) => b[1].priority - a[1].priority
    );

    while (queue.length > 0) {
      const batch = queue.splice(0, this.maxConcurrentLoads);
      await Promise.all(
        batch.map(async ([url, { type, options }]) => {
          try {
            switch (type) {
              case 'texture':
                await this.loadTexture(url, options);
                break;
              case 'cubeTexture':
                await this.loadCubeTexture(url, options);
                break;
              case 'model':
                await this.loadModel(url, options);
                break;
            }
            this.loadingQueue.delete(url);
          } catch (error) {
            console.error(`Error loading ${type} from ${url}:`, error);
          }
        })
      );
    }
  }

  getProgress() {
    if (this.totalResources === 0) return 1;
    return this.loadedResources / this.totalResources;
  }

  clearCache() {
    // Dispose of all cached resources
    this.textures.forEach(texture => texture.dispose());
    this.cubeTextures.forEach(texture => texture.dispose());
    this.materials.forEach(material => material.dispose());

    // Clear caches
    this.textures.clear();
    this.models.clear();
    this.cubeTextures.clear();
    this.materials.clear();
    this.loadingQueue.clear();

    // Reset counters
    this.totalResources = 0;
    this.loadedResources = 0;
  }

  dispose() {
    this.clearCache();
    this.loadingManager = null;
    this.textureLoader = null;
    this.gltfLoader = null;
    this.cubeTextureLoader = null;
  }
}
