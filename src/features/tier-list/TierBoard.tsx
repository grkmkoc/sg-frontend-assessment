import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useState } from 'react'
import { getContainerItemIds, ITEM_LIST, type Item } from '../../domain/tierList'
import { isContainerDragData, isItemDragData } from './dnd'
import { ItemContainer } from './ItemContainer'
import type { TierListController } from './useTierListController'

export function TierBoard({ controller }: { controller: TierListController }) {
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragStart = ({ active }: DragStartEvent) => {
    const data = active.data.current
    if (isItemDragData(data)) setActiveItemId(data.itemId)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveItemId(null)
    if (!over || active.id === over.id || controller.isSaving) return

    const activeData = active.data.current
    const overData = over.data.current
    if (
      !isItemDragData(activeData) ||
      (!isItemDragData(overData) && !isContainerDragData(overData))
    ) {
      return
    }

    const destination = overData.container
    const destinationIds = getContainerItemIds(controller.state, destination)
    const destinationIndex = isItemDragData(overData)
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

function ItemPreview({ item }: { item: Item }) {
  return <div className="drag-preview">Moving {item.file.name}</div>
}
