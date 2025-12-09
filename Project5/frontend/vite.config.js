// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            // 이 한 줄이 생명줄!!!
            '/api': {
                target: 'http://localhost:8585',  // 너의 Spring Boot 포트!!!
                changeOrigin: true,
                secure: false
            }
        }
    }
})