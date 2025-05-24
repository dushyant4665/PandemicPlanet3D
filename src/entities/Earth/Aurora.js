import * as THREE from 'three';

export class Aurora {
    constructor(scene, earthRadius) {
        this.scene = scene;
        this.earthRadius = earthRadius;
        this.auroraRadius = earthRadius * 1.02;
        
        this.createAurora();
    }

    createAurora() {
        // Create aurora geometry
        const geometry = new THREE.SphereGeometry(this.auroraRadius, 128, 64);
        
        // Create custom shader material for aurora
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                auroraColor: { value: new THREE.Color(0x00ff88) },
                auroraIntensity: { value: 1.0 },
                viewVector: { value: new THREE.Vector3() }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float time;
                uniform vec3 auroraColor;
                uniform float auroraIntensity;
                uniform vec3 viewVector;
                varying vec3 vNormal;
                varying vec3 vPosition;
                varying vec2 vUv;
                
                // Noise functions
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }
                
                float noise(vec2 st) {
                    vec2 i = floor(st);
                    vec2 f = fract(st);
                    
                    float a = random(i);
                    float b = random(i + vec2(1.0, 0.0));
                    float c = random(i + vec2(0.0, 1.0));
                    float d = random(i + vec2(1.0, 1.0));
                    
                    vec2 u = f * f * (3.0 - 2.0 * f);
                    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
                }
                
                void main() {
                    // Calculate aurora position (northern hemisphere)
                    float latitude = asin(vNormal.y);
                    float auroraMask = smoothstep(0.2, 0.4, abs(latitude - 0.3));
                    
                    // Create aurora movement
                    vec2 uv = vUv * 4.0;
                    uv.x += time * 0.1;
                    uv.y += sin(uv.x * 2.0 + time) * 0.2;
                    
                    // Generate aurora pattern
                    float pattern = noise(uv);
                    pattern *= noise(uv * 2.0 + time * 0.2);
                    pattern *= noise(uv * 4.0 - time * 0.1);
                    
                    // Add vertical streaks
                    float streaks = smoothstep(0.4, 0.6, noise(vec2(uv.x * 0.5, uv.y * 8.0)));
                    pattern *= streaks;
                    
                    // Calculate view-dependent intensity
                    float viewDot = dot(normalize(vNormal), normalize(viewVector));
                    float viewIntensity = pow(1.0 - abs(viewDot), 2.0);
                    
                    // Combine effects
                    float intensity = pattern * auroraMask * viewIntensity * auroraIntensity;
                    
                    // Add color variation
                    vec3 color = auroraColor;
                    color += vec3(0.0, 0.2, 0.1) * sin(time * 0.5 + vUv.x * 10.0);
                    
                    // Final color
                    gl_FragColor = vec4(color, intensity * 0.8);
                }
            `,
            transparent: true,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.auroraMesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.auroraMesh);
    }

    update(time, camera) {
        if (this.auroraMesh && this.auroraMesh.material.uniforms) {
            this.auroraMesh.material.uniforms.time.value = time;
            this.auroraMesh.material.uniforms.viewVector.value = camera.position;
            
            // Subtle intensity variation
            const intensity = 0.8 + Math.sin(time * 0.2) * 0.2;
            this.auroraMesh.material.uniforms.auroraIntensity.value = intensity;
        }
    }

    dispose() {
        if (this.auroraMesh) {
            this.auroraMesh.geometry.dispose();
            this.auroraMesh.material.dispose();
            this.scene.remove(this.auroraMesh);
        }
    }
} 