import * as THREE from 'three';

export const CloudShader = {
    uniforms: {
        'time': { value: 0.0 },
        'cloudTexture': { value: null },
        'cloudNoiseTexture': { value: null },
        'cloudColor': { value: new THREE.Color(0xffffff) },
        'cloudOpacity': { value: 0.8 },
        'cloudSpeed': { value: 0.1 },
        'cloudScale': { value: 1.0 },
        'cloudDensity': { value: 0.5 },
        'cloudCoverage': { value: 0.5 },
        'sunPosition': { value: new THREE.Vector3(0, 1, 0) },
        'sunColor': { value: new THREE.Color(0xffffcc) },
        'sunIntensity': { value: 1.0 }
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

        void main() {
            vUv = uv;
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            
            gl_Position = projectionMatrix * mvPosition;
        }
    `,

    fragmentShader: /* glsl */`
        uniform float time;
        uniform sampler2D cloudTexture;
        uniform sampler2D cloudNoiseTexture;
        uniform vec3 cloudColor;
        uniform float cloudOpacity;
        uniform float cloudSpeed;
        uniform float cloudScale;
        uniform float cloudDensity;
        uniform float cloudCoverage;
        uniform vec3 sunPosition;
        uniform vec3 sunColor;
        uniform float sunIntensity;

        varying vec2 vUv;
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec3 vViewPosition;

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

        // FBM (Fractal Brownian Motion) for more natural cloud shapes
        float fbm(vec2 st) {
            float value = 0.0;
            float amplitude = 0.5;
            float frequency = 0.0;
            
            for (int i = 0; i < 6; i++) {
                value += amplitude * noise(st);
                st *= 2.0;
                amplitude *= 0.5;
            }
            
            return value;
        }

        void main() {
            // Calculate cloud movement
            vec2 uv = vUv * cloudScale;
            vec2 movement = vec2(time * cloudSpeed, time * cloudSpeed * 0.5);
            
            // Sample cloud textures with movement
            vec4 cloudTex = texture2D(cloudTexture, uv + movement);
            vec4 noiseTex = texture2D(cloudNoiseTexture, uv * 2.0 + movement * 0.5);
            
            // Combine textures with FBM noise
            float fbmNoise = fbm(uv * 4.0 + movement * 0.2);
            float cloudPattern = mix(cloudTex.r, noiseTex.r, 0.5) * fbmNoise;
            
            // Apply cloud coverage and density
            float cloudMask = smoothstep(1.0 - cloudCoverage, 1.0, cloudPattern);
            float cloudDensityMask = smoothstep(1.0 - cloudDensity, 1.0, cloudPattern);
            
            // Calculate lighting
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            vec3 sunDir = normalize(sunPosition);
            
            // Basic lighting
            float diffuse = max(dot(normal, sunDir), 0.0);
            float rimLight = 1.0 - max(dot(viewDir, normal), 0.0);
            rimLight = pow(rimLight, 3.0);
            
            // Combine lighting with cloud color
            vec3 finalColor = cloudColor * (diffuse * sunIntensity + rimLight * 0.5);
            finalColor = mix(finalColor, sunColor, rimLight * 0.3);
            
            // Apply cloud mask and opacity
            float alpha = cloudMask * cloudDensityMask * cloudOpacity;
            
            // Output final color
            gl_FragColor = vec4(finalColor, alpha);
        }
    `
}; 