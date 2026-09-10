import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import {
  addItem,
  createCategory,
  createInitialState,
  moveItem,
  removeCategory,
  removeItem,
  renameCategory,
  type ContainerRef,
  type Item,
  type MoveItemCommand,
  type TierListState,
} from '../../domain/tierList'
import {
  buildSubmission,
  validateForSubmission,
} from '../../infrastructure/buildSubmission'
import {
  saveTierList,
  type SubmissionSummary,
} from '../../infrastructure/tierListApi'

type Action =
  | { type: 'add-item'; item: Item }
  | { type: 'remove-item'; itemId: string }
  | { type: 'create-category'; id: string; name: string }
  | { type: 'rename-category'; id: string; name: string }
  | { type: 'remove-category'; id: string }
  | { type: 'move-item'; command: MoveItemCommand }

export type SaveState =
  | { kind: 'idle' }
  | { kind: 'saving' }
  | { kind: 'success'; summary: SubmissionSummary }
  | { kind: 'error'; message: string }

export type ControllerDependencies = {
  createId: () => string
  createPreviewUrl: (file: File) => string
  revokePreviewUrl: (url: string) => void
  save: typeof saveTierList
}

const defaultDependencies: ControllerDependencies = {
  createId: () => crypto.randomUUID(),
  createPreviewUrl: (file) => URL.createObjectURL(file),
  revokePreviewUrl: (url) => URL.revokeObjectURL(url),
  save: saveTierList,
}

export function tierListReducer(
  state: TierListState,
  action: Action,
): TierListState {
  switch (action.type) {
    case 'add-item':
      return addItem(state, action.item)
    case 'remove-item':
      return removeItem(state, action.itemId)
    case 'create-category':
      return createCategory(state, { id: action.id, name: action.name })
    case 'rename-category':
      return renameCategory(state, action.id, action.name)
    case 'remove-category':
      return removeCategory(state, action.id)
    case 'move-item':
      return moveItem(state, action.command)
  }
}

export function useTierListController(
  dependencyOverrides: Partial<ControllerDependencies> = {},
) {
  const dependencies = { ...defaultDependencies, ...dependencyOverrides }
  const [state, dispatch] = useReducer(tierListReducer, undefined, createInitialState)
  const [fileError, setFileError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>({ kind: 'idle' })
  const previews = useRef(new Map<string, string>())
  const abortController = useRef<AbortController | null>(null)
  const revokePreviewUrl = dependencies.revokePreviewUrl

  useEffect(
    () => () => {
      abortController.current?.abort()
      for (const url of previews.current.values()) revokePreviewUrl(url)
      previews.current.clear()
    },
    [revokePreviewUrl],
  )

  const markChanged = useCallback(() => setSaveState({ kind: 'idle' }), [])

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    const validFiles = files.filter((file) => file.type.startsWith('image/'))
    const rejectedFiles = files.filter((file) => !file.type.startsWith('image/'))

    for (const file of validFiles) {
      const id = dependencies.createId()
      previews.current.set(id, dependencies.createPreviewUrl(file))
      dispatch({ type: 'add-item', item: { id, file } })
    }
    setFileError(
      rejectedFiles.length > 0
        ? `${rejectedFiles.length} file${rejectedFiles.length === 1 ? '' : 's'} skipped because only images are accepted.`
        : null,
    )
    if (validFiles.length > 0) markChanged()
  }

  const deleteItem = (itemId: string) => {
    const preview = previews.current.get(itemId)
    if (preview) dependencies.revokePreviewUrl(preview)
    previews.current.delete(itemId)
    dispatch({ type: 'remove-item', itemId })
    markChanged()
  }

  const addCategory = (name: string): string | null => {
    if (!name.trim()) return 'Category name is required.'
    dispatch({ type: 'create-category', id: dependencies.createId(), name })
    markChanged()
    return null
  }

  const editCategory = (id: string, name: string): string | null => {
    if (!name.trim()) return 'Category name is required.'
    dispatch({ type: 'rename-category', id, name })
    markChanged()
    return null
  }

  const deleteCategory = (id: string) => {
    dispatch({ type: 'remove-category', id })
    markChanged()
  }

  const move = (command: MoveItemCommand) => {
    if (saveState.kind === 'saving') return
    dispatch({ type: 'move-item', command })
    markChanged()
  }

  const moveToEnd = (itemId: string, destination: ContainerRef) => {
    const destinationLength =
      destination.type === 'item-list'
        ? state.itemList.length
        : (state.categories.find(({ id }) => id === destination.categoryId)
            ?.itemIds.length ?? 0)
    move({ itemId, destination, destinationIndex: destinationLength })
  }

  const save = async () => {
    if (saveState.kind === 'saving') return
    const validationError = validateForSubmission(state)
    if (validationError) {
      setSaveState({ kind: 'error', message: validationError })
      return
    }

    const controller = new AbortController()
    abortController.current = controller
    setSaveState({ kind: 'saving' })
    try {
      const { formData } = buildSubmission(state)
      const summary = await dependencies.save(formData, {
        signal: controller.signal,
      })
      setSaveState({ kind: 'success', summary })
    } catch (error) {
      if (!controller.signal.aborted) {
        setSaveState({
          kind: 'error',
          message: error instanceof Error ? error.message : 'Unable to save.',
        })
      }
    } finally {
      if (abortController.current === controller) abortController.current = null
    }
  }

  return {
    state,
    fileError,
    saveState,
    isSaving: saveState.kind === 'saving',
    saveDisabledReason: validateForSubmission(state),
    getPreviewUrl: (itemId: string) => previews.current.get(itemId),
    addFiles,
    deleteItem,
    addCategory,
    editCategory,
    deleteCategory,
    move,
    moveToEnd,
    save,
  }
}

export type TierListController = ReturnType<typeof useTierListController>
