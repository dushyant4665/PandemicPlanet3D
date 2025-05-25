import * as THREE from 'three';

export class Atmosphere {
  constructor(scene, earthRadius) {
    this.scene = scene;
    this.earthRadius = earthRadius;
    this.atmosphereRadius = earthRadius * 1.025;
    this.glowRadius = earthRadius * 1.1;

    this.createAtmosphere();
    this.createGlow();
  }

  createAtmosphere() {
    // Create atmosphere geometry
    const geometry = new THREE.SphereGeometry(this.atmosphereRadius, 64, 64);

    // Custom shader for realistic atmospheric scattering
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(0x93cfef) },
        viewVector: { value: new THREE.Vector3() },
      },
      vertexShader: `
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
      fragmentShader: `
                uniform vec3 glowColor;
                uniform float time;
                uniform vec3 viewVector;
                varying vec3 vNormal;
                varying vec3 vViewPosition;
                
                void main() {
                    // Fresnel effect for edge glow
                    float fresnel = pow(1.0 - dot(normalize(vNormal), normalize(vViewPosition)), 3.0);
                    
                    // Atmospheric scattering
                    float scatter = pow(max(0.0, dot(normalize(vNormal), normalize(vViewPosition))), 8.0);
                    
                    // Subtle pulsing effect
                    float pulse = sin(time * 0.5) * 0.1 + 0.9;
                    
                    // Combine effects
                    vec3 finalColor = glowColor * (fresnel * 0.5 + scatter * 0.3) * pulse;
                    float alpha = (fresnel * 0.5 + scatter * 0.3) * pulse;
                    
                    gl_FragColor = vec4(finalColor, alpha * 0.5);
                }
            `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.atmosphere = new THREE.Mesh(geometry, material);
    this.scene.add(this.atmosphere);
  }

  createGlow() {
    // Create outer glow effect
    const geometry = new THREE.SphereGeometry(this.glowRadius, 32, 32);

    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        glowColor: { value: new THREE.Color(0x93cfef) },
      },
      vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
      fragmentShader: `
                uniform vec3 glowColor;
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    // Distance-based glow
                    float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                    
                    // Subtle animation
                    float pulse = sin(time * 0.3) * 0.1 + 0.9;
                    
                    // Combine effects
                    vec3 finalColor = glowColor * intensity * pulse;
                    float alpha = intensity * pulse * 0.15;
                    
                    gl_FragColor = vec4(finalColor, alpha);
                }
            `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    this.glow = new THREE.Mesh(geometry, material);
    this.scene.add(this.glow);
  }

  update(time, camera) {
    if (this.atmosphere && this.atmosphere.material.uniforms) {
      this.atmosphere.material.uniforms.time.value = time;
      this.atmosphere.material.uniforms.viewVector.value = camera.position;
    }

    if (this.glow && this.glow.material.uniforms) {
      this.glow.material.uniforms.time.value = time;
    }
  }

  dispose() {
    if (this.atmosphere) {
      this.atmosphere.geometry.dispose();
      this.atmosphere.material.dispose();
      this.scene.remove(this.atmosphere);
    }

    if (this.glow) {
      this.glow.geometry.dispose();
      this.glow.material.dispose();
      this.scene.remove(this.glow);
    }
  }
}
