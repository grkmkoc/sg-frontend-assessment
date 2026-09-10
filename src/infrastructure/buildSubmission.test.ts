import { describe, expect, it } from 'vitest'
import type { TierListState } from '../domain/tierList'
import { buildSubmission } from './buildSubmission'

const file = (contents: string, name: string) =>
  new File([contents], name, { type: 'image/png' })

function completeState(): TierListState {
  return {
    items: {
      'id-one': { id: 'id-one', file: file('first-image', 'duplicate.png') },
      'id-two': { id: 'id-two', file: file('second', 'duplicate.png') },
    },
    itemList: [],
    categories: [
      { id: 'a', name: 'A', itemIds: ['id-two', 'id-one'] },
      { id: 'b', name: 'Empty', itemIds: [] },
    ],
  }
}

describe('buildSubmission', () => {
  it('maps ordered JSON references to the actual multipart files', () => {
    const state = completeState()
    const { payload, formData } = buildSubmission(state)

    expect(payload).toEqual({
      categories: [
        {
          name: 'A',
          items: ['image_id-two', 'image_id-one'],
        },
        { name: 'Empty', items: [] },
      ],
    })
    expect(JSON.parse(String(formData.get('payload')))).toEqual(payload)
    const firstPart = formData.get('image_id-one') as File
    const secondPart = formData.get('image_id-two') as File
    expect(firstPart.name).toBe('duplicate.png')
    expect(secondPart.name).toBe('duplicate.png')
    expect(firstPart.size).toBe(state.items['id-one'].file.size)
    expect(secondPart.size).toBe(state.items['id-two'].file.size)
  })

  it('does not collide when original filenames are identical', () => {
    const { formData } = buildSubmission(completeState())

    expect([...formData.keys()]).toEqual([
      'payload',
      'image_id-two',
      'image_id-one',
    ])
  })

  it('produces stable references when serializing the same state again', () => {
    const state = completeState()

    expect(buildSubmission(state).payload).toEqual(buildSubmission(state).payload)
  })

  it('rejects incomplete boards with unassigned items', () => {
    const state = completeState()
    state.itemList.push('id-one')
    state.categories[0].itemIds = ['id-two']

    expect(() => buildSubmission(state)).toThrow(
      'Move every item into a category before saving',
    )
  })

  it('rejects boards without a category or categorized item', () => {
    expect(() => buildSubmission({ items: {}, itemList: [], categories: [] }))
      .toThrow('Add a category before saving')

    expect(() =>
      buildSubmission({
        items: {},
        itemList: [],
        categories: [{ id: 'a', name: 'A', itemIds: [] }],
      }),
    ).toThrow('Add at least one image before saving')
  })
})
