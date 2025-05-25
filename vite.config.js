import { defineConfig } from 'vite';
import { resolve } from 'path';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      modernPolyfills: true,
    }),
  ],
  server: {
    port: 3000,
    open: true,
    host: true,
    strictPort: true,
    hmr: {
      overlay: true,
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    copyPublicDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['three/examples/jsm/controls/OrbitControls'],
        },
        assetFileNames: assetInfo => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/\.(png|jpe?g|gif|tiff?|webp|svg|exr)$/.test(assetInfo.name)) {
            return `assets/[name][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    chunkSizeWarningLimit: 1600,
    target: 'esnext',
  },
  publicDir: 'public',
  base: '/',
  assetsInclude: ['**/*.jpg', '**/*.png', '**/*.tif', '**/*.svg', '**/*.exr'],
  optimizeDeps: {
    include: ['three'],
    exclude: ['three/examples/jsm/controls/OrbitControls'],
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
   base: '/',
});
