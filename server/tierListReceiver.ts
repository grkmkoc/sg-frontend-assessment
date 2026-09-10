import Busboy from 'busboy'
import type { IncomingMessage, ServerResponse } from 'node:http'

type ReceivedFile = {
  fieldName: string
  filename: string
  mimeType: string
  bytes: number
}

type Payload = {
  categories: Array<{ name: string; items: string[] }>
}

export function receiveTierList(
  request: IncomingMessage,
  response: ServerResponse,
): void {
  if (request.method !== 'POST') {
    sendJson(response, 405, { error: 'Method not allowed' })
    return
  }

  let parser: ReturnType<typeof Busboy>
  try {
    parser = Busboy({ headers: request.headers })
  } catch {
    sendJson(response, 400, { error: 'Expected multipart/form-data' })
    return
  }

  const payloadFields: string[] = []
  const files = new Map<string, ReceivedFile>()
  let parsingError: string | null = null

  parser.on('field', (fieldName, value) => {
    if (fieldName === 'payload') payloadFields.push(value)
  })

  parser.on('file', (fieldName, stream, info) => {
    if (files.has(fieldName)) {
      parsingError = `Duplicate file field: ${fieldName}`
      stream.resume()
      return
    }

    const receivedFile: ReceivedFile = {
      fieldName,
      filename: info.filename,
      mimeType: info.mimeType,
      bytes: 0,
    }
    files.set(fieldName, receivedFile)
    stream.on('data', (chunk: Buffer) => {
      receivedFile.bytes += chunk.length
    })
    stream.on('error', () => {
      parsingError = `Could not read file field: ${fieldName}`
    })
  })

  parser.on('error', () => {
    if (!response.headersSent) {
      sendJson(response, 400, { error: 'Malformed multipart request' })
    }
  })

  parser.on('close', () => {
    if (response.headersSent) return
    if (parsingError) {
      sendJson(response, 400, { error: parsingError })
      return
    }
    if (payloadFields.length !== 1) {
      sendJson(response, 400, {
        error: 'Request must contain exactly one payload field',
      })
      return
    }

    const payload = parsePayload(payloadFields[0])
    if (!payload) {
      sendJson(response, 400, { error: 'Payload has an invalid shape' })
      return
    }

    const references = payload.categories.flatMap(({ items }) => items)
    const uniqueReferences = new Set(references)
    if (uniqueReferences.size !== references.length) {
      sendJson(response, 400, { error: 'Payload contains duplicate file references' })
      return
    }

    const missing = references.filter((reference) => !files.has(reference))
    const unexpected = [...files.keys()].filter(
      (fieldName) => !uniqueReferences.has(fieldName),
    )
    if (missing.length > 0 || unexpected.length > 0) {
      sendJson(response, 400, {
        error: 'Payload references and multipart file fields do not match',
        missing,
        unexpected,
      })
      return
    }

    const summary = {
      categoryCount: payload.categories.length,
      itemCount: references.length,
      files: references.map((reference) => files.get(reference)!),
    }
    console.info('Accepted tier-list submission', summary)
    sendJson(response, 201, summary)
  })

  request.pipe(parser)
}

function parsePayload(rawPayload: string): Payload | null {
  try {
    const value: unknown = JSON.parse(rawPayload)
    if (!isRecord(value) || !Array.isArray(value.categories)) return null

    const categories = value.categories
    if (
      !categories.every(
        (category) =>
          isRecord(category) &&
          typeof category.name === 'string' &&
          Array.isArray(category.items) &&
          category.items.every((item) => typeof item === 'string'),
      )
    ) {
      return null
    }
    return value as Payload
  } catch {
    return null
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: Record<string, unknown>,
): void {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.end(JSON.stringify(body))
}
