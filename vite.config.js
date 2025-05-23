import { defineConfig } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    server: {
        port: 3001,
        open: true,
        cors: true,
        hmr: {
            protocol: 'ws',
            host: 'localhost'
        },
        watch: {
            usePolling: true
        }
    },
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    'three': ['three']
                }
            }
        }
    },
    publicDir: 'public',
    optimizeDeps: {
        include: ['three'],
        exclude: []
    },
    resolve: {
        alias: {
            'three': resolve(__dirname, 'node_modules/three')
        }
    }
}); 