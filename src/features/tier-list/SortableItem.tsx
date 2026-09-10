import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ContainerRef, Item } from '../../domain/tierList'
import {
  containerKey,
  itemDndId,
  parseContainerKey,
  type ItemDragData,
} from './dnd'
import type { TierListController } from './useTierListController'

export function SortableItem({
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
  controller: TierListController
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
          className="icon-button"
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
          <ArrowIcon direction="up" />
        </button>
        <button
          className="icon-button"
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
          <ArrowIcon direction="down" />
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

function ArrowIcon({ direction }: { direction: 'up' | 'down' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {direction === 'up' ? (
        <path d="M3 10.5 8 5.5l5 5" />
      ) : (
        <path d="m3 5.5 5 5 5-5" />
      )}
    </svg>
  )
}
