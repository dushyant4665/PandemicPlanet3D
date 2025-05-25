import { defineConfig } from 'vite';
import { resolve } from 'path';

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
            input: {
                main: resolve(__dirname, 'index.html')
            },
            output: {
                manualChunks: {
                    'three': ['three'],
                    'vendor': ['three/examples/jsm/controls/OrbitControls.js']
                },
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info[info.length - 1];
                    if (/\.(png|jpe?g|gif|tiff?|webp|svg)$/.test(assetInfo.name)) {
                        return `assets/earth/[name][extname]`;
                    }
                    return `assets/[name]-[hash][extname]`;
                }
            }
        }
    },
    publicDir: 'public',
    base: '/',
    assetsInclude: ['**/*.jpg', '**/*.png', '**/*.tif', '**/*.svg', '**/*.exr'],
    optimizeDeps: {
        include: ['three']
    }
}); 