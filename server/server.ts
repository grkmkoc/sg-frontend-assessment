import express from 'express'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { receiveTierList } from './tierListReceiver.js'

const app = express()
const port = Number(process.env.PORT ?? 8080)
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const staticDirectory = resolve(projectRoot, 'dist')

app.post('/api/tier-lists', (request, response) => {
  receiveTierList(request, response)
})

app.use(express.static(staticDirectory, { index: false }))
app.use((request, response, next) => {
  if (request.method === 'GET') {
    response.sendFile(resolve(staticDirectory, 'index.html'))
    return
  }
  next()
})

app.listen(port, '0.0.0.0', () => {
  console.info(`Tier List Builder is available at http://localhost:${port}`)
})
