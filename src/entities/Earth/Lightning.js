import * as THREE from 'three';

export class Lightning {
  constructor(scene, earthRadius) {
    this.scene = scene;
    this.earthRadius = earthRadius;
    this.lightningMesh = null;
    this.isActive = false;
    this.lastStrikeTime = 0;
    this.strikeDuration = 0.5; // Duration of each lightning strike in seconds

    // Create lightning material with optimized shaders
    this.material = this.createLightningMaterial();
    this.createLightningMesh();
  }

  createLightningMaterial() {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        color: { value: new THREE.Color(0x93cfef) },
        intensity: { value: 1.0 },
        strikePosition: { value: new THREE.Vector2(0.5, 0.5) },
        strikeWidth: { value: 0.1 },
      },
      vertexShader: `
                uniform float intensity;
                uniform vec2 strikePosition;
                uniform float strikeWidth;
                varying vec2 vUv;
                varying float vIntensity;
                varying float vDistance;
                
                void main() {
                    vUv = uv;
                    vIntensity = intensity;
                    
                    // Calculate distance from strike position
                    vDistance = length(uv - strikePosition);
                    
                    // Apply position offset based on distance from strike
                    vec3 pos = position;
                    float offset = smoothstep(strikeWidth, 0.0, vDistance) * 0.1;
                    pos += normal * offset;
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
      fragmentShader: `
                uniform float time;
                uniform vec3 color;
                uniform float intensity;
                uniform vec2 strikePosition;
                uniform float strikeWidth;
                varying vec2 vUv;
                varying float vIntensity;
                varying float vDistance;
                
                // Optimized noise function
                float noise(vec2 p) {
                    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
                }
                
                // Improved lightning pattern
                float lightningPattern(vec2 uv, float t) {
                    float pattern = 0.0;
                    float scale = 1.0;
                    
                    // Create multiple layers of noise
                    for(int i = 0; i < 3; i++) {
                        pattern += noise(uv * scale + t * (0.5 + float(i) * 0.2)) / scale;
                        scale *= 2.0;
                    }
                    
                    return pattern;
                }
                
                void main() {
                    // Calculate base lightning pattern
                    float pattern = lightningPattern(vUv, time * 0.5);
                    
                    // Create strike effect
                    float strike = smoothstep(strikeWidth, 0.0, vDistance);
                    float flicker = sin(time * 60.0) * 0.5 + 0.5;
                    
                    // Combine effects
                    float finalIntensity = pattern * strike * flicker * intensity * vIntensity;
                    
                    // Add glow effect
                    float glow = smoothstep(0.0, 0.1, finalIntensity);
                    glow = pow(glow, 0.5); // Sharper falloff
                    
                    // Calculate final color with HDR-like effect
                    vec3 finalColor = color * glow * (1.0 + glow * 0.5);
                    float alpha = glow * 0.8;
                    
                    // Apply distance-based fade
                    alpha *= smoothstep(1.0, 0.0, vDistance);
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  createLightningMesh() {
    // Create a plane geometry for the lightning effect
    const geometry = new THREE.PlaneGeometry(2, 2, 32, 32);
    this.lightningMesh = new THREE.Mesh(geometry, this.material);
    this.lightningMesh.visible = false;
    this.scene.add(this.lightningMesh);
  }

  update(time) {
    if (!this.lightningMesh || !this.isActive) return;

    const currentTime = time * 0.001; // Convert to seconds
    const elapsed = currentTime - this.lastStrikeTime;

    if (elapsed < this.strikeDuration) {
      // Update lightning effect
      this.lightningMesh.visible = true;
      this.material.uniforms.time.value = currentTime;

      // Fade out intensity
      const fadeOut = 1.0 - elapsed / this.strikeDuration;
      this.material.uniforms.intensity.value = fadeOut;

      // Update strike position with slight movement
      const pos = this.material.uniforms.strikePosition.value;
      pos.x += Math.sin(currentTime * 10.0) * 0.001;
      pos.y += Math.cos(currentTime * 8.0) * 0.001;
    } else {
      this.lightningMesh.visible = false;
      this.isActive = false;
    }
  }

  triggerStrike(position = new THREE.Vector2(0.5, 0.5)) {
    this.isActive = true;
    this.lastStrikeTime = performance.now() * 0.001;
    this.material.uniforms.strikePosition.value.copy(position);
    this.material.uniforms.intensity.value = 1.0;
    this.lightningMesh.visible = true;
  }

  dispose() {
    if (this.lightningMesh) {
      this.lightningMesh.geometry.dispose();
      this.material.dispose();
      this.scene.remove(this.lightningMesh);
    }
  }
}
