export type SubmissionSummary = {
  categoryCount: number
  itemCount: number
  files: Array<{
    fieldName: string
    filename: string
    mimeType: string
    bytes: number
  }>
}

export async function saveTierList(
  formData: FormData,
  options: { endpoint?: string; signal?: AbortSignal } = {},
): Promise<SubmissionSummary> {
  const response = await fetch(
    options.endpoint ??
      import.meta.env.VITE_TIER_LIST_API_URL ??
      '/api/tier-lists',
    {
      method: 'POST',
      body: formData,
      signal: options.signal,
    },
  )

  if (!response.ok) {
    const body = await response.text()
    let message = body
    try {
      const parsed: unknown = JSON.parse(body)
      if (
        typeof parsed === 'object' &&
        parsed !== null &&
        'error' in parsed &&
        typeof parsed.error === 'string'
      ) {
        message = parsed.error
      }
    } catch {
      // A plain-text error body is already suitable for display.
    }
    throw new Error(message || `Save failed with status ${response.status}`)
  }

  return response.json() as Promise<SubmissionSummary>
}
