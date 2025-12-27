import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    // Set base to the repository name for correct asset loading on GitHub Pages
    base: '/Spidey-in-Foreignlands/',
    plugins: [react()],
    define: {
      // Safely replace process.env.API_KEY with the actual value during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    },
    server: {
      port: 5173,
      strictPort: false,
    }
  }
})