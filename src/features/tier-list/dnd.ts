import { ITEM_LIST, type ContainerRef } from '../../domain/tierList'

export type ItemDragData = {
  type: 'item'
  itemId: string
  container: ContainerRef
}

export type ContainerDragData = {
  type: 'container'
  container: ContainerRef
}

export function itemDndId(itemId: string): string {
  return `item:${itemId}`
}

export function containerDndId(container: ContainerRef): string {
  return `container:${containerKey(container)}`
}

export function containerKey(container: ContainerRef): string {
  return container.type === 'item-list'
    ? 'item-list'
    : `category:${container.categoryId}`
}

export function parseContainerKey(value: string): ContainerRef {
  if (value === 'item-list') return ITEM_LIST
  return { type: 'category', categoryId: value.slice('category:'.length) }
}

export function isItemDragData(value: unknown): value is ItemDragData {
  return isRecord(value) && value.type === 'item'
}

export function isContainerDragData(value: unknown): value is ContainerDragData {
  return isRecord(value) && value.type === 'container'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
