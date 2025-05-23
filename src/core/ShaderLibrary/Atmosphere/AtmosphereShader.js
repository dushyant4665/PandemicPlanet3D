export const AtmosphereShader = {
    uniforms: {
        'cameraPosition': { value: null },
        'sunPosition': { value: null },
        'earthRadius': { value: 1.0 },
        'atmosphereRadius': { value: 1.1 },
        'sunIntensity': { value: 15.0 },
        'scatteringCoefficient': { value: 0.1 },
        'scatteringPower': { value: 4.0 },
        'rayleighScattering': { value: new THREE.Vector3(0.1, 0.2, 0.3) },
        'mieScattering': { value: new THREE.Vector3(0.1, 0.1, 0.1) },
        'rayleighScaleHeight': { value: 0.25 },
        'mieScaleHeight': { value: 0.1 },
        'mieDirection': { value: 0.8 }
    },

    vertexShader: `
        varying vec3 vWorldPosition;
        varying vec3 vViewDirection;
        varying vec3 vSunDirection;
        varying float vSunfade;
        varying vec3 vBetaR;
        varying vec3 vBetaM;
        varying float vSunE;

        uniform vec3 sunPosition;
        uniform float earthRadius;
        uniform float atmosphereRadius;
        uniform vec3 rayleighScattering;
        uniform vec3 mieScattering;
        uniform float rayleighScaleHeight;
        uniform float mieScaleHeight;
        uniform float mieDirection;

        const float PI = 3.141592653589793238462643383279502884197169;

        void main() {
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            vec4 worldPosition = vec4(vWorldPosition, 1.0);
            vec4 mvPosition = modelViewMatrix * worldPosition;
            gl_Position = projectionMatrix * mvPosition;

            // Calculate view direction
            vViewDirection = normalize(cameraPosition - vWorldPosition);

            // Calculate sun direction
            vSunDirection = normalize(sunPosition);
            vSunfade = 1.0 - clamp(1.0 - exp(-(sunPosition.y / 15.0)), 0.0, 1.0);

            // Calculate scattering coefficients
            float sunE = sunIntensity * (PI * 4.0);
            vSunE = sunE;

            // Rayleigh scattering
            vBetaR = rayleighScattering * rayleighScaleHeight;

            // Mie scattering
            vBetaM = mieScattering * mieScaleHeight;

            // Pass through to fragment shader
            vBetaR = vBetaR * (1.0 - vSunfade);
            vBetaM = vBetaM * (1.0 - vSunfade);
        }
    `,

    fragmentShader: `
        varying vec3 vWorldPosition;
        varying vec3 vViewDirection;
        varying vec3 vSunDirection;
        varying float vSunfade;
        varying vec3 vBetaR;
        varying vec3 vBetaM;
        varying float vSunE;

        uniform float earthRadius;
        uniform float atmosphereRadius;
        uniform float mieDirection;

        const float PI = 3.141592653589793238462643383279502884197169;
        const float MAX_STEPS = 8;
        const float MIN_STEPS = 2;

        float rayleighPhase(float cosTheta) {
            return (3.0 / (16.0 * PI)) * (1.0 + cosTheta * cosTheta);
        }

        float miePhase(float cosTheta, float g) {
            float g2 = g * g;
            return (3.0 / (8.0 * PI)) * ((1.0 - g2) * (1.0 + cosTheta * cosTheta)) / 
                   (pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5) * (2.0 + g2));
        }

        vec3 calculateScattering(
            vec3 start,
            vec3 dir,
            float length,
            vec3 sunDir,
            vec3 betaR,
            vec3 betaM,
            float g
        ) {
            float time = 0.0;
            float stepLength = length / float(MAX_STEPS);
            float mu = dot(dir, sunDir);
            float mumu = mu * mu;
            float gg = g * g;
            float phaseR = rayleighPhase(mu);
            float phaseM = miePhase(mu, g);

            vec3 sumR = vec3(0.0);
            vec3 sumM = vec3(0.0);
            float opticalDepthR = 0.0;
            float opticalDepthM = 0.0;

            for (int i = 0; i < MAX_STEPS; i++) {
                vec3 pos = start + dir * time;
                float height = length(pos) - earthRadius;
                float hr = exp(-height / rayleighScaleHeight);
                float hm = exp(-height / mieScaleHeight);

                opticalDepthR += hr * stepLength;
                opticalDepthM += hm * stepLength;

                float sunAngle = dot(normalize(pos), sunDir);
                float sunAmount = smoothstep(-0.1, 0.1, sunAngle);
                float sunLight = sunAmount * vSunE;

                vec3 attn = exp(-(
                    betaR * opticalDepthR +
                    betaM * opticalDepthM
                ));

                sumR += hr * attn * stepLength;
                sumM += hm * attn * stepLength;

                time += stepLength;
            }

            return sunLight * (
                sumR * betaR * phaseR +
                sumM * betaM * phaseM
            );
        }

        void main() {
            vec3 pos = vWorldPosition;
            vec3 dir = vViewDirection;
            float length = atmosphereRadius - earthRadius;

            vec3 betaR = vBetaR;
            vec3 betaM = vBetaM;

            vec3 color = calculateScattering(
                pos,
                dir,
                length,
                vSunDirection,
                betaR,
                betaM,
                mieDirection
            );

            // Apply exposure
            color = 1.0 - exp(-1.0 * color);

            // Apply sun fade
            color = mix(color, color * 0.5, vSunfade);

            gl_FragColor = vec4(color, 1.0);
        }
    `
}; 