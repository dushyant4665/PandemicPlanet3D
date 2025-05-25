import * as THREE from 'three';

export class LensFlare {
  constructor(scene, flareTexture) {
    this.scene = scene;
    this.flareTexture = flareTexture;
    this.sunPosition = new THREE.Vector3(50, 0, 0); // Store sun position
    this.createLensFlare();
  }

  createLensFlare() {
    // Create lens flare system
    const textureLoader = new THREE.TextureLoader();

    // Create flare material
    const flareMaterial = new THREE.SpriteMaterial({
      map: this.flareTexture,
      color: 0xffffff,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    // Create flare sprite
    this.flare = new THREE.Sprite(flareMaterial);
    this.flare.scale.set(2, 2, 1);
    this.flare.position.copy(this.sunPosition);
    this.scene.add(this.flare);

    // Create sun glow
    const glowMaterial = new THREE.SpriteMaterial({
      map: this.flareTexture,
      color: 0xffff00,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      opacity: 0.5,
    });

    this.glow = new THREE.Sprite(glowMaterial);
    this.glow.scale.set(3, 3, 1);
    this.glow.position.copy(this.sunPosition);
    this.scene.add(this.glow);
  }

  update(camera) {
    if (!this.flare || !this.glow || !camera) return;

    // Calculate direction from camera to sun
    const cameraToSun = new THREE.Vector3()
      .subVectors(this.sunPosition, camera.position)
      .normalize();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);

    // Calculate dot product for opacity
    const dot = cameraDirection.dot(cameraToSun);

    // Calculate distance for scaling
    const distance = camera.position.distanceTo(this.sunPosition);

    // Update flare and glow
    if (this.flare && this.glow) {
      // Make flare and glow face camera
      this.flare.position.copy(this.sunPosition);
      this.glow.position.copy(this.sunPosition);

      // Adjust opacity based on viewing angle
      const opacity = Math.max(0, Math.min(1, dot * 2));
      this.flare.material.opacity = opacity * 0.8;
      this.glow.material.opacity = opacity * 0.4;

      // Scale based on distance
      const scale = Math.max(0.5, Math.min(2, distance * 0.02));
      this.flare.scale.set(scale, scale, 1);
      this.glow.scale.set(scale * 1.5, scale * 1.5, 1);
    }
  }

  dispose() {
    if (this.flare) {
      this.flare.material.dispose();
      this.scene.remove(this.flare);
    }
    if (this.glow) {
      this.glow.material.dispose();
      this.scene.remove(this.glow);
    }
  }
}
