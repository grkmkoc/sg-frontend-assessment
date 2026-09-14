import {
  assertStateInvariants,
  type TierListState,
} from '../domain/tierList'

export type SubmissionPayload = {
  categories: Array<{
    name: string
    items: string[]
  }>
}

export type Submission = {
  payload: SubmissionPayload
  formData: FormData
}

export function multipartFieldName(itemId: string): string {
  return `image_${itemId}`
}

export function validateForSubmission(state: TierListState): string | null {
  if (state.categories.length === 0) return 'Add a category before saving.'
  if (Object.keys(state.items).length === 0) {
    return 'Add at least one image before saving.'
  }
  if (state.categories.every(({ itemIds }) => itemIds.length === 0)) {
    return 'Move at least one item into a category before saving.'
  }
  return null
}

export function buildSubmission(state: TierListState): Submission {
  assertStateInvariants(state)
  const validationError = validateForSubmission(state)
  if (validationError) throw new Error(validationError)

  const payload: SubmissionPayload = {
    categories: state.categories.map((category) => ({
      name: category.name,
      items: category.itemIds.map(multipartFieldName),
    })),
  }
  const formData = new FormData()
  formData.append('payload', JSON.stringify(payload))

  for (const category of state.categories) {
    for (const itemId of category.itemIds) {
      const item = state.items[itemId]
      formData.append(multipartFieldName(itemId), item.file, item.file.name)
    }
  }

  return { payload, formData }
}
