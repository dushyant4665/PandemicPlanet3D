import * as THREE from 'three';
import { Atmosphere } from './Atmosphere.js';
import { Aurora } from './Aurora.js';
import { LensFlare } from '../Space/LensFlare.js';
import { Lightning } from './Lightning.js';
import { MeteorShower } from '../Space/MeteorShower.js';

export class Earth {
  constructor(scene, textures, camera) {
    this.scene = scene;
    this.textures = textures;
    this.camera = camera;
    this.radius = 1;

    // Simple rotation settings
    this.rotationSpeed = 0.005;
    this.currentRotation = 0;

    // Create Earth group
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Create basic Earth mesh
    this.createEarthMesh();

    // Add basic lighting
    this.createLights();
  }

  createEarthMesh() {
    // Create basic Earth geometry
    const geometry = new THREE.SphereGeometry(this.radius, 64, 64);

    // Create simple Earth material with only essential textures
    const material = new THREE.MeshPhongMaterial({
      map: this.textures.earthDiffuse,
      bumpMap: this.textures.earthBump,
      bumpScale: 0.05,
      shininess: 5,
    });

    // Create Earth mesh
    this.earthMesh = new THREE.Mesh(geometry, material);
    this.group.add(this.earthMesh);

    // Create night lights layer
    const nightMaterial = new THREE.MeshBasicMaterial({
      map: this.textures.earthNight,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    this.nightMesh = new THREE.Mesh(geometry, nightMaterial);
    this.group.add(this.nightMesh);
  }

  createLights() {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Add directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(5, 3, 5);
    this.scene.add(sunLight);
  }

  update(time) {
    // Simple rotation
    this.currentRotation += this.rotationSpeed;
    this.group.rotation.y = this.currentRotation;
  }

  dispose() {
    // Cleanup Earth mesh
    if (this.earthMesh) {
      this.earthMesh.geometry.dispose();
      this.earthMesh.material.dispose();
    }

    // Cleanup night mesh
    if (this.nightMesh) {
      this.nightMesh.geometry.dispose();
      this.nightMesh.material.dispose();
    }

    // Remove group from scene
    this.scene.remove(this.group);
  }
}
