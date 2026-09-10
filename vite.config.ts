import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { receiveTierList } from './server/tierListReceiver.ts'

function localTierListApi(): Plugin {
  return {
    name: 'local-tier-list-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/tier-lists', (request, response, next) => {
        if (request.method !== 'POST') {
          next()
          return
        }
        receiveTierList(request, response)
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localTierListApi()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    restoreMocks: true,
  },
})
