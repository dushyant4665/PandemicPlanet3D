import * as THREE from 'three';

export class CameraController {
  constructor(camera, earth) {
    this.camera = camera;
    this.earth = earth;

    // Camera settings
    this.minDistance = earth.radius * 2;
    this.maxDistance = earth.radius * 8;
    this.currentDistance = earth.radius * 4;
    this.targetDistance = this.currentDistance;

    // Orbit settings
    this.rotationSpeed = 0.2;
    this.currentRotation = new THREE.Vector2(0, Math.PI / 4);
    this.targetRotation = this.currentRotation.clone();

    // Smoothing settings
    this.smoothFactor = 0.1;
    this.transitionSpeed = 0.05;

    // View presets
    this.presets = {
      overview: { distance: earth.radius * 6, rotation: new THREE.Vector2(0, Math.PI / 4) },
      closeup: { distance: earth.radius * 2.5, rotation: new THREE.Vector2(0, Math.PI / 3) },
      equator: { distance: earth.radius * 3, rotation: new THREE.Vector2(0, 0) },
      pole: { distance: earth.radius * 3, rotation: new THREE.Vector2(0, Math.PI / 2) },
    };

    // Performance optimization
    this.lastUpdateTime = 0;
    this.updateInterval = 1000 / 60; // Target 60 FPS
    this.isTransitioning = false;

    // Initialize camera position
    this.updateCameraPosition();
  }

  updateCameraPosition() {
    // Calculate camera position using spherical coordinates
    const phi = this.currentRotation.y;
    const theta = this.currentRotation.x;

    const x = this.currentDistance * Math.sin(phi) * Math.cos(theta);
    const y = this.currentDistance * Math.cos(phi);
    const z = this.currentDistance * Math.sin(phi) * Math.sin(theta);

    // Smoothly update camera position
    this.camera.position.lerp(new THREE.Vector3(x, y, z), this.smoothFactor);

    // Always look at Earth's center
    this.camera.lookAt(0, 0, 0);
  }

  update(time) {
    // Performance optimization: Skip updates if not enough time has passed
    const currentTime = performance.now();
    if (currentTime - this.lastUpdateTime < this.updateInterval) {
      return;
    }
    this.lastUpdateTime = currentTime;

    // Smooth distance transition
    if (Math.abs(this.currentDistance - this.targetDistance) > 0.01) {
      this.currentDistance = THREE.MathUtils.lerp(
        this.currentDistance,
        this.targetDistance,
        this.transitionSpeed
      );
      this.isTransitioning = true;
    } else {
      this.isTransitioning = false;
    }

    // Smooth rotation transition
    if (this.currentRotation.distanceTo(this.targetRotation) > 0.001) {
      this.currentRotation.lerp(this.targetRotation, this.transitionSpeed);
      this.isTransitioning = true;
    }

    // Update camera position
    this.updateCameraPosition();
  }

  setView(presetName) {
    const preset = this.presets[presetName];
    if (preset) {
      this.targetDistance = preset.distance;
      this.targetRotation.copy(preset.rotation);
      this.isTransitioning = true;
    }
  }

  rotate(deltaX, deltaY) {
    // Apply rotation with smooth damping
    this.targetRotation.x += deltaX * this.rotationSpeed;
    this.targetRotation.y = THREE.MathUtils.clamp(
      this.targetRotation.y + deltaY * this.rotationSpeed,
      0.1,
      Math.PI - 0.1
    );
  }

  zoom(delta) {
    // Apply zoom with smooth damping
    this.targetDistance = THREE.MathUtils.clamp(
      this.targetDistance * (1 - delta * 0.1),
      this.minDistance,
      this.maxDistance
    );
  }

  isInTransition() {
    return this.isTransitioning;
  }

  getCurrentView() {
    return {
      distance: this.currentDistance,
      rotation: this.currentRotation.clone(),
    };
  }
}
