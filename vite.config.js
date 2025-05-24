import { defineConfig } from 'vite';

export default defineConfig({
    server: {
        port: 3000,
        open: true,
        host: true // Expose to network
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'three': ['three'],
                    'vendor': ['three/examples/jsm/controls/OrbitControls.js']
                }
            }
        }
    },
    publicDir: 'public',
    assetsInclude: ['**/*.jpg', '**/*.png', '**/*.tif', '**/*.svg'],
    optimizeDeps: {
        include: ['three']
    }
}); 