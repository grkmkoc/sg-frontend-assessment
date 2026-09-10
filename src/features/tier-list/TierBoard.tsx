import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEffect, useState, type KeyboardEvent } from 'react'
import {
  ITEM_LIST,
  type Category,
  type ContainerRef,
  type Item,
} from '../../domain/tierList'
import type { useTierListController } from './useTierListController'

type Controller = ReturnType<typeof useTierListController>

type ItemDragData = {
  type: 'item'
  itemId: string
  container: ContainerRef
}

type ContainerDragData = {
  type: 'container'
  container: ContainerRef
}

export function TierBoard({ controller }: { controller: Controller }) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const data = active.data.current as ItemDragData | undefined
    if (data?.type === 'item') setActiveItemId(data.itemId)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveItemId(null)
    if (!over || active.id === over.id || controller.isSaving) return

    const activeData = active.data.current as ItemDragData | undefined
    const overData = over.data.current as
      | ItemDragData
      | ContainerDragData
      | undefined
    if (activeData?.type !== 'item' || !overData) return

    const destination = overData.container
    const destinationIds = getItemIds(controller, destination)
    const destinationIndex =
      overData.type === 'item'
        ? destinationIds.indexOf(overData.itemId)
        : destinationIds.length

    controller.move({
      itemId: activeData.itemId,
      destination,
      destinationIndex,
    })
  }

  const activeItem = activeItemId ? controller.state.items[activeItemId] : null

  return (
    <section className="board" aria-labelledby="board-title">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Your board</p>
          <h2 id="board-title">Arrange the list</h2>
        </div>
        <p>Drag items, use the keyboard drag handle, or use item controls.</p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragCancel={() => setActiveItemId(null)}
        onDragEnd={handleDragEnd}
      >
        <ItemContainer
          title="Item List"
          description="New images always arrive here. Move all of them into categories before saving."
          container={ITEM_LIST}
          itemIds={controller.state.itemList}
          controller={controller}
        />

        {controller.state.categories.length === 0 ? (
          <div className="board-empty">
            <h3>No categories yet</h3>
            <p>Create a category above to begin ranking your images.</p>
          </div>
        ) : (
          controller.state.categories.map((category) => (
            <ItemContainer
              key={category.id}
              title={category.name}
              container={{ type: 'category', categoryId: category.id }}
              itemIds={category.itemIds}
              category={category}
              controller={controller}
            />
          ))
        )}

        <DragOverlay>
          {activeItem ? <ItemPreview item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>
    </section>
  )
}

function ItemContainer({
  title,
  description,
  container,
  itemIds,
  category,
  controller,
}: {
  title: string
  description?: string
  container: ContainerRef
  itemIds: string[]
  category?: Category
  controller: Controller
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: containerDndId(container),
    data: { type: 'container', container } satisfies ContainerDragData,
    disabled: controller.isSaving,
  })

  return (
    <article
      className={`item-container ${isOver ? 'is-over' : ''}`}
      aria-label={title}
    >
      <div className="container-heading">
        {category ? (
          <CategoryName
            category={category}
            disabled={controller.isSaving}
            onRename={controller.editCategory}
          />
        ) : (
          <div>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
          </div>
        )}
        <div className="container-meta">
          <span>
            {itemIds.length} item{itemIds.length === 1 ? '' : 's'}
          </span>
          {category && (
            <button
              className="text-button danger"
              type="button"
              disabled={controller.isSaving}
              onClick={() => controller.deleteCategory(category.id)}
              aria-label={`Delete category ${category.name}; its items will return to Item List`}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      <SortableContext
        items={itemIds.map(itemDndId)}
        strategy={horizontalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className="items"
          aria-label={`${title} items`}
        >
          {itemIds.length === 0 ? (
            <p className="container-empty">Drop images here</p>
          ) : (
            itemIds.map((itemId, index) => (
              <SortableItem
                key={itemId}
                item={controller.state.items[itemId]}
                previewUrl={controller.getPreviewUrl(itemId)}
                container={container}
                index={index}
                itemCount={itemIds.length}
                controller={controller}
              />
            ))
          )}
        </div>
      </SortableContext>
    </article>
  )
}

function SortableItem({
  item,
  previewUrl,
  container,
  index,
  itemCount,
  controller,
}: {
  item: Item
  previewUrl?: string
  container: ContainerRef
  index: number
  itemCount: number
  controller: Controller
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: itemDndId(item.id),
    data: { type: 'item', itemId: item.id, container } satisfies ItemDragData,
    disabled: controller.isSaving,
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`item-card ${isDragging ? 'is-dragging' : ''}`}
    >
      <div className="thumbnail-frame">
        {previewUrl ? <img src={previewUrl} alt="" /> : null}
      </div>
      <p className="filename" title={item.file.name}>
        {item.file.name}
      </p>
      <div className="item-actions">
        <button
          className="drag-handle"
          type="button"
          disabled={controller.isSaving}
          aria-label={`Drag ${item.file.name}`}
          {...attributes}
          {...listeners}
        >
          Drag
        </button>
        <button
          type="button"
          disabled={controller.isSaving || index === 0}
          onClick={() =>
            controller.move({
              itemId: item.id,
              destination: container,
              destinationIndex: index - 1,
            })
          }
          aria-label={`Move ${item.file.name} earlier`}
        >
          ↑
        </button>
        <button
          type="button"
          disabled={controller.isSaving || index === itemCount - 1}
          onClick={() =>
            controller.move({
              itemId: item.id,
              destination: container,
              destinationIndex: index + 1,
            })
          }
          aria-label={`Move ${item.file.name} later`}
        >
          ↓
        </button>
      </div>
      <label className="move-label">
        <span>Move to</span>
        <select
          value={containerKey(container)}
          disabled={controller.isSaving}
          aria-label={`Move ${item.file.name} to another container`}
          onChange={(event) =>
            controller.moveToEnd(item.id, parseContainerKey(event.target.value))
          }
        >
          <option value="item-list">Item List</option>
          {controller.state.categories.map((category) => (
            <option key={category.id} value={`category:${category.id}`}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <button
        className="remove-item"
        type="button"
        disabled={controller.isSaving}
        onClick={() => controller.deleteItem(item.id)}
      >
        Remove image
      </button>
    </div>
  )
}

function CategoryName({
  category,
  disabled,
  onRename,
}: {
  category: Category
  disabled: boolean
  onRename: (id: string, name: string) => string | null
}) {
  const [name, setName] = useState(category.name)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setName(category.name), [category.name])

  const commit = () => {
    if (name === category.name) return
    const validationError = onRename(category.id, name)
    setError(validationError)
    if (validationError) setName(category.name)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
    if (event.key === 'Escape') {
      setName(category.name)
      setError(null)
      event.currentTarget.blur()
    }
  }

  return (
    <div className="category-name-field">
      <label htmlFor={`category-${category.id}`}>Category name</label>
      <input
        id={`category-${category.id}`}
        value={name}
        disabled={disabled}
        onChange={(event) => {
          setName(event.target.value)
          setError(null)
        }}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

function ItemPreview({ item }: { item: Item }) {
  return <div className="drag-preview">Moving {item.file.name}</div>
}

function getItemIds(controller: Controller, container: ContainerRef): string[] {
  if (container.type === 'item-list') return controller.state.itemList
  return (
    controller.state.categories.find(({ id }) => id === container.categoryId)
      ?.itemIds ?? []
  )
}

function itemDndId(itemId: string) {
  return `item:${itemId}`
}

function containerDndId(container: ContainerRef) {
  return `container:${containerKey(container)}`
}

function containerKey(container: ContainerRef): string {
  return container.type === 'item-list'
    ? 'item-list'
    : `category:${container.categoryId}`
}

function parseContainerKey(value: string): ContainerRef {
  if (value === 'item-list') return ITEM_LIST
  return { type: 'category', categoryId: value.slice('category:'.length) }
}
