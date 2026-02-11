import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-ui': ['framer-motion', 'lucide-react'],
          'vendor-router': ['react-router-dom'],
          'vendor-capacitor': [
            '@capacitor/core', '@capacitor/app', '@capacitor/browser',
            '@capacitor/haptics', '@capacitor/keyboard',
            '@capacitor/status-bar', '@capacitor/splash-screen',
          ],
          'vendor-firebase': ['firebase/app', 'firebase/auth'],
        }
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  }
})
