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
                    if (/\.(png|jpe?g|gif|tiff?|webp|svg)$/.test(assetInfo.name)) {
                        return 'assets/[name][extname]';
                    }
                    return 'assets/[name]-[hash][extname]';
                }
            }
        }
    },
    publicDir: 'public',
    base: '',
    assetsInclude: ['**/*.jpg', '**/*.png', '**/*.tif', '**/*.svg', '**/*.exr'],
    optimizeDeps: {
        include: ['three']
    }
}); 
