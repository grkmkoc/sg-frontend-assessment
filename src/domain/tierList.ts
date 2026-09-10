export type ItemId = string
export type CategoryId = string

export type Item = {
  id: ItemId
  file: File
}

export type Category = {
  id: CategoryId
  name: string
  itemIds: ItemId[]
}

export type TierListState = {
  items: Record<ItemId, Item>
  categories: Category[]
  itemList: ItemId[]
}

export type ContainerRef =
  | { type: 'item-list' }
  | { type: 'category'; categoryId: CategoryId }

export type MoveItemCommand = {
  itemId: ItemId
  destination: ContainerRef
  /** The final index in the destination after the item has been removed. */
  destinationIndex: number
}

export const ITEM_LIST: ContainerRef = { type: 'item-list' }

export function createInitialState(): TierListState {
  return { items: {}, categories: [], itemList: [] }
}

export function addItem(state: TierListState, item: Item): TierListState {
  if (state.items[item.id]) {
    throw new Error(`Item "${item.id}" already exists`)
  }

  return {
    ...state,
    items: { ...state.items, [item.id]: item },
    itemList: [...state.itemList, item.id],
  }
}

export function removeItem(
  state: TierListState,
  itemId: ItemId,
): TierListState {
  if (!state.items[itemId]) {
    throw new Error(`Unknown item "${itemId}"`)
  }

  const items = { ...state.items }
  delete items[itemId]
  return {
    items,
    itemList: state.itemList.filter((id) => id !== itemId),
    categories: state.categories.map((category) => ({
      ...category,
      itemIds: category.itemIds.filter((id) => id !== itemId),
    })),
  }
}

export function createCategory(
  state: TierListState,
  category: Pick<Category, 'id' | 'name'>,
): TierListState {
  if (state.categories.some(({ id }) => id === category.id)) {
    throw new Error(`Category "${category.id}" already exists`)
  }

  return {
    ...state,
    categories: [
      ...state.categories,
      { ...category, name: normalizeCategoryName(category.name), itemIds: [] },
    ],
  }
}

export function renameCategory(
  state: TierListState,
  categoryId: CategoryId,
  name: string,
): TierListState {
  ensureCategoryExists(state, categoryId)
  const normalizedName = normalizeCategoryName(name)

  return {
    ...state,
    categories: state.categories.map((category) =>
      category.id === categoryId
        ? { ...category, name: normalizedName }
        : category,
    ),
  }
}

export function removeCategory(
  state: TierListState,
  categoryId: CategoryId,
): TierListState {
  const removed = ensureCategoryExists(state, categoryId)

  return {
    ...state,
    categories: state.categories.filter(({ id }) => id !== categoryId),
    itemList: [...state.itemList, ...removed.itemIds],
  }
}

export function moveItem(
  state: TierListState,
  command: MoveItemCommand,
): TierListState {
  if (!state.items[command.itemId]) {
    throw new Error(`Unknown item "${command.itemId}"`)
  }

  const source = findItemContainer(state, command.itemId)
  const sourceIds = getContainerItemIds(state, source)
  const destinationIds = sameContainer(source, command.destination)
    ? sourceIds.filter((id) => id !== command.itemId)
    : getContainerItemIds(state, command.destination)

  const withoutSource = replaceContainerItemIds(
    state,
    source,
    sourceIds.filter((id) => id !== command.itemId),
  )
  const index = Math.max(
    0,
    Math.min(command.destinationIndex, destinationIds.length),
  )
  const nextDestinationIds = [...destinationIds]
  nextDestinationIds.splice(index, 0, command.itemId)

  const nextState = replaceContainerItemIds(
    withoutSource,
    command.destination,
    nextDestinationIds,
  )
  assertStateInvariants(nextState)
  return nextState
}

export function findItemContainer(
  state: TierListState,
  itemId: ItemId,
): ContainerRef {
  if (state.itemList.includes(itemId)) return ITEM_LIST

  const category = state.categories.find(({ itemIds }) =>
    itemIds.includes(itemId),
  )
  if (category) return { type: 'category', categoryId: category.id }

  throw new Error(`Item "${itemId}" does not belong to a container`)
}

export function getContainerItemIds(
  state: TierListState,
  container: ContainerRef,
): ItemId[] {
  if (container.type === 'item-list') return state.itemList
  return ensureCategoryExists(state, container.categoryId).itemIds
}

export function assertStateInvariants(state: TierListState): void {
  const categoryIds = state.categories.map(({ id }) => id)
  if (new Set(categoryIds).size !== categoryIds.length) {
    throw new Error('Category IDs must be unique')
  }

  const containedIds = [
    ...state.itemList,
    ...state.categories.flatMap(({ itemIds }) => itemIds),
  ]
  if (new Set(containedIds).size !== containedIds.length) {
    throw new Error('Every item must belong to exactly one container')
  }

  const itemIds = Object.keys(state.items)
  if (
    itemIds.length !== containedIds.length ||
    itemIds.some((id) => !containedIds.includes(id)) ||
    containedIds.some((id) => !state.items[id])
  ) {
    throw new Error('Every item must belong to exactly one container')
  }
}

function replaceContainerItemIds(
  state: TierListState,
  container: ContainerRef,
  itemIds: ItemId[],
): TierListState {
  if (container.type === 'item-list') return { ...state, itemList: itemIds }

  ensureCategoryExists(state, container.categoryId)
  return {
    ...state,
    categories: state.categories.map((category) =>
      category.id === container.categoryId
        ? { ...category, itemIds }
        : category,
    ),
  }
}

function ensureCategoryExists(
  state: TierListState,
  categoryId: CategoryId,
): Category {
  const category = state.categories.find(({ id }) => id === categoryId)
  if (!category) throw new Error(`Unknown category "${categoryId}"`)
  return category
}

function normalizeCategoryName(name: string): string {
  const normalized = name.trim()
  if (!normalized) throw new Error('Category name is required')
  return normalized
}

function sameContainer(left: ContainerRef, right: ContainerRef): boolean {
  if (left.type !== right.type) return false
  if (left.type === 'item-list' || right.type === 'item-list') return true
  return left.categoryId === right.categoryId
}
