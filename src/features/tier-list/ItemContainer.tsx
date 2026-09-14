import { useDroppable } from '@dnd-kit/core'
import {
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable'
import { useState, type DragEvent } from 'react'
import type { Category, ContainerRef } from '../../domain/tierList'
import { CategoryName } from './CategoryName'
import { containerDndId, itemDndId, type ContainerDragData } from './dnd'
import { SortableItem } from './SortableItem'
import type { TierListController } from './useTierListController'

export function ItemContainer({
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
  controller: TierListController
}) {
  const [isFileOver, setIsFileOver] = useState(false)
  const acceptsFiles = container.type === 'item-list' && !controller.isSaving
  const { setNodeRef, isOver } = useDroppable({
    id: containerDndId(container),
    data: { type: 'container', container } satisfies ContainerDragData,
    disabled: controller.isSaving,
  })

  const handleFileDrag = (event: DragEvent<HTMLElement>) => {
    if (!acceptsFiles || !event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsFileOver(true)
  }

  const handleFileDrop = (event: DragEvent<HTMLElement>) => {
    if (!acceptsFiles || !event.dataTransfer.types.includes('Files')) return
    event.preventDefault()
    setIsFileOver(false)
    controller.addFiles(event.dataTransfer.files)
  }

  return (
    <article
      className={`item-container ${container.type === 'item-list' ? 'is-item-list' : ''} ${isOver || isFileOver ? 'is-over' : ''}`}
      aria-label={title}
      onDragEnter={handleFileDrag}
      onDragOver={handleFileDrag}
      onDragLeave={() => setIsFileOver(false)}
      onDrop={handleFileDrop}
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
            <div className="container-title-row">
              <h3>{title}</h3>
              <span className="pool-badge">Unassigned pool</span>
            </div>
            {description && <p>{description}</p>}
          </div>
        )}
        <div className="container-meta">
          <span>
            {itemIds.length} item{itemIds.length === 1 ? '' : 's'}
          </span>
          {container.type === 'item-list' && (
            <label
              className={`file-button ${controller.isSaving ? 'disabled' : ''}`}
            >
              <span>Add images</span>
              <input
                type="file"
                accept="image/*"
                multiple
                disabled={controller.isSaving}
                onChange={(event) => {
                  if (event.target.files) controller.addFiles(event.target.files)
                  event.target.value = ''
                }}
              />
            </label>
          )}
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
        <div ref={setNodeRef} className="items" aria-label={`${title} items`}>
          {itemIds.length === 0 ? (
            <p className="container-empty">
              {container.type === 'item-list'
                ? 'Drop image files here, or use Add images'
                : 'Move or drag items here'}
            </p>
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
