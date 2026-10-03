import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The browser only ever uses http://localhost:3000: API calls (/api) and the live-notification
// socket (/ws) are passed through to the backend, which listens on its own port behind it.
const BACKEND = process.env.NEXUSHR_BACKEND_URL || 'http://localhost:3080'
const toBackend = {
  '/api': { target: BACKEND },
  '/ws': { target: BACKEND, ws: true },
  '/health': { target: BACKEND }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Fail instead of moving to 3001: Google sign-in and the backend's CLIENT_ORIGIN only allow :3000
    strictPort: true,
    open: true,
    proxy: toBackend,
    // What Google sign-in's popup needs (Google's recommendation); production hosting should send it too
    headers: { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' }
  },
  preview: {
    port: 3000,
    strictPort: true,
    proxy: toBackend,
    headers: { 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups' }
  }
})
