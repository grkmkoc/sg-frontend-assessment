import { describe, expect, it } from 'vitest'
import {
  addItem,
  assertStateInvariants,
  createCategory,
  createInitialState,
  moveItem,
  removeCategory,
  removeItem,
  renameCategory,
  type Item,
  type TierListState,
} from './tierList'

const image = (id: string, filename = `${id}.png`): Item => ({
  id,
  file: new File(['image'], filename, { type: 'image/png' }),
})

const populatedState = (): TierListState => ({
  items: { one: image('one'), two: image('two'), three: image('three') },
  itemList: ['one', 'two'],
  categories: [
    { id: 'a', name: 'A', itemIds: ['three'] },
    { id: 'b', name: 'B', itemIds: [] },
  ],
})

describe('tier-list domain', () => {
  it('starts empty and adds new items only to the Item List', () => {
    const item = image('one')
    const state = addItem(createInitialState(), item)

    expect(state.items.one).toBe(item)
    expect(state.itemList).toEqual(['one'])
    expect(state.categories).toEqual([])
  })

  it('moves an item from Item List to a category', () => {
    const state = moveItem(populatedState(), {
      itemId: 'one',
      destination: { type: 'category', categoryId: 'a' },
      destinationIndex: 1,
    })

    expect(state.itemList).toEqual(['two'])
    expect(state.categories[0].itemIds).toEqual(['three', 'one'])
  })

  it('moves an item between categories', () => {
    const state = moveItem(populatedState(), {
      itemId: 'three',
      destination: { type: 'category', categoryId: 'b' },
      destinationIndex: 0,
    })

    expect(state.categories[0].itemIds).toEqual([])
    expect(state.categories[1].itemIds).toEqual(['three'])
  })

  it('moves an item from a category back to Item List', () => {
    const state = moveItem(populatedState(), {
      itemId: 'three',
      destination: { type: 'item-list' },
      destinationIndex: 1,
    })

    expect(state.itemList).toEqual(['one', 'three', 'two'])
    expect(state.categories[0].itemIds).toEqual([])
  })

  it('reorders Item List items', () => {
    const state = moveItem(populatedState(), {
      itemId: 'one',
      destination: { type: 'item-list' },
      destinationIndex: 2,
    })

    expect(state.itemList).toEqual(['two', 'one'])
  })

  it('reorders category items', () => {
    const original = populatedState()
    original.itemList = []
    original.categories[0].itemIds = ['one', 'two', 'three']

    const state = moveItem(original, {
      itemId: 'one',
      destination: { type: 'category', categoryId: 'a' },
      destinationIndex: 3,
    })

    expect(state.categories[0].itemIds).toEqual(['two', 'three', 'one'])
  })

  it('returns deleted category items to the end of Item List in order', () => {
    const state = removeCategory(populatedState(), 'a')

    expect(state.itemList).toEqual(['one', 'two', 'three'])
    expect(state.categories.map(({ id }) => id)).toEqual(['b'])
    expect(state.items.three).toBeDefined()
  })

  it('removes an item record and its container reference', () => {
    const state = removeItem(populatedState(), 'three')

    expect(state.items.three).toBeUndefined()
    expect(state.categories[0].itemIds).toEqual([])
  })

  it('creates and trims category names while permitting duplicates', () => {
    const first = createCategory(createInitialState(), {
      id: 'a',
      name: '  A  ',
    })
    const second = createCategory(first, { id: 'b', name: 'A' })
    const renamed = renameCategory(second, 'b', '  A  ')

    expect(renamed.categories.map(({ name }) => name)).toEqual(['A', 'A'])
  })

  it('rejects whitespace-only category names', () => {
    expect(() =>
      createCategory(createInitialState(), { id: 'a', name: '   ' }),
    ).toThrow('Category name is required')
  })

  it('detects duplicate and missing item placement', () => {
    const duplicate = populatedState()
    duplicate.categories[0].itemIds.push('one')
    expect(() => assertStateInvariants(duplicate)).toThrow('exactly one')

    const missing = populatedState()
    missing.itemList = ['one']
    expect(() => assertStateInvariants(missing)).toThrow('exactly one')
  })
})
