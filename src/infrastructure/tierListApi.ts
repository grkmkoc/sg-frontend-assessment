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
    throw new Error(body || `Save failed with status ${response.status}`)
  }

  return response.json() as Promise<SubmissionSummary>
}
