import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import history from 'connect-history-api-fallback'

export default defineConfig({
  appType: 'spa',
  plugins: [
    react(),
    {
      name: 'spa-fallback',
      configureServer(server) {
        server.middlewares.use(
          history({
            disableDotRule: true,
            htmlAcceptHeaders: ['text/html', 'application/xhtml+xml'],
          }),
        )
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
    open: true,
  },
})
