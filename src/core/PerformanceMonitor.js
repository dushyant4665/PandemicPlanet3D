import * as THREE from 'three';

export class PerformanceMonitor {
  constructor(targetFPS = 60) {
    this.targetFPS = targetFPS;
    this.targetFrameTime = 1000 / targetFPS;

    // Performance metrics
    this.frameTimeHistory = [];
    this.currentFPS = targetFPS; // Start with target FPS
    this.averageFrameTime = this.targetFrameTime;
    this.frameCount = 0;
    this.lastUpdateTime = 0;
    this.minFramesForStats = 30; // Minimum frames before we start adjusting quality

    // Quality settings
    this.qualityLevels = ['high', 'medium', 'low'];
    this.currentQualityIndex = 0;
    this.qualityChangeThreshold = 0.8; // 80% of target FPS
    this.minFramesForQualityChange = 60;

    // References to other systems
    this.renderer = null;
    this.textureManager = null;

    // Performance monitoring
    this.isMonitoring = false;
    this.monitoringInterval = 1000; // Check performance every second
    this.isInitialized = false;
  }

  setRenderer(renderer) {
    this.renderer = renderer;
    // Only apply settings if both renderer and textureManager are available
    if (this.textureManager) {
      this.applyQualitySettings();
    }
  }

  setTextureManager(textureManager) {
    this.textureManager = textureManager;
    // Only apply settings if both renderer and textureManager are available
    if (this.renderer) {
      this.applyQualitySettings();
    }
  }

  resetMetrics() {
    this.frameTimeHistory = [];
    this.currentFPS = 0;
    this.averageFrameTime = 0;
    this.frameCount = 0;
    this.lastUpdateTime = performance.now();
  }

  update(frameDelta) {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    this.frameCount++;

    // Update frame time history
    this.frameTimeHistory.push(frameDelta);
    if (this.frameTimeHistory.length > 60) {
      this.frameTimeHistory.shift();
    }

    // Only calculate metrics if we have enough frames
    if (this.frameTimeHistory.length >= this.minFramesForStats) {
      // Calculate average frame time with smoothing
      const newAverage =
        this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
      this.averageFrameTime = this.averageFrameTime * 0.8 + newAverage * 0.2; // Smooth the average
      this.currentFPS = 1000 / this.averageFrameTime;
      this.isInitialized = true;
    }

    // Check performance periodically
    if (currentTime - this.lastUpdateTime >= this.monitoringInterval) {
      if (this.isInitialized) {
        this.checkPerformance();
      }
      this.lastUpdateTime = currentTime;
    }
  }

  checkPerformance() {
    if (this.frameCount < this.minFramesForQualityChange) return;

    const performanceRatio = this.currentFPS / this.targetFPS;

    if (performanceRatio < this.qualityChangeThreshold) {
      // Performance is below threshold, try to reduce quality
      this.reduceQuality();
    } else if (performanceRatio > 1.1 && this.currentQualityIndex > 0) {
      // Performance is good, try to increase quality
      this.increaseQuality();
    }

    this.frameCount = 0;
  }

  reduceQuality() {
    if (this.currentQualityIndex < this.qualityLevels.length - 1) {
      this.currentQualityIndex++;
      this.applyQualitySettings();
      console.log(`Quality level changed to: ${this.qualityLevels[this.currentQualityIndex]}`);
    }
  }

  increaseQuality() {
    if (this.currentQualityIndex > 0) {
      this.currentQualityIndex--;
      this.applyQualitySettings();
      console.log(`Quality level changed to: ${this.qualityLevels[this.currentQualityIndex]}`);
    }
  }

  applyQualitySettings() {
    if (!this.renderer || !this.textureManager) {
      console.warn('Cannot apply quality settings: renderer or textureManager not initialized');
      return;
    }

    const quality = this.qualityLevels[this.currentQualityIndex];
    const settings = this.textureManager.setQuality(quality);
    this.renderer.setPixelRatio(settings.pixelRatio);
  }

  shouldRenderFrame() {
    // Always render frames until we have enough data
    if (!this.isInitialized || this.frameTimeHistory.length < this.minFramesForStats) {
      return true;
    }

    // Use a more lenient threshold for frame skipping
    const threshold = this.targetFPS * 0.7; // Allow more frames through
    return this.currentFPS >= threshold;
  }

  startMonitoring() {
    this.isMonitoring = true;
    this.resetMetrics();
  }

  stopMonitoring() {
    this.isMonitoring = false;
  }

  getMetrics() {
    return {
      fps: this.currentFPS,
      frameTime: this.averageFrameTime,
      quality: this.qualityLevels[this.currentQualityIndex],
    };
  }

  dispose() {
    this.stopMonitoring();
    this.renderer = null;
    this.textureManager = null;
  }
}
