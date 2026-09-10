import { useDroppable } from '@dnd-kit/core'
import {
  horizontalListSortingStrategy,
  SortableContext,
} from '@dnd-kit/sortable'
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
        <div ref={setNodeRef} className="items" aria-label={`${title} items`}>
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
