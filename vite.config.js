import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    server: {
        port: 3000,
        open: true,
        host: true
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        sourcemap: true,
        copyPublicDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html')
            },
            output: {
                manualChunks: {
                    'three': ['three']
                },
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info[info.length - 1];
                    if (/\.(png|jpe?g|gif|tiff?|webp|svg|exr)$/.test(assetInfo.name)) {
                        return `assets/[name][extname]`;
                    }
                    return `assets/[name]-[hash][extname]`;
                }
            }
        },
        chunkSizeWarningLimit: 1600
    },
    publicDir: 'public',
    base: '/',
    assetsInclude: ['**/*.jpg', '**/*.png', '**/*.tif', '**/*.svg', '**/*.exr'],
    optimizeDeps: {
        include: ['three'],
        exclude: ['three/examples/jsm/controls/OrbitControls']
    }
}); 