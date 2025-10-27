import path from 'path'
import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import solidSvg from 'vite-plugin-solid-svg'

const host = process.env.TAURI_DEV_HOST

// https://vitejs.dev/config/
export default defineConfig(async () => ({
  plugins: [solid(), solidSvg()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  resolve: {
    alias: {
      '@': path.resolve('./src'),
      '#': path.resolve('./'),
    },
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: 'ws',
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    minify: false,
    rollupOptions: {
      treeshake: true,
      external: [/^node/g],
    },
  },
}))
